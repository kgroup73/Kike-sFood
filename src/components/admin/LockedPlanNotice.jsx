import { Lock } from 'lucide-react';
import { requiredPlanFor } from '../../lib/plans';

const FEATURE_NAMES = { kitchen: 'Cocina KDS', pos: 'Caja POS', inventory: 'Inventario', dian: 'Facturación electrónica', ordering: 'Pedidos desde la mesa' };

export default function LockedPlanNotice({ feature }) {
  const name = FEATURE_NAMES[feature] || feature;
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center space-y-2.5 max-w-xl mx-auto shadow-xl">
      <div className="w-12 h-12 mx-auto rounded-xl bg-slate-800/70 text-slate-400 flex items-center justify-center border border-slate-700">
        <Lock className="w-5 h-5" aria-hidden="true" />
      </div>
      <h3 className="text-sm sm:text-base font-bold text-white">Módulo {name} no incluido</h3>
      <p className="text-xs text-slate-400 leading-relaxed">
        Disponible desde el plan <span className="text-violet-300 font-bold">{requiredPlanFor(feature)}</span>.
        Contacta a soporte de Kike's para cambiar el plan del restaurante.
      </p>
    </div>
  );
}
