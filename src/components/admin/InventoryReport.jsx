import { useEffect, useMemo, useState } from 'react';
import { Package, PackageX, PackageCheck, ShoppingCart, ClipboardList, Layers, History, Search, Boxes } from 'lucide-react';
import { useTenant } from '../../hooks/useTenant';
import { useMenu } from '../../hooks/useMenu';
import { api } from '../../services/api';
import { timeAgo, formatEventTimestamp } from '../../lib/inventory';
import { InlineError } from '../ui/Screens';
import AdminShell from './AdminShell';

/** Reporte de inventario (solo lectura): la cocina agota y repone las materias primas. */
export default function InventoryReport() {
  const { tenant } = useTenant();
  const { productsWithStock, masterIngredients, ingredientsStock, error: menuError, reload } = useMenu(tenant.id);
  const [stockEvents, setStockEvents] = useState([]);
  const [eventsError, setEventsError] = useState(null);
  const [ingredientQuery, setIngredientQuery] = useState('');

  useEffect(() => {
    api.listStockEvents(tenant.id).then(setStockEvents).catch((err) => setEventsError(err.message));
  }, [tenant.id, ingredientsStock]);

  const soldOutNow = useMemo(() => productsWithStock.filter(p => p.soldOut), [productsWithStock]);
  const depletedEvents = useMemo(() => stockEvents.filter(e => e.type === 'AGOTADO'), [stockEvents]);

  // Ranking de materias primas que más agotamientos han provocado (para compras)
  const rankedIngredients = useMemo(() => {
    const totals = {};
    depletedEvents.forEach(ev => {
      if (!ev.ingredient) return;
      totals[ev.ingredient] = (totals[ev.ingredient] || 0) + 1;
    });
    return Object.entries(totals).sort((a, b) => b[1] - a[1]);
  }, [depletedEvents]);
  const maxIngredientCount = rankedIngredients.length ? rankedIngredients[0][1] : 0;

  const soldOutIngredients = masterIngredients.filter(ing => ingredientsStock[ing.key]?.soldOut);
  const filteredIngredients = useMemo(() => {
    const q = ingredientQuery.trim().toLowerCase();
    return soldOutIngredients.filter(ing =>
      !q || ing.name.toLowerCase().includes(q) || ing.usedBy.some(pn => pn.toLowerCase().includes(q))
    );
  }, [soldOutIngredients, ingredientQuery]);

  return (
    <AdminShell
      title="Inventario y desabastecimiento"
      subtitle="Trazabilidad de materias primas agotadas, reportadas en tiempo real por cocina"
      icon={<Package className="w-4 h-4 text-orange-500" aria-hidden="true" />}
    >
      {(menuError || eventsError) && <InlineError message={menuError || eventsError} onRetry={reload} />}
          {/* Control de Materias Primas */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 shadow-md">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                  <Boxes className="w-4 h-4 text-orange-400" /> Materias Primas Agotadas ({soldOutIngredients.length})
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Reporte informativo. La cocina es la encargada de agotar y reponer las materias primas.
                </p>
              </div>
              <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <input
                  type="text"
                  value={ingredientQuery}
                  onChange={e => setIngredientQuery(e.target.value)}
                  placeholder="Buscar ingrediente o platillo..."
                  className="bg-transparent outline-none text-xs text-white w-full placeholder:text-slate-600"
                />
              </div>
            </div>

            {filteredIngredients.length ? (
              <div className="space-y-2 max-h-96 overflow-y-auto hide-scrollbar pr-1">
                {filteredIngredients.map(ing => {
                  const info = ingredientsStock[ing.key];
                  const isSoldOut = !!info?.soldOut;
                  return (
                    <div key={ing.key} className={`bg-slate-950 border rounded-xl p-3 flex items-center justify-between gap-3 transition-all ${isSoldOut ? 'border-rose-500/25' : 'border-slate-800/80'}`}>
                      <div className="min-w-0 space-y-0.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h5 className="text-xs font-bold text-white truncate">{ing.name}</h5>
                          {isSoldOut && (
                            <span className="text-[9px] font-black px-2 py-0.5 rounded-full border bg-rose-500/15 text-rose-300 border-rose-500/30">
                              AGOTADO
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 truncate">
                          Usado en {ing.usedBy.length} {ing.usedBy.length === 1 ? 'platillo' : 'platillos'}: {ing.usedBy.join(', ') || '—'}
                        </p>
                        {isSoldOut && info.at && (
                          <p className="text-[10px] text-slate-600">Agotado {timeAgo(info.at)}{info.note ? ` · “${info.note}”` : ''}</p>
                        )}
                      </div>
                      <div className="shrink-0">
                        {isSoldOut ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-rose-500/15 text-rose-300 border border-rose-500/30 px-2 py-1 rounded-lg whitespace-nowrap">
                            <PackageX className="w-3.5 h-3.5" /> Agotado en cocina
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 px-2 py-1 rounded-lg whitespace-nowrap">
                            <PackageCheck className="w-3.5 h-3.5" /> Disponible
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-6 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-xl">
                {masterIngredients.length ? 'No hay materias primas agotadas actualmente.' : 'No hay materias primas registradas en el catálogo.'}
              </div>
            )}
          </div>

          {/* Métricas clave */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5">
              <PackageX className="w-4 h-4 text-rose-400 mb-2" />
              <p className="text-xl font-black text-white leading-none">{soldOutNow.length}</p>
              <p className="text-[10px] text-slate-400 font-medium mt-1.5">Platillos agotados ahora mismo</p>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5">
              <ClipboardList className="w-4 h-4 text-orange-400 mb-2" />
              <p className="text-xl font-black text-white leading-none">{depletedEvents.length}</p>
              <p className="text-[10px] text-slate-400 font-medium mt-1.5">Eventos de desabastecimiento registrados</p>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5">
              <Layers className="w-4 h-4 text-indigo-400 mb-2" />
              <p className="text-xl font-black text-white leading-none">{rankedIngredients.length}</p>
              <p className="text-[10px] text-slate-400 font-medium mt-1.5">Materias primas distintas afectadas</p>
            </div>
          </div>

          {/* Sugerencia de compras */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 shadow-md">
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-emerald-400" /> Sugerencia de Compras
              </h4>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Frecuencia con la que cada materia prima provocó un agotamiento. Prioriza las de mayor recurrencia.
              </p>
            </div>
            {rankedIngredients.length ? (
              <div className="space-y-3 pt-1">
                {rankedIngredients.map(([ing, count]) => (
                  <div key={ing} className="space-y-1">
                    <div className="flex justify-between items-center text-xs gap-2">
                      <span className="text-slate-200 font-medium flex items-center gap-1.5 min-w-0 truncate">
                        {ing}
                        {count >= 2 && (
                          <span className="shrink-0 text-[9px] bg-rose-500/15 text-rose-300 border border-rose-500/30 px-1.5 py-0.5 rounded font-black uppercase tracking-wide">
                            Prioridad alta
                          </span>
                        )}
                      </span>
                      <span className="text-slate-400 font-bold whitespace-nowrap">{count} {count === 1 ? 'evento' : 'eventos'}</span>
                    </div>
                    <div className="h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                      <div
                        className="h-full bg-gradient-to-r from-orange-500 to-rose-500 rounded-full transition-all"
                        style={{ width: `${Math.max(8, Math.round((count / maxIngredientCount) * 100))}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-6 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-xl">
                Sin desabastecimientos registrados aún. Cuando la cocina reporte faltantes, aquí verás qué conviene comprar.
              </div>
            )}
          </div>

          {/* Agotados activos en carta */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 shadow-md">
            <h4 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
              <PackageX className="w-4 h-4 text-rose-400" /> Agotados en Carta ({soldOutNow.length})
            </h4>
            {soldOutNow.length ? (
              <div className="space-y-2">
                {soldOutNow.map(p => (
                  <div key={p.id} className="bg-slate-950 border border-rose-500/20 rounded-xl p-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <img src={p.image} alt="" className="w-10 h-10 rounded-lg object-cover grayscale opacity-70 shrink-0" loading="lazy" />
                      <div className="min-w-0 space-y-0.5">
                        <h5 className="text-xs font-bold text-white truncate">{p.name}</h5>
                        <p className="text-[11px] text-rose-300 truncate">
                          Sin: {(p.soldOutInfo?.missingIngredients || []).join(', ') || 'Insumo no especificado'}
                        </p>
                        {p.soldOutInfo?.note && (
                          <p className="text-[10px] italic text-slate-500 truncate">“{p.soldOutInfo.note}”</p>
                        )}
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-400 whitespace-nowrap shrink-0">{timeAgo(p.soldOutInfo?.at)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500">Todos los platillos tienen stock disponible. 👍</p>
            )}
          </div>

          {/* Historial completo */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 shadow-md">
            <div className="flex items-center justify-between">
              <h4 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                <History className="w-4 h-4 text-indigo-400" /> Historial de Desabastecimiento ({stockEvents.length})
              </h4>
              <span className="text-[10px] text-slate-500">Más reciente primero</span>
            </div>
            {stockEvents.length ? (
              <div className="space-y-2 max-h-96 overflow-y-auto hide-scrollbar pr-1">
                {stockEvents.map(ev => (
                  <div key={ev.id} className="bg-slate-950 border border-slate-800/80 rounded-xl p-3 flex items-start justify-between gap-3">
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${
                          ev.type === 'AGOTADO'
                            ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                            : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                        }`}>
                          {ev.type}
                        </span>
                        <span className="text-xs font-bold text-slate-200">{ev.ingredient}</span>
                      </div>
                      {ev.affectedProducts?.length > 0 && (
                        <p className="text-[11px] text-slate-400">
                          Afectó: <span className="text-rose-300 font-medium">{ev.affectedProducts.join(', ')}</span>
                        </p>
                      )}
                      {ev.note && <p className="text-[11px] italic text-slate-500">“{ev.note}”</p>}
                    </div>
                    <div className="text-right shrink-0 space-y-0.5">
                      <p className="text-[10px] text-slate-500">{formatEventTimestamp(ev.timestamp)}</p>
                      <p className="text-[10px] text-slate-600">por {ev.reportedBy || 'Cocina'}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-xl">
                Aún no hay eventos registrados. Los reportes de cocina aparecerán aquí automáticamente.
              </div>
            )}
          </div>
    </AdminShell>
  );
}
