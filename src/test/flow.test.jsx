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
  fireEvent.change(screen.getByLabelText('PIN'), { target: { value: pin } });
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
    fireEvent.click(await screen.findByRole('button', { name: /Agregar al Pedido/ }));
    expect(await screen.findByText(/agregado a tu pedido/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Ver mi pedido/ }));
    const drawer = await screen.findByRole('dialog', { name: 'Tu pedido' });
    // 26.000 + 10 % de propina
    expect(within(drawer).getByText('$28.600')).toBeInTheDocument();
    fireEvent.click(within(drawer).getByRole('button', { name: /Enviar Pedido a Cocina/ }));
    expect(await screen.findByText(/Pedido #3 enviado a cocina/)).toBeInTheDocument();
  });

  it('un platillo con modificador obligatorio no se agrega sin elegirlo', async () => {
    renderAt(`/r/${SLUG}/m/demo-mesa-4`);
    fireEvent.click(await screen.findByRole('button', { name: /Hamburguesas/ }));
    fireEvent.click(await screen.findByText('Burger Trufada Gourmet'));
    const add = await screen.findByRole('button', { name: /Agregar al Pedido/ });
    expect(add).toBeDisabled();
    fireEvent.click(screen.getByRole('radio', { name: /Término Medio/ }));
    expect(add).toBeEnabled();
  });

  it('cocina ve la comanda y la lleva hasta caja; no puede entrar a caja', async () => {
    await loginAs('Cocina', '1111');
    expect(await screen.findByText('Monitor KDS de Cocina')).toBeInTheDocument();
    const card = (await screen.findByText(/#3 ·/)).closest('div.rounded-2xl');
    fireEvent.click(within(card).getByRole('button', { name: 'Tomar Orden' }));
    fireEvent.click(await within(card).findByRole('button', { name: 'Marcar como Listo' }));
    fireEvent.click(await within(card).findByRole('button', { name: 'Pasar a Caja POS' }));
    expect(await screen.findByText('Comanda #3 enviada a caja')).toBeInTheDocument();

    // Comanda anterior de la misma Mesa 4 (datos demo, ya en preparación)
    const earlier = (await screen.findByText(/#2 ·/)).closest('div.rounded-2xl');
    fireEvent.click(within(earlier).getByRole('button', { name: 'Marcar como Listo' }));
    fireEvent.click(await within(earlier).findByRole('button', { name: 'Pasar a Caja POS' }));
    expect(await screen.findByText('Comanda #2 enviada a caja')).toBeInTheDocument();

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
    // #2: 85.000 + 8.500 de propina; #3: 26.000 + 2.600
    expect(within(modal).getByText('$102.778')).toBeInTheDocument(); // base gravable 111.000 / 1,08
    expect(within(modal).getByText('$8.222')).toBeInTheDocument(); // INC 8 %
    expect(within(modal).getByText('$122.100')).toBeInTheDocument(); // con propina

    // Al quitar una comanda, el total se recalcula
    const totalRow = within(modal).getByText('TOTAL A COBRAR:').parentElement;
    fireEvent.click(within(modal).getByRole('checkbox', { name: /Comanda #2/ }));
    expect(totalRow).toHaveTextContent('$28.600');
    fireEvent.click(within(modal).getByRole('checkbox', { name: /Comanda #2/ }));
    fireEvent.click(within(modal).getByRole('button', { name: /Emitir factura electrónica/ }));

    expect(await screen.findByText('Nº FE-1')).toBeInTheDocument();
    expect(screen.getByText('Comandas: #2, #3')).toBeInTheDocument();
    expect(screen.getByText(/DOCUMENTO SIMULADO/)).toBeInTheDocument();
    fireEvent.click(screen.getAllByRole('button', { name: 'Cerrar' })[0]);

    fireEvent.click(await screen.findByRole('button', { name: /Cierre de caja \(Z\)/ }));
    fireEvent.change(await screen.findByLabelText(/Efectivo físico contado/), { target: { value: '122100' } });
    expect(screen.getByText('Caja cuadrada (físico − sistema):')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Procesar cierre Z/ }));
    expect(await screen.findByText(/Cierre Z-\d{8}-01/)).toBeInTheDocument();
  });
});
