import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import BillingModal from '../components/staff/BillingModal';
import AnalyticsDashboard from '../components/admin/AnalyticsDashboard';
import { api } from '../services/api';

afterEach(() => {
  cleanup();
});

const mockTenant = {
  id: 't1',
  name: "Kike's Gourmet",
  plan: 'premium',
  taxType: 'INC',
  taxRate: 8,
  tipRate: 10
};

const mockGroup = {
  tableLabel: '4',
  inKitchen: 0,
  orders: [
    {
      id: 101,
      tableLabel: '4',
      subtotal: 34000,
      tip: 3400,
      items: [
        { id: 'item-1', name: 'Hamburguesa Suprema', quantity: 1, billedQuantity: 0, unitPrice: 34000, selectedOptions: [] }
      ]
    },
    {
      id: 102,
      tableLabel: '4',
      subtotal: 12000,
      tip: 1200,
      items: [
        { id: 'item-2', name: 'Limonada de Coco', quantity: 1, billedQuantity: 0, unitPrice: 12000, selectedOptions: [] }
      ]
    }
  ]
};

const mockUseStaffSession = vi.fn(() => ({
  staff: { id: 'staff-owner', displayName: 'Kike (Dueño)', role: 'owner' }
}));

// Mock de sesión de personal (Dueño activo por defecto)
vi.mock('../hooks/useStaffSession', () => ({
  useStaffSession: () => mockUseStaffSession()
}));

vi.mock('../hooks/useTenant', () => ({
  useTenant: () => ({
    tenant: { id: 't1', slug: 'kikes-gourmet', name: "Kike's Gourmet", plan: 'premium' }
  })
}));

describe('Cortesías Comerciales (Comps & Atenciones)', () => {
  it('permite aplicar una cortesía a un platillo reduciendo su precio a $0', async () => {
    const onIssue = vi.fn();
    render(
      <BillingModal
        group={mockGroup}
        tenant={mockTenant}
        customers={[]}
        canDian={true}
        onClose={vi.fn()}
        onNewCustomer={vi.fn()}
        onIssue={onIssue}
      />
    );

    // Total inicial: Hamburguesa ($34.000) + Limonada ($12.000) = $46.000 + propina ($4.600) = $50.600
    expect(screen.getByTestId('billing-total')).toHaveTextContent('$50.600');

    // Hacemos clic en el botón de Cortesía de la Limonada (segundo botón "Cortesía")
    const courtesyButtons = screen.getAllByRole('button', { name: /Cortesía/i });
    fireEvent.click(courtesyButtons[1]);

    // Se abre el modal de aplicación de cortesía
    expect(screen.getByText('Aplicar Cortesía Comercial')).toBeInTheDocument();
    expect(screen.getAllByText('Limonada de Coco').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/Autorizado por: Kike \(Dueño\)/i)).toBeInTheDocument();

    // Seleccionamos motivo: Fidelización / Cliente VIP
    const reasonSelect = screen.getByLabelText('Motivo de la cortesía');
    fireEvent.change(reasonSelect, { target: { value: 'fidelizacion' } });

    // Confirmamos la cortesía
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar Cortesía' }));

    // Ahora la limonada es cortesía ($0). El subtotal es solo la Hamburguesa ($34.000) + propina ($3.400) = $37.400
    expect(screen.getByTestId('billing-total')).toHaveTextContent('$37.400');
    expect(screen.getByText(/Cortesía \(VIP\)/i)).toBeInTheDocument();

    // Emitimos la factura
    fireEvent.click(screen.getByRole('button', { name: /Emitir factura electrónica/ }));

    expect(onIssue).toHaveBeenCalledWith(
      expect.objectContaining({
        items: expect.arrayContaining([
          expect.objectContaining({
            name: 'Limonada de Coco',
            isCourtesy: true,
            courtesyReason: 'fidelizacion',
            authorizedByName: 'Kike (Dueño)'
          }),
          expect.objectContaining({
            name: 'Hamburguesa Suprema',
            isCourtesy: false
          })
        ])
      })
    );
  });

  it('permite quitar una cortesía previamente aplicada', async () => {
    render(
      <BillingModal
        group={mockGroup}
        tenant={mockTenant}
        customers={[]}
        canDian={true}
        onClose={vi.fn()}
        onNewCustomer={vi.fn()}
        onIssue={vi.fn()}
      />
    );

    // Aplicar cortesía
    const courtesyButtons = screen.getAllByRole('button', { name: /Cortesía/i });
    fireEvent.click(courtesyButtons[1]);
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar Cortesía' }));
    expect(screen.getByTestId('billing-total')).toHaveTextContent('$37.400');

    // Quitar cortesía haciendo clic en la insignia
    const activeBadge = screen.getByText(/Cortesía \(VIP\)/i);
    fireEvent.click(activeBadge);

    // El total vuelve a ser el valor completo
    expect(screen.getByTestId('billing-total')).toHaveTextContent('$50.600');
  });

  it('muestra la pestaña de Cortesías e Inversión en el Dashboard de Analítica', async () => {
    render(
      <MemoryRouter>
        <AnalyticsDashboard />
      </MemoryRouter>
    );

    // Cambiar a pestaña de Cortesías e Inversión
    const tabBtn = screen.getByRole('button', { name: /Cortesías e Inversión/i });
    fireEvent.click(tabBtn);

    await waitFor(() => {
      expect(screen.getByTestId('courtesy-commercial-total')).toHaveTextContent('$138.000');
    });

    // Validar tarjetas de inversión comercial
    expect(screen.getByTestId('courtesy-cost-total')).toHaveTextContent('$37.600');
    expect(screen.getByTestId('courtesy-count-total')).toHaveTextContent('3 platos');

    // Validar motivos y auditoría
    expect(screen.getAllByText('Fidelización / VIP').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Compensación por Demoras')).toBeInTheDocument();
    expect(screen.getByText('Carpaccio di Wagyu A5')).toBeInTheDocument();
  });

  it('requiere PIN de Dueño/Admin cuando el cajero no tiene rol de administrador', async () => {
    // Mock de sesión de cajero (sin privilegios de dueño)
    mockUseStaffSession.mockReturnValue({
      staff: { id: 'staff-caja', displayName: 'Cajero Turno 1', role: 'caja' }
    });

    render(
      <BillingModal
        group={mockGroup}
        tenant={mockTenant}
        customers={[]}
        canDian={true}
        onClose={vi.fn()}
        onNewCustomer={vi.fn()}
        onIssue={vi.fn()}
      />
    );

    // Hacemos clic en Cortesía
    const courtesyButtons = screen.getAllByRole('button', { name: /Cortesía/i });
    fireEvent.click(courtesyButtons[0]);

    // Debe solicitar PIN
    expect(screen.getByText('PIN de Dueño o Administrador')).toBeInTheDocument();
    const pinInput = screen.getByPlaceholderText('••••');

    // Intentamos con PIN incorrecto
    fireEvent.change(pinInput, { target: { value: '9999' } });
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar Cortesía' }));

    await waitFor(() => {
      expect(screen.getByText(/PIN incorrecto o no pertenece a un administrador/i)).toBeInTheDocument();
    });

    // Ahora ingresamos el PIN correcto del dueño ('1234')
    fireEvent.change(pinInput, { target: { value: '1234' } });
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar Cortesía' }));

    // El modal se cierra y la cortesía queda aplicada
    await waitFor(() => {
      expect(screen.queryByText('Aplicar Cortesía Comercial')).not.toBeInTheDocument();
    });
    expect(screen.getByText(/Cortesía \(VIP\)/i)).toBeInTheDocument();
  });
});
