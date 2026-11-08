import { Receipt, Calculator, History, ChefHat } from 'lucide-react';
import { formatCOP } from '../../lib/money';
import { PAYMENT_METHODS, INVOICE_KINDS, DIAN_STATUS } from '../../lib/billing';

const TONE = {
  neutral: 'bg-slate-800 text-slate-300',
  warning: 'bg-amber-500/15 text-amber-300 border border-amber-500/30',
  success: 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30',
  danger: 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
};

export default function PosView({ tablesToPay, invoices, closes, onCharge, onViewTicket, onOpenClose }) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-slate-900 p-4 rounded-2xl border border-slate-800 gap-3">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
            <Receipt className="w-5 h-5 text-emerald-400" aria-hidden="true" /> Caja POS
          </h2>
          <p className="text-xs text-slate-400">Cobro por mesa, comprobantes y cierre de caja</p>
        </div>
        <button onClick={onOpenClose} className="w-full md:w-auto px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl border border-slate-700 flex items-center justify-center gap-1.5 transition-all shadow">
          <Calculator className="w-4 h-4 text-amber-400" aria-hidden="true" /> Cierre de caja (Z)
        </button>
      </div>

      <section className="space-y-3">
        <h3 className="text-sm font-bold text-slate-300">Mesas por cobrar ({tablesToPay.length})</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {tablesToPay.map((group) => (
            <div key={group.key} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3 shadow-lg flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                  <span className="text-sm font-bold text-white">Mesa {group.tableLabel}</span>
                  <span className="text-[11px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-bold">
                    {group.orders.length} {group.orders.length === 1 ? 'comanda' : 'comandas'}
                  </span>
                </div>
                {group.orders.map((order) => (
                  <div key={order.id} className="space-y-1">
                    <p className="text-[11px] font-bold text-orange-500">Comanda #{order.id}</p>
                    <ul className="text-xs space-y-1 text-slate-300">
                      {order.items.map((it, idx) => (
                        <li key={idx} className="flex justify-between gap-2">
                          <span>{it.quantity}x {it.name}</span>
                          <span className="text-slate-400">{formatCOP(it.totalPrice)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
                {group.inKitchen > 0 && (
                  <p className="text-[11px] text-amber-300 bg-amber-500/10 border border-amber-500/30 rounded-lg px-2 py-1.5 flex items-center gap-1.5">
                    <ChefHat className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                    {group.inKitchen === 1 ? '1 comanda sigue en cocina' : `${group.inKitchen} comandas siguen en cocina`} y no entra en este cobro.
                  </p>
                )}
              </div>
              <div className="pt-3 border-t border-slate-800 space-y-2.5">
                <div className="flex justify-between items-center text-xs text-slate-400">
                  <span>Consumo + propina:</span>
                  <span className="text-sm font-black text-white">{formatCOP(group.total)}</span>
                </div>
                <button onClick={() => onCharge(group)} className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all shadow">
                  <Receipt className="w-4 h-4" aria-hidden="true" /> Facturar mesa {group.tableLabel}
                </button>
              </div>
            </div>
          ))}
          {!tablesToPay.length && (
            <div className="col-span-full py-6 text-center text-slate-500 text-xs bg-slate-900/40 border border-slate-800/60 rounded-2xl">
              Sin mesas pendientes por cobrar.
            </div>
          )}
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-bold text-slate-300">Comprobantes del turno ({invoices.length})</h3>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase font-bold border-b border-slate-800">
                <tr>
                  <th className="p-3">Nº</th>
                  <th className="p-3">Tipo</th>
                  <th className="p-3">Cliente</th>
                  <th className="p-3">Pago</th>
                  <th className="p-3 text-right">Total</th>
                  <th className="p-3 text-center"><span className="sr-only">Acción</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {invoices.map((inv) => {
                  const status = DIAN_STATUS[inv.dianStatus] || DIAN_STATUS.no_aplica;
                  return (
                    <tr key={inv.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-3 font-bold text-white whitespace-nowrap">{inv.number}</td>
                      <td className="p-3 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${TONE[inv.kind === 'electronica' ? status.tone : 'neutral']}`} title={status.label}>
                          {INVOICE_KINDS[inv.kind]}{inv.dianStatus === 'simulado' ? ' · simulada' : ''}
                        </span>
                      </td>
                      <td className="p-3 whitespace-nowrap">{inv.customer?.name}</td>
                      <td className="p-3 whitespace-nowrap">{PAYMENT_METHODS[inv.paymentMethod] || inv.paymentMethod}</td>
                      <td className="p-3 text-right font-black text-emerald-400 whitespace-nowrap">{formatCOP(inv.total)}</td>
                      <td className="p-3 text-center whitespace-nowrap">
                        <button onClick={() => onViewTicket(inv)} className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-[11px] font-semibold border border-slate-700 transition-colors">
                          Tiquete
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {!invoices.length && (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-slate-500">No hay comprobantes desde el último cierre.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {closes.length > 0 && (
        <section className="space-y-3">
          <h3 className="text-sm font-bold text-slate-300 flex items-center gap-2">
            <History className="w-4 h-4 text-indigo-400" aria-hidden="true" /> Cierres anteriores
          </h3>
          <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {closes.map((z) => (
              <li key={z.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 text-xs space-y-1">
                <div className="flex justify-between font-bold text-white">
                  <span>{z.code}</span>
                  <span>{formatCOP(z.totalSales)}</span>
                </div>
                <p className="text-slate-500">{new Date(z.periodEnd).toLocaleString('es-CO')} · {z.invoiceCount} comprobantes · {z.closedByName}</p>
                <p className={z.difference === 0 ? 'text-emerald-400' : 'text-amber-300'}>
                  Diferencia en efectivo: {formatCOP(z.difference)}
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
