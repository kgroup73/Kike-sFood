import { X, Plus } from 'lucide-react';

/**
 * Campo selector y creador inteligente de insumos/ingredientes vinculados al plato.
 * Mantiene la accesibilidad, atajos de teclado (Enter, coma, Backspace) y estética.
 */
export default function ProductIngredientsField({
  ingredients = [],
  tagInput,
  setTagInput,
  dropdownOpen,
  setDropdownOpen,
  containerRef,
  inputRef,
  filteredSuggestions = [],
  addIngredient,
  removeIngredient,
  handleKeyDown,
  handlePaste,
  labelClass
}) {
  return (
    <div className="space-y-1.5" ref={containerRef}>
      <span className={labelClass}>Ingredientes / Insumos vinculados</span>
      <div className="min-h-12 p-2 rounded-2xl border border-linea bg-mantel flex flex-wrap items-center gap-1.5 focus-within:border-hoja transition-colors">
        {ingredients.map((ing, idx) => (
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
            placeholder={ingredients.length === 0 ? 'Escribe o busca ingredientes...' : 'Agregar otro...'}
            className="w-full bg-transparent border-0 p-1 text-sm outline-none placeholder:text-suave/70"
          />

          {/* Menú de sugerencias desplegable */}
          {dropdownOpen && (tagInput || filteredSuggestions.length > 0) && (
            <div className="absolute left-0 top-full mt-1.5 w-64 max-h-52 overflow-y-auto bg-plato border border-linea rounded-2xl shadow-xl z-50 p-1 divide-y divide-linea">
              {tagInput.trim() &&
                !filteredSuggestions.some((s) => s.toLowerCase() === tagInput.trim().toLowerCase()) && (
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
  );
}
