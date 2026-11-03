import { useEffect, useId } from 'react';
import { X } from 'lucide-react';

/** Contenedor de modal accesible: cierra con Escape y anuncia su título. */
export default function Modal({ title, icon, onClose, children, size = 'md', footer }) {
  const titleId = useId();
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose?.();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const width = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-2xl', xl: 'max-w-4xl' }[size];
  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn" onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}>
      <div role="dialog" aria-modal="true" aria-labelledby={titleId} className={`bg-slate-900 border border-slate-800 rounded-3xl ${width} w-full p-5 sm:p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto hide-scrollbar`}>
        <div className="flex justify-between items-center pb-2 border-b border-slate-800 gap-3">
          <h3 id={titleId} className="text-base font-bold text-white flex items-center gap-2">
            {icon}
            {title}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1" aria-label="Cerrar">
            <X className="w-4 h-4" />
          </button>
        </div>
        {children}
        {footer}
      </div>
    </div>
  );
}
