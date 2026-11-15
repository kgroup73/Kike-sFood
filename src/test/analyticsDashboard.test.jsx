import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AnalyticsDashboard from '../components/admin/AnalyticsDashboard';

afterEach(() => {
  cleanup();
});

vi.mock('../hooks/useTenant', () => ({
  useTenant: () => ({
    tenant: { id: 'tenant-1', slug: 'kikes-gourmet', name: "Kike's Gourmet", plan: 'premium' }
  })
}));

describe('AnalyticsDashboard Component (Muestreo y Comportamiento de Datos)', () => {
  it('renderiza la vista principal con KPIs acumulados y gráfico de barras por mes', async () => {
    render(
      <MemoryRouter>
        <AnalyticsDashboard />
      </MemoryRouter>
    );

    // Encabezado
    expect(screen.getByText('Métricas y Analítica')).toBeInTheDocument();
    expect(screen.getByText(/Datos Simulados/i)).toBeInTheDocument();

    // Esperar a que cargue la información
    await waitFor(() => {
      expect(screen.getByTestId('kpi-total-sales')).toHaveTextContent('$199.300.000');
    });

    expect(screen.getByTestId('kpi-invoice-count')).toHaveTextContent('4225');

    // Desglose de medios de pago
    expect(screen.getByText('Tarjeta Débito / Crédito')).toBeInTheDocument();
    expect(screen.getByText('Efectivo en Caja')).toBeInTheDocument();
    expect(screen.getByText(/Transferencia/)).toBeInTheDocument();

    // Top platillos más vendidos
    expect(screen.getByText('Hamburguesa Suprema')).toBeInTheDocument();
    expect(screen.getByText('Tacos de Camarón al Pastor')).toBeInTheDocument();
  });

  it('permite cambiar el periodo a semanas y días recalculando las métricas', async () => {
    render(
      <MemoryRouter>
        <AnalyticsDashboard />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('kpi-total-sales')).toHaveTextContent('$199.300.000');
    });

    // Cambiar a Semanas
    const weekBtn = screen.getByRole('button', { name: /Por Semana/i });
    fireEvent.click(weekBtn);

    await waitFor(() => {
      // 8.45M + 9.12M + 9.85M + 10.45M = $37.870.000
      expect(screen.getByTestId('kpi-total-sales')).toHaveTextContent('$37.870.000');
      expect(screen.getByText('Sem 44, 2026')).toBeInTheDocument();
    });

    // Cambiar a Días
    const dayBtn = screen.getByRole('button', { name: /Por Día/i });
    fireEvent.click(dayBtn);

    await waitFor(() => {
      // 1.12M + 0.89M + 1.35M + 1.62M + 1.98M + 2.45M + 2.89M = $12.300.000
      expect(screen.getByTestId('kpi-total-sales')).toHaveTextContent('$12.300.000');
      expect(screen.getByText('2026-11-14')).toBeInTheDocument();
    });
  });

  it('muestra la pestaña de inventario con alertas de stock crítico y costo de mermas', async () => {
    render(
      <MemoryRouter>
        <AnalyticsDashboard />
      </MemoryRouter>
    );

    // Cambiar a pestaña de Inventario
    const invTab = screen.getByRole('button', { name: /Inventario y Mermas/i });
    fireEvent.click(invTab);

    // Esperar a que carguen los insumos
    await waitFor(() => {
      expect(screen.getByTestId('crit-stock-count')).toHaveTextContent('3 insumos');
    });

    expect(screen.getByText('Carne Angus Molida')).toBeInTheDocument();
    expect(screen.getByText('Aguacate Hass')).toBeInTheDocument();
    expect(screen.getAllByText(/Agotándose/i).length).toBe(3);
  });

  it('muestra la pestaña de Food Cost & Rentabilidad con márgenes y semáforo de costo', async () => {
    render(
      <MemoryRouter>
        <AnalyticsDashboard />
      </MemoryRouter>
    );

    // Cambiar a pestaña de Escandallos
    const foodTab = screen.getByRole('button', { name: /Food Cost & Rentabilidad/i });
    fireEvent.click(foodTab);

    await waitFor(() => {
      expect(screen.getByText('Matriz de Escandallos y Food Cost %')).toBeInTheDocument();
      expect(screen.getByText('30.0% FC')).toBeInTheDocument();
    });

    // Verifica que se muestre el plato con su margen bruto
    expect(screen.getByText('$23.800')).toBeInTheDocument(); // Margen bruto de la Hamburguesa Suprema
    expect(screen.getByText('Pizza Margherita Artesanal')).toBeInTheDocument();
  });
});
