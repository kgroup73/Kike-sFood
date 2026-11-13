import { User, Lock, ArrowLeft, RefreshCw, CheckCircle2, ShieldCheck } from 'lucide-react';
import { primaryButton } from '../admin/AdminShell';

export default function StepOwnerAccount({
  ownerName,
  setOwnerName,
  pin,
  setPin,
  pinConfirm,
  setPinConfirm,
  status,
  onBack,
  onSubmit
}) {
  const isCreating = status === 'creating';
  const pinValid = /^[0-9]{4,6}$/.test(pin);
  const pinMatches = pin === pinConfirm && pin.length > 0;
  const canSubmit = ownerName.trim().length >= 2 && pinValid && pinMatches && !isCreating;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (canSubmit) onSubmit();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-1.5 text-center sm:text-left">
        <h2 className="font-display font-black text-2xl text-tinta">
          Tu cuenta de Dueño
        </h2>
        <p className="text-suave text-sm leading-relaxed">
          Configura tu perfil y tu PIN maestro para entrar al panel de administración y autorizar cierres o cambios.
        </p>
      </div>

      <div className="space-y-4">
        {/* Nombre del dueño */}
        <label className="block">
          <span className="text-sm font-bold text-suave block mb-1.5">Tu nombre completo *</span>
          <div className="relative">
            <User className="w-5 h-5 text-suave absolute left-3.5 top-1/2 -translate-y-1/2" aria-hidden="true" />
            <input
              type="text"
              required
              autoFocus
              value={ownerName}
              onChange={(e) => setOwnerName(e.target.value)}
              placeholder="Ej. Carlos Mendoza"
              className="field !pl-11 w-full text-base h-12"
            />
          </div>
        </label>

        {/* PIN Maestro */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="block">
            <span className="text-sm font-bold text-suave block mb-1.5">PIN de acceso (4-6 dígitos) *</span>
            <div className="relative">
              <Lock className="w-5 h-5 text-suave absolute left-3.5 top-1/2 -translate-y-1/2" aria-hidden="true" />
              <input
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                required
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                placeholder="••••"
                className="field !pl-11 w-full text-xl font-mono tracking-widest h-12"
              />
            </div>
            <span className="help">Solo números. Lo usarás al ingresar a tu restaurante.</span>
          </label>

          <label className="block">
            <span className="text-sm font-bold text-suave block mb-1.5">Confirma tu PIN *</span>
            <div className="relative">
              <Lock className="w-5 h-5 text-suave absolute left-3.5 top-1/2 -translate-y-1/2" aria-hidden="true" />
              <input
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                required
                value={pinConfirm}
                onChange={(e) => setPinConfirm(e.target.value.replace(/\D/g, ''))}
                placeholder="••••"
                className="field !pl-11 w-full text-xl font-mono tracking-widest h-12"
              />
            </div>
            {pinConfirm && !pinMatches && (
              <span className="text-xs text-aji font-bold mt-1 block">Los PIN no coinciden</span>
            )}
          </label>
        </div>

        {/* Nota de seguridad */}
        <div className="p-4 rounded-2xl bg-mantel border border-linea flex items-start gap-3 text-xs text-suave">
          <ShieldCheck className="w-5 h-5 text-hoja shrink-0 mt-0.5" />
          <p>
            Tu restaurante arrancará con el <strong>Plan Básico</strong>, 4 mesas y 3 categorías iniciales listas para personalizar. Podrás invitar más personal y meseros en cualquier momento.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={onBack}
          disabled={isCreating}
          className="btn btn-quiet"
        >
          <ArrowLeft className="w-4 h-4" /> Volver
        </button>

        <button
          type="submit"
          disabled={!canSubmit}
          className={`${primaryButton} h-12 px-6 justify-center gap-2`}
        >
          {isCreating ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Aprovisionando restaurante…</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4" />
              <span>Crear mi restaurante</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
