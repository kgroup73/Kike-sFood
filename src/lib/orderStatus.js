// Estados de pedido. Deben coincidir con el CHECK de public.orders.
export const ORDER_STATUS = Object.freeze({
  PENDING: 'Pendiente',
  PREPARING: 'En Preparación',
  READY: 'Listo',
  TO_PAY: 'Por Cobrar',
  PAID: 'Cobrado',
  // Final sin caja (plan Intermedio): la comanda se entregó y se cobra por fuera del sistema.
  DELIVERED: 'Entregado',
  CANCELLED: 'Cancelado'
});

const TRANSITIONS = {
  [ORDER_STATUS.PENDING]: [ORDER_STATUS.PREPARING, ORDER_STATUS.CANCELLED],
  [ORDER_STATUS.PREPARING]: [ORDER_STATUS.READY, ORDER_STATUS.CANCELLED],
  [ORDER_STATUS.READY]: [ORDER_STATUS.TO_PAY, ORDER_STATUS.DELIVERED, ORDER_STATUS.CANCELLED],
  [ORDER_STATUS.TO_PAY]: [ORDER_STATUS.PAID, ORDER_STATUS.CANCELLED]
};

/**
 * ¿Se permite el cambio? Con caja (`withPos`) lo listo pasa a caja; sin caja se
 * entrega. La base de datos (enforce_order_status) aplica la misma regla.
 */
export function canTransition(from, to, { withPos = true } = {}) {
  if (!(TRANSITIONS[from] || []).includes(to)) return false;
  if (from === ORDER_STATUS.READY && to === ORDER_STATUS.TO_PAY) return withPos;
  if (from === ORDER_STATUS.READY && to === ORDER_STATUS.DELIVERED) return !withPos;
  return true;
}

/** Siguiente paso de cada comanda (botón principal en cocina). El último depende de si hay caja. */
export function kitchenNextStep(status, { withPos = true } = {}) {
  if (status === ORDER_STATUS.PENDING) return { to: ORDER_STATUS.PREPARING, label: 'Tomar orden' };
  if (status === ORDER_STATUS.PREPARING) return { to: ORDER_STATUS.READY, label: 'Marcar lista' };
  if (status === ORDER_STATUS.READY) {
    return withPos ? { to: ORDER_STATUS.TO_PAY, label: 'Pasar a caja' } : { to: ORDER_STATUS.DELIVERED, label: 'Entregada' };
  }
  return null;
}

/** Destino final de una comanda que sale de la cocina: caja si la hay, entregada si no. */
export const finalKitchenStatus = ({ withPos = true } = {}) => (withPos ? ORDER_STATUS.TO_PAY : ORDER_STATUS.DELIVERED);

/** Pasos que faltan para llevar una comanda abierta hasta `to` (el servidor exige ir de uno en uno). */
export function stepsTo(from, to) {
  const chain = [ORDER_STATUS.PENDING, ORDER_STATUS.PREPARING, ORDER_STATUS.READY];
  const i = chain.indexOf(from);
  if (i === -1 || ![ORDER_STATUS.TO_PAY, ORDER_STATUS.DELIVERED].includes(to)) return [];
  return [...chain.slice(i + 1), to];
}

export const KITCHEN_STATUSES = [ORDER_STATUS.PENDING, ORDER_STATUS.PREPARING, ORDER_STATUS.READY];
export const OPEN_STATUSES = [...KITCHEN_STATUSES, ORDER_STATUS.TO_PAY];
