import { Link } from 'react-router-dom';
import Sheet from './Sheet';
import { isDemoMode } from '../../services/api';
import { demoTableToken } from '../../services/demo/demoApi';
import { DEMO_TABLE_COUNT } from '../../services/demo/seedData';

/**
 * Para pedir hay que entrar con el enlace de la mesa (QR/NFC), que lleva un token
 * secreto validado en el servidor.
 */
export default function TableRequiredModal({ slug, reason, onClose }) {
  return (
    <Sheet title="Escanea el código de tu mesa" onClose={onClose} size="sm">
      <p className="-mt-2 leading-relaxed">
        {reason || 'Para enviar tu pedido a la cocina, escanea el código QR o acerca tu celular a la etiqueta NFC de tu mesa.'}
      </p>
      {isDemoMode && (
        <div className="space-y-2">
          <p className="text-sm text-suave">Modo demostración: elige una mesa.</p>
          <div className="grid grid-cols-4 gap-2">
            {Array.from({ length: DEMO_TABLE_COUNT }, (_, i) => (
              <Link
                key={i}
                to={`/r/${slug}/m/${demoTableToken(i + 1)}`}
                onClick={onClose}
                className="h-11 rounded-xl border border-linea flex items-center justify-center font-bold hover:border-tinta"
              >
                {i + 1}
              </Link>
            ))}
          </div>
        </div>
      )}
      <button onClick={onClose} className="w-full h-11 rounded-full border border-tinta font-bold">
        Seguir viendo la carta
      </button>
    </Sheet>
  );
}
