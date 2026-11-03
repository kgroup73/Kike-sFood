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

  return (
    <Modal title="Cierre de caja (Reporte Z)" icon={<Calculator className="w-5 h-5 text-amber-400" />} onClose={onClose}>
      <dl className="space-y-2 text-xs bg-slate-950 p-4 rounded-2xl border border-slate-800">
        <div className="flex justify-between text-slate-300">
          <dt>Ventas del turno ({invoices.length} comprobantes):</dt>
          <dd className="font-bold text-white text-sm">{formatCOP(totals.total)}</dd>
        </div>
        <div className="flex justify-between text-slate-400"><dt>Efectivo:</dt><dd>{formatCOP(totals.cash)}</dd></div>
        <div className="flex justify-between text-slate-400"><dt>Tarjeta:</dt><dd>{formatCOP(totals.card)}</dd></div>
        <div className="flex justify-between text-slate-400"><dt>Transferencia:</dt><dd>{formatCOP(totals.transfer)}</dd></div>
        <div className="flex justify-between text-slate-500"><dt>Propinas incluidas:</dt><dd>{formatCOP(totals.tips)}</dd></div>
      </dl>

      <div className="space-y-2 text-xs">
        <label htmlFor="counted-cash" className="block text-slate-300 font-bold">Efectivo físico contado en caja:</label>
        <input
          id="counted-cash"
          type="number"
          inputMode="numeric"
          min="0"
          value={countedCash}
          onChange={(e) => setCountedCash(e.target.value)}
          placeholder="Ingresa el monto contado"
          className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-bold text-sm focus:outline-none focus:border-amber-500"
        />
        {diff !== null && (
          <div className={`flex justify-between text-xs font-bold pt-1 ${diff === 0 ? 'text-emerald-400' : diff > 0 ? 'text-amber-300' : 'text-rose-400'}`}>
            <span>{diff === 0 ? 'Caja cuadrada' : diff > 0 ? 'Sobrante' : 'Faltante'} (físico − sistema):</span>
            <span>{formatCOP(diff)}</span>
          </div>
        )}
      </div>

      <button onClick={submit} disabled={counted === null || submitting} className="w-full py-3 bg-amber-500 hover:bg-amber-600 active:scale-95 text-slate-950 font-black text-xs rounded-xl shadow-lg transition-all disabled:opacity-40 flex items-center justify-center gap-2">
        {submitting && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
        Procesar cierre Z
      </button>
    </Modal>
  );
}
