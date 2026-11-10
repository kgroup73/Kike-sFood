import { Plus, Minus, Flame, ChefHat, Bell, Search, Eye, Edit3, Trash2, Receipt, Settings, Calculator, ArrowRight, ArrowLeft, Volume2, LogOut } from 'lucide-react';

/*
 * Pantallas de muestra para el landing: la carta en el celular del comensal y el
 * panel del personal en el computador. Usan las mismas clases del sistema (chips,
 * tiquete, surface, precio), así que cambian de color con el tema igual que la app.
 * Los platos y las fotos son de muestra (public/dishes); los textos de botones y
 * pestañas son los de la app real.
 */

const PLATOS = [
  { name: 'Risotto de hongos', price: '$32.000', img: '/dishes/risotto.jpg', tag: 'Receta del chef' },
  { name: 'Salmón a la parrilla', price: '$46.000', img: '/dishes/salmon.jpg', tag: 'De los más pedidos' },
  { name: 'Ñoquis al pesto', price: '$29.000', img: '/dishes/gnocchi.jpg', tag: 'Vegano' },
  { name: 'Cordero al romero', price: '$58.000', img: '/dishes/lamb.jpg', tag: 'Sin gluten' },
  { name: 'Pulpo a la brasa', price: '$54.000', img: '/dishes/octopus.jpg', tag: 'Picante medio' }
];

const CATEGORIAS = ['Entradas', 'Platos fuertes', 'Postres', 'Bebidas'];

/* ------------------------------------------------------------ Celular (comensal) */

/** La carta de la mesa: categorías, plato destacado y lista con fotos. */
export function CartaScreen() {
  return (
    <div className="h-full flex flex-col pt-11 text-tinta">
      <div className="px-5 flex items-end justify-between gap-3">
        <div>
          <p className="text-xs text-suave">Mesa 4</p>
          <p className="font-display font-extrabold text-xl tracking-tight leading-none">La Trattoria</p>
        </div>
        <span className="w-9 h-9 rounded-full bg-plato border border-linea inline-flex items-center justify-center text-suave">
          <Search className="w-4 h-4" />
        </span>
      </div>
      <div className="mt-4 px-5 flex gap-2 text-xs font-bold overflow-hidden">
        {CATEGORIAS.map((c, i) => (
          <span key={c} className={`h-7 px-3 rounded-full inline-flex items-center whitespace-nowrap ${i === 1 ? 'bg-tinta text-mantel' : 'bg-plato border border-linea'}`}>
            {c}
          </span>
        ))}
      </div>
      <div className="mt-4 mx-4 relative h-32 rounded-2xl overflow-hidden">
        <img src="/dishes/salmon.jpg" alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
        <div className="absolute bottom-3 left-3 right-3 text-white">
          <p className="text-[11px] font-bold inline-flex items-center gap-1">
            <ChefHat className="w-3 h-3" /> Receta del chef
          </p>
          <p className="font-display font-extrabold text-lg leading-tight">Salmón a la parrilla</p>
        </div>
      </div>
      <ul className="mt-3 px-4 space-y-2">
        {PLATOS.filter((p) => p.name !== 'Salmón a la parrilla').map((p) => (
          <li key={p.name} className="surface p-2.5 flex items-center gap-3">
            <img src={p.img} alt="" className="w-14 h-14 rounded-xl object-cover shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="font-bold text-sm leading-tight truncate">{p.name}</p>
              <p className="text-[11px] text-suave truncate">{p.tag}</p>
              <p className="precio text-sm">{p.price}</p>
            </div>
            <span className="w-8 h-8 rounded-full bg-hoja text-sobre-hoja inline-flex items-center justify-center shrink-0">
              <Plus className="w-4 h-4" />
            </span>
          </li>
        ))}
      </ul>
      <div className="mt-auto p-4">
        <div className="h-12 rounded-full bg-tinta text-mantel px-5 flex items-center justify-between font-bold text-sm">
          <span>Ver pedido</span>
          <span className="precio">2 · $61.000</span>
        </div>
      </div>
    </div>
  );
}

/** El detalle de un plato: foto, opciones, adiciones y maridaje. */
export function PlatoScreen() {
  return (
    <div className="h-full flex flex-col text-tinta">
      <div className="relative h-48 shrink-0">
        <img src="/dishes/risotto.jpg" alt="" className="absolute inset-0 w-full h-full object-cover" />
        <span className="absolute top-10 left-4 w-8 h-8 rounded-full bg-plato/95 inline-flex items-center justify-center">
          <ArrowLeft className="w-4 h-4" />
        </span>
      </div>
      <div className="px-5 pt-4 flex-1 space-y-4">
        <div>
          <p className="text-[11px] font-bold text-hoja inline-flex items-center gap-1">
            <ChefHat className="w-3 h-3" /> Receta del chef
          </p>
          <div className="mt-0.5 flex items-start justify-between gap-3">
            <p className="font-display font-extrabold text-xl tracking-tight leading-tight">Risotto de hongos</p>
            <p className="precio font-bold text-lg shrink-0">$32.000</p>
          </div>
          <p className="mt-1 text-xs text-suave leading-snug">Arroz carnaroli, hongos silvestres, parmesano y aceite de trufa.</p>
        </div>
        <div>
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold">Punto del arroz</span>
            <span className="text-suave">Elige una</span>
          </div>
          <div className="mt-2 flex gap-2 text-xs font-bold">
            <span className="h-7 px-3 rounded-full bg-tinta text-mantel inline-flex items-center">Cremoso</span>
            <span className="h-7 px-3 rounded-full bg-plato border border-linea inline-flex items-center">Al dente</span>
          </div>
        </div>
        <div>
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold">Adiciones</span>
            <span className="text-suave">Opcional</span>
          </div>
          <ul className="mt-2 surface px-3 divide-y divide-linea text-xs">
            <li className="py-2 flex justify-between">
              <span>Parmesano extra</span>
              <span className="precio text-suave">+ $4.000</span>
            </li>
            <li className="py-2 flex justify-between">
              <span>Trufa rallada</span>
              <span className="precio text-suave">+ $9.000</span>
            </li>
          </ul>
        </div>
        <div>
          <p className="text-xs font-bold">Va bien con</p>
          <div className="mt-2 surface p-2 flex items-center gap-2 text-xs">
            <img src="/dishes/cocktail.jpg" alt="" className="w-9 h-9 rounded-lg object-cover" />
            <span className="flex-1 min-w-0 truncate font-bold">Cóctel de la casa</span>
            <span className="h-7 px-2.5 rounded-full border border-tinta font-bold inline-flex items-center">Añadir</span>
          </div>
        </div>
      </div>
      <div className="p-4 flex gap-2">
        <span className="h-12 px-3 rounded-full bg-plato border border-linea inline-flex items-center gap-3 text-sm font-bold">
          <Minus className="w-4 h-4 text-suave" /> 1 <Plus className="w-4 h-4" />
        </span>
        <span className="h-12 flex-1 rounded-full bg-hoja text-sobre-hoja px-5 flex items-center justify-between font-bold text-sm">
          <span>Agregar</span>
          <span className="precio">$32.000</span>
        </span>
      </div>
    </div>
  );
}

/** El pedido de la mesa listo para enviar a la cocina, con el llamado al mesero. */
export function PedidoScreen() {
  const items = [
    { q: 1, name: 'Risotto de hongos', note: 'Cremoso · Parmesano extra', price: '$36.000' },
    { q: 1, name: 'Ñoquis al pesto', note: 'Sin nueces', price: '$29.000' },
    { q: 2, name: 'Limonada de flor de saúco', price: '$24.000' }
  ];
  return (
    <div className="h-full flex flex-col pt-11 text-tinta">
      <div className="px-5">
        <p className="text-xs text-suave">Mesa 4</p>
        <p className="font-display font-extrabold text-xl tracking-tight leading-none">Tu pedido</p>
      </div>
      <ul className="mt-4 mx-4 surface divide-y divide-linea text-sm">
        {items.map((it) => (
          <li key={it.name} className="px-3 py-2.5 flex items-center gap-3">
            <span className="h-8 px-2 rounded-full border border-linea inline-flex items-center gap-2 text-xs font-bold shrink-0">
              <Minus className="w-3 h-3 text-suave" /> {it.q} <Plus className="w-3 h-3" />
            </span>
            <div className="flex-1 min-w-0">
              <p className="font-bold leading-tight truncate">{it.name}</p>
              {it.note && <p className="text-[11px] text-suave truncate">{it.note}</p>}
            </div>
            <span className="precio shrink-0">{it.price}</span>
          </li>
        ))}
      </ul>
      <div className="mx-5 mt-3 flex items-center justify-between font-bold">
        <span>Total del pedido</span>
        <span className="precio text-lg">$89.000</span>
      </div>
      <p className="mx-5 mt-1 text-[11px] text-suave leading-snug">Impuestos incluidos. La propina es voluntaria y la defines al pagar.</p>
      <div className="mt-4 px-4 space-y-2">
        <div className="h-12 rounded-full bg-hoja text-sobre-hoja flex items-center justify-center font-bold text-sm">Enviar pedido a cocina</div>
        <div className="h-11 rounded-full bg-plato border border-linea flex items-center justify-center gap-2 font-bold text-sm">
          <Bell className="w-4 h-4 text-aviso" /> Llamar al mesero
        </div>
      </div>
    </div>
  );
}

/* --------------------------------------------------------- Escritorio (personal) */

const TABS = { Cocina: Flame, Caja: Receipt, Administración: Settings };

/** La barra del panel del personal. Solo muestra las secciones que el plan incluye. */
function StaffBar({ tabs, active, who }) {
  return (
    <div className="h-14 px-5 flex items-center gap-6 border-b border-linea">
      <div className="leading-tight min-w-0">
        <p className="font-display font-bold text-[15px] tracking-tight truncate">La Trattoria</p>
        <p className="text-xs text-suave truncate">{who}</p>
      </div>
      <div className="flex items-stretch self-stretch">
        {tabs.map((label) => {
          const Icon = TABS[label];
          return (
            <span
              key={label}
              className={`relative flex items-center gap-1.5 px-3 text-sm font-bold ${active === label ? 'text-tinta after:absolute after:inset-x-2 after:bottom-0 after:h-[3px] after:rounded-t-full after:bg-hoja' : 'text-suave'}`}
            >
              <Icon className="w-3.5 h-3.5" /> {label}
            </span>
          );
        })}
      </div>
      <div className="ml-auto flex items-center gap-3 text-suave">
        <Volume2 className="w-4 h-4" />
        <LogOut className="w-4 h-4" />
      </div>
    </div>
  );
}

function PageHead({ title, subtitle, children }) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div>
        <p className="font-display font-extrabold text-2xl tracking-tight leading-none">{title}</p>
        <p className="mt-1.5 text-sm text-suave">{subtitle}</p>
      </div>
      {children}
    </div>
  );
}

function Segmented({ options }) {
  return (
    <div className="inline-flex p-1 rounded-full bg-linea/60 text-sm font-bold">
      {options.map(([label, count, on, tone = 'bg-tinta text-mantel']) => (
        <span key={label} className={`h-9 px-4 rounded-full inline-flex items-center gap-2 whitespace-nowrap ${on ? 'bg-plato text-tinta shadow-sm' : 'text-suave'}`}>
          {label}
          <span className={`precio text-xs min-w-5 h-5 px-1.5 rounded-full inline-flex items-center justify-center ${tone}`}>{count}</span>
        </span>
      ))}
    </div>
  );
}

/** Plan Básico: el editor de la carta en Administración. */
export function CartaAdminScreen() {
  const rows = PLATOS.slice(0, 4).map((p, i) => ({ ...p, soldOut: i === 2 }));
  return (
    <div className="h-[440px] flex flex-col">
      <StaffBar tabs={['Administración']} active="Administración" who="Kike (Dueño)" />
      <div className="p-5 space-y-4 flex-1 overflow-hidden">
        <p className="text-xs font-bold text-suave inline-flex items-center gap-1">
          <ArrowLeft className="w-3.5 h-3.5" /> Administración
        </p>
        <PageHead title="Platillos" subtitle="8 platos en la carta. Los ocultos no aparecen para el comensal.">
          <span className="btn btn-sm btn-primary pointer-events-none">
            <Plus className="w-4 h-4" /> Nuevo platillo
          </span>
        </PageHead>
        <div>
          <p className="font-bold">
            Platos fuertes <span className="text-suave font-normal">5</span>
          </p>
          <ul className="mt-2 surface divide-y divide-linea overflow-hidden text-sm">
            {rows.map((p, i) => (
              <li key={p.name} className="drop-in px-4 py-2.5 flex items-center gap-4" style={{ transitionDelay: `${150 + i * 90}ms` }}>
                <img src={p.img} alt="" className="w-12 h-12 rounded-xl object-cover shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-bold truncate">{p.name}</p>
                  <p className="flex items-center gap-2">
                    <span className="precio">{p.price}</span>
                    {p.soldOut && <span className="text-xs font-bold px-1.5 py-0.5 rounded bg-aji text-white">Agotado</span>}
                  </p>
                </div>
                <div className="flex items-center gap-3 text-suave shrink-0">
                  <Eye className="w-4 h-4" />
                  <Edit3 className="w-4 h-4" />
                  <Trash2 className="w-4 h-4" />
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function Ticket({ mesa, mins, chip, items, action, className = '', style }) {
  return (
    <article className={`tiquete pt-4 px-3.5 pb-3 text-sm ${className}`} style={style}>
      <header className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
        <span className="font-display font-extrabold text-lg leading-none whitespace-nowrap">Mesa {mesa}</span>
        <span className={`chip ${chip.cls} h-6 px-2 text-xs`}>{chip.label}</span>
      </header>
      <p className="precio text-xs text-suave mt-1">{mins} min en espera</p>
      <ul className="mt-2 space-y-1 font-bold">
        {items.map((it) => (
          <li key={it} className="truncate">
            {it}
          </li>
        ))}
      </ul>
      <div className={`mt-3 h-9 rounded-full flex items-center justify-center font-bold text-sm ${action.cls}`}>{action.label}</div>
    </article>
  );
}

const COMANDAS = [
  { mesa: 4, mins: 2, chip: { cls: 'chip-pendiente', label: 'Nueva' }, items: ['1 × Risotto de hongos', '1 × Ñoquis al pesto', '2 × Limonada de saúco'], action: { cls: 'bg-tinta text-mantel', label: 'Tomar orden' } },
  { mesa: 7, mins: 9, chip: { cls: 'chip-preparando', label: 'En preparación' }, items: ['1 × Salmón a la parrilla', '1 × Ensalada de la casa'], action: { cls: 'bg-hoja text-sobre-hoja', label: 'Marcar lista' } },
  { mesa: 2, mins: 14, chip: { cls: 'chip-preparando', label: 'En preparación' }, items: ['2 × Cordero al romero', '1 × Tiramisú'], action: { cls: 'bg-hoja text-sobre-hoja', label: 'Marcar lista' } },
  { mesa: 11, mins: 1, chip: { cls: 'chip-listo', label: 'Lista' }, items: ['1 × Carpaccio', '2 × Agua con gas'], action: { cls: 'bg-plato border border-linea text-tinta', label: 'Entregada' } }
];

/** Plan Intermedio: la cocina con el riel de comandas y el llamado al mesero. */
export function CocinaDesktop() {
  return (
    <div className="relative h-[480px] flex flex-col">
      <StaffBar tabs={['Cocina', 'Administración']} active="Cocina" who="Cocina" />
      <div className="p-5 space-y-4 flex-1 overflow-hidden">
        <PageHead title="Cocina" subtitle="4 comandas en el riel">
          <Segmented options={[['Comandas', 4, true], ['Ingredientes', 1, false, 'bg-aji text-white']]} />
        </PageHead>
        <div className="rounded-[24px] bg-acero p-4 text-mantel">
          <div className="h-2.5 rounded-full bg-gradient-to-b from-white/25 to-white/5" aria-hidden="true" />
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
            {COMANDAS.map((t, i) => (
              <Ticket key={t.mesa} {...t} className="drop-in" style={{ transitionDelay: `${150 + i * 110}ms` }} />
            ))}
          </div>
        </div>
      </div>
      {/* El llamado al mesero, como aparece en el panel: en la esquina, en cualquier sección. */}
      <div className="drop-in absolute right-4 bottom-4 w-72 rounded-2xl bg-tinta text-mantel shadow-2xl p-3 pl-4 flex items-center gap-3 text-sm" style={{ transitionDelay: '700ms' }}>
        <Bell className="w-4 h-4 text-maracuya shrink-0" />
        <div className="flex-1 leading-tight">
          <p className="font-bold">Mesa 6 llama al mesero</p>
          <p className="text-xs text-mantel/70">Ahora</p>
        </div>
        <span className="h-8 px-3 rounded-full bg-mantel text-tinta inline-flex items-center font-bold text-xs">Atendido</span>
      </div>
    </div>
  );
}

function Stat({ label, value, tone = '' }) {
  return (
    <div className="surface px-4 py-3">
      <p className="text-xs text-suave">{label}</p>
      <p className={`precio font-bold text-xl leading-tight truncate ${tone}`}>{value}</p>
    </div>
  );
}

function TableBill({ mesa, comandas, consumo, lines, delay = 0 }) {
  return (
    <article className="drop-in surface overflow-hidden" style={{ transitionDelay: `${delay}ms` }}>
      <header className="px-4 pt-4 pb-3 flex items-start justify-between gap-3">
        <div>
          <p className="font-display font-extrabold text-2xl tracking-tight leading-none">Mesa {mesa}</p>
          <p className="mt-2">
            <span className="chip chip-cobrar h-6 px-2 text-xs">
              {comandas} {comandas === 1 ? 'comanda' : 'comandas'}
            </span>
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-suave">Consumo</p>
          <p className="precio font-bold text-xl">{consumo}</p>
        </div>
      </header>
      <ul className="border-t border-linea divide-y divide-linea text-sm">
        {lines.map(([id, resumen, valor]) => (
          <li key={id} className="px-4 py-2 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-bold">Comanda {id}</p>
              <p className="text-xs text-suave truncate">{resumen}</p>
            </div>
            <span className="precio text-suave shrink-0">{valor}</span>
          </li>
        ))}
      </ul>
      <div className="p-3 border-t border-linea">
        <div className="h-10 rounded-full bg-hoja text-sobre-hoja flex items-center justify-center gap-2 font-bold text-sm">
          <Receipt className="w-4 h-4" /> Cobrar la mesa
        </div>
      </div>
    </article>
  );
}

/** Plan Premium: la caja con las cifras del turno y las mesas por cobrar. */
export function CajaDesktop() {
  return (
    <div className="h-[480px] flex flex-col">
      <StaffBar tabs={['Cocina', 'Caja', 'Administración']} active="Caja" who="Caja" />
      <div className="p-5 space-y-4 flex-1 overflow-hidden">
        <PageHead title="Caja" subtitle="2 mesas esperan la cuenta">
          <div className="flex items-center gap-2">
            <Segmented options={[['Resumen', 2, true], ['Plano de mesas', 5, false]]} />
            <span className="btn btn-sm btn-quiet pointer-events-none whitespace-nowrap">
              <Calculator className="w-4 h-4" /> Cerrar caja (Z)
            </span>
          </div>
        </PageHead>
        <div className="grid grid-cols-4 gap-3">
          <Stat label="Ventas del turno" value="$1.284.900" tone="text-hoja" />
          <Stat label="Mesas por cobrar" value="2" />
          <Stat label="Comandas en cocina" value="4" />
          <Stat label="Consumo abierto en sala" value="$312.000" />
        </div>
        <div>
          <div className="flex items-baseline justify-between">
            <p className="font-bold">Mesas por cobrar (2)</p>
            <span className="text-xs font-bold text-suave inline-flex items-center gap-1">
              Ver plano de mesas <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-4 items-start">
            <TableBill delay={200} mesa="4" comandas={2} consumo="$89.000" lines={[['1042', '1 Risotto de hongos, 1 Ñoquis al pesto', '$65.000'], ['1047', '2 Limonada de flor de saúco', '$24.000']]} />
            <TableBill delay={340} mesa="7" comandas={1} consumo="$104.000" lines={[['1045', '1 Salmón a la parrilla, 1 Cordero al romero', '$104.000']]} />
          </div>
        </div>
      </div>
    </div>
  );
}
