import { useMemo, useState } from 'react';
import { Receipt, FastForward, X, MapPin, LayoutGrid } from 'lucide-react';
import { formatCOP } from '../../lib/money';
import { ORDER_STATUS } from '../../lib/orderStatus';
import { TABLE_SHAPES } from '../../lib/environments';

// Estado de cada mesa en sala. Mismos colores que las comandas (ver .chip-* en src/index.css).
const TABLE_STATUS = {
  free: { label: 'Libre', chip: 'bg-plato border border-linea text-suave', table: 'fill-plato stroke-linea', seat: 'fill-mantel stroke-linea' },
  kitchen: { label: 'En cocina', chip: 'chip-preparando', table: 'fill-maracuya/25 stroke-maracuya', seat: 'fill-maracuya/40 stroke-maracuya' },
  to_pay: { label: 'Por cobrar', chip: 'chip-cobrar', table: 'fill-tinta/10 stroke-tinta', seat: 'fill-tinta/20 stroke-tinta' }
};

const ORDER_CHIP = {
  [ORDER_STATUS.PENDING]: 'chip-pendiente',
  [ORDER_STATUS.PREPARING]: 'chip-preparando',
  [ORDER_STATUS.READY]: 'chip-listo',
  [ORDER_STATUS.TO_PAY]: 'chip-cobrar'
};

/** Dibujo de la mesa (cuadrada, redonda o barra) con sus puestos. */
function TableGraphic({ shape, label, capacity, status }) {
  const s = TABLE_STATUS[status] || TABLE_STATUS.free;
  const text = <tspan className="fill-tinta font-display font-extrabold">{label}</tspan>;

  if (shape === 'bar') {
    return (
      <svg viewBox="0 0 110 80" className="w-24 h-20 sm:w-28 sm:h-[90px]" aria-hidden="true">
        <circle cx="35" cy="66" r="7" className={s.seat} strokeWidth="1.5" />
        <circle cx="75" cy="66" r="7" className={s.seat} strokeWidth="1.5" />
        <rect x="10" y="14" width="90" height="34" rx="8" className={s.table} strokeWidth="2" />
        <text x="55" y="32" textAnchor="middle" dominantBaseline="middle" fontSize="15">{text}</text>
      </svg>
    );
  }

  const round = shape === 'round';
  return (
    <svg viewBox="0 0 100 100" className="w-24 h-24 sm:w-28 sm:h-28" aria-hidden="true">
      {round ? (
        <>
          <circle cx="50" cy="11" r="7" className={s.seat} strokeWidth="1.5" />
          <circle cx="50" cy="89" r="7" className={s.seat} strokeWidth="1.5" />
          <circle cx="11" cy="50" r="7" className={s.seat} strokeWidth="1.5" />
          <circle cx="89" cy="50" r="7" className={s.seat} strokeWidth="1.5" />
          <circle cx="50" cy="50" r="30" className={s.table} strokeWidth="2" />
        </>
      ) : (
        <>
          <rect x="35" y="5" width="30" height="9" rx="3.5" className={s.seat} strokeWidth="1.5" />
          <rect x="35" y="86" width="30" height="9" rx="3.5" className={s.seat} strokeWidth="1.5" />
          <rect x="5" y="35" width="9" height="30" rx="3.5" className={s.seat} strokeWidth="1.5" />
          <rect x="86" y="35" width="9" height="30" rx="3.5" className={s.seat} strokeWidth="1.5" />
          <rect x="19" y="19" width="62" height="62" rx="10" className={s.table} strokeWidth="2" />
        </>
      )}
      <text x="50" y="46" textAnchor="middle" dominantBaseline="middle" fontSize="20">{text}</text>
      <text x="50" y="64" textAnchor="middle" dominantBaseline="middle" fontSize="9" className="fill-suave font-bold">
        {capacity} {capacity === 1 ? 'puesto' : 'puestos'}
      </text>
    </svg>
  );
}

/** Una mesa que se puede seleccionar para ver su cuenta. */
function TableButton({ table, selected, onSelect, envName }) {
  const s = TABLE_STATUS[table.status];
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      aria-label={`Mesa ${table.label}, ${s.label}${table.subtotal ? `, ${formatCOP(table.subtotal)}` : ''}`}
      className={`rounded-2xl p-2 flex flex-col items-center gap-1 transition-colors border-2 ${selected ? 'border-hoja bg-hoja/5' : 'border-transparent hover:bg-linea/40'}`}
    >
      <TableGraphic shape={table.shape} label={table.label} capacity={table.capacity} status={table.status} />
      <span className={`chip !h-6 !text-xs ${s.chip}`}>{s.label}</span>
      {table.subtotal > 0 && <span className="precio font-bold">{formatCOP(table.subtotal)}</span>}
      {envName && <span className="text-xs text-suave truncate max-w-full">{envName}</span>}
    </button>
  );
}

/**
 * Plano de sala para la caja: mesas por ambiente con su estado en vivo, detalle de la
 * cuenta y cobro (o cobro directo si aún hay comandas en cocina).
 */
export default function RestaurantFloorPlan({
  tables = [],
  activeTables = [],
  environments = [],
  layoutOf,
  onSaveLayout,
  onCharge,
  onDirectCharge,
  advancingKey
}) {
  const [zone, setZone] = useState('all');
  const [view, setView] = useState('floor'); // 'floor' (por ambientes) | 'mosaic' (cuadrícula)
  const [selectedId, setSelectedId] = useState(null);
  const [saveError, setSaveError] = useState(null);

  const enriched = useMemo(
    () =>
      tables.map((t) => {
        const group = activeTables.find((g) => (g.tableId ? g.tableId === t.id : String(g.tableLabel) === String(t.label)));
        return {
          ...t,
          ...layoutOf(t),
          group,
          status: group ? (group.isReadyToPay ? 'to_pay' : 'kitchen') : 'free',
          subtotal: group?.subtotal || 0
        };
      }),
    [tables, activeTables, layoutOf]
  );

  const envName = (id) => environments.find((e) => e.id === id)?.name || 'Sin ambiente';
  const visible = zone === 'all' ? enriched : enriched.filter((t) => t.zone === zone);
  const selected = enriched.find((t) => t.id === selectedId) || null;
  const toggle = (id) => setSelectedId((cur) => (cur === id ? null : id));

  const save = (patch) => {
    setSaveError(null);
    onSaveLayout({ [selected.id]: patch }).catch((err) => setSaveError(err.message));
  };

  if (!tables.length) {
    return (
      <p className="py-10 px-6 text-center text-suave border-2 border-dashed border-linea rounded-2xl">
        No hay mesas activas. Créalas en Administración → Mesas.
      </p>
    );
  }

  return (
    <section className="space-y-5" aria-label="Plano de mesas">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex gap-2 overflow-x-auto hide-scrollbar -mx-1 px-1" role="group" aria-label="Filtrar por ambiente">
          {[{ id: 'all', name: 'Todos' }, ...environments].map((env) => (
            <button
              key={env.id}
              type="button"
              onClick={() => setZone(env.id)}
              aria-pressed={zone === env.id}
              className={`h-9 px-4 rounded-full text-sm font-bold whitespace-nowrap border transition-colors ${zone === env.id ? 'bg-tinta text-mantel border-tinta' : 'bg-plato border-linea text-tinta hover:border-tinta'}`}
            >
              {env.name}
            </button>
          ))}
        </div>
        <div className="inline-flex p-1 rounded-full bg-linea/60 self-start" role="group" aria-label="Tipo de vista">
          {[
            ['floor', 'Por ambientes', MapPin],
            ['mosaic', 'Mosaico', LayoutGrid]
          ].map(([key, label, Icon]) => (
            <button
              key={key}
              type="button"
              onClick={() => setView(key)}
              aria-pressed={view === key}
              className={`h-9 px-4 rounded-full text-sm font-bold flex items-center gap-1.5 transition-colors ${view === key ? 'bg-plato text-tinta shadow-sm' : 'text-suave hover:text-tinta'}`}
            >
              <Icon className="w-4 h-4" aria-hidden="true" /> {label}
            </button>
          ))}
        </div>
      </div>

      <ul className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-suave" aria-label="Estados de las mesas">
        {Object.entries(TABLE_STATUS).map(([key, s]) => (
          <li key={key} className="flex items-center gap-2">
            <span className={`chip !h-6 !text-xs ${s.chip}`}>{s.label}</span>
            {key === 'free' && 'sin comandas'}
            {key === 'kitchen' && 'con comandas en preparación'}
            {key === 'to_pay' && 'todo listo para facturar'}
          </li>
        ))}
      </ul>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        <div className={selected ? 'lg:col-span-8 space-y-5' : 'lg:col-span-12 space-y-5'}>
          {view === 'floor' ? (
            environments
              .filter((env) => zone === 'all' || zone === env.id)
              .map((env) => {
                const envTables = enriched.filter((t) => t.zone === env.id);
                return (
                  <div key={env.id} className="surface p-4 sm:p-5">
                    <div className="flex items-baseline justify-between gap-3 pb-3 mb-3 border-b border-linea">
                      <h3 className="block-title !text-lg">{env.name}</h3>
                      <span className="text-sm text-suave">{envTables.length} {envTables.length === 1 ? 'mesa' : 'mesas'}</span>
                    </div>
                    {envTables.length ? (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3 justify-items-center">
                        {envTables.map((t) => (
                          <TableButton key={t.id} table={t} selected={t.id === selectedId} onSelect={() => toggle(t.id)} />
                        ))}
                      </div>
                    ) : (
                      <p className="py-4 text-center text-sm text-suave">Sin mesas en este ambiente. Asígnalas desde Administración → Mesas.</p>
                    )}
                  </div>
                );
              })
          ) : (
            <div className="surface p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-3 justify-items-center">
              {visible.map((t) => (
                <TableButton key={t.id} table={t} selected={t.id === selectedId} onSelect={() => toggle(t.id)} envName={envName(t.zone)} />
              ))}
            </div>
          )}
        </div>

        {selected && (
          <aside className="lg:col-span-4 surface overflow-hidden lg:sticky lg:top-4" aria-label={`Detalle de la mesa ${selected.label}`}>
            <header className="px-5 pt-5 pb-4 flex items-start justify-between gap-3">
              <div>
                <h3 className="font-display font-extrabold text-3xl tracking-tight leading-none">Mesa {selected.label}</h3>
                <p className="mt-2 text-sm text-suave">
                  {envName(selected.zone)} · {selected.capacity} {selected.capacity === 1 ? 'puesto' : 'puestos'}
                </p>
              </div>
              <button onClick={() => setSelectedId(null)} className="icon-btn -mr-2 -mt-1" aria-label="Cerrar detalle">
                <X className="w-5 h-5" />
              </button>
            </header>

            {onSaveLayout && (
              <div className="px-5 pb-4 grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="label">Forma</span>
                  <select value={selected.shape} onChange={(e) => save({ shape: e.target.value })} className="field">
                    {Object.entries(TABLE_SHAPES).map(([key, name]) => (
                      <option key={key} value={key}>{name}</option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="label">Ambiente</span>
                  <select value={selected.zone} onChange={(e) => save({ zone: e.target.value })} className="field">
                    {environments.map((env) => (
                      <option key={env.id} value={env.id}>{env.name}</option>
                    ))}
                  </select>
                </label>
                {saveError && <p className="col-span-2 text-sm text-aji" role="alert">{saveError}</p>}
              </div>
            )}

            {selected.group ? (
              <>
                <ul className="border-t border-linea divide-y divide-linea max-h-72 overflow-y-auto">
                  {selected.group.orders.map((o) => (
                    <li key={o.id} className="px-5 py-3 space-y-1.5">
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-bold">Comanda {o.id}</p>
                        <span className={`chip !h-6 !text-xs ${ORDER_CHIP[o.status] || 'chip-pendiente'}`}>{o.status}</span>
                      </div>
                      <ul className="text-sm text-suave space-y-0.5">
                        {o.items.map((it, idx) => (
                          <li key={idx} className="flex justify-between gap-3">
                            <span>{it.quantity} {it.name}</span>
                            <span className="precio shrink-0">{formatCOP(it.totalPrice)}</span>
                          </li>
                        ))}
                      </ul>
                    </li>
                  ))}
                </ul>
                <div className="p-5 border-t border-linea space-y-3">
                  <div className="flex items-baseline justify-between">
                    <span className="text-suave">Consumo</span>
                    <span className="precio font-bold text-2xl">{formatCOP(selected.group.subtotal)}</span>
                  </div>
                  {selected.group.hasKitchenOrders ? (
                    <>
                      <button
                        onClick={() => onDirectCharge(selected.group)}
                        disabled={advancingKey === selected.group.key}
                        className="btn btn-dark w-full h-12"
                      >
                        <FastForward className="w-4 h-4" aria-hidden="true" />
                        {advancingKey === selected.group.key ? 'Pasando a caja…' : 'Cobrar ya, sin esperar cocina'}
                      </button>
                      <p className="text-sm text-suave">
                        {selected.group.kitchenOrders.length === 1 ? '1 comanda sigue' : `${selected.group.kitchenOrders.length} comandas siguen`} en cocina; al cobrar ya pasan a caja.
                      </p>
                    </>
                  ) : (
                    <button onClick={() => onCharge(selected.group)} className="btn btn-primary w-full h-12">
                      <Receipt className="w-4 h-4" aria-hidden="true" /> Facturar mesa {selected.label}
                    </button>
                  )}
                </div>
              </>
            ) : (
              <p className="px-5 py-6 border-t border-linea text-suave">Mesa libre: no tiene comandas abiertas.</p>
            )}
          </aside>
        )}
      </div>
    </section>
  );
}
