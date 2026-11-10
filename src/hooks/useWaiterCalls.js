import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../services/api';

/** Llamados al mesero sin atender, en tiempo real. `onNewCall` suena y avisa. */
export function useWaiterCalls(tenantId, { enabled = true, onNewCall } = {}) {
  const [calls, setCalls] = useState([]);
  const [error, setError] = useState(null);
  const onNewCallRef = useRef(onNewCall);
  useEffect(() => {
    onNewCallRef.current = onNewCall;
  }, [onNewCall]);

  const reload = useCallback(async () => {
    if (!tenantId || !enabled) return;
    try {
      setCalls(await api.listWaiterCalls(tenantId));
      setError(null);
    } catch (err) {
      setError(err.message);
    }
  }, [tenantId, enabled]);

  useEffect(() => {
    if (!tenantId || !enabled) {
      setCalls([]);
      return undefined;
    }
    reload();
    const unsubscribe = api.subscribeWaiterCalls(tenantId, {
      onInsert: (call) => {
        onNewCallRef.current?.(call);
        reload();
      },
      onChange: reload
    });
    // Respaldo por si se pierde un evento de tiempo real.
    const timer = setInterval(reload, 60000);
    return () => {
      clearInterval(timer);
      unsubscribe();
    };
  }, [tenantId, enabled, reload]);

  const attend = useCallback(
    async (callId) => {
      setCalls((list) => list.filter((c) => c.id !== callId));
      try {
        await api.attendWaiterCall(callId);
      } catch (err) {
        reload();
        throw err;
      }
    },
    [reload]
  );

  return { calls, error, reload, attend };
}
