import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import TablesAdmin from '../components/admin/TablesAdmin';

afterEach(() => {
  cleanup();
});

// Mock de hooks y servicios
vi.mock('../hooks/useTenant', () => ({
  useTenant: () => ({ tenant: { id: 'tenant-1', slug: 'la-trattoria', name: 'La Trattoria' } })
}));

vi.mock('../hooks/useToast', () => ({
  useToast: () => vi.fn()
}));

vi.mock('../hooks/useFloorPlan', () => ({
  useFloorPlan: () => ({
    environments: [
      { id: 'salon', name: 'Salón Principal' },
      { id: 'terraza', name: 'Terraza' }
    ],
    layoutOf: () => ({ zone: 'salon' }),
    addEnvironment: vi.fn(),
    saveLayout: vi.fn()
  })
}));

vi.mock('../services/api', () => ({
  api: {
    listTables: vi.fn().mockResolvedValue([
      { id: 't-1', label: '1', token: 'tok-1', isActive: true },
      { id: 't-2', label: '2', token: 'tok-2', isActive: true },
      { id: 't-3', label: '3', token: 'tok-3', isActive: false }
    ]),
    createTables: vi.fn().mockResolvedValue([]),
    updateTable: vi.fn().mockResolvedValue({}),
    deleteTable: vi.fn().mockResolvedValue({})
  }
}));

describe('TablesAdmin (Desacoplado y Modular)', () => {
  it('renderiza la cabecera de ambientes y las mesas activas', async () => {
    render(
      <MemoryRouter>
        <TablesAdmin />
      </MemoryRouter>
    );

    expect(screen.getByText(/Mesas, tags NFC y códigos QR/i)).toBeInTheDocument();
    expect(screen.getByText(/Gestión de Ambientes & Mesas/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Salón Principal/i).length).toBeGreaterThan(0);
    expect(await screen.findByText('Mesa 1')).toBeInTheDocument();
    expect(await screen.findByText('Mesa 2')).toBeInTheDocument();
  });

  it('muestra los botones de acción en cada tarjeta de mesa', async () => {
    render(
      <MemoryRouter>
        <TablesAdmin />
      </MemoryRouter>
    );

    expect(await screen.findByText('Mesa 1')).toBeInTheDocument();
    const copyButtons = screen.getAllByRole('button', { name: /Copiar/i });
    expect(copyButtons.length).toBeGreaterThan(0);
  });
});
