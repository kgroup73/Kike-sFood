import { Printer, AlertTriangle } from 'lucide-react';
import Modal from '../ui/Modal';
import QrCode from '../ui/QrCode';
import { formatCOP } from '../../lib/money';
import { PAYMENT_METHODS, INVOICE_KINDS, DIAN_STATUS } from '../../lib/billing';

const DIAN_QR_BASE = 'https://catalogo-vpfe.dian.gov.co/document/searchqr?documentkey=';

export default function TicketModal({ invoice, tenant, onClose }) {
  const status = DIAN_STATUS[invoice.dianStatus] || DIAN_STATUS.no_aplica;
  const isElectronic = invoice.kind === 'electronica';
  const date = new Date(invoice.createdAt).toLocaleString('es-CO');

  return (
    <Modal title="Vista previa de impresión" icon={<Printer className="w-4 h-4 text-slate-300" />} onClose={onClose} size="sm">
      <div className="print-area print-receipt bg-white text-slate-900 p-4 rounded-xl text-xs space-y-3 font-mono shadow-inner">
        <div className="text-center space-y-0.5">
          <h3 className="font-bold text-sm uppercase">{tenant.name}</h3>
          {tenant.nit && <p>NIT: {tenant.nit}</p>}
          {tenant.address && <p>{tenant.address}{tenant.city ? `, ${tenant.city}` : ''}</p>}
          {tenant.phone && <p>Tel: {tenant.phone}</p>}
          <p className="font-bold pt-1.5 border-t border-slate-200 mt-1">{INVOICE_KINDS[invoice.kind]}</p>
          <p className="text-[11px] font-bold">Nº {invoice.number}</p>
        </div>

        {invoice.dianStatus === 'simulado' && (
          <div className="border-2 border-dashed border-slate-900 p-1.5 text-center text-[10px] font-bold flex items-center justify-center gap-1">
            <AlertTriangle className="w-3 h-3" aria-hidden="true" /> DOCUMENTO SIMULADO — SIN VALIDEZ FISCAL
          </div>
        )}

        <div className="border-t border-b border-dashed border-slate-300 py-2 space-y-0.5 text-[11px]">
          <p>Fecha: {date}</p>
          {invoice.tableLabel && <p>Mesa: {invoice.tableLabel}</p>}
          {invoice.orderIds?.length > 0 && <p>{invoice.orderIds.length === 1 ? 'Comanda' : 'Comandas'}: {invoice.orderIds.map((id) => `#${id}`).join(', ')}</p>}
          <p>Cliente: {invoice.customer?.name}</p>
          <p>{invoice.customer?.docType || 'Doc'}: {invoice.customer?.docNumber}</p>
          <p>Pago: {PAYMENT_METHODS[invoice.paymentMethod] || invoice.paymentMethod}</p>
          {invoice.issuedByName && <p>Atendió: {invoice.issuedByName}</p>}
        </div>

        <div className="space-y-1 text-[11px]">
          {invoice.items.map((it, idx) => (
            <div key={idx}>
              <div className="flex justify-between gap-2">
                <span>{it.quantity}x {it.name}</span>
                <span>{formatCOP(it.totalPrice)}</span>
              </div>
              {it.selectedOptions?.length > 0 && <div className="text-[10px] text-slate-500 pl-3">{it.selectedOptions.join(', ')}</div>}
            </div>
          ))}
        </div>

        <dl className="border-t border-dashed border-slate-300 pt-2 space-y-0.5 text-[11px]">
          <div className="flex justify-between"><dt>Base gravable:</dt><dd>{formatCOP(invoice.taxBase)}</dd></div>
          <div className="flex justify-between"><dt>{invoice.taxType === 'NINGUNO' ? 'Impuesto' : invoice.taxType} ({invoice.taxRate}%):</dt><dd>{formatCOP(invoice.tax)}</dd></div>
          <div className="flex justify-between"><dt>Subtotal:</dt><dd>{formatCOP(invoice.itemsTotal)}</dd></div>
          <div className="flex justify-between"><dt>Propina voluntaria:</dt><dd>{formatCOP(invoice.tip)}</dd></div>
          <div className="flex justify-between font-bold text-xs pt-1 border-t border-slate-200"><dt>TOTAL:</dt><dd>{formatCOP(invoice.total)}</dd></div>
        </dl>

        {isElectronic && invoice.cufe && (
          <div className="text-[9px] break-all border-t border-slate-200 pt-2 space-y-1">
            <p className="font-bold">CUFE ({status.label}):</p>
            <p className="font-mono text-[8px] bg-slate-100 p-1 rounded">{invoice.cufe}</p>
            <QrCode value={`${DIAN_QR_BASE}${invoice.cufe}`} size={96} className="mx-auto" label="QR de consulta DIAN" />
          </div>
        )}

        {tenant.footerText && <div className="text-center text-[10px] text-slate-500 pt-2">{tenant.footerText}</div>}
      </div>

      <div className="flex gap-2 print-hidden">
        <button onClick={() => window.print()} className="w-full py-2.5 bg-orange-500 hover:bg-orange-600 active:scale-95 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow transition-all">
          <Printer className="w-4 h-4" aria-hidden="true" /> Imprimir
        </button>
        <button onClick={onClose} className="w-full py-2.5 bg-slate-800 text-slate-200 font-bold text-xs rounded-xl hover:bg-slate-700 border border-slate-700 transition-colors">
          Cerrar
        </button>
      </div>
    </Modal>
  );
}
