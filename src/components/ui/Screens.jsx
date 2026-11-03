import { Loader2, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';

export function LoadingScreen({ label = 'Cargando…' }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-3 text-brand-khaki text-xs" role="status">
      <Loader2 className="w-6 h-6 animate-spin text-brand-gold" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}

export function ErrorScreen({ title = 'Algo salió mal', message, action }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-sm w-full bg-brand-panel border border-brand-line rounded-3xl p-6 text-center space-y-3">
        <AlertTriangle className="w-8 h-8 mx-auto text-rose-400" aria-hidden="true" />
        <h1 className="text-base font-black text-brand-ivory">{title}</h1>
        {message && <p className="text-xs text-brand-mute leading-relaxed">{message}</p>}
        {action || (
          <Link to="/" className="inline-block text-xs font-bold text-brand-gold-light hover:underline">
            Ir al inicio
          </Link>
        )}
      </div>
    </div>
  );
}

export function InlineError({ message, onRetry }) {
  return (
    <div className="bg-rose-500/10 border border-rose-500/30 text-rose-200 text-xs rounded-2xl p-4 flex items-center justify-between gap-3" role="alert">
      <span>{message}</span>
      {onRetry && (
        <button onClick={onRetry} className="px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 font-bold shrink-0">
          Reintentar
        </button>
      )}
    </div>
  );
}
