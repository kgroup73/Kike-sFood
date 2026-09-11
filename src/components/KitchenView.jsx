import React, { useState, useMemo } from 'react';
import {
  Flame,
  PackageX,
  PackageCheck,
  UtensilsCrossed,
  Boxes,
  Layers,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { formatCOP } from '../lib/dian';
import { timeAgo, INGREDIENT_CATEGORIES } from '../lib/inventory';

export default function KitchenView({
  kitchenOrders,
  products = [],
  masterIngredients = [],
  ingredientsStock = {},
  updateOrderStatus,
  onMarkIngredientSoldOut,
  onRestockIngredient
}) {
  const [activeTab, setActiveTab] = useState('orders');
  const [expandedCategories, setExpandedCategories] = useState({});

  const toggleCategory = (id) => {
    setExpandedCategories(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const activeOrdersCount = kitchenOrders.filter(o => o.status !== 'Por Cobrar').length;
  const soldOutIngredients = masterIngredients.filter(ing => ingredientsStock[ing.key]?.soldOut);

  const categoryCounts = useMemo(() => {
    const counts = { todos: masterIngredients.length };
    masterIngredients.forEach(ing => {
      counts[ing.category] = (counts[ing.category] || 0) + 1;
    });
    return counts;
  }, [masterIngredients]);

  const groupedByCategory = useMemo(() => {
    const groups = new Map();
    masterIngredients.forEach(ing => {
      const id = ing.category || 'otros';
      if (!groups.has(id)) {
        groups.set(id, {
          id,
          label: INGREDIENT_CATEGORIES.find(c => c.id === id)?.label || 'Otros',
          ingredients: []
        });
      }
      groups.get(id).ingredients.push(ing);
    });
    return [...groups.values()].sort((a, b) => {
      const ia = INGREDIENT_CATEGORIES.findIndex(c => c.id === a.id);
      const ib = INGREDIENT_CATEGORIES.findIndex(c => c.id === b.id);
      return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
    });
  }, [masterIngredients]);

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center bg-slate-900 p-4 rounded-2xl border border-slate-800 gap-3">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
            <Flame className="w-5 h-5 text-orange-500" /> Monitor KDS de Cocina
          </h2>
          <p className="text-xs text-slate-400">Comandas en tiempo real e inventario de materias primas</p>
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
            {soldOutIngredients.length > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white text-[9px] px-1.5 py-0.2 rounded-full font-bold shadow">
                {soldOutIngredients.length}
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
              Marca manualmente una <strong className="text-rose-300">materia prima</strong> como <strong className="text-rose-300">Agotada</strong>.
              El cambio se refleja al instante en la carta del cliente: <strong>todos los platillos que la usan</strong> quedarán como <em>No Disponible</em> y no podrán pedirse. El faltante se registra en el reporte del administrador para prevenir futuros desabastecimientos.
            </p>
          </div>

          {/* Clasificaciones desplegables */}
          {groupedByCategory.length ? (
            <div className="space-y-2">
              {groupedByCategory.map(group => {
                const isExpanded = !!expandedCategories[group.id];
                const groupSoldOut = group.ingredients.filter(ing => ingredientsStock[ing.key]?.soldOut).length;
                const anySoldOut = groupSoldOut > 0;
                return (
                  <div key={group.id} className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-md">
                    <button
                      onClick={() => toggleCategory(group.id)}
                      className="w-full flex items-center justify-between gap-3 px-4 py-3.5 transition-all hover:bg-slate-800/40"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center shrink-0">
                          <Layers className="w-5 h-5 text-orange-400" />
                        </div>
                        <div className="text-left min-w-0">
                          <h3 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2 truncate">
                            {group.label}
                            {anySoldOut && (
                              <span className="text-[9px] font-black px-2 py-0.5 rounded-full border bg-rose-500/15 text-rose-300 border-rose-500/30 shrink-0">
                                {groupSoldOut} agotada(s)
                              </span>
                            )}
                          </h3>
                          <p className="text-[11px] text-slate-500">
                            {group.ingredients.length} {group.ingredients.length === 1 ? 'materia prima' : 'materias primas'}
                          </p>
                        </div>
                      </div>
                      {isExpanded
                        ? <ChevronDown className="w-5 h-5 text-slate-400 shrink-0 transition-transform" />
                        : <ChevronRight className="w-5 h-5 text-slate-400 shrink-0 transition-transform" />}
                    </button>

                    {isExpanded && (
                      <div className="px-3 pb-3 pt-1 space-y-1.5">
                        {group.ingredients.map(ing => {
                          const info = ingredientsStock[ing.key];
                          const isSoldOut = !!info?.soldOut;
                          return (
                            <div
                              key={ing.key}
                              className={`flex flex-wrap md:flex-nowrap items-center gap-2 px-3 py-2 rounded-xl border transition-all ${isSoldOut ? 'bg-rose-500/5 border-rose-500/30' : 'bg-slate-950 border-slate-800'}`}
                            >
                              <div className="flex items-center gap-2 min-w-0 flex-1">
                                <Layers className={`w-4 h-4 shrink-0 ${isSoldOut ? 'text-rose-400' : 'text-orange-400'}`} />
                                <div className="min-w-0 leading-tight">
                                  <h4 className="font-bold text-white text-xs truncate">{ing.name}</h4>
                                  <p className="text-[10px] text-slate-500 truncate">
                                    Usado en {ing.usedBy.join(', ') || '—'}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                {isSoldOut ? (
                                  <>
                                    <span className="text-[10px] text-rose-300 font-semibold whitespace-nowrap" title={info.note || `Agotado ${timeAgo(info.at)}`}>
                                      Agotado {info.note ? `· “${info.note}”` : `· ${timeAgo(info.at)}`}
                                    </span>
                                    <button
                                      onClick={() => onRestockIngredient(ing.name)}
                                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-[11px] rounded-lg transition-all flex items-center gap-1"
                                    >
                                      <PackageCheck className="w-3.5 h-3.5" /> Reponer
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    <span className="hidden sm:inline text-[10px] font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                                      Disponible
                                    </span>
                                    <button
                                      onClick={() => onMarkIngredientSoldOut(ing.name)}
                                      className="px-3 py-1.5 bg-rose-600/90 hover:bg-rose-500 active:scale-95 text-white font-bold text-[11px] rounded-lg transition-all flex items-center gap-1"
                                    >
                                      <PackageX className="w-3.5 h-3.5" /> Agotar
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-12 text-center text-slate-500 text-xs border border-dashed border-slate-800 rounded-xl">
              {masterIngredients.length
                ? 'No hay materias primas en esta categoría.'
                : 'No hay materias primas registradas en el catálogo.'}
            </div>
          )}
        </div>
      )}
    </div>
  );
}