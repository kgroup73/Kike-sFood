import { useEffect, useMemo, useState } from 'react';
import { PackageX, PackageCheck, Search } from 'lucide-react';
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

  const stats = [
    [soldOutNow.length, soldOutNow.length === 1 ? 'plato agotado ahora' : 'platos agotados ahora'],
    [depletedEvents.length, depletedEvents.length === 1 ? 'agotamiento registrado' : 'agotamientos registrados'],
    [rankedIngredients.length, rankedIngredients.length === 1 ? 'ingrediente afectado' : 'ingredientes afectados']
  ];

  return (
    <AdminShell title="Inventario" subtitle="Lo que la cocina ha reportado como agotado, y qué conviene comprar. La cocina agota y repone los ingredientes.">
      {(menuError || eventsError) && <InlineError message={menuError || eventsError} onRetry={reload} />}

      <dl className="grid grid-cols-3 border-y border-linea divide-x divide-linea">
        {stats.map(([value, label]) => (
          <div key={label} className="py-4 px-3 sm:px-6 first:pl-0">
            <dt className="sr-only">{label}</dt>
            <dd className="precio font-extrabold text-4xl leading-none">{value}</dd>
            <dd className="text-sm text-suave mt-1.5">{label}</dd>
          </div>
        ))}
      </dl>

      <div className="grid lg:grid-cols-2 gap-10 items-start">
        <div className="space-y-10">
          <section className="space-y-3">
            <div className="flex items-end justify-between gap-3 flex-wrap">
              <h2 className="block-title">Agotado ahora ({soldOutIngredients.length})</h2>
              <label className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-suave absolute left-3.5 top-1/2 -translate-y-1/2" aria-hidden="true" />
                <input
                  type="search"
                  value={ingredientQuery}
                  onChange={(e) => setIngredientQuery(e.target.value)}
                  placeholder="Buscar ingrediente o plato"
                  aria-label="Buscar ingrediente o plato"
                  className="field !pl-10"
                />
              </label>
            </div>
            {filteredIngredients.length ? (
              <ul className="surface divide-y divide-linea overflow-hidden">
                {filteredIngredients.map((ing) => {
                  const info = ingredientsStock[ing.key];
                  return (
                    <li key={ing.key} className="px-5 py-3 border-l-4 border-aji">
                      <p className="font-bold">{ing.name}</p>
                      <p className="text-sm text-suave">No se pueden pedir: {ing.usedBy.join(', ') || 'ningún plato'}</p>
                      {info?.at && (
                        <p className="text-sm text-aji font-bold">
                          Agotado {timeAgo(info.at)}
                          {info.note ? `: “${info.note}”` : ''}
                        </p>
                      )}
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="py-8 px-6 text-center text-suave border-2 border-dashed border-linea rounded-2xl">
                {masterIngredients.length ? 'Nada agotado en este momento.' : 'No hay ingredientes registrados en los platos.'}
              </p>
            )}
          </section>

          <section className="space-y-3">
            <h2 className="block-title">Qué conviene comprar</h2>
            <p className="text-suave -mt-1">Cuántas veces cada ingrediente dejó platos sin poder pedirse. Los que más se repiten van primero.</p>
            {rankedIngredients.length ? (
              <ol className="space-y-3 pt-1">
                {rankedIngredients.map(([ing, count]) => (
                  <li key={ing} className="space-y-1.5">
                    <div className="flex justify-between items-baseline gap-2">
                      <span className="font-bold flex items-center gap-2 min-w-0">
                        <span className="truncate">{ing}</span>
                        {count >= 2 && <span className="shrink-0 text-xs font-bold px-1.5 py-0.5 rounded bg-aji text-white">Prioridad</span>}
                      </span>
                      <span className="precio text-suave whitespace-nowrap">
                        {count} {count === 1 ? 'vez' : 'veces'}
                      </span>
                    </div>
                    <div className="h-2.5 bg-linea rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${count >= 2 ? 'bg-aji' : 'bg-hoja'}`} style={{ width: `${Math.max(6, Math.round((count / maxIngredientCount) * 100))}%` }} />
                    </div>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="py-8 px-6 text-center text-suave border-2 border-dashed border-linea rounded-2xl">
                Sin agotamientos registrados. Cuando la cocina reporte faltantes, aquí verás qué comprar.
              </p>
            )}
          </section>
        </div>

        <section className="space-y-3">
          <h2 className="block-title">Historial ({stockEvents.length})</h2>
          {stockEvents.length ? (
            <ol className="surface divide-y divide-linea overflow-hidden max-h-[640px] overflow-y-auto">
              {stockEvents.map((ev) => {
                const out = ev.type === 'AGOTADO';
                return (
                  <li key={ev.id} className="px-5 py-3 flex items-start gap-3">
                    {out ? <PackageX className="w-5 h-5 text-aji shrink-0 mt-0.5" aria-hidden="true" /> : <PackageCheck className="w-5 h-5 text-hoja shrink-0 mt-0.5" aria-hidden="true" />}
                    <div className="flex-1 min-w-0">
                      <p>
                        <span className="font-bold">{ev.ingredient}</span> {out ? 'se agotó' : 'se repuso'}
                      </p>
                      {ev.affectedProducts?.length > 0 && <p className="text-sm text-suave">Afectó: {ev.affectedProducts.join(', ')}</p>}
                      {ev.note && <p className="text-sm italic text-suave">“{ev.note}”</p>}
                    </div>
                    <div className="text-right shrink-0 text-sm text-suave">
                      <p>{formatEventTimestamp(ev.timestamp)}</p>
                      <p>{ev.reportedBy || 'Cocina'}</p>
                    </div>
                  </li>
                );
              })}
            </ol>
          ) : (
            <p className="py-8 px-6 text-center text-suave border-2 border-dashed border-linea rounded-2xl">Aún no hay reportes de la cocina.</p>
          )}
        </section>
      </div>
    </AdminShell>
  );
}
