import { Plus } from 'lucide-react';

/**
 * Formulario para añadir mesas al restaurante:
 * Soporta modo por cantidad correlativa o modo manual por etiquetas separadas por comas.
 */
export default function AddTablesForm({
  addMode,
  setAddMode,
  selectedEnvForNew,
  setSelectedEnvForNew,
  environments = [],
  quantityToAdd,
  setQuantityToAdd,
  prefixCustom,
  setPrefixCustom,
  newLabelManual,
  setNewLabelManual,
  handleAddTables
}) {
  return (
    <form onSubmit={handleAddTables} className="bg-mantel/60 border border-linea rounded-2xl p-4 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-linea">
        <span className="text-xs font-bold text-tinta">Añadir nuevas mesas al restaurante:</span>
        <div className="flex items-center bg-plato p-0.5 rounded-lg border border-linea text-xs">
          <button
            type="button"
            onClick={() => setAddMode('quantity')}
            className={`px-2.5 py-1 rounded-md font-semibold transition-colors ${
              addMode === 'quantity' ? 'bg-tinta text-plato font-bold' : 'text-suave hover:text-tinta'
            }`}
          >
            Por Cantidad
          </button>
          <button
            type="button"
            onClick={() => setAddMode('manual')}
            className={`px-2.5 py-1 rounded-md font-semibold transition-colors ${
              addMode === 'manual' ? 'bg-tinta text-plato font-bold' : 'text-suave hover:text-tinta'
            }`}
          >
            Manual (Etiquetas)
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
        <div className="sm:col-span-4">
          <label className="block text-xs text-suave mb-1">Asignar al Ambiente:</label>
          <select
            value={selectedEnvForNew}
            onChange={(e) => setSelectedEnvForNew(e.target.value)}
            className="w-full bg-plato border border-linea rounded-xl p-2 text-xs text-tinta focus:outline-none focus:border-hoja font-medium"
          >
            {environments.map((env) => (
              <option key={env.id} value={env.id}>
                {env.name}
              </option>
            ))}
          </select>
        </div>

        {addMode === 'quantity' ? (
          <>
            <div className="sm:col-span-3">
              <label className="block text-xs text-suave mb-1">Cantidad de mesas:</label>
              <input
                type="number"
                min="1"
                max="50"
                value={quantityToAdd}
                onChange={(e) => setQuantityToAdd(e.target.value)}
                className="w-full bg-plato border border-linea rounded-xl p-2 text-xs text-tinta focus:outline-none focus:border-hoja"
                placeholder="Ej. 4"
              />
            </div>
            <div className="sm:col-span-3">
              <label className="block text-xs text-suave mb-1">Prefijo opcional:</label>
              <input
                type="text"
                value={prefixCustom}
                onChange={(e) => setPrefixCustom(e.target.value)}
                className="w-full bg-plato border border-linea rounded-xl p-2 text-xs text-tinta focus:outline-none focus:border-hoja"
                placeholder="Ej. T- o Barra-"
              />
            </div>
          </>
        ) : (
          <div className="sm:col-span-6">
            <label className="block text-xs text-suave mb-1">
              Etiquetas (separadas por comas):
            </label>
            <input
              value={newLabelManual}
              onChange={(e) => setNewLabelManual(e.target.value)}
              className="w-full bg-plato border border-linea rounded-xl p-2 text-xs text-tinta focus:outline-none focus:border-hoja"
              placeholder="Ej. 13, 14, Terraza-1"
            />
          </div>
        )}

        <div className="sm:col-span-2">
          <button
            type="submit"
            className="w-full py-2 bg-hoja hover:opacity-90 active:scale-95 text-sobre-hoja font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" /> Agregar
          </button>
        </div>
      </div>
    </form>
  );
}
