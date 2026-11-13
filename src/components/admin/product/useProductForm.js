import { useState, useMemo, useRef, useEffect } from 'react';
import { useTenant } from '../../../hooks/useTenant';
import { api } from '../../../services/api';
import { optimizeProductImage, formatFileSize } from '../../../lib/imageOptimizer';

/**
 * Custom Hook de Orquestación para el formulario de Platillo (SoC - Capa 3).
 * Aísla toda la lógica de negocio, validaciones, optimización de imágenes
 * y gestión de insumos/ingredientes fuera de la vista presentacional.
 */
export function useProductForm({ product = {}, categories = [], availableIngredients = [], onSave }) {
  const { tenant } = useTenant();

  const [form, setForm] = useState(() => ({
    ...product,
    spicyLevel: Number(product.spicyLevel || 0),
    ingredients: Array.isArray(product.ingredients) ? [...product.ingredients] : []
  }));

  // Sincronización segura ante cambio de producto (PR-04)
  useEffect(() => {
    setForm({
      ...product,
      spicyLevel: Number(product.spicyLevel || 0),
      ingredients: Array.isArray(product.ingredients) ? [...product.ingredients] : []
    });
  }, [product?.id]);

  const [saving, setSaving] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const inputRef = useRef(null);
  const containerRef = useRef(null);

  // Estados de subida y optimización de imagen
  const fileInputRef = useRef(null);
  const [imageMode, setImageMode] = useState(() =>
    form.image && form.image.startsWith('http') && !form.image.includes('supabase') ? 'url' : 'upload'
  );
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

  // Cerrar sugerencias al hacer clic fuera (con limpieza estricta de listener PR-08)
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      await onSave?.({
        ...form,
        price: Math.max(0, Math.round(Number(form.price) || 0)),
        category: categories.find((c) => c.id === form.categoryId)?.name || '',
        ingredients: form.ingredients.map((s) => s.trim()).filter(Boolean)
      });
    } finally {
      setSaving(false);
    }
  };

  return {
    form,
    set,
    saving,
    handleSubmit,
    // Imagen
    imageMode,
    setImageMode,
    uploadingImage,
    optimizationStats,
    setOptimizationStats,
    uploadError,
    isDragging,
    fileInputRef,
    handleFileChange,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    // Ingredientes
    tagInput,
    setTagInput,
    dropdownOpen,
    setDropdownOpen,
    inputRef,
    containerRef,
    filteredSuggestions,
    addIngredient,
    removeIngredient,
    handleKeyDown,
    handlePaste
  };
}
