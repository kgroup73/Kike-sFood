import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, cleanup, act } from '@testing-library/react';
import Reveal from '../components/landing/Reveal';

describe('Reveal (aparece al entrar en pantalla)', () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('sin IntersectionObserver se muestra de inmediato', () => {
    render(<Reveal>Hola</Reveal>);
    expect(screen.getByText('Hola')).toHaveClass('reveal-in');
  });

  it('con IntersectionObserver espera a entrar en pantalla y luego deja de observar', () => {
    let callback;
    const disconnect = vi.fn();
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        constructor(cb) {
          callback = cb;
        }
        observe() {}
        disconnect() {
          disconnect();
        }
      }
    );
    render(
      <Reveal as="section" variant="left" delay={120}>
        Tarjeta
      </Reveal>
    );
    const el = screen.getByText('Tarjeta');
    expect(el.tagName).toBe('SECTION');
    expect(el).toHaveClass('reveal', 'reveal-left');
    expect(el).not.toHaveClass('reveal-in');
    expect(el.style.transitionDelay).toBe('120ms');

    act(() => callback([{ isIntersecting: false }]));
    expect(el).not.toHaveClass('reveal-in');

    act(() => callback([{ isIntersecting: true }]));
    expect(el).toHaveClass('reveal-in');
    expect(disconnect).toHaveBeenCalled();
  });
});
