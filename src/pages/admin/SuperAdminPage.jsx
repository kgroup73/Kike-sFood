import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Building2,
  KeyRound,
  ShieldCheck,
  ShieldX,
  LogOut,
  RefreshCw,
  Loader2
} from 'lucide-react';
import BrandMark from '../../components/ui/BrandMark';
import { useSuperAdmin } from '../../hooks/useSuperAdmin';
import TenantsManager from '../../components/superadmin/TenantsManager';
import UpgradeCodesManager from '../../components/superadmin/UpgradeCodesManager';

export default function SuperAdminPage() {
  const {
    user,
    isAdmin,
    loading,
    metrics,
    tenants,
    allTenantsCount,
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
    refresh,
    signIn,
    signOut
  } = useSuperAdmin();

  const [activeTab, setActiveTab] = useState('tenants'); // 'tenants' | 'codes'
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  // 1. Estado de carga inicial
  if (loading) {
    return (
      <div className="min-h-screen bg-mantel flex flex-col items-center justify-center p-6 space-y-4">
        <BrandMark size="lg" />
        <div className="flex items-center gap-2 text-suave text-sm">
          <Loader2 className="w-4 h-4 animate-spin" /> Verificando credenciales de administrador...
        </div>
      </div>
    );
  }

  // 2. No autenticado -> Solicitar inicio con Google
  if (!user) {
    return (
      <main className="min-h-screen bg-mantel flex items-center justify-center p-6">
        <div className="card p-8 sm:p-10 max-w-md w-full border-linea text-center space-y-6">
          <div className="flex justify-center">
            <BrandMark size="md" />
          </div>

          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-hoja/10 text-hoja text-xs font-bold uppercase tracking-wider">
              <ShieldCheck className="w-3.5 h-3.5" /> Super Admin
            </div>
            <h1 className="font-display font-extrabold text-3xl text-tinta">
              Administración de la Plataforma
            </h1>
            <p className="text-sm text-suave">
              Acceso restringido para el control global, moderación y planes de restaurantes multi-tenant.
            </p>
          </div>

          <div className="space-y-3 pt-2">
            <button
              type="button"
              onClick={signIn}
              className="btn btn-primary w-full h-12 text-sm flex items-center justify-center gap-3 font-bold"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17Z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.35 24 12 24Z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.19 0 10.04 0 12s.45 3.81 1.25 5.42l4.03-3.15Z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98Z"
                />
              </svg>
              Ingresar con Google
            </button>

            <p className="text-[11px] text-suave">
              Solo cuentas autorizadas como <strong className="text-tinta">omar6688.oc@gmail.com</strong> tienen acceso.
            </p>
          </div>

          <div className="pt-4 border-t border-linea">
            <Link to="/" className="text-xs text-suave underline hover:text-tinta">
              ← Volver al sitio principal
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // 3. Autenticado pero no autorizado (No es admin)
  if (!isAdmin) {
    return (
      <main className="min-h-screen bg-mantel flex items-center justify-center p-6">
        <div className="card p-8 max-w-md w-full border-red-200 bg-red-50/20 text-center space-y-5">
          <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
            <ShieldX className="w-6 h-6" />
          </div>

          <div className="space-y-1.5">
            <h1 className="font-display font-bold text-2xl text-tinta">Acceso No Autorizado</h1>
            <p className="text-xs text-suave">
              La cuenta <strong className="text-tinta">{user.email}</strong> no tiene permisos de administrador de la plataforma Kike's Food.
            </p>
          </div>

          <div className="flex flex-col gap-2 pt-2">
            <button
              type="button"
              onClick={signOut}
              className="btn btn-quiet w-full text-xs flex items-center justify-center gap-2"
            >
              <LogOut className="w-3.5 h-3.5" /> Cerrar sesión y probar con otra cuenta
            </button>
            <Link to="/" className="btn btn-primary w-full text-xs">
              Ir a la página de inicio
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // 4. Autenticado y Autorizado -> Super Admin Dashboard
  return (
    <div className="min-h-screen bg-mantel">
      {/* Barra de Navegación Superior */}
      <header className="border-b border-linea bg-plato sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link to="/" title="Ir a la landing">
              <BrandMark size="sm" />
            </Link>
            <div className="h-5 w-px bg-linea hidden sm:block" />
            <div className="flex items-center gap-2">
              <span className="font-display font-extrabold text-base text-tinta tracking-tight">
                Super Admin
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-hoja text-sobre-hoja uppercase tracking-wider">
                Plataforma
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleRefresh}
              disabled={refreshing}
              className="btn btn-sm btn-quiet text-xs flex items-center gap-1.5"
              title="Actualizar datos"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Actualizar</span>
            </button>

            <div className="h-5 w-px bg-linea" />

            <div className="flex items-center gap-2.5">
              <div className="text-right hidden sm:block">
                <span className="text-xs font-bold text-tinta block truncate max-w-44">
                  {user.user_metadata?.full_name || user.email}
                </span>
                <span className="text-[10px] text-suave block">{user.email}</span>
              </div>

              <button
                type="button"
                onClick={signOut}
                className="btn btn-sm btn-quiet text-xs flex items-center gap-1.5"
                title="Cerrar sesión de administrador"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Salir</span>
              </button>
            </div>
          </div>
        </div>

        {/* Pestañas de Navegación */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center gap-6 border-t border-linea">
          <button
            type="button"
            onClick={() => setActiveTab('tenants')}
            className={`py-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'tenants'
                ? 'border-tinta text-tinta'
                : 'border-transparent text-suave hover:text-tinta'
            }`}
          >
            <Building2 className="w-4 h-4" /> Restaurantes & Tenants
            <span className="chip text-[10px] px-1.5 py-0 bg-linea text-tinta">
              {allTenantsCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('codes')}
            className={`py-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'codes'
                ? 'border-tinta text-tinta'
                : 'border-transparent text-suave hover:text-tinta'
            }`}
          >
            <KeyRound className="w-4 h-4" /> Códigos de Upgrade
            <span className="chip text-[10px] px-1.5 py-0 bg-linea text-tinta">
              {upgradeCodes.length}
            </span>
          </button>
        </div>
      </header>

      {/* Contenido Principal */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {activeTab === 'tenants' && (
          <TenantsManager
            metrics={metrics}
            tenants={tenants}
            allTenantsCount={allTenantsCount}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            planFilter={planFilter}
            setPlanFilter={setPlanFilter}
            toggleTenantActive={toggleTenantActive}
            changeTenantPlan={changeTenantPlan}
            createUpgradeCode={createUpgradeCode}
            applyUpgradeCodeToTenant={applyUpgradeCodeToTenant}
          />
        )}

        {activeTab === 'codes' && (
          <UpgradeCodesManager
            upgradeCodes={upgradeCodes}
            createUpgradeCode={createUpgradeCode}
          />
        )}
      </main>
    </div>
  );
}
