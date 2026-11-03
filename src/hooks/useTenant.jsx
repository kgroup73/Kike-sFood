import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api } from '../services/api';

const TenantContext = createContext(null);

/** Carga el restaurante por su slug de la URL (/r/:slug, /staff/:slug). */
export function TenantProvider({ slug, children }) {
  const [state, setState] = useState({ tenant: null, loading: true, error: null });

  const load = useCallback(async () => {
    try {
      const tenant = await api.getTenantBySlug(slug);
      setState({ tenant, loading: false, error: tenant ? null : 'notfound' });
    } catch (err) {
      setState({ tenant: null, loading: false, error: err.message });
    }
  }, [slug]);

  useEffect(() => {
    setState({ tenant: null, loading: true, error: null });
    load();
  }, [load]);

  return <TenantContext.Provider value={{ ...state, reload: load }}>{children}</TenantContext.Provider>;
}

export function useTenant() {
  const ctx = useContext(TenantContext);
  if (!ctx) throw new Error('useTenant debe usarse dentro de <TenantProvider>');
  return ctx;
}
