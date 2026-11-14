import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import KitchenPage from '../pages/staff/KitchenPage';

const mockUseTenant = vi.fn();
const mockUseOrders = vi.fn();
const mockUseMenu = vi.fn();
const mockUseToast = vi.fn();

vi.mock('../hooks/useTenant', () => ({
  useTenant: () => mockUseTenant()
}));

vi.mock('../hooks/useOrders', () => ({
  useOrders: (...args) => mockUseOrders(...args)
}));

vi.mock('../hooks/useMenu', () => ({
  useMenu: (...args) => mockUseMenu(...args)
}));

vi.mock('../hooks/useToast', () => ({
  useToast: () => mockUseToast
}));

vi.mock('../hooks/useSound', () => ({
  playChime: vi.fn()
}));

vi.mock('../services/api', () => ({
  api: {
    requestOrderReprint: vi.fn(),
    setIngredientStock: vi.fn()
  }
}));

vi.mock('../components/staff/KitchenView', () => ({
  default: () => <div data-testid="kitchen-view-mock">Kitchen View</div>
}));

vi.mock('../components/staff/OrdersListView', () => ({
  default: () => <div data-testid="orders-list-view-mock">Orders List View</div>
}));

describe('KitchenPage A11y Live Regions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseTenant.mockReturnValue({
      tenant: { id: 't1', plan: 'pro', kitchenDisplay: true }
    });
    mockUseMenu.mockReturnValue({
      masterIngredients: [],
      ingredientsStock: {},
      reload: vi.fn()
    });
  });

  afterEach(() => {
    cleanup();
  });

  it('mantiene la región en vivo aria-live="polite" con mensaje cuando no hay comandas', () => {
    mockUseOrders.mockReturnValue({
      orders: [],
      error: null,
      reload: vi.fn(),
      updateStatus: vi.fn()
    });

    render(<KitchenPage />);

    const liveRegion = screen.getByTestId('kitchen-live-region');
    expect(liveRegion).toBeInTheDocument();
    expect(liveRegion).toHaveAttribute('role', 'status');
    expect(liveRegion).toHaveAttribute('aria-live', 'polite');
    expect(liveRegion).toHaveAttribute('aria-atomic', 'true');
    expect(liveRegion).toHaveClass('sr-only');
    expect(liveRegion).toHaveTextContent('No hay comandas activas en cocina.');
  });

  it('anuncia dinámicamente el conteo y la mesa de la última comanda recibida', () => {
    mockUseOrders.mockReturnValue({
      orders: [
        { id: 'ord-1', tableLabel: '4', status: 'En preparación' },
        { id: 'ord-2', tableLabel: '7', status: 'Pendiente' }
      ],
      error: null,
      reload: vi.fn(),
      updateStatus: vi.fn()
    });

    render(<KitchenPage />);

    const liveRegion = screen.getByTestId('kitchen-live-region');
    expect(liveRegion).toHaveTextContent('2 comandas en cocina. Última comanda: Mesa 4.');
  });
});
