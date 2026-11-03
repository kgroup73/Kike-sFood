import { Navigate, Route, Routes } from 'react-router-dom';
import { useTenant } from '../../hooks/useTenant';
import { hasFeature } from '../../lib/plans';
import AdminHome from '../../components/admin/AdminHome';
import CompanySettings from '../../components/admin/CompanySettings';
import ProductsAdmin from '../../components/admin/ProductsAdmin';
import TablesAdmin from '../../components/admin/TablesAdmin';
import InventoryReport from '../../components/admin/InventoryReport';
import PlansView from '../../components/admin/PlansView';
import BillingSettings from '../../components/admin/BillingSettings';
import StaffAdmin from '../../components/admin/StaffAdmin';
import LockedPlanNotice from '../../components/admin/LockedPlanNotice';

function Gate({ feature, children }) {
  const { tenant } = useTenant();
  return hasFeature(tenant.plan, feature) ? children : <LockedPlanNotice feature={feature} />;
}

export default function AdminPage() {
  return (
    <Routes>
      <Route index element={<AdminHome />} />
      <Route path="empresa" element={<CompanySettings />} />
      <Route path="carta" element={<ProductsAdmin />} />
      <Route path="personal" element={<StaffAdmin />} />
      <Route path="mesas" element={<TablesAdmin />} />
      <Route path="inventario" element={<Gate feature="inventory"><InventoryReport /></Gate>} />
      <Route path="planes" element={<PlansView />} />
      <Route path="facturacion" element={<Gate feature="pos"><BillingSettings /></Gate>} />
      <Route path="*" element={<Navigate to="." replace />} />
    </Routes>
  );
}
