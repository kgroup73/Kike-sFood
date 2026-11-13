import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, Delete } from 'lucide-react';
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

  const initials = (name) =>
    name
      .replace(/\(.*?\)/g, '')
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0].toUpperCase())
      .join('');
  const keyClass = 'h-16 rounded-full bg-plato border border-linea font-display font-bold text-2xl hover:border-tinta active:bg-linea transition-colors';

  return (
    <main className="min-h-screen grid lg:grid-cols-2">
      <section className="px-6 sm:px-10 pt-10 pb-6 lg:py-16 flex flex-col justify-between gap-8 lg:border-r border-linea">
        <Link to="/" className="inline-flex self-start hover:opacity-80 transition-opacity" title="Volver al inicio">
          <BrandMark size="sm" />
        </Link>
        <div className="space-y-3">
          <p className="text-suave text-lg">Ingreso del personal</p>
          <h1 className="font-display font-extrabold text-5xl sm:text-6xl lg:text-7xl tracking-tight leading-[0.92]">{tenant.name}</h1>
        </div>
        <p className="hidden lg:block text-sm text-suave">
          <Link to={`/r/${tenant.slug}`} className="underline underline-offset-4 hover:text-tinta">
            Ver la carta pública
          </Link>
        </p>
      </section>

      <section className="px-6 sm:px-10 pb-10 lg:py-16 flex items-start lg:items-center justify-center">
        <form onSubmit={submit} className="w-full max-w-sm space-y-7">
          {error && <InlineError message={error} />}

          <fieldset className="space-y-3">
            <legend className="block-title mb-3">¿Quién eres?</legend>
            {staffList === null ? (
              <p className="text-suave">Cargando…</p>
            ) : staffList.length === 0 ? (
              <p className="text-aji">Este restaurante aún no tiene personal registrado. Revisa el README, sección "Dar de alta un restaurante y su dueño".</p>
            ) : (
              <div className="space-y-2">
                {staffList.map((s) => {
                  const on = staffId === s.id;
                  return (
                    <button
                      type="button"
                      key={s.id}
                      onClick={() => {
                        setStaffId(s.id);
                        setPin('');
                      }}
                      aria-pressed={on}
                      className={`w-full flex items-center gap-3 p-2 pr-4 rounded-full border text-left transition-colors ${
                        on ? 'border-tinta bg-tinta text-mantel' : 'border-linea bg-plato hover:border-tinta'
                      }`}
                    >
                      <span className={`w-10 h-10 rounded-full flex items-center justify-center font-display font-bold shrink-0 ${on ? 'bg-hoja text-sobre-hoja' : 'bg-mantel text-tinta'}`} aria-hidden="true">
                        {initials(s.displayName)}
                      </span>
                      <span className="flex-1 min-w-0 font-bold truncate">{s.displayName}</span>
                      <span className={`text-sm ${on ? 'text-mantel/70' : 'text-suave'}`}>{ROLES[s.role]}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </fieldset>

          {staffId && (
            <div className="space-y-4 animate-fadeIn">
              <label htmlFor="pin" className="block-title block">Tu PIN</label>
              <input
                id="pin"
                type="password"
                inputMode="numeric"
                autoComplete="off"
                autoFocus
                maxLength={6}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="field h-14 text-center text-3xl tracking-[0.6em] font-display"
              />
              <div className="grid grid-cols-3 gap-3" aria-hidden="true">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
                  <button type="button" tabIndex={-1} key={d} onClick={() => press(d)} className={keyClass}>
                    {d}
                  </button>
                ))}
                <button type="button" tabIndex={-1} onClick={() => setPin('')} className="h-16 rounded-full text-suave font-bold hover:text-tinta">
                  Borrar
                </button>
                <button type="button" tabIndex={-1} onClick={() => press('0')} className={keyClass}>
                  0
                </button>
                <button type="button" tabIndex={-1} onClick={() => setPin((p) => p.slice(0, -1))} className="h-16 rounded-full flex items-center justify-center text-suave hover:text-tinta">
                  <Delete className="w-6 h-6" />
                </button>
              </div>
              <button disabled={pin.length < 4 || submitting} className="btn btn-primary w-full h-14 text-base">
                {submitting && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
                Ingresar
              </button>
            </div>
          )}

          <div className="text-sm text-suave space-y-1 lg:hidden">
            <Link to={`/r/${tenant.slug}`} className="underline underline-offset-4 hover:text-tinta">
              Ver la carta pública
            </Link>
          </div>
          {isDemoMode && <p className="text-sm text-suave">PIN de prueba: dueño 1234, cocina 1111, caja 2222.</p>}
        </form>
      </section>
    </main>
  );
}
