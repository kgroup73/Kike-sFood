import { Check, Copy, ArrowRight, Sparkles, QrCode, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { primaryButton } from '../admin/AdminShell';

export default function WelcomeSuccessModal({ tenant }) {
  const navigate = useNavigate();
  const [copiedMenu, setCopiedMenu] = useState(false);
  const [copiedStaff, setCopiedStaff] = useState(false);

  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://kikes.app';
  const menuUrl = `${origin}/r/${tenant?.slug}`;
  const staffUrl = `${origin}/staff/${tenant?.slug}/login`;
  const adminUrl = `/staff/${tenant?.slug}/admin`;

  const copy = async (text, setter) => {
    try {
      await navigator.clipboard.writeText(text);
      setter(true);
      setTimeout(() => setter(false), 2000);
    } catch {
      // fallback
    }
  };

  return (
    <div className="text-center space-y-6 py-2">
      {/* Icono de celebración */}
      <div className="w-16 h-16 rounded-full bg-hoja/10 border-2 border-hoja/30 text-hoja flex items-center justify-center mx-auto shadow-sm animate-scaleIn">
        <Sparkles className="w-8 h-8" />
      </div>

      <div className="space-y-1.5">
        <h2 className="font-display font-black text-3xl text-tinta">
          ¡Bienvenido a Kike's Food!
        </h2>
        <p className="text-suave text-base">
          Tu restaurante <strong className="text-tinta">{tenant?.name}</strong> está listo y activo.
        </p>
      </div>

      {/* Enlaces clave */}
      <div className="space-y-3 text-left">
        {/* Enlace de comensales */}
        <div className="p-4 rounded-2xl bg-mantel border border-linea space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-suave uppercase tracking-wider flex items-center gap-1.5">
              <QrCode className="w-3.5 h-3.5 text-hoja" /> Enlace de comensales (Carta y QR)
            </span>
            <button
              type="button"
              onClick={() => copy(menuUrl, setCopiedMenu)}
              className="text-xs font-bold text-hoja hover:underline flex items-center gap-1"
            >
              {copiedMenu ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedMenu ? 'Copiado' : 'Copiar'}
            </button>
          </div>
          <p className="font-mono text-sm text-tinta truncate select-all">{menuUrl}</p>
        </div>

        {/* Enlace de personal */}
        <div className="p-4 rounded-2xl bg-mantel border border-linea space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-suave uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-maracuya-tinta" /> Enlace de tu personal (PIN)
            </span>
            <button
              type="button"
              onClick={() => copy(staffUrl, setCopiedStaff)}
              className="text-xs font-bold text-hoja hover:underline flex items-center gap-1"
            >
              {copiedStaff ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedStaff ? 'Copiado' : 'Copiar'}
            </button>
          </div>
          <p className="font-mono text-sm text-tinta truncate select-all">{staffUrl}</p>
        </div>
      </div>

      {/* Pasos recomendados */}
      <div className="p-4 rounded-2xl bg-linea/30 text-left text-xs text-suave space-y-1.5">
        <p className="font-bold text-tinta text-sm mb-1">Primeros pasos recomendados:</p>
        <p>1. 📋 Personaliza tu carta agregando tus platillos con fotos y precios.</p>
        <p>2. 🖨️ Descarga los stickers de tus mesas (Mesas 1 a 4) listos con código QR.</p>
        <p>3. 👥 Agrega a tus meseros o administradores si tienes equipo en sala.</p>
      </div>

      {/* Botón principal para ir al panel */}
      <button
        type="button"
        onClick={() => navigate(adminUrl)}
        className={`${primaryButton} w-full h-14 text-base justify-center gap-2 font-display font-bold`}
      >
        <span>Ir a mi panel de Administración</span>
        <ArrowRight className="w-5 h-5" />
      </button>
    </div>
  );
}
