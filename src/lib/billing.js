export const PAYMENT_METHODS = Object.freeze({
  efectivo: 'Efectivo',
  tarjeta: 'Tarjeta crédito/débito',
  transferencia: 'Transferencia / Nequi'
});

export const INVOICE_KINDS = Object.freeze({
  pos: 'Tiquete POS',
  electronica: 'Factura electrónica'
});

export const DIAN_STATUS = Object.freeze({
  no_aplica: { label: 'No aplica', tone: 'neutral' },
  simulado: { label: 'SIMULADO — sin validez fiscal', tone: 'warning' },
  pendiente: { label: 'Pendiente de envío', tone: 'warning' },
  aceptada: { label: 'Aceptada por la DIAN', tone: 'success' },
  rechazada: { label: 'Rechazada por la DIAN', tone: 'danger' }
});

export const TAX_TYPES = Object.freeze({
  INC: { label: 'Impuesto Nacional al Consumo (INC)', defaultRate: 8 },
  IVA: { label: 'IVA', defaultRate: 19 },
  NINGUNO: { label: 'No responsable de impuesto al consumo', defaultRate: 0 }
});

export const CONSUMIDOR_FINAL = Object.freeze({ name: 'Consumidor Final', docType: 'CC', docNumber: '222222222222' });

export const DOC_TYPES = ['CC', 'NIT', 'CE', 'PP', 'TI', 'NUIP'];

const tableKey = (order) => (order.tableId ? `id:${order.tableId}` : `label:${order.tableLabel}`);

/**
 * Agrupa las comandas abiertas por mesa para la caja. Cada grupo lleva las
 * comandas listas para cobrar y cuántas siguen en cocina.
 * Solo aparecen las mesas con al menos una comanda en "Por Cobrar".
 */
export function groupOrdersByTable(orders, { toPay = 'Por Cobrar', closed = ['Cobrado', 'Cancelado'] } = {}) {
  const groups = new Map();
  for (const order of orders || []) {
    if (closed.includes(order.status)) continue;
    const key = tableKey(order);
    if (!groups.has(key)) groups.set(key, { key, tableLabel: order.tableLabel, orders: [], inKitchen: 0 });
    const g = groups.get(key);
    if (order.status === toPay) g.orders.push(order);
    else g.inKitchen += 1;
  }
  return [...groups.values()]
    .filter((g) => g.orders.length > 0)
    .map((g) => {
      const orders = g.orders.toSorted((a, b) => a.id - b.id);
      return { ...g, orders, ...sumOrders(orders) };
    })
    .toSorted((a, b) => a.orders[0].id - b.orders[0].id);
}

export function sumOrders(orders) {
  const subtotal = (orders || []).reduce((s, o) => s + (o.subtotal || 0), 0);
  const tip = (orders || []).reduce((s, o) => s + (o.tip || 0), 0);
  return { subtotal, tip, total: subtotal + tip };
}

/**
 * Agrupa todas las mesas con pedidos activos en sala (en cocina o en caja) para
 * supervisión integral y cobro directo sin esperar confirmación de cocina.
 */
export function groupAllActiveTables(orders, { closed = ['Cobrado', 'Cancelado'] } = {}) {
  const groups = new Map();
  for (const order of orders || []) {
    if (closed.includes(order.status)) continue;
    const key = tableKey(order);
    if (!groups.has(key)) {
      groups.set(key, {
        key,
        tableLabel: order.tableLabel,
        tableId: order.tableId,
        orders: []
      });
    }
    groups.get(key).orders.push(order);
  }
  return [...groups.values()]
    .map((g) => {
      const sortedOrders = g.orders.toSorted((a, b) => a.id - b.id);
      const toPayOrders = sortedOrders.filter((o) => o.status === 'Por Cobrar');
      const kitchenOrders = sortedOrders.filter((o) => o.status !== 'Por Cobrar');
      const totals = sumOrders(sortedOrders);
      return {
        ...g,
        orders: sortedOrders,
        toPayOrders,
        kitchenOrders,
        isReadyToPay: kitchenOrders.length === 0 && toPayOrders.length > 0,
        hasKitchenOrders: kitchenOrders.length > 0,
        ...totals
      };
    })
    .sort((a, b) => {
      if (a.isReadyToPay && !b.isReadyToPay) return -1;
      if (!a.isReadyToPay && b.isReadyToPay) return 1;
      return String(a.tableLabel).localeCompare(String(b.tableLabel), undefined, { numeric: true });
    });
}

/** Une las líneas iguales (platillo, precio y opciones) de varias comandas. Igual que issue_invoice(). */
export function mergeInvoiceItems(orders) {
  const lines = new Map();
  for (const order of orders || []) {
    for (const it of order.items || []) {
      const billed = Number(it.billedQuantity) || 0;
      const unbilled = Math.max(0, it.quantity - billed);
      if (unbilled <= 0) continue;
      const options = it.selectedOptions || [];
      const key = JSON.stringify([it.name, it.unitPrice, options]);
      const line = lines.get(key);
      if (line) {
        line.quantity += unbilled;
        line.totalPrice += unbilled * it.unitPrice;
      } else {
        lines.set(key, { name: it.name, quantity: unbilled, unitPrice: it.unitPrice, totalPrice: unbilled * it.unitPrice, selectedOptions: [...options] });
      }
    }
  }
  return [...lines.values()].sort((a, b) => a.name.localeCompare(b.name) || a.unitPrice - b.unitPrice);
}

/**
 * Extrae y desglosa todos los platillos pendientes de cobro de un grupo de comandas.
 * Considera billedQuantity para no cobrar platillos que ya fueron saldados previamente.
 */
export function getPendingItemsForOrders(orders) {
  const pending = [];
  for (const order of orders || []) {
    for (const it of order.items || []) {
      const billed = Number(it.billedQuantity) || 0;
      const unbilledQty = Math.max(0, it.quantity - billed);
      if (unbilledQty > 0) {
        pending.push({
          id: it.id || `${order.id}-${it.name}-${it.unitPrice}`,
          orderId: order.id,
          name: it.name,
          unitPrice: it.unitPrice,
          quantity: unbilledQty,
          maxQuantity: unbilledQty,
          totalPrice: unbilledQty * it.unitPrice,
          selectedOptions: it.selectedOptions || []
        });
      }
    }
  }
  return pending;
}
