import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, cleanup, fireEvent, act } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import TermsPage from '../pages/legal/TermsPage';
import PrivacyPage from '../pages/legal/PrivacyPage';
import CookiesPage from '../pages/legal/CookiesPage';
import CookieConsentBanner from '../components/ui/CookieConsentBanner';
import HomePage from '../pages/HomePage';

describe('Páginas Legales y Cumplimiento Normativo', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useRealTimers();
    window.scrollTo = vi.fn();
  });

  afterEach(() => {
    cleanup();
    localStorage.clear();
  });

  it('renderiza la página de Términos y Condiciones con las garantías de ley', () => {
    render(
      <MemoryRouter initialEntries={['/terminos']}>
        <Routes>
          <Route path="/terminos" element={<TermsPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(
      screen.getByRole('heading', { level: 1, name: 'Términos y Condiciones de Uso' })
    ).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: /Deslinde Expreso de Responsabilidad/i })).toBeInTheDocument();
    expect(screen.getAllByText(/Ley 1480 de 2011/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Ley 1935 de 2018/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/República de Colombia/i).length).toBeGreaterThan(0);
    expect(screen.getByRole('link', { name: /Inicio/i })).toHaveAttribute('href', '/');
  });

  it('renderiza la página de Política de Privacidad y Habeas Data (Ley 1581)', () => {
    render(
      <MemoryRouter initialEntries={['/privacidad']}>
        <Routes>
          <Route path="/privacidad" element={<PrivacyPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(
      screen.getByRole('heading', { level: 1, name: 'Política de Tratamiento de Datos Personales' })
    ).toBeInTheDocument();
    expect(screen.getAllByText(/Ley Estatutaria 1581 de 2012/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Encargado del Tratamiento/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Responsable del Tratamiento/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Habeas Data/i).length).toBeGreaterThan(0);
  });

  it('renderiza la página de Cookies y Almacenamiento Local explicando las llaves técnicas', () => {
    render(
      <MemoryRouter initialEntries={['/cookies']}>
        <Routes>
          <Route path="/cookies" element={<CookiesPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(
      screen.getByRole('heading', { level: 1, name: 'Política de Cookies y Almacenamiento Local' })
    ).toBeInTheDocument();
    expect(screen.getByText('kikes_cookie_consent')).toBeInTheDocument();
    expect(screen.getByText(/Compromiso de Privacidad Cero Rastreo/i)).toBeInTheDocument();
  });

  it('el banner de consentimiento de cookies aparece si no ha sido aceptado y se oculta al pulsar Entendido', async () => {
    vi.useFakeTimers();

    render(
      <MemoryRouter>
        <CookieConsentBanner />
      </MemoryRouter>
    );

    // Avanzamos el timer para la aparición suave del banner
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    const heading = screen.getByRole('heading', { level: 4, name: /Almacenamiento local y privacidad/i });
    expect(heading).toBeInTheDocument();

    const acceptBtn = screen.getByRole('button', { name: 'Entendido' });
    fireEvent.click(acceptBtn);

    expect(localStorage.getItem('kikes_cookie_consent')).toBe('accepted');
    expect(screen.queryByRole('heading', { level: 4, name: /Almacenamiento local y privacidad/i })).toBeNull();
  });

  it('el banner de cookies no se muestra si ya fue aceptado previamente', () => {
    localStorage.setItem('kikes_cookie_consent', 'accepted');
    vi.useFakeTimers();

    render(
      <MemoryRouter>
        <CookieConsentBanner />
      </MemoryRouter>
    );

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(screen.queryByRole('heading', { level: 4, name: /Almacenamiento local y privacidad/i })).toBeNull();
  });

  it('el footer del home contiene los enlaces a las páginas legales en la columna respectiva', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<HomePage />} />
        </Routes>
      </MemoryRouter>
    );

    const terminosLink = screen.getByRole('link', { name: 'Términos y condiciones' });
    const privacidadLink = screen.getByRole('link', { name: 'Política de privacidad' });
    const cookiesLink = screen.getByRole('link', { name: 'Cookies y almacenamiento' });

    expect(terminosLink).toHaveAttribute('href', '/terminos');
    expect(privacidadLink).toHaveAttribute('href', '/privacidad');
    expect(cookiesLink).toHaveAttribute('href', '/cookies');
    expect(screen.getByText(/Propinas voluntarias: Ley 1935\/2018/i)).toBeInTheDocument();
    expect(screen.getByText(/1123637665-1/)).toBeInTheDocument();
    expect(screen.getByText(/51373/)).toBeInTheDocument();
  });
});
