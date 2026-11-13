export const STOCK_EVENT_TYPES = {
  DEPLETED: 'AGOTADO',
  RESTOCKED: 'REPUESTO'
};

export const INVENTORY_UNITS = [
  { id: 'kg', label: 'Kilogramos (kg)', short: 'kg' },
  { id: 'g', label: 'Gramos (g)', short: 'g' },
  { id: 'lt', label: 'Litros (lt)', short: 'lt' },
  { id: 'ml', label: 'Mililitros (ml)', short: 'ml' },
  { id: 'unidad', label: 'Unidades (ud)', short: 'ud' },
  { id: 'paquete', label: 'Paquetes (paq)', short: 'paq' },
  { id: 'porcion', label: 'Porciones (porc)', short: 'porc' }
];

export const MOVEMENT_TYPES = {
  ENTRADA: { id: 'ENTRADA', label: 'Entrada / Compra', tone: 'text-hoja', sign: '+' },
  MERMA: { id: 'MERMA', label: 'Merma / Desperdicio', tone: 'text-aji', sign: '-' },
  AJUSTE: { id: 'AJUSTE', label: 'Ajuste manual', tone: 'text-maracuya-tinta', sign: '=' },
  SALIDA: { id: 'SALIDA', label: 'Salida de cocina', tone: 'text-tinta', sign: '-' }
};

export function formatQuantity(qty, unit = 'unidad') {
  const n = Number(qty) || 0;
  const formatted = n % 1 === 0 ? String(n) : n.toFixed(2);
  const found = INVENTORY_UNITS.find((u) => u.id === unit);
  const unitLabel = found ? found.short : unit;
  return `${formatted} ${unitLabel}`;
}

export function getInventoryStatus(item = {}) {
  const isSoldOut = Boolean(item.isSoldOut || (item.autoDeplete && (Number(item.currentStock) || 0) <= 0));
  if (isSoldOut) {
    return {
      id: 'agotado',
      label: 'Agotado',
      badgeClass: 'chip chip-alerta',
      tone: 'text-aji'
    };
  }
  const current = Number(item.currentStock) || 0;
  const min = Number(item.minStock) || 0;
  if (min > 0 && current <= min) {
    return {
      id: 'bajo',
      label: 'Stock bajo',
      badgeClass: 'chip chip-aviso',
      tone: 'text-aviso'
    };
  }
  return {
    id: 'disponible',
    label: 'Disponible',
    badgeClass: 'chip chip-disponible',
    tone: 'text-hoja'
  };
}

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

/**
 * Combina el inventario persistido con los ingredientes usados en la carta de platillos,
 * garantizando que todo insumo tenga su lista de platillos vinculados (`usedBy`) y que
 * ningún ingrediente de la carta quede invisible si aún no se ha dado de alta formalmente.
 */
export function mergeIngredientsWithProducts(inventoryItems = [], products = [], ingredientsStock = {}) {
  const map = new Map();

  // 1. Inicializar con los insumos formalmente guardados en el inventario
  (inventoryItems || []).forEach((item) => {
    const key = normalizeIngredient(item.name || item.key);
    if (!key) return;
    const stockInfo = ingredientsStock[key];
    const isSoldOut = Boolean(
      item.isSoldOut ||
      stockInfo?.soldOut ||
      (item.autoDeplete && (Number(item.currentStock) || 0) <= 0)
    );
    map.set(key, {
      key,
      name: item.name,
      category: item.category || getIngredientCategory(item.name),
      unit: item.unit || 'unidad',
      currentStock: Number(item.currentStock ?? 0),
      minStock: Number(item.minStock ?? 0),
      unitCost: Number(item.unitCost ?? 0),
      autoDeplete: Boolean(item.autoDeplete),
      supplier: item.supplier || '',
      isSoldOut,
      note: item.note || stockInfo?.note || '',
      reportedBy: item.reportedBy || stockInfo?.by || '',
      updatedAt: item.updatedAt || stockInfo?.at || null,
      usedBy: [],
      isPersisted: true
    });
  });

  // 2. Asociar los platillos de la carta y detectar ingredientes no formalizados
  (products || []).forEach((p) => {
    (p.ingredients || []).forEach((ing) => {
      const key = normalizeIngredient(ing);
      if (!key) return;
      if (!map.has(key)) {
        const stockInfo = ingredientsStock[key];
        map.set(key, {
          key,
          name: ing,
          category: getIngredientCategory(ing),
          unit: 'unidad',
          currentStock: 0,
          minStock: 0,
          unitCost: 0,
          autoDeplete: false,
          supplier: '',
          isSoldOut: Boolean(stockInfo?.soldOut),
          note: stockInfo?.note || '',
          reportedBy: stockInfo?.by || '',
          updatedAt: stockInfo?.at || null,
          usedBy: [],
          isPersisted: false
        });
      }
      const entry = map.get(key);
      if (!entry.usedBy.includes(p.name)) {
        entry.usedBy.push(p.name);
      }
    });
  });

  return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
}