import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTenant } from '../../hooks/useTenant';
import { useOrders } from '../../hooks/useOrders';
import { useFloorPlan } from '../../hooks/useFloorPlan';
import { useStaffSession } from '../../hooks/useStaffSession';
import { useToast } from '../../hooks/useToast';
import { playChime } from '../../hooks/useSound';
import { api } from '../../services/api';
import { ORDER_STATUS } from '../../lib/orderStatus';
import { groupOrdersByTable, groupAllActiveTables } from '../../lib/billing';
import { hasFeature } from '../../lib/plans';
import { formatCOP } from '../../lib/money';
import { InlineError } from '../../components/ui/Screens';
import PosView from '../../components/staff/PosView';
import BillingModal from '../../components/staff/BillingModal';
import TicketModal from '../../components/staff/TicketModal';
import DailyCloseModal from '../../components/staff/DailyCloseModal';
import NewCustomerModal from '../../components/staff/NewCustomerModal';

const isSequenceUsable = (seq) =>
  !!seq &&
  (!seq.rangeTo || seq.nextNumber <= seq.rangeTo) &&
  !!seq.validUntil &&
  new Date(`${seq.validUntil}T23:59:59`) >= new Date();

// Pasos que faltan para llevar una comanda abierta hasta caja (el servidor exige ir de uno en uno).
const STEPS_TO_PAY = {
  [ORDER_STATUS.PENDING]: [ORDER_STATUS.PREPARING, ORDER_STATUS.READY, ORDER_STATUS.TO_PAY],
  [ORDER_STATUS.PREPARING]: [ORDER_STATUS.READY, ORDER_STATUS.TO_PAY],
  [ORDER_STATUS.READY]: [ORDER_STATUS.TO_PAY]
};

export default function PosPage() {
  const { tenant } = useTenant();
  const showToast = useToast();
  const onNewOrder = useCallback(() => {}, []);
  const { orders, error: ordersError, reload: reloadOrders, updateStatus } = useOrders(tenant.id, { onNewOrder });
  const floorPlan = useFloorPlan(tenant.id);
  const { staff } = useStaffSession();
  // La forma y el ambiente de cada mesa los define la administración; en caja solo los ve el resto.
  const canEditLayout = ['owner', 'admin'].includes(staff?.role);

  const [tables, setTables] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [closes, setCloses] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [billing, setBilling] = useState(null);
  const [error, setError] = useState(null);
  const [charging, setCharging] = useState(null);
  const [ticket, setTicket] = useState(null);
  const [closeOpen, setCloseOpen] = useState(false);
  const [customerOpen, setCustomerOpen] = useState(false);
  const [advancingKey, setAdvancingKey] = useState(null);
  const [receiptStation, setReceiptStation] = useState(null);

  const reloadBilling = useCallback(async () => {
    try {
      const [inv, z, cust, settings, tbls, stations] = await Promise.all([
        api.listOpenInvoices(tenant.id),
        api.listDailyCloses(tenant.id),
        api.listCustomers(tenant.id),
        api.getBillingSettings(tenant.id),
        api.listTables(tenant.id),
        api.listPrintStations(tenant.id)
      ]);
      setReceiptStation(stations.find((s) => s.printsReceipts)?.name || null);
      setInvoices(inv);
      setCloses(z);
      setCustomers(cust);
      setBilling(settings);
      setTables(tbls.filter((t) => t.isActive));
      setError(null);
    } catch (err) {
      setError(err.message);
    }
  }, [tenant.id]);

  useEffect(() => {
    reloadBilling();
    return api.subscribeBilling?.(reloadBilling) || undefined;
  }, [reloadBilling]);

  const tablesToPay = useMemo(() => groupOrdersByTable(orders), [orders]);
  const activeTables = useMemo(() => groupAllActiveTables(orders), [orders]);

  // Se guarda la mesa, no la foto del grupo: así el modal ve las comandas que llegan en tiempo real.
  const chargingGroup = charging ? tablesToPay.find((g) => g.key === charging) : null;
  // Si la mesa deja de tener comandas por cobrar (p. ej. se cancelan), se descarta el cobro en curso.
  if (charging && !chargingGroup) setCharging(null);
  const electronicSeq = billing?.sequences?.find((s) => s.kind === 'electronica');
  const canDian = hasFeature(tenant.plan, 'dian') && isSequenceUsable(electronicSeq);

  /** Cobro directo: si el cliente pide la cuenta antes de que cocina cierre, se pasan sus comandas a caja. */
  const handleDirectCharge = async (tableGroup) => {
    const kitchenOrders = (tableGroup.orders || []).filter((o) => STEPS_TO_PAY[o.status]);
    if (kitchenOrders.length > 0) {
      const ok = window.confirm(
        `La mesa ${tableGroup.tableLabel} tiene ${kitchenOrders.length === 1 ? '1 comanda' : `${kitchenOrders.length} comandas`} en cocina. ` +
          '¿Pasarlas a caja y cobrar ahora? Saldrán de la pantalla de cocina.'
      );
      if (!ok) return;
      setAdvancingKey(tableGroup.key);
      try {
        for (const o of kitchenOrders) {
          for (const status of STEPS_TO_PAY[o.status]) await updateStatus(o.id, status);
        }
        await reloadOrders();
        showToast(`Mesa ${tableGroup.tableLabel} pasada a caja para facturar`, 'success');
      } catch (err) {
        showToast(err.message || 'No se pudo pasar la comanda a caja', 'error');
        return;
      } finally {
        setAdvancingKey(null);
      }
    }
    setCharging(tableGroup.key);
  };

  const issue = async (params) => {
    try {
      const invoice = await api.issueInvoice(params);
      setCharging(null);
      setTicket(invoice);
      playChime();
      showToast(`Comprobante ${invoice.number} emitido`, 'success');
      reloadOrders();
      reloadBilling();
    } catch (err) {
      showToast(err.message, 'error');
      reloadOrders();
    }
  };

  const closeRegister = async (countedCash) => {
    try {
      const z = await api.closeRegister({ countedCash });
      setCloseOpen(false);
      showToast(`Cierre ${z.code}: ventas ${formatCOP(z.totalSales)}, diferencia ${formatCOP(z.difference)}`, z.difference === 0 ? 'success' : 'info');
      reloadBilling();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const saveCustomer = async (form) => {
    try {
      const c = await api.createCustomer(tenant.id, form);
      setCustomers((list) => [...list, c].sort((a, b) => a.name.localeCompare(b.name)));
      setCustomerOpen(false);
      showToast('Cliente guardado', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  return (
    <div className="space-y-4">
      {(ordersError || error) && <InlineError message={ordersError || error} onRetry={() => { reloadOrders(); reloadBilling(); }} />}
      <PosView
        tables={tables}
        floorPlan={floorPlan}
        canEditLayout={canEditLayout}
        tablesToPay={tablesToPay}
        activeTables={activeTables}
        advancingKey={advancingKey}
        invoices={invoices}
        closes={closes}
        onCharge={(group) => setCharging(group.key)}
        onDirectCharge={handleDirectCharge}
        onViewTicket={setTicket}
        onOpenClose={() => setCloseOpen(true)}
      />

      {chargingGroup && (
        <BillingModal
          key={chargingGroup.key}
          group={chargingGroup}
          tenant={tenant}
          customers={customers}
          canDian={canDian}
          onClose={() => setCharging(null)}
          onNewCustomer={() => setCustomerOpen(true)}
          onIssue={issue}
        />
      )}

      {ticket && (
        <TicketModal
          invoice={ticket}
          tenant={tenant}
          onClose={() => setTicket(null)}
          receiptStation={receiptStation}
          onSendToPrinter={async () => {
            try {
              await api.printInvoice(ticket.id);
              showToast(`Tiquete ${ticket.number} enviado a ${receiptStation}`, 'success');
              setTicket(null);
            } catch (err) {
              showToast(err.message, 'error');
            }
          }}
        />
      )}

      {closeOpen && (
        <DailyCloseModal
          tenant={tenant}
          invoices={invoices}
          onClose={() => setCloseOpen(false)}
          onConfirm={closeRegister}
        />
      )}

      {customerOpen && <NewCustomerModal onClose={() => setCustomerOpen(false)} onSave={saveCustomer} />}
    </div>
  );
}
