import { History, ArrowDownRight, ArrowUpRight, RefreshCw } from 'lucide-react';
import Modal from '../../ui/Modal';
import { MOVEMENT_TYPES, formatEventTimestamp } from '../../../lib/inventory';
import { formatCOP } from '../../../lib/money';

export default function MovementsHistoryModal({ movements = [], ingredient = null, onClose }) {
  const filtered = ingredient
    ? movements.filter((m) => m.ingredientKey === ingredient.key)
    : movements;

  return (
    <Modal
      title={ingredient ? `Historial de movimientos: ${ingredient.name}` : 'Historial de movimientos'}
      icon={<History />}
      onClose={onClose}
      size="lg"
    >
      <div className="space-y-4">
        {filtered.length ? (
          <div className="surface divide-y divide-linea overflow-hidden max-h-[60vh] overflow-y-auto">
            {filtered.map((m) => {
              const info = MOVEMENT_TYPES[m.type] || { label: m.type, tone: 'text-tinta', sign: '' };
              const isPositive = m.type === 'ENTRADA';
              const isNegative = m.type === 'MERMA' || m.type === 'SALIDA';
              const Icon = isPositive ? ArrowUpRight : isNegative ? ArrowDownRight : RefreshCw;

              return (
                <div key={m.id} className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:bg-mantel/40 transition-colors">
                  <div className="flex items-start gap-3 min-w-0">
                    <span className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                      isPositive ? 'bg-hoja/10 text-hoja' : isNegative ? 'bg-aji/10 text-aji' : 'bg-maracuya/20 text-maracuya-tinta'
                    }`}>
                      <Icon className="w-4 h-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="font-bold text-base leading-tight truncate">
                        {!ingredient && <span className="text-tinta mr-1.5">{m.ingredientName}:</span>}
                        <span className={info.tone}>{info.label}</span>
                      </p>
                      <p className="text-xs text-suave mt-0.5">
                        {formatEventTimestamp(m.createdAt)} {m.createdBy ? `· por ${m.createdBy}` : ''}
                      </p>
                      {(m.supplier || m.invoiceRef || m.note) && (
                        <p className="text-xs text-suave mt-1">
                          {m.supplier && <span className="font-semibold text-tinta mr-2">Prov: {m.supplier}</span>}
                          {m.invoiceRef && <span className="mr-2">Doc: {m.invoiceRef}</span>}
                          {m.note && <span>“{m.note}”</span>}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="text-right shrink-0 self-end sm:self-center">
                    <p className={`precio font-bold text-lg leading-tight ${info.tone}`}>
                      {info.sign}{m.quantity}
                    </p>
                    <p className="text-xs text-suave">
                      {m.previousStock} → <span className="font-bold text-tinta">{m.newStock}</span>
                    </p>
                    {m.cost > 0 && (
                      <p className="text-xs text-hoja font-semibold mt-0.5">{formatCOP(m.cost)}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-12 px-6 text-center text-suave border-2 border-dashed border-linea rounded-3xl space-y-2">
            <History className="w-8 h-8 mx-auto text-suave/60" />
            <p className="font-bold text-tinta">No hay movimientos registrados</p>
            <p className="text-sm">Registra entradas o ajustes de existencias para ver su historial aquí.</p>
          </div>
        )}

        <div className="flex justify-end pt-2">
          <button type="button" onClick={onClose} className="btn btn-quiet">
            Cerrar
          </button>
        </div>
      </div>
    </Modal>
  );
}
