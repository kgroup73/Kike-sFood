import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import BillingModal from '../components/staff/BillingModal';
import { demoApi } from '../services/demo/demoApi';

const mockTenant = {
  id: 't1',
  name: "Kike's Gourmet",
  plan: 'premium',
  taxType: 'INC',
  taxRate: 8,
  tipRate: 10
};

const mockCustomers = [];

describe('Split Billing (Separar cuenta por platillos)', () => {
  afterEach(() => {
    cleanup();
  });
  const mockGroup = {
    tableLabel: '4',
    inKitchen: 0,
    orders: [
      {
        id: 101,
        tableLabel: '4',
        subtotal: 68000,
        tip: 6800,
        items: [
          { id: 'item-1', name: 'Hamburguesa Suprema', quantity: 2, billedQuantity: 0, unitPrice: 34000, selectedOptions: ['Medio'] }
        ]
      },
      {
        id: 102,
        tableLabel: '4',
        subtotal: 30000,
        tip: 3000,
        items: [
          { id: 'item-2', name: 'Cerveza Artesanal', quantity: 2, billedQuantity: 0, unitPrice: 15000, selectedOptions: [] }
        ]
      }
    ]
  };

  it('renderiza por defecto el modo por platillos con todos los ítems seleccionados', () => {
    render(
      <BillingModal
        group={mockGroup}
        tenant={mockTenant}
        customers={mockCustomers}
        canDian={true}
        onClose={vi.fn()}
        onNewCustomer={vi.fn()}
        onIssue={vi.fn()}
      />
    );

    // Muestra los platillos de la mesa
    expect(screen.getByText('Hamburguesa Suprema')).toBeInTheDocument();
    expect(screen.getByText('Cerveza Artesanal')).toBeInTheDocument();

    // El subtotal inicial es el total de la mesa ($68.000 + $30.000 = $98.000)
    // Con propina sugerida del 10% ($9.800), total = $107.800
    expect(screen.getByTestId('billing-total')).toHaveTextContent('$107.800');
  });

  it('permite desmarcar platillos para cobrar solo una parte de la mesa', () => {
    const onIssue = vi.fn();
    render(
      <BillingModal
        group={mockGroup}
        tenant={mockTenant}
        customers={mockCustomers}
        canDian={true}
        onClose={vi.fn()}
        onNewCustomer={vi.fn()}
        onIssue={onIssue}
      />
    );

    // Desmarcamos las cervezas
    const cervezaCheckbox = screen.getByLabelText('Platillo Cerveza Artesanal');
    fireEvent.click(cervezaCheckbox);

    // Ahora solo quedan las 2 hamburguesas ($68.000) + propina 10% ($6.800) = $74.800
    expect(screen.getByTestId('billing-total')).toHaveTextContent('$74.800');

    // Emitimos el tiquete de esta parte
    const submitBtn = screen.getByRole('button', { name: /Emitir factura electrónica/ });
    fireEvent.click(submitBtn);

    expect(onIssue).toHaveBeenCalledWith(
      expect.objectContaining({
        orderIds: [101],
        items: expect.arrayContaining([
          expect.objectContaining({ name: 'Hamburguesa Suprema', quantity: 2 })
        ])
      })
    );
  });

  it('permite cambiar a modo por comandas completas', () => {
    render(
      <BillingModal
        group={mockGroup}
        tenant={mockTenant}
        customers={mockCustomers}
        canDian={true}
        onClose={vi.fn()}
        onNewCustomer={vi.fn()}
        onIssue={vi.fn()}
      />
    );

    // Cambiamos al modo por comandas
    const porComandasBtn = screen.getByRole('button', { name: /Por comandas/i });
    fireEvent.click(porComandasBtn);

    expect(screen.getByText('Comanda 101')).toBeInTheDocument();
    expect(screen.getByText('Comanda 102')).toBeInTheDocument();
  });

  it('permite fraccionar unidades de un platillo con el stepper (- / +)', () => {
    const onIssue = vi.fn();
    render(
      <BillingModal
        group={mockGroup}
        tenant={mockTenant}
        customers={mockCustomers}
        canDian={true}
        onClose={vi.fn()}
        onNewCustomer={vi.fn()}
        onIssue={onIssue}
      />
    );

    // Desmarcamos las cervezas primero para aislar las hamburguesas
    fireEvent.click(screen.getByLabelText('Platillo Cerveza Artesanal'));

    // Las hamburguesas tienen cantidad 2. Hacemos click en restar unidad '-'
    const minusBtn = screen.getByLabelText('Restar unidad');
    fireEvent.click(minusBtn);

    // Ahora solo se cobra 1 hamburguesa ($34.000) + propina ($3.400) = $37.400
    expect(screen.getByTestId('billing-total')).toHaveTextContent('$37.400');

    // Emitimos factura
    fireEvent.click(screen.getByRole('button', { name: /Emitir factura electrónica/ }));
    expect(onIssue).toHaveBeenCalledWith(
      expect.objectContaining({
        orderIds: [101],
        items: expect.arrayContaining([
          expect.objectContaining({ name: 'Hamburguesa Suprema', quantity: 1 })
        ])
      })
    );
  });

  it('permite deseleccionar todo con "Ninguno" y re-seleccionar con "Todos"', () => {
    render(
      <BillingModal
        group={mockGroup}
        tenant={mockTenant}
        customers={mockCustomers}
        canDian={true}
        onClose={vi.fn()}
        onNewCustomer={vi.fn()}
        onIssue={vi.fn()}
      />
    );

    // Click en "Ninguno"
    fireEvent.click(screen.getByRole('button', { name: 'Ninguno' }));
    expect(screen.getByTestId('billing-total')).toHaveTextContent('$0');
    expect(screen.getByText(/Marca al menos un platillo para cobrar/i)).toBeInTheDocument();

    // Click en "Todos"
    fireEvent.click(screen.getByRole('button', { name: 'Todos' }));
    expect(screen.getByTestId('billing-total')).toHaveTextContent('$107.800');
  });
});
