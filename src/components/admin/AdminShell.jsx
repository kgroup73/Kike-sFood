import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useTenant } from '../../hooks/useTenant';

/** Marco común de cada módulo de administración (con regreso al panel). */
export default function AdminShell({ title, subtitle, actions, children }) {
  const { tenant } = useTenant();
  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <Link to={`/staff/${tenant.slug}/admin`} className="inline-flex items-center gap-1.5 text-sm font-bold text-suave hover:text-tinta transition-colors">
          <ArrowLeft className="w-4 h-4" aria-hidden="true" /> Administración
        </Link>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
          <div className="space-y-1.5">
            <h1 className="page-title">{title}</h1>
            {subtitle && <p className="text-suave max-w-2xl">{subtitle}</p>}
          </div>
          {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
        </div>
      </div>
      {children}
    </div>
  );
}

export const fieldClass = 'field';
export const labelClass = 'label';
export const primaryButton = 'btn btn-primary';
