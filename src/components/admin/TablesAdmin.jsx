import { useCallback, useEffect, useState } from 'react';
import {
  Smartphone,
  Printer,
  Copy,
  ExternalLink,
  RefreshCw,
  Plus,
  Zap,
  Sparkles,
  Power,
  Trash2,
  LayoutGrid,
  MapPin
} from 'lucide-react';
import { useTenant } from '../../hooks/useTenant';
import { useToast } from '../../hooks/useToast';
import { api } from '../../services/api';
import { InlineError } from '../ui/Screens';
import AdminShell from './AdminShell';
import TableStickersModal from './TableStickersModal';
import { tableUrl } from './tableLinks';
import { useFloorPlan } from '../../hooks/useFloorPlan';

export default function TablesAdmin() {
  const { tenant } = useTenant();
  const showToast = useToast();
  const [tables, setTables] = useState([]);
  const [error, setError] = useState(null);
  const [stickersTarget, setStickersTarget] = useState(null); // null (cerrado) | 'all' (todas) | objeto mesa específica

  // Gestión de ambientes y ubicación de mesas (plano de sala compartido con la caja)
  const { environments, layoutOf, addEnvironment, saveLayout } = useFloorPlan(tenant.id);
  const [newEnvName, setNewEnvName] = useState('');
  const [selectedEnvForNew, setSelectedEnvForNew] = useState('salon');
  const [addMode, setAddMode] = useState('quantity'); // 'quantity' | 'manual'
  const [newLabelManual, setNewLabelManual] = useState('');
  const [quantityToAdd, setQuantityToAdd] = useState(1);
  const [prefixCustom, setPrefixCustom] = useState('');

  const load = useCallback(async () => {
    try {
      setTables(await api.listTables(tenant.id));
      setError(null);
    } catch (err) {
      setError(err.message);
    }
  }, [tenant.id]);

  useEffect(() => {
    load();
  }, [load]);

  const act = async (fn, ok) => {
    try {
      await fn();
      await load();
      if (ok) showToast(ok, 'success');
      return true;
    } catch (err) {
      showToast(err.message, 'error');
      return false;
    }
  };

  // Crear un nuevo ambiente
  const handleAddEnvironment = async (e) => {
    e.preventDefault();
    const trimmed = newEnvName.trim();
    if (!trimmed) return;
    try {
      const id = await addEnvironment(trimmed);
      setSelectedEnvForNew(id);
      setNewEnvName('');
      showToast(`Ambiente "${trimmed}" añadido`, 'success');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Agregar mesas (por lote/cantidad o manual)
  const handleAddTables = (e) => {
    e.preventDefault();
    let labels = [];

    if (addMode === 'quantity') {
      const qty = parseInt(quantityToAdd, 10);
      if (!qty || qty < 1) {
        showToast('Indica una cantidad válida de mesas', 'error');
        return;
      }

      // Detecta números existentes para continuar correlativo
      const existingNumbers = tables
        .map((t) => parseInt(t.label.replace(/\D/g, ''), 10))
        .filter((n) => !isNaN(n));
      const maxExisting = existingNumbers.length > 0 ? Math.max(...existingNumbers) : 0;

      const pfx = prefixCustom.trim();
      for (let i = 1; i <= qty; i++) {
        const nextNum = maxExisting + i;
        labels.push(pfx ? `${pfx}${nextNum}` : String(nextNum));
      }
    } else {
      labels = newLabelManual
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
    }

    if (!labels.length) return;

    const zone = environments.some((env) => env.id === selectedEnvForNew) ? selectedEnvForNew : environments[0]?.id;
    const create = async () => {
      const created = (await api.createTables(tenant.id, labels)) || [];
      // Las mesas nuevas quedan en el ambiente elegido (por id, que no cambia si se renombra la mesa).
      if (created.length && zone) await saveLayout(Object.fromEntries(created.map((t) => [t.id, { zone }])));
    };
    act(create, labels.length === 1 ? `Mesa ${labels[0]} creada` : `${labels.length} mesas creadas`).then((done) => {
      if (done) {
        setNewLabelManual('');
        setQuantityToAdd(1);
      }
    });
  };

  // Cambiar ambiente asignado a una mesa existente
  const updateTableEnvironment = (tableId, tableLabel, zoneId) => {
    saveLayout({ [tableId]: { zone: zoneId } }).then(
      () => showToast(`Mesa ${tableLabel} reasignada`, 'success'),
      (err) => showToast(err.message, 'error')
    );
  };

  // Eliminar una mesa permanentemente
  const handleDeleteTable = (table) => {
    const ok = window.confirm(
      `¿Seguro que deseas eliminar la Mesa ${table.label}? Esta acción quitará la mesa del restaurante de forma definitiva.`
    );
    if (!ok) return;
    act(() => api.deleteTable(table.id), `Mesa ${table.label} eliminada`);
  };

  const activeTables = tables.filter((t) => t.isActive);

  return (
    <AdminShell
      title="Mesas, tags NFC y códigos QR"
      subtitle="Cada mesa tiene un enlace con un token secreto: sin él no se puede pedir."
      icon={<Smartphone className="w-5 h-5 text-amber-400" aria-hidden="true" />}
      actions={
        <button
          onClick={() => setStickersTarget('all')}
          disabled={!activeTables.length}
          className="px-3.5 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 active:scale-95 text-slate-950 font-black rounded-xl flex items-center gap-1.5 shadow-md transition-all disabled:opacity-40 text-xs"
        >
          <Printer className="w-4 h-4" aria-hidden="true" /> Imprimir stickers (NFC + QR)
        </button>
      }
    >
      {error && <InlineError message={error} onRetry={load} />}

      {/* GESTIÓN DE AMBIENTES Y AGREGAR MESAS */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-5 shadow-lg">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
              <LayoutGrid className="w-4 h-4 text-amber-400" />
              Gestión de Ambientes & Mesas
            </h3>
            <p className="text-xs text-slate-400">
              Configura salones, terrazas, barras y crea mesas por cantidad o etiqueta
            </p>
          </div>

          {/* Formulario rápido para añadir nuevo ambiente */}
          <form onSubmit={handleAddEnvironment} className="flex items-center gap-2 w-full sm:w-auto">
            <input
              value={newEnvName}
              onChange={(e) => setNewEnvName(e.target.value)}
              placeholder="Nuevo ambiente (ej. VIP, Patio)"
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 w-full sm:w-52"
            />
            <button
              type="submit"
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-xs rounded-xl border border-slate-700 flex items-center gap-1 shrink-0"
            >
              <Plus className="w-3.5 h-3.5" /> Crear Ambiente
            </button>
          </form>
        </div>

        {/* Resumen de ambientes creados con badge de cantidad */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-slate-400 mr-1">Ambientes activos:</span>
          {environments.map((env) => {
            const countInEnv = tables.filter((t) => layoutOf(t).zone === env.id).length;

            return (
              <span
                key={env.id}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1 text-xs text-slate-300 flex items-center gap-1.5 font-semibold"
              >
                <MapPin className="w-3 h-3 text-amber-400" />
                {env.name}
                <span className="bg-slate-800 text-amber-300 text-[10px] px-1.5 py-0.2 rounded-md font-bold">
                  {countInEnv} {countInEnv === 1 ? 'mesa' : 'mesas'}
                </span>
              </span>
            );
          })}
        </div>

        {/* Formulario para agregar mesas por cantidad o lista */}
        <form onSubmit={handleAddTables} className="bg-slate-950/80 border border-slate-800/80 rounded-2xl p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-800/60">
            <span className="text-xs font-bold text-slate-300">Añadir nuevas mesas al restaurante:</span>
            <div className="flex items-center bg-slate-900 p-0.5 rounded-lg border border-slate-800 text-xs">
              <button
                type="button"
                onClick={() => setAddMode('quantity')}
                className={`px-2.5 py-1 rounded-md font-semibold ${
                  addMode === 'quantity' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Por Cantidad
              </button>
              <button
                type="button"
                onClick={() => setAddMode('manual')}
                className={`px-2.5 py-1 rounded-md font-semibold ${
                  addMode === 'manual' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Manual (Etiquetas)
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
            <div className="sm:col-span-4">
              <label className="block text-xs text-slate-400 mb-1">Asignar al Ambiente:</label>
              <select
                value={selectedEnvForNew}
                onChange={(e) => setSelectedEnvForNew(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-xs text-white focus:outline-none focus:border-amber-400"
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
                  <label className="block text-xs text-slate-400 mb-1">Cantidad de mesas:</label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={quantityToAdd}
                    onChange={(e) => setQuantityToAdd(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-xs text-white focus:outline-none focus:border-amber-400"
                    placeholder="Ej. 4"
                  />
                </div>
                <div className="sm:col-span-3">
                  <label className="block text-xs text-slate-400 mb-1">Prefijo opcional:</label>
                  <input
                    type="text"
                    value={prefixCustom}
                    onChange={(e) => setPrefixCustom(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-xs text-white focus:outline-none focus:border-amber-400"
                    placeholder="Ej. T- o Barra-"
                  />
                </div>
              </>
            ) : (
              <div className="sm:col-span-6">
                <label className="block text-xs text-slate-400 mb-1">
                  Etiquetas (separadas por comas):
                </label>
                <input
                  value={newLabelManual}
                  onChange={(e) => setNewLabelManual(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-xs text-white focus:outline-none focus:border-amber-400"
                  placeholder="Ej. 13, 14, Terraza-1"
                />
              </div>
            )}

            <div className="sm:col-span-2">
              <button
                type="submit"
                className="w-full py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs rounded-xl flex items-center justify-center gap-1.5 shadow transition-all"
              >
                <Plus className="w-4 h-4" /> Agregar
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* CUADRÍCULA ORIGINAL DE TARJETAS DE MESAS CON ENLACES, NFC Y ACCIONES */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {tables.map((t) => {
          const url = tableUrl(tenant.slug, t.token);
          const currentZoneId = layoutOf(t).zone;

          return (
            <div
              key={t.id}
              className={`bg-slate-900 border rounded-2xl p-4 space-y-3 shadow-md ${
                t.isActive ? 'border-slate-800 hover:border-amber-500/50' : 'border-slate-800/60 opacity-60'
              }`}
            >
              <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 font-black flex items-center justify-center text-xs border border-amber-500/30">
                    #{t.label}
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-xs sm:text-sm">Mesa {t.label}</h4>
                    <span className="text-[10px] text-slate-400 flex items-center gap-1">
                      <Zap className="w-2.5 h-2.5 text-amber-400" aria-hidden="true" /> NFC NTAG213 / QR
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  {/* Selector rápido de ambiente */}
                  <select
                    value={currentZoneId}
                    onChange={(e) => updateTableEnvironment(t.id, t.label, e.target.value)}
                    className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-0.5 text-[10px] font-semibold text-amber-300 focus:outline-none"
                    title="Cambiar ambiente asignado a esta mesa"
                  >
                    {environments.map((env) => (
                      <option key={env.id} value={env.id}>
                        {env.name}
                      </option>
                    ))}
                  </select>

                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      t.isActive
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}
                  >
                    {t.isActive ? 'Activa' : 'Inactiva'}
                  </span>
                </div>
              </div>

              {/* Caja de enlace monocromático select-all como en el diseño original */}
              <div
                className="bg-slate-950 p-2 rounded-xl border border-slate-800 text-[10px] text-slate-400 font-mono truncate select-all"
                title={url}
              >
                {url}
              </div>

              {/* Botonera de acciones: Copiar, Probar, Sticker Individual, Regenerar, Activar/Desactivar, Eliminar */}
              <div className="flex items-center gap-1.5 text-xs">
                <button
                  onClick={() =>
                    navigator.clipboard?.writeText(url).then(
                      () => showToast(`Enlace de la Mesa ${t.label} copiado 📋`),
                      () => showToast('No se pudo copiar', 'error')
                    )
                  }
                  className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl border border-slate-700 flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Copy className="w-3.5 h-3.5 text-amber-400" aria-hidden="true" /> Copiar
                </button>
                <a
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  className="py-2 px-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl border border-slate-700 hover:text-white transition-colors"
                  aria-label={`Probar Mesa ${t.label}`}
                  title="Abrir como comensal"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
                <button
                  onClick={() => setStickersTarget(t)}
                  className="py-2 px-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-amber-400 rounded-xl border border-slate-700 transition-colors"
                  aria-label={`Imprimir sticker individual Mesa ${t.label}`}
                  title={`Imprimir sticker de Mesa ${t.label}`}
                >
                  <Printer className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() =>
                    window.confirm(
                      `¿Generar un enlace nuevo para la Mesa ${t.label}? El QR/NFC actual dejará de funcionar.`
                    ) &&
                    act(
                      () => api.regenerateTableToken(t.id),
                      `Nuevo enlace para la Mesa ${t.label}. Reimprime su sticker.`
                    )
                  }
                  className="py-2 px-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl border border-slate-700 hover:text-white transition-colors"
                  aria-label={`Regenerar enlace de la Mesa ${t.label}`}
                  title="Regenerar enlace (invalida el anterior)"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() =>
                    act(
                      () => api.setTableActive(t.id, !t.isActive),
                      t.isActive ? `Mesa ${t.label} desactivada` : `Mesa ${t.label} activada`
                    )
                  }
                  className="py-2 px-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl border border-slate-700 hover:text-white transition-colors"
                  aria-label={t.isActive ? `Desactivar Mesa ${t.label}` : `Activar Mesa ${t.label}`}
                  title={t.isActive ? 'Desactivar' : 'Activar'}
                >
                  <Power className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDeleteTable(t)}
                  className="py-2 px-2.5 bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 rounded-xl border border-slate-700 hover:border-rose-500/40 transition-colors"
                  aria-label={`Eliminar Mesa ${t.label}`}
                  title={`Eliminar Mesa ${t.label}`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* GUÍA EDUCATIVA NFC ORIGINAL */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-amber-950/30 border border-amber-500/30 rounded-3xl p-5 sm:p-6 space-y-3 shadow-xl">
        <h4 className="font-extrabold text-sm sm:text-base text-white flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-amber-400" aria-hidden="true" /> Cómo instalar los tags NFC
        </h4>
        <ol className="grid grid-cols-1 md:grid-cols-3 gap-3.5 text-xs text-slate-300">
          <li className="bg-slate-950/70 p-3.5 rounded-2xl border border-slate-800">
            <strong className="text-amber-400 block mb-1">1. Compra stickers NTAG213/215</strong>
            Cuestan aprox. $1.200 a $1.800 COP cada uno.
          </li>
          <li className="bg-slate-950/70 p-3.5 rounded-2xl border border-slate-800">
            <strong className="text-amber-400 block mb-1">2. Graba el enlace</strong>
            Con la app gratuita NFC Tools: Escribir → Añadir registro → URL, pega el enlace de la mesa y bloquea el tag.
          </li>
          <li className="bg-slate-950/70 p-3.5 rounded-2xl border border-slate-800">
            <strong className="text-amber-400 block mb-1">3. Fija en la mesa</strong>
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
