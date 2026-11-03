#!/usr/bin/env node
// Genera supabase/seed.sql a partir de los datos demo (src/services/demo/seedData.js).
// Uso: node scripts/generate-seed.mjs
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import {
  DEMO_TENANT,
  DEMO_INVOICE_SEQUENCES,
  DEMO_TABLE_COUNT,
  DEMO_STAFF,
  DEMO_CUSTOMERS,
  DEMO_CATEGORIES,
  INITIAL_PRODUCTS,
  demoUuid
} from '../src/services/demo/seedData.js';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const q = (v) => (v === null || v === undefined ? 'null' : `'${String(v).replace(/'/g, "''")}'`);
const json = (v) => `${q(JSON.stringify(v))}::jsonb`;
const textArray = (arr) => `array[${arr.map(q).join(', ')}]::text[]`;
const T = q(DEMO_TENANT.id);

const lines = [];
lines.push('-- ARCHIVO GENERADO por scripts/generate-seed.mjs — no editar a mano.');
lines.push('-- Restaurante de demostración. Cambia los PIN del personal antes de usarlo en serio.');
lines.push('');
lines.push(
  `insert into public.tenants (id, slug, name, nit, address, city, phone, email, plan, tax_type, tax_rate, tip_rate, footer_text) values (` +
    [T, q(DEMO_TENANT.slug), q(DEMO_TENANT.name), q(DEMO_TENANT.nit), q(DEMO_TENANT.address), q(DEMO_TENANT.city),
      q(DEMO_TENANT.phone), q(DEMO_TENANT.email), q(DEMO_TENANT.plan), q(DEMO_TENANT.taxType), DEMO_TENANT.taxRate,
      DEMO_TENANT.tipRate, q(DEMO_TENANT.footerText)].join(', ') +
    ') on conflict (id) do nothing;'
);
lines.push('');

for (const s of DEMO_INVOICE_SEQUENCES) {
  lines.push(
    `insert into public.invoice_sequences (tenant_id, kind, prefix, next_number, range_from, range_to, resolution_number, resolution_date, valid_until) values (` +
      [T, q(s.kind), q(s.prefix), s.nextNumber, s.rangeFrom, s.rangeTo ?? 'null', q(s.resolutionNumber), q(s.resolutionDate), q(s.validUntil)].join(', ') +
      ') on conflict (tenant_id, kind) do update set prefix = excluded.prefix, range_from = excluded.range_from, range_to = excluded.range_to, resolution_number = excluded.resolution_number, resolution_date = excluded.resolution_date, valid_until = excluded.valid_until;'
  );
}
lines.push('');

DEMO_CATEGORIES.forEach((name, i) => {
  lines.push(`insert into public.categories (id, tenant_id, name, sort_order) values (${q(demoUuid('c', i + 1))}, ${T}, ${q(name)}, ${i}) on conflict (id) do nothing;`);
});
lines.push('');

INITIAL_PRODUCTS.forEach((p, i) => {
  const categoryId = demoUuid('c', DEMO_CATEGORIES.indexOf(p.category) + 1);
  const details = {
    rating: p.rating, reviewsCount: p.reviewsCount, prepTime: p.prepTime,
    spicyLevel: p.spicyLevel, calories: p.calories, chefNotes: p.chefNotes
  };
  const pairing = p.pairing ? { productId: demoUuid('p', p.pairing.productId), description: p.pairing.description } : null;
  lines.push(
    'insert into public.products (id, tenant_id, category_id, name, description, price, image, is_chef, is_veg, is_gf, is_popular, available, ingredients, modifiers, pairing, details, sort_order) values (' +
      [q(demoUuid('p', p.id)), T, q(categoryId), q(p.name), q(p.description), p.price, q(p.image), p.isChef, p.isVeg, p.isGf,
        !!p.isPopular, p.available !== false, textArray(p.ingredients || []), json(p.modifiers || []),
        pairing ? json(pairing) : 'null', json(details), i].join(', ') +
      ') on conflict (id) do nothing;'
  );
});
lines.push('');

lines.push(`insert into public.restaurant_tables (tenant_id, label, sort_order)`);
lines.push(`select ${T}, n::text, n from generate_series(1, ${DEMO_TABLE_COUNT}) as n`);
lines.push(`on conflict (tenant_id, label) do nothing;`);
lines.push('');

for (const c of DEMO_CUSTOMERS) {
  lines.push(`insert into public.customers (id, tenant_id, name, doc_type, doc_number, email, phone) values (${[q(c.id), T, q(c.name), q(c.docType), q(c.docNumber), q(c.email), q(c.phone)].join(', ')}) on conflict do nothing;`);
}
lines.push('');

lines.push('-- Personal demo (PIN: dueño 1234, cocina 1111, caja 2222)');
for (const s of DEMO_STAFF) {
  lines.push(`insert into public.staff_members (id, tenant_id, display_name, role, pin_hash) values (${q(s.id)}, ${T}, ${q(s.displayName)}, ${q(s.role)}, public.hash_pin(${q(s.pin)})) on conflict do nothing;`);
}
lines.push('');

writeFileSync(path.join(root, 'supabase', 'seed.sql'), lines.join('\n'));
console.log('supabase/seed.sql generado');
