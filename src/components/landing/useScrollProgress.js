import { useEffect } from 'react';

const reducedMotion = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/**
 * Escribe en el elemento la variable CSS `--p`, de 0 a 1, según cuánto ha avanzado por la
 * pantalla al desplazarse. `start` y `end` son posiciones del borde superior del elemento,
 * en fracciones del alto de la ventana: con start = 1 y end = 0.35, `--p` vale 0 cuando el
 * elemento asoma por abajo y 1 cuando su borde superior llega al 35 % de la pantalla.
 * No re-renderiza: solo cambia la variable, y solo mientras el elemento está a la vista.
 * Con `--p` ≥ 0.9 agrega la clase `is-done`, para lo que entra al final.
 * Con "reducir movimiento" o sin IntersectionObserver queda fija en 1 (estado final).
 */
export function useScrollProgress(ref, { start = 1, end = 0.35 } = {}) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    if (reducedMotion() || typeof IntersectionObserver === 'undefined') {
      el.style.setProperty('--p', '1');
      el.classList.add('is-done');
      return undefined;
    }
    let frame = 0;
    const update = () => {
      frame = 0;
      const vh = window.innerHeight || 1;
      const top = el.getBoundingClientRect().top;
      const p = (start * vh - top) / ((start - end) * vh);
      const v = Math.min(1, Math.max(0, p));
      el.style.setProperty('--p', v.toFixed(3));
      el.classList.toggle('is-done', v >= 0.9);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', onScroll);
        update();
      } else {
        window.removeEventListener('scroll', onScroll);
        window.removeEventListener('resize', onScroll);
        update(); // queda en 0 o en 1 según salió por abajo o por arriba
      }
    });
    io.observe(el);
    update();
    return () => {
      io.disconnect();
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [ref, start, end]);
}
