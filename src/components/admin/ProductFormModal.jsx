import { useState, useMemo, useRef, useEffect } from 'react';
import { UtensilsCrossed, X, Plus } from 'lucide-react';
import Modal from '../ui/Modal';
import { fieldClass, labelClass, primaryButton } from './AdminShell';

export default function ProductFormModal({ product, categories, availableIngredients = [], onClose, onSave }) {
  const [form, setForm] = useState(() => ({
    ...product,
    ingredients: Array.isArray(product.ingredients) ? [...product.ingredients] : []
  }));
  const [saving, setSaving] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const inputRef = useRef(null);
  const containerRef = useRef(null);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  // Ingredientes disponibles sugeridos (excluyendo los que ya están agregados)
  const existingNames = useMemo(() => {
    return (availableIngredients || []).map((i) => (typeof i === 'string' ? i : i.name));
  }, [availableIngredients]);

  const filteredSuggestions = useMemo(() => {
    const q = tagInput.trim().toLowerCase();
    const currentLower = new Set(form.ingredients.map((i) => i.toLowerCase()));
    const matches = existingNames.filter(
      (name) => !currentLower.has(name.toLowerCase()) && (!q || name.toLowerCase().includes(q))
    );
    return matches.slice(0, 8);
  }, [existingNames, tagInput, form.ingredients]);

  // Cerrar sugerencias al hacer clic fuera
  useEffect(() => {
    const handleDocClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleDocClick);
    return () => document.removeEventListener('mousedown', handleDocClick);
  }, []);

  const addIngredient = (name) => {
    const clean = name.trim();
    if (!clean) return;
    const currentLower = new Set(form.ingredients.map((i) => i.toLowerCase()));
    if (!currentLower.has(clean.toLowerCase())) {
      set('ingredients', [...form.ingredients, clean]);
    }
    setTagInput('');
    setDropdownOpen(false);
    inputRef.current?.focus();
  };

  const removeIngredient = (idxToRemove) => {
    set(
      'ingredients',
      form.ingredients.filter((_, idx) => idx !== idxToRemove)
    );
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      if (tagInput.trim()) {
        addIngredient(tagInput);
      }
    } else if (e.key === 'Backspace' && !tagInput && form.ingredients.length > 0) {
      removeIngredient(form.ingredients.length - 1);
    }
  };

  const handlePaste = (e) => {
    const text = e.clipboardData.getData('text');
    if (text.includes(',')) {
      e.preventDefault();
      const parts = text.split(',').map((s) => s.trim()).filter(Boolean);
      const currentLower = new Set(form.ingredients.map((i) => i.toLowerCase()));
      const toAdd = parts.filter((p) => !currentLower.has(p.toLowerCase()));
      if (toAdd.length) {
        set('ingredients', [...form.ingredients, ...toAdd]);
      }
      setTagInput('');
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      await onSave({
        ...form,
        price: Math.max(0, Math.round(Number(form.price) || 0)),
        category: categories.find((c) => c.id === form.categoryId)?.name || '',
        ingredients: form.ingredients.map((s) => s.trim()).filter(Boolean)
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title={product.id ? 'Editar platillo' : 'Nuevo platillo'} icon={<UtensilsCrossed />} onClose={onClose} size="lg">
      <form onSubmit={submit} className="space-y-4">
        <label className="block">
          <span className={labelClass}>Nombre *</span>
          <input
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            placeholder="Ej: Hamburguesa Suprema"
            className={fieldClass}
            required
            autoFocus
          />
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="block">
            <span className={labelClass}>Categoría</span>
            <select
              value={form.categoryId || ''}
              onChange={(e) => set('categoryId', e.target.value || null)}
              className={fieldClass}
            >
              <option value="">Sin categoría</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className={labelClass}>Precio (COP, impuesto incluido)</span>
            <input
              type="number"
              min="0"
              step="100"
              value={form.price}
              onChange={(e) => set('price', e.target.value)}
              className={fieldClass}
            />
          </label>
        </div>

        <label className="block">
          <span className={labelClass}>URL de la imagen</span>
          <input
            value={form.image || ''}
            onChange={(e) => set('image', e.target.value)}
            placeholder="https://…"
            className={fieldClass}
          />
        </label>

        <label className="block">
          <span className={labelClass}>Descripción</span>
          <textarea
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
            rows="2"
            placeholder="Descripción atractiva para el comensal..."
            className={fieldClass}
          />
        </label>

        {/* Selector Inteligente de Ingredientes */}
        <div className="space-y-1.5" ref={containerRef}>
          <span className={labelClass}>Ingredientes / Insumos vinculados</span>
          <div className="min-h-12 p-2 rounded-2xl border border-linea bg-mantel flex flex-wrap items-center gap-1.5 focus-within:border-hoja transition-colors">
            {form.ingredients.map((ing, idx) => (
              <span
                key={`${ing}-${idx}`}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-plato border border-linea text-tinta font-bold text-xs shadow-xs animate-scaleIn"
              >
                <span>{ing}</span>
                <button
                  type="button"
                  onClick={() => removeIngredient(idx)}
                  className="hover:text-aji transition-colors"
                  aria-label={`Eliminar ${ing}`}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            ))}

            {/* Input para buscar o escribir nuevo */}
            <div className="relative flex-1 min-w-[140px]">
              <input
                ref={inputRef}
                type="text"
                value={tagInput}
                onChange={(e) => {
                  setTagInput(e.target.value);
                  setDropdownOpen(true);
                }}
                onFocus={() => setDropdownOpen(true)}
                onKeyDown={handleKeyDown}
                onPaste={handlePaste}
                placeholder={form.ingredients.length === 0 ? 'Escribe o busca ingredientes...' : 'Agregar otro...'}
                className="w-full bg-transparent border-0 p-1 text-sm outline-none placeholder:text-suave/70"
              />

              {/* Menú de sugerencias desplegable */}
              {dropdownOpen && (tagInput || filteredSuggestions.length > 0) && (
                <div className="absolute left-0 top-full mt-1.5 w-64 max-h-52 overflow-y-auto bg-plato border border-linea rounded-2xl shadow-xl z-50 p-1 divide-y divide-linea">
                  {tagInput.trim() && !filteredSuggestions.some((s) => s.toLowerCase() === tagInput.trim().toLowerCase()) && (
                    <button
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        addIngredient(tagInput);
                      }}
                      className="w-full text-left px-3 py-2 text-xs font-bold text-hoja hover:bg-hoja/10 rounded-xl flex items-center gap-2"
                    >
                      <Plus className="w-3.5 h-3.5 shrink-0" />
                      <span>Crear e incluir: “{tagInput.trim()}”</span>
                    </button>
                  )}

                  {filteredSuggestions.map((sug) => (
                    <button
                      key={sug}
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        addIngredient(sug);
                      }}
                      className="w-full text-left px-3 py-2 text-xs font-semibold text-tinta hover:bg-mantel rounded-xl flex items-center justify-between"
                    >
                      <span>{sug}</span>
                      <Plus className="w-3.5 h-3.5 text-suave" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <p className="help">
            Presiona <strong>Enter</strong> o coma <strong>(,)</strong> para agregar. Si un ingrediente se agota en inventario, este plato se marcará como <strong>Agotado</strong> en la carta del cliente.
          </p>
        </div>

        {form.modifiers?.length > 0 && (
          <p className="help">
            Modificadores configurados: {form.modifiers.map((m) => m.title).join(', ')} (se conservan).
          </p>
        )}

        <fieldset className="flex flex-wrap gap-2 pt-1">
          {[
            ['isChef', 'Especial del chef'],
            ['isPopular', 'Popular'],
            ['isVeg', 'Vegano'],
            ['isGf', 'Sin gluten'],
            ['available', 'Visible en la carta']
          ].map(([key, label]) => (
            <label
              key={key}
              className={`h-10 px-4 rounded-full border flex items-center gap-2 cursor-pointer select-none font-bold text-sm transition-colors ${
                form[key] ? 'bg-hoja border-hoja text-sobre-hoja' : 'bg-plato border-linea hover:border-tinta'
              }`}
            >
              <input
                type="checkbox"
                checked={Boolean(form[key])}
                onChange={(e) => set(key, e.target.checked)}
                className="sr-only"
              />
              {label}
            </label>
          ))}
        </fieldset>

        <button
          disabled={saving || !form.name.trim()}
          className={`${primaryButton} w-full h-12`}
        >
          {saving ? 'Guardando…' : 'Guardar platillo'}
        </button>
      </form>
    </Modal>
  );
}
