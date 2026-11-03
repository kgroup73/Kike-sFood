import { Gem, CheckCircle2, Lock } from 'lucide-react';
import { useTenant } from '../../hooks/useTenant';
import { PLANS, planLevel, planLabel } from '../../lib/plans';
import { isDemoMode, api } from '../../services/api';
import AdminShell from './AdminShell';

const FEATURES = [
  { label: 'Carta digital QR/NFC y mesas', level: 0 },
  { label: 'Pedidos desde la mesa', level: 1 },
  { label: 'Cocina KDS en tiempo real', level: 1 },
  { label: 'Inventario de materias primas', level: 1 },
  { label: 'Caja POS y cierre Z', level: 1 },
  { label: 'Facturación electrónica DIAN', level: 2 }
];

export default function PlansView() {
  const { tenant, reload } = useTenant();
  const current = planLevel(tenant.plan);

  return (
    <AdminShell title="Plan y suscripción" icon={<Gem className="w-4 h-4 text-violet-400" aria-hidden="true" />} subtitle={`Plan activo: ${planLabel(tenant.plan)}`}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 max-w-4xl">
        {Object.entries(PLANS).map(([key, plan]) => {
          const active = tenant.plan === key;
          return (
            <div key={key} className={`p-4 rounded-2xl border space-y-3 ${active ? 'border-violet-500 bg-violet-500/10' : 'border-slate-800 bg-slate-900'}`}>
              <div className="flex items-center justify-between">
                <h3 className="font-black text-sm text-white">{plan.label}</h3>
                {active && <CheckCircle2 className="w-4 h-4 text-violet-300" aria-label="Plan activo" />}
              </div>
              <p className="text-[11px] text-slate-400">{plan.summary}</p>
              <ul className="space-y-1 text-[11px]">
                {FEATURES.map((f) => (
                  <li key={f.label} className={`flex items-center gap-1.5 ${f.level <= plan.level ? 'text-slate-200' : 'text-slate-600'}`}>
                    {f.level <= plan.level ? <CheckCircle2 className="w-3 h-3 text-emerald-400" aria-hidden="true" /> : <Lock className="w-3 h-3" aria-hidden="true" />}
                    {f.label}
                  </li>
                ))}
              </ul>
              {isDemoMode && !active && (
                <button
                  onClick={async () => {
                    await api.setDemoPlan(key);
                    reload();
                  }}
                  className="w-full py-2 text-[11px] font-bold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
                >
                  Probar este plan (solo demo)
                </button>
              )}
            </div>
          );
        })}
      </div>
      <p className="text-xs text-slate-400 max-w-2xl">
        {current < 2 ? 'Para ampliar tu plan ' : 'Para cambiar tu plan '}
        contacta a soporte de Kike's. Por seguridad el plan no se puede cambiar desde el navegador: lo administra la plataforma.
      </p>
    </AdminShell>
  );
}
