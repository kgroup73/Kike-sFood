import { useEffect, useState } from 'react';
import { ShieldCheck, AlertTriangle } from 'lucide-react';
import { useTenant } from '../../hooks/useTenant';
import { useToast } from '../../hooks/useToast';
import { api } from '../../services/api';
import { hasFeature } from '../../lib/plans';
import { InlineError } from '../ui/Screens';
import AdminShell, { fieldClass, labelClass, primaryButton } from './AdminShell';

const PROVIDERS = [
  { value: 'simulado', label: 'Simulado (sin validez fiscal)' },
  { value: 'factus', label: 'Factus — próximamente', disabled: true },
  { value: 'siigo', label: 'Siigo — próximamente', disabled: true }
];

const blankSequence = (kind) => ({
  kind,
  prefix: kind === 'pos' ? 'POS' : 'FE',
  nextNumber: 1,
  rangeFrom: 1,
  rangeTo: '',
  resolutionNumber: '',
  resolutionDate: '',
  validUntil: ''
});

function SequenceFields({ seq, onChange, electronic }) {
  const set = (k, v) => onChange({ ...seq, [k]: v });
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      <label className="block"><span className={labelClass}>Prefijo</span><input value={seq.prefix} maxLength={6} onChange={(e) => set('prefix', e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))} className={`${fieldClass} font-mono`} /></label>
      <label className="block"><span className={labelClass}>Rango desde</span><input type="number" min="1" value={seq.rangeFrom} onChange={(e) => set('rangeFrom', e.target.value)} className={fieldClass} /></label>
      <label className="block"><span className={labelClass}>Rango hasta {electronic ? '' : '(opcional)'}</span><input type="number" min="1" value={seq.rangeTo ?? ''} onChange={(e) => set('rangeTo', e.target.value)} className={fieldClass} /></label>
      <label className="block"><span className={labelClass}>Próximo número</span><input type="number" min="1" value={seq.nextNumber} onChange={(e) => set('nextNumber', e.target.value)} className={fieldClass} /></label>
      {electronic && (
        <>
          <label className="block"><span className={labelClass}>Nº resolución</span><input value={seq.resolutionNumber} onChange={(e) => set('resolutionNumber', e.target.value)} className={fieldClass} /></label>
          <label className="block"><span className={labelClass}>Fecha resolución</span><input type="date" value={seq.resolutionDate} onChange={(e) => set('resolutionDate', e.target.value)} className={fieldClass} /></label>
          <label className="block"><span className={labelClass}>Vigente hasta</span><input type="date" value={seq.validUntil} onChange={(e) => set('validUntil', e.target.value)} className={fieldClass} /></label>
        </>
      )}
    </div>
  );
}

export default function BillingSettings() {
  const { tenant } = useTenant();
  const showToast = useToast();
  const [form, setForm] = useState(null);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const canDian = hasFeature(tenant.plan, 'dian');

  useEffect(() => {
    api
      .getBillingSettings(tenant.id)
      .then((s) => {
        const pos = s.sequences.find((x) => x.kind === 'pos') || blankSequence('pos');
        const fe = s.sequences.find((x) => x.kind === 'electronica') || blankSequence('electronica');
        setForm({ provider: s.provider, environment: s.environment, pos, fe });
      })
      .catch((err) => setError(err.message));
  }, [tenant.id]);

  const save = async (e) => {
    e.preventDefault();
    const sequences = [form.pos];
    if (canDian && form.fe.prefix) sequences.push(form.fe);
    setSaving(true);
    try {
      await api.saveBillingSettings(tenant.id, { provider: form.provider, environment: form.environment, sequences });
      showToast('Configuración de facturación guardada', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const expired = form?.fe.validUntil && new Date(`${form.fe.validUntil}T23:59:59`) < new Date();

  return (
    <AdminShell title="Facturación" icon={<ShieldCheck className="w-4 h-4 text-emerald-400" aria-hidden="true" />} subtitle="Numeración de tiquetes POS y factura electrónica">
      {error && <InlineError message={error} />}
      {form && (
        <form onSubmit={save} className="space-y-4 max-w-3xl">
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 text-xs text-amber-200 flex gap-2.5">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
            <p className="leading-relaxed">
              La factura electrónica está en <strong>modo simulado</strong>: se genera numeración y un CUFE de prueba, pero no se envía a la DIAN.
              La integración con el proveedor tecnológico (Factus o Siigo) se hará en el servidor; sus credenciales y la clave técnica
              nunca se guardan en el navegador.
            </p>
          </div>

          <section className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
            <h3 className="text-xs sm:text-sm font-bold text-white">Tiquete POS</h3>
            <SequenceFields seq={form.pos} onChange={(pos) => setForm({ ...form, pos })} />
          </section>

          <section className={`bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 ${canDian ? '' : 'opacity-60'}`}>
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-xs sm:text-sm font-bold text-white">Factura electrónica (resolución DIAN)</h3>
              {!canDian && <span className="text-[10px] text-violet-300 font-bold">Requiere plan Premium</span>}
              {canDian && expired && <span className="text-[10px] text-rose-300 font-bold">Resolución vencida</span>}
            </div>
            <fieldset disabled={!canDian} className="space-y-3">
              <SequenceFields seq={form.fe} onChange={(fe) => setForm({ ...form, fe })} electronic />
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className={labelClass}>Proveedor tecnológico</span>
                  <select value={form.provider} onChange={(e) => setForm({ ...form, provider: e.target.value })} className={fieldClass}>
                    {PROVIDERS.map((p) => <option key={p.value} value={p.value} disabled={p.disabled}>{p.label}</option>)}
                  </select>
                </label>
                <label className="block">
                  <span className={labelClass}>Ambiente</span>
                  <select value={form.environment} onChange={(e) => setForm({ ...form, environment: e.target.value })} className={fieldClass}>
                    <option value="habilitacion">Habilitación (pruebas)</option>
                    <option value="produccion">Producción</option>
                  </select>
                </label>
              </div>
            </fieldset>
          </section>

          <button disabled={saving} className={primaryButton}>{saving ? 'Guardando…' : 'Guardar configuración'}</button>
        </form>
      )}
    </AdminShell>
  );
}
