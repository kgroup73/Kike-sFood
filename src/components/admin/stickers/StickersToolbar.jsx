import { Filter } from 'lucide-react';

/**
 * Barra de herramientas del modal de stickers:
 * Selector de mesa individual o lote y alternador de estilo (Color oficial vs Una tinta).
 */
export default function StickersToolbar({
  selectedTableId,
  setSelectedTableId,
  tables = [],
  printMode,
  setPrintMode
}) {
  return (
    <div className="bg-mantel/60 border border-linea rounded-2xl p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs print-hidden">
      <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-hoja" />
          <span className="font-bold text-tinta">Mesa:</span>
        </div>

        <select
          value={selectedTableId}
          onChange={(e) => setSelectedTableId(e.target.value)}
          className="bg-plato border border-linea rounded-xl px-3 py-1.5 text-xs text-tinta font-semibold focus:outline-none focus:border-hoja"
        >
          <option value="all">Todas las mesas ({tables.length} stickers)</option>
          {tables.map((t) => (
            <option key={t.id} value={t.id}>
              Mesa #{t.label} (Sticker individual)
            </option>
          ))}
        </select>

        {selectedTableId !== 'all' && (
          <button
            onClick={() => setSelectedTableId('all')}
            className="px-2.5 py-1.5 bg-plato hover:bg-mantel border border-linea text-tinta rounded-xl text-xs font-semibold shrink-0"
          >
            Ver todas
          </button>
        )}
      </div>

      {/* Toggle de estilo de impresión: A color vs. Una tinta */}
      <div className="flex items-center gap-1.5 bg-plato p-1 rounded-xl border border-linea">
        <span className="text-[11px] text-suave font-medium px-1.5">Estilo:</span>
        <button
          type="button"
          onClick={() => setPrintMode('color')}
          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
            printMode === 'color'
              ? 'bg-hoja text-sobre-hoja shadow-sm'
              : 'text-suave hover:text-tinta'
          }`}
        >
          🎨 A color (Oficial)
        </button>
        <button
          type="button"
          onClick={() => setPrintMode('mono')}
          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
            printMode === 'mono'
              ? 'bg-tinta text-plato shadow-sm'
              : 'text-suave hover:text-tinta'
          }`}
        >
          ⬛ Una tinta
        </button>
      </div>
    </div>
  );
}
