import { useEffect, useRef, useState } from 'react';
import { Palette, X, Check } from 'lucide-react';
import { THEMES, THEME_GROUPS } from '../../lib/themes';
import { useTheme } from '../../hooks/useTheme';

/**
 * Selector de temas para probar fondos y paletas. Pestaña fija en el borde
 * derecho (no tapa el encabezado ni la barra inferior de la carta).
 * El tema se guarda en este navegador.
 */
export default function ThemePicker() {
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const panelRef = useRef(null);
  const toggleRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setOpen(false);
        toggleRef.current?.focus();
      }
    };
    const onPointer = (e) => {
      if (!panelRef.current?.contains(e.target) && !toggleRef.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onPointer);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onPointer);
    };
  }, [open]);

  return (
    <div className="print-hidden">
      <button
        ref={toggleRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls="selector-tema"
        aria-label="Cambiar tema de color"
        title="Cambiar tema de color"
        className="fixed right-0 top-1/2 -translate-y-1/2 z-[45] flex flex-col items-center gap-1.5 py-3 px-2 rounded-l-2xl bg-tinta text-mantel shadow-lg hover:pr-3 transition-[padding]"
      >
        <Palette className="w-5 h-5" aria-hidden="true" />
        <span className="text-xs font-bold [writing-mode:vertical-rl] rotate-180">Tema</span>
      </button>

      {open && (
        <div
          ref={panelRef}
          id="selector-tema"
          role="dialog"
          aria-label="Tema de color"
          className="fixed z-[46] right-3 sm:right-14 top-1/2 -translate-y-1/2 w-[min(22rem,calc(100vw-1.5rem))] max-h-[85vh] overflow-y-auto surface shadow-2xl p-4 animate-fadeIn"
        >
          <div className="flex items-start justify-between gap-2 mb-1">
            <h2 className="block-title">Tema de color</h2>
            <button type="button" onClick={() => setOpen(false)} aria-label="Cerrar" className="icon-btn -mr-2 -mt-2">
              <X className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>
          <p className="text-sm text-suave mb-4">Se aplica a toda la app y se guarda en este navegador.</p>

          {THEME_GROUPS.map((group) => (
            <section key={group} className="mb-4 last:mb-0">
              <h3 className="text-xs font-bold uppercase tracking-wider text-suave mb-2">{group}</h3>
              <ul className="grid grid-cols-2 gap-2">
                {THEMES.filter((t) => t.group === group).map((t) => {
                  const active = t.id === theme;
                  return (
                    <li key={t.id}>
                      <button
                        type="button"
                        onClick={() => setTheme(t.id)}
                        aria-pressed={active}
                        className={`w-full text-left rounded-xl border p-2 transition-colors ${
                          active ? 'border-hoja ring-2 ring-hoja/30' : 'border-linea hover:border-tinta'
                        }`}
                      >
                        <ThemeSwatch colors={t.swatch} />
                        <span className="mt-2 flex items-center gap-1 font-bold text-sm leading-tight">
                          {active && <Check className="w-4 h-4 text-hoja shrink-0" aria-hidden="true" />}
                          {t.name}
                        </span>
                        <span className="block text-xs text-suave leading-snug">{t.note}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

/** Miniatura del tema: fondo, una tarjeta con texto y un botón de acento. */
function ThemeSwatch({ colors: [bg, surface, accent, text] }) {
  return (
    <span className="block h-14 rounded-lg p-1.5 border border-black/10" style={{ background: bg }} aria-hidden="true">
      <span className="flex h-full rounded-md p-1.5 gap-1.5 items-end" style={{ background: surface }}>
        <span className="flex-1 space-y-1">
          <span className="block h-1.5 w-3/4 rounded-full" style={{ background: text }} />
          <span className="block h-1.5 w-1/2 rounded-full opacity-50" style={{ background: text }} />
        </span>
        <span className="h-4 w-8 rounded-full" style={{ background: accent }} />
      </span>
    </span>
  );
}
