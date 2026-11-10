import { defaultEnvironments, TABLE_SHAPES } from '../lib/environments';

/**
 * Almacén del plano de sala: ambientes + ubicación (zona, forma, capacidad) de cada mesa.
 *
 * HOY se guarda en localStorage de este navegador, separado por restaurante.
 * Tanto demoApi como supabaseApi exponen estas mismas funciones, así que los
 * componentes solo hablan con `api.*`. Para llevarlo a Supabase basta con
 * reimplementarlas en supabaseApi (ver docs/plano-sala-supabase.md); las vistas no cambian.
 *
 * Forma de los datos (igual a lo que devolverá Supabase):
 *   { environments: [{ id, name, defaultShape, defaultCapacity }],
 *     tables: { [tableId]: { zone?, shape?, capacity? } } }
 */
const VERSION = 1;
const CHANGE_EVENT = 'kikes:floor-plan';
const storageKey = (tenantId) => `kikes:floor-plan:v${VERSION}:${tenantId}`;

function read(tenantId) {
  try {
    const raw = localStorage.getItem(storageKey(tenantId));
    const data = raw ? JSON.parse(raw) : null;
    if (data && typeof data === 'object') {
      return {
        environments: Array.isArray(data.environments) && data.environments.length ? data.environments : defaultEnvironments(),
        tables: data.tables && typeof data.tables === 'object' ? data.tables : {}
      };
    }
  } catch {
    // Datos corruptos o almacenamiento bloqueado: se usa el plano por defecto.
  }
  return { environments: defaultEnvironments(), tables: {} };
}

function write(tenantId, plan) {
  try {
    localStorage.setItem(storageKey(tenantId), JSON.stringify({ version: VERSION, ...plan }));
  } catch {
    throw new Error('No se pudo guardar el plano de sala en este navegador');
  }
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: { tenantId } }));
}

function cleanLayout(patch) {
  const out = {};
  if (typeof patch.zone === 'string' && patch.zone) out.zone = patch.zone;
  if (TABLE_SHAPES[patch.shape]) out.shape = patch.shape;
  const capacity = Number(patch.capacity);
  if (Number.isInteger(capacity) && capacity > 0 && capacity <= 50) out.capacity = capacity;
  return out;
}

function requireTenant(tenantId) {
  if (!tenantId) throw new Error('Falta el restaurante del plano de sala');
}

export const localFloorPlanStore = {
  async getFloorPlan(tenantId) {
    requireTenant(tenantId);
    return read(tenantId);
  },

  /** Reemplaza la lista completa de ambientes. */
  async saveEnvironments(tenantId, environments) {
    requireTenant(tenantId);
    const list = (environments || [])
      .filter((env) => env && env.id && String(env.name || '').trim())
      .map((env) => ({
        id: String(env.id),
        name: String(env.name).trim().slice(0, 40),
        defaultShape: TABLE_SHAPES[env.defaultShape] ? env.defaultShape : 'square',
        defaultCapacity: Number(env.defaultCapacity) > 0 ? Number(env.defaultCapacity) : 4
      }));
    if (!list.length) throw new Error('Debe quedar al menos un ambiente');
    if (new Set(list.map((e) => e.id)).size !== list.length) throw new Error('Hay ambientes repetidos');
    const plan = read(tenantId);
    write(tenantId, { ...plan, environments: list });
  },

  /** Actualiza la ubicación de varias mesas: `{ [tableId]: { zone, shape, capacity } | null }` (null la borra). */
  async saveTableLayout(tenantId, updates) {
    requireTenant(tenantId);
    const plan = read(tenantId);
    const tables = { ...plan.tables };
    for (const [tableId, patch] of Object.entries(updates || {})) {
      if (patch === null) delete tables[tableId];
      else tables[tableId] = { ...tables[tableId], ...cleanLayout(patch) };
    }
    write(tenantId, { ...plan, tables });
  },

  /** Avisa cuando el plano cambia en esta pestaña o en otra del mismo navegador. */
  subscribeFloorPlan(tenantId, onChange) {
    const key = storageKey(tenantId);
    const onLocal = (e) => e.detail?.tenantId === tenantId && onChange();
    const onStorage = (e) => e.key === key && onChange();
    window.addEventListener(CHANGE_EVENT, onLocal);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener(CHANGE_EVENT, onLocal);
      window.removeEventListener('storage', onStorage);
    };
  }
};
