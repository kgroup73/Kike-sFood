/**
 * Dinero en pesos colombianos (COP). Todo se maneja en pesos enteros y se
 * redondea en un único lugar, igual que en la base de datos.
 */

export const toPesos = (value) => Math.round(Number(value) || 0);

// Instancia única y pre-compilada de Intl.NumberFormat para evitar recreaciones en cada render.
const copNumberFormatter = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 });

export const formatCOP = (value) => '$' + copNumberFormatter.format(toPesos(value));

// Instancia nativa de Intl.RelativeTimeFormat para tiempos en lenguaje natural ("hace 5 minutos", "ahora").
const rtf = new Intl.RelativeTimeFormat('es-CO', { numeric: 'auto' });

export function formatRelativeTime(isoDate, now = Date.now()) {
  if (!isoDate) return '';
  const dateMs = typeof isoDate === 'number' ? isoDate : new Date(isoDate).getTime();
  if (Number.isNaN(dateMs)) return '';
  const diffSec = Math.round((dateMs - (typeof now === 'number' ? now : new Date(now).getTime())) / 1000);
  const absSec = Math.abs(diffSec);

  if (absSec < 45) return 'ahora';
  const diffMin = Math.round(diffSec / 60);
  if (Math.abs(diffMin) < 60) return rtf.format(diffMin, 'minute');
  const diffHour = Math.round(diffMin / 60);
  if (Math.abs(diffHour) < 24) return rtf.format(diffHour, 'hour');
  const diffDay = Math.round(diffHour / 24);
  return rtf.format(diffDay, 'day');
}

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
