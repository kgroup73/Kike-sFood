import { useState } from 'react';
import { ArrowUpDown, Plus, Minus, RefreshCw, ChevronDown, AlertCircle } from 'lucide-react';
import Modal from '../../ui/Modal';
import { formatQuantity } from '../../../lib/inventory';
import { primaryButton } from '../AdminShell';

const fieldClass = 'field w-full';
const labelClass = 'text-sm font-bold text-suave block mb-1.5';

export default function StockMovementModal({ ingredient, onClose, onSave }) {
  const [type, setType] = useState('ENTRADA'); // 'ENTRADA' | 'MERMA' | 'AJUSTE'
  const [quantity, setQuantity] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [supplier, setSupplier] = useState(ingredient?.supplier || '');
  const [invoiceRef, setInvoiceRef] = useState('');
  const [cost, setCost] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const prevStock = Number(ingredient?.currentStock ?? 0);
  const qtyNumber = Number(quantity) || 0;

  // Cálculo en vivo del nuevo stock
  let projectedStock = prevStock;
  if (type === 'ENTRADA') projectedStock = prevStock + Math.abs(qtyNumber);
  else if (type === 'MERMA') projectedStock = Math.max(0, prevStock - Math.abs(qtyNumber));
  else if (type === 'AJUSTE') projectedStock = Math.max(0, qtyNumber);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (qtyNumber <= 0 && type !== 'AJUSTE') {
      setError('Ingresa una cantidad mayor a cero');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSave({
        name: ingredient.name,
        type,
        quantity: Math.abs(qtyNumber),
        cost: Number(cost) || 0,
        supplier: supplier.trim(),
        invoiceRef: invoiceRef.trim(),
        note: note.trim()
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Error registrando el movimiento');
      setSaving(false);
    }
  };

  return (
    <Modal
      title="Registrar movimiento de stock"
      icon={<ArrowUpDown />}
      onClose={onClose}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3.5 rounded-2xl bg-aji/10 border border-aji/30 text-aji flex items-center gap-2 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Resumen del insumo */}
        <div className="p-4 rounded-2xl bg-mantel border border-linea flex items-center justify-between gap-3">
          <div>
            <p className="font-bold text-lg leading-tight">{ingredient.name}</p>
            <p className="text-sm text-suave capitalize">{ingredient.category || 'Insumo'}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-suave">Stock actual</p>
            <p className="precio font-extrabold text-2xl text-tinta">{formatQuantity(prevStock, ingredient.unit)}</p>
          </div>
        </div>

        {/* Selector de Tipo de Movimiento */}
        <div className="space-y-1.5">
          <label className={labelClass}>Tipo de movimiento</label>
          <div className="grid grid-cols-3 gap-2">
            {[
              ['ENTRADA', 'Entrada / Compra', Plus, 'hover:border-hoja border-hoja/40 bg-hoja/5 text-hoja'],
              ['MERMA', 'Merma / Baja', Minus, 'hover:border-aji border-aji/40 bg-aji/5 text-aji'],
              ['AJUSTE', 'Ajuste exacto', RefreshCw, 'hover:border-maracuya border-maracuya/40 bg-maracuya/10 text-maracuya-tinta']
            ].map(([val, label, Icon, tone]) => {
              const active = type === val;
              return (
                <button
                  key={val}
                  type="button"
                  onClick={() => setType(val)}
                  className={`p-3 rounded-2xl border-2 text-left flex flex-col justify-between transition-colors ${
                    active ? 'border-tinta bg-plato shadow-sm' : 'border-linea bg-mantel/50 hover:bg-mantel'
                  }`}
                >
                  <span className={`w-7 h-7 rounded-xl flex items-center justify-center mb-2 ${tone}`}>
                    <Icon className="w-4 h-4" />
                  </span>
                  <span className="font-bold text-sm block leading-snug">{label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Cantidad */}
        <label className="block">
          <span className={labelClass}>
            {type === 'AJUSTE' ? `Nuevo stock exacto (${ingredient.unit}) *` : `Cantidad a ${type === 'ENTRADA' ? 'ingresar' : 'descontar'} (${ingredient.unit}) *`}
          </span>
          <input
            type="number"
            min="0"
            step="any"
            required
            autoFocus
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder="0.00"
            className={fieldClass}
          />
        </label>

        {/* Proyección del resultado */}
        {quantity !== '' && (
          <div className="p-3 rounded-2xl bg-linea/40 flex items-center justify-between text-sm">
            <span className="text-suave">Resultado proyectado:</span>
            <span className="font-bold text-base precio">
              {formatQuantity(prevStock, ingredient.unit)} → <span className="text-hoja">{formatQuantity(projectedStock, ingredient.unit)}</span>
            </span>
          </div>
        )}

        {/* Formato Avanzado (Opcional) */}
        <div className="pt-2 border-t border-linea">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center justify-between w-full py-1 text-sm font-bold text-suave hover:text-tinta transition-colors"
          >
            <span>Detalles avanzados de compra (Proveedor, Factura, Costo)</span>
            <ChevronDown className={`w-4 h-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
          </button>

          {showAdvanced && (
            <div className="mt-3 space-y-3 pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="block">
                  <span className={labelClass}>Proveedor</span>
                  <input
                    type="text"
                    value={supplier}
                    onChange={(e) => setSupplier(e.target.value)}
                    placeholder="Ej. Makro, Fruver Central"
                    className={fieldClass}
                  />
                </label>

                <label className="block">
                  <span className={labelClass}>Nº Factura / Remisión</span>
                  <input
                    type="text"
                    value={invoiceRef}
                    onChange={(e) => setInvoiceRef(e.target.value)}
                    placeholder="Ej. FAC-8932"
                    className={fieldClass}
                  />
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="block">
                  <span className={labelClass}>Costo total (COP)</span>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    value={cost}
                    onChange={(e) => setCost(e.target.value)}
                    placeholder="Opcional"
                    className={fieldClass}
                  />
                </label>

                <label className="block">
                  <span className={labelClass}>Nota o motivo</span>
                  <input
                    type="text"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Ej. Pedido semanal de verduras"
                    className={fieldClass}
                  />
                </label>
              </div>
            </div>
          )}
        </div>

        <div className="pt-2 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="btn btn-quiet"
            disabled={saving}
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving || !quantity}
            className={primaryButton}
          >
            {saving ? 'Registrando…' : 'Confirmar movimiento'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
