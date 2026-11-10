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
      <div className="max-w-lg mx-auto py-16 space-y-3">
        <ShieldOff className="w-6 h-6 text-aji" aria-hidden="true" />
        <h2 className="page-title">Sin acceso a esta sección</h2>
        <p className="text-suave">Tu rol ({ROLES[staff.role]}) no tiene permiso para entrar aquí. Usa las pestañas de arriba para ir a tus secciones.</p>
      </div>
    );
  }
  if (feature && !hasFeature(tenant.plan, feature)) return <LockedPlanNotice feature={feature} />;
  return children;
}
