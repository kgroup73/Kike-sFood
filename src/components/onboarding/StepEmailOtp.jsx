import { ShieldCheck } from 'lucide-react';

function GoogleIcon() {
  return (
    <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.02h3.87c2.26-2.09 3.67-5.17 3.67-9.12z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.87-3.02c-1.08.72-2.45 1.16-4.06 1.16-3.13 0-5.78-2.11-6.73-4.96H1.26v3.12C3.27 21.35 7.35 24 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.27 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.61H1.26C.46 8.21 0 10.05 0 12s.46 3.79 1.26 5.39l4.01-3.12z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.27 2.65 1.26 6.61l4.01 3.12c.95-2.85 3.6-4.98 6.73-4.98z"
      />
    </svg>
  );
}

export default function StepEmailOtp({ onGoogleSignIn }) {
  return (
    <div className="space-y-6 text-center sm:text-left">
      <div className="space-y-1.5">
        <h2 className="font-display font-black text-2xl text-tinta">
          Crea tu nuevo restaurante
        </h2>
        <p className="text-suave text-sm leading-relaxed">
          Inicia sesión con tu cuenta de Google para verificar tu titularidad en un clic y configurar tu restaurante.
        </p>
      </div>

      <div className="space-y-4 pt-2">
        {/* Botón Google OAuth */}
        <button
          type="button"
          onClick={onGoogleSignIn}
          className="w-full h-14 px-5 py-3 rounded-2xl border-2 border-linea hover:border-tinta bg-white hover:bg-mantel/40 text-tinta font-bold text-base flex items-center justify-center gap-3 transition-all shadow-sm hover:shadow active:scale-[0.99]"
        >
          <GoogleIcon />
          <span>Continuar con Google</span>
        </button>

        <div className="p-4 rounded-2xl bg-mantel border border-linea text-left space-y-2 text-xs text-suave">
          <div className="flex items-center gap-2 font-bold text-tinta text-sm">
            <ShieldCheck className="w-4 h-4 text-hoja" />
            <span>Acceso seguro sin contraseñas</span>
          </div>
          <p>
            Tu restaurante quedará vinculado de forma segura a tu cuenta de Google. No necesitas recordar contraseñas ni esperar códigos por correo.
          </p>
        </div>
      </div>
    </div>
  );
}
