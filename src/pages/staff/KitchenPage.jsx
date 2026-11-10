import { useCallback } from 'react';
import { useTenant } from '../../hooks/useTenant';
import { useMenu } from '../../hooks/useMenu';
import { useOrders } from '../../hooks/useOrders';
import { useToast } from '../../hooks/useToast';
import { playChime } from '../../hooks/useSound';
import { api } from '../../services/api';
import { InlineError } from '../../components/ui/Screens';
import KitchenView from '../../components/staff/KitchenView';
import OrdersListView from '../../components/staff/OrdersListView';
import { hasFeature } from '../../lib/plans';
import { finalKitchenStatus, stepsTo } from '../../lib/orderStatus';

export default function KitchenPage() {
  const { tenant } = useTenant();
  const showToast = useToast();
  const menu = useMenu(tenant.id);

  const onNewOrder = useCallback(
    (row) => {
      playChime();
      showToast(`Nueva comanda de la mesa ${row?.table_label ?? ''}`);
    },
    [showToast]
  );
  const { orders, error, reload, updateStatus } = useOrders(tenant.id, { onNewOrder });

  const withPos = hasFeature(tenant.plan, 'pos');

  const reprint = async (order) => {
    try {
      await api.requestOrderReprint(order.id);
      showToast(`Comanda ${order.id} enviada a la impresora`, 'success');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Sin pantalla de cocina: un solo toque cierra la comanda (el servidor exige ir paso a paso).
  const finish = async (order) => {
    try {
      for (const status of stepsTo(order.status, finalKitchenStatus({ withPos }))) await updateStatus(order.id, status);
      playChime();
      showToast(withPos ? `Mesa ${order.tableLabel}: comanda ${order.id} enviada a caja` : `Comanda ${order.id} entregada`, 'success');
    } catch (err) {
      showToast(err.message, 'error');
      reload();
    }
  };

  const changeStatus = async (orderId, status) => {
    try {
      await updateStatus(orderId, status);
      playChime();
      if (status === 'Por Cobrar') showToast(`Comanda ${orderId} enviada a caja`, 'success');
      if (status === 'Entregado') showToast(`Comanda ${orderId} entregada`, 'success');
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
        showToast(affected.length ? `${name} agotado. Ya no se pueden pedir: ${affected.join(', ')}` : `${name} agotado`);
      } else {
        showToast(`${name} disponible otra vez`, 'success');
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  return (
    <div className="space-y-6">
      {error && <InlineError message={`No se pudieron cargar las comandas: ${error}`} onRetry={reload} />}
      {tenant.kitchenDisplay === false ? (
        <OrdersListView orders={orders} withPos={withPos} onFinish={finish} onReprint={reprint} />
      ) : (
      <KitchenView
        withPos={withPos}
        onReprint={reprint}
        kitchenOrders={orders}
        masterIngredients={menu.masterIngredients}
        ingredientsStock={menu.ingredientsStock}
        updateOrderStatus={changeStatus}
        onMarkIngredientSoldOut={(name) => setStock(name, true)}
        onRestockIngredient={(name) => setStock(name, false)}
      />
      )}
    </div>
  );
}
