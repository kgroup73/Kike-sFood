import React, { useState, useMemo } from 'react';
import { Calculator, X } from 'lucide-react';
import { formatCOP } from '../../lib/dian';

export default function DailyCloseModal({ invoices, onClose, onProcessClose }) {
  const [countedCash, setCountedCash] = useState(0);

  const totalSales = useMemo(() => invoices.reduce((s, i) => s + i.total, 0), [invoices]);
  const cashSales = useMemo(() => invoices.filter(i => i.paymentMethod === 'Efectivo').reduce((s, i) => s + i.total, 0), [invoices]);
  const cardSales = useMemo(() => invoices.filter(i => i.paymentMethod.includes('Tarjeta')).reduce((s, i) => s + i.total, 0), [invoices]);
  const transferSales = useMemo(() => invoices.filter(i => i.paymentMethod.includes('Nequi') || i.paymentMethod.includes('Transferencia')).reduce((s, i) => s + i.total, 0), [invoices]);
  const diff = countedCash - cashSales;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl space-y-4">
        <div className="flex justify-between items-center pb-2 border-b border-slate-800">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Calculator className="w-5 h-5 text-amber-400" /> Reporte de Cierre de Caja (Z)
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-2 text-xs bg-slate-950 p-4 rounded-2xl border border-slate-800">
          <div className="flex justify-between text-slate-300">
            <span>Ventas Totales Hoy:</span>
            <span className="font-bold text-white text-sm">{formatCOP(totalSales)}</span>
          </div>
          <div className="flex justify-between text-slate-400"><span>Ventas en Efectivo:</span><span>{formatCOP(cashSales)}</span></div>
          <div className="flex justify-between text-slate-400"><span>Ventas con Tarjeta:</span><span>{formatCOP(cardSales)}</span></div>
          <div className="flex justify-between text-slate-400"><span>Ventas por Transferencia:</span><span>{formatCOP(transferSales)}</span></div>
        </div>

        <div className="space-y-2 text-xs">
          <label className="block text-slate-300 font-bold">Efectivo Físico Contado en Caja:</label>
          <input
            type="number"
            value={countedCash}
            onChange={(e) => setCountedCash(Number(e.target.value))}
            placeholder="Ingrese el monto en efectivo..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-bold text-sm focus:outline-none focus:border-amber-500"
          />
          
          <div className={`flex justify-between text-xs font-bold pt-1 ${diff >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            <span>Diferencia en Caja (Físico - Sistema):</span>
            <span>{formatCOP(diff)}</span>
          </div>
        </div>

        <button
          onClick={() => {
            const reportCode = 'Z-' + new Date().toISOString().slice(0,10).replace(/-/g,'');
            onProcessClose({
              code: reportCode,
              date: new Date().toLocaleString('es-CO'),
              totalSales,
              cashSales,
              countedCash,
              diff
            });
          }}
          className="w-full py-3 bg-amber-500 hover:bg-amber-600 active:scale-95 text-slate-950 font-black text-xs rounded-xl shadow-lg transition-all"
        >
          Procesar Cierre Z y Generar Comprobante
        </button>
      </div>
    </div>
  );
}
