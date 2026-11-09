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
    <main className="min-h-screen max-w-5xl mx-auto px-6 sm:px-10 py-10 sm:py-16 flex flex-col gap-12">
      <header>
        <BrandMark />
      </header>

      <section className="space-y-4 max-w-2xl">
        <h1 className="font-display font-extrabold text-5xl sm:text-7xl tracking-tight leading-[0.92]">De la mesa a la cocina, sin papel.</h1>
        <p className="text-lg text-suave max-w-xl">{PROJECT_TAGLINE}: el comensal pide desde su mesa, la cocina lo ve al instante y la caja cobra la cuenta completa.</p>
      </section>

      {isDemoMode ? (
        <section className="space-y-5">
          <p className="border-l-4 border-maracuya pl-4 text-suave max-w-2xl">
            <strong className="text-tinta">Modo demostración.</strong> Los datos viven en este navegador. Abre la carta y la cocina en pestañas distintas para ver cómo llegan los pedidos.
          </p>
          <div className="grid sm:grid-cols-2 gap-px bg-linea border border-linea rounded-3xl overflow-hidden">
            <Link to={`/r/${DEMO_TENANT.slug}/m/${demoTableToken(4)}`} className="group bg-plato p-6 sm:p-8 space-y-3 hover:bg-mantel transition-colors">
              <QrCode className="w-7 h-7 text-hoja" aria-hidden="true" />
              <h2 className="block-title group-hover:underline underline-offset-4">Abrir la carta de la Mesa 4</h2>
              <p className="text-suave">Lo que ve el cliente al escanear el QR o tocar el NFC de su mesa.</p>
            </Link>
            <Link to={`/staff/${DEMO_TENANT.slug}/login`} className="group bg-plato p-6 sm:p-8 space-y-3 hover:bg-mantel transition-colors">
              <LogIn className="w-7 h-7 text-hoja" aria-hidden="true" />
              <h2 className="block-title group-hover:underline underline-offset-4">Entrar como personal</h2>
              <ul className="text-suave space-y-1">
                {DEMO_STAFF.map((s) => (
                  <li key={s.id} className="flex items-center gap-2">
                    {s.role === 'owner' ? <Settings className="w-4 h-4" aria-hidden="true" /> : s.role === 'cocina' ? <ChefHat className="w-4 h-4" aria-hidden="true" /> : <Receipt className="w-4 h-4" aria-hidden="true" />}
                    {ROLES[s.role]}: PIN <span className="precio font-bold text-tinta">{s.pin}</span>
                  </li>
                ))}
              </ul>
            </Link>
          </div>
        </section>
      ) : (
        <section className="grid sm:grid-cols-2 gap-px bg-linea border border-linea rounded-3xl overflow-hidden">
          <div className="bg-plato p-6 sm:p-8 space-y-3">
            <QrCode className="w-7 h-7 text-hoja" aria-hidden="true" />
            <h2 className="block-title">¿Vienes a comer?</h2>
            <p className="text-suave">Escanea el código QR o toca la etiqueta NFC de tu mesa para ver la carta y pedir.</p>
          </div>
          <form
            className="bg-plato p-6 sm:p-8 space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (slug.trim()) navigate(`/staff/${slug.trim().toLowerCase()}/login`);
            }}
          >
            <LogIn className="w-7 h-7 text-hoja" aria-hidden="true" />
            <h2 className="block-title">Entrar como personal</h2>
            <label className="block">
              <span className="label">Código del restaurante</span>
              <input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="ej: la-trattoria" className="field" />
            </label>
            <button className="btn btn-primary">Continuar</button>
          </form>
        </section>
      )}
    </main>
  );
}
