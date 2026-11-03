#!/usr/bin/env node
// Prueba la migración + seed + políticas RLS en un Postgres embebido (PGlite),
// simulando lo mínimo de Supabase (schema auth, roles anon/authenticated/service_role).
// Uso: npm run test:db
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import { PGlite } from '@electric-sql/pglite';
import { pgcrypto } from '@electric-sql/pglite/contrib/pgcrypto';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const db = new PGlite({ extensions: { pgcrypto } });

await db.exec(`
  create schema if not exists extensions;
  create extension if not exists pgcrypto with schema extensions;
  create schema auth;
  create table auth.users (id uuid primary key default gen_random_uuid(), email text);
  create function auth.uid() returns uuid language sql stable as
    $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
  create role anon nologin;
  create role authenticated nologin;
  create role service_role nologin bypassrls;
  grant usage on schema public, auth, extensions to anon, authenticated, service_role;
  grant execute on function auth.uid() to anon, authenticated, service_role;
  -- Igual que Supabase: privilegios amplios por defecto (la migración debe restringirlos)
  alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
  alter default privileges in schema public grant all on functions to anon, authenticated, service_role;
  alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
  create publication supabase_realtime;
`);

const migrationsDir = path.join(root, 'supabase', 'migrations');
for (const file of readdirSync(migrationsDir).sort()) {
  await db.exec(readFileSync(path.join(migrationsDir, file), 'utf8'));
}
await db.exec(readFileSync(path.join(root, 'supabase', 'seed.sql'), 'utf8'));

// ---------------------------------------------------------------- helpers
let passed = 0;
async function test(name, fn) {
  try {
    await fn();
    passed++;
    console.log(`  ✓ ${name}`);
  } catch (err) {
    console.error(`  ✗ ${name}\n    ${err.message}`);
    process.exitCode = 1;
  }
}

async function as(role, sub, fn) {
  await db.query(`select set_config('request.jwt.claim.sub', $1, false)`, [sub || '']);
  await db.exec(`set role ${role}`);
  try {
    return await fn();
  } finally {
    await db.exec('reset role');
    await db.query(`select set_config('request.jwt.claim.sub', '', false)`);
  }
}
const anon = (fn) => as('anon', null, fn);
const rows = async (sql, params) => (await db.query(sql, params)).rows;
const one = async (sql, params) => (await rows(sql, params))[0];
async function rejects(promise, pattern) {
  try {
    await promise;
  } catch (err) {
    if (pattern && !pattern.test(err.message)) throw new Error(`Error inesperado: ${err.message}`);
    return;
  }
  throw new Error('Se esperaba un error y no ocurrió');
}

const SLUG = 'la-trattoria';
const TENANT = 'a0000000-0000-4000-8000-000000000001';
const BURGER = '00000000-0000-4000-8000-000000000001';
const SANGRIA = '00000000-0000-4000-8000-000000000007';
const OWNER = 'b0000000-0000-4000-8000-000000000001';
const COCINA = 'b0000000-0000-4000-8000-000000000002';
const CAJA = 'b0000000-0000-4000-8000-000000000003';

// Vincula usuarios de Auth simulados al personal demo
const users = {};
for (const [key, staffId] of Object.entries({ owner: OWNER, cocina: COCINA, caja: CAJA })) {
  const { id } = await one(`insert into auth.users (email) values ($1) returning id`, [`${key}@test`]);
  await db.query(`update staff_members set user_id = $1 where id = $2`, [id, staffId]);
  users[key] = id;
}
const asStaff = (key, fn) => as('authenticated', users[key], fn);
const table1 = await one(`select token from restaurant_tables where tenant_id = $1 and label = '1'`, [TENANT]);
const burgerItem = (extra = {}) => ({
  productId: BURGER,
  quantity: 2,
  selections: { 'Término de la Carne': 'Término Medio', 'Adicionales Gourmet': 'Queso Brie Extra' },
  ...extra
});
const createOrder = (items, token = table1.token, tip = true) =>
  one(`select create_order($1, $2, $3::jsonb, $4) as r`, [SLUG, token, JSON.stringify(items), tip]);

console.log('\nCarta pública (anon)');
await test('lee los 20 platillos del restaurante', async () => {
  const r = await anon(() => one(`select count(*)::int as n from products where tenant_id = $1`, [TENANT]));
  assert.equal(r.n, 20);
});
await test('no puede listar mesas ni sus tokens', () =>
  anon(() => rejects(rows(`select token from restaurant_tables`), /permission denied/)));
await test('no puede leer personal ni hashes de PIN', () =>
  anon(() => rejects(rows(`select pin_hash from staff_members`), /permission denied/)));
await test('resolve_table valida el token del QR', async () => {
  const ok = await anon(() => rows(`select * from resolve_table($1, $2)`, [SLUG, table1.token]));
  assert.equal(ok[0].label, '1');
  const bad = await anon(() => rows(`select * from resolve_table($1, 'token-falso')`, [SLUG]));
  assert.equal(bad.length, 0);
});

console.log('\nPedidos (anon → create_order)');
let orderId;
await test('calcula precios desde el catálogo e ignora precios enviados', async () => {
  const { r } = await anon(() => createOrder([burgerItem({ price: 1, unitPrice: 1, totalPrice: 1 })]));
  // (34.000 + 5.000 queso extra) × 2 = 78.000; propina 10 % = 7.800
  assert.equal(r.subtotal, 78000);
  assert.equal(r.tip, 7800);
  assert.equal(r.total, 85800);
  orderId = r.orderId;
  const items = await rows(`select * from order_items where order_id = $1`, [orderId]);
  assert.equal(items[0].unit_price, 39000);
  assert.deepEqual(items[0].selected_options, ['Término Medio', 'Queso Brie Extra']);
});
await test('sin propina cuando el comensal la desmarca', async () => {
  const { r } = await anon(() => createOrder([{ productId: SANGRIA, quantity: 1 }], table1.token, false));
  assert.equal(r.tip, 0);
  assert.equal(r.total, r.subtotal);
});
await test('rechaza modificador obligatorio faltante', () =>
  anon(() => rejects(createOrder([{ productId: BURGER, quantity: 1 }]), /Falta elegir/)));
await test('rechaza opciones inexistentes', () =>
  anon(() => rejects(createOrder([burgerItem({ selections: { 'Término de la Carne': 'Crudo' } })]), /no existe/)));
await test('rechaza grupos de opciones inventados', () =>
  anon(() => rejects(createOrder([burgerItem({ selections: { 'Término de la Carne': 'Término Medio', Gratis: 'Sí' } })]), /desconocida/)));
await test('rechaza cantidades fuera de rango', () =>
  anon(() => rejects(createOrder([burgerItem({ quantity: 500 })]), /Cantidad/)));
await test('rechaza token de mesa inválido', () =>
  anon(() => rejects(createOrder([burgerItem()], 'abc'), /mesa inválido/)));
await test('anon no puede leer ni modificar pedidos', async () => {
  await anon(() => rejects(rows(`select * from orders`), /permission denied/));
  await anon(() => rejects(rows(`update orders set status = 'Cancelado'`), /permission denied/));
  await anon(() => rejects(rows(`insert into orders (tenant_id, table_label, subtotal, total) values ($1, '1', 0, 0)`, [TENANT]), /permission denied/));
});

console.log('\nCocina');
await test('ve los pedidos y avanza el flujo de estados', async () => {
  const list = await asStaff('cocina', () => rows(`select id, status from orders where id = $1`, [orderId]));
  assert.equal(list[0].status, 'Pendiente');
  for (const status of ['En Preparación', 'Listo', 'Por Cobrar']) {
    await asStaff('cocina', () => rows(`update orders set status = $1 where id = $2`, [status, orderId]));
  }
  assert.equal((await one(`select status from orders where id = $1`, [orderId])).status, 'Por Cobrar');
});
await test('no puede saltarse estados ni marcar Cobrado a mano', async () => {
  const { r } = await anon(() => createOrder([{ productId: SANGRIA, quantity: 1 }]));
  await asStaff('cocina', () => rejects(rows(`update orders set status = 'Listo' where id = $1`, [r.orderId]), /Transición/));
  await asStaff('owner', () => rejects(rows(`update orders set status = 'Cobrado' where id = $1`, [orderId]), /comprobante/));
});
await test('no puede modificar totales', () =>
  asStaff('cocina', () => rejects(rows(`update orders set total = 1 where id = $1`, [orderId]), /permission denied/)));
await test('no puede facturar', () =>
  asStaff('cocina', () => rejects(rows(`select issue_invoice($1, 'pos')`, [orderId]), /rol/)));

console.log('\nCaja y facturación');
await test('emite factura con el INC desglosado (no sumado) y la propina aparte', async () => {
  const inv = await asStaff('caja', () => one(`select * from issue_invoice($1, 'electronica', null, 'efectivo')`, [orderId]));
  assert.equal(inv.full_number, 'FE-1');
  assert.equal(inv.items_total, 78000);
  assert.equal(inv.tax_base, 72222); // 78.000 / 1,08
  assert.equal(inv.tax, 5778);
  assert.equal(inv.tip, 7800);
  assert.equal(inv.total, 85800);
  assert.equal(inv.dian_status, 'simulado');
  assert.equal(inv.cufe.length, 96);
  assert.equal((await one(`select status from orders where id = $1`, [orderId])).status, 'Cobrado');
});
await test('no permite cobrar dos veces el mismo pedido', () =>
  asStaff('caja', () => rejects(rows(`select issue_invoice($1, 'pos')`, [orderId]), /no está listo/)));
await test('rechaza facturar con la resolución vencida', async () => {
  const { r } = await anon(() => createOrder([{ productId: SANGRIA, quantity: 1 }]));
  await db.query(`update orders set status = 'En Preparación' where id = $1`, [r.orderId]);
  await db.query(`update orders set status = 'Listo' where id = $1`, [r.orderId]);
  await db.query(`update orders set status = 'Por Cobrar' where id = $1`, [r.orderId]);
  await db.query(`update invoice_sequences set valid_until = current_date - 1 where tenant_id = $1 and kind = 'electronica'`, [TENANT]);
  await asStaff('caja', () => rejects(rows(`select issue_invoice($1, 'electronica')`, [r.orderId]), /vencida/));
  const pos = await asStaff('caja', () => one(`select * from issue_invoice($1, 'pos', null, 'tarjeta')`, [r.orderId]));
  assert.equal(pos.full_number, 'POS-1');
  await db.query(`update invoice_sequences set valid_until = current_date + 365 where tenant_id = $1 and kind = 'electronica'`, [TENANT]);
});
await test('cierre Z suma por método de pago y numera por día', async () => {
  const z = await asStaff('caja', () => one(`select * from close_cash_register(85800)`));
  assert.match(z.code, /^Z-\d{8}-01$/);
  assert.equal(z.invoice_count, 2);
  assert.equal(z.cash_sales, 85800);
  assert.equal(z.difference, 0);
  assert.ok(z.card_sales > 0);
  const z2 = await asStaff('caja', () => one(`select * from close_cash_register(0)`));
  assert.match(z2.code, /-02$/);
  assert.equal(z2.invoice_count, 0);
});

console.log('\nInventario');
await test('agotar un ingrediente bloquea los platillos que lo usan', async () => {
  const res = await asStaff('cocina', () => one(`select set_ingredient_stock('Queso Brie', true, 'Sin proveedor') as r`));
  assert.ok(res.r.affectedProducts.includes('Burger Trufada Gourmet'));
  await anon(() => rejects(createOrder([burgerItem()]), /agotado/));
  await asStaff('cocina', () => rows(`select set_ingredient_stock('queso brie', false)`));
  await anon(() => createOrder([burgerItem()]));
  const events = await asStaff('owner', () => rows(`select type from stock_events order by created_at`));
  assert.deepEqual(events.map((e) => e.type), ['AGOTADO', 'REPUESTO']);
});
await test('caja no puede agotar ingredientes', () =>
  asStaff('caja', () => rejects(rows(`select set_ingredient_stock('Queso Brie', true)`), /rol/)));

console.log('\nPlanes y configuración');
await test('el dueño no puede cambiarse el plan desde el navegador', () =>
  asStaff('owner', () => rejects(rows(`update tenants set plan = 'premium'`), /permission denied/)));
await test('el dueño sí puede editar los datos de la empresa', async () => {
  await asStaff('owner', () => rows(`update tenants set phone = '123' where id = $1`, [TENANT]));
  assert.equal((await one(`select phone from tenants where id = $1`, [TENANT])).phone, '123');
});
await test('plan Básico no recibe pedidos desde la mesa', async () => {
  await db.query(`update tenants set plan = 'basic' where id = $1`, [TENANT]);
  await anon(() => rejects(createOrder([burgerItem()]), /no recibe pedidos/));
  await db.query(`update tenants set plan = 'premium' where id = $1`, [TENANT]);
});

console.log('\nAislamiento entre restaurantes');
await test('el personal de otro restaurante no ve ni cobra pedidos ajenos', async () => {
  await db.query(`insert into tenants (slug, name, plan) values ('otro-resto', 'Otro', 'premium')`);
  const staffId = (await one(`select create_staff_member('otro-resto', 'Ana', 'owner', '9999') as id`)).id;
  const { id: uid } = await one(`insert into auth.users (email) values ('ana@test') returning id`);
  await db.query(`update staff_members set user_id = $1 where id = $2`, [uid, staffId]);
  const seen = await as('authenticated', uid, () => rows(`select id from orders`));
  assert.equal(seen.length, 0);
  await as('authenticated', uid, () => rejects(rows(`select issue_invoice($1, 'pos')`, [orderId]), /no encontrado/));
  const upd = await as('authenticated', uid, () => db.query(`update orders set notes = 'x'`));
  assert.equal(upd.affectedRows ?? 0, 0);
});

console.log('\nLogin del personal (PIN)');
await test('verify_staff_pin solo lo puede ejecutar service_role', () =>
  anon(() => rejects(rows(`select verify_staff_pin($1, $2, '1111')`, [SLUG, COCINA]), /permission denied/)));
await test('PIN correcto / incorrecto y bloqueo tras 5 intentos', async () => {
  const ok = await as('service_role', null, () => one(`select verify_staff_pin($1, $2, '1111') as r`, [SLUG, COCINA]));
  assert.equal(ok.r.ok, true);
  const tmp = (await one(`select create_staff_member($1, 'Mesero Prueba', 'mesero', '4321') as id`, [SLUG])).id;
  let last;
  for (let i = 0; i < 5; i++) {
    last = await as('service_role', null, () => one(`select verify_staff_pin($1, $2, '0000') as r`, [SLUG, tmp]));
  }
  assert.equal(last.r.reason, 'locked');
  const locked = await as('service_role', null, () => one(`select verify_staff_pin($1, $2, '4321') as r`, [SLUG, tmp]));
  assert.equal(locked.r.ok, false);
  assert.equal(locked.r.reason, 'locked');
});
await test('PIN de otro restaurante no sirve (slug distinto)', async () => {
  const r = await as('service_role', null, () => one(`select verify_staff_pin('otro-resto', $1, '1111') as r`, [COCINA]));
  assert.equal(r.r.ok, false);
});
await test('solo owner/admin crean personal; solo el dueño crea administradores', async () => {
  await asStaff('owner', () => rows(`select admin_create_staff('Cocina 2', 'cocina', '5555')`));
  await asStaff('caja', () => rejects(rows(`select admin_create_staff('X', 'cocina', '5555')`), /rol/));
  await rejects(asStaff('owner', () => rows(`select admin_create_staff('Y', 'cocina', '12')`)), /PIN/);
});

console.log(`\n${passed} pruebas pasaron${process.exitCode ? ' — HAY FALLOS' : ''}\n`);
await db.close();
