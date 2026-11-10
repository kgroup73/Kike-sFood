import { useState } from 'react';
import { Printer, AlertTriangle, Clock, Receipt, Check, ClipboardList } from 'lucide-react';
import { KITCHEN_STATUSES } from '../../lib/orderStatus';
import { useNow } from '../../hooks/useNow';

// Una comanda sin imprimir por más de este tiempo indica que el equipo de la impresora no está activo.
const PRINT_LATE_MS = 60000;
const hhmm = (iso) => new Date(iso).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });

/**
 * Comandas sin pantalla de cocina: la cocina trabaja con la comanda impresa y aquí el
 * mesero o la caja ven qué está abierto, si ya se imprimió, y la cierran con un toque
 * (entregada, o a caja si el plan la incluye).
 */
export default function OrdersListView({ orders, withPos, onFinish, onReprint }) {
  const now = useNow(15000);
  const [busy, setBusy] = useState(null);
  const open = orders.filter((o) => KITCHEN_STATUSES.includes(o.status));
  const stuck = open.filter((o) => !o.printedAt && now - new Date(o.createdAt).getTime() > PRINT_LATE_MS);
  const finishLabel = withPos ? 'Pasar a caja' : 'Entregada';
  const FinishIcon = withPos ? Receipt : Check;

  const run = async (key, fn) => {
    setBusy(key);
    try {
      await fn();
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <h1 className="page-title">Comandas</h1>
        <p className="text-suave">
          {open.length ? `${open.length} ${open.length === 1 ? 'comanda abierta' : 'comandas abiertas'}` : 'Sin comandas abiertas'} · la cocina trabaja con la comanda impresa
        </p>
      </div>

      {stuck.length > 0 && (
        <div role="alert" className="rounded-2xl border-2 border-aji bg-aji/10 p-4 flex gap-3">
          <AlertTriangle className="w-5 h-5 text-aji shrink-0 mt-0.5" aria-hidden="true" />
          <div className="space-y-1">
            <p className="font-bold">
              {stuck.length === 1 ? 'Hay 1 comanda sin imprimir' : `Hay ${stuck.length} comandas sin imprimir`} hace más de un minuto.
            </p>
            <p className="text-suave">Revisa que el computador de la impresora esté encendido, con el panel abierto y la impresora con papel. Saldrán solas apenas vuelva.</p>
          </div>
        </div>
      )}

      {open.length ? (
        <ul className="grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(260px,1fr))] items-start">
          {open.map((o) => {
            const mins = Math.max(0, Math.floor((now - new Date(o.createdAt).getTime()) / 60000));
            const late = !o.printedAt && now - new Date(o.createdAt).getTime() > PRINT_LATE_MS;
            return (
              <li key={o.id} className="surface p-4 space-y-3" aria-label={`Comanda ${o.id}, mesa ${o.tableLabel}`}>
                <header className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-display font-extrabold text-3xl tracking-tight leading-none">Mesa {o.tableLabel}</p>
                    <p className="mt-1 text-sm text-suave">Comanda {o.id}</p>
                  </div>
                  <p className="precio inline-flex items-center gap-1 font-bold text-suave">
                    <Clock className="w-4 h-4" aria-hidden="true" /> {mins} min
                  </p>
                </header>
                <ul className="text-sm space-y-1 border-t border-linea pt-3">
                  {o.items.map((it, i) => (
                    <li key={i}>
                      <span className="precio font-bold">{it.quantity}</span> {it.name}
                      {it.selectedOptions?.length > 0 && <span className="text-suave"> · {it.selectedOptions.join(', ')}</span>}
                    </li>
                  ))}
                </ul>
                <p className={`text-sm font-bold inline-flex items-center gap-1.5 ${o.printedAt ? 'text-hoja' : late ? 'text-aji' : 'text-suave'}`}>
                  <Printer className="w-4 h-4" aria-hidden="true" />
                  {o.printedAt ? `Impresa ${hhmm(o.printedAt)}` : late ? 'Sin imprimir' : 'Imprimiendo…'}
                </p>
                <div className="flex gap-2">
                  <button disabled={busy === o.id} onClick={() => run(o.id, () => onFinish(o))} className="btn btn-primary flex-1">
                    <FinishIcon className="w-4 h-4" aria-hidden="true" /> {busy === o.id ? 'Guardando…' : finishLabel}
                  </button>
                  <button
                    disabled={busy === `p${o.id}` || !o.printedAt}
                    onClick={() => run(`p${o.id}`, () => onReprint(o))}
                    className="btn btn-quiet"
                    aria-label={`Reimprimir la comanda ${o.id}`}
                    title="Reimprimir"
                  >
                    <Printer className="w-4 h-4" aria-hidden="true" />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="surface py-16 text-center space-y-2">
          <ClipboardList className="w-8 h-8 mx-auto text-suave" aria-hidden="true" />
          <p className="font-display font-bold text-2xl">No hay comandas abiertas</p>
          <p className="text-suave">Cada pedido nuevo se imprime solo en el equipo de la impresora y aparece aquí.</p>
        </div>
      )}
    </div>
  );
}
