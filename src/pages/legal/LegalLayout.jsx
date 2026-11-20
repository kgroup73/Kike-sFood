import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowLeft, ShieldCheck, FileText, Cookie, Scale, ExternalLink } from 'lucide-react';
import BrandMark from '../../components/ui/BrandMark';
import { PROJECT_NAME, MAKER_NAME, MAKER_URL, LEGAL_CONFIG } from '../../config/branding';

const LEGAL_TABS = [
  { href: '/terminos', label: 'Términos y Condiciones', icon: FileText },
  { href: '/privacidad', label: 'Política de Privacidad', icon: ShieldCheck },
  { href: '/cookies', label: 'Cookies y Almacenamiento', icon: Cookie },
];

export default function LegalLayout({ title, subtitle, badge = 'Marco Legal Colombia', children }) {
  const { pathname } = useLocation();

  useEffect(() => {
    try {
      window.scrollTo({ top: 0, behavior: 'instant' });
    } catch {
      // Entornos de prueba como jsdom donde scrollTo no está implementado
    }
  }, [pathname]);

  return (
    <div className="min-h-screen bg-mantel text-tinta flex flex-col font-sans">
      {/* Barra superior con navegación */}
      <header className="sticky top-0 z-40 bg-plato/90 backdrop-blur-md border-b border-linea">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-sm font-bold text-suave hover:text-tinta transition-colors group"
            >
              <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
              <span>Inicio</span>
            </Link>
            <span className="text-linea">/</span>
            <Link to="/" className="hover:opacity-90 transition-opacity">
              <BrandMark size="sm" />
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-flex items-center gap-1.5 text-xs text-suave bg-mantel px-2.5 py-1 rounded-full border border-linea">
              <Scale className="w-3.5 h-3.5 text-hoja" />
              {badge}
            </span>
            <a
              href={`mailto:${LEGAL_CONFIG.legalEmail}`}
              className="btn btn-secondary text-xs py-1.5 px-3"
            >
              Contacto legal
            </a>
          </div>
        </div>

        {/* Pestañas de documentos legales */}
        <div className="border-t border-linea/60 bg-plato">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 flex gap-2 overflow-x-auto py-2 scrollbar-none">
            {LEGAL_TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = pathname === tab.href;
              return (
                <Link
                  key={tab.href}
                  to={tab.href}
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap transition-colors ${
                    isActive
                      ? 'bg-hoja text-white shadow-sm'
                      : 'text-suave hover:text-tinta hover:bg-mantel'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{tab.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </header>

      {/* Contenido principal */}
      <main className="flex-1 py-10 sm:py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          {/* Cabecera del documento */}
          <div className="mb-10 pb-8 border-b border-linea">
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-hoja uppercase tracking-wider mb-2">
              <ShieldCheck className="w-4 h-4" />
              Documento Oficial · {PROJECT_NAME} by {MAKER_NAME}
            </div>
            <h1 className="text-3xl sm:text-4xl font-display font-extrabold tracking-tight text-tinta mb-4">
              {title}
            </h1>
            {subtitle && (
              <p className="text-base sm:text-lg text-suave leading-relaxed max-w-3xl">
                {subtitle}
              </p>
            )}

            <div className="mt-6 flex flex-wrap items-center gap-y-2 gap-x-4 text-xs text-suave">
              <span>
                <strong>Última actualización:</strong> {LEGAL_CONFIG.lastUpdated}
              </span>
              <span className="hidden sm:inline">·</span>
              <span>
                <strong>Aplicable a:</strong> Restaurantes (Inquilinos), Personal y Comensales
              </span>
              <span className="hidden sm:inline">·</span>
              <span>
                <strong>Jurisdicción:</strong> República de Colombia
              </span>
            </div>
          </div>

          {/* Cuerpo del documento */}
          <article className="prose prose-stone max-w-none space-y-8 text-suave leading-relaxed [&_h2]:text-tinta [&_h2]:font-display [&_h2]:font-bold [&_h2]:text-xl [&_h2]:sm:text-2xl [&_h2]:pt-4 [&_h2]:border-t [&_h2]:border-linea/60 [&_h3]:text-tinta [&_h3]:font-bold [&_h3]:text-base [&_h3]:sm:text-lg [&_strong]:text-tinta [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1.5">
            {children}
          </article>

          {/* Tarjeta de contacto / dudas */}
          <div className="mt-14 p-6 sm:p-8 rounded-2xl bg-plato border border-linea shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-display font-bold text-lg text-tinta">
                  ¿Preguntas o requerimientos sobre este documento?
                </h3>
                <p className="text-sm text-suave mt-1 max-w-xl">
                  Para peticiones, quejas, reclamos o ejercicio de derechos de Habeas Data (conocer, actualizar o suprimir datos), nuestro canal de atención está a tu disposición.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 shrink-0">
                <a
                  href={`mailto:${LEGAL_CONFIG.legalEmail}`}
                  className="btn btn-primary text-xs whitespace-nowrap text-center"
                >
                  {LEGAL_CONFIG.legalEmail}
                </a>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Pie simplificado para páginas legales */}
      <footer className="border-t border-linea bg-plato py-8 text-xs text-suave">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <p>
            © {new Date().getFullYear()} {PROJECT_NAME} · Desarrollado y operado por{' '}
            <a
              href={MAKER_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold text-tinta underline decoration-hoja/40 underline-offset-2 hover:decoration-hoja transition-colors"
            >
              {MAKER_NAME}
            </a>
            . Todos los derechos reservados.
          </p>
          <div className="flex items-center gap-4">
            <Link to="/terminos" className="hover:text-tinta">
              Términos
            </Link>
            <span>·</span>
            <Link to="/privacidad" className="hover:text-tinta">
              Privacidad
            </Link>
            <span>·</span>
            <Link to="/cookies" className="hover:text-tinta">
              Cookies
            </Link>
            <span>·</span>
            <a
              href={MAKER_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 hover:text-tinta"
            >
              <span>{MAKER_NAME}</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
