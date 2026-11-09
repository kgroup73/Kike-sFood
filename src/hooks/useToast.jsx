import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Info, AlertTriangle, CheckCircle2 } from 'lucide-react';

const ToastContext = createContext(() => {});

const TONES = {
  info: { icon: Info, className: 'bg-tinta text-mantel', iconClass: 'text-mantel/70' },
  success: { icon: CheckCircle2, className: 'bg-tinta text-mantel', iconClass: 'text-[#9ED9AE]' },
  error: { icon: AlertTriangle, className: 'bg-aji text-white', iconClass: 'text-white' }
};

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);
  const timer = useRef(null);

  const showToast = useCallback((message, tone = 'info') => {
    clearTimeout(timer.current);
    setToast({ message, tone, key: Date.now() });
    timer.current = setTimeout(() => setToast(null), tone === 'error' ? 6000 : 3500);
  }, []);

  useEffect(() => () => clearTimeout(timer.current), []);

  const meta = TONES[toast?.tone] || TONES.info;
  const Icon = meta.icon;

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      <div aria-live="polite" role="status" className="pointer-events-none">
        {toast && (
          <div
            key={toast.key}
            className={`fixed bottom-24 sm:bottom-8 left-1/2 -translate-x-1/2 z-[60] ${meta.className} text-[15px] pl-4 pr-5 py-3 rounded-2xl shadow-[0_8px_30px_rgb(30_43_36/0.25)] flex items-start gap-2.5 w-max max-w-[92vw] sm:max-w-md animate-sheet`}
          >
            <Icon className={`w-5 h-5 shrink-0 ${meta.iconClass}`} aria-hidden="true" />
            <span className="font-bold leading-snug">{toast.message}</span>
          </div>
        )}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
