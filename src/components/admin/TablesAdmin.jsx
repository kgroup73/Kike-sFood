import { useCallback, useEffect, useState } from 'react';
import { Printer, Copy, ExternalLink, RefreshCw, Plus, Power } from 'lucide-react';
import { useTenant } from '../../hooks/useTenant';
import { useToast } from '../../hooks/useToast';
import { api } from '../../services/api';
import { InlineError } from '../ui/Screens';
import AdminShell, { fieldClass } from './AdminShell';
import TableStickersModal from './TableStickersModal';
import { tableUrl } from './tableLinks';

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
      title="Mesas y códigos QR"
      subtitle="Cada mesa tiene un enlace con un token secreto: sin él se puede ver la carta, pero no pedir."
      actions={
        <button onClick={() => setStickers(true)} disabled={!activeTables.length} className="btn btn-dark">
          <Printer className="w-4 h-4" aria-hidden="true" /> Imprimir stickers
        </button>
      }
    >
      {error && <InlineError message={error} onRetry={load} />}

      <form onSubmit={addTables} className="flex flex-col sm:flex-row gap-3 sm:items-end max-w-3xl">
        <label className="flex-1 block">
          <span className="label">Agregar mesas</span>
          <input value={newLabel} onChange={(e) => setNewLabel(e.target.value)} className={fieldClass} placeholder="Ej: 13, 14, Terraza-1" />
          <span className="help">Separa varias con comas.</span>
        </label>
        <button className="btn btn-quiet sm:mb-[26px]">
          <Plus className="w-4 h-4" aria-hidden="true" /> Agregar
        </button>
      </form>

      <ul className="surface divide-y divide-linea overflow-hidden">
        {tables.map((t) => {
          const url = tableUrl(tenant.slug, t.token);
          return (
            <li key={t.id} className={`flex flex-wrap lg:flex-nowrap items-center gap-x-5 gap-y-3 px-5 py-4 ${t.isActive ? '' : 'opacity-60'}`}>
              <div className="w-24 shrink-0">
                <p className="text-sm text-suave leading-none">Mesa</p>
                <p className="precio font-extrabold text-3xl leading-tight">{t.label}</p>
              </div>
              <div className="flex-1 min-w-0 basis-60">
                <p className="text-sm text-suave truncate select-all" title={url}>
                  {url}
                </p>
                {!t.isActive && <span className="text-xs font-bold px-1.5 py-0.5 rounded bg-linea">Inactiva</span>}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => navigator.clipboard?.writeText(url).then(() => showToast(`Enlace de la mesa ${t.label} copiado`), () => showToast('No se pudo copiar el enlace', 'error'))}
                  className="btn btn-sm btn-quiet mr-1"
                >
                  <Copy className="w-4 h-4" aria-hidden="true" /> Copiar enlace
                </button>
                <a href={url} target="_blank" rel="noreferrer" className="icon-btn" aria-label={`Abrir la carta de la mesa ${t.label}`} title="Abrir como comensal">
                  <ExternalLink className="w-5 h-5" />
                </a>
                <button
                  onClick={() => window.confirm(`¿Generar un enlace nuevo para la mesa ${t.label}? El QR/NFC actual dejará de funcionar.`) && act(() => api.regenerateTableToken(t.id), `Nuevo enlace para la mesa ${t.label}. Reimprime su sticker.`)}
                  className="icon-btn"
                  aria-label={`Regenerar enlace de la mesa ${t.label}`}
                  title="Regenerar enlace (invalida el anterior)"
                >
                  <RefreshCw className="w-5 h-5" />
                </button>
                <button
                  onClick={() => act(() => api.setTableActive(t.id, !t.isActive), t.isActive ? `Mesa ${t.label} desactivada` : `Mesa ${t.label} activada`)}
                  className="icon-btn"
                  aria-label={t.isActive ? `Desactivar mesa ${t.label}` : `Activar mesa ${t.label}`}
                  title={t.isActive ? 'Desactivar' : 'Activar'}
                >
                  <Power className="w-5 h-5" />
                </button>
              </div>
            </li>
          );
        })}
      </ul>

      <section className="space-y-4 max-w-4xl">
        <h2 className="block-title">Cómo instalar las etiquetas NFC</h2>
        <ol className="grid md:grid-cols-3 gap-6">
          {[
            ['Compra etiquetas NTAG213 o 215', 'Cuestan entre $1.200 y $1.800 cada una.'],
            ['Graba el enlace', 'Con la app gratuita NFC Tools: Escribir → Añadir registro → URL. Pega el enlace de la mesa y bloquea la etiqueta.'],
            ['Pégala en la mesa', 'Si un enlace se filtra, usa Regenerar y vuelve a grabar esa etiqueta.']
          ].map(([title, text], i) => (
            <li key={title} className="flex gap-3">
              <span className="precio font-extrabold text-3xl leading-none text-hoja">{i + 1}</span>
              <span>
                <span className="block font-bold">{title}</span>
                <span className="block text-suave leading-relaxed">{text}</span>
              </span>
            </li>
          ))}
        </ol>
      </section>

      {stickers && <TableStickersModal tenant={tenant} tables={activeTables} onClose={() => setStickers(false)} />}
    </AdminShell>
  );
}
