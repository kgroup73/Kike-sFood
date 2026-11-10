import { useCallback } from 'react';
import { BellRing, Check } from 'lucide-react';
import { useWaiterCalls } from '../../hooks/useWaiterCalls';
import { useToast } from '../../hooks/useToast';
import { useNow } from '../../hooks/useNow';
import { playChime } from '../../hooks/useSound';

const minutesSince = (iso, now) => Math.max(0, Math.floor((now - new Date(iso).getTime()) / 60000));

/**
 * Llamados al mesero: una pila fija en la esquina, visible en todas las secciones del
 * panel. Cualquier persona del turno puede marcar el llamado como atendido.
 */
export default function WaiterCalls({ tenantId }) {
  const showToast = useToast();
  const now = useNow(30000);
  const onNewCall = useCallback(
    (call) => {
      playChime();
      showToast(`La mesa ${call.tableLabel} llama al mesero`);
    },
    [showToast]
  );
  const { calls, attend } = useWaiterCalls(tenantId, { onNewCall });

  if (!calls.length) return null;
  return (
    <section
      aria-label="Llamados al mesero"
      aria-live="polite"
      className="fixed z-40 inset-x-3 bottom-3 sm:inset-x-auto sm:right-4 sm:bottom-4 sm:w-80 space-y-2 print-hidden"
    >
      {calls.slice(-4).map((call) => {
        const mins = minutesSince(call.createdAt, now);
        return (
          <div key={call.id} className="animate-sheet rounded-2xl bg-tinta text-mantel shadow-2xl p-3 pl-4 flex items-center gap-3">
            <BellRing className="w-5 h-5 text-maracuya shrink-0" aria-hidden="true" />
            <div className="flex-1 min-w-0 leading-tight">
              <p className="font-bold">Mesa {call.tableLabel} llama al mesero</p>
              <p className="text-sm text-mantel/70">{mins === 0 ? 'Ahora' : `Hace ${mins} min`}</p>
            </div>
            <button
              onClick={() => attend(call.id).catch((err) => showToast(err.message, 'error'))}
              className="btn btn-sm bg-mantel text-tinta hover:bg-plato shrink-0"
              aria-label={`Marcar atendido el llamado de la mesa ${call.tableLabel}`}
            >
              <Check className="w-4 h-4" aria-hidden="true" /> Atendido
            </button>
          </div>
        );
      })}
      {calls.length > 4 && <p className="text-right text-sm font-bold text-suave">y {calls.length - 4} más</p>}
    </section>
  );
}
