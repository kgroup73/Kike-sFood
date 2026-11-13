import { useState, useMemo, useRef, useEffect } from 'react';
import {
  UtensilsCrossed,
  X,
  Plus,
  Upload,
  Camera,
  Trash2,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Link as LinkIcon
} from 'lucide-react';
import Modal from '../ui/Modal';
import { fieldClass, labelClass, primaryButton } from './AdminShell';
import DishImage from '../client/DishImage';
import { useTenant } from '../../hooks/useTenant';
import { api } from '../../services/api';
import { optimizeProductImage, formatFileSize } from '../../lib/imageOptimizer';

export default function ProductFormModal({ product, categories, availableIngredients = [], onClose, onSave }) {
  const { tenant } = useTenant();
  const [form, setForm] = useState(() => ({
    ...product,
    ingredients: Array.isArray(product.ingredients) ? [...product.ingredients] : []
  }));
  const [saving, setSaving] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const inputRef = useRef(null);
  const containerRef = useRef(null);

  // Estados de subida y optimización de imagen
  const fileInputRef = useRef(null);
  const [imageMode, setImageMode] = useState(() => (form.image && form.image.startsWith('http') && !form.image.includes('supabase') ? 'url' : 'upload'));
  const [uploadingImage, setUploadingImage] = useState(false);
  const [optimizationStats, setOptimizationStats] = useState(null);
  const [uploadError, setUploadError] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  // Procesa y optimiza el archivo de imagen para subir a Supabase Storage
  const processAndUploadFile = async (file) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setUploadError('Por favor selecciona un archivo de imagen válido (JPG, PNG o WebP).');
      return;
    }

    setUploadingImage(true);
    setUploadError('');
    setOptimizationStats(null);

    try {
      // 1. Optimización en el cliente (máx 1080px, WebP, rango ~100-300KB)
      const optimized = await optimizeProductImage(file, {
        maxDimension: 1080,
        targetMinBytes: 90 * 1024,
        targetMaxBytes: 300 * 1024
      });

      setOptimizationStats({
        original: formatFileSize(optimized.originalSizeBytes),
        optimized: formatFileSize(optimized.optimizedSizeBytes),
        savings: optimized.savingsPercent
      });

      // 2. Subida al bucket 'products' de Supabase
      const res = await api.uploadProductImage({
        file: optimized.file,
        tenantSlug: tenant?.slug || 'general',
        fileName: form.name ? `${form.name}.webp` : optimized.file.name
      });

      if (res?.publicUrl) {
        set('image', res.publicUrl);
      }
    } catch (err) {
      console.error('Error al subir imagen:', err);
      setUploadError(err.message || 'Error al optimizar y subir la imagen.');
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) processAndUploadFile(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processAndUploadFile(file);
  };

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

        {/* Selector y Optimizador de Foto del Platillo */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className={labelClass}>Foto del platillo</span>
            <div className="flex items-center gap-1 bg-linea/60 p-0.5 rounded-lg text-xs">
              <button
                type="button"
                onClick={() => setImageMode('upload')}
                className={`px-2 py-0.5 rounded-md font-bold transition-colors flex items-center gap-1 ${
                  imageMode === 'upload'
                    ? 'bg-plato text-tinta shadow-xs'
                    : 'text-suave hover:text-tinta'
                }`}
              >
                <Camera className="w-3.5 h-3.5" /> Subir archivo
              </button>
              <button
                type="button"
                onClick={() => setImageMode('url')}
                className={`px-2 py-0.5 rounded-md font-bold transition-colors flex items-center gap-1 ${
                  imageMode === 'url'
                    ? 'bg-plato text-tinta shadow-xs'
                    : 'text-suave hover:text-tinta'
                }`}
              >
                <LinkIcon className="w-3.5 h-3.5" /> URL externa
              </button>
            </div>
          </div>

          {imageMode === 'upload' ? (
            <div className="space-y-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />

              {form.image ? (
                /* Vista de Foto Cargada con Opciones */
                <div className="card p-3 border-linea bg-mantel flex items-center gap-3.5">
                  <DishImage
                    src={form.image}
                    alt={form.name || 'Platillo'}
                    className="w-20 h-20 rounded-xl shrink-0 border border-linea object-cover"
                  />
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-hoja">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>Foto lista para la carta</span>
                    </div>

                    {optimizationStats && (
                      <div className="text-[11px] text-suave">
                        Optimizado a <strong>{optimizationStats.optimized}</strong>{' '}
                        {optimizationStats.savings > 0 && (
                          <span className="text-hoja font-semibold">
                            (ahorro de {optimizationStats.savings}%)
                          </span>
                        )}
                      </div>
                    )}

                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingImage}
                        className="btn btn-sm btn-quiet text-xs py-1 px-2.5 font-bold flex items-center gap-1"
                      >
                        <Camera className="w-3 h-3" /> Cambiar foto
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          set('image', '');
                          setOptimizationStats(null);
                        }}
                        className="btn btn-sm btn-quiet text-xs py-1 px-2 text-suave hover:text-red-600"
                        title="Quitar foto"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                /* Zona de Carga / Drag & Drop */
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => !uploadingImage && fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                    isDragging
                      ? 'border-hoja bg-hoja/10 scale-[1.01]'
                      : 'border-linea bg-mantel/60 hover:bg-mantel hover:border-tinta'
                  }`}
                >
                  {uploadingImage ? (
                    <div className="py-2 space-y-2">
                      <Loader2 className="w-8 h-8 animate-spin text-hoja mx-auto" />
                      <p className="text-xs font-bold text-tinta">
                        Optimizando imagen (~150-300 KB) y guardando en la nube...
                      </p>
                      <p className="text-[11px] text-suave">
                        Convirtiendo a formato WebP de alta velocidad
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <div className="w-10 h-10 rounded-full bg-hoja/10 text-hoja flex items-center justify-center mx-auto">
                        <Upload className="w-5 h-5" />
                      </div>
                      <p className="text-xs font-bold text-tinta">
                        Haz clic o arrastra la foto del platillo aquí
                      </p>
                      <p className="text-[11px] text-suave">
                        JPG, PNG o WebP. Se optimiza automáticamente en el rango ideal (~150 a 300 KB).
                      </p>
                    </div>
                  )}
                </div>
              )}

              {uploadError && (
                <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                  <span>{uploadError}</span>
                </div>
              )}
            </div>
          ) : (
            /* Modo URL externa */
            <div className="space-y-1.5">
              <input
                value={form.image || ''}
                onChange={(e) => set('image', e.target.value)}
                placeholder="https://ejemplo.com/foto-platillo.jpg"
                className={fieldClass}
              />
              <p className="text-[11px] text-suave">
                Pega un enlace directo de imagen alojada externamente.
              </p>
            </div>
          )}
        </div>

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
