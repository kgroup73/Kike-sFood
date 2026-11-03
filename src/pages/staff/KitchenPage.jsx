import { useCallback } from 'react';
import { useTenant } from '../../hooks/useTenant';
import { useMenu } from '../../hooks/useMenu';
import { useOrders } from '../../hooks/useOrders';
import { useToast } from '../../hooks/useToast';
import { playChime } from '../../hooks/useSound';
import { api } from '../../services/api';
import { InlineError } from '../../components/ui/Screens';
import KitchenView from '../../components/staff/KitchenView';

export default function KitchenPage() {
  const { tenant } = useTenant();
  const showToast = useToast();
  const menu = useMenu(tenant.id);

  const onNewOrder = useCallback(
    (row) => {
      playChime();
      showToast(`🔔 ¡Nueva comanda Mesa ${row?.table_label ?? ''}!`);
    },
    [showToast]
  );
  const { orders, error, reload, updateStatus } = useOrders(tenant.id, { onNewOrder });

  const changeStatus = async (orderId, status) => {
    try {
      await updateStatus(orderId, status);
      playChime();
      if (status === 'Por Cobrar') showToast(`Comanda #${orderId} enviada a caja`, 'success');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const setStock = async (name, soldOut) => {
    try {
      const res = await api.setIngredientStock({ name, soldOut });
      menu.reload();
      playChime();
      const affected = res?.affectedProducts || [];
      if (soldOut) {
        showToast(affected.length ? `"${name}" agotado. Se desactivó: ${affected.join(', ')} 📦` : `"${name}" agotado 📦`);
      } else {
        showToast(`"${name}" repuesto ✅`, 'success');
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  return (
    <div className="space-y-4">
      {error && <InlineError message={`No se pudieron cargar las comandas: ${error}`} onRetry={reload} />}
      <KitchenView
        kitchenOrders={orders}
        masterIngredients={menu.masterIngredients}
        ingredientsStock={menu.ingredientsStock}
        updateOrderStatus={changeStatus}
        onMarkIngredientSoldOut={(name) => setStock(name, true)}
        onRestockIngredient={(name) => setStock(name, false)}
      />
    </div>
  );
}
