// Fila de impresión por estaciones (modo demo) y vinculación del agente local.
import { describe, it, expect, beforeAll, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup, within } from '@testing-library/react';
import { demoApi } from '../services/demo/demoApi';
import { DEMO_TENANT, demoUuid } from '../services/demo/seedData';
import { printJobHtml } from '../lib/kitchenTicket';
import { ToastProvider } from '../hooks/useToast';
import DevicesPanel from '../components/admin/printing/DevicesPanel';
import { api } from '../services/api';

const SLUG = 'la-trattoria';
const TIRAMISU = demoUuid('p', 6);
const BURGER = demoUuid('p', 1);

async function order(table, items) {
  return demoApi.createOrder({ slug: SLUG, tableToken: `demo-mesa-${table}`, items, includeTip: false });
}

describe('fila de impresión en la demo', () => {
  beforeAll(async () => {
    localStorage.clear();
    sessionStorage.clear();
    demoApi.resetDemo();
    await demoApi.loginStaff({ slug: SLUG, staffId: 'b0000000-0000-4000-8000-000000000001', pin: '1234' });
  });

  it('reparte la comanda por estación según la categoría del plato', async () => {
    const barra = await demoApi.savePrintStation({ name: 'Postres' });
    const menu = await demoApi.getMenu();
    const postres = menu.products.find((p) => p.id === TIRAMISU).categoryId;
    await demoApi.setCategoryStation(postres, barra);

    const { orderId } = await order(7, [
      { productId: TIRAMISU, quantity: 2 },
      { productId: BURGER, quantity: 1, selections: { 'Término de la Carne': 'Término Medio' } }
    ]);
    const jobs = (await demoApi.claimPrintJobs()).filter((j) => j.orderId === orderId);
    expect(jobs.map((j) => j.payload.station).sort()).toEqual(['Cocina', 'Postres']);
    const postresJob = jobs.find((j) => j.payload.station === 'Postres');
    expect(postresJob.payload.items).toEqual([{ quantity: 2, name: 'Tiramisú Tradicional Artesanal', options: [] }]);
    // Otro imprimidor no vuelve a tomar lo que ya está imprimiéndose
    expect((await demoApi.claimPrintJobs()).filter((j) => j.orderId === orderId)).toHaveLength(0);

    await demoApi.reportPrintJob(jobs[0].id, true);
    let open = await demoApi.listOpenOrders();
    expect(open.find((o) => o.id === orderId).printedAt).toBeNull();
    await demoApi.reportPrintJob(jobs[1].id, true);
    open = await demoApi.listOpenOrders();
    expect(open.find((o) => o.id === orderId).printedAt).toBeTruthy();

    const html = printJobHtml(postresJob);
    expect(html).toContain('POSTRES');
    expect(html).toContain('Mesa 7');
  });

  it('una falla vuelve a la fila y tras 5 intentos queda en error', async () => {
    const [cocina] = await demoApi.listPrintStations();
    const id = await demoApi.printTest(cocina.id);
    for (let i = 0; i < 5; i++) {
      const [job] = await demoApi.claimPrintJobs([cocina.id]);
      expect(job.id).toBe(id);
      await demoApi.reportPrintJob(id, false, 'Sin papel');
    }
    expect(await demoApi.claimPrintJobs([cocina.id])).toHaveLength(0);
  });

  it('el tiquete de caja necesita una estación de tiquetes', async () => {
    const { orderId } = await order(8, [{ productId: TIRAMISU, quantity: 1 }]);
    for (const status of ['En Preparación', 'Listo', 'Por Cobrar']) await demoApi.updateOrderStatus(orderId, status);
    const inv = await demoApi.issueInvoice({ orderIds: [orderId], kind: 'pos', paymentMethod: 'efectivo' });
    await expect(demoApi.printInvoice(inv.id)).rejects.toThrow(/tiquetes de caja/);
    await demoApi.savePrintStation({ name: 'Caja', printsReceipts: true });
    await demoApi.printInvoice(inv.id);
    const [job] = (await demoApi.claimPrintJobs()).filter((j) => j.kind === 'tiquete');
    expect(job.payload.number).toBe(inv.number);
    expect(printJobHtml(job)).toContain(inv.number);
  });

  it('no deja borrar la última estación', async () => {
    const stations = await demoApi.listPrintStations();
    for (const s of stations.slice(1)) await demoApi.deletePrintStation(s.id);
    await expect(demoApi.deletePrintStation(stations[0].id)).rejects.toThrow(/al menos una estación/);
  });
});

describe('vincular un equipo de impresión', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('muestra el código y la línea de instalación con el código del restaurante', async () => {
    vi.spyOn(api, 'agentConnection').mockReturnValue({ servidor: 'https://abc.supabase.co', llave: 'llave-publica' });
    vi.spyOn(api, 'listPrintDevices').mockResolvedValue([
      { id: 'd1', name: 'PC barra', stationIds: ['s1'], pairedAt: '2026-11-10T10:00:00Z', lastSeenAt: new Date().toISOString(), agentVersion: '0.1.0' }
    ]);
    const create = vi.spyOn(api, 'createPrintDevice').mockResolvedValue({ deviceId: 'd2', code: 'K7Q2-9XMB', expiresAt: new Date(Date.now() + 1800000).toISOString() });

    render(
      <ToastProvider>
        <DevicesPanel tenant={DEMO_TENANT} stations={[{ id: 's1', name: 'Cocina' }, { id: 's2', name: 'Barra' }]} />
      </ToastProvider>
    );
    expect(await screen.findByText('PC barra')).toBeInTheDocument();
    expect(screen.getByText('Conectado')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Vincular un equipo/ }));
    fireEvent.click(screen.getByRole('checkbox', { name: 'Barra' }));
    fireEvent.click(screen.getByRole('button', { name: /Crear y ver el código/ }));

    const card = await screen.findByRole('region', { name: 'Código de vinculación' });
    expect(create).toHaveBeenCalledWith({ name: 'Computador de la cocina', stationIds: ['s2'] });
    expect(within(card).getByText('K7Q2-9XMB')).toBeInTheDocument();
    expect(within(card).getByText(/-Restaurante la-trattoria -Codigo K7Q2-9XMB -Servidor https:\/\/abc\.supabase\.co -Llave llave-publica/)).toBeInTheDocument();
  });

  it('en la demo explica que el agente necesita la nube', async () => {
    render(
      <ToastProvider>
        <DevicesPanel tenant={DEMO_TENANT} stations={[]} />
      </ToastProvider>
    );
    expect(screen.getByText(/se conectan a la versión en la nube/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Vincular un equipo/ })).toBeNull();
  });
});
