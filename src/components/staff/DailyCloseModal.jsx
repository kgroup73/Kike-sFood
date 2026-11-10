import { useMemo, useState } from 'react';
import { Calculator, Loader2 } from 'lucide-react';
import Modal from '../ui/Modal';
import { formatCOP } from '../../lib/money';

export default function DailyCloseModal({ invoices, onClose, onConfirm }) {
  const [countedCash, setCountedCash] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Vista previa; el reporte definitivo lo calcula close_cash_register() en el servidor.
  const totals = useMemo(() => {
    const by = (m) => invoices.filter((i) => i.paymentMethod === m).reduce((s, i) => s + i.total, 0);
    return {
      total: invoices.reduce((s, i) => s + i.total, 0),
      cash: by('efectivo'),
      card: by('tarjeta'),
      transfer: by('transferencia'),
      tips: invoices.reduce((s, i) => s + i.tip, 0)
    };
  }, [invoices]);

  const counted = countedCash === '' ? null : Math.max(0, Math.round(Number(countedCash) || 0));
  const diff = counted === null ? null : counted - totals.cash;

  const submit = async () => {
    if (counted === null) return;
    setSubmitting(true);
    try {
      await onConfirm(counted);
    } finally {
      setSubmitting(false);
    }
  };

  const row = 'flex justify-between';
  return (
    <Modal title="Cierre de caja (reporte Z)" icon={<Calculator />} onClose={onClose}>
      <dl className="space-y-2">
        <div className={`${row} items-baseline pb-3 border-b border-linea`}>
          <dt>
            Ventas del turno
            <span className="block text-sm text-suave">
              {invoices.length} {invoices.length === 1 ? 'comprobante' : 'comprobantes'}
            </span>
          </dt>
          <dd className="precio font-extrabold text-3xl">{formatCOP(totals.total)}</dd>
        </div>
        <div className={row}><dt>Efectivo</dt><dd className="precio">{formatCOP(totals.cash)}</dd></div>
        <div className={row}><dt>Tarjeta</dt><dd className="precio">{formatCOP(totals.card)}</dd></div>
        <div className={row}><dt>Transferencia</dt><dd className="precio">{formatCOP(totals.transfer)}</dd></div>
        <div className={`${row} text-sm text-suave`}><dt>Propinas incluidas</dt><dd className="precio">{formatCOP(totals.tips)}</dd></div>
      </dl>

      <div>
        <label htmlFor="counted-cash" className="label">
          Efectivo físico contado en caja
        </label>
        <input
          id="counted-cash"
          type="number"
          inputMode="numeric"
          min="0"
          value={countedCash}
          onChange={(e) => setCountedCash(e.target.value)}
          placeholder="Monto contado"
          className="field h-14 precio text-xl font-bold"
        />
        {diff !== null && (
          <p className={`mt-2 flex justify-between font-bold ${diff === 0 ? 'text-hoja' : 'text-aji'}`}>
            <span>{diff === 0 ? 'Caja cuadrada' : diff > 0 ? 'Sobrante' : 'Faltante'} (físico − sistema):</span>
            <span className="precio">{formatCOP(diff)}</span>
          </p>
        )}
      </div>

      <button onClick={submit} disabled={counted === null || submitting} className="btn btn-dark w-full h-14 text-base">
        {submitting && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
        Procesar cierre Z
      </button>
    </Modal>
  );
}
