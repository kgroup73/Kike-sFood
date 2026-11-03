import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Sparkles, AlertTriangle, CheckCircle2 } from 'lucide-react';

const ToastContext = createContext(() => {});

const TONES = {
  info: { icon: Sparkles, className: 'border-slate-700', iconClass: 'text-orange-500' },
  success: { icon: CheckCircle2, className: 'border-emerald-500/50', iconClass: 'text-emerald-400' },
  error: { icon: AlertTriangle, className: 'border-rose-500/60', iconClass: 'text-rose-400' }
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
            className={`fixed bottom-20 sm:bottom-6 left-1/2 -translate-x-1/2 z-[60] bg-slate-900 border ${meta.className} text-white text-xs px-4 py-2.5 rounded-2xl shadow-2xl flex items-start gap-2 max-w-[92vw] sm:max-w-md animate-fadeIn`}
          >
            <Icon className={`w-4 h-4 shrink-0 mt-px ${meta.iconClass}`} aria-hidden="true" />
            <span className="font-medium">{toast.message}</span>
          </div>
        )}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
