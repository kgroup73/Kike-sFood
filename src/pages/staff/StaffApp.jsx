import { Navigate, Route, Routes, useParams } from 'react-router-dom';
import { TenantProvider, useTenant } from '../../hooks/useTenant';
import { StaffSessionProvider, useStaffSession } from '../../hooks/useStaffSession';
import { LoadingScreen, ErrorScreen } from '../../components/ui/Screens';
import { homeSectionFor } from '../../lib/roles';
import StaffLayout from './StaffLayout';
import StaffLoginPage from './StaffLoginPage';
import KitchenPage from './KitchenPage';
import PosPage from './PosPage';
import AdminPage from './AdminPage';
import RequireSection from './RequireSection';

export default function StaffApp() {
  const { slug } = useParams();
  return (
    <TenantProvider slug={slug} key={slug}>
      <StaffSessionProvider>
        <StaffRoutes />
      </StaffSessionProvider>
    </TenantProvider>
  );
}

function StaffRoutes() {
  const { tenant, loading, error } = useTenant();
  const { staff, loading: sessionLoading } = useStaffSession();

  if (loading || sessionLoading) return <LoadingScreen label="Verificando sesión…" />;
  if (!tenant) {
    return <ErrorScreen title="Restaurante no encontrado" message={error === 'notfound' ? 'Revisa el código del restaurante.' : error} />;
  }

  const base = `/staff/${tenant.slug}`;
  // La sesión solo vale para el restaurante al que pertenece el empleado.
  const session = staff && staff.tenantId === tenant.id ? staff : null;
  const home = session ? `${base}/${homeSectionFor(session.role)}` : `${base}/login`;

  return (
    <Routes>
      <Route path="login" element={session ? <Navigate to={home} replace /> : <StaffLoginPage />} />
      <Route element={session ? <StaffLayout /> : <Navigate to={`${base}/login`} replace />}>
        <Route index element={<Navigate to={home} replace />} />
        <Route path="cocina" element={<RequireSection section="cocina" feature="kitchen"><KitchenPage /></RequireSection>} />
        <Route path="caja" element={<RequireSection section="caja" feature="pos"><PosPage /></RequireSection>} />
        <Route path="admin/*" element={<RequireSection section="admin"><AdminPage /></RequireSection>} />
      </Route>
      <Route path="*" element={<Navigate to={home} replace />} />
    </Routes>
  );
}
