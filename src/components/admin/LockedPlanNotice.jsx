import { Lock } from 'lucide-react';
import { requiredPlanFor } from '../../lib/plans';

const FEATURE_NAMES = { kitchen: 'Cocina y comandas', pos: 'Caja', inventory: 'Inventario', dian: 'Facturación electrónica', ordering: 'Pedidos desde la mesa', waiterCall: 'Llamado al mesero' };

export default function LockedPlanNotice({ feature }) {
  const name = FEATURE_NAMES[feature] || feature;
  return (
    <div className="max-w-lg mx-auto py-16 space-y-3">
      <Lock className="w-6 h-6 text-suave" aria-hidden="true" />
      <h2 className="page-title">{name} no está en tu plan</h2>
      <p className="text-suave leading-relaxed">
        Se activa desde el plan <strong className="text-tinta">{requiredPlanFor(feature)}</strong>. Escríbele a soporte de Kike's para cambiar el plan del restaurante.
      </p>
    </div>
  );
}
