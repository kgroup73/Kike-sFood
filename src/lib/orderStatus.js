// Estados de pedido. Deben coincidir con el CHECK de public.orders.
export const ORDER_STATUS = Object.freeze({
  PENDING: 'Pendiente',
  PREPARING: 'En Preparación',
  READY: 'Listo',
  TO_PAY: 'Por Cobrar',
  PAID: 'Cobrado',
  CANCELLED: 'Cancelado'
});

const TRANSITIONS = {
  [ORDER_STATUS.PENDING]: [ORDER_STATUS.PREPARING, ORDER_STATUS.CANCELLED],
  [ORDER_STATUS.PREPARING]: [ORDER_STATUS.READY, ORDER_STATUS.CANCELLED],
  [ORDER_STATUS.READY]: [ORDER_STATUS.TO_PAY, ORDER_STATUS.CANCELLED],
  [ORDER_STATUS.TO_PAY]: [ORDER_STATUS.PAID, ORDER_STATUS.CANCELLED]
};

export const canTransition = (from, to) => (TRANSITIONS[from] || []).includes(to);

/** Siguiente paso del flujo de cocina (botón principal de cada comanda). */
export const KITCHEN_NEXT_STEP = Object.freeze({
  [ORDER_STATUS.PENDING]: { to: ORDER_STATUS.PREPARING, label: 'Tomar orden' },
  [ORDER_STATUS.PREPARING]: { to: ORDER_STATUS.READY, label: 'Marcar lista' },
  [ORDER_STATUS.READY]: { to: ORDER_STATUS.TO_PAY, label: 'Pasar a caja' }
});

export const KITCHEN_STATUSES = [ORDER_STATUS.PENDING, ORDER_STATUS.PREPARING, ORDER_STATUS.READY];
export const OPEN_STATUSES = [...KITCHEN_STATUSES, ORDER_STATUS.TO_PAY];
