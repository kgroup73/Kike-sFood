import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { QrCode, LogIn, ChefHat, Receipt, Settings } from 'lucide-react';
import BrandMark from '../components/ui/BrandMark';
import { PROJECT_TAGLINE } from '../config/branding';
import { isDemoMode } from '../services/api';
import { DEMO_TENANT, DEMO_STAFF } from '../services/demo/seedData';
import { demoTableToken } from '../services/demo/demoApi';
import { ROLES } from '../lib/roles';

export default function HomePage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [slug, setSlug] = useState('');

  // Enlaces antiguos (?r=slug&mesa=4): llevan a la carta de consulta del restaurante.
  useEffect(() => {
    const legacy = params.get('r') || params.get('restaurant');
    if (legacy) navigate(`/r/${legacy.toLowerCase().replace(/[^a-z0-9-]/g, '-')}`, { replace: true });
  }, [params, navigate]);

  return (
    <main className="min-h-screen max-w-3xl mx-auto px-4 py-10 space-y-8">
      <header className="space-y-3">
        <BrandMark />
        <p className="text-sm text-brand-mute">{PROJECT_TAGLINE}</p>
      </header>

      {isDemoMode ? (
        <section className="space-y-4">
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 text-xs text-amber-200 leading-relaxed">
            <strong>Modo demo:</strong> no hay Supabase configurado, así que los datos viven en este navegador.
            Abre el menú y la cocina en pestañas distintas para ver la sincronización en tiempo real.
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <Link
              to={`/r/${DEMO_TENANT.slug}/m/${demoTableToken(4)}`}
              className="bg-brand-panel border border-brand-line hover:border-brand-gold rounded-2xl p-5 space-y-2 transition-colors"
            >
              <QrCode className="w-6 h-6 text-brand-gold-light" aria-hidden="true" />
              <h2 className="font-bold text-sm">Carta del comensal (Mesa 4)</h2>
              <p className="text-[11px] text-brand-khaki">Lo que ve el cliente al escanear el QR o tocar el NFC de la mesa.</p>
            </Link>
            <Link
              to={`/staff/${DEMO_TENANT.slug}/login`}
              className="bg-brand-panel border border-brand-line hover:border-brand-gold rounded-2xl p-5 space-y-2 transition-colors"
            >
              <LogIn className="w-6 h-6 text-brand-gold-light" aria-hidden="true" />
              <h2 className="font-bold text-sm">Ingreso del personal</h2>
              <ul className="text-[11px] text-brand-khaki space-y-0.5">
                {DEMO_STAFF.map((s) => (
                  <li key={s.id}>
                    {s.role === 'owner' ? <Settings className="inline w-3 h-3 mr-1" /> : s.role === 'cocina' ? <ChefHat className="inline w-3 h-3 mr-1" /> : <Receipt className="inline w-3 h-3 mr-1" />}
                    {ROLES[s.role]}: PIN <code className="text-brand-cream">{s.pin}</code>
                  </li>
                ))}
              </ul>
            </Link>
          </div>
        </section>
      ) : (
        <section className="space-y-4">
          <div className="bg-brand-panel border border-brand-line rounded-2xl p-5 space-y-2">
            <QrCode className="w-6 h-6 text-brand-gold-light" aria-hidden="true" />
            <h2 className="font-bold text-sm">¿Eres comensal?</h2>
            <p className="text-xs text-brand-khaki">Escanea el código QR o toca la etiqueta NFC de tu mesa para ver la carta y pedir.</p>
          </div>
          <form
            className="bg-brand-panel border border-brand-line rounded-2xl p-5 space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              if (slug.trim()) navigate(`/staff/${slug.trim().toLowerCase()}/login`);
            }}
          >
            <h2 className="font-bold text-sm flex items-center gap-2">
              <LogIn className="w-4 h-4 text-brand-gold-light" aria-hidden="true" /> Ingreso del personal
            </h2>
            <label className="block text-xs text-brand-mute">
              Código del restaurante
              <input
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="ej: la-trattoria"
                className="mt-1 w-full bg-brand-night border border-brand-line rounded-xl p-2.5 text-white font-mono focus:outline-none focus:border-brand-gold"
              />
            </label>
            <button className="px-4 py-2.5 bg-brand-gold hover:bg-brand-gold-light text-brand-ivory font-bold text-xs rounded-xl">
              Continuar
            </button>
          </form>
        </section>
      )}
    </main>
  );
}
