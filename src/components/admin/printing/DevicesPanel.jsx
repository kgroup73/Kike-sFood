import { useCallback, useEffect, useState } from 'react';
import { Cpu, Copy, KeyRound, Ban, Link2 } from 'lucide-react';
import { useToast } from '../../../hooks/useToast';
import { useNow } from '../../../hooks/useNow';
import { api } from '../../../services/api';

// El agente pregunta cada 2 s: si no aparece en 20 s, se considera desconectado.
const ONLINE_MS = 20000;

function ago(iso, now) {
  const s = Math.max(0, Math.round((now - new Date(iso).getTime()) / 1000));
  if (s < 60) return `hace ${s} s`;
  if (s < 3600) return `hace ${Math.round(s / 60)} min`;
  if (s < 86400) return `hace ${Math.round(s / 3600)} h`;
  return new Date(iso).toLocaleDateString('es-CO');
}

function deviceStatus(d, now) {
  if (d.revokedAt) return { label: 'Revocado', tone: 'text-suave' };
  if (!d.pairedAt) {
    const vigente = d.pairingExpiresAt && new Date(d.pairingExpiresAt).getTime() > now;
    return vigente ? { label: 'Esperando que se instale', tone: 'text-aviso' } : { label: 'Código vencido: genera uno nuevo', tone: 'text-aji' };
  }
  if (d.lastSeenAt && now - new Date(d.lastSeenAt).getTime() < ONLINE_MS) return { label: 'Conectado', tone: 'text-hoja' };
  return { label: `Desconectado · visto ${d.lastSeenAt ? ago(d.lastSeenAt, now) : 'nunca'}`, tone: 'text-aji' };
}

/** El código de vinculación y la línea para instalar el agente en el equipo. */
function PairingCard({ pairing, slug, connection, onClose }) {
  const showToast = useToast();
  const command = `powershell -ExecutionPolicy Bypass -File .\\instalar-windows.ps1 -Restaurante ${slug} -Codigo ${pairing.code} -Servidor ${connection.servidor} -Llave ${connection.llave}`;
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(command);
      showToast('Línea de instalación copiada', 'success');
    } catch {
      showToast('No se pudo copiar: selecciónala y cópiala a mano', 'error');
    }
  };
  return (
    <div role="region" aria-label="Código de vinculación" className="rounded-2xl border-2 border-hoja bg-hoja/5 p-5 space-y-3">
      <p className="font-bold text-[17px]">Código para {pairing.name}</p>
      <p className="precio font-extrabold text-4xl tracking-[0.15em]">{pairing.code}</p>
      <p className="text-suave">
        Vale hasta las {new Date(pairing.expiresAt).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })} y sirve una sola vez. Junto con el código del restaurante (
        <strong className="text-tinta">{slug}</strong>) vincula el equipo.
      </p>
      <ol className="list-decimal pl-5 space-y-1 text-suave">
        <li>En el computador de la impresora, copia la carpeta del agente de Kike's.</li>
        <li>Abre PowerShell como administrador en esa carpeta y pega esta línea:</li>
      </ol>
      <pre className="precio text-xs bg-plato border border-linea rounded-xl p-3 whitespace-pre-wrap break-all">{command}</pre>
      <div className="flex flex-wrap gap-2">
        <button onClick={copy} className="btn btn-sm btn-primary">
          <Copy className="w-4 h-4" aria-hidden="true" /> Copiar la línea
        </button>
        <button onClick={onClose} className="btn btn-sm btn-quiet">Listo</button>
      </div>
      <p className="help">El instalador pide la impresora de cada estación, imprime una prueba y deja el agente arrancando solo con Windows.</p>
    </div>
  );
}

/** Equipos con el agente local: vincular, ver si están conectados, nuevo código, revocar. */
export default function DevicesPanel({ tenant, stations }) {
  const showToast = useToast();
  const now = useNow(5000);
  const connection = api.agentConnection();
  const [devices, setDevices] = useState([]);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ name: 'Computador de la cocina', stationIds: [] });
  const [pairing, setPairing] = useState(null);
  const [busy, setBusy] = useState(null);

  const reload = useCallback(async () => {
    try {
      setDevices(await api.listPrintDevices(tenant.id));
    } catch (err) {
      showToast(err.message, 'error');
    }
  }, [tenant.id, showToast]);

  useEffect(() => {
    if (!connection) return undefined;
    reload();
    const t = setInterval(reload, 10000);
    return () => clearInterval(t);
  }, [connection, reload]);

  const stationNames = (ids) => stations.filter((s) => ids.includes(s.id)).map((s) => s.name).join(', ') || 'ninguna';
  const toggleStation = (id) =>
    setForm((f) => ({ ...f, stationIds: f.stationIds.includes(id) ? f.stationIds.filter((x) => x !== id) : [...f.stationIds, id] }));

  const create = async (e) => {
    e.preventDefault();
    setBusy('crear');
    try {
      const ids = form.stationIds.length ? form.stationIds : stations.map((s) => s.id);
      const r = await api.createPrintDevice({ name: form.name.trim(), stationIds: ids });
      setPairing({ ...r, name: form.name.trim() });
      setAdding(false);
      reload();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setBusy(null);
    }
  };

  const newCode = async (d) => {
    setBusy(d.id);
    try {
      setPairing({ ...(await api.newPairingCode(d.id)), name: d.name });
      reload();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setBusy(null);
    }
  };

  const revoke = async (d) => {
    if (!window.confirm(`¿Revocar ${d.name}? Deja de imprimir de inmediato y habrá que vincularlo de nuevo.`)) return;
    setBusy(d.id);
    try {
      await api.revokePrintDevice(d.id);
      showToast(`${d.name} revocado`, 'success');
      reload();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setBusy(null);
    }
  };

  return (
    <section aria-labelledby="equipos" className="space-y-3">
      <h2 id="equipos" className="block-title flex items-center gap-2">
        <Cpu className="w-5 h-5 text-suave" aria-hidden="true" /> Equipos de impresión
      </h2>
      <p className="text-suave leading-snug max-w-2xl">
        El agente de Kike's se instala una vez en el computador conectado a la impresora. Imprime solo, sin vista previa y sin abrir el navegador, y arranca con Windows.
      </p>

      {!connection ? (
        <div className="surface p-5 text-suave">
          Los equipos de impresión se conectan a la versión en la nube. En la demo, usa la opción <strong className="text-tinta">Este navegador imprime</strong> de abajo.
        </div>
      ) : (
        <>
          {pairing && <PairingCard pairing={pairing} slug={tenant.slug} connection={connection} onClose={() => setPairing(null)} />}

          <ul className="surface divide-y divide-linea overflow-hidden">
            {devices.map((d) => {
              const st = deviceStatus(d, now);
              return (
                <li key={d.id} className="px-5 py-4 flex flex-wrap items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-[17px]">{d.name}</p>
                    <p className="text-sm text-suave">Estaciones: {stationNames(d.stationIds)}{d.agentVersion ? ` · agente ${d.agentVersion}` : ''}</p>
                    <p className={`text-sm font-bold ${st.tone}`}>{st.label}</p>
                  </div>
                  <button disabled={busy === d.id} onClick={() => newCode(d)} className="btn btn-sm btn-quiet">
                    <KeyRound className="w-4 h-4" aria-hidden="true" /> Nuevo código
                  </button>
                  {!d.revokedAt && (
                    <button disabled={busy === d.id} onClick={() => revoke(d)} className="btn btn-sm btn-quiet hover:!text-aji">
                      <Ban className="w-4 h-4" aria-hidden="true" /> Revocar
                    </button>
                  )}
                </li>
              );
            })}
            <li className="px-5 py-4">
              {adding ? (
                <form onSubmit={create} className="space-y-3">
                  <label className="block">
                    <span className="label">Nombre del equipo</span>
                    <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} maxLength={40} className="field" required />
                  </label>
                  <fieldset className="space-y-1.5">
                    <legend className="label">Estaciones que imprime (sin marcar: todas)</legend>
                    {stations.map((s) => (
                      <label key={s.id} className="flex items-center gap-2">
                        <input type="checkbox" checked={form.stationIds.includes(s.id)} onChange={() => toggleStation(s.id)} />
                        {s.name}
                      </label>
                    ))}
                  </fieldset>
                  <div className="flex gap-2">
                    <button disabled={busy === 'crear' || !form.name.trim()} className="btn btn-sm btn-primary">
                      {busy === 'crear' ? 'Creando…' : 'Crear y ver el código'}
                    </button>
                    <button type="button" onClick={() => setAdding(false)} className="btn btn-sm btn-quiet">Cancelar</button>
                  </div>
                </form>
              ) : (
                <button onClick={() => setAdding(true)} className="btn btn-sm btn-primary">
                  <Link2 className="w-4 h-4" aria-hidden="true" /> Vincular un equipo
                </button>
              )}
            </li>
          </ul>
        </>
      )}
    </section>
  );
}
