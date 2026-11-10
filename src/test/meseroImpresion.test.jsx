// Llamado al mesero, cocina sin pantalla con comandas impresas y plan Intermedio sin caja (modo demo).
import { describe, it, expect, beforeAll, vi } from 'vitest';
import { render, screen, within, fireEvent, cleanup, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from '../App';
import { ToastProvider } from '../hooks/useToast';
import { demoApi } from '../services/demo/demoApi';
import { DEMO_TENANT, demoUuid } from '../services/demo/seedData';
import { printHtml } from '../services/printer';

vi.mock('../services/printer', async (importOriginal) => ({
  ...(await importOriginal()),
  printHtml: vi.fn(() => Promise.resolve())
}));

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

const orderAt = (table) =>
  demoApi.createOrder({ slug: SLUG, tableToken: `demo-mesa-${table}`, items: [{ productId: demoUuid('p', 6), quantity: 1 }], includeTip: false });

beforeAll(async () => {
  localStorage.clear();
  sessionStorage.clear();
  demoApi.resetDemo();
});

describe('llamado al mesero, comandas impresas y planes (modo demo)', () => {
  it('el comensal llama al mesero y el personal lo marca atendido', async () => {
    renderAt(`/r/${SLUG}/m/demo-mesa-4`);
    fireEvent.click(await screen.findByRole('button', { name: 'Llamar al mesero' }));
    expect(await screen.findByText(/el mesero va en camino/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Mesero avisado' })).toBeDisabled();

    await loginAs('Cocina', '1111');
    const panel = await screen.findByRole('region', { name: 'Llamados al mesero' });
    expect(within(panel).getByText('Mesa 4 llama al mesero')).toBeInTheDocument();
    fireEvent.click(within(panel).getByRole('button', { name: /Marcar atendido/ }));
    await waitFor(() => expect(screen.queryByRole('region', { name: 'Llamados al mesero' })).toBeNull());
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar sesión' }));
  });

  it('sin pantalla de cocina: la comanda se imprime sola, se reimprime y pasa a caja', async () => {
    await loginAs('Kike', '1234');
    await screen.findByRole('heading', { name: 'Administración' });
    const tenant = await demoApi.getTenantBySlug(SLUG);
    await demoApi.updateTenant(tenant.id, { ...tenant, kitchenDisplay: false });
    localStorage.setItem(`kikes_impresora_${DEMO_TENANT.id}`, '1');
    printHtml.mockClear();

    renderAt(`/staff/${SLUG}/cocina`);
    expect(await screen.findByRole('heading', { name: 'Comandas' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Comandas/ })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Imprime comandas/ })).toBeInTheDocument();
    // Las comandas de ejemplo ya figuraban como impresas: no salen al activar la impresora
    expect(printHtml).not.toHaveBeenCalled();

    const { orderId } = await orderAt(6);
    await waitFor(() => expect(printHtml).toHaveBeenCalledTimes(1));
    expect(printHtml.mock.calls[0][0]).toContain('Mesa 6');
    const card = await screen.findByRole('listitem', { name: `Comanda ${orderId}, mesa 6` });
    expect(await within(card).findByText(/^Impresa/)).toBeInTheDocument();

    fireEvent.click(within(card).getByRole('button', { name: `Reimprimir la comanda ${orderId}` }));
    await waitFor(() => expect(printHtml).toHaveBeenCalledTimes(2));
    expect(printHtml.mock.calls[1][0]).toContain('REIMPRESIÓN');

    fireEvent.click(within(card).getByRole('button', { name: /Pasar a caja/ }));
    expect(await screen.findByText(`Mesa 6: comanda ${orderId} enviada a caja`)).toBeInTheDocument();
    // Ya no se imprime más: la comanda salió de la cocina
    expect(printHtml).toHaveBeenCalledTimes(2);

    await demoApi.updateTenant(tenant.id, { ...tenant, kitchenDisplay: true });
    localStorage.removeItem(`kikes_impresora_${DEMO_TENANT.id}`);
  });

  it('plan Intermedio: sin caja, la cocina entrega la comanda y la caja queda bloqueada', async () => {
    await demoApi.setDemoPlan('intermedio');
    const { orderId } = await orderAt(5);

    renderAt(`/staff/${SLUG}/cocina`);
    expect(await screen.findByRole('heading', { name: 'Cocina' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /^Caja/ })).toBeNull();
    const card = await screen.findByRole('article', { name: new RegExp(`Comanda ${orderId},`) });
    fireEvent.click(within(card).getByRole('button', { name: 'Tomar orden' }));
    fireEvent.click(await within(card).findByRole('button', { name: 'Marcar lista' }));
    fireEvent.click(await within(card).findByRole('button', { name: 'Entregada' }));
    expect(await screen.findByText(`Comanda ${orderId} entregada`)).toBeInTheDocument();

    renderAt(`/staff/${SLUG}/caja`);
    expect(await screen.findByText('Caja no está en tu plan')).toBeInTheDocument();
    expect(screen.getByText('Premium')).toBeInTheDocument();
  });
});
