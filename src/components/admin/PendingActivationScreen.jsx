import { useState } from 'react';
import { KeyRound, ShieldAlert, MessageCircle, ArrowRight, Loader2, LogOut, CheckCircle2 } from 'lucide-react';
import { api } from '../../services/api';
import { useToast } from '../../hooks/useToast';
import { primaryButton } from './AdminShell';
import BrandMark from '../ui/BrandMark';
import { PLANS } from '../../lib/plans';

export default function PendingActivationScreen({ tenant, reload, onLogout }) {
  const showToast = useToast();
  const [code, setCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const planKey = tenant?.plan || tenant?.requestedPlan || 'intermedio';
  const planInfo = PLANS[planKey] || PLANS.intermedio;

  const handleActivate = async (e) => {
    e.preventDefault();
    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode || submitting) return;

    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const res = await api.redeemPlanCode({
        slug: tenant.slug,
        code: cleanCode
      });
      setSuccess(res?.message || '¡Restaurante activado con éxito!');
      showToast('¡Restaurante activado con éxito! Bienvenido.', 'success');
      setCode('');
      if (reload) {
        await reload();
      }
    } catch (err) {
      setError(err.message || 'Código de activación inválido o expirado. Contacta a KGroup.');
    } finally {
      setSubmitting(false);
    }
  };

  const whatsappMsg = `Hola KGroup, tengo registrada mi cuenta para el restaurante "${tenant?.name || ''}" (${tenant?.slug || ''}) y requiero mi código de activación.`;
  const whatsappUrl = `https://wa.me/573148316310?text=${encodeURIComponent(whatsappMsg)}`;

  return (
    <div className="min-h-screen bg-mantel flex flex-col justify-between p-4 sm:p-6 lg:p-8">
      {/* Barra superior */}
      <header className="max-w-xl w-full mx-auto flex items-center justify-between py-4">
        <div className="inline-flex items-center gap-2">
          <BrandMark size="sm" />
          <span className="font-display font-extrabold text-lg text-tinta">
            {tenant?.name}
          </span>
        </div>
        {onLogout && (
          <button
            type="button"
            onClick={onLogout}
            className="text-xs font-bold text-suave hover:text-aji transition-colors flex items-center gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5" /> Cerrar sesión
          </button>
        )}
      </header>

      {/* Tarjeta de activación */}
      <main className="max-w-xl w-full mx-auto my-auto py-6">
        <div className="bg-plato border border-linea rounded-[32px] p-6 sm:p-8 shadow-xl space-y-6 text-center">
          {/* Icono de advertencia suave */}
          <div className="w-16 h-16 rounded-full bg-maracuya/20 border-2 border-maracuya/40 text-sobre-maracuya flex items-center justify-center mx-auto shadow-sm animate-scaleIn">
            <ShieldAlert className="w-8 h-8 text-amber-600" />
          </div>

          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-maracuya/20 text-sobre-maracuya text-xs font-bold uppercase tracking-wider">
              Activación Pendiente
            </div>
            <h1 className="font-display font-black text-3xl text-tinta">
              Tu cuenta está en espera de activación
            </h1>
            <p className="text-suave text-sm max-w-md mx-auto leading-relaxed">
              Para empezar a cargar tu menú y habilitar los pedidos en mesa, ingresa el código de activación entregado por <strong>KGroup</strong>.
            </p>
          </div>

          {/* Resumen del plan solicitado */}
          <div className="p-4 rounded-2xl bg-mantel border border-linea text-left space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-suave font-bold uppercase tracking-wider">Plan Solicitado:</span>
              <span className="font-bold text-hoja text-sm">{planInfo.label}</span>
            </div>
            <p className="text-suave">{planInfo.summary}</p>
          </div>

          {/* Formulario de canje de código */}
          <form onSubmit={handleActivate} className="space-y-4 pt-2">
            <div className="space-y-1.5 text-left">
              <label htmlFor="activation-code" className="text-xs font-bold text-suave uppercase tracking-wider block">
                Código de activación *
              </label>
              <div className="relative">
                <KeyRound className="w-5 h-5 text-suave absolute left-3.5 top-1/2 -translate-y-1/2" aria-hidden="true" />
                <input
                  id="activation-code"
                  type="text"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="Ej. KIKE-INT-8X92"
                  className="field !pl-11 w-full text-center font-mono font-bold text-base h-12 uppercase tracking-widest"
                  disabled={submitting}
                />
              </div>
            </div>

            {error && (
              <div role="alert" className="p-3.5 rounded-xl bg-aji/10 border border-aji/30 text-aji text-xs font-medium text-left">
                {error}
              </div>
            )}

            {success && (
              <div role="status" className="p-3.5 rounded-xl bg-hoja/10 border border-hoja/30 text-hoja text-xs font-bold text-left flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{success}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting || !code.trim()}
              className={`${primaryButton} w-full h-12 text-sm justify-center gap-2 font-display font-bold`}
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Verificando código…
                </>
              ) : (
                <>
                  <span>Activar restaurante</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Contacto por WhatsApp para obtener el código */}
          <div className="pt-4 border-t border-linea text-xs text-suave space-y-3">
            <p>¿Aún no has recibido tu código de activación o necesitas pagar tu plan?</p>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary w-full h-11 text-xs justify-center gap-2 font-bold"
            >
              <MessageCircle className="w-4 h-4 text-[#25D366]" />
              <span>Contactar a KGroup por WhatsApp (+57 314 8316310)</span>
            </a>
          </div>
        </div>
      </main>

      {/* Pie de pantalla */}
      <footer className="text-center text-xs text-suave py-2">
        Kike's Food by KGroup · Todos los derechos reservados.
      </footer>
    </div>
  );
}
