import { useState } from 'react';
import { Database } from 'lucide-react';
import { useTenant } from '../../hooks/useTenant';
import { useToast } from '../../hooks/useToast';
import { api, isDemoMode } from '../../services/api';
import { TAX_TYPES } from '../../lib/billing';
import AdminShell, { fieldClass, labelClass, primaryButton } from './AdminShell';

const FIELDS = [
  ['name', 'Razón social'],
  ['nit', 'NIT (con DV)'],
  ['address', 'Dirección'],
  ['city', 'Ciudad'],
  ['phone', 'Teléfono'],
  ['email', 'Correo de facturación']
];

export default function CompanySettings() {
  const { tenant, reload } = useTenant();
  const showToast = useToast();
  const [form, setForm] = useState(tenant);
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const save = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return showToast('La razón social es obligatoria', 'error');
    setSaving(true);
    try {
      await api.updateTenant(tenant.id, form);
      await reload();
      showToast('Datos de la empresa guardados', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminShell title="Datos de la empresa" subtitle="Aparecen en los comprobantes y definen cómo se calculan el impuesto y la propina.">
      <form onSubmit={save} className="surface p-5 sm:p-8 space-y-6 max-w-3xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-5">
          <div>
            <span className={labelClass}>Código del restaurante (URL)</span>
            <input value={tenant.slug} disabled className={fieldClass} />
            <span className="help">Lo asigna la plataforma. La carta queda en /r/{tenant.slug}</span>
          </div>
          {FIELDS.map(([key, label]) => (
            <label key={key} className="block">
              <span className={labelClass}>{label}</span>
              <input value={form[key] || ''} onChange={(e) => set(key, e.target.value)} className={fieldClass} />
            </label>
          ))}
          <label className="block">
            <span className={labelClass}>Impuesto</span>
            <select
              value={form.taxType}
              onChange={(e) => setForm((f) => ({ ...f, taxType: e.target.value, taxRate: TAX_TYPES[e.target.value].defaultRate }))}
              className={fieldClass}
            >
              {Object.entries(TAX_TYPES).map(([k, t]) => (
                <option key={k} value={k}>{t.label}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className={labelClass}>Tarifa del impuesto (%)</span>
            <input type="number" min="0" max="100" step="0.01" disabled={form.taxType === 'NINGUNO'} value={form.taxType === 'NINGUNO' ? 0 : form.taxRate} onChange={(e) => set('taxRate', e.target.value)} className={fieldClass} />
            <span className="help">Los precios de la carta ya lo incluyen; el tiquete lo desglosa.</span>
          </label>
          <label className="block">
            <span className={labelClass}>Propina sugerida (%)</span>
            <input type="number" min="0" max="10" value={form.tipRate} onChange={(e) => set('tipRate', e.target.value)} className={fieldClass} />
            <span className="help">Voluntaria y máximo 10 % (Ley 1935). La caja la confirma con el cliente al cobrar.</span>
          </label>
          <label className="block sm:col-span-2">
            <span className={labelClass}>Pie de página del tiquete</span>
            <input value={form.footerText || ''} onChange={(e) => set('footerText', e.target.value)} className={fieldClass} />
          </label>
        </div>

        <div className="border-l-4 border-linea pl-4 space-y-1">
          <span className="font-bold flex items-center gap-2">
            <Database className="w-4 h-4 text-suave" aria-hidden="true" /> Base de datos
          </span>
          <p className="text-sm text-suave leading-relaxed">
            {isDemoMode
              ? 'Modo demo: los datos viven solo en este navegador. Configura VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY para usar la nube.'
              : 'Conectado a Supabase. Pedidos, inventario y caja se sincronizan en tiempo real entre dispositivos.'}
          </p>
        </div>

        <button disabled={saving} className={primaryButton}>{saving ? 'Guardando…' : 'Guardar cambios'}</button>
      </form>
    </AdminShell>
  );
}
