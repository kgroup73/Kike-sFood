import { normalizeIngredient } from './inventory';

// Campos de presentación guardados en products.details (jsonb).
export const DETAIL_KEYS = ['rating', 'reviewsCount', 'prepTime', 'spicyLevel', 'calories', 'chefNotes'];

/** Fila de public.products → producto de la app. */
export function productFromRow(row, categoryName = '') {
  const details = row.details || {};
  return {
    id: row.id,
    tenantId: row.tenant_id,
    categoryId: row.category_id,
    category: categoryName,
    name: row.name,
    description: row.description || '',
    price: Number(row.price) || 0,
    image: row.image || '',
    isChef: !!row.is_chef,
    isVeg: !!row.is_veg,
    isGf: !!row.is_gf,
    isPopular: !!row.is_popular,
    available: row.available !== false,
    ingredients: row.ingredients || [],
    modifiers: row.modifiers || [],
    pairing: row.pairing || null,
    sortOrder: row.sort_order ?? 0,
    ...Object.fromEntries(DETAIL_KEYS.map((k) => [k, details[k] ?? null]))
  };
}

/** Producto de la app → columnas de public.products. */
export function productToRow(p, tenantId) {
  return {
    tenant_id: tenantId,
    category_id: p.categoryId || null,
    name: p.name.trim(),
    description: p.description || '',
    price: Math.max(0, Math.round(Number(p.price) || 0)),
    image: p.image || null,
    is_chef: !!p.isChef,
    is_veg: !!p.isVeg,
    is_gf: !!p.isGf,
    is_popular: !!p.isPopular,
    available: p.available !== false,
    ingredients: (p.ingredients || []).map((i) => i.trim()).filter(Boolean),
    modifiers: p.modifiers || [],
    pairing: p.pairing || null,
    details: Object.fromEntries(DETAIL_KEYS.map((k) => [k, p[k] ?? null])),
    sort_order: p.sortOrder ?? 0
  };
}

/** Filas de public.ingredients_stock → { [clave]: { name, soldOut, at, by, note } }. */
export function stockFromRows(rows = []) {
  const map = {};
  for (const r of rows) {
    if (!r.is_sold_out) continue;
    map[normalizeIngredient(r.name)] = { name: r.name, soldOut: true, at: r.updated_at, by: r.reported_by, note: r.note };
  }
  return map;
}

const STORY_STYLES = [{ tag: 'Más pedido' }, { tag: 'Receta del chef' }, { tag: 'Recomendado' }];

/** Historias destacadas de la carta: platillos del chef y populares disponibles. */
export function buildStories(products = [], max = 5) {
  return products
    .filter((p) => p.available !== false && !p.soldOut && (p.isChef || p.isPopular))
    .sort((a, b) => (Number(b.rating) || 0) - (Number(a.rating) || 0))
    .slice(0, max)
    .map((p, i) => {
      const style = p.isChef ? STORY_STYLES[1] : STORY_STYLES[i % 2 === 0 ? 0 : 2];
      return {
        id: `story-${p.id}`,
        productId: p.id,
        title: p.isChef ? 'Especial Chef 👨‍🍳' : 'Top Estrella ⭐',
        subtitle: p.name,
        tag: style.tag,
        image: p.image,
        storyText: p.chefNotes || p.description,
        duration: 5000
      };
    });
}
