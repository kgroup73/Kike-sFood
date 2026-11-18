import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from '../App';
import { ToastProvider } from '../hooks/useToast';
import { demoApi } from '../services/demo/demoApi';

const SLUG = 'la-trattoria';
const OWNER_ID = 'b0000000-0000-4000-8000-000000000001';

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

describe('Seguridad y ciclo de vida de mesas (Prevención de pedidos fantasma)', () => {
  let prodId1;
  let prodId2;
  const TABLE_TOKEN = 'demo-mesa-5';

  beforeEach(async () => {
    localStorage.clear();
    sessionStorage.clear();
    demoApi.resetDemo();
    await demoApi.loginStaff({ slug: SLUG, staffId: OWNER_ID, pin: '1234' });
    const menu = await demoApi.getMenu();
    const simpleProducts = menu.products.filter(p => !p.modifiers || p.modifiers.length === 0);
    prodId1 = simpleProducts[0].id;
    prodId2 = simpleProducts[1].id;
  });

  it('permite dividir cuentas sin cerrar la mesa prematuramente', async () => {
    // Creamos 2 comandas para Mesa 5
    const o1 = await demoApi.createOrder({
      slug: SLUG,
      tableToken: TABLE_TOKEN,
      items: [{ productId: prodId1, quantity: 1 }]
    });
    const o2 = await demoApi.createOrder({
      slug: SLUG,
      tableToken: TABLE_TOKEN,
      items: [{ productId: prodId2, quantity: 1 }]
    });

    // Pasamos comanda 1 a caja
    for (const status of ['En Preparación', 'Listo', 'Por Cobrar']) {
      await demoApi.updateOrderStatus(o1.orderId, status);
    }

    // Cobramos solo la comanda 1
    const inv = await demoApi.issueInvoice({
      orderIds: [o1.orderId],
      kind: 'pos',
      paymentMethod: 'efectivo'
    });
    expect(inv).toBeDefined();

    // Verificamos que la mesa sigue abierta porque la comanda 2 sigue abierta
    const tableInfo = await demoApi.resolveTable(SLUG, TABLE_TOKEN);
    expect(tableInfo.isClosed).toBe(false);
  });

  it('invalida la mesa cuando se emite la factura final y no quedan órdenes abiertas', async () => {
    const o1 = await demoApi.createOrder({
      slug: SLUG,
      tableToken: TABLE_TOKEN,
      items: [{ productId: prodId1, quantity: 1 }]
    });
    const o2 = await demoApi.createOrder({
      slug: SLUG,
      tableToken: TABLE_TOKEN,
      items: [{ productId: prodId2, quantity: 1 }]
    });

    for (const status of ['En Preparación', 'Listo', 'Por Cobrar']) {
      await demoApi.updateOrderStatus(o1.orderId, status);
      await demoApi.updateOrderStatus(o2.orderId, status);
    }

    // Cobramos ambas comandas de Mesa 5
    await demoApi.issueInvoice({
      orderIds: [o1.orderId, o2.orderId],
      kind: 'pos',
      paymentMethod: 'efectivo'
    });

    // Ahora la mesa ya no tiene comandas pendientes: está liberada/cerrada
    const tableInfo = await demoApi.resolveTable(SLUG, TABLE_TOKEN);
    expect(tableInfo.isClosed).toBe(true);

    // Si el usuario intenta enviar un pedido desde su casa con esa mesa cerrada, el servidor lo rechaza
    await expect(
      demoApi.createOrder({
        slug: SLUG,
        tableToken: TABLE_TOKEN,
        items: [{ productId: prodId1, quantity: 1 }]
      })
    ).rejects.toThrow(/Esta cuenta ya fue cerrada y la mesa fue liberada/);
  });

  it('muestra la pantalla amigable de cuenta finalizada cuando la mesa fue cerrada', async () => {
    const o1 = await demoApi.createOrder({
      slug: SLUG,
      tableToken: TABLE_TOKEN,
      items: [{ productId: prodId1, quantity: 1 }]
    });

    for (const status of ['En Preparación', 'Listo', 'Por Cobrar']) {
      await demoApi.updateOrderStatus(o1.orderId, status);
    }

    // Cerramos la mesa en caja
    await demoApi.issueInvoice({
      orderIds: [o1.orderId],
      kind: 'pos',
      paymentMethod: 'efectivo'
    });

    // El comensal abre su pestaña
    renderAt(`/r/${SLUG}/m/${TABLE_TOKEN}`);
    expect(await screen.findByText('¡Cuenta finalizada!')).toBeInTheDocument();
    expect(screen.getByText(/La cuenta de la/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Iniciar nueva orden/ })).toBeInTheDocument();
  });

  it('muestra aviso amigable de Modo Consulta cuando se entra sin mesa', async () => {
    renderAt(`/r/${SLUG}`);
    expect(await screen.findByText('Modo Consulta (Sin mesa asignada)')).toBeInTheDocument();
    expect(screen.getByText(/Para que tus pedidos lleguen a cocina/)).toBeInTheDocument();
  });
});
