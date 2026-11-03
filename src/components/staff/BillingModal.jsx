import { useState } from 'react';
import { Lock, Receipt, Loader2 } from 'lucide-react';
import Modal from '../ui/Modal';
import { formatCOP, splitTaxIncluded, effectiveTaxRate } from '../../lib/money';
import { PAYMENT_METHODS, INVOICE_KINDS, CONSUMIDOR_FINAL } from '../../lib/billing';

export default function BillingModal({ order, tenant, customers, canDian, onClose, onNewCustomer, onIssue }) {
  const [kind, setKind] = useState(canDian ? 'electronica' : 'pos');
  const [customerId, setCustomerId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('efectivo');
  const [submitting, setSubmitting] = useState(false);

  // Vista previa: el cálculo definitivo lo hace issue_invoice() en el servidor.
  const rate = effectiveTaxRate(tenant);
  const { base, tax } = splitTaxIncluded(order.subtotal, rate);
  const total = order.subtotal + order.tip;

  const submit = async () => {
    setSubmitting(true);
    try {
      await onIssue({ orderId: order.id, kind, customerId: customerId || null, paymentMethod });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal title={`Cobrar comanda #${order.id} · Mesa ${order.tableLabel}`} icon={<Receipt className="w-5 h-5 text-emerald-400" />} onClose={onClose}>
      <div className="space-y-3 text-xs">
        <label className="block text-slate-400">
          Tipo de comprobante
          <select value={kind} onChange={(e) => setKind(e.target.value)} className="mt-1 w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-emerald-500">
            <option value="pos">{INVOICE_KINDS.pos}</option>
            <option value="electronica" disabled={!canDian}>
              {INVOICE_KINDS.electronica} {!canDian ? '— requiere plan Premium y resolución vigente' : '(simulada)'}
            </option>
          </select>
        </label>
        {!canDian && (
          <p className="text-[10px] text-amber-400/80 flex items-center gap-1">
            <Lock className="w-3 h-3" aria-hidden="true" /> La factura electrónica requiere plan Premium y una resolución configurada en Administración.
          </p>
        )}

        <div>
          <div className="flex justify-between items-center mb-1">
            <label htmlFor="billing-customer" className="text-slate-400">Cliente / adquirente</label>
            <button onClick={onNewCustomer} className="text-orange-500 hover:underline text-[11px] font-semibold">+ Nuevo cliente</button>
          </div>
          <select id="billing-customer" value={customerId} onChange={(e) => setCustomerId(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-emerald-500">
            <option value="">{CONSUMIDOR_FINAL.name} ({CONSUMIDOR_FINAL.docNumber})</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.docType} {c.docNumber})
              </option>
            ))}
          </select>
        </div>

        <label className="block text-slate-400">
          Método de pago
          <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="mt-1 w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-emerald-500">
            {Object.entries(PAYMENT_METHODS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </label>
      </div>

      <dl className="bg-slate-950 p-3.5 rounded-xl border border-slate-800/80 space-y-1.5 text-xs">
        <div className="flex justify-between text-slate-300"><dt>Consumo (impuesto incluido):</dt><dd>{formatCOP(order.subtotal)}</dd></div>
        <div className="flex justify-between text-slate-500 pl-3"><dt>Base gravable:</dt><dd>{formatCOP(base)}</dd></div>
        <div className="flex justify-between text-slate-500 pl-3"><dt>{tenant.taxType === 'NINGUNO' ? 'Impuesto' : tenant.taxType} ({rate}%):</dt><dd>{formatCOP(tax)}</dd></div>
        <div className="flex justify-between text-slate-300"><dt>Propina voluntaria:</dt><dd>{formatCOP(order.tip)}</dd></div>
        <div className="flex justify-between font-bold text-white text-sm pt-1.5 border-t border-slate-800">
          <dt>TOTAL A COBRAR:</dt>
          <dd className="text-emerald-400">{formatCOP(total)}</dd>
        </div>
      </dl>

      <button onClick={submit} disabled={submitting} className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
        {submitting && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
        {kind === 'electronica' ? 'Emitir factura electrónica (simulada)' : 'Emitir tiquete POS'}
      </button>
    </Modal>
  );
}
