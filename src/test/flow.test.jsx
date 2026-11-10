// Flujo completo en modo demo: comensal pide → cocina prepara → caja factura → cierre Z.
import { describe, it, expect, beforeAll } from 'vitest';
import { render, screen, within, fireEvent, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from '../App';
import { ToastProvider } from '../hooks/useToast';
import { demoApi } from '../services/demo/demoApi';

const SLUG = 'la-trattoria';

function renderAt(path) {
  cleanup();
  return render(
    <MemoryRouter initialEntries={[path]}>
      <ToastProvider>
        <App />
      </ToastProvider>
    </MemoryRouter>
  );
}

async function loginAs(name, pin) {
  renderAt(`/staff/${SLUG}/login`);
  fireEvent.click(await screen.findByRole('button', { name: new RegExp(name) }));
  fireEvent.change(screen.getByLabelText(/PIN/), { target: { value: pin } });
  fireEvent.click(screen.getByRole('button', { name: 'Ingresar' }));
}

beforeAll(() => {
  localStorage.clear();
  sessionStorage.clear();
  demoApi.resetDemo();
});

describe('flujo del restaurante (modo demo)', () => {
  it('el comensal sin token de mesa puede ver la carta pero no pedir', async () => {
    renderAt(`/r/${SLUG}/m/token-falso`);
    expect(await screen.findByText('Sin mesa')).toBeInTheDocument();
  });

  it('el comensal pide desde la Mesa 4 y el servidor calcula el total', async () => {
    renderAt(`/r/${SLUG}/m/demo-mesa-4`);
    expect(await screen.findByText('Mesa 4')).toBeInTheDocument();

    fireEvent.click(await screen.findByRole('button', { name: /Bebidas/ }));
    fireEvent.click(await screen.findByText('Smoked Old Fashioned de Autor'));
    fireEvent.click(await screen.findByRole('button', { name: /Agregar al pedido/ }));
    expect(await screen.findByText(/agregado a tu pedido/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Ver pedido/ }));
    const drawer = await screen.findByRole('dialog', { name: 'Tu pedido' });
    // Sin propina: se define al pagar, en caja
    expect(within(drawer).getByTestId('cart-total')).toHaveTextContent('$26.000');
    expect(within(drawer).getByText(/la defines al pagar/)).toBeInTheDocument();
    fireEvent.click(within(drawer).getByRole('button', { name: /Enviar pedido a cocina/ }));
    expect(await screen.findByText(/Pedido #3 enviado a cocina/)).toBeInTheDocument();
  });

  it('un platillo con modificador obligatorio no se agrega sin elegirlo', async () => {
    renderAt(`/r/${SLUG}/m/demo-mesa-4`);
    fireEvent.click(await screen.findByRole('button', { name: /Hamburguesas/ }));
    fireEvent.click(await screen.findByText('Burger Trufada Gourmet'));
    const add = await screen.findByRole('button', { name: /Agregar al pedido/ });
    expect(add).toBeDisabled();
    fireEvent.click(screen.getByRole('radio', { name: /Término Medio/ }));
    expect(add).toBeEnabled();
  });

  it('el "+" agrega directo los platos sin opciones; los que tienen opciones abren el detalle', async () => {
    renderAt(`/r/${SLUG}/m/demo-mesa-4`);
    expect(await screen.findByText('Burger Trufada Gourmet')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Agregar Burger Trufada Gourmet al pedido' })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Agregar Tiramisú Tradicional Artesanal al pedido' }));
    expect(await screen.findByText(/Tiramisú Tradicional Artesanal agregado/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Ver pedido/ })).toHaveTextContent('1 plato');
    // Se vacía para no afectar las pruebas siguientes
    fireEvent.click(screen.getByRole('button', { name: /Ver pedido/ }));
    fireEvent.click(await screen.findByRole('button', { name: 'Quitar Tiramisú Tradicional Artesanal del pedido' }));
  });

  it('cocina ve la comanda y la lleva hasta caja; no puede entrar a caja', async () => {
    await loginAs('Cocina', '1111');
    expect(await screen.findByRole('heading', { name: 'Cocina' })).toBeInTheDocument();
    const card = await screen.findByRole('article', { name: /Comanda 3,/ });
    fireEvent.click(within(card).getByRole('button', { name: 'Tomar orden' }));
    fireEvent.click(await within(card).findByRole('button', { name: 'Marcar lista' }));
    fireEvent.click(await within(card).findByRole('button', { name: 'Pasar a caja' }));
    expect(await screen.findByText('Comanda 3 enviada a caja')).toBeInTheDocument();

    // Comanda anterior de la misma Mesa 4 (datos demo, ya en preparación)
    const earlier = await screen.findByRole('article', { name: /Comanda 2,/ });
    fireEvent.click(within(earlier).getByRole('button', { name: 'Marcar lista' }));
    fireEvent.click(await within(earlier).findByRole('button', { name: 'Pasar a caja' }));
    expect(await screen.findByText('Comanda 2 enviada a caja')).toBeInTheDocument();

    renderAt(`/staff/${SLUG}/caja`);
    expect(await screen.findByText('Sin acceso a esta sección')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar sesión' }));
  });

  it('PIN incorrecto no da acceso', async () => {
    await loginAs('Caja', '9999');
    expect(await screen.findByRole('alert')).toHaveTextContent('PIN incorrecto');
  });

  it('caja factura las dos comandas de la mesa en un solo comprobante y hace el cierre Z', async () => {
    await loginAs('Caja', '2222');
    expect(await screen.findByText('Mesas por cobrar (1)')).toBeInTheDocument();
    expect(screen.getByText('2 comandas')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Facturar mesa 4/ }));

    const modal = await screen.findByRole('dialog');
    // #2: 85.000 + #3: 26.000 = 111.000; propina sugerida 10 % = 11.100
    expect(within(modal).getByText('$102.778')).toBeInTheDocument(); // base gravable 111.000 / 1,08
    expect(within(modal).getByText('$8.222')).toBeInTheDocument(); // INC 8 %
    const totalRow = within(modal).getByTestId('billing-total');
    expect(totalRow).toHaveTextContent('$122.100');

    // La propina es voluntaria: el cliente puede quitarla
    fireEvent.click(within(modal).getByRole('radio', { name: 'Sin propina' }));
    expect(totalRow).toHaveTextContent('$111.000');
    fireEvent.click(within(modal).getByRole('radio', { name: /Sugerida/ }));

    // Al quitar una comanda, el total se recalcula
    fireEvent.click(within(modal).getByRole('checkbox', { name: /Comanda 2\b/ }));
    expect(totalRow).toHaveTextContent('$28.600'); // 26.000 + 10 %
    fireEvent.click(within(modal).getByRole('checkbox', { name: /Comanda 2\b/ }));
    fireEvent.click(within(modal).getByRole('button', { name: /Emitir factura electrónica/ }));

    expect(await screen.findByText('Nº FE-1')).toBeInTheDocument();
    expect(screen.getByText('Comandas: #2, #3')).toBeInTheDocument();
    expect(screen.getByText(/DOCUMENTO SIMULADO/)).toBeInTheDocument();
    fireEvent.click(screen.getAllByRole('button', { name: 'Cerrar' })[0]);

    fireEvent.click(await screen.findByRole('button', { name: /Cerrar caja \(Z\)/ }));
    fireEvent.change(await screen.findByLabelText(/Efectivo físico contado/), { target: { value: '122100' } });
    expect(screen.getByText('Caja cuadrada (físico − sistema):')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Procesar cierre Z/ }));
    expect(await screen.findByText(/Cierre Z-\d{8}-01/)).toBeInTheDocument();
  });
});
