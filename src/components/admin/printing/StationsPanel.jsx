import { useState } from 'react';
import { Layers, Plus, Printer, Pencil, Trash2, Receipt, Star } from 'lucide-react';
import { useToast } from '../../../hooks/useToast';
import { api } from '../../../services/api';

/** Formulario corto de una estación (crear o editar). */
function StationForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      await onSave(form);
    } finally {
      setSaving(false);
    }
  };
  return (
    <form onSubmit={submit} className="space-y-3">
      <label className="block">
        <span className="label">Nombre de la estación</span>
        <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} maxLength={40} placeholder="Ej: Barra, Parrilla, Caja" className="field" autoFocus />
      </label>
      <label className="flex items-start gap-2">
        <input type="checkbox" checked={form.isDefault} onChange={(e) => setForm({ ...form, isDefault: e.target.checked })} className="mt-1" />
        <span>Por defecto: recibe los platos de las categorías sin estación</span>
      </label>
      <label className="flex items-start gap-2">
        <input type="checkbox" checked={form.printsReceipts} onChange={(e) => setForm({ ...form, printsReceipts: e.target.checked })} className="mt-1" />
        <span>Imprime los tiquetes de caja</span>
      </label>
      <div className="flex gap-2">
        <button disabled={saving} className="btn btn-sm btn-primary">{saving ? 'Guardando…' : 'Guardar'}</button>
        <button type="button" onClick={onCancel} className="btn btn-sm btn-quiet">Cancelar</button>
      </div>
    </form>
  );
}

/**
 * Estaciones de impresión del restaurante y qué categoría de la carta va a cada una.
 * La comanda de una mesa se reparte: cada estación recibe solo sus platos.
 */
export default function StationsPanel({ stations, categories, reload }) {
  const showToast = useToast();
  const [editing, setEditing] = useState(null); // id | 'nueva' | null
  const [busy, setBusy] = useState(null);
  const fallback = stations.find((s) => s.isDefault);

  const run = async (key, fn, ok) => {
    setBusy(key);
    try {
      await fn();
      if (ok) showToast(ok, 'success');
      await reload();
      return true;
    } catch (err) {
      showToast(err.message, 'error');
      return false;
    } finally {
      setBusy(null);
    }
  };

  const save = async (form) => {
    const done = await run('save', () => api.savePrintStation(form), form.id ? 'Estación guardada' : `Estación ${form.name.trim()} creada`);
    if (done) setEditing(null);
  };

  return (
    <section aria-labelledby="estaciones" className="space-y-3">
      <h2 id="estaciones" className="block-title flex items-center gap-2">
        <Layers className="w-5 h-5 text-suave" aria-hidden="true" /> Estaciones de impresión
      </h2>
      <p className="text-suave leading-snug max-w-2xl">
        Cada estación es un lugar donde sale papel: la cocina, la barra, la caja. Una comanda se reparte entre estaciones y cada una recibe solo sus platos.
      </p>

      <ul className="surface divide-y divide-linea overflow-hidden">
        {stations.map((s) => (
          <li key={s.id} className="px-5 py-4">
            {editing === s.id ? (
              <StationForm initial={s} onSave={save} onCancel={() => setEditing(null)} />
            ) : (
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-[17px]">{s.name}</p>
                  <p className="flex flex-wrap gap-2 mt-1">
                    {s.isDefault && (
                      <span className="chip chip-pendiente h-6 text-xs">
                        <Star className="w-3 h-3" aria-hidden="true" /> Por defecto
                      </span>
                    )}
                    {s.printsReceipts && (
                      <span className="chip chip-cobrar h-6 text-xs">
                        <Receipt className="w-3 h-3" aria-hidden="true" /> Tiquetes de caja
                      </span>
                    )}
                  </p>
                </div>
                <button disabled={busy === `t${s.id}`} onClick={() => run(`t${s.id}`, () => api.printTest(s.id), `Prueba enviada a ${s.name}`)} className="btn btn-sm btn-quiet">
                  <Printer className="w-4 h-4" aria-hidden="true" /> Probar
                </button>
                <button onClick={() => setEditing(s.id)} className="icon-btn" aria-label={`Editar la estación ${s.name}`}>
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  disabled={stations.length <= 1 || busy === `d${s.id}`}
                  onClick={() => window.confirm(`¿Eliminar la estación ${s.name}? Sus categorías pasan a la estación por defecto.`) && run(`d${s.id}`, () => api.deletePrintStation(s.id), 'Estación eliminada')}
                  className="icon-btn hover:!text-aji disabled:opacity-40"
                  aria-label={`Eliminar la estación ${s.name}`}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </li>
        ))}
        <li className="px-5 py-4">
          {editing === 'nueva' ? (
            <StationForm initial={{ id: null, name: '', isDefault: false, printsReceipts: false }} onSave={save} onCancel={() => setEditing(null)} />
          ) : (
            <button onClick={() => setEditing('nueva')} className="btn btn-sm btn-quiet">
              <Plus className="w-4 h-4" aria-hidden="true" /> Agregar estación
            </button>
          )}
        </li>
      </ul>

      {categories.length > 0 && (
        <div className="surface p-5 space-y-3">
          <p className="font-bold text-[17px]">Qué imprime cada estación</p>
          <ul className="divide-y divide-linea">
            {categories.map((c) => (
              <li key={c.id} className="py-2.5 flex flex-wrap items-center justify-between gap-3">
                <span className="font-bold">{c.name}</span>
                <select
                  aria-label={`Estación de la categoría ${c.name}`}
                  value={c.printStationId || ''}
                  disabled={busy === `c${c.id}`}
                  onChange={(e) => run(`c${c.id}`, () => api.setCategoryStation(c.id, e.target.value || null))}
                  className="field !w-auto min-w-[14rem]"
                >
                  <option value="">Por defecto{fallback ? ` (${fallback.name})` : ' (no se imprime)'}</option>
                  {stations.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
