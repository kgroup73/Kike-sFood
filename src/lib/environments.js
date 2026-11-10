// Plano de sala: ambientes (zonas físicas) y cómo se ubica cada mesa.
// Solo lógica pura; dónde se guarda vive en services/floorPlanStore.js.

export const TABLE_SHAPES = Object.freeze({
  square: 'Cuadrada',
  round: 'Redonda',
  bar: 'Barra'
});

export const DEFAULT_ENVIRONMENTS = Object.freeze([
  { id: 'salon', name: 'Salón Principal', defaultShape: 'square', defaultCapacity: 4 },
  { id: 'terraza', name: 'Terraza Exterior', defaultShape: 'round', defaultCapacity: 4 },
  { id: 'barra', name: 'Barra & Coctelería', defaultShape: 'bar', defaultCapacity: 2 }
]);

/** Copia editable de los ambientes por defecto (las constantes están congeladas). */
export const defaultEnvironments = () => DEFAULT_ENVIRONMENTS.map((env) => ({ ...env }));

/** Identificador estable a partir del nombre: "Terraza VIP" → "terraza-vip". */
export function environmentId(name) {
  return String(name || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Zona sugerida para una mesa que todavía no tiene ubicación guardada.
 * Mientras el restaurante no la configure, se reparte como un local típico:
 * etiquetas con "barra"/"terraza" van a esa zona; 7–10 a terraza y 11+ a barra.
 * Si la zona sugerida no existe en este restaurante, se usa la primera.
 */
function suggestedZone(label, environments) {
  const text = String(label).toLowerCase();
  const num = parseInt(label, 10);
  let zone = 'salon';
  if (text.includes('barra')) zone = 'barra';
  else if (text.includes('terraza')) zone = 'terraza';
  else if (!Number.isNaN(num) && num >= 11) zone = 'barra';
  else if (!Number.isNaN(num) && num >= 7) zone = 'terraza';
  return environments.some((env) => env.id === zone) ? zone : environments[0]?.id || 'salon';
}

/**
 * Ubicación efectiva de una mesa: lo guardado gana; si falta algo, se completa con
 * la sugerencia y con la forma/capacidad por defecto del ambiente.
 */
export function resolveTableLayout(table, saved = {}, environments = DEFAULT_ENVIRONMENTS) {
  const savedZoneExists = saved.zone && environments.some((env) => env.id === saved.zone);
  const zone = savedZoneExists ? saved.zone : suggestedZone(table.label, environments);
  const env = environments.find((e) => e.id === zone);
  return {
    zone,
    shape: TABLE_SHAPES[saved.shape] ? saved.shape : env?.defaultShape || 'square',
    capacity: Number(saved.capacity) > 0 ? Number(saved.capacity) : env?.defaultCapacity || 4
  };
}
