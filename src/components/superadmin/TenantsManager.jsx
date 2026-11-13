import { useState } from 'react';
import {
  Building2,
  CheckCircle2,
  XCircle,
  ShoppingBag,
  DollarSign,
  Search,
  ExternalLink,
  ShieldAlert,
  Clock,
  Loader2,
  KeyRound,
  Lock,
  Copy,
  Check,
  Send,
  CreditCard
} from 'lucide-react';
import { formatCOP } from '../../lib/money';

export default function TenantsManager({
  metrics,
  tenants,
  allTenantsCount,
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
  planFilter,
  setPlanFilter,
  toggleTenantActive,
  changeTenantPlan,
  createUpgradeCode,
  applyUpgradeCodeToTenant
}) {
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [newPlan, setNewPlan] = useState('intermedio');
  const [durationDays, setDurationDays] = useState('30');
  const [savingPlan, setSavingPlan] = useState(false);
  const [actionType, setActionType] = useState('code'); // 'code' | 'apply_now'
  const [generatedCodeResult, setGeneratedCodeResult] = useState(null);
  const [copiedCode, setCopiedCode] = useState(null);

  const openPlanModal = (tenant) => {
    setSelectedTenant(tenant);
    setNewPlan('intermedio');
    setDurationDays('30');
    setActionType('code');
    setGeneratedCodeResult(null);
  };

  const isTestTenant = selectedTenant?.slug === 'la-trattoria';

  const handleExecute = async (e) => {
    e?.preventDefault();
    if (!selectedTenant || savingPlan) return;
    setSavingPlan(true);

    try {
      const duration = durationDays === 'perm' ? null : Number(durationDays);

      if (isTestTenant) {
        // En la-trattoria se permite probar cualquier plan directamente
        const ok = await changeTenantPlan(selectedTenant.id, newPlan, duration);
        if (ok) setSelectedTenant(null);
      } else if (newPlan === 'basic') {
        // Regresar a básico (reseteo o fin de suscripción)
        const ok = await changeTenantPlan(selectedTenant.id, 'basic', null);
        if (ok) setSelectedTenant(null);
      } else {
        // Restaurantes regulares: SIEMPRE mediante código de actualización
        if (actionType === 'apply_now') {
          // Generar código y canjearlo inmediatamente con trazabilidad en DB
          await applyUpgradeCodeToTenant({
            tenantId: selectedTenant.id,
            slug: selectedTenant.slug,
            durationDays: duration
          });
          setSelectedTenant(null);
        } else {
          // Generar código para entregar al cliente
          const res = await createUpgradeCode({
            plan: 'intermedio',
            durationDays: duration,
            targetSlug: selectedTenant.slug
          });
          setGeneratedCodeResult(res);
        }
      }
    } catch (err) {
      console.error('Error al gestionar plan:', err);
    } finally {
      setSavingPlan(false);
    }
  };

  const copyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const shareViaWhatsApp = (code, planName, duration) => {
    const durText = duration ? `${duration} días` : 'permanente';
    const text = `¡Hola! Aquí tienes tu código de activación para Kike's Food (${planName.toUpperCase()} - ${durText}):\n\n👉 *${code}*\n\nCanjéalo ingresando a tu panel administrativo en la sección "Planes".`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="space-y-8">
      {/* 1. Métricas Globales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-5 border-linea space-y-1">
          <div className="flex items-center justify-between text-suave">
            <span className="text-xs font-bold uppercase tracking-wider">Restaurantes</span>
            <Building2 className="w-5 h-5" />
          </div>
          <div className="text-3xl font-display font-extrabold text-tinta">
            {metrics.totalTenants}
          </div>
          <div className="text-xs text-suave flex items-center gap-2">
            <span className="text-hoja font-semibold">● {metrics.activeTenants} activos</span>
            {metrics.suspendedTenants > 0 && (
              <span className="text-aji font-semibold">● {metrics.suspendedTenants} suspendidos</span>
            )}
          </div>
        </div>

        <div className="card p-5 border-linea space-y-1">
          <div className="flex items-center justify-between text-suave">
            <span className="text-xs font-bold uppercase tracking-wider">Pedidos Globales</span>
            <ShoppingBag className="w-5 h-5" />
          </div>
          <div className="text-3xl font-display font-extrabold text-tinta">
            {metrics.totalOrders.toLocaleString('es-CO')}
          </div>
          <div className="text-xs text-suave">Órdenes registradas en la plataforma</div>
        </div>

        <div className="card p-5 border-linea space-y-1">
          <div className="flex items-center justify-between text-suave">
            <span className="text-xs font-bold uppercase tracking-wider">Ventas Acumuladas</span>
            <DollarSign className="w-5 h-5" />
          </div>
          <div className="text-3xl font-display font-extrabold text-tinta">
            {formatCOP(metrics.totalSales)}
          </div>
          <div className="text-xs text-suave">Facturación total consolidada</div>
        </div>

        <div className="card p-5 border-linea space-y-1">
          <div className="flex items-center justify-between text-suave">
            <span className="text-xs font-bold uppercase tracking-wider">Suscripciones</span>
            <CreditCard className="w-5 h-5 text-hoja" />
          </div>
          <div className="text-3xl font-display font-extrabold text-tinta">
            {allTenantsCount}
          </div>
          <div className="text-xs text-suave">Tenants registrados en la base de datos</div>
        </div>
      </div>

      {/* 2. Barra de Búsqueda y Filtros */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-plato p-3 rounded-2xl border border-linea">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-suave absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por nombre, enlace, ciudad..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="field pl-10 pr-3 py-2 text-sm w-full"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="field py-2 text-sm w-full sm:w-auto"
          >
            <option value="all">Todos los estados</option>
            <option value="active">Activos</option>
            <option value="suspended">Suspendidos</option>
          </select>

          <select
            value={planFilter}
            onChange={(e) => setPlanFilter(e.target.value)}
            className="field py-2 text-sm w-full sm:w-auto"
          >
            <option value="all">Todos los planes</option>
            <option value="basic">Plan Básico</option>
            <option value="intermedio">Plan Intermedio</option>
            <option value="premium">Plan Premium (Pruebas)</option>
          </select>
        </div>
      </div>

      {/* 3. Listado de Restaurantes */}
      <div className="space-y-3">
        {tenants.length === 0 ? (
          <div className="card p-12 text-center border-dashed border-linea space-y-3">
            <Building2 className="w-12 h-12 text-suave mx-auto opacity-50" />
            <p className="font-display font-bold text-lg text-tinta">No se encontraron restaurantes</p>
            <p className="text-sm text-suave max-w-sm mx-auto">
              No hay restaurantes que coincidan con los criterios de búsqueda o filtros seleccionados.
            </p>
          </div>
        ) : (
          tenants.map((tenant) => {
            const isSuspended = !tenant.is_active;
            const isTrattoria = tenant.slug === 'la-trattoria';
            const isIntermedio = tenant.plan === 'intermedio';
            const isPremium = tenant.plan === 'premium';

            const planBadgeColor = isPremium
              ? 'bg-amber-100 text-amber-900 border-amber-300'
              : isIntermedio
              ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
              : 'bg-stone-100 text-stone-800 border-stone-200';

            return (
              <div
                key={tenant.id}
                className={`card p-5 border transition-all duration-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-5 ${
                  isSuspended ? 'border-red-200 bg-red-50/20 opacity-80' : 'border-linea bg-plato'
                }`}
              >
                {/* Info Principal */}
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <h3 className="font-display font-bold text-lg text-tinta truncate">
                      {tenant.name}
                    </h3>

                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${planBadgeColor}`}
                    >
                      {tenant.plan || 'basic'}
                    </span>

                    {isTrattoria && (
                      <span className="text-[10px] font-semibold bg-hoja text-white px-2 py-0.5 rounded-full">
                        Pruebas de Producción
                      </span>
                    )}

                    {isSuspended ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-800 border border-red-200">
                        <XCircle className="w-3 h-3" /> Suspendido
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-800 border border-green-200">
                        <CheckCircle2 className="w-3 h-3" /> Activo
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-suave">
                    <span>
                      Enlace: <strong className="text-tinta">/r/{tenant.slug}</strong>
                    </span>
                    {tenant.email && <span>Contacto: {tenant.email}</span>}
                    {tenant.city && <span>Ciudad: {tenant.city}</span>}
                    {tenant.plan_expires_at && (
                      <span className="inline-flex items-center gap-1 text-amber-800 font-semibold">
                        <Clock className="w-3 h-3" />
                        Expira:{' '}
                        {new Date(tenant.plan_expires_at).toLocaleDateString('es-CO', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </span>
                    )}
                  </div>
                </div>

                {/* Métricas del Tenant */}
                <div className="flex items-center gap-6 border-y md:border-y-0 md:border-x border-linea py-3 md:py-0 md:px-6 w-full md:w-auto justify-around">
                  <div className="text-center">
                    <span className="text-[11px] uppercase tracking-wider text-suave font-semibold block">
                      Pedidos
                    </span>
                    <span className="text-lg font-display font-extrabold text-tinta">
                      {Number(tenant.orders_count || 0)}
                    </span>
                  </div>
                  <div className="text-center">
                    <span className="text-[11px] uppercase tracking-wider text-suave font-semibold block">
                      Ventas
                    </span>
                    <span className="text-lg font-display font-extrabold text-tinta">
                      {formatCOP(tenant.total_sales || 0)}
                    </span>
                  </div>
                </div>

                {/* Botones de Acción */}
                <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
                  {/* Botón de Gestión de Plan basado en Códigos */}
                  <button
                    type="button"
                    onClick={() => openPlanModal(tenant)}
                    className="btn btn-sm btn-quiet text-xs flex items-center gap-1.5 font-bold"
                    title={
                      isTrattoria
                        ? 'Gestionar plan de pruebas'
                        : isIntermedio
                        ? 'Renovar suscripción con código'
                        : 'Emitir código para activar Plan Intermedio'
                    }
                  >
                    <KeyRound className="w-3.5 h-3.5 text-hoja" />
                    {isTrattoria
                      ? 'Plan Pruebas'
                      : isIntermedio
                      ? 'Renovar'
                      : 'Activar Intermedio'}
                  </button>

                  <a
                    href={`/r/${tenant.slug}`}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-sm btn-quiet text-xs flex items-center gap-1.5"
                    title="Ver carta pública en pestaña nueva"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> Carta
                  </a>

                  <a
                    href={`/staff/${tenant.slug}/login`}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-sm btn-quiet text-xs flex items-center gap-1.5"
                    title="Ingreso de personal"
                  >
                    Staff
                  </a>

                  <button
                    type="button"
                    onClick={() => toggleTenantActive(tenant.id, tenant.is_active)}
                    className={`btn btn-sm text-xs flex items-center gap-1.5 ${
                      isSuspended
                        ? 'btn-primary bg-emerald-600 hover:bg-emerald-700 text-white'
                        : 'bg-red-600 hover:bg-red-700 text-white'
                    }`}
                  >
                    {isSuspended ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" /> Reactivar
                      </>
                    ) : (
                      <>
                        <ShieldAlert className="w-3.5 h-3.5" /> Suspender
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal: Gestión de Plan y Código de Upgrade */}
      {selectedTenant && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="card bg-mantel border-linea max-w-md w-full p-6 space-y-5 animate-in fade-in zoom-in-95">
            {generatedCodeResult ? (
              <div className="space-y-4 text-center">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>

                <div className="space-y-1">
                  <h3 className="font-display font-bold text-xl text-tinta">
                    Código de Activación Listo
                  </h3>
                  <p className="text-xs text-suave">
                    Asignado exclusivamente para <strong>{selectedTenant.name}</strong> (@{selectedTenant.slug}).
                  </p>
                </div>

                <div className="p-4 bg-plato border-2 border-dashed border-linea rounded-2xl space-y-2">
                  <span className="font-mono text-2xl font-extrabold tracking-widest text-tinta select-all block">
                    {generatedCodeResult.code}
                  </span>
                  <div className="text-xs text-suave">
                    Plan <strong className="uppercase">{generatedCodeResult.plan}</strong> •{' '}
                    {generatedCodeResult.durationDays
                      ? `${generatedCodeResult.durationDays} días`
                      : 'Permanente'}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => copyCode(generatedCodeResult.code)}
                    className="btn btn-quiet flex-1 flex items-center justify-center gap-1.5 text-xs font-bold"
                  >
                    {copiedCode === generatedCodeResult.code ? (
                      <>
                        <Check className="w-4 h-4 text-hoja" /> Copiado
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" /> Copiar Código
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      shareViaWhatsApp(
                        generatedCodeResult.code,
                        generatedCodeResult.plan,
                        generatedCodeResult.durationDays
                      )
                    }
                    className="btn btn-primary flex-1 flex items-center justify-center gap-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    <Send className="w-4 h-4" /> WhatsApp
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setGeneratedCodeResult(null);
                    setSelectedTenant(null);
                  }}
                  className="btn btn-sm btn-quiet w-full text-xs"
                >
                  Cerrar
                </button>
              </div>
            ) : (
              <form onSubmit={handleExecute} className="space-y-4">
                <div className="space-y-1">
                  <h3 className="font-display font-bold text-xl text-tinta flex items-center gap-2">
                    <KeyRound className="w-5 h-5 text-hoja" />
                    {isTestTenant
                      ? 'Plan de Pruebas: la-trattoria'
                      : `Emitir Código: ${selectedTenant.name}`}
                  </h3>
                  <p className="text-xs text-suave">
                    {isTestTenant
                      ? 'Restaurante especial para pruebas de todas las funciones de producción.'
                      : 'El paso a Plan Intermedio se gestiona mediante códigos de activación con vigencia y trazabilidad.'}
                  </p>
                </div>

                {/* Vista para restaurante de pruebas: la-trattoria */}
                {isTestTenant ? (
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-suave">
                        Seleccionar Plan de Pruebas
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {['basic', 'intermedio', 'premium'].map((p) => (
                          <button
                            key={p}
                            type="button"
                            onClick={() => setNewPlan(p)}
                            className={`p-2.5 rounded-xl border text-center text-xs font-bold capitalize transition-colors ${
                              newPlan === p
                                ? 'border-tinta bg-tinta text-mantel'
                                : 'border-linea bg-plato hover:border-tinta'
                            }`}
                          >
                            {p}
                            {p === 'premium' && (
                              <span className="block text-[9px] text-hoja">Pruebas</span>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-suave">
                        Vigencia
                      </label>
                      <select
                        value={durationDays}
                        onChange={(e) => setDurationDays(e.target.value)}
                        className="field py-2 text-sm w-full"
                      >
                        <option value="30">30 días</option>
                        <option value="90">90 días</option>
                        <option value="365">365 días</option>
                        <option value="perm">Permanente</option>
                      </select>
                    </div>
                  </div>
                ) : (
                  /* Vista para Restaurantes Regulares: Plan Intermedio por Código */
                  <div className="space-y-3">
                    {/* Tarjeta Informativa de Plan Intermedio */}
                    <div className="p-3.5 rounded-xl bg-hoja/5 border border-hoja/20 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-extrabold text-hoja uppercase tracking-wider">
                          Activación Plan Intermedio
                        </span>
                        <span className="text-[10px] bg-hoja text-white px-2 py-0.5 rounded-full font-bold">
                          Recomendado
                        </span>
                      </div>
                      <p className="text-xs text-tinta leading-relaxed">
                        Habilita pedidos directos desde la mesa (QR y NFC), pantalla de cocina en tiempo real y control de inventario de existencias.
                      </p>
                    </div>

                    {/* Banner Premium Bloqueado */}
                    <div className="p-2.5 rounded-xl border border-linea bg-stone-100/60 dark:bg-stone-900/40 flex items-center gap-2 text-xs text-suave">
                      <Lock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span>
                        <strong>Plan Premium:</strong> Bloqueado y en desarrollo (solo habilitado para pruebas en <em>la-trattoria</em>).
                      </span>
                    </div>

                    {/* Vigencia */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-suave">
                        Duración del Código
                      </label>
                      <select
                        value={durationDays}
                        onChange={(e) => setDurationDays(e.target.value)}
                        className="field py-2 text-sm w-full"
                      >
                        <option value="30">30 días (1 mes de servicio)</option>
                        <option value="90">90 días (3 meses)</option>
                        <option value="180">180 días (6 meses)</option>
                        <option value="365">365 días (1 año)</option>
                        <option value="perm">Permanente / Indefinido</option>
                      </select>
                    </div>

                    {/* Método de Emisión */}
                    <div className="space-y-1.5 pt-1">
                      <label className="text-xs font-bold uppercase tracking-wider text-suave">
                        ¿Cómo deseas proceder?
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setActionType('code')}
                          className={`p-2.5 rounded-xl border text-left text-xs transition-colors ${
                            actionType === 'code'
                              ? 'border-hoja bg-hoja/10 text-tinta font-bold'
                              : 'border-linea bg-plato text-suave'
                          }`}
                        >
                          <div className="flex items-center gap-1.5">
                            <KeyRound className="w-3.5 h-3.5 text-hoja" />
                            <span>Generar Código</span>
                          </div>
                          <span className="text-[10px] text-suave block mt-0.5 font-normal">
                            Para enviar al dueño por WhatsApp
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setActionType('apply_now')}
                          className={`p-2.5 rounded-xl border text-left text-xs transition-colors ${
                            actionType === 'apply_now'
                              ? 'border-tinta bg-tinta text-mantel font-bold'
                              : 'border-linea bg-plato text-suave'
                          }`}
                        >
                          <div className="flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Activar Ahora</span>
                          </div>
                          <span
                            className={`text-[10px] block mt-0.5 font-normal ${
                              actionType === 'apply_now' ? 'text-mantel/70' : 'text-suave'
                            }`}
                          >
                            Emite y canjea el código en el acto
                          </span>
                        </button>
                      </div>
                    </div>

                    {/* Si ya está en intermedio, dar opción de volver a básico */}
                    {selectedTenant.plan === 'intermedio' && (
                      <div className="pt-1 text-center">
                        <button
                          type="button"
                          onClick={async () => {
                            if (window.confirm(`¿Seguro que deseas volver a ${selectedTenant.name} al Plan Básico?`)) {
                              setSavingPlan(true);
                              try {
                                await changeTenantPlan(selectedTenant.id, 'basic', null);
                                setSelectedTenant(null);
                              } finally {
                                setSavingPlan(false);
                              }
                            }
                          }}
                          className="text-[11px] text-suave hover:text-red-600 underline"
                        >
                          Regresar este restaurante a Plan Básico
                        </button>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-linea">
                  <button
                    type="button"
                    onClick={() => setSelectedTenant(null)}
                    className="btn btn-sm btn-quiet"
                    disabled={savingPlan}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={savingPlan}
                    className="btn btn-sm btn-primary min-w-32"
                  >
                    {savingPlan ? (
                      <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                    ) : isTestTenant ? (
                      'Guardar Plan'
                    ) : actionType === 'code' ? (
                      'Generar Código'
                    ) : (
                      'Activar con Código'
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
