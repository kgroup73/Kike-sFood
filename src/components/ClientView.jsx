import React, { useMemo } from 'react';
import {
  Search,
  Plus,
  X,
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
  Sparkles,
  PackageX
} from 'lucide-react';
import { formatCOP } from '../lib/dian';
import { CATEGORIES, MENU_STORIES } from '../data/mockData';

const CATEGORY_META = {
  'Entradas': { icon: Salad, tagline: 'Para abrir el apetito' },
  'Platos Fuertes': { icon: ChefHat, tagline: 'El corazón de la carta' },
  'Hamburguesas': { icon: Beef, tagline: 'Gourmet y artesanales' },
  'Bebidas': { icon: CupSoda, tagline: 'Para acompañar tu mesa' },
  'Postres': { icon: Cake, tagline: 'El final perfecto' }
};

export default function ClientView({
  products,
  searchQuery,
  setSearchQuery,
  activeCategory,
  setActiveCategory,
  dietaryFilter,
  setDietaryFilter,
  setSelectedProduct,
  favorites = [],
  toggleFavorite,
  onOpenStory
}) {
  const filteredProducts = useMemo(() => {
    const visible = products.filter(p => {
      const isAvailable = p.available !== false;
      const matchesCategory = activeCategory === 'Todos' || p.category === activeCategory;
      const matchesSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.ingredients && p.ingredients.some(ing => ing.toLowerCase().includes(searchQuery.toLowerCase())));

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
    return CATEGORIES.filter(c => c !== 'Todos').map(cat => {
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
  }, [products]);

  const showCategoryMenu = activeCategory === 'Todos' && !searchQuery && !dietaryFilter;

  const headerTitle = activeCategory !== 'Todos'
    ? activeCategory
    : searchQuery
      ? `Resultados para "${searchQuery}"`
      : 'Todos los platillos';

  return (
    <div className="space-y-4 sm:space-y-6">

      {/* 1. Gastro Stories & Highlights Bar */}
      <div className="bg-[#1e1b13]/90 backdrop-blur-md border border-[#383324] rounded-2xl p-2.5 sm:p-3 shadow-lg">
        <div className="flex items-center justify-between px-1 mb-2">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#e9e2ca] flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#b8960e]" />
            <span>Historias & Especiales</span>
          </span>
          <span className="text-[10px] text-[#9b7e09] font-bold">Toca para ver</span>
        </div>

        <div className="flex space-x-3 overflow-x-auto hide-scrollbar py-1">
          {MENU_STORIES.map((story, idx) => (
            <button
              key={story.id}
              onClick={() => onOpenStory && onOpenStory(idx)}
              className="flex flex-col items-center space-y-1.5 shrink-0 group focus:outline-none"
            >
              <div className="relative p-0.5 rounded-2xl bg-gradient-to-tr from-[#9b7e09] via-[#b8960e] to-[#e9e2ca] group-hover:scale-105 transition-transform duration-300 shadow-md">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-[14px] overflow-hidden bg-[#110f0a]">
                  <img
                    src={story.image}
                    alt={story.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    loading="lazy"
                  />
                </div>
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-[#9b7e09] text-[#fdfcf7] text-[8px] font-black px-1.5 py-0.2 rounded-full uppercase tracking-tighter shadow">
                  {story.tag.split(' ')[0]}
                </span>
              </div>
              <span className="text-[10px] font-bold text-[#e9e2ca] group-hover:text-[#b8960e] transition-colors truncate max-w-[70px] text-center">
                {story.title}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* 2. Search Bar */}
      <div className="sticky top-[58px] z-20 bg-[#14120c]/95 backdrop-blur-md -mx-3 px-3 py-2 border-b border-[#383324] sm:static sm:bg-transparent sm:backdrop-blur-none sm:p-0 sm:border-none sm:mx-0">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#857f5d]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar platillo, ingrediente o antojo..."
              className="w-full bg-[#1e1b13] border border-[#383324] text-[#fdfcf7] pl-9 pr-8 py-2 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-[#9b7e09] transition-colors shadow-inner placeholder-[#857f5d]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2.5 text-[#857f5d] hover:text-[#fdfcf7]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {showCategoryMenu ? (
        /* 3. Category Selection Screen (Menú Físico) */
        <div className="space-y-3">
          <div className="flex items-end justify-between px-0.5">
            <div>
              <h2 className="font-serif font-black text-lg sm:text-xl text-[#fdfcf7]">Menú</h2>
              <p className="text-[11px] text-[#857f5d] font-bold">
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
                  className="group relative overflow-hidden rounded-2xl border border-[#383324] bg-[#1e1b13] text-left shadow-lg hover:border-[#9b7e09]/60 hover:shadow-2xl hover:shadow-[#9b7e09]/10 transition-all focus:outline-none"
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
                      <div className="w-full h-full bg-gradient-to-br from-[#242017] to-[#14120c] flex items-center justify-center">
                        <Icon className="w-10 h-10 text-[#9b7e09]" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#110f0a] via-[#110f0a]/40 to-transparent" />
                    <div className="absolute top-3 left-3 w-9 h-9 rounded-xl bg-[#110f0a]/70 backdrop-blur-md border border-white/10 flex items-center justify-center">
                      <Icon className="w-4 h-4 text-[#b8960e]" />
                    </div>
                    <div className="absolute bottom-0 inset-x-0 p-3">
                      <h3 className="font-black text-[#fdfcf7] text-sm sm:text-base">{cat.name}</h3>
                      <p className="text-[11px] text-[#aba489] font-semibold">
                        {cat.availableCount > 0
                          ? `${cat.availableCount} ${cat.availableCount === 1 ? 'platillo' : 'platillos'} disponibles`
                          : cat.count > 0
                            ? 'Agotados temporalmente'
                            : 'Próximamente'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-2 p-3">
                    <p className="text-[11px] text-[#857f5d] truncate">{cat.tagline}</p>
                    <ChevronRight className="w-4 h-4 text-[#9b7e09] shrink-0 group-hover:translate-x-0.5 transition-transform" />
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
                  ? 'bg-[#9b7e09]/20 text-[#e9e2ca] border-[#9b7e09] font-bold shadow'
                  : 'bg-[#1e1b13] text-[#857f5d] border-[#383324] hover:text-[#e9e2ca]'
              }`}
            >
              <Star className="w-3 h-3 text-[#b8960e] fill-[#b8960e]" />
              <span>Más Populares</span>
            </button>

            <button
              onClick={() => setDietaryFilter(dietaryFilter === 'chef' ? '' : 'chef')}
              className={`border px-3 py-1 rounded-full flex items-center gap-1.5 whitespace-nowrap transition-all ${
                dietaryFilter === 'chef'
                  ? 'bg-[#9b7e09]/20 text-[#e9e2ca] border-[#9b7e09] font-bold'
                  : 'bg-[#1e1b13] text-[#857f5d] border-[#383324] hover:text-[#e9e2ca]'
              }`}
            >
              <Award className="w-3 h-3 text-[#b8960e]" />
              <span>Especial Chef</span>
            </button>

            <button
              onClick={() => setDietaryFilter(dietaryFilter === 'veg' ? '' : 'veg')}
              className={`border px-3 py-1 rounded-full flex items-center gap-1.5 whitespace-nowrap transition-all ${
                dietaryFilter === 'veg'
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500 font-bold'
                  : 'bg-[#1e1b13] text-[#857f5d] border-[#383324] hover:text-[#e9e2ca]'
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
                  : 'bg-[#1e1b13] text-[#857f5d] border-[#383324] hover:text-[#e9e2ca]'
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
                  : 'bg-[#1e1b13] text-[#857f5d] border-[#383324] hover:text-[#e9e2ca]'
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
                  className="shrink-0 flex items-center gap-1 px-2.5 py-1.5 bg-[#1e1b13] border border-[#383324] rounded-xl text-[11px] font-bold text-[#aba489] hover:text-[#fdfcf7] hover:border-[#9b7e09] transition-all"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Menú
                </button>
              )}
              <div className="min-w-0">
                <h2 className="font-black text-[#fdfcf7] text-sm sm:text-base truncate">{headerTitle}</h2>
                <p className="text-[10px] text-[#857f5d] font-bold">
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
                    className="bg-[#1e1b13] border border-[#383324] rounded-2xl overflow-hidden hover:border-[#9b7e09]/50 transition-all flex flex-col justify-between group shadow-lg hover:shadow-2xl hover:shadow-[#9b7e09]/5 relative"
                  >
                    {/* Photo & Top Floating Badges */}
                    <div
                      className="relative h-44 sm:h-48 overflow-hidden bg-[#110f0a] cursor-pointer"
                      onClick={() => setSelectedProduct(product)}
                    >
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-500"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#110f0a]/90 via-transparent to-black/30" />

                      {/* Overlay Agotado (Inventario en tiempo real) */}
                      {product.soldOut && (
                        <div className="absolute inset-0 bg-[#110f0a]/75 backdrop-grayscale flex flex-col items-center justify-center gap-1.5 z-10 pointer-events-none">
                          <PackageX className="w-6 h-6 text-rose-400" />
                          <span className="bg-rose-600 text-white text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider shadow-lg">Agotado</span>
                          <span className="text-[9px] text-[#aba489] font-bold uppercase tracking-wider">No disponible</span>
                        </div>
                      )}

                      {/* Top Left Tags */}
                      <div className="absolute top-2 left-2 flex flex-wrap gap-1">
                        {product.isChef && (
                          <span className="bg-[#9b7e09] text-[#fdfcf7] text-[9px] font-extrabold px-2 py-0.5 rounded-full shadow">
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
                        onClick={(e) => {
                          e.stopPropagation();
                          if (toggleFavorite) toggleFavorite(product.id);
                        }}
                        className={`absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-md border transition-all ${
                          isFav
                            ? 'bg-rose-500 text-white border-rose-400 shadow-md'
                            : 'bg-[#110f0a]/70 text-[#857f5d] hover:text-white border-white/10 hover:bg-[#1a1711]'
                        }`}
                      >
                        <Heart className={`w-3.5 h-3.5 ${isFav ? 'fill-current' : ''}`} />
                      </button>

                      {/* Bottom Image Info */}
                      <div className="absolute bottom-2 left-2.5 right-2.5 flex items-center justify-between text-[11px] text-[#fdfcf7]">
                        {product.rating && (
                          <span className="bg-[#110f0a]/80 backdrop-blur-md text-[#b8960e] font-bold px-2 py-0.5 rounded-lg border border-[#9b7e09]/30 flex items-center gap-1">
                            <Star className="w-3 h-3 fill-current" /> {product.rating}
                          </span>
                        )}
                        {product.prepTime && (
                          <span className="bg-[#110f0a]/80 backdrop-blur-md text-[#aba489] px-2 py-0.5 rounded-lg border border-white/10 flex items-center gap-1 text-[10px]">
                            <Clock className="w-2.5 h-2.5 text-[#b8960e]" /> {product.prepTime}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Card Content */}
                    <div className="p-3.5 flex-1 flex flex-col justify-between space-y-3">
                      <div>
                        <h3
                          className="font-bold text-[#fdfcf7] text-xs sm:text-sm group-hover:text-[#b8960e] transition-colors cursor-pointer line-clamp-1"
                          onClick={() => setSelectedProduct(product)}
                        >
                          {product.name}
                        </h3>
                        <p className="text-[11px] text-[#857f5d] mt-1 line-clamp-2 leading-relaxed">
                          {product.description}
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-[#2c271d]">
                        <span className="text-[#9b7e09] font-extrabold text-sm sm:text-base">
                          {formatCOP(product.price)}
                        </span>
                        {product.soldOut ? (
                          <span className="px-3.5 py-1.5 bg-[#383324] text-rose-300 font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-not-allowed">
                            <PackageX className="w-3.5 h-3.5" /> Agotado
                          </span>
                        ) : (
                          <button
                            onClick={() => setSelectedProduct(product)}
                            className="px-3.5 py-1.5 bg-gradient-to-r from-[#9b7e09] to-[#b8960e] hover:from-[#b8960e] hover:to-[#9b7e09] active:scale-95 text-[#fdfcf7] font-bold text-xs rounded-xl shadow-md shadow-[#9b7e09]/20 transition-all flex items-center gap-1.5"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Pedir</span>
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
            <div className="py-16 text-center text-[#857f5d] space-y-3 bg-[#1e1b13]/60 rounded-3xl border border-[#383324] p-6">
              <Search className="w-10 h-10 mx-auto text-[#857f5d] animate-bounce" />
              <h4 className="text-sm font-bold text-[#fdfcf7]">No encontramos platillos con esos filtros</h4>
              <p className="text-xs text-[#857f5d] max-w-sm mx-auto">
                Prueba buscando con otro término o desactiva los filtros de dieta para ver todas las delicias del menú.
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setActiveCategory('Todos');
                  setDietaryFilter('');
                }}
                className="px-4 py-2 bg-[#9b7e09]/20 text-[#e9e2ca] border border-[#9b7e09]/40 hover:bg-[#9b7e09] hover:text-[#fdfcf7] font-bold text-xs rounded-xl transition-all"
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