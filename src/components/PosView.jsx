import React, { useMemo } from 'react';
import { Receipt, Calculator, Bell, Clock, UserCheck, CheckCircle2 } from 'lucide-react';
import { formatCOP } from '../lib/dian';

export default function PosView({
  kitchenOrders,
  invoices,
  prepareBilling,
  viewInvoiceTicket,
  openDailyCloseModal,
  waiterCalls = [],
  onAttendWaiterCall,
  onCompleteWaiterCall
}) {
  const pendingBillingOrders = useMemo(() => kitchenOrders.filter(o => o.status === 'Por Cobrar'), [kitchenOrders]);
  const activeWaiterCalls = useMemo(() => waiterCalls.filter(c => c.status !== 'completed'), [waiterCalls]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-slate-900 p-4 rounded-2xl border border-slate-800 gap-3">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
            <Receipt className="w-5 h-5 text-emerald-400" /> Caja POS & Facturación Electrónica DIAN
          </h2>
          <p className="text-xs text-slate-400">Cobro de comandas, comprobantes UBL 2.1 y atención en mesa</p>
        </div>
        <button
          onClick={openDailyCloseModal}
          className="w-full md:w-auto px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl border border-slate-700 flex items-center justify-center gap-1.5 transition-all shadow"
        >
          <Calculator className="w-4 h-4 text-amber-400" /> Cierre de Caja (Z)
        </button>
      </div>

      {/* Live Waiter Calls Section (Real-time mesa requests) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-300 flex items-center gap-2">
            <Bell className="w-4 h-4 text-amber-400 animate-pulse" />
            <span>Llamados de Mesero en Vivo ({activeWaiterCalls.length})</span>
          </h3>
          {activeWaiterCalls.length > 0 && (
            <span className="text-[10px] bg-amber-500/20 text-amber-400 border border-amber-500/40 px-2.5 py-0.5 rounded-full font-extrabold animate-bounce">
              Atención en mesa requerida
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {activeWaiterCalls.map(call => (
            <div
              key={call.id}
              className={`p-4 rounded-2xl border transition-all flex flex-col justify-between gap-3 shadow-lg ${
                call.status === 'attending'
                  ? 'bg-slate-900/90 border-sky-500/50 ring-1 ring-sky-500/30'
                  : 'bg-slate-900 border-amber-500/60 ring-1 ring-amber-500/30 shadow-amber-500/10'
              }`}
            >
              <div className="space-y-2">
                <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                  <span className="px-2.5 py-0.5 bg-amber-500/20 text-amber-400 rounded-lg text-xs font-black border border-amber-500/30">
                    Mesa {call.table}
                  </span>
                  <span className="text-[11px] text-slate-400 flex items-center gap-1 font-medium">
                    <Clock className="w-3 h-3" /> {call.time || 'Hace un instante'}
                  </span>
                </div>

                <div>
                  <h4 className="font-bold text-white text-xs sm:text-sm">{call.reason}</h4>
                  {call.subOption && (
                    <span className="text-[11px] text-slate-300 block font-semibold pt-0.5">
                      • {call.subOption}
                    </span>
                  )}
                  {call.note && (
                    <p className="text-[10px] text-slate-400 italic pt-1 bg-slate-950 p-2 rounded-lg border border-slate-800/80 mt-1.5">
                      "{call.note}"
                    </p>
                  )}
                  {call.dianData && (
                    <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-lg p-2 text-[10px] text-emerald-300 space-y-0.5 mt-2">
                      <div className="font-bold flex items-center gap-1 text-emerald-400">
                        <Receipt className="w-3 h-3" /> Datos Facturación DIAN (Mesa):
                      </div>
                      <div>NIT/CC: <strong className="text-white">{call.dianData.nit}</strong></div>
                      <div>Razón Social: <strong className="text-white">{call.dianData.name}</strong></div>
                      <div>Email: <span className="text-slate-300 underline">{call.dianData.email}</span></div>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800 flex items-center gap-2">
                {call.status === 'pending' ? (
                  <button
                    onClick={() => onAttendWaiterCall && onAttendWaiterCall(call.id)}
                    className="flex-1 py-2 bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-black text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all shadow"
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>Tomar Llamado (Voy en camino)</span>
                  </button>
                ) : (
                  <div className="flex-1 flex items-center justify-between gap-2">
                    <span className="text-[11px] text-sky-400 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{call.waiterName || 'Staff'} asignado</span>
                    </span>
                    <button
                      onClick={() => onCompleteWaiterCall && onCompleteWaiterCall(call.id)}
                      className="py-1.5 px-3 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs rounded-xl transition-all shadow"
                    >
                      Completar
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}

          {!activeWaiterCalls.length && (
            <div className="col-span-full py-4 text-center text-slate-500 text-xs bg-slate-900/40 border border-slate-800/60 rounded-2xl flex items-center justify-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500/60" />
              <span>No hay llamados pendientes de mesas. ¡Todo el salón está atendido!</span>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-bold text-slate-300">
          Comandas Listas para Cobrar ({pendingBillingOrders.length})
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {pendingBillingOrders.map(order => {
            const subtotal = order.items.reduce((s, i) => s + (i.price * i.quantity), 0);
            return (
              <div key={order.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3 shadow-lg flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                    <span className="text-xs font-bold text-orange-500">Comanda #{order.id}</span>
                    <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-bold">Mesa {order.table}</span>
                  </div>
                  <div className="text-xs space-y-1.5 text-slate-300">
                    {order.items.map((it, idx) => (
                      <div key={idx} className="flex justify-between">
                        <span>{it.quantity}x {it.name}</span>
                        <span className="text-slate-400">{formatCOP(it.price * it.quantity)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800 space-y-2.5">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-400">Subtotal:</span>
                    <span className="text-sm font-black text-white">{formatCOP(subtotal)}</span>
                  </div>
                  <button
                    onClick={() => prepareBilling(order)}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all shadow"
                  >
                    <Receipt className="w-4 h-4" /> Facturar / Cobrar
                  </button>
                </div>
              </div>
            );
          })}
          {!pendingBillingOrders.length && (
            <div className="col-span-full py-6 text-center text-slate-500 text-xs bg-slate-900/40 border border-slate-800/60 rounded-2xl">
              Sin comandas pendientes por facturar.
            </div>
          )}
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-bold text-slate-300">
          Facturas Emitidas Hoy ({invoices.length})
        </h3>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase font-bold border-b border-slate-800">
                <tr>
                  <th className="p-3">Nº Factura</th>
                  <th className="p-3">Tipo</th>
                  <th className="p-3">Cliente</th>
                  <th className="p-3">Método</th>
                  <th className="p-3 text-right">Total</th>
                  <th className="p-3 text-center">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {invoices.map(inv => (
                  <tr key={inv.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-3 font-bold text-white whitespace-nowrap">{inv.number}</td>
                    <td className="p-3 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${inv.isElectronic ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40' : 'bg-slate-800 text-slate-300'}`}>
                        {inv.isElectronic ? 'Electrónica' : 'POS'}
                      </span>
                    </td>
                    <td className="p-3 whitespace-nowrap">{inv.customer.name}</td>
                    <td className="p-3 whitespace-nowrap">{inv.paymentMethod}</td>
                    <td className="p-3 text-right font-black text-emerald-400 whitespace-nowrap">{formatCOP(inv.total)}</td>
                    <td className="p-3 text-center whitespace-nowrap">
                      <button
                        onClick={() => viewInvoiceTicket(inv)}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-[11px] font-semibold border border-slate-700 transition-colors"
                      >
                        Tique
                      </button>
                    </td>
                  </tr>
                ))}
                {!invoices.length && (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-slate-500">
                      No se han emitido facturas en este turno.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
