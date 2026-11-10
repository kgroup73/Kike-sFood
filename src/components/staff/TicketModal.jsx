import { useState } from 'react';
import { Printer, AlertTriangle } from 'lucide-react';
import Modal from '../ui/Modal';
import QrCode from '../ui/QrCode';
import { formatCOP } from '../../lib/money';
import { PAYMENT_METHODS, INVOICE_KINDS, DIAN_STATUS } from '../../lib/billing';

const DIAN_QR_BASE = 'https://catalogo-vpfe.dian.gov.co/document/searchqr?documentkey=';

export default function TicketModal({ invoice, tenant, onClose, receiptStation = null, onSendToPrinter }) {
  const [sending, setSending] = useState(false);
  const status = DIAN_STATUS[invoice.dianStatus] || DIAN_STATUS.no_aplica;
  const isElectronic = invoice.kind === 'electronica';
  const date = new Date(invoice.createdAt).toLocaleString('es-CO');

  return (
    <Modal title="Vista previa de impresión" icon={<Printer />} onClose={onClose} size="sm">
      <div className="bg-mantel -mx-5 sm:-mx-6 px-5 sm:px-6 py-6 print:bg-transparent print:p-0 print:m-0">
      <div className="print-area print-receipt bg-white text-neutral-900 p-5 rounded-sm text-xs space-y-3 font-mono shadow-[0_6px_20px_rgb(30_43_36/0.15)] max-w-[300px] mx-auto">
        <div className="text-center space-y-0.5">
          <h3 className="font-bold text-sm uppercase">{tenant.name}</h3>
          {tenant.nit && <p>NIT: {tenant.nit}</p>}
          {tenant.address && <p>{tenant.address}{tenant.city ? `, ${tenant.city}` : ''}</p>}
          {tenant.phone && <p>Tel: {tenant.phone}</p>}
          <p className="font-bold pt-1.5 border-t border-neutral-200 mt-1">{INVOICE_KINDS[invoice.kind]}</p>
          <p className="text-[11px] font-bold">Nº {invoice.number}</p>
        </div>

        {invoice.dianStatus === 'simulado' && (
          <div className="border-2 border-dashed border-neutral-900 p-1.5 text-center text-[10px] font-bold flex items-center justify-center gap-1">
            <AlertTriangle className="w-3 h-3" aria-hidden="true" /> DOCUMENTO SIMULADO — SIN VALIDEZ FISCAL
          </div>
        )}

        <div className="border-t border-b border-dashed border-neutral-300 py-2 space-y-0.5 text-[11px]">
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
              {it.selectedOptions?.length > 0 && <div className="text-[10px] text-neutral-500 pl-3">{it.selectedOptions.join(', ')}</div>}
            </div>
          ))}
        </div>

        <dl className="border-t border-dashed border-neutral-300 pt-2 space-y-0.5 text-[11px]">
          <div className="flex justify-between"><dt>Base gravable:</dt><dd>{formatCOP(invoice.taxBase)}</dd></div>
          <div className="flex justify-between"><dt>{invoice.taxType === 'NINGUNO' ? 'Impuesto' : invoice.taxType} ({invoice.taxRate}%):</dt><dd>{formatCOP(invoice.tax)}</dd></div>
          <div className="flex justify-between"><dt>Subtotal:</dt><dd>{formatCOP(invoice.itemsTotal)}</dd></div>
          <div className="flex justify-between"><dt>Propina voluntaria:</dt><dd>{formatCOP(invoice.tip)}</dd></div>
          <div className="flex justify-between font-bold text-xs pt-1 border-t border-neutral-200"><dt>TOTAL:</dt><dd>{formatCOP(invoice.total)}</dd></div>
        </dl>

        {isElectronic && invoice.cufe && (
          <div className="text-[9px] break-all border-t border-neutral-200 pt-2 space-y-1">
            <p className="font-bold">CUFE ({status.label}):</p>
            <p className="font-mono text-[8px] bg-neutral-100 p-1 rounded">{invoice.cufe}</p>
            <QrCode value={`${DIAN_QR_BASE}${invoice.cufe}`} size={96} className="mx-auto" label="QR de consulta DIAN" />
          </div>
        )}

        {tenant.footerText && <div className="text-center text-[10px] text-neutral-500 pt-2">{tenant.footerText}</div>}
      </div>

      </div>

      <div className="flex flex-wrap gap-2 print-hidden">
        {receiptStation ? (
          <>
            {/* Va a la fila de impresión: lo imprime el agente de la caja, sin vista previa. */}
            <button
              disabled={sending}
              onClick={async () => {
                setSending(true);
                try {
                  await onSendToPrinter();
                } finally {
                  setSending(false);
                }
              }}
              className="btn btn-primary flex-1"
            >
              <Printer className="w-4 h-4" aria-hidden="true" /> {sending ? 'Enviando…' : `Imprimir en ${receiptStation}`}
            </button>
            <button onClick={() => window.print()} className="btn btn-quiet flex-1">
              Desde este equipo
            </button>
          </>
        ) : (
          <button onClick={() => window.print()} className="btn btn-primary flex-1">
            <Printer className="w-4 h-4" aria-hidden="true" /> Imprimir
          </button>
        )}
        <button onClick={onClose} className="btn btn-quiet flex-1">
          Cerrar
        </button>
      </div>
    </Modal>
  );
}
