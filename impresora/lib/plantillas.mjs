/**
 * Cómo se ve cada trabajo de la fila en papel. El servidor manda los datos ya armados
 * (`payload`); aquí solo se acomodan al ancho del papel.
 */
import { Ticket } from './escpos.mjs';

const ZONA = 'America/Bogota';

export const hora = (iso) => {
  const d = iso ? new Date(iso) : new Date();
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', timeZone: ZONA });
};

export const fechaHora = (iso) => {
  const d = iso ? new Date(iso) : new Date();
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short', timeZone: ZONA });
};

/** $1.234.567, sin decimales, como en la app. */
export const pesos = (n) => `$${Math.round(Number(n) || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`;

const PAGOS = { efectivo: 'Efectivo', tarjeta: 'Tarjeta crédito/débito', transferencia: 'Transferencia / Nequi' };
const COMPROBANTES = { pos: 'Tiquete POS', electronica: 'Factura electrónica' };
const IMPUESTOS = { INC: 'Impuesto al consumo', IVA: 'IVA', NINGUNO: 'Impuesto' };

function comanda(t, p) {
  t.center().line(String(p.station || '').toUpperCase());
  t.bold().size(2, 2).line(`MESA ${p.tableLabel ?? ''}`).size(1, 1).bold(false);
  t.line(`Comanda ${p.orderId ?? ''} · ${hora(p.createdAt)}`);
  if (p.reprint) t.bold().line('*** REIMPRESIÓN ***').bold(false);
  t.left().sep('=');
  for (const it of p.items || []) {
    t.bold().size(1, 2).line(`${it.quantity} x ${it.name}`).size(1, 1).bold(false);
    const opts = (it.options || []).filter(Boolean);
    if (opts.length) t.line(`   ${opts.join(', ')}`);
  }
  if (p.notes) t.sep().bold().line(`Nota: ${p.notes}`).bold(false);
  t.sep('=').center().line(`Impresa ${hora()} · ${p.restaurant || ''}`);
  return t.feed(3).cut();
}

function tiquete(t, p, { cajon = false } = {}) {
  t.center().bold().line(p.restaurant || '').bold(false);
  if (p.nit) t.line(`NIT ${p.nit}`);
  if (p.address) t.line(p.address);
  if (p.phone) t.line(`Tel. ${p.phone}`);
  t.sep().bold().line(COMPROBANTES[p.kind] || 'Comprobante').line(`No. ${p.number || ''}`).bold(false);
  if (p.dianStatus === 'simulado') t.line('DOCUMENTO SIMULADO - SIN VALIDEZ FISCAL');
  t.left().sep();
  t.line(`Fecha: ${fechaHora(p.createdAt)}`);
  if (p.tableLabel) t.line(`Mesa: ${p.tableLabel}`);
  if (p.customer?.name) t.line(`Cliente: ${p.customer.name}`);
  if (p.customer?.docNumber) t.line(`${p.customer.docType || 'Doc.'}: ${p.customer.docNumber}`);
  t.line(`Pago: ${PAGOS[p.paymentMethod] || p.paymentMethod || ''}`);
  if (p.issuedByName) t.line(`Atendió: ${p.issuedByName}`);
  t.sep();
  for (const it of p.items || []) {
    t.lr(`${it.quantity} ${it.name}`, pesos(it.totalPrice));
    if (it.selectedOptions?.length) t.line(`  ${it.selectedOptions.join(', ')}`);
  }
  t.sep();
  t.lr('Consumo', pesos(p.itemsTotal));
  if (p.taxType && p.taxType !== 'NINGUNO') {
    t.lr('Base gravable', pesos(p.taxBase));
    t.lr(`${IMPUESTOS[p.taxType] || p.taxType} ${Number(p.taxRate) || 0} %`, pesos(p.tax));
  }
  if (Number(p.tip) > 0) t.lr('Propina voluntaria', pesos(p.tip));
  t.bold().size(1, 2).lr('TOTAL', pesos(p.total)).size(1, 1).bold(false);
  if (p.cufe) t.sep().line(`CUFE: ${p.cufe}`);
  if (p.footer) t.sep().center().line(p.footer);
  t.feed(3).cut();
  if (cajon && p.paymentMethod === 'efectivo') t.drawer();
  return t;
}

function prueba(t, p) {
  t.center().bold().size(2, 2).line('PRUEBA').size(1, 1).bold(false);
  t.line(p.restaurant || '').line(`Estación: ${p.station || ''}`);
  t.sep().left();
  t.line(`Si lees esto, la estación ${p.station || ''} quedó lista.`);
  t.line('Tildes: áéíóú ÁÉÍÓÚ ñÑ ¿¡ ü');
  t.lr('Alineado a la derecha', pesos(1234567));
  if (p.requestedBy) t.line(`Pedida por: ${p.requestedBy}`);
  t.line(`Hora: ${fechaHora(p.createdAt)}`);
  return t.feed(3).cut();
}

/** Trabajo de la fila → bytes para la impresora. */
export function renderTrabajo(job, { columnas = 48, codigos = 'cp858', cajon = false } = {}) {
  const t = new Ticket({ columnas, codigos });
  const p = job.payload || {};
  if (job.kind === 'comanda') comanda(t, p);
  else if (job.kind === 'tiquete') tiquete(t, p, { cajon });
  else if (job.kind === 'prueba') prueba(t, p);
  else throw new Error(`Tipo de trabajo desconocido: ${job.kind}`);
  return t.bytes();
}
