import { Smartphone, Printer, Radio } from 'lucide-react';
import { InlineError } from '../ui/Screens';
import AdminShell from './AdminShell';
import TableStickersModal from './TableStickersModal';
import { useTablesManager } from './tables/useTablesManager';
import TablesEnvironmentHeader from './tables/TablesEnvironmentHeader';
import AddTablesForm from './tables/AddTablesForm';
import TableCard from './tables/TableCard';

/**
 * Shell de Administración de Mesas, QRs y Tags NFC (SoC - Capa 4).
 * Desacoplado: orquestado mediante `useTablesManager` y componentes modulares.
 */
export default function TablesAdmin() {
  const {
    tenant,
    tables,
    activeTables,
    error,
    load,
    stickersTarget,
    setStickersTarget,
    environments,
    layoutOf,
    newEnvName,
    setNewEnvName,
    handleAddEnvironment,
    selectedEnvForNew,
    setSelectedEnvForNew,
    addMode,
    setAddMode,
    quantityToAdd,
    setQuantityToAdd,
    prefixCustom,
    setPrefixCustom,
    newLabelManual,
    setNewLabelManual,
    handleAddTables,
    activeEnvTab,
    setActiveEnvTab,
    displayedGroups,
    updateTableEnvironment,
    handleDeleteTable
  } = useTablesManager();

  return (
    <AdminShell
      title="Mesas, tags NFC y códigos QR"
      subtitle="Cada mesa tiene un enlace con un token secreto: sin él no se puede pedir."
      icon={<Smartphone className="w-5 h-5 text-hoja" aria-hidden="true" />}
      actions={
        <button
          onClick={() => setStickersTarget('all')}
          disabled={!activeTables.length}
          className="px-3.5 py-2 bg-hoja hover:opacity-90 active:scale-95 text-sobre-hoja font-bold rounded-xl flex items-center gap-1.5 shadow-sm transition-all disabled:opacity-40 text-xs"
        >
          <Printer className="w-4 h-4" aria-hidden="true" /> Imprimir stickers (NFC + QR)
        </button>
      }
    >
      {error && <InlineError message={error} onRetry={load} />}

      {/* GESTIÓN DE AMBIENTES Y AGREGAR MESAS */}
      <div className="bg-plato border border-linea rounded-3xl p-5 space-y-5 shadow-sm">
        <TablesEnvironmentHeader
          newEnvName={newEnvName}
          setNewEnvName={setNewEnvName}
          handleAddEnvironment={handleAddEnvironment}
          environments={environments}
          tables={tables}
          layoutOf={layoutOf}
        />

        <AddTablesForm
          addMode={addMode}
          setAddMode={setAddMode}
          selectedEnvForNew={selectedEnvForNew}
          setSelectedEnvForNew={setSelectedEnvForNew}
          environments={environments}
          quantityToAdd={quantityToAdd}
          setQuantityToAdd={setQuantityToAdd}
          prefixCustom={prefixCustom}
          setPrefixCustom={setPrefixCustom}
          newLabelManual={newLabelManual}
          setNewLabelManual={setNewLabelManual}
          handleAddTables={handleAddTables}
        />
      </div>

      {/* PESTAÑAS DE AMBIENTE PARA NAVEGAR Y FILTRAR */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => setActiveEnvTab('all')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
            activeEnvTab === 'all'
              ? 'bg-tinta text-plato shadow-sm'
              : 'bg-plato text-suave hover:text-tinta border border-linea hover:bg-mantel'
          }`}
        >
          Todos los ambientes ({tables.length})
        </button>
        {environments.map((env) => {
          const count = tables.filter((t) => layoutOf(t).zone === env.id).length;
          const isActive = activeEnvTab === env.id;
          return (
            <button
              key={env.id}
              onClick={() => setActiveEnvTab(env.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
                isActive
                  ? 'bg-tinta text-plato shadow-sm'
                  : 'bg-plato text-suave hover:text-tinta border border-linea hover:bg-mantel'
              }`}
            >
              <span>{env.name}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-md ${
                  isActive ? 'bg-plato/20 text-plato' : 'bg-mantel text-suave'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* MESAS AGRUPADAS POR AMBIENTES */}
      {displayedGroups.length === 0 ? (
        <div className="bg-plato border border-linea rounded-3xl p-8 text-center space-y-2">
          <p className="text-sm font-bold text-tinta">No hay mesas en este ambiente.</p>
          <p className="text-xs text-suave">Usa el formulario superior para añadir mesas aquí.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {displayedGroups.map((group) => (
            <div key={group.id} className="space-y-3">
              {activeEnvTab === 'all' && (
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-hoja" />
                    <h3 className="font-display font-extrabold text-sm sm:text-base text-tinta">
                      {group.name}
                    </h3>
                    <span className="text-xs text-suave font-medium">
                      ({group.tables.length} {group.tables.length === 1 ? 'mesa' : 'mesas'})
                    </span>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {group.tables.map((t) => (
                  <TableCard
                    key={t.id}
                    table={t}
                    tenant={tenant}
                    environments={environments}
                    layoutOf={layoutOf}
                    updateTableEnvironment={updateTableEnvironment}
                    handleDeleteTable={handleDeleteTable}
                    setStickersTarget={setStickersTarget}
                    load={load}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* GUÍA EDUCATIVA NFC CON TOKENS DE MARCA */}
      <div className="bg-mantel/60 border border-linea rounded-3xl p-5 sm:p-6 space-y-3 shadow-sm">
        <h4 className="font-display font-extrabold text-sm sm:text-base text-tinta flex items-center gap-2">
          <Radio className="w-5 h-5 text-hoja" aria-hidden="true" /> Cómo instalar los tags NFC
        </h4>
        <ol className="grid grid-cols-1 md:grid-cols-3 gap-3.5 text-xs text-suave">
          <li className="bg-plato p-3.5 rounded-2xl border border-linea shadow-sm">
            <strong className="text-tinta font-bold block mb-1">1. Compra stickers NTAG213/215</strong>
            Cuestan aprox. $1.200 a $1.800 COP cada uno. En mesas metálicas usa versión anti-metal.
          </li>
          <li className="bg-plato p-3.5 rounded-2xl border border-linea shadow-sm">
            <strong className="text-tinta font-bold block mb-1">2. Graba el enlace</strong>
            Con la app gratuita NFC Tools: Escribir → Añadir registro → URL, pega el enlace de la mesa y bloquea el tag.
          </li>
          <li className="bg-plato p-3.5 rounded-2xl border border-linea shadow-sm">
            <strong className="text-tinta font-bold block mb-1">3. Fija en la mesa</strong>
            Si un enlace se filtra, usa "Regenerar" y vuelve a grabar ese tag.
          </li>
        </ol>
      </div>

      {stickersTarget && (
        <TableStickersModal
          tenant={tenant}
          tables={activeTables}
          initialTableId={typeof stickersTarget === 'object' ? stickersTarget.id : 'all'}
          onClose={() => setStickersTarget(null)}
        />
      )}
    </AdminShell>
  );
}
