import { lazy, Suspense } from 'react';
import { Routes, Route, useParams } from 'react-router-dom';
import { TenantProvider } from './hooks/useTenant';
import HomePage from './pages/HomePage';
import MenuPage from './pages/MenuPage';
import RegisterPage from './pages/RegisterPage';
import NotFoundPage from './pages/NotFoundPage';
import { LoadingScreen } from './components/ui/Screens';

// El panel del personal (cocina, caja, admin) se descarga solo cuando se usa:
// el comensal no carga ese código.
const StaffApp = lazy(() => import('./pages/staff/StaffApp'));
const SuperAdminPage = lazy(() => import('./pages/admin/SuperAdminPage'));

function MenuRoute() {
  const { slug, token } = useParams();
  return (
    <TenantProvider slug={slug} key={slug}>
      <MenuPage tableToken={token} />
    </TenantProvider>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route
        path="/admin/*"
        element={
          <Suspense fallback={<LoadingScreen label="Cargando panel de administración..." />}>
            <SuperAdminPage />
          </Suspense>
        }
      />
      <Route path="/registro" element={<RegisterPage />} />
      <Route path="/crear-restaurante" element={<RegisterPage />} />
      <Route path="/r/:slug" element={<MenuRoute />} />
      <Route path="/r/:slug/m/:token" element={<MenuRoute />} />
      <Route
        path="/staff/:slug/*"
        element={
          <Suspense fallback={<LoadingScreen label="Cargando panel del personal…" />}>
            <StaffApp />
          </Suspense>
        }
      />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
