import React, { useState } from 'react';
import {
  Flame,
  PackageX,
  PackageCheck,
  UtensilsCrossed,
  Boxes
} from 'lucide-react';
import { formatCOP } from '../lib/dian';
import { timeAgo } from '../lib/inventory';
import StockControlModal from './modals/StockControlModal';

export default function KitchenView({
  kitchenOrders,
  products = [],
  updateOrderStatus,
  onMarkSoldOut,
  onRestock
}) {
  const [activeTab, setActiveTab] = useState('orders');
  const [stockTarget, setStockTarget] = useState(null);

  const activeOrdersCount = kitchenOrders.filter(o => o.status !== 'Por Cobrar').length;
  const soldOutProducts = products.filter(p => p.soldOut);

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center bg-slate-900 p-4 rounded-2xl border border-slate-800 gap-3">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
            <Flame className="w-5 h-5 text-orange-500" /> Monitor KDS de Cocina
          </h2>
          <p className="text-xs text-slate-400">Comandas en tiempo real e inventario de agotados</p>
        </div>

        <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-[11px] font-bold w-full sm:w-auto">
          <button
            onClick={() => setActiveTab('orders')}
            className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'orders' ? 'bg-orange-500 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <UtensilsCrossed className="w-3.5 h-3.5" /> Comandas
            <span className={`px-1.5 py-0.2 rounded-full text-[9px] ${activeTab === 'orders' ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-300'}`}>
              {activeOrdersCount}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('inventory')}
            className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all relative ${
              activeTab === 'inventory' ? 'bg-orange-500 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Boxes className="w-3.5 h-3.5" /> Inventario
            {soldOutProducts.length > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white text-[9px] px-1.5 py-0.2 rounded-full font-bold shadow">
                {soldOutProducts.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {activeTab === 'orders' && (
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
      )}

      {activeTab === 'inventory' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-start gap-3">
            <PackageX className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <p className="text-xs text-slate-400 leading-relaxed">
              Marca manualmente un platillo como <strong className="text-rose-300">Agotado</strong> indicando la materia prima faltante.
              El cambio se refleja al instante en la carta del cliente (quedará como <em>No Disponible</em> y no podrá pedirse) y se registra
              en el reporte del administrador para prevenir futuros faltantes.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {products.map(p => (
              <div
                key={p.id}
                className={`bg-slate-900 border rounded-2xl p-4 flex flex-col gap-3 shadow-xl transition-all ${
                  p.soldOut ? 'border-rose-500/50 shadow-rose-500/5' : 'border-slate-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <img
                    src={p.image}
                    alt={p.name}
                    className={`w-12 h-12 rounded-xl object-cover shrink-0 transition-all ${p.soldOut ? 'grayscale opacity-60' : ''}`}
                    loading="lazy"
                  />
                  <div className="min-w-0">
                    <h4 className="font-bold text-white text-xs truncate">{p.name}</h4>
                    <span className="text-[10px] text-slate-500 block truncate">
                      {p.category} • {formatCOP(p.price)}
                    </span>
                  </div>
                </div>

                {p.soldOut ? (
                  <div className="space-y-2 flex-1">
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-rose-500/15 text-rose-300 border border-rose-500/30 px-2 py-0.5 rounded-full">
                      <PackageX className="w-3 h-3" /> Agotado • {timeAgo(p.soldOutInfo?.at)}
                    </span>
                    <div className="text-[11px] space-y-1">
                      <span className="block text-slate-400 font-semibold">Materia prima faltante:</span>
                      <div className="flex flex-wrap gap-1">
                        {(p.soldOutInfo?.missingIngredients || []).map(ing => (
                          <span key={ing} className="px-2 py-0.5 rounded-md bg-slate-950 border border-rose-500/25 text-rose-200 font-medium">
                            {ing}
                          </span>
                        ))}
                      </div>
                      {p.soldOutInfo?.note && (
                        <p className="italic text-slate-500 pt-0.5">“{p.soldOutInfo.note}”</p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex-1">
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                      <PackageCheck className="w-3 h-3" /> Disponible
                    </span>
                  </div>
                )}

                {p.soldOut ? (
                  <button
                    onClick={() => onRestock(p.id)}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5"
                  >
                    <PackageCheck className="w-3.5 h-3.5" /> Reponer Stock
                  </button>
                ) : (
                  <button
                    onClick={() => setStockTarget(p)}
                    className="w-full py-2.5 bg-rose-600/90 hover:bg-rose-500 active:scale-95 text-white font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5"
                  >
                    <PackageX className="w-3.5 h-3.5" /> Marcar Agotado
                  </button>
                )}
              </div>
            ))}

            {!products.length && (
              <div className="col-span-full py-12 text-center text-slate-500 text-xs">
                No hay platillos en el catálogo.
              </div>
            )}
          </div>
        </div>
      )}

      {stockTarget && (
        <StockControlModal
          product={stockTarget}
          onClose={() => setStockTarget(null)}
          onConfirm={({ missingIngredients, note }) => {
            onMarkSoldOut(stockTarget.id, { missingIngredients, note });
            setStockTarget(null);
          }}
        />
      )}
    </div>
  );
}
