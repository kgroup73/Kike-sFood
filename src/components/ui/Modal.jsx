import { useEffect, useId } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

/** Modal accesible del personal: cierra con Escape o tocando fuera, y anuncia su título. */
export default function Modal({ title, icon, onClose, children, size = 'md', footer }) {
  const titleId = useId();
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose?.();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const width = { sm: 'sm:max-w-sm', md: 'sm:max-w-md', lg: 'sm:max-w-2xl', xl: 'sm:max-w-4xl' }[size];
  return createPortal(
    <div
      className="fixed inset-0 z-50 bg-tinta/40 flex items-end sm:items-center justify-center sm:p-6 animate-fadeIn print:static print:bg-transparent"
      onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`bg-plato text-tinta w-full ${width} rounded-t-[28px] sm:rounded-[28px] max-h-[92vh] overflow-y-auto p-5 sm:p-6 space-y-5 animate-sheet`}
      >
        <div className="flex justify-between items-start gap-3">
          <h2 id={titleId} className="block-title flex items-center gap-2.5">
            {icon && <span className="text-hoja [&>svg]:w-5 [&>svg]:h-5 [&>svg]:text-current">{icon}</span>}
            {title}
          </h2>
          <button onClick={onClose} className="icon-btn -mr-2 -mt-1 shrink-0" aria-label="Cerrar">
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>
        {children}
        {footer}
      </div>
    </div>,
    document.body
  );
}
