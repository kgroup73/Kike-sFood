import { Link } from 'react-router-dom';
import { Smartphone } from 'lucide-react';
import Modal from '../ui/Modal';
import { isDemoMode } from '../../services/api';
import { demoTableToken } from '../../services/demo/demoApi';
import { DEMO_TABLE_COUNT } from '../../services/demo/seedData';

/**
 * Reemplaza la antigua "validación GPS" simulada: para pedir hay que entrar con
 * el enlace de la mesa (QR/NFC), que lleva un token secreto validado en el servidor.
 */
export default function TableRequiredModal({ slug, reason, onClose }) {
  return (
    <Modal title="Vincula tu mesa" icon={<Smartphone className="w-5 h-5 text-brand-gold-light" />} onClose={onClose} size="sm">
      <p className="text-xs text-slate-300 leading-relaxed">
        {reason || 'Para enviar tu pedido a la cocina, escanea el código QR o acerca tu celular a la etiqueta NFC de tu mesa.'}
      </p>
      {isDemoMode && (
        <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 space-y-2">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Demo: elige una mesa</span>
          <div className="grid grid-cols-4 gap-1.5">
            {Array.from({ length: DEMO_TABLE_COUNT }, (_, i) => (
              <Link
                key={i}
                to={`/r/${slug}/m/${demoTableToken(i + 1)}`}
                onClick={onClose}
                className="py-2 rounded-xl text-xs font-bold text-center bg-slate-800 hover:bg-slate-700 text-slate-200"
              >
                Mesa {i + 1}
              </Link>
            ))}
          </div>
        </div>
      )}
      <button onClick={onClose} className="w-full py-2 text-xs font-bold text-slate-400 hover:text-white">
        Seguir viendo la carta
      </button>
    </Modal>
  );
}
