import { UtensilsCrossed } from 'lucide-react';
import Modal from '../ui/Modal';
import { fieldClass, labelClass, primaryButton } from './AdminShell';
import { useProductForm } from './product/useProductForm';
import ProductImageField from './product/ProductImageField';
import ProductIngredientsField from './product/ProductIngredientsField';
import ProductBadgesField from './product/ProductBadgesField';

/**
 * Shell presentacional del Modal de Creación/Edición de Platillo (SoC - Capa 4).
 * Desacoplado: delega la lógica de negocio y estado al hook `useProductForm`,
 * y las sub-secciones complejas a componentes modulares especializados.
 */
export default function ProductFormModal({
  product = {},
  categories = [],
  availableIngredients = [],
  onClose,
  onSave
}) {
  const {
    form,
    set,
    saving,
    handleSubmit,
    fieldErrors,
    // Subida y optimización de imagen
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
    // Gestión de ingredientes
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
  } = useProductForm({ product, categories, availableIngredients, onSave });

  return (
    <Modal
      title={product.id ? 'Editar platillo' : 'Nuevo platillo'}
      icon={<UtensilsCrossed />}
      onClose={onClose}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Nombre del platillo */}
        <label className="block">
          <span className={labelClass}>Nombre *</span>
          <input
            value={form.name || ''}
            onChange={(e) => set('name', e.target.value)}
            placeholder="Ej: Hamburguesa Suprema"
            className={`${fieldClass} ${fieldErrors?.name ? 'border-red-500 focus:border-red-500' : ''}`}
            required
            autoFocus
          />
          {fieldErrors?.name && (
            <p className="text-xs text-red-500 font-semibold mt-1">{fieldErrors.name}</p>
          )}
        </label>

        {/* Categoría y Precio */}
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
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className={labelClass}>Precio (COP, impuesto incluido)</span>
            <input
              type="number"
              min="0"
              step="100"
              value={form.price ?? ''}
              onChange={(e) => set('price', e.target.value)}
              className={`${fieldClass} ${fieldErrors?.price ? 'border-red-500 focus:border-red-500' : ''}`}
            />
            {fieldErrors?.price && (
              <p className="text-xs text-red-500 font-semibold mt-1">{fieldErrors.price}</p>
            )}
          </label>
        </div>

        {/* Selector y Optimizador de Foto del Platillo */}
        <ProductImageField
          image={form.image}
          name={form.name}
          imageMode={imageMode}
          setImageMode={setImageMode}
          onImageChange={(val) => set('image', val)}
          fileInputRef={fileInputRef}
          handleFileChange={handleFileChange}
          handleDragOver={handleDragOver}
          handleDragLeave={handleDragLeave}
          handleDrop={handleDrop}
          isDragging={isDragging}
          uploadingImage={uploadingImage}
          optimizationStats={optimizationStats}
          setOptimizationStats={setOptimizationStats}
          uploadError={uploadError}
          labelClass={labelClass}
          fieldClass={fieldClass}
        />

        {/* Descripción */}
        <label className="block">
          <span className={labelClass}>Descripción</span>
          <textarea
            value={form.description || ''}
            onChange={(e) => set('description', e.target.value)}
            rows="2"
            placeholder="Descripción atractiva para el comensal..."
            className={fieldClass}
          />
        </label>

        {/* Selector Inteligente de Ingredientes */}
        <ProductIngredientsField
          ingredients={form.ingredients}
          tagInput={tagInput}
          setTagInput={setTagInput}
          dropdownOpen={dropdownOpen}
          setDropdownOpen={setDropdownOpen}
          containerRef={containerRef}
          inputRef={inputRef}
          filteredSuggestions={filteredSuggestions}
          addIngredient={addIngredient}
          removeIngredient={removeIngredient}
          handleKeyDown={handleKeyDown}
          handlePaste={handlePaste}
          labelClass={labelClass}
        />

        {form.modifiers?.length > 0 && (
          <p className="help">
            Modificadores configurados: {form.modifiers.map((m) => m.title).join(', ')} (se conservan).
          </p>
        )}

        {/* Distintivos y Preferencias de la Carta */}
        <ProductBadgesField form={form} set={set} labelClass={labelClass} />

        {/* Botón de Guardar */}
        <button
          disabled={saving || !form.name?.trim()}
          className={`${primaryButton} w-full h-12`}
        >
          {saving ? 'Guardando…' : 'Guardar platillo'}
        </button>
      </form>
    </Modal>
  );
}
