import { useCallback, useEffect, useState } from 'react';
import { Smartphone, Printer, Copy, ExternalLink, RefreshCw, Plus, Zap, Sparkles, Power } from 'lucide-react';
import { useTenant } from '../../hooks/useTenant';
import { useToast } from '../../hooks/useToast';
import { api } from '../../services/api';
import { InlineError } from '../ui/Screens';
import AdminShell from './AdminShell';
import TableStickersModal from './TableStickersModal';
import { tableUrl } from './tableLinks';

// Estilo original del campo (oscuro), para conservar el mosaico tal como estaba.
const fieldClass = 'w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white text-xs focus:outline-none focus:border-orange-500 disabled:opacity-60';

export default function TablesAdmin() {
  const { tenant } = useTenant();
  const showToast = useToast();
  const [tables, setTables] = useState([]);
  const [error, setError] = useState(null);
  const [stickers, setStickers] = useState(false);
  const [newLabel, setNewLabel] = useState('');

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

  const addTables = (e) => {
    e.preventDefault();
    const labels = newLabel.split(',').map((s) => s.trim()).filter(Boolean);
    if (!labels.length) return;
    act(() => api.createTables(tenant.id, labels), labels.length === 1 ? `Mesa ${labels[0]} creada` : `${labels.length} mesas creadas`).then((done) => done && setNewLabel(''));
  };

  const activeTables = tables.filter((t) => t.isActive);

  return (
    <AdminShell
      title="Mesas, tags NFC y códigos QR"
      subtitle="Cada mesa tiene un enlace con un token secreto: sin él no se puede pedir."
      icon={<Smartphone className="w-5 h-5 text-amber-400" aria-hidden="true" />}
      actions={
        <button
          onClick={() => setStickers(true)}
          disabled={!activeTables.length}
          className="px-3.5 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 active:scale-95 text-slate-950 font-black rounded-xl flex items-center gap-1.5 shadow-md transition-all disabled:opacity-40"
        >
          <Printer className="w-4 h-4" aria-hidden="true" /> Imprimir stickers (NFC + QR)
        </button>
      }
    >
      {error && <InlineError message={error} onRetry={load} />}

      <form onSubmit={addTables} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row gap-2 sm:items-end">
        <label className="flex-1 text-xs text-slate-400">
          Agregar mesas (separa con comas: <code>13, 14, Terraza-1</code>)
          <input value={newLabel} onChange={(e) => setNewLabel(e.target.value)} className={`${fieldClass} mt-1`} placeholder="Etiqueta de la mesa" />
        </label>
        <button className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl border border-slate-700 flex items-center gap-1.5 justify-center">
          <Plus className="w-4 h-4" aria-hidden="true" /> Agregar
        </button>
      </form>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {tables.map((t) => {
          const url = tableUrl(tenant.slug, t.token);
          return (
            <div key={t.id} className={`bg-slate-900 border rounded-2xl p-4 space-y-3 shadow-md ${t.isActive ? 'border-slate-800 hover:border-amber-500/50' : 'border-slate-800/60 opacity-60'}`}>
              <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 font-black flex items-center justify-center text-xs border border-amber-500/30">#{t.label}</div>
                  <div>
                    <h4 className="font-bold text-white text-xs sm:text-sm">Mesa {t.label}</h4>
                    <span className="text-[10px] text-slate-400 flex items-center gap-1"><Zap className="w-2.5 h-2.5 text-amber-400" aria-hidden="true" /> NFC NTAG213 / QR</span>
                  </div>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${t.isActive ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-slate-800 text-slate-400 border-slate-700'}`}>
                  {t.isActive ? 'Activa' : 'Inactiva'}
                </span>
              </div>
              <div className="bg-slate-950 p-2 rounded-xl border border-slate-800 text-[10px] text-slate-400 font-mono truncate select-all" title={url}>{url}</div>
              <div className="flex items-center gap-1.5 text-xs">
                <button
                  onClick={() => navigator.clipboard?.writeText(url).then(() => showToast(`Enlace de la Mesa ${t.label} copiado 📋`), () => showToast('No se pudo copiar', 'error'))}
                  className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl border border-slate-700 flex items-center justify-center gap-1.5"
                >
                  <Copy className="w-3.5 h-3.5 text-amber-400" aria-hidden="true" /> Copiar
                </button>
                <a href={url} target="_blank" rel="noreferrer" className="py-2 px-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl border border-slate-700" aria-label={`Probar Mesa ${t.label}`} title="Abrir como comensal">
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
                <button
                  onClick={() => window.confirm(`¿Generar un enlace nuevo para la Mesa ${t.label}? El QR/NFC actual dejará de funcionar.`) && act(() => api.regenerateTableToken(t.id), `Nuevo enlace para la Mesa ${t.label}. Reimprime su sticker.`)}
                  className="py-2 px-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl border border-slate-700"
                  aria-label={`Regenerar enlace de la Mesa ${t.label}`}
                  title="Regenerar enlace (invalida el anterior)"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => act(() => api.setTableActive(t.id, !t.isActive), t.isActive ? `Mesa ${t.label} desactivada` : `Mesa ${t.label} activada`)}
                  className="py-2 px-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl border border-slate-700"
                  aria-label={t.isActive ? `Desactivar Mesa ${t.label}` : `Activar Mesa ${t.label}`}
                  title={t.isActive ? 'Desactivar' : 'Activar'}
                >
                  <Power className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-amber-950/30 border border-amber-500/30 rounded-3xl p-5 sm:p-6 space-y-3 shadow-xl">
        <h4 className="font-extrabold text-sm sm:text-base text-white flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-amber-400" aria-hidden="true" /> Cómo instalar los tags NFC
        </h4>
        <ol className="grid grid-cols-1 md:grid-cols-3 gap-3.5 text-xs text-slate-300">
          <li className="bg-slate-950/70 p-3.5 rounded-2xl border border-slate-800"><strong className="text-amber-400 block mb-1">1. Compra stickers NTAG213/215</strong>Cuestan aprox. $1.200 a $1.800 COP cada uno.</li>
          <li className="bg-slate-950/70 p-3.5 rounded-2xl border border-slate-800"><strong className="text-amber-400 block mb-1">2. Graba el enlace</strong>Con la app gratuita NFC Tools: Escribir → Añadir registro → URL, pega el enlace de la mesa y bloquea el tag.</li>
          <li className="bg-slate-950/70 p-3.5 rounded-2xl border border-slate-800"><strong className="text-amber-400 block mb-1">3. Fija en la mesa</strong>Si un enlace se filtra, usa "Regenerar" y vuelve a grabar ese tag.</li>
        </ol>
      </div>

      {stickers && <TableStickersModal tenant={tenant} tables={activeTables} onClose={() => setStickers(false)} />}
    </AdminShell>
  );
}
