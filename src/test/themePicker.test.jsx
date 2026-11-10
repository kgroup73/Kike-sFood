import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import ThemePicker from '../components/ui/ThemePicker';
import { THEME_KEY } from '../hooks/useTheme';
import { THEMES } from '../lib/themes';

describe('selector de temas', () => {
  afterEach(cleanup);

  it('aplica el tema en <html>, lo guarda y vuelve al por defecto sin atributo', () => {
    render(<ThemePicker />);
    fireEvent.click(screen.getByRole('button', { name: 'Cambiar tema de color' }));
    expect(screen.getAllByRole('button', { pressed: false })).toHaveLength(THEMES.length - 1);

    fireEvent.click(screen.getByRole('button', { name: /Grafito/ }));
    expect(document.documentElement.dataset.tema).toBe('grafito');
    expect(localStorage.getItem(THEME_KEY)).toBe('grafito');
    expect(screen.getByRole('button', { name: /Grafito/ })).toHaveAttribute('aria-pressed', 'true');

    fireEvent.click(screen.getByRole('button', { name: /Mantel verde/ }));
    expect(document.documentElement.dataset.tema).toBeUndefined();
    expect(localStorage.getItem(THEME_KEY)).toBe('hoja');
  });

  it('se cierra con Escape', () => {
    render(<ThemePicker />);
    fireEvent.click(screen.getByRole('button', { name: 'Cambiar tema de color' }));
    expect(screen.getByRole('dialog', { name: 'Tema de color' })).toBeInTheDocument();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
