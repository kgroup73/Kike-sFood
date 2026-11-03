import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api } from '../services/api';

const StaffSessionContext = createContext(null);

export function StaffSessionProvider({ children }) {
  const [state, setState] = useState({ staff: null, loading: true });

  const refresh = useCallback(async () => {
    const staff = await api.getCurrentStaff().catch(() => null);
    setState({ staff, loading: false });
  }, []);

  useEffect(() => {
    refresh();
    return api.onAuthChange(refresh);
  }, [refresh]);

  const login = useCallback(
    async (params) => {
      const staff = await api.loginStaff(params);
      setState({ staff, loading: false });
      return staff;
    },
    []
  );

  const logout = useCallback(async () => {
    await api.logoutStaff();
    setState({ staff: null, loading: false });
  }, []);

  return (
    <StaffSessionContext.Provider value={{ ...state, login, logout, refresh }}>{children}</StaffSessionContext.Provider>
  );
}

export function useStaffSession() {
  const ctx = useContext(StaffSessionContext);
  if (!ctx) throw new Error('useStaffSession debe usarse dentro de <StaffSessionProvider>');
  return ctx;
}
