import { useCallback, useSyncExternalStore } from 'react';
import { DEFAULT_THEME, themeById } from '../lib/themes';

// La misma clave la lee el script de index.html para aplicar el tema antes de pintar.
export const THEME_KEY = 'kikes_tema';
const listeners = new Set();

let current = (() => {
  try {
    return themeById(localStorage.getItem(THEME_KEY)).id;
  } catch {
    return DEFAULT_THEME;
  }
})();

export function applyTheme(id) {
  const theme = themeById(id);
  const root = document.documentElement;
  // El tema por defecto no lleva atributo: así la carta conserva su modo oscuro automático.
  if (theme.id === DEFAULT_THEME) delete root.dataset.tema;
  else root.dataset.tema = theme.id;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme.swatch[0]);
}

if (typeof document !== 'undefined') applyTheme(current);

function setTheme(id) {
  current = themeById(id).id;
  try {
    localStorage.setItem(THEME_KEY, current);
  } catch {
    // sin localStorage: el tema dura hasta recargar
  }
  applyTheme(current);
  listeners.forEach((l) => l());
}

function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useTheme() {
  const theme = useSyncExternalStore(subscribe, () => current, () => current);
  return { theme, setTheme: useCallback(setTheme, []) };
}
