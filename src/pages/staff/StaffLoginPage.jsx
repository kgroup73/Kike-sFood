import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Lock, Loader2, Delete } from 'lucide-react';
import { useTenant } from '../../hooks/useTenant';
import { useStaffSession } from '../../hooks/useStaffSession';
import { api, isDemoMode } from '../../services/api';
import { ROLES } from '../../lib/roles';
import BrandMark from '../../components/ui/BrandMark';
import { InlineError } from '../../components/ui/Screens';

export default function StaffLoginPage() {
  const { tenant } = useTenant();
  const { login } = useStaffSession();
  const [staffList, setStaffList] = useState(null);
  const [staffId, setStaffId] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api
      .listStaffForLogin(tenant.slug)
      .then((list) => {
        if (cancelled) return;
        setStaffList(list);
        if (list.length === 1) setStaffId(list[0].id);
      })
      .catch((err) => !cancelled && setError(err.message));
    return () => {
      cancelled = true;
    };
  }, [tenant.slug]);

  const submit = async (e) => {
    e?.preventDefault();
    if (!staffId || pin.length < 4 || submitting) return;
    setSubmitting(true);
    setError('');
    try {
      await login({ slug: tenant.slug, staffId, pin });
    } catch (err) {
      setError(err.message);
      setPin('');
    } finally {
      setSubmitting(false);
    }
  };

  const press = (d) => setPin((p) => (p.length < 6 ? p + d : p));

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <form onSubmit={submit} className="w-full max-w-sm bg-brand-panel border border-brand-line rounded-3xl p-6 space-y-5 shadow-2xl">
        <div className="space-y-2">
          <BrandMark size="sm" />
          <h1 className="text-base font-black text-brand-ivory flex items-center gap-2">
            <Lock className="w-4 h-4 text-brand-gold-light" aria-hidden="true" /> Ingreso del personal
          </h1>
          <p className="text-xs text-brand-khaki">{tenant.name}</p>
        </div>

        {error && <InlineError message={error} />}

        <fieldset className="space-y-2">
          <legend className="text-[11px] font-bold text-brand-mute uppercase tracking-wider mb-1">¿Quién eres?</legend>
          {staffList === null ? (
            <p className="text-xs text-brand-khaki">Cargando…</p>
          ) : staffList.length === 0 ? (
            <p className="text-xs text-amber-300">Este restaurante aún no tiene personal registrado. Ver README → "Crear el primer usuario".</p>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {staffList.map((s) => (
                <button
                  type="button"
                  key={s.id}
                  onClick={() => {
                    setStaffId(s.id);
                    setPin('');
                  }}
                  aria-pressed={staffId === s.id}
                  className={`p-2.5 rounded-xl border text-left text-xs transition-all ${
                    staffId === s.id ? 'border-brand-gold bg-brand-gold/15 text-brand-ivory' : 'border-brand-line bg-brand-night text-brand-mute hover:border-brand-khaki'
                  }`}
                >
                  <span className="font-bold block truncate">{s.displayName}</span>
                  <span className="text-[10px] text-brand-khaki">{ROLES[s.role]}</span>
                </button>
              ))}
            </div>
          )}
        </fieldset>

        {staffId && (
          <div className="space-y-3">
            <label htmlFor="pin" className="text-[11px] font-bold text-brand-mute uppercase tracking-wider block">PIN</label>
            <input
              id="pin"
              type="password"
              inputMode="numeric"
              autoComplete="off"
              autoFocus
              maxLength={6}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
              className="w-full bg-brand-night border border-brand-line rounded-xl p-3 text-center text-xl tracking-[0.5em] font-mono text-white focus:outline-none focus:border-brand-gold"
            />
            <div className="grid grid-cols-3 gap-2" aria-hidden="true">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
                <button type="button" tabIndex={-1} key={d} onClick={() => press(d)} className="py-3 rounded-xl bg-brand-raised hover:bg-brand-line text-lg font-bold">
                  {d}
                </button>
              ))}
              <button type="button" tabIndex={-1} onClick={() => setPin('')} className="py-3 rounded-xl bg-brand-night text-xs text-brand-khaki">Borrar</button>
              <button type="button" tabIndex={-1} onClick={() => press('0')} className="py-3 rounded-xl bg-brand-raised hover:bg-brand-line text-lg font-bold">0</button>
              <button type="button" tabIndex={-1} onClick={() => setPin((p) => p.slice(0, -1))} className="py-3 rounded-xl bg-brand-night flex items-center justify-center text-brand-khaki">
                <Delete className="w-4 h-4" />
              </button>
            </div>
            <button disabled={pin.length < 4 || submitting} className="w-full py-3 bg-gradient-to-r from-brand-gold to-brand-gold-light text-brand-ivory font-black text-sm rounded-xl disabled:opacity-40 flex items-center justify-center gap-2">
              {submitting && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
              Ingresar
            </button>
          </div>
        )}

        <div className="flex justify-between text-[11px] text-brand-khaki">
          <Link to={`/r/${tenant.slug}`} className="hover:text-brand-cream">Ver carta pública</Link>
          {isDemoMode && <span>Demo: dueño 1234 · cocina 1111 · caja 2222</span>}
        </div>
      </form>
    </main>
  );
}
