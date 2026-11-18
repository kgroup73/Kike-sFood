/**
 * Ejecuta una actualización de interfaz con View Transitions API nativa si el navegador la soporta.
 * Si no está soportada (o el usuario tiene prefers-reduced-motion activo), ejecuta el callback directamente.
 */
export function startViewTransition(updateCallback) {
  if (
    typeof document !== 'undefined' &&
    'startViewTransition' in document &&
    typeof document.startViewTransition === 'function' &&
    !window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  ) {
    return document.startViewTransition(updateCallback);
  }
  updateCallback();
}
