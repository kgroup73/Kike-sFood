import { useMemo } from 'react';
import {
  Search,
  Plus,
  ArrowLeft,
  ChevronRight,
  Salad,
  ChefHat,
  Beef,
  CupSoda,
  Cake,
  Award,
  Leaf,
  Wheat,
  Star,
  Clock,
  Heart,
  PackageX
} from 'lucide-react';
import { formatCOP } from '../../lib/money';

const CATEGORY_META = {
  'Entradas': { icon: Salad, tagline: 'Para abrir el apetito' },
  'Platos Fuertes': { icon: ChefHat, tagline: 'El corazón de la carta' },
  'Hamburguesas': { icon: Beef, tagline: 'Gourmet y artesanales' },
  'Bebidas': { icon: CupSoda, tagline: 'Para acompañar tu mesa' },
  'Postres': { icon: Cake, tagline: 'El final perfecto' }
};

export default function ClientView({
  company,
  products,
  categories = [],
  stories = [],
  searchQuery,
  setSearchQuery,
  activeCategory,
  setActiveCategory,
  dietaryFilter,
  setDietaryFilter,
  setSelectedProduct,
  favorites = [],
  toggleFavorite,
  onOpenStory,
  canOrder = true
}) {
  const filteredProducts = useMemo(() => {
    const visible = products.filter(p => {
      const isAvailable = p.available !== false;
      const matchesCategory = activeCategory === 'Todos' || p.category === activeCategory;
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        (p.description || '').toLowerCase().includes(q) ||
        (p.ingredients || []).some(ing => ing.toLowerCase().includes(q));

      let matchesDiet = true;
      if (dietaryFilter === 'veg') matchesDiet = p.isVeg;
      if (dietaryFilter === 'chef') matchesDiet = p.isChef;
      if (dietaryFilter === 'gf') matchesDiet = p.isGf;
      if (dietaryFilter === 'popular') matchesDiet = p.isPopular;
      if (dietaryFilter === 'spicy') matchesDiet = (p.spicyLevel || 0) > 0;
      if (dietaryFilter === 'fav') matchesDiet = favorites.includes(p.id);

      return isAvailable && matchesCategory && matchesSearch && matchesDiet;
    });

    // Los agotados se muestran como "No Disponible" al final de la carta
    return [...visible].sort((a, b) => (a.soldOut ? 1 : 0) - (b.soldOut ? 1 : 0));
  }, [products, searchQuery, activeCategory, dietaryFilter, favorites]);

  const menuCategories = useMemo(() => {
    return categories.map(cat => {
      const items = products.filter(p => p.available !== false && p.category === cat);
      const cover = items.find(p => !p.soldOut) || items[0];
      const meta = CATEGORY_META[cat] || {};
      return {
        name: cat,
        count: items.length,
        availableCount: items.filter(p => !p.soldOut).length,
        image: cover?.image,
        icon: meta.icon,
        tagline: meta.tagline || 'Delicias de la casa'
      };
    });
  }, [products, categories]);

  const showCategoryMenu = activeCategory === 'Todos' && !searchQuery && !dietaryFilter;

  const headerTitle = activeCategory !== 'Todos'
    ? activeCategory
    : searchQuery
      ? `Resultados para "${searchQuery}"`
      : 'Todos los platillos';

  const initials = company?.name
    ? company.name
        .split(' ')
        .filter((w) => /[A-Za-zÁÉÍÓÚáéíóúÑñ]/.test(w))
        .slice(0, 2)
        .map((w) => w[0].toUpperCase())
        .join('')
    : '';

  return (
    <div className="space-y-4 sm:space-y-6">

      {/* 0. Branding del Restaurante (Logo + Nombre) */}
      <header className="flex flex-col items-center text-center gap-2.5 pt-2 sm:pt-4 pb-1">
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-brand-gold to-brand-gold-light flex items-center justify-center text-brand-ivory shadow-lg shadow-brand-gold/30 border border-brand-gold-light/40">
          <span className="font-extrabold text-xl sm:text-2xl tracking-wider leading-none">{initials}</span>
        </div>
        <div>
          <h1 className="font-serif font-black text-xl sm:text-2xl text-brand-ivory leading-tight">
            {company?.name || 'Restaurante'}
          </h1>
          <p className="text-[11px] text-brand-khaki font-bold uppercase tracking-widest mt-0.5">
            Menú Digital · {company?.address || 'Escanea y descubre'}
          </p>
        </div>
      </header>

      {/* 1. Historias Destacadas (estilo Instagram) */}
      <div className="flex justify-center">
        <div className="flex items-center space-x-4 overflow-x-auto hide-scrollbar py-1 px-1 -mx-1">
        {stories.map((story, idx) => (
          <button
            key={story.id}
            onClick={() => onOpenStory && onOpenStory(idx)}
            className="flex flex-col items-center space-y-1 shrink-0 group focus:outline-none"
          >
            <div className="p-[2.5px] rounded-full bg-gradient-to-tr from-brand-gold via-brand-gold-light to-brand-cream group-hover:scale-105 transition-transform duration-300 shadow-md">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full overflow-hidden bg-brand-dark border-2 border-brand-night">
                <img
                  src={story.image}
                  alt={story.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  loading="lazy"
                />
              </div>
            </div>
            <span className="text-[10px] font-bold text-brand-cream group-hover:text-brand-gold-light transition-colors truncate max-w-[72px] text-center">
              {story.title}
            </span>
          </button>
        ))}
        </div>
      </div>

      {showCategoryMenu ? (
        /* 3. Category Selection Screen (Menú Físico) */
        <div className="space-y-3">
          <div className="flex items-end justify-between px-0.5">
            <div>
              <h2 className="font-serif font-black text-lg sm:text-xl text-brand-ivory">Menú</h2>
              <p className="text-[11px] text-brand-khaki font-bold">
                Elige una sección para explorar
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
            {menuCategories.map(cat => {
              const Icon = cat.icon || ChefHat;
              return (
                <button
                  key={cat.name}
                  onClick={() => setActiveCategory(cat.name)}
                  className="group relative overflow-hidden rounded-2xl border border-brand-line bg-brand-panel text-left shadow-lg hover:border-brand-gold/60 hover:shadow-2xl hover:shadow-brand-gold/10 transition-all focus:outline-none"
                >
                  <div className="relative h-36 sm:h-44 overflow-hidden">
                    {cat.image ? (
                      <img
                        src={cat.image}
                        alt={cat.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-brand-hover to-brand-night flex items-center justify-center">
                        <Icon className="w-10 h-10 text-brand-gold" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-brand-dark via-brand-dark/40 to-transparent" />
                    <div className="absolute top-3 left-3 w-9 h-9 rounded-xl bg-brand-dark/70 backdrop-blur-md border border-white/10 flex items-center justify-center">
                      <Icon className="w-4 h-4 text-brand-gold-light" />
                    </div>
                    <div className="absolute bottom-0 inset-x-0 p-3">
                      <h3 className="font-black text-brand-ivory text-sm sm:text-base">{cat.name}</h3>
                      <p className="text-[11px] text-brand-mute font-semibold">
                        {cat.availableCount > 0
                          ? `${cat.availableCount} ${cat.availableCount === 1 ? 'platillo' : 'platillos'} disponibles`
                          : cat.count > 0
                            ? 'Agotados temporalmente'
                            : 'Próximamente'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-2 p-3">
                    <p className="text-[11px] text-brand-khaki truncate">{cat.tagline}</p>
                    <ChevronRight className="w-4 h-4 text-brand-gold shrink-0 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <>
          {/* 3. Dietary & Lifestyle Chips */}
          <div className="flex items-center space-x-1.5 overflow-x-auto hide-scrollbar text-[11px] py-0.5">
            <button
              onClick={() => setDietaryFilter(dietaryFilter === 'popular' ? '' : 'popular')}
              className={`border px-3 py-1 rounded-full flex items-center gap-1.5 whitespace-nowrap transition-all ${
                dietaryFilter === 'popular'
                  ? 'bg-brand-gold/20 text-brand-cream border-brand-gold font-bold shadow'
                  : 'bg-brand-panel text-brand-khaki border-brand-line hover:text-brand-cream'
              }`}
            >
              <Star className="w-3 h-3 text-brand-gold-light fill-brand-gold-light" />
              <span>Más Populares</span>
            </button>

            <button
              onClick={() => setDietaryFilter(dietaryFilter === 'chef' ? '' : 'chef')}
              className={`border px-3 py-1 rounded-full flex items-center gap-1.5 whitespace-nowrap transition-all ${
                dietaryFilter === 'chef'
                  ? 'bg-brand-gold/20 text-brand-cream border-brand-gold font-bold'
                  : 'bg-brand-panel text-brand-khaki border-brand-line hover:text-brand-cream'
              }`}
            >
              <Award className="w-3 h-3 text-brand-gold-light" />
              <span>Especial Chef</span>
            </button>

            <button
              onClick={() => setDietaryFilter(dietaryFilter === 'veg' ? '' : 'veg')}
              className={`border px-3 py-1 rounded-full flex items-center gap-1.5 whitespace-nowrap transition-all ${
                dietaryFilter === 'veg'
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500 font-bold'
                  : 'bg-brand-panel text-brand-khaki border-brand-line hover:text-brand-cream'
              }`}
            >
              <Leaf className="w-3 h-3 text-emerald-400" />
              <span>Vegano</span>
            </button>

            <button
              onClick={() => setDietaryFilter(dietaryFilter === 'gf' ? '' : 'gf')}
              className={`border px-3 py-1 rounded-full flex items-center gap-1.5 whitespace-nowrap transition-all ${
                dietaryFilter === 'gf'
                  ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500 font-bold'
                  : 'bg-brand-panel text-brand-khaki border-brand-line hover:text-brand-cream'
              }`}
            >
              <Wheat className="w-3 h-3 text-indigo-400" />
              <span>Sin Gluten</span>
            </button>

            <button
              onClick={() => setDietaryFilter(dietaryFilter === 'spicy' ? '' : 'spicy')}
              className={`border px-3 py-1 rounded-full flex items-center gap-1.5 whitespace-nowrap transition-all ${
                dietaryFilter === 'spicy'
                  ? 'bg-red-500/20 text-red-300 border-red-500 font-bold'
                  : 'bg-brand-panel text-brand-khaki border-brand-line hover:text-brand-cream'
              }`}
            >
              <span>🌶️ Con Picante</span>
            </button>
          </div>

          {/* 4. Section Header with Back Navigation */}
          <div className="flex items-center justify-between gap-2 pt-0.5">
            <div className="flex items-center gap-2 min-w-0">
              {activeCategory !== 'Todos' && (
                <button
                  onClick={() => setActiveCategory('Todos')}
                  className="shrink-0 flex items-center gap-1 px-2.5 py-1.5 bg-brand-panel border border-brand-line rounded-xl text-[11px] font-bold text-brand-mute hover:text-brand-ivory hover:border-brand-gold transition-all"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Menú
                </button>
              )}
              <div className="min-w-0">
                <h2 className="font-black text-brand-ivory text-sm sm:text-base truncate">{headerTitle}</h2>
                <p className="text-[10px] text-brand-khaki font-bold">
                  {filteredProducts.length} {filteredProducts.length === 1 ? 'platillo' : 'platillos'}
                </p>
              </div>
            </div>
          </div>

          {/* 5. Products Grid View */}
          <div className="view-fade-enter">
            <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5 sm:gap-5">
              {filteredProducts.map(product => {
                const isFav = favorites.includes(product.id);
                return (
                  <div
                    key={product.id}
                    className="bg-brand-panel border border-brand-line rounded-2xl overflow-hidden hover:border-brand-gold/50 transition-all flex flex-col justify-between group shadow-lg hover:shadow-2xl hover:shadow-brand-gold/5 relative"
                  >
                    {/* Photo & Top Floating Badges */}
                    <div
                      className="relative h-44 sm:h-48 overflow-hidden bg-brand-dark cursor-pointer"
                      onClick={() => setSelectedProduct(product)}
                    >
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-500"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-brand-dark/90 via-transparent to-black/30" />

                      {/* Overlay Agotado (Inventario en tiempo real) */}
                      {product.soldOut && (
                        <div className="absolute inset-0 bg-brand-dark/75 backdrop-grayscale flex flex-col items-center justify-center gap-1.5 z-10 pointer-events-none">
                          <PackageX className="w-6 h-6 text-rose-400" />
                          <span className="bg-rose-600 text-white text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider shadow-lg">Agotado</span>
                          <span className="text-[9px] text-brand-mute font-bold uppercase tracking-wider">No disponible</span>
                        </div>
                      )}

                      {/* Top Left Tags */}
                      <div className="absolute top-2 left-2 flex flex-wrap gap-1">
                        {product.isChef && (
                          <span className="bg-brand-gold text-brand-ivory text-[9px] font-extrabold px-2 py-0.5 rounded-full shadow">
                            Chef
                          </span>
                        )}
                        {product.isVeg && (
                          <span className="bg-emerald-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow">
                            Vegano
                          </span>
                        )}
                        {product.isGf && (
                          <span className="bg-indigo-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow">
                            Sin Gluten
                          </span>
                        )}
                      </div>

                      {/* Favorite Toggle Button */}
                      <button
                        aria-label={isFav ? `Quitar ${product.name} de favoritos` : `Guardar ${product.name} en favoritos`}
                        aria-pressed={isFav}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (toggleFavorite) toggleFavorite(product.id);
                        }}
                        className={`absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-md border transition-all ${
                          isFav
                            ? 'bg-rose-500 text-white border-rose-400 shadow-md'
                            : 'bg-brand-dark/70 text-brand-khaki hover:text-white border-white/10 hover:bg-brand-surface'
                        }`}
                      >
                        <Heart className={`w-3.5 h-3.5 ${isFav ? 'fill-current' : ''}`} />
                      </button>

                      {/* Bottom Image Info */}
                      <div className="absolute bottom-2 left-2.5 right-2.5 flex items-center justify-between text-[11px] text-brand-ivory">
                        {product.rating && (
                          <span className="bg-brand-dark/80 backdrop-blur-md text-brand-gold-light font-bold px-2 py-0.5 rounded-lg border border-brand-gold/30 flex items-center gap-1">
                            <Star className="w-3 h-3 fill-current" /> {product.rating}
                          </span>
                        )}
                        {product.prepTime && (
                          <span className="bg-brand-dark/80 backdrop-blur-md text-brand-mute px-2 py-0.5 rounded-lg border border-white/10 flex items-center gap-1 text-[10px]">
                            <Clock className="w-2.5 h-2.5 text-brand-gold-light" /> {product.prepTime}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Card Content */}
                    <div className="p-3.5 flex-1 flex flex-col justify-between space-y-3">
                      <div>
                        <h3
                          className="font-bold text-brand-ivory text-xs sm:text-sm group-hover:text-brand-gold-light transition-colors cursor-pointer line-clamp-1"
                          onClick={() => setSelectedProduct(product)}
                        >
                          {product.name}
                        </h3>
                        <p className="text-[11px] text-brand-khaki mt-1 line-clamp-2 leading-relaxed">
                          {product.description}
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-brand-raised">
                        <span className="text-brand-gold font-extrabold text-sm sm:text-base">
                          {formatCOP(product.price)}
                        </span>
                        {product.soldOut ? (
                          <span className="px-3.5 py-1.5 bg-brand-line text-rose-300 font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-not-allowed">
                            <PackageX className="w-3.5 h-3.5" /> Agotado
                          </span>
                        ) : (
                          <button
                            onClick={() => setSelectedProduct(product)}
                            className="px-3.5 py-1.5 bg-gradient-to-r from-brand-gold to-brand-gold-light hover:from-brand-gold-light hover:to-brand-gold active:scale-95 text-brand-ivory font-bold text-xs rounded-xl shadow-md shadow-brand-gold/20 transition-all flex items-center gap-1.5"
                          >
                            <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                            <span>{canOrder ? 'Pedir' : 'Ver'}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Empty State */}
          {!filteredProducts.length && (
            <div className="py-16 text-center text-brand-khaki space-y-3 bg-brand-panel/60 rounded-3xl border border-brand-line p-6">
              <Search className="w-10 h-10 mx-auto text-brand-khaki animate-bounce" />
              <h4 className="text-sm font-bold text-brand-ivory">No encontramos platillos con esos filtros</h4>
              <p className="text-xs text-brand-khaki max-w-sm mx-auto">
                Prueba buscando con otro término o desactiva los filtros de dieta para ver todas las delicias del menú.
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setActiveCategory('Todos');
                  setDietaryFilter('');
                }}
                className="px-4 py-2 bg-brand-gold/20 text-brand-cream border border-brand-gold/40 hover:bg-brand-gold hover:text-brand-ivory font-bold text-xs rounded-xl transition-all"
              >
                Volver al Menú
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}