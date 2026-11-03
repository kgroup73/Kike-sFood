import { ShieldOff } from 'lucide-react';
import { useTenant } from '../../hooks/useTenant';
import { useStaffSession } from '../../hooks/useStaffSession';
import { canAccess, ROLES } from '../../lib/roles';
import { hasFeature } from '../../lib/plans';
import LockedPlanNotice from '../../components/admin/LockedPlanNotice';

/** Protege una sección por rol y por plan. La base de datos aplica las mismas reglas. */
export default function RequireSection({ section, feature, children }) {
  const { tenant } = useTenant();
  const { staff } = useStaffSession();

  if (!canAccess(staff.role, section)) {
    return (
      <div className="max-w-md mx-auto bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center space-y-2">
        <ShieldOff className="w-8 h-8 mx-auto text-rose-400" aria-hidden="true" />
        <h2 className="text-sm font-bold text-white">Sin acceso a esta sección</h2>
        <p className="text-xs text-slate-400">Tu rol ({ROLES[staff.role]}) no tiene permiso para entrar aquí.</p>
      </div>
    );
  }
  if (feature && !hasFeature(tenant.plan, feature)) return <LockedPlanNotice feature={feature} />;
  return children;
}
