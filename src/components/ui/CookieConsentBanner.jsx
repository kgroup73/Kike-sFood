import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Cookie, X } from 'lucide-react';

const CONSENT_STORAGE_KEY = 'kikes_cookie_consent';

export default function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const consent = localStorage.getItem(CONSENT_STORAGE_KEY);
      if (!consent) {
        // Leve retraso para no bloquear la carga inicial y animar suavemente
        const timer = setTimeout(() => setVisible(true), 800);
        return () => clearTimeout(timer);
      }
    } catch {
      // Si localStorage está bloqueado o inaccesible, no mostramos el banner
      setVisible(false);
    }
  }, []);

  const handleAccept = () => {
    try {
      localStorage.setItem(CONSENT_STORAGE_KEY, 'accepted');
    } catch {
      // Ignorar fallo de almacenamiento
    }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <aside
      role="region"
      aria-label="Aviso de cookies y almacenamiento local"
      className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-50 p-4 sm:p-5 rounded-2xl bg-plato/95 backdrop-blur-md border border-linea shadow-xl text-tinta"
    >
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-xl bg-hoja/10 text-hoja shrink-0 mt-0.5">
          <Cookie className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h4 className="font-display font-bold text-sm text-tinta">
              Almacenamiento local y privacidad
            </h4>
            <button
              onClick={handleAccept}
              className="text-suave hover:text-tinta p-1 rounded-lg hover:bg-mantel transition-colors"
              aria-label="Cerrar aviso"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="mt-1 text-xs text-suave leading-relaxed">
            Usamos almacenamiento técnico en tu navegador para recordar tu mesa, pedido y preferencias. Sin rastreadores de publicidad ni cookies invasivas.
          </p>
          <div className="mt-3 flex items-center gap-3">
            <button
              type="button"
              onClick={handleAccept}
              className="btn btn-primary text-xs py-1.5 px-3.5"
            >
              Entendido
            </button>
            <Link
              to="/cookies"
              className="text-xs font-semibold text-hoja hover:underline"
            >
              Ver política
            </Link>
          </div>
        </div>
      </div>
    </aside>
  );
}
