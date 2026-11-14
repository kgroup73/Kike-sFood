import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../services/api';
import { buildMasterIngredientList, deriveProductsWithStock } from '../lib/inventory';

/**
 * Carta del restaurante con agotados en tiempo real.
 * Resiliente ante concurrencia, cambios de carta y peticiones solapadas.
 */
export function useMenu(tenantId) {
  const [state, setState] = useState({ categories: [], products: [], ingredientsStock: {}, loading: true, error: null });
  const debounce = useRef(null);
  const activeControllerRef = useRef(null);

  const reload = useCallback(async () => {
    if (!tenantId) {
      setState({ categories: [], products: [], ingredientsStock: {}, loading: false, error: null });
      return;
    }

    // Cancelar cualquier petición previa en vuelo
    activeControllerRef.current?.abort();
    const controller = new AbortController();
    activeControllerRef.current = controller;

    try {
      const menu = await api.getMenu(tenantId, { signal: controller.signal });
      if (!controller.signal.aborted) {
        setState({ ...menu, loading: false, error: null });
      }
    } catch (err) {
      if (!controller.signal.aborted && err?.name !== 'AbortError') {
        setState((s) => ({ ...s, loading: false, error: err.message || 'Error al cargar carta' }));
      }
    }
  }, [tenantId]);

  useEffect(() => {
    setState((s) => ({ ...s, loading: true }));
    reload();

    if (!tenantId) return undefined;

    const unsubscribe = api.subscribeMenu(tenantId, () => {
      clearTimeout(debounce.current);
      debounce.current = setTimeout(reload, 250);
    });

    return () => {
      clearTimeout(debounce.current);
      activeControllerRef.current?.abort();
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [tenantId, reload]);

  const productsWithStock = useMemo(
    () => deriveProductsWithStock(state.products, state.ingredientsStock),
    [state.products, state.ingredientsStock]
  );
  const masterIngredients = useMemo(() => buildMasterIngredientList(state.products), [state.products]);

  return { ...state, productsWithStock, masterIngredients, reload };
}
