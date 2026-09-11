export const STOCK_EVENT_TYPES = {
  DEPLETED: 'AGOTADO',
  RESTOCKED: 'REPUESTO'
};

export function timeAgo(isoDate) {
  if (!isoDate) return '';
  const diffMs = Date.now() - new Date(isoDate).getTime();
  const mins = Math.max(0, Math.floor(diffMs / 60000));
  if (mins < 1) return 'hace un instante';
  if (mins < 60) return `hace ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `hace ${hours} h`;
  const days = Math.floor(hours / 24);
  return `hace ${days} día${days === 1 ? '' : 's'}`;
}

export function formatEventTimestamp(isoDate) {
  if (!isoDate) return '';
  return new Date(isoDate).toLocaleString('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function normalizeIngredient(name) {
  return String(name || '').trim().toLowerCase();
}

export const INGREDIENT_CATEGORIES = [
  { id: 'carnes', label: 'Carnes & Mariscos' },
  { id: 'lacteos', label: 'Lácteos & Quesos' },
  { id: 'verduras', label: 'Verduras & Vegetales' },
  { id: 'frutas', label: 'Frutas' },
  { id: 'granos', label: 'Granos & Panes' },
  { id: 'salsas', label: 'Salsas & Aderezos' },
  { id: 'hierbas', label: 'Hierbas & Especias' },
  { id: 'bebidas', label: 'Bebidas & Licores' },
  { id: 'dulces', label: 'Dulces & Postres' },
  { id: 'otros', label: 'Otros' }
];

const CATEGORY_RULES = [
  { id: 'carnes', keywords: ['carne', 'angus', 'ribeye', 'bife', 'camaron', 'camarones', 'pescado', 'pollo', 'cerdo', 'prosciutto', 'jamon', 'tocino', 'salmon', 'atun', 'cordero'] },
  { id: 'lacteos', keywords: ['queso', 'brie', 'mascarpone', 'burrata', 'mozzarella', 'parmesano', 'leche', 'crema', 'mantequilla', 'yogur', 'stracciatella', 'ricotta'] },
  { id: 'verduras', keywords: ['cebolla', 'aguacate', 'tomate', 'papa', 'pepino', 'lechuga', 'espinaca', 'brocoli', 'pimiento', 'zanahoria', 'apio', 'champinon', 'seta', 'esparrago', 'verdura'] },
  { id: 'frutas', keywords: ['pina', 'limon', 'naranja', 'frutos rojos', 'fresa', 'mora', 'arandano', 'mango', 'fruta'] },
  { id: 'granos', keywords: ['pan', 'brioche', 'tortilla', 'maiz', 'harina', 'quinoa', 'arroz', 'pasta', 'fideo', 'avena', 'savoiardi', 'galleta', 'focaccia', 'garbanzo', 'legumbre', 'semilla', 'chia', 'sesamo'] },
  { id: 'salsas', keywords: ['trufa', 'hummus', 'chimichurri', 'pesto', 'aceite', 'emulsion', 'salsa', 'aderezo', 'mayonesa', 'vinagreta', 'tahini', 'guacamole', 'dip'] },
  { id: 'hierbas', keywords: ['cilantro', 'romero', 'menta', 'canela', 'albahaca', 'oregano', 'tomillo', 'perejil', 'laurel', 'comino', 'paprika', 'pimenton', 'sal', 'pimienta', 'chile', 'aji', 'hierba'] },
  { id: 'bebidas', keywords: ['cafe', 'espresso', 'vino', 'cointreau', 'amaretto', 'licor', 'cerveza', 'whisky', 'ron', 'tequila', 'vodka', 'gin', 'jugo', 'limonada', 'soda', 'hielo', 'agua'] },
  { id: 'dulces', keywords: ['cacao', 'chocolate', 'azucar', 'dulce', 'miel', 'caramelo', 'vainilla', 'helado'] }
];

function stripAccents(s) {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

export function getIngredientCategory(name) {
  const n = stripAccents(normalizeIngredient(name));
  for (const rule of CATEGORY_RULES) {
    if (rule.keywords.some(k => n.includes(k))) return rule.id;
  }
  return 'otros';
}

export function buildMasterIngredientList(products) {
  const map = new Map();
  (products || []).forEach(p => {
    (p.ingredients || []).forEach(ing => {
      const key = normalizeIngredient(ing);
      if (!map.has(key)) map.set(key, { key, name: ing, usedBy: [], category: getIngredientCategory(ing) });
      const entry = map.get(key);
      if (!entry.usedBy.includes(p.name)) entry.usedBy.push(p.name);
    });
  });
  return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
}

export function getAffectedProducts(products, ingredientKeyOrName) {
  const key = normalizeIngredient(ingredientKeyOrName);
  return (products || [])
    .filter(p => (p.ingredients || []).some(ing => normalizeIngredient(ing) === key))
    .map(p => p.name);
}

export function deriveProductsWithStock(products, ingredientsStock = {}) {
  const soldOutKeys = new Set(
    Object.entries(ingredientsStock)
      .filter(([, info]) => info && info.soldOut)
      .map(([key]) => key)
  );

  return (products || []).map(p => {
    const missing = (p.ingredients || []).filter(ing => soldOutKeys.has(normalizeIngredient(ing)));
    if (!missing.length) {
      return { ...p, soldOut: false, soldOutInfo: null };
    }
    const firstInfo = ingredientsStock[normalizeIngredient(missing[0])] || {};
    return {
      ...p,
      soldOut: true,
      soldOutInfo: {
        at: firstInfo.at,
        by: firstInfo.by || 'Cocina',
        missingIngredients: missing,
        note: firstInfo.note
      }
    };
  });
}