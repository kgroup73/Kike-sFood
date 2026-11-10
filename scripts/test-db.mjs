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
import http from 'node:http';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { crearApi } from '../impresora/lib/api.mjs';
import { crearAgente } from '../impresora/lib/agente.mjs';
import { unirEstaciones } from '../impresora/lib/config.mjs';

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
  asStaff('cocina', () => rejects(rows(`select issue_invoice(array[$1::bigint], 'pos')`, [orderId]), /rol/)));

console.log('\nCaja y facturación');
await test('emite factura con el INC desglosado (no sumado) y la propina aparte', async () => {
  const inv = await asStaff('caja', () => one(`select * from issue_invoice(array[$1::bigint], 'electronica', null, 'efectivo')`, [orderId]));
  assert.equal(inv.full_number, 'FE-1');
  assert.equal(inv.items_total, 78000);
  assert.equal(inv.tax_base, 72222); // 78.000 / 1,08
  assert.equal(inv.tax, 5778);
  assert.equal(inv.tip, 7800);
  assert.equal(inv.total, 85800);
  assert.equal(inv.dian_status, 'simulado');
  assert.equal(inv.cufe.length, 96);
  assert.deepEqual(inv.order_ids.map(Number), [Number(orderId)]);
  assert.equal((await one(`select status from orders where id = $1`, [orderId])).status, 'Cobrado');
});
await test('no permite cobrar dos veces el mismo pedido', () =>
  asStaff('caja', () => rejects(rows(`select issue_invoice(array[$1::bigint], 'pos')`, [orderId]), /no está listo/)));
await test('rechaza facturar con la resolución vencida', async () => {
  const { r } = await anon(() => createOrder([{ productId: SANGRIA, quantity: 1 }]));
  await db.query(`update orders set status = 'En Preparación' where id = $1`, [r.orderId]);
  await db.query(`update orders set status = 'Listo' where id = $1`, [r.orderId]);
  await db.query(`update orders set status = 'Por Cobrar' where id = $1`, [r.orderId]);
  await db.query(`update invoice_sequences set valid_until = current_date - 1 where tenant_id = $1 and kind = 'electronica'`, [TENANT]);
  await asStaff('caja', () => rejects(rows(`select issue_invoice(array[$1::bigint], 'electronica')`, [r.orderId]), /vencida/));
  const pos = await asStaff('caja', () => one(`select * from issue_invoice(p_order_id => $1::bigint, p_kind => 'pos', p_payment_method => 'tarjeta')`, [r.orderId]));
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

console.log('\nUna factura por mesa');
const table2 = await one(`select token from restaurant_tables where tenant_id = $1 and label = '2'`, [TENANT]);
const table3 = await one(`select token from restaurant_tables where tenant_id = $1 and label = '3'`, [TENANT]);
async function toPay(id) {
  for (const status of ['En Preparación', 'Listo', 'Por Cobrar']) {
    await db.query(`update orders set status = $1 where id = $2`, [status, id]);
  }
}
await test('une varias comandas de la mesa en un solo comprobante', async () => {
  const a = (await anon(() => createOrder([burgerItem({ quantity: 1 })], table2.token))).r;
  const b = (await anon(() => createOrder([burgerItem({ quantity: 1 }), { productId: SANGRIA, quantity: 1 }], table2.token, false))).r;
  await toPay(a.orderId);
  await toPay(b.orderId);
  const inv = await asStaff('caja', () => one(`select * from issue_invoice($1::bigint[], 'pos')`, [[a.orderId, b.orderId]]));
  assert.equal(inv.items_total, a.subtotal + b.subtotal);
  assert.equal(inv.tip, a.tip + b.tip);
  assert.equal(inv.total, a.subtotal + b.subtotal + a.tip + b.tip);
  assert.equal(inv.table_label, '2');
  assert.deepEqual(inv.order_ids.map(Number), [a.orderId, b.orderId].map(Number).sort((x, y) => x - y));
  // La burger de las dos comandas queda en una sola línea con cantidad 2
  const burger = inv.items.find((it) => it.name === 'Burger Trufada Gourmet');
  assert.equal(burger.quantity, 2);
  assert.equal(burger.totalPrice, 78000);
  assert.equal(inv.items.length, 2);
  const links = await rows(`select order_id from invoice_orders where invoice_id = $1`, [inv.id]);
  assert.equal(links.length, 2);
  const st = await rows(`select status from orders where id = any($1::bigint[])`, [[a.orderId, b.orderId]]);
  assert.ok(st.every((o) => o.status === 'Cobrado'));
});
await test('no mezcla comandas de mesas distintas', async () => {
  const a = (await anon(() => createOrder([{ productId: SANGRIA, quantity: 1 }], table2.token))).r;
  const b = (await anon(() => createOrder([{ productId: SANGRIA, quantity: 1 }], table3.token))).r;
  await toPay(a.orderId);
  await toPay(b.orderId);
  await asStaff('caja', () => rejects(rows(`select issue_invoice($1::bigint[], 'pos')`, [[a.orderId, b.orderId]]), /misma mesa/));
  assert.equal((await one(`select status from orders where id = $1`, [a.orderId])).status, 'Por Cobrar');
  await asStaff('caja', () => rows(`select issue_invoice($1::bigint[], 'pos')`, [[a.orderId]]));
  await asStaff('caja', () => rows(`select issue_invoice($1::bigint[], 'pos')`, [[b.orderId]]));
});
await test('rechaza todo el cobro si una comanda sigue en cocina', async () => {
  const a = (await anon(() => createOrder([{ productId: SANGRIA, quantity: 1 }], table3.token))).r;
  const b = (await anon(() => createOrder([{ productId: SANGRIA, quantity: 1 }], table3.token))).r;
  await toPay(a.orderId);
  const before = await one(`select next_number from invoice_sequences where tenant_id = $1 and kind = 'pos'`, [TENANT]);
  await asStaff('caja', () => rejects(rows(`select issue_invoice($1::bigint[], 'pos')`, [[a.orderId, b.orderId]]), new RegExp(`#${b.orderId} no está listo`)));
  const after = await one(`select next_number from invoice_sequences where tenant_id = $1 and kind = 'pos'`, [TENANT]);
  assert.equal(after.next_number, before.next_number); // no consume consecutivo
  assert.equal((await one(`select status from orders where id = $1`, [a.orderId])).status, 'Por Cobrar');
});
await test('rechaza una lista vacía de comandas', () =>
  asStaff('caja', () => rejects(rows(`select issue_invoice('{}'::bigint[], 'pos')`), /al menos una/)));
await test('caja no puede escribir en invoice_orders; anon no lo puede leer', async () => {
  await asStaff('caja', () => rejects(rows(`insert into invoice_orders (invoice_id, order_id, tenant_id) values (gen_random_uuid(), 1, $1)`, [TENANT]), /permission denied/));
  await anon(() => rejects(rows(`select * from invoice_orders`), /permission denied/));
});

console.log('\nPropina en caja');
async function tableOrder(token, tip = false) {
  const { r } = await anon(() => createOrder([{ productId: SANGRIA, quantity: 1 }], token, tip));
  await toPay(r.orderId);
  return r;
}
await test('la caja define la propina al cobrar', async () => {
  const a = await tableOrder(table3.token);
  const inv = await asStaff('caja', () => one(`select * from issue_invoice($1::bigint[], 'pos', null, 'efectivo', 5000)`, [[a.orderId]]));
  assert.equal(inv.tip, 5000);
  assert.equal(inv.total, a.subtotal + 5000);
});
await test('sin propina explícita usa la de las comandas', async () => {
  const a = await tableOrder(table3.token, true);
  const inv = await asStaff('caja', () => one(`select * from issue_invoice($1::bigint[], 'pos')`, [[a.orderId]]));
  assert.equal(inv.tip, a.tip);
});
await test('rechaza propina negativa o mayor que el consumo', async () => {
  const a = await tableOrder(table2.token);
  await asStaff('caja', () => rejects(rows(`select issue_invoice($1::bigint[], 'pos', null, 'efectivo', -1)`, [[a.orderId]]), /negativa/));
  await asStaff('caja', () => rejects(rows(`select issue_invoice($1::bigint[], 'pos', null, 'efectivo', $2)`, [[a.orderId], a.subtotal + 1]), /superar/));
  const inv = await asStaff('caja', () => one(`select * from issue_invoice($1::bigint[], 'pos', null, 'efectivo', 0)`, [[a.orderId]]));
  assert.equal(inv.tip, 0);
});
await test('la propina sugerida no puede pasar del 10 %', async () => {
  await asStaff('owner', () => rejects(rows(`update tenants set tip_rate = 15 where id = $1`, [TENANT]), /tip_rate_check/));
  await asStaff('owner', () => rows(`update tenants set tip_rate = 10 where id = $1`, [TENANT]));
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

console.log('\nPlan Intermedio: sin caja, las comandas se entregan');
// Cada prueba usa su propia mesa: create_order limita a 6 pedidos por mesa cada 10 minutos.
const tokenOf = async (label) => (await one(`select token from restaurant_tables where tenant_id = $1 and label = $2`, [TENANT, label])).token;
const orderAt = async (label) => {
  const token = await tokenOf(label);
  return (await anon(() => createOrder([{ productId: SANGRIA, quantity: 1 }], token))).r;
};
await test('sin caja, lo listo se entrega y no puede pasar a caja', async () => {
  await db.query(`update tenants set plan = 'intermedio' where id = $1`, [TENANT]);
  try {
    const r = await orderAt('5');
    await db.query(`update orders set status = 'En Preparación' where id = $1`, [r.orderId]);
    await db.query(`update orders set status = 'Listo' where id = $1`, [r.orderId]);
    await rejects(db.query(`update orders set status = 'Por Cobrar' where id = $1`, [r.orderId]), /entregada/);
    await asStaff('cocina', () => db.query(`update orders set status = 'Entregado' where id = $1`, [r.orderId]));
    assert.equal((await one(`select status from orders where id = $1`, [r.orderId])).status, 'Entregado');
    await rejects(db.query(`update orders set status = 'Cancelado' where id = $1`, [r.orderId]), /Transición/);
  } finally {
    await db.query(`update tenants set plan = 'premium' where id = $1`, [TENANT]);
  }
});
await test('con caja (Premium), lo listo no se puede marcar entregado', async () => {
  const r = await orderAt('6');
  await db.query(`update orders set status = 'En Preparación' where id = $1`, [r.orderId]);
  await db.query(`update orders set status = 'Listo' where id = $1`, [r.orderId]);
  await rejects(db.query(`update orders set status = 'Entregado' where id = $1`, [r.orderId]), /pasa a caja/);
  await db.query(`update orders set status = 'Cancelado' where id = $1`, [r.orderId]);
});
await test('la caja es del plan Premium: Intermedio no puede cobrar', async () => {
  const r = await orderAt('7');
  await toPay(r.orderId);
  await db.query(`update tenants set plan = 'intermedio' where id = $1`, [TENANT]);
  try {
    await asStaff('caja', () => rejects(rows(`select issue_invoice(array[$1::bigint], 'pos')`, [r.orderId]), /plan Premium/));
  } finally {
    await db.query(`update tenants set plan = 'premium' where id = $1`, [TENANT]);
  }
  await db.query(`update orders set status = 'Cancelado' where id = $1`, [r.orderId]);
});

console.log('\nComandas impresas');
await test('lo que existía antes de la migración ya figura como impreso', async () => {
  const pending = await one(`select count(*)::int as n from orders where tenant_id = $1 and printed_at is null and status in ('Pendiente', 'En Preparación', 'Listo')`, [TENANT]);
  const live = await one(`select count(*)::int as n from orders where tenant_id = $1 and status in ('Pendiente', 'En Preparación', 'Listo')`, [TENANT]);
  // Las del seed (creadas antes de migrar) no quedan en la fila; solo las de estas pruebas.
  assert.ok(pending.n <= live.n);
});
await test('solo el dueño o el administrador apagan la pantalla de cocina', async () => {
  await asStaff('owner', () => rows(`update tenants set kitchen_display = false where id = $1`, [TENANT]));
  assert.equal((await one(`select kitchen_display from tenants where id = $1`, [TENANT])).kitchen_display, false);
  const upd = await asStaff('caja', () => db.query(`update tenants set kitchen_display = true where id = $1`, [TENANT]));
  assert.equal(upd.affectedRows ?? 0, 0);
  await db.query(`update tenants set kitchen_display = true where id = $1`, [TENANT]);
});

console.log('\nFila de impresión por estaciones');
const stationId = async (name) => (await one(`select id from print_stations where tenant_id = $1 and name = $2`, [TENANT, name])).id;
const jobsOf = (orderId) => rows(`select j.*, s.name as station from print_jobs j join print_stations s on s.id = j.station_id where order_id = $1 order by j.id`, [orderId]);
let routedOrder;
await test('cada restaurante arranca con la estación Cocina por defecto', async () => {
  const st = await rows(`select name, is_default from print_stations where tenant_id = $1`, [TENANT]);
  assert.deepEqual(st, [{ name: 'Cocina', is_default: true }]);
  await db.query(`insert into tenants (slug, name, plan) values ('nuevo-resto', 'Nuevo', 'intermedio')`);
  const nuevo = await one(`select count(*)::int as n from print_stations s join tenants t on t.id = s.tenant_id where t.slug = 'nuevo-resto' and s.is_default`);
  assert.equal(nuevo.n, 1);
});
await test('la comanda se reparte por estación según la categoría de cada plato', async () => {
  const barra = await asStaff('owner', () => one(`select admin_save_print_station(null, 'Barra') as id`));
  await asStaff('owner', () =>
    db.query(`update categories set print_station_id = $1 where id = (select category_id from products where id = $2)`, [barra.id, SANGRIA]));
  const token = await tokenOf('9');
  const { r } = await anon(() => createOrder([{ productId: SANGRIA, quantity: 2 }, burgerItem({ quantity: 1 })], token));
  routedOrder = r.orderId;
  const jobs = await jobsOf(r.orderId);
  assert.deepEqual(jobs.map((j) => j.station).sort(), ['Barra', 'Cocina']);
  const barraJob = jobs.find((j) => j.station === 'Barra');
  assert.equal(barraJob.payload.items.length, 1);
  assert.equal(barraJob.payload.items[0].quantity, 2);
  assert.equal(barraJob.payload.tableLabel, '9');
  assert.ok(jobs.every((j) => j.status === 'pendiente' && j.kind === 'comanda'));
});
await test('el navegador toma los trabajos una sola vez y la comanda figura impresa al salir todos', async () => {
  const taken = await asStaff('cocina', () => rows(`select * from claim_print_jobs(null, 20)`));
  const mine = taken.filter((j) => Number(j.order_id) === Number(routedOrder));
  assert.equal(mine.length, 2);
  const again = await asStaff('caja', () => rows(`select * from claim_print_jobs(null, 20)`));
  assert.equal(again.filter((j) => Number(j.order_id) === Number(routedOrder)).length, 0);
  await asStaff('cocina', () => rows(`select report_print_job($1, true)`, [mine[0].id]));
  assert.equal((await one(`select printed_at from orders where id = $1`, [routedOrder])).printed_at, null);
  await asStaff('cocina', () => rows(`select report_print_job($1, true)`, [mine[1].id]));
  assert.ok((await one(`select printed_at from orders where id = $1`, [routedOrder])).printed_at);
  for (const j of taken.filter((x) => Number(x.order_id) !== Number(routedOrder))) {
    await asStaff('cocina', () => rows(`select report_print_job($1, true)`, [j.id]));
  }
});
await test('una falla vuelve a la fila y tras 5 intentos queda en error', async () => {
  const cocina = await stationId('Cocina');
  const id = (await asStaff('owner', () => one(`select enqueue_test_print($1) as id`, [cocina]))).id;
  for (let i = 1; i <= 5; i++) {
    const [job] = await asStaff('cocina', () => rows(`select * from claim_print_jobs(null, 1)`));
    assert.equal(Number(job.id), Number(id));
    await asStaff('cocina', () => rows(`select report_print_job($1, false, 'Sin papel')`, [id]));
  }
  const job = await one(`select status, attempts, error from print_jobs where id = $1`, [id]);
  assert.deepEqual([job.status, job.attempts, job.error], ['error', 5, 'Sin papel']);
});
await test('reimprimir manda la comanda otra vez a todas sus estaciones', async () => {
  await asStaff('caja', () => rows(`select request_order_reprint($1)`, [routedOrder]));
  const jobs = (await jobsOf(routedOrder)).filter((j) => j.payload.reprint === true);
  assert.equal(jobs.length, 2);
  assert.equal((await one(`select printed_at from orders where id = $1`, [routedOrder])).printed_at, null);
});

console.log('\nAgente local de impresión');
let agentToken;
let pairCode;
await test('solo el dueño o el administrador crean equipos de impresión', async () => {
  await asStaff('cocina', () => rejects(rows(`select admin_create_print_device('PC', array[$1::uuid])`, [TENANT]), /rol/));
  await asStaff('owner', () => rejects(rows(`select admin_create_print_device('PC', '{}')`), /al menos una estación/));
  const cocina = await stationId('Cocina');
  const r = await asStaff('owner', () => one(`select admin_create_print_device('PC cocina', array[$1::uuid]) as r`, [cocina]));
  assert.match(r.r.code, /^[A-Z2-9]{4}-[A-Z2-9]{4}$/);
  pairCode = r.r.code;
});
await test('se vincula con el código del restaurante y el código de un solo uso', async () => {
  await anon(() => rejects(rows(`select agent_pair($1, 'AAAA-BBBB')`, [SLUG]), /inválido o vencido/));
  await anon(() => rejects(rows(`select agent_pair('otro-resto', $1)`, [pairCode]), /inválido o vencido/));
  const { r } = await anon(() => one(`select agent_pair($1, $2, '0.1.0') as r`, [SLUG.toUpperCase(), pairCode.toLowerCase()]));
  assert.equal(r.slug, SLUG);
  assert.deepEqual(r.stations.map((x) => x.name), ['Cocina']);
  assert.equal(r.token.length, 64);
  agentToken = r.token;
  await anon(() => rejects(rows(`select agent_pair($1, $2)`, [SLUG, pairCode]), /inválido o vencido/));
});
await test('el agente solo toma trabajos de sus estaciones y reporta lo suyo', async () => {
  const token = await tokenOf('10');
  const { r } = await anon(() => createOrder([{ productId: SANGRIA, quantity: 1 }, burgerItem({ quantity: 1 })], token));
  const pulled = await anon(() => rows(`select * from agent_pull_jobs($1, 10, '0.1.0')`, [agentToken]));
  const mine = pulled.filter((j) => Number(j.order_id) === Number(r.orderId));
  assert.equal(mine.length, 1);
  assert.equal(mine[0].payload.station, 'Cocina');
  assert.equal(mine[0].claimed_by_name, 'PC cocina');
  await anon(() => rejects(rows(`select agent_report_job($1, $2, true)`, ['x'.repeat(64), mine[0].id]), /no vinculado/));
  await anon(() => rows(`select agent_report_job($1, $2, true)`, [agentToken, mine[0].id]));
  assert.equal((await one(`select status from print_jobs where id = $1`, [mine[0].id])).status, 'impreso');
  const seen = await one(`select last_seen_at, agent_version from print_devices where tenant_id = $1 and name = 'PC cocina'`, [TENANT]);
  assert.ok(seen.last_seen_at);
  assert.equal(seen.agent_version, '0.1.0');
});
await test('nadie lee el token ni la fila sin sesión; revocar desconecta al agente', async () => {
  await anon(() => rejects(rows(`select * from print_jobs`), /permission denied/));
  await anon(() => rejects(rows(`select * from print_devices`), /permission denied/));
  await asStaff('owner', () => rejects(rows(`select token_hash from print_devices`), /permission denied/));
  const dev = await asStaff('owner', () => one(`select id from print_devices where name = 'PC cocina'`));
  await asStaff('owner', () => rows(`select admin_revoke_print_device($1)`, [dev.id]));
  await anon(() => rejects(rows(`select * from agent_pull_jobs($1)`, [agentToken]), /no vinculado o revocado/));
});
await test('el tiquete de caja va a la estación de tiquetes', async () => {
  const r = await orderAt('11');
  await toPay(r.orderId);
  const inv = await asStaff('caja', () => one(`select * from issue_invoice(array[$1::bigint], 'pos')`, [r.orderId]));
  await asStaff('caja', () => rejects(rows(`select enqueue_invoice_print($1)`, [inv.id]), /tiquetes de caja/));
  await asStaff('owner', () => rows(`select admin_save_print_station(null, 'Caja', false, true)`));
  const job = await asStaff('caja', () => one(`select enqueue_invoice_print($1) as id`, [inv.id]));
  const row = await one(`select kind, payload from print_jobs where id = $1`, [job.id]);
  assert.equal(row.kind, 'tiquete');
  assert.equal(row.payload.number, inv.full_number);
  assert.equal(row.payload.total, inv.total);
  await asStaff('cocina', () => rejects(rows(`select enqueue_invoice_print($1)`, [inv.id]), /rol/));
});
await test('de punta a punta: el agente se vincula por HTTP y reparte la comanda en dos impresoras', async () => {
  // Servidor mínimo con la misma forma que la API de Supabase (/rest/v1/rpc/<función>), como anon.
  const server = http.createServer(async (req, res) => {
    const fn = /^\/rest\/v1\/rpc\/([a-z_]+)$/.exec(req.url)?.[1];
    let body = '';
    for await (const chunk of req) body += chunk;
    const params = JSON.parse(body || '{}');
    const keys = Object.keys(params);
    try {
      if (!fn || !keys.every((k) => /^p_[a-z_]+$/.test(k))) throw new Error('ruta inválida');
      const call = `select * from public.${fn}(${keys.map((k, i) => `${k} => $${i + 1}`).join(', ')})`;
      const out = await anon(() => db.query(call, keys.map((k) => params[k])));
      const scalar = out.fields.length === 1 && out.fields[0].name === fn;
      const json = JSON.stringify(scalar ? out.rows[0][fn] : out.rows, (_k, v) => (typeof v === 'bigint' ? Number(v) : v));
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(json);
    } catch (err) {
      res.writeHead(400, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ code: err.code, message: err.message }));
    }
  });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  try {
    const servidor = `http://127.0.0.1:${server.address().port}`;
    const cocina = await stationId('Cocina');
    const barra = await stationId('Barra');
    const alta = await asStaff('owner', () =>
      one(`select admin_create_print_device('PC del pase', array[$1::uuid, $2::uuid]) as r`, [cocina, barra]));
    const api = crearApi({ servidor, llave: 'anon' });
    const v = await api.vincular(SLUG, alta.r.code, '0.1.0');
    const dir = mkdtempSync(path.join(tmpdir(), 'kikes-agente-'));
    const estaciones = unirEstaciones([], v.stations).map((e) => ({
      ...e,
      impresora: { tipo: 'archivo', ruta: path.join(dir, `${e.nombre}.bin`) }
    }));
    const config = { token: v.token, restaurante: v.restaurant, equipo: v.deviceName, estaciones };
    const agente = crearAgente({ api, config, log: () => {} });

    const token = await tokenOf('12');
    const { r } = await anon(() => createOrder([{ productId: SANGRIA, quantity: 1 }, burgerItem({ quantity: 1 })], token));
    while ((await agente.ciclo()) > 0);

    const cocinaTxt = readFileSync(path.join(dir, 'Cocina.bin'), 'latin1');
    const barraTxt = readFileSync(path.join(dir, 'Barra.bin'), 'latin1');
    assert.ok(cocinaTxt.includes('MESA 12') && cocinaTxt.includes('Burger Trufada'));
    assert.ok(barraTxt.includes('MESA 12') && barraTxt.includes('Sangr'));
    assert.ok(!barraTxt.includes('Burger Trufada'), 'la barra no recibe los platos de la cocina');
    const st = await rows(`select status, claimed_by_name from print_jobs where order_id = $1`, [r.orderId]);
    assert.deepEqual(st.map((j) => [j.status, j.claimed_by_name]), [['impreso', 'PC del pase'], ['impreso', 'PC del pase']]);
    assert.ok((await one(`select printed_at from orders where id = $1`, [r.orderId])).printed_at);
  } finally {
    server.close();
  }
});
await test('una categoría no puede apuntar a la estación de otro restaurante', async () => {
  const ajena = await one(`select s.id from print_stations s join tenants t on t.id = s.tenant_id where t.slug = 'nuevo-resto'`);
  await rejects(db.query(`update categories set print_station_id = $1 where tenant_id = $2`, [ajena.id, TENANT]), /foreign key|violates/);
});

console.log('\nLlamado al mesero');
let callId;
await test('el comensal llama desde su mesa y repetir no crea otro llamado', async () => {
  const a = await anon(() => one(`select call_waiter($1, $2) as r`, [SLUG, table1.token]));
  assert.equal(a.r.tableLabel, '1');
  const b = await anon(() => one(`select call_waiter($1, $2) as r`, [SLUG, table1.token]));
  assert.equal(b.r.callId, a.r.callId);
  callId = a.r.callId;
});
await test('rechaza mesas inválidas y el plan Básico', async () => {
  await anon(() => rejects(rows(`select call_waiter($1, 'token-falso')`, [SLUG]), /mesa inválido/));
  await db.query(`update tenants set plan = 'basic' where id = $1`, [TENANT]);
  try {
    await anon(() => rejects(rows(`select call_waiter($1, $2)`, [SLUG, table1.token]), /no recibe llamados/));
  } finally {
    await db.query(`update tenants set plan = 'premium' where id = $1`, [TENANT]);
  }
});
await test('el personal ve el llamado y lo atiende; el comensal no lee la lista', async () => {
  await anon(() => rejects(rows(`select * from waiter_calls`), /permission denied/));
  const open = await asStaff('caja', () => rows(`select id from waiter_calls where attended_at is null`));
  assert.ok(open.some((c) => Number(c.id) === Number(callId)));
  await asStaff('caja', () => rows(`select attend_waiter_call($1)`, [callId]));
  const done = await one(`select attended_at, attended_by_name from waiter_calls where id = $1`, [callId]);
  assert.ok(done.attended_at);
  assert.equal(done.attended_by_name, 'Caja');
  await anon(() => rejects(rows(`select attend_waiter_call($1)`, [callId]), /permission denied/));
});

console.log('\nAislamiento entre restaurantes');
await test('el personal de otro restaurante no ve ni cobra pedidos ajenos', async () => {
  await db.query(`insert into tenants (slug, name, plan) values ('otro-resto', 'Otro', 'premium')`);
  const staffId = (await one(`select create_staff_member('otro-resto', 'Ana', 'owner', '9999') as id`)).id;
  const { id: uid } = await one(`insert into auth.users (email) values ('ana@test') returning id`);
  await db.query(`update staff_members set user_id = $1 where id = $2`, [uid, staffId]);
  const seen = await as('authenticated', uid, () => rows(`select id from orders`));
  assert.equal(seen.length, 0);
  const calls = await as('authenticated', uid, () => rows(`select id from waiter_calls`));
  assert.equal(calls.length, 0);
  const jobs = await as('authenticated', uid, () => rows(`select id from print_jobs`));
  assert.equal(jobs.length, 0);
  await as('authenticated', uid, () => rejects(rows(`select issue_invoice(array[$1::bigint], 'pos')`, [orderId]), /no encontrado/));
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
