import { useCallback, useEffect, useState } from 'react';
import { api } from '../services/api';
import { defaultEnvironments, environmentId, resolveTableLayout } from '../lib/environments';

/**
 * Plano de sala del restaurante (ambientes + ubicación de cada mesa), sincronizado
 * entre la administración y la caja. No sabe dónde se guarda: solo usa `api.*`.
 */
export function useFloorPlan(tenantId) {
  const [plan, setPlan] = useState(() => ({ environments: defaultEnvironments(), tables: {} }));
  const [error, setError] = useState(null);

  const reload = useCallback(async () => {
    if (!tenantId) return;
    try {
      setPlan(await api.getFloorPlan(tenantId));
      setError(null);
    } catch (err) {
      setError(err.message);
    }
  }, [tenantId]);

  useEffect(() => {
    reload();
    if (!tenantId) return undefined;
    return api.subscribeFloorPlan(tenantId, reload);
  }, [tenantId, reload]);

  const { environments, tables: saved } = plan;

  /** Ubicación efectiva de una mesa (lo guardado o la sugerencia por defecto). */
  const layoutOf = useCallback((table) => resolveTableLayout(table, saved[table.id], environments), [saved, environments]);

  /** Crea un ambiente; devuelve su id. Lanza error si ya existe. */
  const addEnvironment = useCallback(
    async (name) => {
      const trimmed = String(name || '').trim();
      const id = environmentId(trimmed);
      if (!id) throw new Error('Escribe un nombre para el ambiente');
      if (environments.some((env) => env.id === id || env.name.toLowerCase() === trimmed.toLowerCase())) {
        throw new Error('Ya existe un ambiente con ese nombre');
      }
      await api.saveEnvironments(tenantId, [...environments, { id, name: trimmed, defaultShape: 'square', defaultCapacity: 4 }]);
      return id;
    },
    [tenantId, environments]
  );

  /** Guarda zona/forma/capacidad de una o varias mesas: `{ [tableId]: patch }`. */
  const saveLayout = useCallback((updates) => api.saveTableLayout(tenantId, updates), [tenantId]);

  return { environments, layoutOf, addEnvironment, saveLayout, error, reload };
}
