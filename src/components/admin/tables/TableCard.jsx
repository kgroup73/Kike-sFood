import { Radio, Copy, ExternalLink, Printer, RefreshCw, Power, Trash2 } from 'lucide-react';
import { tableUrl } from '../tableLinks';
import { api } from '../../../services/api';
import { useToast } from '../../../hooks/useToast';

/**
 * Ficha de control individual de una mesa del restaurante.
 * Mantiene intactas las acciones de token, copia, impresión de stickers y estado activo.
 */
export default function TableCard({
  table: t,
  tenant,
  environments = [],
  layoutOf,
  updateTableEnvironment,
  handleDeleteTable,
  setStickersTarget,
  load
}) {
  const showToast = useToast();
  const url = tableUrl(tenant.slug, t.token);
  const currentZoneId = layoutOf(t).zone;

  const act = async (fn, ok) => {
    try {
      await fn();
      await load();
      if (ok) showToast(ok, 'success');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  return (
    <div
      className={`bg-plato border rounded-2xl p-4 space-y-3 shadow-sm transition-all ${
        t.isActive ? 'border-linea hover:border-linea/80' : 'border-linea/60 opacity-60'
      }`}
    >
      <div className="flex justify-between items-center pb-2 border-b border-linea">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-mantel text-tinta font-display font-extrabold flex items-center justify-center text-xs border border-linea shadow-sm">
            #{t.label}
          </div>
          <div>
            <h4 className="font-display font-bold text-tinta text-xs sm:text-sm">
              Mesa {t.label}
            </h4>
            <span className="text-[10px] text-suave flex items-center gap-1 font-medium">
              <Radio className="w-2.5 h-2.5 text-hoja" aria-hidden="true" /> NFC NTAG213/215 · QR
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Selector rápido de ambiente */}
          <select
            value={currentZoneId}
            onChange={(e) => updateTableEnvironment(t.id, t.label, e.target.value)}
            className="bg-mantel border border-linea rounded-lg px-2 py-0.5 text-[10px] font-semibold text-tinta focus:outline-none focus:border-hoja"
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
                ? 'bg-hoja/10 text-hoja border-hoja/20'
                : 'bg-mantel text-suave border-linea'
            }`}
          >
            {t.isActive ? 'Activa' : 'Inactiva'}
          </span>
        </div>
      </div>

      {/* Caja de enlace monocromático select-all */}
      <div
        className="bg-mantel p-2 rounded-xl border border-linea text-[11px] text-suave font-mono truncate select-all"
        title={url}
      >
        {url}
      </div>

      {/* Botonera de acciones con tokens dinámicos */}
      <div className="flex items-center gap-1.5 text-xs">
        <button
          onClick={() =>
            navigator.clipboard?.writeText(url).then(
              () => showToast(`Enlace de la Mesa ${t.label} copiado 📋`),
              () => showToast('No se pudo copiar', 'error')
            )
          }
          className="flex-1 py-1.5 bg-mantel hover:bg-linea/60 text-tinta font-bold rounded-xl border border-linea flex items-center justify-center gap-1.5 transition-colors"
        >
          <Copy className="w-3.5 h-3.5 text-hoja" aria-hidden="true" /> Copiar
        </button>
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="py-1.5 px-2 bg-mantel hover:bg-linea/60 text-tinta rounded-xl border border-linea transition-colors"
          aria-label={`Probar Mesa ${t.label}`}
          title="Abrir como comensal"
        >
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
        <button
          onClick={() => setStickersTarget(t)}
          className="py-1.5 px-2 bg-mantel hover:bg-linea/60 text-tinta hover:text-hoja rounded-xl border border-linea transition-colors"
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
          className="py-1.5 px-2 bg-mantel hover:bg-linea/60 text-tinta rounded-xl border border-linea transition-colors"
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
          className="py-1.5 px-2 bg-mantel hover:bg-linea/60 text-tinta rounded-xl border border-linea transition-colors"
          aria-label={t.isActive ? `Desactivar Mesa ${t.label}` : `Activar Mesa ${t.label}`}
          title={t.isActive ? 'Desactivar' : 'Activar'}
        >
          <Power className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => handleDeleteTable(t)}
          className="py-1.5 px-2 bg-mantel hover:bg-aji/10 text-suave hover:text-aji rounded-xl border border-linea hover:border-aji/30 transition-colors"
          aria-label={`Eliminar Mesa ${t.label}`}
          title={`Eliminar Mesa ${t.label}`}
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
