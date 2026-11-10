import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { api } from '../services/api';
import { printJobHtml } from '../lib/kitchenTicket';
import { printHtml, isPrinterDevice, setPrinterDevice, subscribePrinterDevice } from '../services/printer';

/** ¿Este navegador imprime? (preferencia del dispositivo, no del restaurante) */
export function usePrinterDevice(tenantId) {
  const on = useSyncExternalStore(subscribePrinterDevice, () => isPrinterDevice(tenantId), () => false);
  const set = useCallback((value) => setPrinterDevice(tenantId, value), [tenantId]);
  return [on, set];
}

/**
 * Respaldo del agente local: este navegador saca trabajos de la fila de impresión
 * (comandas, tiquetes y pruebas de todas las estaciones) y los imprime con un iframe
 * oculto. Sin vista previa solo con Chrome abierto con --kiosk-printing. El servidor
 * entrega cada trabajo una sola vez, aunque haya un agente o varios navegadores activos.
 */
export function useOrderPrinter(tenant, { enabled }) {
  const [state, setState] = useState({ printed: 0, lastAt: null, error: null });
  const busy = useRef(false);
  const again = useRef(false);

  const sweep = useCallback(async () => {
    if (busy.current) {
      again.current = true;
      return;
    }
    busy.current = true;
    try {
      for (let round = 0; round < 10; round++) {
        const jobs = await api.claimPrintJobs(null);
        if (!jobs.length) break;
        for (const job of jobs) {
          try {
            await printHtml(printJobHtml(job));
            await api.reportPrintJob(job.id, true);
            setState((s) => ({ printed: s.printed + 1, lastAt: new Date().toISOString(), error: null }));
          } catch (err) {
            await api.reportPrintJob(job.id, false, err.message).catch(() => {});
            throw err;
          }
        }
      }
      setState((s) => (s.error ? { ...s, error: null } : s));
    } catch (err) {
      setState((s) => ({ ...s, error: err.message || 'No se pudo imprimir' }));
    } finally {
      busy.current = false;
      if (again.current) {
        again.current = false;
        sweep();
      }
    }
  }, []);

  useEffect(() => {
    if (!enabled || !tenant?.id) return undefined;
    sweep();
    const unsubscribe = api.subscribePrintJobs(tenant.id, sweep);
    // Respaldo: si se pierde un evento (equipo dormido, red caída), lo pendiente sale igual.
    const timer = setInterval(sweep, 20000);
    return () => {
      clearInterval(timer);
      unsubscribe();
    };
  }, [enabled, tenant?.id, sweep]);

  return state;
}
