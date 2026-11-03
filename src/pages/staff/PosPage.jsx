import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTenant } from '../../hooks/useTenant';
import { useOrders } from '../../hooks/useOrders';
import { useToast } from '../../hooks/useToast';
import { playChime } from '../../hooks/useSound';
import { api } from '../../services/api';
import { ORDER_STATUS } from '../../lib/orderStatus';
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

export default function PosPage() {
  const { tenant } = useTenant();
  const showToast = useToast();
  const onNewOrder = useCallback(() => {}, []);
  const { orders, error: ordersError, reload: reloadOrders } = useOrders(tenant.id, { onNewOrder });

  const [invoices, setInvoices] = useState([]);
  const [closes, setCloses] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [billing, setBilling] = useState(null);
  const [error, setError] = useState(null);
  const [charging, setCharging] = useState(null);
  const [ticket, setTicket] = useState(null);
  const [closeOpen, setCloseOpen] = useState(false);
  const [customerOpen, setCustomerOpen] = useState(false);

  const reloadBilling = useCallback(async () => {
    try {
      const [inv, z, cust, settings] = await Promise.all([
        api.listOpenInvoices(tenant.id),
        api.listDailyCloses(tenant.id),
        api.listCustomers(tenant.id),
        api.getBillingSettings(tenant.id)
      ]);
      setInvoices(inv);
      setCloses(z);
      setCustomers(cust);
      setBilling(settings);
      setError(null);
    } catch (err) {
      setError(err.message);
    }
  }, [tenant.id]);

  useEffect(() => {
    reloadBilling();
    return api.subscribeBilling?.(reloadBilling) || undefined;
  }, [reloadBilling]);

  const ordersToPay = useMemo(() => orders.filter((o) => o.status === ORDER_STATUS.TO_PAY), [orders]);
  const electronicSeq = billing?.sequences?.find((s) => s.kind === 'electronica');
  const canDian = hasFeature(tenant.plan, 'dian') && isSequenceUsable(electronicSeq);

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
        ordersToPay={ordersToPay}
        invoices={invoices}
        closes={closes}
        onCharge={setCharging}
        onViewTicket={setTicket}
        onOpenClose={() => setCloseOpen(true)}
      />

      {charging && (
        <BillingModal
          order={charging}
          tenant={tenant}
          customers={customers}
          canDian={canDian}
          onClose={() => setCharging(null)}
          onNewCustomer={() => setCustomerOpen(true)}
          onIssue={issue}
        />
      )}
      {customerOpen && <NewCustomerModal onClose={() => setCustomerOpen(false)} onSave={saveCustomer} />}
      {ticket && <TicketModal invoice={ticket} tenant={tenant} onClose={() => setTicket(null)} />}
      {closeOpen && <DailyCloseModal invoices={invoices} onClose={() => setCloseOpen(false)} onConfirm={closeRegister} />}
    </div>
  );
}
