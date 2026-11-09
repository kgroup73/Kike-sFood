import { useState, useMemo } from 'react';
import { PackageX, PackageCheck, ChevronDown, Clock, BellRing } from 'lucide-react';
import { timeAgo, INGREDIENT_CATEGORIES } from '../../lib/inventory';
import { ORDER_STATUS, KITCHEN_NEXT_STEP, KITCHEN_STATUSES } from '../../lib/orderStatus';
import { useNow } from '../../hooks/useNow';

// Cada estado tiene un color fijo (el mismo en caja). Ver .chip-* en src/index.css.
const STATUS = {
  [ORDER_STATUS.PENDING]: { chip: 'chip-pendiente', label: 'Nueva', button: 'btn-dark' },
  [ORDER_STATUS.PREPARING]: { chip: 'chip-preparando', label: 'En preparación', button: 'btn-primary' },
  [ORDER_STATUS.READY]: { chip: 'chip-listo', label: 'Lista', button: 'btn-quiet !border-tinta' }
};

// Minutos desde que llegó la comanda: a partir de 15 se avisa, a partir de 25 está atrasada.
const LATE_WARN = 15;
const LATE = 25;

export default function KitchenView({
  kitchenOrders: allOrders,
  masterIngredients = [],
  ingredientsStock = {},
  updateOrderStatus,
  onMarkIngredientSoldOut,
  onRestockIngredient
}) {
  const [activeTab, setActiveTab] = useState('orders');
  const [busy, setBusy] = useState(null);
  const now = useNow(30000); // refresca los minutos de espera
  const kitchenOrders = useMemo(() => allOrders.filter(o => KITCHEN_STATUSES.includes(o.status)), [allOrders]);

  const run = async (key, fn) => {
    setBusy(key);
    try {
      await fn();
    } finally {
      setBusy(null);
    }
  };
  const [expandedCategories, setExpandedCategories] = useState({});

  const toggleCategory = (id) => {
    setExpandedCategories(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const activeOrdersCount = kitchenOrders.length;
  const soldOutIngredients = masterIngredients.filter(ing => ingredientsStock[ing.key]?.soldOut);

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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="space-y-1.5">
          <h1 className="page-title">Cocina</h1>
          <p className="text-suave">
            {activeTab === 'orders'
              ? activeOrdersCount
                ? `${activeOrdersCount} ${activeOrdersCount === 1 ? 'comanda en el riel' : 'comandas en el riel'}`
                : 'Sin comandas pendientes'
              : soldOutIngredients.length
                ? `${soldOutIngredients.length} ${soldOutIngredients.length === 1 ? 'ingrediente agotado' : 'ingredientes agotados'}`
                : 'Todos los ingredientes disponibles'}
          </p>
        </div>
        <div className="inline-flex p-1 rounded-full bg-linea/60 self-start sm:self-auto" role="tablist" aria-label="Vista de cocina">
          {[
            ['orders', 'Comandas', activeOrdersCount],
            ['inventory', 'Ingredientes', soldOutIngredients.length]
          ].map(([key, label, count]) => (
            <button
              key={key}
              role="tab"
              aria-selected={activeTab === key}
              onClick={() => setActiveTab(key)}
              className={`h-10 px-4 rounded-full font-bold flex items-center gap-2 transition-colors ${activeTab === key ? 'bg-plato text-tinta shadow-sm' : 'text-suave hover:text-tinta'}`}
            >
              {label}
              {count > 0 && (
                <span className={`precio text-sm min-w-6 h-6 px-1.5 rounded-full flex items-center justify-center ${key === 'inventory' ? 'bg-aji text-white' : 'bg-tinta text-mantel'}`}>{count}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'orders' && (
        <section aria-label="Riel de comandas" className="bg-acero rounded-[28px] p-4 sm:p-6 min-h-[420px] relative">
          {/* El riel de acero del que cuelgan las comandas */}
          <div className="h-2.5 rounded-full bg-gradient-to-b from-white/25 to-white/5 mb-5" aria-hidden="true" />
          {kitchenOrders.length ? (
            <div className="grid gap-4 sm:gap-5 [grid-template-columns:repeat(auto-fill,minmax(250px,1fr))] items-start">
              {kitchenOrders.map((order) => {
                const st = STATUS[order.status] || {};
                const mins = Math.max(0, Math.floor((now - new Date(order.createdAt).getTime()) / 60000));
                const late = mins >= LATE;
                const step = KITCHEN_NEXT_STEP[order.status];
                return (
                  <article key={order.id} aria-label={`Comanda ${order.id}, mesa ${order.tableLabel}`} className="animate-ticket drop-shadow-[0_10px_14px_rgb(0_0_0/0.4)]">
                    <div className="tiquete">
                    <div className="px-5 pt-6 pb-4 space-y-4">
                      <header className="flex items-start justify-between gap-3">
                        <div className="leading-none">
                          <p className="text-sm text-suave mb-1">Mesa</p>
                          <p className="precio font-extrabold text-5xl tracking-tight">{order.tableLabel}</p>
                        </div>
                        <div className="text-right space-y-2">
                          <p
                            className={`precio inline-flex items-center gap-1 font-bold text-lg ${late ? 'text-aji' : mins >= LATE_WARN ? 'text-[#9A6B00]' : 'text-tinta'}`}
                            title={timeAgo(order.createdAt)}
                          >
                            <Clock className="w-4 h-4" aria-hidden="true" />
                            {mins} min
                          </p>
                          <div>
                            <span className={`chip ${late ? 'chip-alerta' : st.chip}`}>{late ? 'Atrasada' : st.label}</span>
                          </div>
                        </div>
                      </header>
                      <p className="text-sm text-suave -mt-1">Comanda {order.id}</p>

                      <ul className="border-t-2 border-dashed border-linea pt-3 space-y-2.5">
                        {order.items.map((item, idx) => (
                          <li key={idx} className="flex gap-3">
                            <span className="precio font-extrabold text-xl leading-6 w-7 shrink-0 text-right">{item.quantity}</span>
                            <div className="min-w-0">
                              <p className="font-bold text-[17px] leading-6">{item.name}</p>
                              {item.selectedOptions?.length > 0 && <p className="text-suave leading-snug">{item.selectedOptions.join(', ')}</p>}
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {step && (
                      <div className="px-4 pb-4">
                        <button
                          disabled={busy === order.id}
                          onClick={() => run(order.id, () => updateOrderStatus(order.id, step.to))}
                          className={`btn w-full h-12 ${st.button}`}
                        >
                          {busy === order.id ? 'Guardando…' : step.label}
                        </button>
                      </div>
                    )}
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="py-24 text-center space-y-2 text-white/70">
              <BellRing className="w-8 h-8 mx-auto text-white/40" aria-hidden="true" />
              <p className="font-display font-bold text-2xl text-white">El riel está vacío</p>
              <p>Las comandas nuevas aparecen aquí con un sonido.</p>
            </div>
          )}
        </section>
      )}

      {activeTab === 'inventory' && (
        <section className="space-y-4 max-w-4xl">
          <p className="text-suave leading-relaxed max-w-2xl">
            Si se acaba un ingrediente, márcalo como agotado: los platos que lo usan dejan de poder pedirse en la carta al instante, y el faltante queda en el reporte de inventario.
          </p>

          {groupedByCategory.length ? (
            <div className="surface divide-y divide-linea overflow-hidden">
              {groupedByCategory.map((group) => {
                const isExpanded = !!expandedCategories[group.id];
                const groupSoldOut = group.ingredients.filter((ing) => ingredientsStock[ing.key]?.soldOut).length;
                return (
                  <div key={group.id}>
                    <button
                      aria-expanded={isExpanded}
                      onClick={() => toggleCategory(group.id)}
                      className="w-full flex items-center justify-between gap-3 px-5 py-4 hover:bg-mantel transition-colors text-left"
                    >
                      <span className="min-w-0">
                        <span className="block font-display font-bold text-lg">{group.label}</span>
                        <span className="block text-sm text-suave">
                          {group.ingredients.length} {group.ingredients.length === 1 ? 'ingrediente' : 'ingredientes'}
                        </span>
                      </span>
                      <span className="flex items-center gap-3 shrink-0">
                        {groupSoldOut > 0 && <span className="chip chip-alerta">{groupSoldOut} {groupSoldOut === 1 ? 'agotado' : 'agotados'}</span>}
                        <ChevronDown className={`w-5 h-5 text-suave transition-transform ${isExpanded ? 'rotate-180' : ''}`} aria-hidden="true" />
                      </span>
                    </button>

                    {isExpanded && (
                      <ul className="border-t border-linea divide-y divide-linea bg-mantel/50">
                        {group.ingredients.map((ing) => {
                          const info = ingredientsStock[ing.key];
                          const isSoldOut = !!info?.soldOut;
                          return (
                            <li key={ing.key} className={`flex flex-wrap sm:flex-nowrap items-center gap-3 px-5 py-3 ${isSoldOut ? 'border-l-4 border-aji pl-4' : ''}`}>
                              <div className="min-w-0 flex-1">
                                <p className="font-bold">{ing.name}</p>
                                <p className="text-sm text-suave truncate">Lo usan: {ing.usedBy.join(', ') || 'ningún plato'}</p>
                                {isSoldOut && (
                                  <p className="text-sm font-bold text-aji">
                                    Agotado {timeAgo(info.at)}
                                    {info.note ? `: “${info.note}”` : ''}
                                  </p>
                                )}
                              </div>
                              {isSoldOut ? (
                                <button disabled={busy === ing.key} onClick={() => run(ing.key, () => onRestockIngredient(ing.name))} className="btn btn-sm btn-primary">
                                  <PackageCheck className="w-4 h-4" aria-hidden="true" /> Reponer
                                </button>
                              ) : (
                                <button disabled={busy === ing.key} onClick={() => run(ing.key, () => onMarkIngredientSoldOut(ing.name))} className="btn btn-sm btn-danger">
                                  <PackageX className="w-4 h-4" aria-hidden="true" /> Agotar
                                </button>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="py-12 text-center text-suave">No hay ingredientes registrados. Agrégalos a los platos en Administración → Platillos.</p>
          )}
        </section>
      )}
    </div>
  );
}
