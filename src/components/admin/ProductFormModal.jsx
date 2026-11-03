import { useState } from 'react';
import { UtensilsCrossed } from 'lucide-react';
import Modal from '../ui/Modal';
import { fieldClass, labelClass, primaryButton } from './AdminShell';

export default function ProductFormModal({ product, categories, onClose, onSave }) {
  const [form, setForm] = useState(() => ({
    ...product,
    ingredientsText: (product.ingredients || []).join(', ')
  }));
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const { ingredientsText, ...rest } = form;
      await onSave({
        ...rest,
        price: Math.max(0, Math.round(Number(form.price) || 0)),
        category: categories.find((c) => c.id === form.categoryId)?.name || '',
        ingredients: ingredientsText.split(',').map((s) => s.trim()).filter(Boolean)
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title={product.id ? 'Editar platillo' : 'Nuevo platillo'} icon={<UtensilsCrossed className="w-4 h-4 text-orange-400" />} onClose={onClose}>
      <form onSubmit={submit} className="space-y-3 text-xs">
        <label className="block">
          <span className={labelClass}>Nombre</span>
          <input value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Ej: Hamburguesa Suprema" className={fieldClass} required />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className={labelClass}>Categoría</span>
            <select value={form.categoryId || ''} onChange={(e) => set('categoryId', e.target.value || null)} className={fieldClass}>
              <option value="">Sin categoría</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className={labelClass}>Precio (COP, impuesto incluido)</span>
            <input type="number" min="0" step="100" value={form.price} onChange={(e) => set('price', e.target.value)} className={fieldClass} />
          </label>
        </div>
        <label className="block">
          <span className={labelClass}>URL de la imagen</span>
          <input value={form.image || ''} onChange={(e) => set('image', e.target.value)} placeholder="https://…" className={fieldClass} />
        </label>
        <label className="block">
          <span className={labelClass}>Descripción</span>
          <textarea value={form.description} onChange={(e) => set('description', e.target.value)} rows="2" className={fieldClass} />
        </label>
        <label className="block">
          <span className={labelClass}>Ingredientes (separados por coma)</span>
          <textarea value={form.ingredientsText} onChange={(e) => set('ingredientsText', e.target.value)} rows="2" placeholder="Carne Angus, Queso Brie, Pan brioche" className={fieldClass} />
          <span className="text-[10px] text-slate-500 mt-1 block">Cocina usa esta lista para agotar platillos cuando falta un insumo.</span>
        </label>
        {form.modifiers?.length > 0 && (
          <p className="text-[10px] text-slate-500">
            Modificadores: {form.modifiers.map((m) => m.title).join(', ')} (se conservan al guardar).
          </p>
        )}
        <div className="flex flex-wrap items-center gap-4 pt-1">
          {[
            ['isChef', 'Especial del chef'],
            ['isPopular', 'Popular'],
            ['isVeg', 'Vegano'],
            ['isGf', 'Sin gluten'],
            ['available', 'Visible en la carta']
          ].map(([key, label]) => (
            <label key={key} className="flex items-center gap-1.5 cursor-pointer select-none text-slate-300 font-medium">
              <input type="checkbox" checked={!!form[key]} onChange={(e) => set(key, e.target.checked)} className="accent-orange-500" />
              {label}
            </label>
          ))}
        </div>
        <button disabled={saving || !form.name.trim()} className={`${primaryButton} w-full`}>{saving ? 'Guardando…' : 'Guardar platillo'}</button>
      </form>
    </Modal>
  );
}
