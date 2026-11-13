import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '../services/api';
import { useToast } from './useToast';

export function useSuperAdmin() {
  const showToast = useToast();
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(null); // null = cargando, true/false = verificado
  const [loading, setLoading] = useState(true);
  const [tenants, setTenants] = useState([]);
  const [upgradeCodes, setUpgradeCodes] = useState([]);

  // Filtros de búsqueda
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // all | active | suspended
  const [planFilter, setPlanFilter] = useState('all'); // all | basic | intermedio | premium

  // Cargar usuario autenticado y verificar rol de superadmin
  const checkAuth = useCallback(async () => {
    try {
      const authUser = await api.getAuthUser();
      setUser(authUser);
      if (!authUser) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }
      const adminStatus = await api.checkIsPlatformAdmin(authUser.email);
      setIsAdmin(Boolean(adminStatus));
    } catch {
      setIsAdmin(false);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadData = useCallback(async () => {
    if (!isAdmin) return;
    setLoading(true);
    try {
      const [tenantsList, codesList] = await Promise.all([
        api.superadminListTenants(),
        api.superadminListUpgradeCodes()
      ]);
      setTenants(Array.isArray(tenantsList) ? tenantsList : []);
      setUpgradeCodes(Array.isArray(codesList) ? codesList : []);
    } catch (err) {
      showToast(err.message || 'Error al cargar datos de administración', 'error');
    } finally {
      setLoading(false);
    }
  }, [isAdmin, showToast]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (isAdmin) {
      loadData();
    }
  }, [isAdmin, loadData]);

  // Métricas agregadas de la plataforma
  const metrics = useMemo(() => {
    const totalTenants = tenants.length;
    const activeTenants = tenants.filter((t) => t.is_active).length;
    const suspendedTenants = totalTenants - activeTenants;
    const totalOrders = tenants.reduce((acc, t) => acc + (Number(t.orders_count) || 0), 0);
    const totalSales = tenants.reduce((acc, t) => acc + (Number(t.total_sales) || 0), 0);

    return {
      totalTenants,
      activeTenants,
      suspendedTenants,
      totalOrders,
      totalSales
    };
  }, [tenants]);

  // Lista de restaurantes filtrada
  const filteredTenants = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return tenants.filter((t) => {
      const matchesSearch =
        !q ||
        t.name?.toLowerCase().includes(q) ||
        t.slug?.toLowerCase().includes(q) ||
        t.email?.toLowerCase().includes(q) ||
        t.city?.toLowerCase().includes(q);

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && t.is_active) ||
        (statusFilter === 'suspended' && !t.is_active);

      const matchesPlan = planFilter === 'all' || t.plan === planFilter;

      return matchesSearch && matchesStatus && matchesPlan;
    });
  }, [tenants, searchQuery, statusFilter, planFilter]);

  // Alternar estado de activación (Activo / Suspendido)
  const toggleTenantActive = async (tenantId, currentActive) => {
    const newStatus = !currentActive;
    // Optimista
    setTenants((prev) =>
      prev.map((t) => (t.id === tenantId ? { ...t, is_active: newStatus } : t))
    );
    try {
      await api.superadminToggleTenant(tenantId, newStatus);
      showToast(
        newStatus ? 'Restaurante activado con éxito' : 'Restaurante suspendido',
        'success'
      );
    } catch (err) {
      // Revertir
      setTenants((prev) =>
        prev.map((t) => (t.id === tenantId ? { ...t, is_active: currentActive } : t))
      );
      showToast(err.message || 'Error al actualizar estado', 'error');
    }
  };

  // Cambiar plan directamente
  const changeTenantPlan = async (tenantId, newPlan, durationDays = null) => {
    try {
      const res = await api.superadminChangeTenantPlan(tenantId, newPlan, durationDays);
      setTenants((prev) =>
        prev.map((t) =>
          t.id === tenantId
            ? { ...t, plan: newPlan, plan_expires_at: res?.planExpiresAt || null }
            : t
        )
      );
      showToast(`Plan actualizado a ${newPlan.toUpperCase()}`, 'success');
      return true;
    } catch (err) {
      showToast(err.message || 'Error al cambiar plan', 'error');
      return false;
    }
  };

  // Generar código de upgrade
  const createUpgradeCode = async ({ plan, durationDays, targetSlug }) => {
    try {
      const res = await api.superadminCreateUpgradeCode({
        plan,
        durationDays,
        targetSlug
      });
      if (res?.code) {
        showToast(`Código generado: ${res.code}`, 'success');
        // Recargar códigos
        const updatedCodes = await api.superadminListUpgradeCodes();
        setUpgradeCodes(updatedCodes);
        return res;
      }
    } catch (err) {
      showToast(err.message || 'Error al generar código', 'error');
      throw err;
    }
  };

  // Generar código y canjearlo inmediatamente para el restaurante (auditoría completa)
  const applyUpgradeCodeToTenant = async ({ slug, durationDays }) => {
    try {
      const codeRes = await api.superadminCreateUpgradeCode({
        plan: 'intermedio',
        durationDays,
        targetSlug: slug
      });
      if (!codeRes?.code) throw new Error('No se pudo generar el código');
      await api.redeemPlanCode({
        slug,
        code: codeRes.code
      });
      showToast(`¡Plan Intermedio activado con código ${codeRes.code}!`, 'success');
      await loadData();
      return codeRes;
    } catch (err) {
      showToast(err.message || 'Error al activar plan mediante código', 'error');
      throw err;
    }
  };

  const signIn = async () => {
    await api.signInWithGoogle();
  };

  const signOut = async () => {
    await api.signOutAuth();
    setUser(null);
    setIsAdmin(false);
  };

  return {
    user,
    isAdmin,
    loading,
    metrics,
    tenants: filteredTenants,
    allTenantsCount: tenants.length,
    upgradeCodes,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    planFilter,
    setPlanFilter,
    toggleTenantActive,
    changeTenantPlan,
    createUpgradeCode,
    applyUpgradeCodeToTenant,
    refresh: loadData,
    signIn,
    signOut
  };
}
