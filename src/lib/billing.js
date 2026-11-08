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
  for (const order of orders) {
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
      const orders = [...g.orders].sort((a, b) => a.id - b.id);
      return { ...g, orders, ...sumOrders(orders) };
    })
    .sort((a, b) => a.orders[0].id - b.orders[0].id);
}

export function sumOrders(orders) {
  const subtotal = orders.reduce((s, o) => s + o.subtotal, 0);
  const tip = orders.reduce((s, o) => s + o.tip, 0);
  return { subtotal, tip, total: subtotal + tip };
}

/** Une las líneas iguales (platillo, precio y opciones) de varias comandas. Igual que issue_invoice(). */
export function mergeInvoiceItems(orders) {
  const lines = new Map();
  for (const order of orders) {
    for (const it of order.items) {
      const options = it.selectedOptions || [];
      const key = JSON.stringify([it.name, it.unitPrice, options]);
      const line = lines.get(key);
      if (line) {
        line.quantity += it.quantity;
        line.totalPrice += it.totalPrice;
      } else {
        lines.set(key, { name: it.name, quantity: it.quantity, unitPrice: it.unitPrice, totalPrice: it.totalPrice, selectedOptions: [...options] });
      }
    }
  }
  return [...lines.values()].sort((a, b) => a.name.localeCompare(b.name) || a.unitPrice - b.unitPrice);
}
