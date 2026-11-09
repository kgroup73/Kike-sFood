import { Check, Minus } from 'lucide-react';
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
    <AdminShell title="Plan" subtitle={`Tu restaurante está en el plan ${planLabel(tenant.plan)}.`}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-linea border border-linea rounded-2xl overflow-hidden max-w-5xl">
        {Object.entries(PLANS).map(([key, plan]) => {
          const active = tenant.plan === key;
          return (
            <div key={key} className={`p-6 space-y-4 ${active ? 'bg-tinta text-mantel' : 'bg-plato'}`}>
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-display font-extrabold text-2xl tracking-tight">{plan.label}</h3>
                {active && <span className="chip chip-listo">Tu plan</span>}
              </div>
              <p className={active ? 'text-mantel/75' : 'text-suave'}>{plan.summary}</p>
              <ul className="space-y-2">
                {FEATURES.map((f) => {
                  const included = f.level <= plan.level;
                  return (
                    <li key={f.label} className={`flex items-start gap-2 ${included ? '' : active ? 'text-mantel/40' : 'text-suave/60'}`}>
                      {included ? <Check className={`w-4 h-4 mt-0.5 shrink-0 ${active ? 'text-[#9ED9AE]' : 'text-hoja'}`} aria-hidden="true" /> : <Minus className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />}
                      <span>
                        {f.label}
                        {!included && <span className="sr-only"> (no incluido)</span>}
                      </span>
                    </li>
                  );
                })}
              </ul>
              {isDemoMode && !active && (
                <button
                  onClick={async () => {
                    await api.setDemoPlan(key);
                    reload();
                  }}
                  className="btn btn-sm btn-quiet w-full"
                >
                  Probar este plan (solo demo)
                </button>
              )}
            </div>
          );
        })}
      </div>
      <p className="text-suave max-w-2xl">
        {current < 2 ? 'Para ampliar tu plan ' : 'Para cambiar tu plan '}
        contacta a soporte de Kike's. Por seguridad el plan no se puede cambiar desde el navegador: lo administra la plataforma.
      </p>
    </AdminShell>
  );
}
