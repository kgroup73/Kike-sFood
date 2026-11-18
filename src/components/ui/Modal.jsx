import { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

/** Modal accesible del personal: basado en <dialog> nativo con showModal(), foco automático y top layer. */
export default function Modal({ title, icon, onClose, children, size = 'md', footer }) {
  const titleId = useId();
  const dialogRef = useRef(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (!dialog.open && typeof dialog.showModal === 'function') {
      try {
        dialog.showModal();
      } catch {
        dialog.setAttribute('open', '');
      }
    }
  }, []);

  const handleCancel = (e) => {
    e.preventDefault();
    onClose?.();
  };

  const handleMouseDown = (e) => {
    if (e.target === e.currentTarget) {
      onClose?.();
    }
  };

  const width = { sm: 'sm:max-w-sm', md: 'sm:max-w-md', lg: 'sm:max-w-2xl', xl: 'sm:max-w-4xl' }[size];
  return createPortal(
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      onCancel={handleCancel}
      onMouseDown={handleMouseDown}
      className="fixed inset-0 z-50 bg-tinta/40 backdrop:bg-tinta/40 flex items-end sm:items-center justify-center p-0 sm:p-6 w-full h-full max-w-none max-h-none border-0 text-inherit animate-fadeIn print:static print:bg-transparent"
    >
      <div
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
    </dialog>,
    document.body
  );
}
