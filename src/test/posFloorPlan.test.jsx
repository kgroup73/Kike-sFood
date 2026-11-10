import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, within, fireEvent, cleanup } from '@testing-library/react';
import PosView from '../components/staff/PosView';
import { groupAllActiveTables, groupOrdersByTable } from '../lib/billing';
import { defaultEnvironments, resolveTableLayout } from '../lib/environments';

const environments = defaultEnvironments();
const floorPlan = {
  environments,
  layoutOf: (t) => resolveTableLayout(t, {}, environments),
  saveLayout: vi.fn(() => Promise.resolve())
};
const tables = ['1', '2', '8'].map((label) => ({ id: `t${label}`, label, token: `tok${label}`, isActive: true }));
const order = (id, label, status, subtotal) => ({
  id,
  tableId: `t${label}`,
  tableLabel: label,
  status,
  subtotal,
  tip: 0,
  total: subtotal,
  items: [{ name: 'Bandeja', quantity: 1, totalPrice: subtotal }]
});
const orders = [order(1, '2', 'En Preparación', 30000), order(2, '8', 'Por Cobrar', 45000)];

function renderPos(props = {}) {
  const handlers = { onCharge: vi.fn(), onDirectCharge: vi.fn(), onViewTicket: vi.fn(), onOpenClose: vi.fn() };
  render(
    <PosView
      tables={tables}
      floorPlan={floorPlan}
      tablesToPay={groupOrdersByTable(orders)}
      activeTables={groupAllActiveTables(orders)}
      invoices={[]}
      closes={[]}
      {...handlers}
      {...props}
    />
  );
  return handlers;
}

describe('caja: resumen y plano de mesas', () => {
  afterEach(cleanup);

  it('muestra las cifras del turno con el consumo abierto (sin propina)', () => {
    renderPos();
    expect(screen.getByText('Consumo abierto en sala').nextSibling).toHaveTextContent('$75.000');
    expect(screen.getByText('Comandas en cocina').nextSibling).toHaveTextContent('1');
    expect(screen.getByRole('heading', { name: 'Mesas por cobrar (1)' })).toBeInTheDocument();
  });

  it('en el plano, una mesa con comandas en cocina ofrece el cobro directo', () => {
    const { onDirectCharge, onCharge } = renderPos();
    fireEvent.click(screen.getByRole('tab', { name: /Plano de mesas/ }));

    fireEvent.click(screen.getByRole('button', { name: /^Mesa 2, En cocina/ }));
    const detail = screen.getByRole('complementary', { name: 'Detalle de la mesa 2' });
    fireEvent.click(within(detail).getByRole('button', { name: /Cobrar ya, sin esperar cocina/ }));
    expect(onDirectCharge).toHaveBeenCalledWith(expect.objectContaining({ tableLabel: '2' }));

    fireEvent.click(screen.getByRole('button', { name: /^Mesa 8, Por cobrar/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Facturar mesa 8' }));
    expect(onCharge).toHaveBeenCalledWith(expect.objectContaining({ tableLabel: '8' }));
  });

  it('solo quien administra puede cambiar forma y ambiente desde la caja', () => {
    renderPos();
    fireEvent.click(screen.getByRole('tab', { name: /Plano de mesas/ }));
    fireEvent.click(screen.getByRole('button', { name: /^Mesa 1, Libre/ }));
    expect(screen.queryByLabelText('Forma')).not.toBeInTheDocument();
  });
});
