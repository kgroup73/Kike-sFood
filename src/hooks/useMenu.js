import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../services/api';
import { buildMasterIngredientList, deriveProductsWithStock } from '../lib/inventory';

/** Carta del restaurante con agotados en tiempo real. */
export function useMenu(tenantId) {
  const [state, setState] = useState({ categories: [], products: [], ingredientsStock: {}, loading: true, error: null });
  const debounce = useRef(null);

  const reload = useCallback(async () => {
    if (!tenantId) return;
    try {
      const menu = await api.getMenu(tenantId);
      setState({ ...menu, loading: false, error: null });
    } catch (err) {
      setState((s) => ({ ...s, loading: false, error: err.message }));
    }
  }, [tenantId]);

  useEffect(() => {
    reload();
    if (!tenantId) return undefined;
    const unsubscribe = api.subscribeMenu(tenantId, () => {
      clearTimeout(debounce.current);
      debounce.current = setTimeout(reload, 250);
    });
    return () => {
      clearTimeout(debounce.current);
      unsubscribe();
    };
  }, [tenantId, reload]);

  const productsWithStock = useMemo(
    () => deriveProductsWithStock(state.products, state.ingredientsStock),
    [state.products, state.ingredientsStock]
  );
  const masterIngredients = useMemo(() => buildMasterIngredientList(state.products), [state.products]);

  return { ...state, productsWithStock, masterIngredients, reload };
}
