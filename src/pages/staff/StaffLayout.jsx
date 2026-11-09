import { NavLink, Outlet } from 'react-router-dom';
import { Flame, Receipt, Settings, Volume2, VolumeX, LogOut } from 'lucide-react';
import { useTenant } from '../../hooks/useTenant';
import { useStaffSession } from '../../hooks/useStaffSession';
import { useSound } from '../../hooks/useSound';
import { canAccess } from '../../lib/roles';
import { hasFeature } from '../../lib/plans';
import { isDemoMode } from '../../services/api';

const SECTIONS = [
  { key: 'cocina', label: 'Cocina', icon: Flame, feature: 'kitchen' },
  { key: 'caja', label: 'Caja', icon: Receipt, feature: 'pos' },
  { key: 'admin', label: 'Administración', icon: Settings }
];

export default function StaffLayout() {
  const { tenant } = useTenant();
  const { staff, logout } = useStaffSession();
  const { soundEnabled, toggleSound } = useSound();
  const sections = SECTIONS.filter((s) => canAccess(staff.role, s.key) && (!s.feature || hasFeature(tenant.plan, s.feature)));

  return (
    <div className="min-h-screen pb-12">
      <header className="bg-mantel/95 backdrop-blur border-b border-linea sticky top-0 z-30 print-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-wrap sm:flex-nowrap items-stretch gap-x-4">
          <div className="order-1 flex-1 min-w-0 leading-tight py-3">
            <p className="font-display font-bold text-lg tracking-tight truncate">{tenant.name}</p>
            <p className="text-sm text-suave truncate flex items-center gap-2">
              {staff.displayName}
              {isDemoMode && <span className="text-xs font-bold px-1.5 rounded bg-maracuya text-tinta">Demo</span>}
            </p>
          </div>

          <nav
            aria-label="Secciones del personal"
            className="order-3 sm:order-2 w-[calc(100%+2rem)] sm:w-auto flex items-stretch -mx-4 px-2 sm:mx-0 sm:px-0 border-t border-linea sm:border-0"
          >
            {sections.map(({ key, label, icon: Icon }) => (
              <NavLink
                key={key}
                to={`/staff/${tenant.slug}/${key}`}
                className={({ isActive }) =>
                  `relative flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 h-12 sm:h-auto font-bold text-[15px] transition-colors after:absolute after:inset-x-3 after:bottom-0 after:h-[3px] after:rounded-t-full ${
                    isActive ? 'text-tinta after:bg-hoja' : 'text-suave hover:text-tinta after:bg-transparent'
                  }`
                }
              >
                <Icon className="w-4 h-4" aria-hidden="true" /> <span>{label}</span>
              </NavLink>
            ))}
          </nav>

          <div className="order-2 sm:order-3 flex items-center sm:pl-3 sm:border-l sm:border-linea sm:my-3">
            <SoundAndLogout soundEnabled={soundEnabled} toggleSound={toggleSound} logout={logout} />
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <Outlet />
      </main>
    </div>
  );
}

function SoundAndLogout({ soundEnabled, toggleSound, logout }) {
  return (
    <>
      <button
        onClick={toggleSound}
        aria-label={soundEnabled ? 'Silenciar sonido' : 'Activar sonido'}
        aria-pressed={soundEnabled}
        title={soundEnabled ? 'Sonido activado' : 'Sonido apagado'}
        className="icon-btn"
      >
        {soundEnabled ? <Volume2 className="w-5 h-5" aria-hidden="true" /> : <VolumeX className="w-5 h-5" aria-hidden="true" />}
      </button>
      <button onClick={logout} aria-label="Cerrar sesión" title="Cerrar sesión" className="icon-btn hover:!text-aji">
        <LogOut className="w-5 h-5" aria-hidden="true" />
      </button>
    </>
  );
}
