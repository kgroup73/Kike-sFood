import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../services/api';

/** Pedidos abiertos del restaurante (cocina y caja), sincronizados en tiempo real. */
export function useOrders(tenantId, { onNewOrder } = {}) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const debounce = useRef(null);
  // Ref para que la suscripción use siempre el callback actual (sin closures viejos).
  const onNewOrderRef = useRef(onNewOrder);
  useEffect(() => {
    onNewOrderRef.current = onNewOrder;
  }, [onNewOrder]);

  const reload = useCallback(async () => {
    if (!tenantId) return;
    try {
      setOrders(await api.listOpenOrders(tenantId));
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
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
      unsubscribe();
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
