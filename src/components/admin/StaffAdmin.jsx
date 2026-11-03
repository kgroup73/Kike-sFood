import { useCallback, useEffect, useState } from 'react';
import { Users, UserPlus, KeyRound, Power, Lock } from 'lucide-react';
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
    <AdminShell title="Personal y PIN" icon={<Users className="w-4 h-4 text-orange-500" aria-hidden="true" />} subtitle="Cada empleado entra con su propio PIN. Tras 5 intentos fallidos se bloquea 15 minutos.">
      {error && <InlineError message={error} onRetry={load} />}

      <form onSubmit={create} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
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
          <input type="password" inputMode="numeric" autoComplete="new-password" maxLength={6} value={form.pin} onChange={(e) => setForm({ ...form, pin: e.target.value.replace(/\D/g, '') })} className={`${fieldClass} font-mono tracking-widest`} />
        </label>
        <button disabled={!form.displayName.trim() || !PIN_RE.test(form.pin)} className={`${primaryButton} sm:col-span-4 sm:justify-self-start flex items-center gap-1.5`}>
          <UserPlus className="w-4 h-4" aria-hidden="true" /> Crear usuario
        </button>
      </form>

      <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {list.map((s) => {
          const locked = s.lockedUntil && new Date(s.lockedUntil) > new Date();
          const editable = canManage(s) && s.id !== me.id;
          return (
            <li key={s.id} className={`bg-slate-900 border rounded-2xl p-4 space-y-2 ${s.isActive ? 'border-slate-800' : 'border-slate-800/60 opacity-60'}`}>
              <div className="flex justify-between items-start gap-2">
                <div className="min-w-0">
                  <h4 className="text-sm font-bold text-white truncate">{s.displayName}{s.id === me.id ? ' (tú)' : ''}</h4>
                  <p className="text-[11px] text-slate-400">{ROLES[s.role]}{!s.isActive && ' · Inactivo'}</p>
                </div>
                {locked && <span className="text-[10px] text-rose-300 font-bold flex items-center gap-1"><Lock className="w-3 h-3" aria-hidden="true" /> Bloqueado</span>}
              </div>
              {canManage(s) && (
                <div className="flex gap-1.5 text-[11px]">
                  <button
                    onClick={() => {
                      const pin = window.prompt(`Nuevo PIN para ${s.displayName} (4 a 6 dígitos):`);
                      if (pin === null) return;
                      if (!PIN_RE.test(pin)) return showToast('El PIN debe tener entre 4 y 6 dígitos', 'error');
                      act(() => api.updateStaff({ staffId: s.id, pin }), `PIN de ${s.displayName} actualizado${locked ? ' y desbloqueado' : ''}`);
                    }}
                    className="flex-1 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 flex items-center justify-center gap-1"
                  >
                    <KeyRound className="w-3.5 h-3.5" aria-hidden="true" /> Cambiar PIN
                  </button>
                  {editable && (
                    <button
                      onClick={() => act(() => api.updateStaff({ staffId: s.id, isActive: !s.isActive }), s.isActive ? `${s.displayName} desactivado` : `${s.displayName} activado`)}
                      className="py-1.5 px-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 flex items-center gap-1"
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
