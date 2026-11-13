import { useState } from 'react';
import { Check, Minus, KeyRound, Clock, AlertTriangle, Loader2, Lock } from 'lucide-react';
import { useTenant } from '../../hooks/useTenant';
import { PLANS, planLevel, planLabel } from '../../lib/plans';
import { isDemoMode, api } from '../../services/api';
import { useToast } from '../../hooks/useToast';
import AdminShell from './AdminShell';

const FEATURES = [
  { label: 'Carta digital QR/NFC y mesas', level: 0 },
  { label: 'Pedidos desde la mesa', level: 1 },
  { label: 'Llamado al mesero', level: 1 },
  { label: 'Cocina en pantalla o comandas impresas', level: 1 },
  { label: 'Ingredientes agotados e inventario', level: 1 },
  { label: 'Caja POS y cierre Z', level: 2 },
  { label: 'Facturación electrónica DIAN', level: 2 }
];

export default function PlansView() {
  const { tenant, reload } = useTenant();
  const showToast = useToast();

  const [code, setCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [redeemError, setRedeemError] = useState('');
  const [redeemSuccess, setRedeemSuccess] = useState('');

  if (!tenant) return null;

  const current = planLevel(tenant.plan);
  const isTestTenant = tenant.slug === 'la-trattoria';

  const handleRedeem = async (e) => {
    e.preventDefault();
    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode || submitting) return;

    setSubmitting(true);
    setRedeemError('');
    setRedeemSuccess('');

    try {
      const res = await api.redeemPlanCode({
        slug: tenant.slug,
        code: cleanCode
      });
      setRedeemSuccess(res?.message || '¡Plan actualizado con éxito!');
      showToast('¡Plan actualizado con éxito!', 'success');
      setCode('');
      await reload();
    } catch (err) {
      setRedeemError(err.message || 'Código de activación inválido o expirado');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AdminShell
      title="Plan"
      subtitle={`Tu restaurante está en el plan ${planLabel(tenant.plan)}.`}
    >
      {/* 1. Indicador de Vigencia si tiene expiración */}
      {tenant.plan_expires_at && (
        <div className="card p-4 border-amber-300 bg-amber-50/50 flex items-center gap-3 text-amber-900 max-w-5xl">
          <Clock className="w-5 h-5 text-amber-700 shrink-0" />
          <div className="text-xs">
            <span className="font-bold">Vigencia activa del plan:</span> Válido hasta el{' '}
            <strong>
              {new Date(tenant.plan_expires_at).toLocaleDateString('es-CO', {
                day: '2-digit',
                month: 'long',
                year: 'numeric'
              })}
            </strong>
            . Para renovar tu suscripción, ingresa un nuevo código de activación.
          </div>
        </div>
      )}

      {/* 2. Grid de Planes */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-linea border border-linea rounded-2xl overflow-hidden max-w-5xl">
        {Object.entries(PLANS).map(([key, plan]) => {
          const active = tenant.plan === key;
          const isPremium = key === 'premium';
          const isPremiumBlocked = isPremium && !isTestTenant;

          return (
            <div
              key={key}
              className={`p-6 space-y-4 relative flex flex-col justify-between ${
                active
                  ? 'bg-tinta text-mantel'
                  : isPremiumBlocked
                  ? 'bg-plato/60 opacity-70'
                  : 'bg-plato'
              }`}
            >
              <div className="space-y-4">
                {/* Banner de Próximamente para Premium en restaurantes normales */}
                {isPremium && (
                  <div
                    className={`p-2.5 rounded-xl flex items-center gap-2 border text-xs font-bold ${
                      isTestTenant
                        ? 'bg-hoja/10 border-hoja/30 text-hoja'
                        : 'bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-400'
                    }`}
                  >
                    {isTestTenant ? (
                      <>
                        <span className="w-2 h-2 rounded-full bg-hoja shrink-0" />
                        <span>Restaurante de pruebas de producción</span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-4 h-4 shrink-0 text-amber-600" />
                        <span className="uppercase tracking-wider">
                          Próximamente / En desarrollo (Bloqueado)
                        </span>
                      </>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-display font-extrabold text-2xl tracking-tight">
                    {plan.label}
                  </h3>
                  {active && <span className="chip chip-listo">Tu plan</span>}
                </div>

                <p className={active ? 'text-mantel/75' : 'text-suave'}>{plan.summary}</p>

                <ul className="space-y-2">
                  {FEATURES.map((f) => {
                    const included = f.level <= plan.level;
                    return (
                      <li
                        key={f.label}
                        className={`flex items-start gap-2 ${
                          included ? '' : active ? 'text-mantel/40' : 'text-suave/60'
                        }`}
                      >
                        {included ? (
                          <Check
                            className={`w-4 h-4 mt-0.5 shrink-0 ${
                              active ? 'text-hoja-inversa' : 'text-hoja'
                            }`}
                            aria-hidden="true"
                          />
                        ) : (
                          <Minus className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
                        )}
                        <span>
                          {f.label}
                          {!included && <span className="sr-only"> (no incluido)</span>}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>

              {/* Botón de prueba SOLO visible en el restaurante de pruebas designado */}
              {isDemoMode && isTestTenant && !active && (
                <button
                  type="button"
                  onClick={async () => {
                    await api.setDemoPlan(key);
                    reload();
                  }}
                  className="btn btn-sm btn-quiet w-full mt-4"
                >
                  Probar este plan (solo pruebas)
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* 3. Canjear Código de Upgrade */}
      <div className="card p-6 border-linea bg-plato max-w-xl space-y-4">
        <div className="space-y-1">
          <h3 className="font-display font-bold text-lg text-tinta flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-hoja" /> Canjear código de actualización
          </h3>
          <p className="text-xs text-suave">
            Para activar o renovar el <strong>Plan Intermedio</strong> (pedidos en mesa, cocina en pantalla y control de inventario), ingresa el código suministrado por Kike's Food.
          </p>
        </div>

        <form onSubmit={handleRedeem} className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              placeholder="Ej: KIKE-INT-7A9B"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              className="field h-11 px-4 font-mono font-bold tracking-wider text-base uppercase flex-1"
              maxLength={20}
              required
            />
            <button
              type="submit"
              disabled={!code.trim() || submitting}
              className="btn btn-primary h-11 px-6 text-sm font-bold shrink-0 flex items-center justify-center gap-2"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              Canjear código
            </button>
          </div>

          {redeemError && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2 animate-in fade-in">
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{redeemError}</span>
            </div>
          )}

          {redeemSuccess && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2 animate-in fade-in">
              <Check className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{redeemSuccess}</span>
            </div>
          )}
        </form>
      </div>

      <p className="text-suave max-w-2xl text-xs">
        {current < 1 ? 'Para activar el Plan Intermedio ' : 'Para renovar tu suscripción '}
        contacta al equipo de Kike's Food para solicitar tu código de activación. El Plan Premium se habilitará públicamente en una próxima actualización.
      </p>
    </AdminShell>
  );
}
