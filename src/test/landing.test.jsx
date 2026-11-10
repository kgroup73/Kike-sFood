import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom';
import HomePage from '../pages/HomePage';

function Donde() {
  return <p data-testid="donde">{useLocation().pathname}</p>;
}

function renderHome(path = '/') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="*" element={<Donde />} />
      </Routes>
    </MemoryRouter>
  );
}

describe('landing (modo demo)', () => {
  afterEach(cleanup);

  it('presenta el producto y lleva a la carta y al panel de la demo', () => {
    renderHome();
    expect(screen.getByRole('heading', { level: 1, name: 'De la mesa a la cocina, sin papel.' })).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: 'Abrir la carta de la Mesa 4' })[0]).toHaveAttribute('href', '/r/la-trattoria/m/demo-mesa-4');
    expect(screen.getAllByRole('link', { name: /^Entrar como personal/ })[0]).toHaveAttribute('href', '/staff/la-trattoria/login');
    // Los nombres de los planes salen de lib/plans; el detalle y el orden son del landing
    expect(screen.getByText('Plan 2 · Intermedio')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3, name: 'La mesa pide y la cocina recibe.' })).toBeInTheDocument();
    expect(screen.getByText('Llamado al mesero en el panel del personal')).toBeInTheDocument();
    expect(screen.getByText('Cocina en pantalla, o comandas impresas solas')).toBeInTheDocument();
    // Las maquetas no se anuncian como contenido: una imagen con su descripción por cada una
    expect(screen.getByRole('img', { name: /Tres pantallas/ })).toBeInTheDocument();
    expect(screen.getAllByRole('img', { name: /en el panel de/ })).toHaveLength(3);
    expect(screen.getByText('¿La factura electrónica ya está conectada con la DIAN?')).toBeInTheDocument();
  });

  it('sin IntersectionObserver todas las secciones quedan visibles', () => {
    renderHome();
    expect(document.querySelectorAll('.reveal')).not.toHaveLength(0);
    expect(document.querySelectorAll('.reveal:not(.reveal-in)')).toHaveLength(0);
    // Las maquetas que se inclinan al bajar quedan derechas y con su contenido a la vista
    expect(document.querySelectorAll('.tilt-in')).toHaveLength(3);
    expect(document.querySelectorAll('.tilt-in:not(.is-done)')).toHaveLength(0);
    expect(screen.getByText('¿Necesito una pantalla en la cocina?')).toBeInTheDocument();
  });

  it('los enlaces antiguos (?r=) redirigen a la carta del restaurante', async () => {
    renderHome('/?r=La%20Trattoria');
    expect(await screen.findByTestId('donde')).toHaveTextContent('/r/la-trattoria');
  });
});
