import { useCallback, useEffect, useState } from 'react';
import { MonitorSmartphone, Globe, Check } from 'lucide-react';
import { useTenant } from '../../hooks/useTenant';
import { useToast } from '../../hooks/useToast';
import { usePrinterDevice } from '../../hooks/useOrderPrinter';
import { api } from '../../services/api';
import AdminShell from './AdminShell';
import StationsPanel from './printing/StationsPanel';
import DevicesPanel from './printing/DevicesPanel';

const MODES = [
  {
    value: true,
    title: 'Con pantalla de cocina',
    text: 'Una tablet o pantalla en la cocina muestra el riel de comandas. La cocina las toma, las marca listas y las despacha con un toque.'
  },
  {
    value: false,
    title: 'Sin pantalla: comandas impresas',
    text: 'La cocina trabaja con la comanda en papel. El mesero o la caja cierran cada comanda desde la sección Comandas.'
  }
];

function Switch({ checked, onChange, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative w-14 h-8 rounded-full shrink-0 transition-colors ${checked ? 'bg-hoja' : 'bg-linea'}`}
    >
      <span className={`absolute top-1 left-1 w-6 h-6 rounded-full bg-plato shadow transition-transform ${checked ? 'translate-x-6' : ''}`} />
    </button>
  );
}

export default function KitchenSettings() {
  const { tenant, reload } = useTenant();
  const showToast = useToast();
  const [saving, setSaving] = useState(false);
  const [isPrinter, setPrinter] = usePrinterDevice(tenant.id);
  const [stations, setStations] = useState([]);
  const [categories, setCategories] = useState([]);
  const display = tenant.kitchenDisplay !== false;
  const loginUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/staff/${tenant.slug}/login`;

  const reloadPrinting = useCallback(async () => {
    try {
      const [st, menu] = await Promise.all([
        (api.listPrintStations ? api.listPrintStations(tenant.id) : Promise.resolve([])).catch(() => []),
        api.getMenu(tenant.id)
      ]);
      setStations(st || []);
      setCategories(menu?.categories || []);
    } catch (err) {
      showToast(err.message, 'error');
    }
  }, [tenant.id, showToast]);

  useEffect(() => {
    reloadPrinting();
  }, [reloadPrinting]);

  const setMode = async (value) => {
    if (value === display || saving) return;
    setSaving(true);
    try {
      await api.updateTenant(tenant.id, { ...tenant, kitchenDisplay: value });
      await reload();
      showToast(value ? 'Pantalla de cocina activada' : 'La cocina trabajará con comandas impresas', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminShell title="Cocina e impresión" subtitle="Cómo recibe la cocina las comandas, dónde sale cada plato y qué equipo imprime.">
      <div className="space-y-10 max-w-3xl">
        <section aria-labelledby="modo-cocina" className="space-y-3">
          <h2 id="modo-cocina" className="block-title flex items-center gap-2">
            <MonitorSmartphone className="w-5 h-5 text-suave" aria-hidden="true" /> Pantalla de cocina
          </h2>
          <div role="radiogroup" aria-labelledby="modo-cocina" className="grid sm:grid-cols-2 gap-3">
            {MODES.map((m) => {
              const on = m.value === display;
              return (
                <button
                  key={String(m.value)}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  disabled={saving}
                  onClick={() => setMode(m.value)}
                  className={`text-left rounded-2xl p-5 border-2 transition-colors ${on ? 'border-hoja bg-hoja/5' : 'border-linea bg-plato hover:border-suave'}`}
                >
                  <span className="flex items-center justify-between gap-2 font-bold text-[17px]">
                    {m.title}
                    {on && <Check className="w-5 h-5 text-hoja" aria-hidden="true" />}
                  </span>
                  <span className="mt-1 block text-suave leading-snug">{m.text}</span>
                </button>
              );
            })}
          </div>
          <p className="help">Los demás equipos ven el cambio al recargar el panel. Con o sin pantalla, las comandas se imprimen si hay un equipo de impresión.</p>
        </section>

        <StationsPanel stations={stations} categories={categories} reload={reloadPrinting} />

        <DevicesPanel tenant={tenant} stations={stations} />

        <section aria-labelledby="navegador" className="space-y-3">
          <h2 id="navegador" className="block-title flex items-center gap-2">
            <Globe className="w-5 h-5 text-suave" aria-hidden="true" /> Imprimir desde este navegador
          </h2>
          <div className="surface p-5 space-y-4">
            <div className="flex items-start gap-4">
              <div className="flex-1">
                <p className="font-bold text-[17px]">Este navegador imprime</p>
                <p className="text-suave leading-snug">
                  Respaldo si no instalaste el agente: mientras el panel esté abierto aquí, este navegador imprime los trabajos de todas las estaciones en su impresora predeterminada.
                </p>
              </div>
              <Switch checked={isPrinter} onChange={setPrinter} label="Este navegador imprime" />
            </div>
            <details className="text-suave">
              <summary className="cursor-pointer font-bold text-tinta">Para que imprima sin vista previa</summary>
              <div className="mt-3 space-y-2">
                <p>Abre el panel con un acceso directo de Google Chrome que tenga, al final de Destino:</p>
                <pre className="precio text-sm bg-mantel border border-linea rounded-xl p-3 overflow-x-auto whitespace-pre-wrap break-all">--kiosk-printing {loginUrl}</pre>
                <p>Cierra Chrome por completo antes de abrirlo con ese acceso directo. Con el agente instalado no hace falta nada de esto.</p>
              </div>
            </details>
          </div>
        </section>
      </div>
    </AdminShell>
  );
}
