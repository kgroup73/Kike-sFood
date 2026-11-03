import { Link } from 'react-router-dom';
import { ArrowLeft, LayoutDashboard } from 'lucide-react';
import { useTenant } from '../../hooks/useTenant';

/** Marco común de cada módulo de administración (con regreso al panel). */
export default function AdminShell({ title, icon, subtitle, actions, children }) {
  const { tenant } = useTenant();
  return (
    <div className="space-y-4">
      <Link to={`/staff/${tenant.slug}/admin`} className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-white transition-colors">
        <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" /> <LayoutDashboard className="w-3.5 h-3.5" aria-hidden="true" /> Panel de Administración
      </Link>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-slate-900 p-4 rounded-2xl border border-slate-800 gap-3 shadow-lg">
        <div>
          <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
            {icon}
            {title}
          </h2>
          {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2 text-xs">{actions}</div>}
      </div>
      {children}
    </div>
  );
}

export const fieldClass = 'w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white text-xs focus:outline-none focus:border-orange-500 disabled:opacity-60';
export const labelClass = 'block text-slate-400 mb-1 font-medium text-xs';
export const primaryButton = 'px-4 py-2.5 bg-orange-500 hover:bg-orange-600 active:scale-95 text-white font-bold text-xs rounded-xl shadow transition-all disabled:opacity-50';
