/**
 * Precios de los ítems del carrito. Replica la lógica de create_order() en la
 * base de datos: el servidor recalcula todo, esto es solo para mostrarlo.
 *
 * selections: { [tituloDelGrupo]: nombreDeLaOpcion }  (un modificador por grupo)
 */

export function validateSelections(product, selections = {}) {
  const errors = [];
  const groups = product?.modifiers || [];
  for (const title of Object.keys(selections)) {
    const group = groups.find((g) => g.title === title);
    if (!group) {
      errors.push(`Opción desconocida: ${title}`);
    } else if (!group.options.some((o) => o.name === selections[title])) {
      errors.push(`La opción "${selections[title]}" no existe en ${title}`);
    }
  }
  for (const group of groups) {
    if (group.required && !selections[group.title]) {
      errors.push(`Elige ${group.title}`);
    }
  }
  return { ok: errors.length === 0, errors };
}

export function selectionExtras(product, selections = {}) {
  return (product?.modifiers || []).reduce((sum, group) => {
    const opt = group.options.find((o) => o.name === selections[group.title]);
    return sum + (opt ? Number(opt.price) || 0 : 0);
  }, 0);
}

export const unitPriceFor = (product, selections = {}) =>
  (Number(product?.price) || 0) + selectionExtras(product, selections);

/** Opciones elegidas, en el orden de los modificadores del producto. */
export function selectedOptionNames(product, selections = {}) {
  return (product?.modifiers || [])
    .map((group) => selections[group.title])
    .filter(Boolean);
}

export function cartItemKey(productId, selections = {}) {
  const sorted = Object.keys(selections).sort().map((k) => [k, selections[k]]);
  return `${productId}::${JSON.stringify(sorted)}`;
}

export function makeCartItem(product, selections = {}, quantity = 1) {
  return {
    key: cartItemKey(product.id, selections),
    productId: product.id,
    name: product.name,
    unitPrice: unitPriceFor(product, selections),
    quantity: clampQuantity(quantity),
    selections: { ...selections },
    optionsText: selectedOptionNames(product, selections).join(', ')
  };
}

export const clampQuantity = (q) => Math.max(1, Math.min(50, Math.floor(Number(q) || 1)));

/** Agrega un ítem al carrito; si ya existe con las mismas opciones, suma la cantidad. */
export function addToCart(cart, item) {
  const existing = cart.find((c) => c.key === item.key);
  if (!existing) return [...cart, item];
  return cart.map((c) => (c.key === item.key ? { ...c, quantity: clampQuantity(c.quantity + item.quantity) } : c));
}

/** Cambia la cantidad de un ítem (inmutable). Con cantidad <= 0 lo elimina. */
export function setCartQuantity(cart, key, quantity) {
  if (quantity <= 0) return cart.filter((c) => c.key !== key);
  return cart.map((c) => (c.key === key ? { ...c, quantity: clampQuantity(quantity) } : c));
}

export const cartSubtotal = (cart) => cart.reduce((sum, c) => sum + c.unitPrice * c.quantity, 0);
export const cartCount = (cart) => cart.reduce((sum, c) => sum + c.quantity, 0);

/** Lo único que viaja al servidor: id, cantidad y opciones (nunca precios). */
export const toOrderPayload = (cart) =>
  cart.map((c) => ({ productId: c.productId, quantity: c.quantity, selections: c.selections }));
