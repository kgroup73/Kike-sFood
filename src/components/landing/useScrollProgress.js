import { useEffect } from 'react';

const reducedMotion = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/** Fracción del camino que recorre `--p` hacia su destino en cada frame (suaviza los saltos de la rueda). */
const EASE = 0.16;

/**
 * Escribe la variable CSS `--p`, de 0 a 1, según cuánto ha avanzado el elemento por la
 * pantalla al desplazarse. `start` y `end` son posiciones del borde superior del elemento,
 * en fracciones del alto de la ventana: con start = 1 y end = 0.35, `--p` vale 0 cuando el
 * elemento asoma por abajo y 1 cuando su borde superior llega al 35 % de la pantalla.
 *
 * `targets` (selector, opcional): la variable se escribe solo en esos descendientes y no en
 * el elemento. `--p` está registrada sin herencia (ver src/index.css), así que cambiarla no
 * obliga a recalcular el estilo de todo lo que hay dentro de las maquetas.
 *
 * El valor no salta con cada golpe de la rueda: se acerca al destino frame a frame.
 * No re-renderiza y solo trabaja mientras el elemento está a la vista.
 * Con `--p` ≥ 0.9 agrega al elemento la clase `is-done`, para lo que entra al final.
 * Con "reducir movimiento" o sin IntersectionObserver queda fija en 1 (estado final).
 */
export function useScrollProgress(ref, { start = 1, end = 0.35, targets = null } = {}) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const nodes = targets ? Array.from(el.querySelectorAll(targets)) : [el];
    const write = (v) => {
      const s = v.toFixed(4);
      for (const n of nodes) n.style.setProperty('--p', s);
      el.classList.toggle('is-done', v >= 0.9);
    };
    if (reducedMotion() || typeof IntersectionObserver === 'undefined') {
      write(1);
      return undefined;
    }

    const measure = () => {
      const vh = window.innerHeight || 1;
      const top = el.getBoundingClientRect().top;
      return Math.min(1, Math.max(0, (start * vh - top) / ((start - end) * vh)));
    };

    let frame = 0;
    let current = measure();
    let visible = false;
    const tick = () => {
      frame = 0;
      const target = measure();
      const diff = target - current;
      current = Math.abs(diff) < 0.0015 ? target : current + diff * EASE;
      write(current);
      if (current !== target && visible) frame = requestAnimationFrame(tick);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(tick);
    };
    const snap = () => {
      current = measure();
      write(current);
    };

    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) {
        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', onScroll);
        onScroll();
      } else {
        window.removeEventListener('scroll', onScroll);
        window.removeEventListener('resize', onScroll);
        cancelAnimationFrame(frame);
        frame = 0;
        snap(); // queda en 0 o en 1 según salió por abajo o por arriba
      }
    });
    io.observe(el);
    write(current);
    return () => {
      io.disconnect();
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [ref, start, end, targets]);
}
