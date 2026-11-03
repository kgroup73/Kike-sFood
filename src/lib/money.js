/**
 * Dinero en pesos colombianos (COP). Todo se maneja en pesos enteros y se
 * redondea en un único lugar, igual que en la base de datos.
 */

export const toPesos = (value) => Math.round(Number(value) || 0);

export const formatCOP = (value) => '$' + toPesos(value).toLocaleString('es-CO');

/**
 * Desglosa un precio con impuesto incluido (el precio de carta).
 * En Colombia el precio exhibido al consumidor debe incluir impuestos, así que
 * el INC/IVA se extrae del total, no se suma encima.
 * @returns {{ base: number, tax: number, total: number }}
 */
export function splitTaxIncluded(total, ratePct) {
  const t = toPesos(total);
  const rate = Number(ratePct) || 0;
  if (rate <= 0) return { base: t, tax: 0, total: t };
  const base = Math.round(t / (1 + rate / 100));
  return { base, tax: t - base, total: t };
}

/** Propina voluntaria sobre el subtotal (no hace parte de la base gravable). */
export function computeTip(subtotal, ratePct = 10) {
  return Math.round((toPesos(subtotal) * (Number(ratePct) || 0)) / 100);
}

export const effectiveTaxRate = (tenant) =>
  !tenant || tenant.taxType === 'NINGUNO' ? 0 : Number(tenant.taxRate) || 0;
