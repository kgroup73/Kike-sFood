import { useEffect, useMemo, useRef, useState } from 'react';
import { Search, X, Plus, Star, ChefHat, Leaf, WheatOff, Flame, Heart } from 'lucide-react';
import { formatCOP } from '../../lib/money';
import DishImage from './DishImage';

const FILTERS = [
  { id: 'popular', label: 'Más pedidos', icon: Star, test: (p) => p.isPopular },
  { id: 'chef', label: 'Del chef', icon: ChefHat, test: (p) => p.isChef },
  { id: 'veg', label: 'Vegano', icon: Leaf, test: (p) => p.isVeg },
  { id: 'gf', label: 'Sin gluten', icon: WheatOff, test: (p) => p.isGf },
  { id: 'spicy', label: 'Picante', icon: Flame, test: (p) => (p.spicyLevel || 0) > 0 },
  { id: 'fav', label: 'Favoritos', icon: Heart, test: (p, favs) => favs.includes(p.id) }
];

const sectionId = (i) => `seccion-${i}`;
const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

function matchesSearch(p, q) {
  if (!q) return true;
  return (
    p.name.toLowerCase().includes(q) ||
    (p.description || '').toLowerCase().includes(q) ||
    (p.ingredients || []).some((ing) => ing.toLowerCase().includes(q))
  );
}

/**
 * La carta en una sola página: pestañas fijas que saltan a cada sección y se
 * marcan solas al hacer scroll, recomendados del día y una fila por platillo.
 */
export default function ClientView({
  products,
  categories = [],
  stories = [],
  searchQuery,
  setSearchQuery,
  dietaryFilter,
  setDietaryFilter,
  setSelectedProduct,
  onQuickAdd,
  favorites = [],
  onOpenStory,
  canOrder = true
}) {
  const [searchOpen, setSearchOpen] = useState(false);
  const q = searchQuery.trim().toLowerCase();
  const filter = FILTERS.find((f) => f.id === dietaryFilter);
  const narrowing = !!q || !!filter;

  const sections = useMemo(
    () =>
      categories
        .map((name) => ({
          name,
          items: products
            .filter((p) => p.category === name && matchesSearch(p, q) && (!filter || filter.test(p, favorites)))
            // Los agotados van al final de su sección.
            .sort((a, b) => (a.soldOut ? 1 : 0) - (b.soldOut ? 1 : 0))
        }))
        .filter((s) => s.items.length > 0),
    [categories, products, q, filter, favorites]
  );

  const [current, setCurrent] = useState(null);
  const listRef = useRef(null);
  const tabsRef = useRef(null);
  const sectionsKey = sections.map((s) => s.name).join('|');

  // Marca la pestaña de la sección que se está leyendo.
  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined' || !listRef.current) return undefined;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setCurrent(visible[0].target.dataset.section);
      },
      { rootMargin: '-140px 0px -55% 0px' }
    );
    listRef.current.querySelectorAll('[data-section]').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [sectionsKey]);

  // Mantiene visible la pestaña activa dentro de la fila de pestañas.
  useEffect(() => {
    const bar = tabsRef.current;
    const tab = bar && [...bar.querySelectorAll('[data-tab]')].find((el) => el.dataset.tab === current);
    if (bar && tab && typeof bar.scrollTo === 'function') {
      bar.scrollTo({ left: tab.offsetLeft - 16, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
    }
  }, [current]);

  const goTo = (i, name) => {
    setCurrent(name);
    document.getElementById(sectionId(i))?.scrollIntoView?.({
      behavior: prefersReducedMotion() ? 'auto' : 'smooth',
      block: 'start'
    });
  };

  const activeSection = current && sections.some((s) => s.name === current) ? current : sections[0]?.name;

  return (
    <div>
      {/* Barra fija: secciones y búsqueda */}
      <nav aria-label="Secciones de la carta" className="sticky top-0 z-30 bg-mantel/95 backdrop-blur border-b border-linea -mx-4 sm:-mx-6 px-4 sm:px-6">
        {searchOpen ? (
          <div className="flex items-center gap-2 h-14">
            <Search className="w-5 h-5 text-suave shrink-0" aria-hidden="true" />
            <input
              autoFocus
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Busca un plato o ingrediente"
              aria-label="Buscar en la carta"
              className="flex-1 min-w-0 bg-transparent text-base placeholder:text-suave focus:outline-none"
            />
            <button
              onClick={() => {
                setSearchQuery('');
                setSearchOpen(false);
              }}
              aria-label="Cerrar búsqueda"
              className="w-10 h-10 -mr-2 rounded-full flex items-center justify-center text-suave hover:text-tinta"
            >
              <X className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-1 h-14">
            <div ref={tabsRef} className="flex-1 min-w-0 flex items-center gap-1 overflow-x-auto hide-scrollbar relative">
              {sections.map((s, i) => {
                const active = s.name === activeSection;
                return (
                  <button
                    key={s.name}
                    data-tab={s.name}
                    onClick={() => goTo(i, s.name)}
                    aria-current={active ? 'true' : undefined}
                    className={`shrink-0 h-10 px-3 rounded-full text-[15px] whitespace-nowrap transition-colors ${
                      active ? 'bg-tinta text-mantel font-bold' : 'text-suave hover:text-tinta'
                    }`}
                  >
                    {s.name}
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => setSearchOpen(true)}
              aria-label="Buscar en la carta"
              className="w-10 h-10 -mr-2 shrink-0 rounded-full flex items-center justify-center text-tinta hover:bg-linea/60"
            >
              <Search className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>
        )}
      </nav>

      {/* Filtros */}
      <div className="flex gap-2 overflow-x-auto hide-scrollbar py-4 -mx-4 px-4 sm:-mx-6 sm:px-6" role="group" aria-label="Filtrar platos">
        {FILTERS.map(({ id, label, icon: Icon }) => {
          const on = dietaryFilter === id;
          return (
            <button
              key={id}
              onClick={() => setDietaryFilter(on ? '' : id)}
              aria-pressed={on}
              className={`shrink-0 h-9 px-3.5 rounded-full border text-sm flex items-center gap-1.5 transition-colors ${
                on
                  ? 'bg-hoja border-hoja text-sobre-hoja font-bold'
                  : 'border-linea text-tinta hover:border-suave'
              }`}
            >
              <Icon className="w-4 h-4" aria-hidden="true" />
              {label}
            </button>
          );
        })}
      </div>

      {/* Recomendados del día */}
      {!narrowing && stories.length > 0 && (
        <section aria-labelledby="hoy-recomendamos" className="pb-2">
          <h2 id="hoy-recomendamos" className="font-display font-bold text-xl tracking-tight mb-3">
            Hoy recomendamos
          </h2>
          <ul className="flex gap-3 overflow-x-auto hide-scrollbar -mx-4 px-4 sm:-mx-6 sm:px-6 pb-1">
            {stories.map((story, idx) => {
              const p = products.find((x) => x.id === story.productId);
              if (!p) return null;
              return (
                <li key={story.id} className="shrink-0 w-36">
                  <button onClick={() => onOpenStory?.(idx)} className="text-left w-full group rounded-2xl">
                    <DishImage src={story.image} className="w-36 h-44 rounded-2xl" />
                    <p className="mt-2 text-[15px] font-bold leading-snug line-clamp-2 group-hover:underline underline-offset-2">{p.name}</p>
                    <p className="text-sm text-suave">{p.isChef ? 'Receta del chef' : 'De los más pedidos'}</p>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {/* Secciones */}
      <div ref={listRef}>
        {sections.map((section, i) => (
          <section
            key={section.name}
            id={sectionId(i)}
            data-section={section.name}
            aria-labelledby={`${sectionId(i)}-titulo`}
            className="scroll-mt-16 pt-8"
          >
            <h2
              id={`${sectionId(i)}-titulo`}
              className="font-display font-extrabold text-[2rem] sm:text-[2.5rem] leading-none tracking-tight pb-3 border-b-2 border-tinta"
            >
              {section.name}
            </h2>
            <ul className="md:grid md:grid-cols-2 md:gap-x-10">
              {section.items.map((product) => (
                <DishRow
                  key={product.id}
                  product={product}
                  isFavorite={favorites.includes(product.id)}
                  onOpen={() => setSelectedProduct(product)}
                  onQuickAdd={canOrder && !product.soldOut && !product.modifiers?.length ? () => onQuickAdd?.(product) : null}
                />
              ))}
            </ul>
          </section>
        ))}
      </div>

      {!sections.length && (
        <div className="py-16 text-center space-y-3">
          <p className="font-display font-bold text-xl">
            {q ? `Nada coincide con «${searchQuery.trim()}»` : 'Ningún plato tiene ese filtro'}
          </p>
          <p className="text-suave">Prueba con otra palabra o quita el filtro.</p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSearchOpen(false);
              setDietaryFilter('');
            }}
            className="h-11 px-5 rounded-full bg-tinta text-mantel font-bold"
          >
            Ver toda la carta
          </button>
        </div>
      )}
    </div>
  );
}

function DishRow({ product, isFavorite, onOpen, onQuickAdd }) {
  const [added, setAdded] = useState(0);
  const tags = [
    product.isChef && { icon: ChefHat, label: 'Del chef' },
    product.isVeg && { icon: Leaf, label: 'Vegano' },
    product.isGf && { icon: WheatOff, label: 'Sin gluten' },
    (product.spicyLevel || 0) > 0 && { icon: Flame, label: 'Picante', tone: 'text-aji' }
  ].filter(Boolean);

  return (
    <li className={`relative flex gap-4 py-5 border-b border-linea ${product.soldOut ? 'opacity-60' : ''}`}>
      <div className="flex-1 min-w-0">
        <h3 className="font-display font-semibold text-[17px] leading-snug">
          {/* El botón se extiende a toda la fila (after:inset-0) para abrir el detalle. */}
          <button onClick={onOpen} className="text-left after:absolute after:inset-0 after:content-[''] focus-visible:outline-none focus-visible:after:outline focus-visible:after:outline-2 focus-visible:after:outline-hoja focus-visible:after:rounded-xl">
            {product.name}
          </button>
          {isFavorite && <Heart className="inline w-3.5 h-3.5 ml-1.5 -mt-0.5 fill-aji text-aji" aria-label="En tus favoritos" />}
        </h3>
        {product.description && <p className="mt-1 text-[15px] leading-relaxed text-suave line-clamp-2">{product.description}</p>}
        {tags.length > 0 && (
          <ul className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-sm text-suave">
            {tags.map(({ icon: Icon, label, tone }) => (
              <li key={label} className={`flex items-center gap-1 ${tone || ''}`}>
                <Icon className="w-3.5 h-3.5" aria-hidden="true" /> {label}
              </li>
            ))}
          </ul>
        )}
        <p className="mt-2 flex items-baseline gap-3">
          <span className="precio font-bold text-base">{formatCOP(product.price)}</span>
          {product.soldOut && <span className="text-sm font-bold text-aji">Agotado hoy</span>}
        </p>
      </div>

      {(product.image || onQuickAdd) && (
        <div className="relative shrink-0 self-start">
          <DishImage src={product.image} className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl" imgClassName={product.soldOut ? 'grayscale' : ''} />
          {onQuickAdd && (
            <button
              key={added}
              onClick={() => {
                onQuickAdd();
                setAdded((n) => n + 1);
              }}
              aria-label={`Agregar ${product.name} al pedido`}
              className={`absolute -bottom-2 -right-2 z-10 w-10 h-10 rounded-full bg-hoja text-sobre-hoja flex items-center justify-center ring-4 ring-mantel ${added ? 'animate-added' : ''}`}
            >
              <Plus className="w-5 h-5" aria-hidden="true" />
            </button>
          )}
        </div>
      )}
    </li>
  );
}
