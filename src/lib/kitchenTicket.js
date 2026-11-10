/**
 * Documentos HTML para imprimir desde el navegador (respaldo del agente local, que usa
 * sus propias plantillas ESC/POS en impresora/lib/plantillas.mjs). Papel térmico de 80 mm.
 * Todo texto que viene de la base de datos se escapa: lo escriben el comensal y el personal.
 */
const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const escapeHtml = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ESC[c]);

const time = (iso) => {
  const d = iso ? new Date(iso) : new Date();
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
};

export function kitchenTicketHtml(order, { restaurant = '', reprint = false, station = '' } = {}) {
  const items = (order.items || [])
    .map((it) => {
      const opts = it.selectedOptions || it.options || [];
      return `<li><b>${escapeHtml(it.quantity)}</b><span>${escapeHtml(it.name)}${
        opts.length ? `<small>${opts.map(escapeHtml).join(', ')}</small>` : ''
      }</span></li>`;
    })
    .join('');
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Comanda ${escapeHtml(order.id)}</title>
<style>
@page { size: 80mm auto; margin: 3mm; }
* { box-sizing: border-box; }
body { margin: 0; width: 74mm; font: 13px/1.35 ui-monospace, Menlo, Consolas, monospace; color: #000; }
header { text-align: center; border-bottom: 2px dashed #000; padding-bottom: 6px; }
h1 { margin: 0; font-size: 34px; line-height: 1.1; }
p { margin: 2px 0; }
.meta { display: flex; justify-content: space-between; font-size: 12px; }
.re { margin-top: 4px; border: 2px solid #000; font-weight: bold; text-align: center; }
ul { list-style: none; margin: 8px 0; padding: 0; }
li { display: flex; gap: 8px; padding: 4px 0; font-size: 16px; font-weight: bold; }
li b { min-width: 24px; text-align: right; }
small { display: block; font-size: 12px; font-weight: normal; }
.notes { border-top: 2px dashed #000; padding-top: 6px; }
footer { border-top: 2px dashed #000; padding-top: 4px; text-align: center; font-size: 11px; }
</style></head><body>
<header><p>${escapeHtml(station ? station.toUpperCase() : restaurant)}</p><h1>Mesa ${escapeHtml(order.tableLabel)}</h1>
<div class="meta"><span>Comanda ${escapeHtml(order.id)}</span><span>${time(order.createdAt)}</span></div>
${reprint ? '<p class="re">REIMPRESIÓN</p>' : ''}</header>
<ul>${items}</ul>
${order.notes ? `<p class="notes">Nota: ${escapeHtml(order.notes)}</p>` : ''}
<footer>Impresa ${time()}${station && restaurant ? ` · ${escapeHtml(restaurant)}` : ''}</footer>
</body></html>`;
}

const pesos = (n) => `$${Math.round(Number(n) || 0).toLocaleString('es-CO')}`;
const PAGOS = { efectivo: 'Efectivo', tarjeta: 'Tarjeta crédito/débito', transferencia: 'Transferencia / Nequi' };
const COMPROBANTES = { pos: 'Tiquete POS', electronica: 'Factura electrónica' };

function simpleDoc(title, body) {
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>${escapeHtml(title)}</title>
<style>
@page { size: 80mm auto; margin: 3mm; }
body { margin: 0; width: 74mm; font: 12px/1.35 ui-monospace, Menlo, Consolas, monospace; color: #000; }
p { margin: 2px 0; } .c { text-align: center; } .b { font-weight: bold; } hr { border: 0; border-top: 1px dashed #000; }
.r { display: flex; justify-content: space-between; gap: 8px; } .big { font-size: 16px; font-weight: bold; }
</style></head><body>${body}</body></html>`;
}

/** Tiquete de caja desde los datos de la fila de impresión. */
export function receiptHtml(p) {
  const row = (l, r, cls = '') => `<div class="r ${cls}"><span>${escapeHtml(l)}</span><span>${escapeHtml(r)}</span></div>`;
  const items = (p.items || []).map((it) => row(`${it.quantity} ${it.name}`, pesos(it.totalPrice))).join('');
  const taxes = p.taxType && p.taxType !== 'NINGUNO' ? row('Base gravable', pesos(p.taxBase)) + row(`${p.taxType} ${Number(p.taxRate) || 0} %`, pesos(p.tax)) : '';
  return simpleDoc(
    `Tiquete ${p.number || ''}`,
    `<div class="c"><p class="b">${escapeHtml(p.restaurant)}</p>${p.nit ? `<p>NIT ${escapeHtml(p.nit)}</p>` : ''}${p.address ? `<p>${escapeHtml(p.address)}</p>` : ''}
<p class="b">${escapeHtml(COMPROBANTES[p.kind] || 'Comprobante')} · No. ${escapeHtml(p.number)}</p>${
      p.dianStatus === 'simulado' ? '<p class="b">DOCUMENTO SIMULADO — SIN VALIDEZ FISCAL</p>' : ''
    }</div><hr>
<p>Fecha: ${escapeHtml(new Date(p.createdAt).toLocaleString('es-CO'))}</p>${p.tableLabel ? `<p>Mesa: ${escapeHtml(p.tableLabel)}</p>` : ''}
<p>Cliente: ${escapeHtml(p.customer?.name || '')}</p><p>Pago: ${escapeHtml(PAGOS[p.paymentMethod] || p.paymentMethod || '')}</p><hr>${items}<hr>
${row('Consumo', pesos(p.itemsTotal))}${taxes}${Number(p.tip) > 0 ? row('Propina voluntaria', pesos(p.tip)) : ''}${row('TOTAL', pesos(p.total), 'big')}${
      p.footer ? `<hr><p class="c">${escapeHtml(p.footer)}</p>` : ''
    }`
  );
}

/** Cualquier trabajo de la fila → documento HTML para imprimir desde el navegador. */
export function printJobHtml(job) {
  const p = job.payload || {};
  if (job.kind === 'comanda') {
    return kitchenTicketHtml(
      { id: p.orderId, tableLabel: p.tableLabel, createdAt: p.createdAt, notes: p.notes, items: p.items },
      { restaurant: p.restaurant, reprint: !!p.reprint, station: p.station }
    );
  }
  if (job.kind === 'tiquete') return receiptHtml(p);
  return simpleDoc(
    'Prueba',
    `<div class="c"><p class="big">PRUEBA</p><p>${escapeHtml(p.restaurant)}</p><p>Estación: ${escapeHtml(p.station)}</p></div><hr>
<p>Si lees esto, la estación ${escapeHtml(p.station)} quedó lista en este navegador.</p><p>Tildes: áéíóú ñ ¿¡</p>`
  );
}
