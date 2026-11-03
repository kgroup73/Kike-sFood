import { Link } from 'react-router-dom';
import {
  Building2, UtensilsCrossed, Users, Package, Gem, Smartphone, ShieldCheck, Receipt, Flame,
  ChevronRight, Lock, Sparkles, Settings, RotateCcw
} from 'lucide-react';
import { useTenant } from '../../hooks/useTenant';
import { hasFeature, requiredPlanFor } from '../../lib/plans';
import { api, isDemoMode } from '../../services/api';

const GROUPS = [
  {
    title: 'Personalización',
    subtitle: 'Marca, carta y equipo',
    icon: Sparkles,
    items: [
      { to: 'admin/empresa', icon: Building2, title: 'Datos de Empresa', text: 'Razón social, NIT, impuesto al consumo y propina.' },
      { to: 'admin/carta', icon: UtensilsCrossed, title: 'Platillos del Menú', text: 'Crear, editar, ocultar y gestionar los platillos.' },
      { to: 'admin/personal', icon: Users, title: 'Personal y PIN', text: 'Usuarios, roles y PIN de acceso de cada empleado.' }
    ]
  },
  {
    title: 'Servicios',
    subtitle: 'Módulos operativos',
    icon: Settings,
    items: [
      { to: 'cocina', icon: Flame, title: 'Cocina KDS', text: 'Comandas en tiempo real y agotados.', feature: 'kitchen' },
      { to: 'caja', icon: Receipt, title: 'Caja POS', text: 'Cobrar comandas, tiquetes y cierre de caja.', feature: 'pos' },
      { to: 'admin/inventario', icon: Package, title: 'Inventario', text: 'Trazabilidad de agotados y sugerencias de compra.', feature: 'inventory' },
      { to: 'admin/mesas', icon: Smartphone, title: 'Mesas / QR / NFC', text: 'Enlaces seguros por mesa y stickers para imprimir.' },
      { to: 'admin/facturacion', icon: ShieldCheck, title: 'Facturación', text: 'Numeración POS, resolución DIAN y proveedor.', feature: 'pos' },
      { to: 'admin/planes', icon: Gem, title: 'Plan', text: 'Módulos incluidos en tu suscripción.' }
    ]
  }
];

export default function AdminHome() {
  const { tenant } = useTenant();
  return (
    <div className="space-y-8">
      {GROUPS.map((group) => (
        <section key={group.title}>
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-9 h-9 rounded-xl bg-orange-500/15 text-orange-400 flex items-center justify-center border border-orange-500/30 shrink-0">
              <group.icon className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <h3 className="font-extrabold text-white text-sm sm:text-base">{group.title}</h3>
              <p className="text-[11px] text-slate-400">{group.subtitle}</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {group.items.map((item) => {
              const enabled = !item.feature || hasFeature(tenant.plan, item.feature);
              const Icon = item.icon;
              const content = (
                <>
                  <div className="flex items-start gap-3.5 min-w-0">
                    <div className="w-11 h-11 rounded-xl bg-orange-500/15 text-orange-400 flex items-center justify-center border border-orange-500/25 shrink-0">
                      <Icon className="w-5 h-5" aria-hidden="true" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-white text-xs sm:text-sm">{item.title}</h4>
                      <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">{item.text}</p>
                    </div>
                  </div>
                  {enabled ? (
                    <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-orange-400 shrink-0 mt-1" aria-hidden="true" />
                  ) : (
                    <span className="shrink-0 mt-0.5 text-[9px] font-black bg-slate-800 text-slate-400 border border-slate-700 px-1.5 py-0.5 rounded-full flex items-center gap-1 whitespace-nowrap">
                      <Lock className="w-2.5 h-2.5" aria-hidden="true" /> {requiredPlanFor(item.feature)}
                    </span>
                  )}
                </>
              );
              const cls = 'group bg-slate-900 border rounded-2xl p-5 text-left flex items-start justify-between gap-3 shadow-md transition-all';
              return enabled ? (
                <Link key={item.to} to={`/staff/${tenant.slug}/${item.to}`} className={`${cls} border-slate-800 hover:border-orange-500/50 hover:bg-slate-800/60 active:scale-[0.98]`}>
                  {content}
                </Link>
              ) : (
                <div key={item.to} className={`${cls} border-slate-800/70 opacity-70`} aria-disabled="true">
                  {content}
                </div>
              );
            })}
          </div>
        </section>
      ))}

      {isDemoMode && (
        <button
          onClick={() => {
            if (window.confirm('¿Reiniciar los datos de la demo? Se borrarán pedidos, facturas y cambios.')) {
              api.resetDemo();
              window.location.reload();
            }
          }}
          className="text-xs text-slate-500 hover:text-rose-300 flex items-center gap-1.5"
        >
          <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" /> Reiniciar datos de la demo
        </button>
      )}
    </div>
  );
}
