import { NavLink, Outlet } from 'react-router-dom';
import { Flame, Receipt, Settings, Volume2, VolumeX, LogOut } from 'lucide-react';
import { useTenant } from '../../hooks/useTenant';
import { useStaffSession } from '../../hooks/useStaffSession';
import { useSound } from '../../hooks/useSound';
import { canAccess, ROLES } from '../../lib/roles';
import { hasFeature, planLabel } from '../../lib/plans';
import { isDemoMode } from '../../services/api';
import BrandMark from '../../components/ui/BrandMark';

const SECTIONS = [
  { key: 'cocina', label: 'Cocina', icon: Flame, feature: 'kitchen' },
  { key: 'caja', label: 'Caja', icon: Receipt, feature: 'pos' },
  { key: 'admin', label: 'Admin', icon: Settings }
];

export default function StaffLayout() {
  const { tenant } = useTenant();
  const { staff, logout } = useStaffSession();
  const { soundEnabled, toggleSound } = useSound();
  const sections = SECTIONS.filter((s) => canAccess(staff.role, s.key) && (!s.feature || hasFeature(tenant.plan, s.feature)));

  return (
    <div className="min-h-screen pb-10">
      <header className="bg-brand-panel/95 backdrop-blur-md border-b border-brand-line sticky top-0 z-30 print-hidden">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center justify-between gap-3 min-w-0">
            <div className="flex items-center gap-3 min-w-0">
              <BrandMark size="sm" showName={false} />
              <div className="min-w-0 leading-tight">
                <p className="font-extrabold text-sm text-brand-ivory truncate">{tenant.name}</p>
                <p className="text-[10px] text-brand-khaki truncate">
                  {staff.displayName} · {ROLES[staff.role]} · Plan {planLabel(tenant.plan)}
                  {isDemoMode && ' · DEMO'}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <nav aria-label="Secciones del personal" className="flex items-center bg-brand-night p-1 rounded-xl border border-brand-line text-[11px] font-semibold flex-1 sm:flex-initial">
              {sections.map(({ key, label, icon: Icon }) => (
                <NavLink
                  key={key}
                  to={`/staff/${tenant.slug}/${key}`}
                  className={({ isActive }) =>
                    `px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap flex-1 sm:flex-initial justify-center ${
                      isActive ? 'bg-gradient-to-r from-brand-gold to-brand-gold-light text-brand-ivory shadow-md' : 'text-brand-khaki hover:text-brand-cream'
                    }`
                  }
                >
                  <Icon className="w-3.5 h-3.5" aria-hidden="true" /> <span>{label}</span>
                </NavLink>
              ))}
            </nav>
            <button onClick={toggleSound} aria-label={soundEnabled ? 'Silenciar sonido' : 'Activar sonido'} aria-pressed={soundEnabled} className="p-2 bg-brand-raised hover:bg-brand-line text-brand-khaki hover:text-brand-ivory rounded-xl border border-brand-line">
              {soundEnabled ? <Volume2 className="w-4 h-4 text-brand-gold" /> : <VolumeX className="w-4 h-4" />}
            </button>
            <button onClick={logout} aria-label="Cerrar sesión" title="Cerrar sesión" className="p-2 bg-brand-raised hover:bg-rose-500/20 text-brand-khaki hover:text-rose-300 rounded-xl border border-brand-line">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-3 sm:px-6 py-4">
        <Outlet />
      </main>
    </div>
  );
}
