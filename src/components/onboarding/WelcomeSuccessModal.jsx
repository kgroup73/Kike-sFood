import { Clock, ArrowRight, ShieldCheck, MessageCircle, Copy, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { primaryButton } from '../admin/AdminShell';
import { LEGAL_CONFIG } from '../../config/branding';
import { PLANS } from '../../lib/plans';

export default function WelcomeSuccessModal({ tenant, selectedPlan = 'intermedio', phone = '' }) {
  const navigate = useNavigate();
  const [copiedSlug, setCopiedSlug] = useState(false);

  const planKey = tenant?.plan || selectedPlan || 'intermedio';
  const planInfo = PLANS[planKey] || PLANS.intermedio;
  const adminUrl = `/staff/${tenant?.slug}/admin`;

  const copy = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedSlug(true);
      setTimeout(() => setCopiedSlug(false), 2000);
    } catch {
      // fallback
    }
  };

  const whatsappMsg = `Hola KGroup, acabo de registrar mi restaurante "${tenant?.name || ''}" (enlace: ${tenant?.slug || ''}) para el ${planInfo.label}. ¿Me pueden compartir el código de activación?`;
  const whatsappUrl = `https://wa.me/573148316310?text=${encodeURIComponent(whatsappMsg)}`;

  return (
    <div className="text-center space-y-6 py-2">
      {/* Icono de confirmación y estado */}
      <div className="w-16 h-16 rounded-full bg-maracuya/20 border-2 border-maracuya/40 text-sobre-maracuya flex items-center justify-center mx-auto shadow-sm animate-scaleIn">
        <Clock className="w-8 h-8 text-amber-600" />
      </div>

      <div className="space-y-1.5">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-maracuya/20 text-sobre-maracuya text-xs font-bold uppercase tracking-wider">
          <ShieldCheck className="w-3.5 h-3.5 text-amber-700" /> Registro Recibido · Pendiente de Activación
        </div>
        <h2 className="font-display font-black text-3xl text-tinta">
          ¡Cuenta creada con éxito!
        </h2>
        <p className="text-suave text-base max-w-md mx-auto">
          Tu restaurante <strong className="text-tinta">{tenant?.name}</strong> está registrado para el{' '}
          <strong className="text-hoja">{planInfo.label}</strong>.
        </p>
      </div>

      {/* Resumen del registro */}
      <div className="p-4 rounded-2xl bg-mantel border border-linea text-left space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="text-suave font-bold uppercase tracking-wider">Código / Enlace del restaurante</span>
          <button
            type="button"
            onClick={() => copy(tenant?.slug)}
            className="font-bold text-hoja hover:underline flex items-center gap-1"
          >
            {copiedSlug ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copiedSlug ? 'Copiado' : 'Copiar'}
          </button>
        </div>
        <p className="font-mono text-base font-bold text-tinta truncate bg-plato p-2.5 rounded-xl border border-linea select-all">
          {tenant?.slug}
        </p>
        <p className="text-xs text-suave">
          Guarda este código para ingresar junto con tu PIN de dueño.
        </p>
      </div>

      {/* Explicación de la activación */}
      <div className="p-4 rounded-2xl bg-hoja/5 border border-hoja/20 text-left text-xs text-suave space-y-2">
        <p className="font-bold text-tinta text-sm">¿Cómo se activa mi servicio?</p>
        <p>
          1. KGroup verificará tu registro y se comunicará a tu teléfono{' '}
          <strong>{phone || tenant?.phone || 'de contacto'}</strong> para coordinar el pago.
        </p>
        <p>
          2. Te entregaremos un <strong>código de activación</strong> que podrás ingresar directamente en el panel de tu restaurante.
        </p>
        <p>
          3. Una vez ingresado el código, tu carta digital y el panel de cocina quedarán habilitados de inmediato.
        </p>
      </div>

      {/* Botones de acción */}
      <div className="space-y-3">
        {/* Botón directo de WhatsApp para agilizar */}
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn w-full h-13 text-sm justify-center gap-2 font-bold bg-[#25D366] hover:bg-[#20bd5a] text-white shadow-md hover:shadow-lg transition-all"
        >
          <MessageCircle className="w-5 h-5" />
          <span>Agilizar activación por WhatsApp</span>
        </a>

        {/* Botón para ingresar al panel con el PIN */}
        <button
          type="button"
          onClick={() => navigate(adminUrl)}
          className={`${primaryButton} w-full h-12 text-sm justify-center gap-2 font-display font-bold`}
        >
          <span>Entrar a mi panel con mi PIN</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
