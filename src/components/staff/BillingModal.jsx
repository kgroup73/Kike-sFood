import { useState } from 'react';
import { Lock, Receipt, Loader2 } from 'lucide-react';
import Modal from '../ui/Modal';
import { formatCOP, splitTaxIncluded, effectiveTaxRate, computeTip, toPesos } from '../../lib/money';
import { PAYMENT_METHODS, INVOICE_KINDS, CONSUMIDOR_FINAL, sumOrders } from '../../lib/billing';

export default function BillingModal({ group, tenant, customers, canDian, onClose, onNewCustomer, onIssue }) {
  const [kind, setKind] = useState(canDian ? 'electronica' : 'pos');
  // Se guardan las comandas excluidas: si llega otra comanda de la mesa mientras el modal está abierto, entra marcada.
  const [excluded, setExcluded] = useState(() => new Set());
  const [customerId, setCustomerId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('efectivo');
  const [submitting, setSubmitting] = useState(false);

  // Vista previa: el cálculo definitivo lo hace issue_invoice() en el servidor.
  const selected = group.orders.filter((o) => !excluded.has(o.id));
  const { subtotal } = sumOrders(selected);
  // Propina voluntaria (Ley 1935): se pregunta al cliente al cobrar. Por defecto, la sugerida.
  const [tipMode, setTipMode] = useState('sugerida');
  const [customTip, setCustomTip] = useState('');
  const suggestedTip = computeTip(subtotal, tenant.tipRate);
  const tip = tipMode === 'sugerida' ? suggestedTip : tipMode === 'otra' ? toPesos(customTip) : 0;
  const tipInvalid = tipMode === 'otra' && (customTip === '' || tip < 0 || tip > subtotal);
  const total = subtotal + tip;
  const rate = effectiveTaxRate(tenant);
  const { base, tax } = splitTaxIncluded(subtotal, rate);

  const toggle = (id) =>
    setExcluded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const submit = async () => {
    setSubmitting(true);
    try {
      await onIssue({ orderIds: selected.map((o) => o.id), kind, customerId: customerId || null, paymentMethod, tip });
    } finally {
      setSubmitting(false);
    }
  };

  const segment = (on) =>
    `flex-1 h-11 rounded-full border flex items-center justify-center font-bold cursor-pointer transition-colors ${
      on ? 'bg-tinta border-tinta text-mantel' : 'bg-plato border-linea hover:border-tinta'
    }`;

  return (
    <Modal title={`Cobrar mesa ${group.tableLabel}`} icon={<Receipt />} onClose={onClose} size="xl">
      <div className="grid lg:grid-cols-[1fr_320px] gap-8">
        <div className="space-y-6">
          <fieldset className="space-y-2">
            <legend className="label">Comandas incluidas</legend>
            <div className="surface divide-y divide-linea overflow-hidden">
              {group.orders.map((o) => (
                <label key={o.id} className="flex items-center justify-between gap-3 px-4 min-h-[52px] cursor-pointer hover:bg-mantel/60">
                  <span className="flex items-center gap-3">
                    <input type="checkbox" aria-label={`Comanda ${o.id}`} checked={!excluded.has(o.id)} onChange={() => toggle(o.id)} className="w-5 h-5 accent-[rgb(var(--c-hoja))]" />
                    <span className="font-bold">Comanda {o.id}</span>
                    <span className="text-sm text-suave">
                      {o.items.reduce((n, it) => n + it.quantity, 0)} {o.items.reduce((n, it) => n + it.quantity, 0) === 1 ? 'plato' : 'platos'}
                    </span>
                  </span>
                  <span className="precio">{formatCOP(o.subtotal)}</span>
                </label>
              ))}
            </div>
            {group.inKitchen > 0 && (
              <p className="help">
                {group.inKitchen === 1 ? 'Hay 1 comanda' : `Hay ${group.inKitchen} comandas`} de esta mesa en cocina. Se cobra{group.inKitchen === 1 ? '' : 'n'} aparte cuando pase{group.inKitchen === 1 ? '' : 'n'} a caja.
              </p>
            )}
          </fieldset>

          <fieldset>
            <legend className="label">Propina voluntaria</legend>
            <div className="flex gap-2">
              {[
                ['sugerida', `Sugerida ${Number(tenant.tipRate) || 0}%`],
                ['ninguna', 'Sin propina'],
                ['otra', 'Otro valor']
              ].map(([value, label]) => (
                <label key={value} className={segment(tipMode === value)}>
                  <input type="radio" name="tip-mode" value={value} checked={tipMode === value} onChange={() => setTipMode(value)} className="sr-only" />
                  {label}
                </label>
              ))}
            </div>
            {tipMode === 'otra' && (
              <input
                type="number"
                min="0"
                max={subtotal}
                step="100"
                inputMode="numeric"
                value={customTip}
                onChange={(e) => setCustomTip(e.target.value)}
                aria-label="Valor de la propina"
                placeholder="Valor en pesos"
                className="field mt-2 precio"
              />
            )}
            {tipInvalid ? (
              <p className="help !text-aji font-bold">Escribe un valor entre $0 y {formatCOP(subtotal)}.</p>
            ) : (
              <p className="help">Pregúntale al cliente si desea incluirla. Puede aceptarla, quitarla o cambiar el valor.</p>
            )}
          </fieldset>

          <div className="grid sm:grid-cols-2 gap-4">
            <label className="block">
              <span className="label">Método de pago</span>
              <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="field">
                {Object.entries(PAYMENT_METHODS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="label">Tipo de comprobante</span>
              <select value={kind} onChange={(e) => setKind(e.target.value)} className="field">
                <option value="pos">{INVOICE_KINDS.pos}</option>
                <option value="electronica" disabled={!canDian}>
                  {INVOICE_KINDS.electronica}{!canDian ? ' (no disponible)' : ''}
                </option>
              </select>
            </label>
          </div>
          {!canDian && (
            <p className="help -mt-3 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5" aria-hidden="true" /> La factura electrónica requiere plan Premium y una resolución vigente.
            </p>
          )}

          <div>
            <div className="flex justify-between items-baseline">
              <label htmlFor="billing-customer" className="label">
                Cliente
              </label>
              <button onClick={onNewCustomer} className="text-sm font-bold text-hoja hover:underline underline-offset-4">
                Registrar cliente
              </button>
            </div>
            <select id="billing-customer" value={customerId} onChange={(e) => setCustomerId(e.target.value)} className="field">
              <option value="">
                {CONSUMIDOR_FINAL.name} ({CONSUMIDOR_FINAL.docNumber})
              </option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.docType} {c.docNumber})
                </option>
              ))}
            </select>
          </div>
        </div>

        <aside className="lg:border-l lg:border-linea lg:pl-8 space-y-5">
          <dl className="space-y-2">
            <div className="flex justify-between">
              <dt>Consumo</dt>
              <dd className="precio">{formatCOP(subtotal)}</dd>
            </div>
            <div className="flex justify-between text-sm text-suave pl-3">
              <dt>Base gravable</dt>
              <dd className="precio">{formatCOP(base)}</dd>
            </div>
            <div className="flex justify-between text-sm text-suave pl-3">
              <dt>
                {tenant.taxType === 'NINGUNO' ? 'Impuesto' : tenant.taxType} ({rate}%)
              </dt>
              <dd className="precio">{formatCOP(tax)}</dd>
            </div>
            <div className="flex justify-between">
              <dt>Propina voluntaria</dt>
              <dd className="precio">{formatCOP(tip)}</dd>
            </div>
            <div className="flex justify-between items-baseline pt-3 mt-1 border-t-2 border-tinta" data-testid="billing-total">
              <dt className="font-bold">Total a cobrar</dt>
              <dd className="precio font-extrabold text-3xl">{formatCOP(total)}</dd>
            </div>
          </dl>

          <button onClick={submit} disabled={submitting || !selected.length || tipInvalid} className="btn btn-primary w-full h-14 text-base">
            {submitting && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
            {kind === 'electronica' ? 'Emitir factura electrónica (simulada)' : 'Emitir tiquete POS'}
          </button>
          {!selected.length && <p className="help text-center">Marca al menos una comanda para cobrar.</p>}
        </aside>
      </div>
    </Modal>
  );
}
