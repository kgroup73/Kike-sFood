import { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

/**
 * Hoja de la carta: sube desde abajo en el celular y se centra en pantallas grandes.
 * Cierra con Escape o tocando fuera, y lleva el foco al abrir.
 */
export default function Sheet({ title, hideTitle = false, onClose, children, footer, media, size = 'md' }) {
  const titleId = useId();
  const panelRef = useRef(null);

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose?.();
    window.addEventListener('keydown', onKey);
    panelRef.current?.focus();
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
    };
  }, [onClose]);

  const width = size === 'sm' ? 'sm:max-w-sm' : 'sm:max-w-lg';

  return createPortal(
    <div
      className="fixed inset-0 z-50 bg-tinta/40 flex items-end sm:items-center justify-center sm:p-6 animate-fadeIn"
      onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}
    >
      <div
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`relative bg-plato text-tinta w-full ${width} max-h-[92vh] rounded-t-[28px] sm:rounded-[28px] flex flex-col overflow-hidden animate-sheet focus:outline-none`}
      >
        <div className="overflow-y-auto overscroll-contain flex-1">
          {media}
          <div className={`px-5 sm:px-6 ${media ? 'pt-5' : 'pt-6'} pb-6 space-y-5`}>
            <div className="flex items-start justify-between gap-4">
              <h2 id={titleId} className={hideTitle ? 'sr-only' : 'font-display font-bold text-2xl leading-tight tracking-tight'}>
                {title}
              </h2>
              {!media && (
                <button
                  onClick={onClose}
                  aria-label="Cerrar"
                  className="-mr-2 -mt-1 w-10 h-10 shrink-0 rounded-full flex items-center justify-center text-suave hover:text-tinta hover:bg-mantel"
                >
                  <X className="w-5 h-5" aria-hidden="true" />
                </button>
              )}
            </div>
            {children}
          </div>
        </div>
        {footer && <div className="border-t border-linea bg-plato px-5 sm:px-6 py-4 shrink-0">{footer}</div>}
      </div>
    </div>,
    document.body
  );
}
