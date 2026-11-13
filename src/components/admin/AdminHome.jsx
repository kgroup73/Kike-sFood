import { Link } from 'react-router-dom';
import { Building2, UtensilsCrossed, Users, Package, Gem, Smartphone, ShieldCheck, ChevronRight, Lock, RotateCcw, Printer } from 'lucide-react';
import { useTenant } from '../../hooks/useTenant';
import { hasFeature, requiredPlanFor, planLabel } from '../../lib/plans';
import { api, isDemoMode } from '../../services/api';

const GROUPS = [
  {
    title: 'Tu restaurante',
    items: [
      { to: 'admin/empresa', icon: Building2, title: 'Datos de la empresa', text: 'Razón social, NIT, impuesto al consumo y propina sugerida.' },
      { to: 'admin/carta', icon: UtensilsCrossed, title: 'Platillos', text: 'Crea, edita y oculta los platos de la carta.' },
      { to: 'admin/personal', icon: Users, title: 'Personal', text: 'Quién entra, con qué rol y con qué PIN.' },
      { to: 'admin/mesas', icon: Smartphone, title: 'Mesas y códigos QR', text: 'El enlace de cada mesa y los stickers para imprimir.' }
    ]
  },
  {
    title: 'Operación',
    items: [
      { to: 'admin/cocina', icon: Printer, title: 'Cocina e impresión', text: 'Pantalla de cocina o comandas impresas, y qué equipo imprime.', feature: 'kitchen' },
      { to: 'admin/inventario', icon: Package, title: 'Inventario', text: 'Control de existencias, insumos, compras y agotados en carta.', feature: 'inventory' },
      { to: 'admin/facturacion', icon: ShieldCheck, title: 'Facturación', text: 'Numeración de comprobantes y resolución de la DIAN.', feature: 'pos' },
      { to: 'admin/planes', icon: Gem, title: 'Plan', text: 'Qué incluye tu suscripción.' }
    ]
  }
];

export default function AdminHome() {
  const { tenant } = useTenant();
  return (
    <div className="space-y-10">
      <div className="space-y-1.5">
        <h1 className="page-title">Administración</h1>
        <p className="text-suave">Plan {planLabel(tenant.plan)}</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-x-10 gap-y-10 items-start">
        {GROUPS.map((group) => (
          <section key={group.title} aria-labelledby={`grupo-${group.title}`} className="space-y-3">
            <h2 id={`grupo-${group.title}`} className="block-title">
              {group.title}
            </h2>
            <ul className="surface divide-y divide-linea overflow-hidden">
              {group.items.map((item) => {
                const enabled = !item.feature || hasFeature(tenant.plan, item.feature);
                const Icon = item.icon;
                const content = (
                  <>
                    <Icon className={`w-6 h-6 shrink-0 ${enabled ? 'text-hoja' : 'text-suave'}`} aria-hidden="true" />
                    <span className="flex-1 min-w-0">
                      <span className="block font-bold text-[17px] group-hover:underline underline-offset-4">{item.title}</span>
                      <span className="block text-suave leading-snug">{item.text}</span>
                    </span>
                    {enabled ? (
                      <ChevronRight className="w-5 h-5 text-suave shrink-0" aria-hidden="true" />
                    ) : (
                      <span className="shrink-0 text-sm font-bold text-suave flex items-center gap-1 whitespace-nowrap">
                        <Lock className="w-3.5 h-3.5" aria-hidden="true" /> {requiredPlanFor(item.feature)}
                      </span>
                    )}
                  </>
                );
                const cls = 'group flex items-center gap-4 px-5 py-4';
                return (
                  <li key={item.to}>
                    {enabled ? (
                      <Link to={`/staff/${tenant.slug}/${item.to}`} className={`${cls} hover:bg-mantel transition-colors`}>
                        {content}
                      </Link>
                    ) : (
                      <div className={`${cls} opacity-60`} aria-disabled="true">
                        {content}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>

      {isDemoMode && (
        <button
          onClick={() => {
            if (window.confirm('¿Reiniciar los datos de la demo? Se borrarán pedidos, facturas y cambios.')) {
              api.resetDemo();
              window.location.reload();
            }
          }}
          className="text-sm text-suave hover:text-aji flex items-center gap-1.5"
        >
          <RotateCcw className="w-4 h-4" aria-hidden="true" /> Reiniciar los datos de la demo
        </button>
      )}
    </div>
  );
}
