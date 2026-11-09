import { Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export function LoadingScreen({ label = 'Cargando…' }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-3 text-suave" role="status">
      <Loader2 className="w-6 h-6 animate-spin text-hoja" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}

export function ErrorScreen({ title = 'Algo salió mal', message, action }) {
  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-sm w-full space-y-3">
        <h1 className="page-title">{title}</h1>
        {message && <p className="text-suave leading-relaxed">{message}</p>}
        <div className="pt-2">
          {action || (
            <Link to="/" className="btn btn-quiet">
              Ir al inicio
            </Link>
          )}
        </div>
      </div>
    </main>
  );
}

export function InlineError({ message, onRetry }) {
  return (
    <div className="border-l-4 border-aji bg-aji/5 rounded-r-xl px-4 py-3 flex items-center justify-between gap-3" role="alert">
      <span className="text-aji font-bold">{message}</span>
      {onRetry && (
        <button onClick={onRetry} className="btn btn-sm btn-quiet shrink-0">
          Reintentar
        </button>
      )}
    </div>
  );
}
