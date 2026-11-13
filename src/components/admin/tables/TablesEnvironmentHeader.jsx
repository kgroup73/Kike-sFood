import { LayoutGrid, Plus, MapPin } from 'lucide-react';

/**
 * Cabecera y resumen de ambientes (zonas) del restaurante.
 * Permite la creación rápida de nuevos salones, terrazas o barras.
 */
export default function TablesEnvironmentHeader({
  newEnvName,
  setNewEnvName,
  handleAddEnvironment,
  environments = [],
  tables = [],
  layoutOf
}) {
  return (
    <>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-linea">
        <div>
          <h3 className="text-sm sm:text-base font-display font-extrabold text-tinta flex items-center gap-2">
            <LayoutGrid className="w-4 h-4 text-hoja" />
            Gestión de Ambientes & Mesas
          </h3>
          <p className="text-xs text-suave">
            Configura salones, terrazas, barras y crea mesas por cantidad o etiqueta.
          </p>
        </div>

        {/* Formulario rápido para añadir nuevo ambiente */}
        <form onSubmit={handleAddEnvironment} className="flex items-center gap-2 w-full sm:w-auto">
          <input
            value={newEnvName}
            onChange={(e) => setNewEnvName(e.target.value)}
            placeholder="Nuevo ambiente (ej. VIP, Patio)"
            className="bg-mantel border border-linea rounded-xl px-3 py-1.5 text-xs text-tinta placeholder-suave focus:outline-none focus:border-hoja w-full sm:w-52"
          />
          <button
            type="submit"
            className="px-3 py-1.5 bg-mantel hover:bg-linea/60 text-tinta font-bold text-xs rounded-xl border border-linea flex items-center gap-1 shrink-0 transition-colors"
          >
            <Plus className="w-3.5 h-3.5 text-hoja" /> Crear Ambiente
          </button>
        </form>
      </div>

      {/* Resumen de ambientes creados con badge de cantidad */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-bold text-suave mr-1">Ambientes activos:</span>
        {environments.map((env) => {
          const countInEnv = tables.filter((t) => layoutOf(t).zone === env.id).length;

          return (
            <span
              key={env.id}
              className="bg-mantel border border-linea rounded-xl px-3 py-1 text-xs text-tinta flex items-center gap-1.5 font-semibold"
            >
              <MapPin className="w-3 h-3 text-hoja" />
              {env.name}
              <span className="bg-hoja/10 text-hoja text-[10px] px-1.5 py-0.2 rounded-md font-bold">
                {countInEnv} {countInEnv === 1 ? 'mesa' : 'mesas'}
              </span>
            </span>
          );
        })}
      </div>
    </>
  );
}
