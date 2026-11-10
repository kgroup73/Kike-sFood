import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { QrCode, ChefHat, Receipt, Settings, LogIn, Zap, Smartphone, KeyRound, Percent, Coins, ClipboardCheck, Check } from 'lucide-react';
import BrandMark from '../components/ui/BrandMark';
import Timbre from '../components/ui/Timbre';
import HeroDevices from '../components/landing/HeroDevices';
import DesktopFrame from '../components/landing/DesktopFrame';
import Reveal from '../components/landing/Reveal';
import TiltIn from '../components/landing/TiltIn';
import { CartaAdminScreen, CocinaDesktop, CajaDesktop } from '../components/landing/Screens';
import TableSticker from '../components/landing/TableSticker';
import Faq from '../components/landing/Faq';
import { PROJECT_NAME, PROJECT_TAGLINE } from '../config/branding';
import { isDemoMode } from '../services/api';
import { DEMO_TENANT, DEMO_STAFF } from '../services/demo/seedData';
import { demoTableToken } from '../services/demo/demoApi';
import { ROLES } from '../lib/roles';
import { PLANS } from '../lib/plans';

const DEMO_MENU = `/r/${DEMO_TENANT.slug}/m/${demoTableToken(4)}`;
const DEMO_LOGIN = `/staff/${DEMO_TENANT.slug}/login`;

const NAV = [
  { href: '#planes', label: 'Planes' },
  { href: '#producto', label: 'Cómo funciona' },
  { href: '#preguntas', label: 'Preguntas' }
];

/*
 * Los nombres de los planes salen de lib/plans. El reparto de funciones es el que
 * definió el equipo para la oferta comercial: 1) solo carta, 2) pedidos, llamado al
 * mesero, cocina y comandas, 3) caja y facturación.
 */
const PLANES = [
  {
    key: 'basic',
    n: 'Plan 1',
    title: 'Solo la carta.',
    text: 'La carta con fotos, precios y descripciones en el celular del comensal. Nadie pide desde la mesa todavía: el mesero toma la orden como siempre.',
    items: ['Carta digital con QR y NFC por mesa', 'Stickers de mesa listos para imprimir', 'Ocultar o agotar un plato al instante', 'Platos del chef, veganos, sin gluten y picantes señalados'],
    screen: CartaAdminScreen,
    url: 'kikes.app/staff/la-trattoria/admin/carta',
    alt: 'El editor de la carta en el panel de administración: la lista de platos con foto y precio, y los botones para ocultar, editar o eliminar cada uno'
  },
  {
    key: 'intermedio',
    n: 'Plan 2',
    title: 'La mesa pide y la cocina recibe.',
    text: 'El comensal envía el pedido y llama al mesero desde su celular. La comanda cae en la pantalla de la cocina o sale impresa sola, sin que nadie toque un botón.',
    items: ['Pedidos desde la mesa', 'Llamado al mesero en el panel del personal', 'Cocina en pantalla, o comandas impresas solas', 'Ingredientes agotados al instante'],
    screen: CocinaDesktop,
    url: 'kikes.app/staff/la-trattoria/cocina',
    alt: 'La cocina en el panel del personal: el riel con cuatro comandas, cada una con su mesa, su tiempo de espera y el botón para avanzarla, y el aviso de una mesa que llama al mesero',
    dark: true
  },
  {
    key: 'premium',
    n: 'Plan 3',
    title: 'Y la caja cuadra sola.',
    text: 'Todas las comandas de la mesa en una sola cuenta. La propina se elige al cobrar y el turno cierra con su reporte Z.',
    items: ['Caja POS con una cuenta por mesa', 'Propina voluntaria al cobrar', 'Cierre de caja Z por turno', 'Facturación electrónica DIAN, hoy en modo de prueba'],
    screen: CajaDesktop,
    url: 'kikes.app/staff/la-trattoria/caja',
    alt: 'La caja en el panel del personal: las cifras del turno y las mesas que esperan la cuenta, con sus comandas y el botón de cobrar'
  }
];

const PANTALLAS = [
  { icon: QrCode, who: 'Mesa', title: 'Pide sin instalar nada', text: 'Escanea el QR o acerca el celular al NFC. La carta abre en el navegador, con fotos, opciones y maridajes.' },
  { icon: ChefHat, who: 'Cocina', title: 'Pendiente, en preparación, listo', text: 'Cada comanda avanza con un toque. Si se acaba un ingrediente, los platos que lo usan dejan de pedirse al instante.' },
  { icon: Receipt, who: 'Caja', title: 'Una cuenta por mesa', text: 'Todas las comandas de la mesa en un solo comprobante, con la propina que elija el cliente y el tiquete listo para imprimir.' },
  { icon: Settings, who: 'Administración', title: 'Cada quien ve lo suyo', text: 'Carta, mesas, personal con PIN, inventario y numeración de facturas. Dueño, cocina, caja y mesero entran a lo que les toca.' }
];

const HECHOS = [
  { icon: Zap, title: 'Tiempo real', text: 'La carta, la cocina y la caja se actualizan solas, sin recargar.' },
  { icon: Smartphone, title: 'Sin instalar nada', text: 'Funciona en el navegador: el celular del comensal, la tablet de la cocina y el computador de la caja.' },
  { icon: KeyRound, title: 'PIN por persona', text: 'Dueño, administrador, cocina, caja y mesero. Cada quien entra a lo suyo.' },
  { icon: Percent, title: 'Impuesto al consumo desglosado', text: 'Los precios de la carta lo incluyen y el tiquete lo separa.' },
  { icon: Coins, title: 'Propina al cobrar', text: 'Voluntaria, y se confirma en la caja, no antes.' },
  { icon: ClipboardCheck, title: 'Cierre de caja', text: 'Reporte Z por turno con ventas, impuestos y propinas.' }
];

const PREGUNTAS = [
  { q: '¿El comensal tiene que instalar algo?', a: 'No. Escanea el QR o acerca el celular al NFC de la mesa y la carta abre en el navegador. Desde ahí pide y la cocina lo recibe al instante.' },
  { q: '¿Qué pasa si se acaba un ingrediente?', a: 'La cocina lo marca como agotado y los platos que lo usan dejan de poder pedirse en la carta en ese momento. El faltante queda en el reporte de inventario.' },
  { q: '¿Cómo se cobra una mesa con varias comandas?', a: 'La caja ve todas las comandas de la mesa juntas y las cobra en un solo comprobante. La propina se elige en ese momento, no al pedir.' },
  { q: '¿Necesito una pantalla en la cocina?', a: 'No. Puedes trabajar con comandas impresas: el computador conectado a la impresora las imprime solas, sin vista previa, apenas el comensal envía el pedido. Si prefieres pantalla, se activa con un clic, y puedes usar las dos.' },
  { q: '¿La factura electrónica ya está conectada con la DIAN?', a: 'Todavía no. Hoy se emite en modo de prueba, con numeración y resolución configurables, para que el flujo quede listo cuando se conecte el proveedor tecnológico.' },
  isDemoMode
    ? { q: '¿Puedo probarlo sin crear una cuenta?', a: 'Sí. En modo demostración los datos viven en tu navegador. Abre la carta en una pestaña y la cocina en otra para ver cómo llega el pedido.' }
    : { q: '¿Cómo empiezo con mi restaurante?', a: `Escríbele a soporte de ${PROJECT_NAME}: se crea el restaurante con su carta, sus mesas y el personal, y tú entras con el código del restaurante y tu PIN.` }
];

function PlanRow({ plan, index, flip }) {
  const { key, n, title, text, items, screen: Screen, url, alt, dark } = plan;
  return (
    <article
      aria-labelledby={`plan-${key}`}
      style={{ '--i': index }}
      className={`stack-card max-w-7xl mx-auto rounded-[32px] px-5 sm:px-10 lg:px-14 py-12 sm:py-16 grid ${flip ? 'lg:grid-cols-[3fr_2fr]' : 'lg:grid-cols-[2fr_3fr]'} gap-10 lg:gap-14 items-center shadow-[0_-24px_60px_-40px_rgb(0_0_0/0.35)] ${dark ? 'bg-tinta text-mantel' : 'bg-plato border border-linea'}`}
    >
      <Reveal variant={flip ? 'right' : 'left'} className={flip ? 'lg:order-2' : ''}>
        <p className={`text-sm font-bold ${dark ? 'text-maracuya' : 'text-hoja'}`}>{`${n} · ${PLANS[key].label}`}</p>
        <h3 id={`plan-${key}`} className="mt-3 font-display font-extrabold text-3xl sm:text-5xl tracking-[-0.03em] leading-[0.95]">
          {title}
        </h3>
        <p className={`mt-5 text-lg leading-relaxed ${dark ? 'text-mantel/70' : 'text-suave'}`}>{text}</p>
        <ul className="mt-6 space-y-2.5">
          {items.map((it) => (
            <li key={it} className="flex items-start gap-2.5">
              <Check className={`w-5 h-5 mt-0.5 shrink-0 ${dark ? 'text-hoja-inversa' : 'text-hoja'}`} aria-hidden="true" />
              <span>{it}</span>
            </li>
          ))}
        </ul>
      </Reveal>
      <TiltIn role="img" aria-label={alt} className={`min-w-0 ${flip ? 'lg:order-1' : ''}`}>
        <DesktopFrame url={url} className={dark ? 'ring-1 ring-mantel/15' : ''}>
          <Screen />
        </DesktopFrame>
      </TiltIn>
    </article>
  );
}

export default function HomePage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [slug, setSlug] = useState('');

  // Enlaces antiguos (?r=slug&mesa=4): llevan a la carta de consulta del restaurante.
  useEffect(() => {
    const legacy = params.get('r') || params.get('restaurant');
    if (legacy) navigate(`/r/${legacy.toLowerCase().replace(/[^a-z0-9-]/g, '-')}`, { replace: true });
  }, [params, navigate]);

  const qrUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}${DEMO_MENU}`;

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 bg-mantel/90 backdrop-blur border-b border-linea print-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-6">
          <Link to="/" aria-label={`${PROJECT_NAME}, inicio`} className="shrink-0">
            <BrandMark size="sm" />
          </Link>
          <nav aria-label="Secciones" className="hidden md:flex items-center gap-1 mx-auto">
            {NAV.map((n) => (
              <a key={n.href} href={n.href} className="px-3 h-9 inline-flex items-center rounded-full text-sm font-bold text-suave hover:text-tinta hover:bg-linea/60 transition-colors">
                {n.label}
              </a>
            ))}
          </nav>
          <a href="#entrar" className="btn btn-sm btn-dark ml-auto md:ml-0">
            {isDemoMode ? 'Probar la demo' : 'Entrar como personal'}
          </a>
        </div>
      </header>

      <main>
        {/* Portada */}
        <section aria-labelledby="hero-title" className="px-4 sm:px-6 pt-4">
          <div className="relative max-w-7xl mx-auto rounded-[32px] bg-gradient-to-b from-plato from-35% to-maracuya/40 overflow-hidden px-4 sm:px-8 pt-14 sm:pt-20 text-center">
            <span className="inline-flex items-center gap-2 h-8 pl-1.5 pr-3 rounded-full bg-plato border border-linea text-sm font-bold">
              <Timbre className="w-5 h-5" /> Carta digital, cocina y caja
            </span>
            <h1 id="hero-title" className="mt-6 font-display font-extrabold text-5xl sm:text-7xl lg:text-[88px] tracking-[-0.04em] leading-[0.92] max-w-4xl mx-auto">
              De la mesa a la cocina, sin papel.
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-suave max-w-xl mx-auto leading-relaxed">
              El comensal pide desde su mesa con el QR, la cocina lo ve al instante y la caja cobra la cuenta completa.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              {isDemoMode ? (
                <>
                  <Link to={DEMO_MENU} className="btn btn-primary">
                    Abrir la carta de la Mesa 4
                  </Link>
                  <Link to={DEMO_LOGIN} className="btn bg-hoja/10 text-hoja hover:bg-hoja/15">
                    Entrar como personal
                  </Link>
                </>
              ) : (
                <>
                  <a href="#entrar" className="btn btn-primary">
                    Entrar como personal
                  </a>
                  <a href="#planes" className="btn bg-hoja/10 text-hoja hover:bg-hoja/15">
                    Ver los planes
                  </a>
                </>
              )}
            </div>
            <HeroDevices />
          </div>
        </section>

        {/* Planes: el panel del personal en el computador, un plan por bloque */}
        <section id="planes" aria-labelledby="planes-title" className="px-4 sm:px-6 scroll-mt-16 space-y-4">
          <Reveal className="text-center max-w-2xl mx-auto pt-20 sm:pt-28 pb-8">
            <h2 id="planes-title" className="font-display font-extrabold text-4xl sm:text-6xl tracking-[-0.03em] leading-[0.95]">
              Un plan para cada etapa.
            </h2>
            <p className="mt-5 text-lg text-suave leading-relaxed">Empieza con la carta y suma pedidos, cocina y caja cuando los necesites. El plan lo administra la plataforma.</p>
          </Reveal>
          {PLANES.map((plan, i) => (
            <PlanRow key={plan.key} plan={plan} index={i} flip={i % 2 === 1} />
          ))}
        </section>

        {/* Cómo funciona */}
        <section id="producto" aria-labelledby="producto-title" className="max-w-7xl mx-auto px-4 sm:px-6 py-20 sm:py-28 scroll-mt-16">
          <Reveal className="text-center max-w-2xl mx-auto">
            <Timbre className="w-10 h-10 mx-auto" />
            <h2 id="producto-title" className="mt-5 font-display font-extrabold text-4xl sm:text-6xl tracking-[-0.03em] leading-[0.95]">
              Para la mesa, la cocina y la caja.
            </h2>
            <p className="mt-5 text-lg text-suave leading-relaxed">Un solo sistema con una pantalla para cada quien. Lo que pasa en una se ve en las otras.</p>
          </Reveal>
          <div className="mt-14 grid lg:grid-cols-[2fr_3fr] gap-6 items-stretch">
            <Reveal variant="scale" className="rounded-[32px] bg-gradient-to-b from-plato to-maracuya/30 border border-linea px-8 py-12 flex flex-col items-center justify-center gap-10">
              <TableSticker url={qrUrl} />
              <p className="text-center text-suave max-w-xs leading-relaxed">Imprime el sticker de cada mesa desde Administración. El QR y el NFC llevan a la carta de esa mesa.</p>
            </Reveal>
            <ul className="grid sm:grid-cols-2 gap-4">
              {PANTALLAS.map(({ icon: Icon, who, title, text }, i) => (
                <Reveal as="li" key={who} delay={i * 80} className="surface p-6 flex flex-col gap-4">
                  <span className="w-10 h-10 rounded-xl bg-hoja/10 text-hoja flex items-center justify-center">
                    <Icon className="w-5 h-5" aria-hidden="true" />
                  </span>
                  <div>
                    <p className="text-sm font-bold text-suave">{who}</p>
                    <h3 className="mt-1 font-display font-extrabold text-2xl tracking-tight leading-tight">{title}</h3>
                  </div>
                  <p className="text-suave leading-relaxed">{text}</p>
                </Reveal>
              ))}
            </ul>
          </div>
        </section>

        {/* Hechos */}
        <section aria-labelledby="hechos-title" className="px-4 sm:px-6">
          <div className="max-w-7xl mx-auto rounded-[32px] bg-plato border border-linea px-4 sm:px-10 py-16 sm:py-24">
            <Reveal className="text-center max-w-2xl mx-auto">
              <h2 id="hechos-title" className="font-display font-extrabold text-4xl sm:text-6xl tracking-[-0.03em] leading-[0.95]">Hecho para el servicio de todos los días.</h2>
              <p className="mt-5 text-lg text-suave leading-relaxed">Tiempo real, permisos por rol y cuentas que cuadran al cerrar.</p>
            </Reveal>
            <ul className="mt-14 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {HECHOS.map(({ icon: Icon, title, text }, i) => (
                <Reveal as="li" key={title} delay={(i % 3) * 80} className="rounded-2xl bg-mantel p-6">
                  <Icon className="w-6 h-6 text-hoja" aria-hidden="true" />
                  <h3 className="mt-5 font-display font-bold text-xl tracking-tight">{title}</h3>
                  <p className="mt-1 text-suave leading-relaxed">{text}</p>
                </Reveal>
              ))}
            </ul>
          </div>
        </section>

        {/* Preguntas */}
        <section id="preguntas" aria-labelledby="faq-title" className="max-w-7xl mx-auto px-4 sm:px-6 py-20 sm:py-28 grid lg:grid-cols-[1fr_2fr] gap-10 scroll-mt-16">
          <Reveal variant="left">
            <h2 id="faq-title" className="font-display font-extrabold text-4xl sm:text-5xl tracking-tight">Preguntas</h2>
          </Reveal>
          <Reveal delay={100}>
            <Faq items={PREGUNTAS} />
          </Reveal>
        </section>

        {/* Entrar */}
        <section id="entrar" aria-labelledby="entrar-title" className="px-4 sm:px-6 pb-20 scroll-mt-20">
          <Reveal variant="scale" className="max-w-7xl mx-auto rounded-[32px] bg-tinta text-mantel p-8 sm:p-12 grid lg:grid-cols-2 gap-10 items-center">
            <div>
              <h2 id="entrar-title" className="font-display font-extrabold text-4xl sm:text-5xl tracking-tight leading-[0.95]">
                {isDemoMode ? 'Pruébalo con una mesa de verdad.' : 'Entra al panel de tu restaurante.'}
              </h2>
              <p className="mt-4 text-lg text-mantel/70 leading-relaxed">
                {isDemoMode
                  ? 'Abre la carta en una pestaña y la cocina en otra: el pedido llega en el momento. Los datos viven en este navegador.'
                  : 'Cocina, caja y administración entran con el código del restaurante y su PIN.'}
              </p>
            </div>
            {isDemoMode ? (
              <div className="grid sm:grid-cols-2 gap-3">
                <Link to={DEMO_MENU} className="group rounded-2xl bg-mantel text-tinta p-5 flex flex-col gap-3 hover:bg-plato transition-colors">
                  <QrCode className="w-6 h-6 text-hoja" aria-hidden="true" />
                  <span className="font-display font-bold text-xl leading-tight group-hover:underline underline-offset-4">Abrir la carta de la Mesa 4</span>
                  <span className="text-sm text-suave">Lo que ve el cliente al escanear el QR o tocar el NFC.</span>
                </Link>
                <Link to={DEMO_LOGIN} className="group rounded-2xl bg-mantel/10 border border-mantel/15 p-5 flex flex-col gap-3 hover:bg-mantel/15 transition-colors">
                  <LogIn className="w-6 h-6 text-maracuya" aria-hidden="true" />
                  <span className="font-display font-bold text-xl leading-tight group-hover:underline underline-offset-4">Entrar como personal</span>
                  <ul className="text-sm text-mantel/70 space-y-1">
                    {DEMO_STAFF.map((s) => (
                      <li key={s.id}>
                        {ROLES[s.role]}: PIN <span className="precio font-bold text-mantel">{s.pin}</span>
                      </li>
                    ))}
                  </ul>
                </Link>
              </div>
            ) : (
              <form
                className="rounded-2xl bg-mantel text-tinta p-6 space-y-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (slug.trim()) navigate(`/staff/${slug.trim().toLowerCase()}/login`);
                }}
              >
                <label className="block">
                  <span className="label">Código del restaurante</span>
                  <input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="ej: la-trattoria" className="field" />
                </label>
                <button className="btn btn-primary">Entrar como personal</button>
                <p className="help">Si vienes a comer, escanea el QR de tu mesa: no necesitas entrar aquí.</p>
              </form>
            )}
          </Reveal>
        </section>
      </main>

      <footer className="border-t border-linea">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 grid sm:grid-cols-[2fr_1fr_1fr] gap-10">
          <div>
            <BrandMark />
            <p className="mt-3 text-suave max-w-xs leading-relaxed">{PROJECT_TAGLINE}.</p>
          </div>
          <nav aria-label="Producto">
            <p className="text-sm font-bold text-hoja">Producto</p>
            <ul className="mt-3 space-y-2 text-suave">
              {NAV.map((n) => (
                <li key={n.href}>
                  <a href={n.href} className="hover:text-tinta">
                    {n.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          <nav aria-label="Para empezar">
            <p className="text-sm font-bold text-hoja">Para empezar</p>
            <ul className="mt-3 space-y-2 text-suave">
              {isDemoMode ? (
                <>
                  <li>
                    <Link to={DEMO_MENU} className="hover:text-tinta">
                      Carta de la Mesa 4
                    </Link>
                  </li>
                  <li>
                    <Link to={DEMO_LOGIN} className="hover:text-tinta">
                      Panel del personal
                    </Link>
                  </li>
                </>
              ) : (
                <li>
                  <a href="#entrar" className="hover:text-tinta">
                    Panel del personal
                  </a>
                </li>
              )}
            </ul>
          </nav>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-10 text-sm text-suave">
          {isDemoMode ? 'Modo demostración: los datos viven en este navegador y vuelven al inicio si lo limpias.' : `${PROJECT_NAME}. ${PROJECT_TAGLINE}.`}
        </div>
      </footer>
    </div>
  );
}
