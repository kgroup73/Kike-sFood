import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, cleanup, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import MenuPage from '../pages/MenuPage';
import PendingActivationScreen from '../components/admin/PendingActivationScreen';
import { demoApi } from '../services/demo/demoApi';

describe('Protección y Activación de Restaurantes', () => {
  const inactiveTenant = {
    id: 't-inactive',
    slug: 'burger-prueba',
    name: 'Burger Prueba',
    isActive: false,
    status: 'pending_activation',
    plan: 'intermedio',
    requestedPlan: 'intermedio',
    phone: '3001234567'
  };

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    demoApi.resetDemo();
  });

  afterEach(() => {
    cleanup();
  });

  it('muestra la pantalla de activación pendiente con canje de código al dueño', async () => {
    const reloadMock = vi.fn();
    const logoutMock = vi.fn();

    render(
      <MemoryRouter>
        <PendingActivationScreen
          tenant={inactiveTenant}
          reload={reloadMock}
          onLogout={logoutMock}
        />
      </MemoryRouter>
    );

    // Encabezado y badges
    expect(screen.getByRole('heading', { level: 1, name: /Tu cuenta está en espera de activación/i })).toBeInTheDocument();
    expect(screen.getByText('Burger Prueba')).toBeInTheDocument();
    expect(screen.getByText('Intermedio')).toBeInTheDocument();

    // Botón de WhatsApp de KGroup con el número
    expect(screen.getByText(/Contactar a KGroup por WhatsApp/i)).toBeInTheDocument();

    // Formulario de canje
    const input = screen.getByPlaceholderText(/Ej. KIKE-INT-8X92/i);
    expect(input).toBeInTheDocument();

    // Generar un código real en el mock
    const codeObj = await demoApi.superadminCreateUpgradeCode({
      plan: 'intermedio',
      durationDays: 30,
      targetSlug: 'burger-prueba'
    });

    fireEvent.change(input, { target: { value: codeObj.code } });
    fireEvent.click(screen.getByRole('button', { name: /Activar restaurante/i }));

    await waitFor(() => {
      expect(reloadMock).toHaveBeenCalledTimes(1);
    });
  });

  it('muestra error descriptivo si se ingresa un código inválido', async () => {
    render(
      <MemoryRouter>
        <PendingActivationScreen
          tenant={inactiveTenant}
          reload={vi.fn()}
        />
      </MemoryRouter>
    );

    const input = screen.getByPlaceholderText(/Ej. KIKE-INT-8X92/i);
    fireEvent.change(input, { target: { value: 'CODIGO-FALSO-999' } });
    fireEvent.click(screen.getByRole('button', { name: /Activar restaurante/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });
});
