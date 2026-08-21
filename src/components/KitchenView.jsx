import React from 'react';
import { Flame } from 'lucide-react';
import { formatCOP } from '../lib/dian';

export default function KitchenView({ kitchenOrders, updateOrderStatus }) {
  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-slate-900 p-4 rounded-2xl border border-slate-800 gap-2">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
            <Flame className="w-5 h-5 text-orange-500" /> Monitor KDS de Cocina
          </h2>
          <p className="text-xs text-slate-400">Control de comandas y órdenes en preparación en tiempo real</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Comandas activas:</span>
          <span className="text-lg font-black text-orange-500">
            {kitchenOrders.filter(o => o.status !== 'Por Cobrar').length}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {kitchenOrders.map(order => (
          <div
            key={order.id}
            className={`bg-slate-900 border rounded-2xl p-4 space-y-3 flex flex-col justify-between shadow-xl transition-all ${
              order.status === 'Pendiente' ? 'border-amber-500/60 shadow-amber-500/5' :
              order.status === 'En Preparación' ? 'border-blue-500/60 shadow-blue-500/5' :
              order.status === 'Listo' ? 'border-emerald-500/60 shadow-emerald-500/5' : 'border-purple-500/60 shadow-purple-500/5'
            }`}
          >
            <div>
              <div className="flex justify-between items-center pb-2.5 border-b border-slate-800">
                <div>
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                    Mesa <strong className="text-orange-500 text-sm">{order.table}</strong>
                  </span>
                  <span className="text-[11px] text-slate-400 ml-1.5">{order.time}</span>
                </div>
                <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                  order.status === 'Pendiente' ? 'bg-amber-500/20 text-amber-400' :
                  order.status === 'En Preparación' ? 'bg-blue-500/20 text-blue-400' :
                  order.status === 'Listo' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-purple-500/20 text-purple-400'
                }`}>
                  {order.status}
                </span>
              </div>

              <div className="space-y-2 mt-3">
                {order.items.map((item, idx) => (
                  <div key={idx} className="bg-slate-950 p-2.5 rounded-xl text-xs space-y-1 border border-slate-800/40">
                    <div className="flex justify-between font-bold text-slate-200">
                      <span><strong className="text-orange-500">{item.quantity}x</strong> {item.name}</span>
                      <span>{formatCOP(item.price)}</span>
                    </div>
                    {item.selectedOptions && item.selectedOptions.length > 0 && (
                      <div className="text-[11px] text-slate-400">
                        • {item.selectedOptions.join(', ')}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800 flex gap-2">
              {order.status === 'Pendiente' && (
                <button
                  onClick={() => updateOrderStatus(order.id, 'En Preparación')}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-bold text-xs rounded-xl transition-all"
                >
                  Tomar Orden
                </button>
              )}
              {order.status === 'En Preparación' && (
                <button
                  onClick={() => updateOrderStatus(order.id, 'Listo')}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs rounded-xl transition-all"
                >
                  Marcar como Listo
                </button>
              )}
              {order.status === 'Listo' && (
                <button
                  onClick={() => updateOrderStatus(order.id, 'Por Cobrar')}
                  className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 active:scale-95 text-white font-bold text-xs rounded-xl transition-all"
                >
                  Pasar a Caja POS
                </button>
              )}
            </div>
          </div>
        ))}

        {!kitchenOrders.length && (
          <div className="col-span-full py-12 text-center text-slate-500 text-xs">
            No hay comandas activas en la cocina.
          </div>
        )}
      </div>
    </div>
  );
}
