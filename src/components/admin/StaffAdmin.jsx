import { useCallback, useEffect, useState } from 'react';
import { UserPlus, KeyRound, Power, Lock } from 'lucide-react';
import { useTenant } from '../../hooks/useTenant';
import { useStaffSession } from '../../hooks/useStaffSession';
import { useToast } from '../../hooks/useToast';
import { api } from '../../services/api';
import { ROLES, assignableRoles } from '../../lib/roles';
import { InlineError } from '../ui/Screens';
import AdminShell, { fieldClass, labelClass, primaryButton } from './AdminShell';

const PIN_RE = /^[0-9]{4,6}$/;

export default function StaffAdmin() {
  const { tenant } = useTenant();
  const { staff: me } = useStaffSession();
  const showToast = useToast();
  const [list, setList] = useState([]);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({ displayName: '', role: 'cocina', pin: '' });

  const load = useCallback(async () => {
    try {
      setList(await api.listStaff(tenant.id));
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
      showToast(ok, 'success');
      return true;
    } catch (err) {
      showToast(err.message, 'error');
      return false;
    }
  };

  const create = async (e) => {
    e.preventDefault();
    if (!form.displayName.trim() || !PIN_RE.test(form.pin)) return;
    const done = await act(() => api.createStaff(form), `${form.displayName} puede ingresar con su PIN`);
    if (done) setForm({ displayName: '', role: 'cocina', pin: '' });
  };

  const canManage = (target) => me.role === 'owner' || !['owner', 'admin'].includes(target.role);

  return (
    <AdminShell title="Personal" subtitle="Cada persona entra con su propio PIN. Tras 5 intentos fallidos su usuario se bloquea 15 minutos.">
      {error && <InlineError message={error} onRetry={load} />}

      <form onSubmit={create} className="surface p-5 sm:p-6 grid grid-cols-1 sm:grid-cols-4 gap-4 items-end max-w-4xl">
        <h2 className="block-title sm:col-span-4">Agregar a alguien</h2>
        <label className="block sm:col-span-2">
          <span className={labelClass}>Nombre</span>
          <input value={form.displayName} maxLength={60} onChange={(e) => setForm({ ...form, displayName: e.target.value })} className={fieldClass} placeholder="Ej: Laura (Caja)" />
        </label>
        <label className="block">
          <span className={labelClass}>Rol</span>
          <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className={fieldClass}>
            {assignableRoles(me.role).map((r) => <option key={r} value={r}>{ROLES[r]}</option>)}
          </select>
        </label>
        <label className="block">
          <span className={labelClass}>PIN (4 a 6 dígitos)</span>
          <input type="password" inputMode="numeric" autoComplete="new-password" maxLength={6} value={form.pin} onChange={(e) => setForm({ ...form, pin: e.target.value.replace(/\D/g, '') })} className={`${fieldClass} precio tracking-[0.3em]`} />
        </label>
        <button disabled={!form.displayName.trim() || !PIN_RE.test(form.pin)} className={`${primaryButton} sm:col-span-4 sm:justify-self-start`}>
          <UserPlus className="w-4 h-4" aria-hidden="true" /> Crear usuario
        </button>
      </form>

      <ul className="surface divide-y divide-linea overflow-hidden max-w-4xl">
        {list.map((s) => {
          const locked = s.lockedUntil && new Date(s.lockedUntil) > new Date();
          const editable = canManage(s) && s.id !== me.id;
          return (
            <li key={s.id} className={`flex flex-wrap sm:flex-nowrap items-center gap-x-4 gap-y-3 px-5 py-4 ${s.isActive ? '' : 'opacity-60'}`}>
              <span className="w-11 h-11 rounded-full bg-mantel border border-linea flex items-center justify-center font-display font-bold shrink-0" aria-hidden="true">
                {s.displayName.replace(/\(.*?\)/g, '').trim().slice(0, 1).toUpperCase()}
              </span>
              <div className="flex-1 min-w-0">
                <p className="font-bold truncate">
                  {s.displayName}
                  {s.id === me.id && <span className="text-suave font-normal"> (tú)</span>}
                </p>
                <p className="text-sm text-suave flex items-center gap-2 flex-wrap">
                  {ROLES[s.role]}
                  {!s.isActive && <span className="text-xs font-bold px-1.5 py-0.5 rounded bg-linea text-tinta">Inactivo</span>}
                  {locked && (
                    <span className="text-xs font-bold px-1.5 py-0.5 rounded bg-aji text-white inline-flex items-center gap-1">
                      <Lock className="w-3 h-3" aria-hidden="true" /> Bloqueado
                    </span>
                  )}
                </p>
              </div>
              {canManage(s) && (
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => {
                      const pin = window.prompt(`Nuevo PIN para ${s.displayName} (4 a 6 dígitos):`);
                      if (pin === null) return;
                      if (!PIN_RE.test(pin)) return showToast('El PIN debe tener entre 4 y 6 dígitos', 'error');
                      act(() => api.updateStaff({ staffId: s.id, pin }), `PIN de ${s.displayName} actualizado${locked ? ' y desbloqueado' : ''}`);
                    }}
                    className="btn btn-sm btn-quiet"
                  >
                    <KeyRound className="w-3.5 h-3.5" aria-hidden="true" /> Cambiar PIN
                  </button>
                  {editable && (
                    <button
                      onClick={() => act(() => api.updateStaff({ staffId: s.id, isActive: !s.isActive }), s.isActive ? `${s.displayName} desactivado` : `${s.displayName} activado`)}
                      className="btn btn-sm btn-quiet"
                    >
                      <Power className="w-3.5 h-3.5" aria-hidden="true" /> {s.isActive ? 'Desactivar' : 'Activar'}
                    </button>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </AdminShell>
  );
}
