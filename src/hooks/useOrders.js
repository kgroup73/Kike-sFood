import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../services/api';

/**
 * Pedidos abiertos del restaurante (cocina y caja), sincronizados en tiempo real.
 * Resiliente ante concurrencia y cambios rápidos de sede mediante AbortController.
 */
export function useOrders(tenantId, { onNewOrder } = {}) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const debounce = useRef(null);
  const activeControllerRef = useRef(null);

  // Ref para que la suscripción use siempre el callback actual (sin closures viejos).
  const onNewOrderRef = useRef(onNewOrder);
  useEffect(() => {
    onNewOrderRef.current = onNewOrder;
  }, [onNewOrder]);

  const reload = useCallback(async () => {
    if (!tenantId) {
      setOrders([]);
      setLoading(false);
      return;
    }

    // Cancelar cualquier petición en vuelo previa para evitar race conditions
    activeControllerRef.current?.abort();
    const controller = new AbortController();
    activeControllerRef.current = controller;

    try {
      const data = await api.listOpenOrders(tenantId, { signal: controller.signal });
      if (!controller.signal.aborted) {
        setOrders(data || []);
        setError(null);
      }
    } catch (err) {
      if (!controller.signal.aborted && err?.name !== 'AbortError') {
        setError(err.message || 'Error al cargar pedidos');
      }
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  }, [tenantId]);

  useEffect(() => {
    setLoading(true);
    reload();

    if (!tenantId) return undefined;

    const schedule = () => {
      clearTimeout(debounce.current);
      debounce.current = setTimeout(reload, 200);
    };

    const unsubscribe = api.subscribeOrders(tenantId, {
      onInsert: (row) => {
        onNewOrderRef.current?.(row);
        schedule();
      },
      onChange: schedule
    });

    return () => {
      clearTimeout(debounce.current);
      activeControllerRef.current?.abort();
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [tenantId, reload]);

  const updateStatus = useCallback(
    async (orderId, status) => {
      // Optimista; si el servidor rechaza el cambio se recarga el estado real.
      setOrders((list) => list.map((o) => (o.id === orderId ? { ...o, status } : o)));
      try {
        await api.updateOrderStatus(orderId, status);
      } catch (err) {
        reload();
        throw err;
      }
    },
    [reload]
  );

  return { orders, loading, error, reload, updateStatus };
}
