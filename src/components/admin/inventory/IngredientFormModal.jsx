import { useState } from 'react';
import { Package, AlertCircle } from 'lucide-react';
import Modal from '../../ui/Modal';
import { INGREDIENT_CATEGORIES, INVENTORY_UNITS } from '../../../lib/inventory';
import { primaryButton } from '../AdminShell';

const fieldClass = 'field w-full';
const labelClass = 'text-sm font-bold text-suave block mb-1.5';

export default function IngredientFormModal({ ingredient = null, onClose, onSave }) {
  const isEditing = Boolean(ingredient?.key);
  const [form, setForm] = useState({
    name: ingredient?.name || '',
    category: ingredient?.category || 'otros',
    unit: ingredient?.unit || 'unidad',
    currentStock: ingredient?.currentStock ?? 0,
    minStock: ingredient?.minStock ?? 0,
    unitCost: ingredient?.unitCost ?? 0,
    autoDeplete: Boolean(ingredient?.autoDeplete),
    supplier: ingredient?.supplier || '',
    isSoldOut: Boolean(ingredient?.isSoldOut),
    note: ingredient?.note || ''
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const set = (key, val) => setForm((prev) => ({ ...prev, [key]: val }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const name = form.name.trim();
    if (!name) {
      setError('Escribe el nombre del ingrediente');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSave({
        ...form,
        name,
        currentStock: Number(form.currentStock) || 0,
        minStock: Number(form.minStock) || 0,
        unitCost: Number(form.unitCost) || 0
      });
      onClose();
    } catch (err) {
      setError(err.message || 'No se pudo guardar el ingrediente');
      setSaving(false);
    }
  };

  return (
    <Modal
      title={isEditing ? `Editar ${ingredient.name}` : 'Nuevo ingrediente'}
      icon={<Package />}
      onClose={onClose}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3.5 rounded-2xl bg-aji/10 border border-aji/30 text-aji flex items-center gap-2 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="block sm:col-span-2">
            <span className={labelClass}>Nombre del insumo / ingrediente *</span>
            <input
              type="text"
              required
              autoFocus
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              placeholder="Ej. Pechuga de pollo, Queso Mozzarella, Pan Brioche"
              className={fieldClass}
            />
          </label>

          <label className="block">
            <span className={labelClass}>Categoría</span>
            <select
              value={form.category}
              onChange={(e) => set('category', e.target.value)}
              className={fieldClass}
            >
              {INGREDIENT_CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>{c.label}</option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className={labelClass}>Unidad de medida</span>
            <select
              value={form.unit}
              onChange={(e) => set('unit', e.target.value)}
              className={fieldClass}
            >
              {INVENTORY_UNITS.map((u) => (
                <option key={u.id} value={u.id}>{u.label}</option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className={labelClass}>Stock actual ({form.unit})</span>
            <input
              type="number"
              min="0"
              step="any"
              value={form.currentStock}
              onChange={(e) => set('currentStock', e.target.value)}
              className={fieldClass}
            />
          </label>

          <label className="block">
            <span className={labelClass}>Stock mínimo de alerta</span>
            <input
              type="number"
              min="0"
              step="any"
              value={form.minStock}
              onChange={(e) => set('minStock', e.target.value)}
              placeholder="0 (sin alerta)"
              className={fieldClass}
            />
            <span className="help">Avisa cuando las existencias estén por debajo de esta cantidad.</span>
          </label>

          <label className="block">
            <span className={labelClass}>Costo unitario aproximado (COP)</span>
            <input
              type="number"
              min="0"
              step="100"
              value={form.unitCost}
              onChange={(e) => set('unitCost', e.target.value)}
              placeholder="Opcional"
              className={fieldClass}
            />
          </label>

          <label className="block">
            <span className={labelClass}>Proveedor habitual</span>
            <input
              type="text"
              value={form.supplier}
              onChange={(e) => set('supplier', e.target.value)}
              placeholder="Opcional (ej. Avícola Central)"
              className={fieldClass}
            />
          </label>
        </div>

        {/* Opciones y switches */}
        <div className="pt-2 border-t border-linea space-y-3">
          <label className="flex items-start gap-3 p-3.5 rounded-2xl bg-mantel border border-linea cursor-pointer select-none hover:border-suave transition-colors">
            <input
              type="checkbox"
              checked={form.autoDeplete}
              onChange={(e) => set('autoDeplete', e.target.checked)}
              className="mt-1 rounded border-linea text-hoja focus:ring-hoja"
            />
            <div className="text-sm">
              <span className="font-bold block text-tinta">Agotar automáticamente si el stock llega a 0</span>
              <span className="text-suave">
                Si está activado, en cuanto el stock numérico llegue a 0 los platos vinculados se marcarán como agotados en la carta.
              </span>
            </div>
          </label>

          <label className="flex items-start gap-3 p-3.5 rounded-2xl bg-mantel border border-linea cursor-pointer select-none hover:border-suave transition-colors">
            <input
              type="checkbox"
              checked={form.isSoldOut}
              onChange={(e) => set('isSoldOut', e.target.checked)}
              className="mt-1 rounded border-linea text-aji focus:ring-aji"
            />
            <div className="text-sm">
              <span className="font-bold block text-tinta">Marcar como Agotado manualmente</span>
              <span className="text-suave">
                Fuerza el estado agotado de inmediato sin importar el stock numérico (por ejemplo si se dañó o no está listo para el servicio).
              </span>
            </div>
          </label>
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
            disabled={saving || !form.name.trim()}
            className={primaryButton}
          >
            {saving ? 'Guardando…' : isEditing ? 'Actualizar insumo' : 'Crear insumo'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
