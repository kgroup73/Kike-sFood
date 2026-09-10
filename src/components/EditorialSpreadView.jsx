import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Sparkles,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Plus,
  Heart,
  Star,
  Flame,
  Clock,
  ArrowRight,
  ArrowLeft,
  Award,
  Leaf,
  Wine,
  Info,
  Layers,
  UtensilsCrossed,
  BookMarked,
  RotateCcw,
  Ban
} from 'lucide-react';
import { formatCOP } from '../lib/dian';

export default function EditorialSpreadView({
  products = [],
  setSelectedProduct,
  favorites = [],
  toggleFavorite
}) {
  const [currentPage, setCurrentPage] = useState(0);
  const [activeDishId, setActiveDishId] = useState(null);
  const [isBookOpened, setIsBookOpened] = useState(true);
  
  // Flipping state: null | { direction: 'next' | 'prev', fromPage: number, toPage: number }
  const [flippingState, setFlippingState] = useState(null);

  const touchStartPos = useRef({ x: 0, y: 0 });
  const touchEndPos = useRef({ x: 0, y: 0 });
  const flipTimeoutRef = useRef(null);

  // Group products into editorial spreads (3 dishes per spread: 1 hero on left, 2 on right)
  const pages = useMemo(() => {
    if (!products || products.length === 0) return [];
    const pageSize = 3;
    const chunks = [];
    for (let i = 0; i < products.length; i += pageSize) {
      chunks.push(products.slice(i, i + pageSize));
    }
    return chunks;
  }, [products]);

  // Safe clamping of currentPage when products/categories change
  useEffect(() => {
    if (pages.length === 0) {
      setCurrentPage(0);
    } else if (currentPage >= pages.length) {
      setCurrentPage(Math.max(0, pages.length - 1));
    }
  }, [pages.length, currentPage]);

  // Clear timeout on unmount
  useEffect(() => {
    return () => {
      if (flipTimeoutRef.current) clearTimeout(flipTimeoutRef.current);
    };
  }, []);

  const pageTitles = [
    { main: 'CREACIONES DE AUTOR', sub: 'SELECCIÓN EXCLUSIVA DEL CHEF', badge: 'VOL. I' },
    { main: 'ESPECIALIDADES DE LA CASA', sub: 'CORTES MADURADOS & BRASAS', badge: 'VOL. II' },
    { main: 'RECETAS EMBLEMÁTICAS', sub: 'TRADICIÓN E INNOVACIÓN GOURMET', badge: 'VOL. III' },
    { main: 'MARIDAJES & FINAL DULCE', sub: 'COCTELERÍA FINA & REPOSTERÍA', badge: 'VOL. IV' },
    { main: 'EXPERIENCIA SENSORIAL', sub: 'SABORES CUIDADOSAMENTE CURADOS', badge: 'VOL. V' }
  ];

  const getTitleForPage = (index) => {
    return pageTitles[index % pageTitles.length];
  };

  // Flip page handlers with clean lock
  const goToNextPage = () => {
    if (flippingState || currentPage >= pages.length - 1) return;

    const from = currentPage;
    const to = currentPage + 1;
    setFlippingState({ direction: 'next', fromPage: from, toPage: to });

    flipTimeoutRef.current = setTimeout(() => {
      setCurrentPage(to);
      setFlippingState(null);
    }, 550);
  };

  const goToPrevPage = () => {
    if (flippingState || currentPage <= 0) return;

    const from = currentPage;
    const to = currentPage - 1;
    setFlippingState({ direction: 'prev', fromPage: from, toPage: to });

    flipTimeoutRef.current = setTimeout(() => {
      setCurrentPage(to);
      setFlippingState(null);
    }, 550);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight') goToNextPage();
      if (e.key === 'ArrowLeft') goToPrevPage();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentPage, flippingState, pages.length]);

  // Touch Swipe Handlers (directional: requires horizontal intent, never hijacks vertical scroll)
  const handleTouchStart = (e) => {
    touchStartPos.current = {
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY
    };
    touchEndPos.current = {
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY
    };
  };

  const handleTouchMove = (e) => {
    touchEndPos.current = {
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY
    };
  };

  const handleTouchEnd = () => {
    const deltaX = touchStartPos.current.x - touchEndPos.current.x;
    const deltaY = touchStartPos.current.y - touchEndPos.current.y;

    // Must be predominantly horizontal and exceed 45px threshold
    if (Math.abs(deltaX) > 45 && Math.abs(deltaX) > Math.abs(deltaY) * 1.4) {
      if (deltaX > 0) {
        goToNextPage();
      } else {
        goToPrevPage();
      }
    }

    touchStartPos.current = { x: 0, y: 0 };
    touchEndPos.current = { x: 0, y: 0 };
  };

  const formatEditorialPrice = (val) => {
    if (!val) return '';
    return formatCOP(val);
  };

  // Helper renderer: Left Page (Hero Featured Dish)
  const renderLeftPageContent = (pageIndex, isBackface = false) => {
    const dishes = pages[pageIndex] || [];
    const heroDish = dishes[0];
    const title = getTitleForPage(pageIndex);
    const isFav = heroDish && favorites.includes(heroDish.id);

    return (
      <div className={`w-full h-full bg-[#fdfcf7] text-[#1a1711] flex flex-col justify-between p-4 sm:p-7 editorial-paper-texture ${isBackface ? 'magazine-page-shadow-right' : 'magazine-page-shadow-left'}`}>
        {/* Editorial Page Top Header */}
        <div className="flex items-start justify-between border-b border-[#e9e2ca] pb-2.5">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black tracking-widest text-[#9b7e09] uppercase">
                LA TRATTORIA • {title.badge}
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#9b7e09] animate-pulse" />
            </div>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight text-[#1a1711] uppercase leading-none font-sans">
              {title.main}
            </h2>
            <p className="text-[9px] sm:text-[10px] font-bold text-[#857f5d] tracking-wider uppercase">
              {title.sub}
            </p>
          </div>

          {/* Monogram TG */}
          <div className="flex flex-col items-end">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-[#e9e2ca] via-[#b8960e] to-[#9b7e09] p-0.5 shadow-sm flex items-center justify-center">
              <div className="w-full h-full bg-[#1e1b13] rounded-[9px] flex items-center justify-center text-[#e9e2ca] font-serif font-bold text-sm sm:text-base">
                TG
              </div>
            </div>
            <span className="text-[8px] font-bold text-[#857f5d] uppercase tracking-widest mt-0.5">
              EST. 2026
            </span>
          </div>
        </div>

        {/* Hero Featured Dish Showcase */}
        {heroDish ? (
          <div className="my-auto py-2 flex flex-col items-center text-center space-y-3">
            {/* Hero Circular Spotlight Plate */}
            <div className="relative group cursor-pointer my-1.5" onClick={() => setSelectedProduct(heroDish)}>
              <div
                className={`w-28 h-28 sm:w-36 sm:h-36 md:w-36 md:h-36 lg:w-40 lg:h-40 rounded-full p-1 bg-[#fdfcf7] shadow-xl dish-spotlight overflow-hidden transition-all duration-300 border-2 border-[#9b7e09]/40 aspect-square shrink-0 mx-auto ${
                  activeDishId === heroDish.id ? 'scale-105 ring-4 ring-[#9b7e09]/30' : ''
                }`}
                onMouseEnter={() => setActiveDishId(heroDish.id)}
                onMouseLeave={() => setActiveDishId(null)}
              >
                <img
                  src={heroDish.image}
                  alt={heroDish.name}
                  className={`w-full h-full rounded-full object-cover group-hover:scale-105 transition-transform duration-500 ${heroDish.soldOut ? 'grayscale opacity-60' : ''}`}
                  loading="lazy"
                />
              </div>

              {/* Top Badges */}
              <div className="absolute top-0 right-0 flex flex-col gap-1 items-end">
                {heroDish.soldOut && (
                  <span className="bg-rose-600 text-white text-[9px] font-black px-2 py-0.5 rounded-full shadow-lg uppercase tracking-wide flex items-center gap-1">
                    <Ban className="w-2.5 h-2.5" /> Agotado
                  </span>
                )}
                {heroDish.isChef && (
                  <span className="bg-gradient-to-r from-[#9b7e09] to-[#b8960e] text-[#fdfcf7] text-[9px] font-black px-2 py-0.5 rounded-full shadow-md flex items-center gap-1">
                    <Award className="w-2.5 h-2.5" /> Chef Pick
                  </span>
                )}
                {heroDish.isVeg && (
                  <span className="bg-emerald-600 text-[#fdfcf7] text-[9px] font-bold px-2 py-0.5 rounded-full shadow-md flex items-center gap-1">
                    <Leaf className="w-2.5 h-2.5" /> Vegano
                  </span>
                )}
              </div>

              {/* Heart Favorite Toggle */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (toggleFavorite) toggleFavorite(heroDish.id);
                }}
                className={`absolute top-0 left-0 w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-md shadow-md border transition-all ${
                  isFav
                    ? 'bg-rose-500 text-white border-rose-400'
                    : 'bg-white/80 text-[#857f5d] hover:text-rose-500 border-[#e9e2ca]'
                }`}
                title="Guardar como favorito"
              >
                <Heart className={`w-4 h-4 ${isFav ? 'fill-current' : ''}`} />
              </button>
            </div>

            {/* Hero Dish Details */}
            <div className="space-y-1.5 max-w-sm px-2">
              <span className="text-2xl sm:text-3xl font-black text-[#9b7e09] tracking-tight block">
                {formatEditorialPrice(heroDish.price)}
              </span>
              <h3
                onClick={() => setSelectedProduct(heroDish)}
                className="text-base sm:text-lg font-extrabold text-[#1a1711] hover:text-[#9b7e09] cursor-pointer transition-colors leading-tight"
              >
                {heroDish.name}
              </h3>
              <p className="text-[11px] text-[#5e5541] line-clamp-2 leading-relaxed">
                {heroDish.description}
              </p>

              {/* Tasting Note or Pairing */}
              {heroDish.pairing && (
                <div className="pt-1 text-[10px] text-[#857f5d] flex items-center justify-center gap-1">
                  <Wine className="w-3 h-3 text-[#9b7e09]" />
                  <span>Maridaje sugerido: <strong className="text-[#1a1711]">{heroDish.pairing.name}</strong></span>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 pt-1">
              {heroDish.soldOut ? (
                <button
                  type="button"
                  onClick={() => setSelectedProduct(heroDish)}
                  className="px-4 py-1.5 rounded-full bg-rose-600/90 hover:bg-rose-700 text-[#fdfcf7] text-xs font-black shadow-md flex items-center gap-1.5 transition-transform active:scale-95"
                >
                  <Ban className="w-3.5 h-3.5" />
                  <span>Agotado • Ver Detalle</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setSelectedProduct(heroDish)}
                  className="px-4 py-1.5 rounded-full bg-gradient-to-r from-[#9b7e09] to-[#b8960e] hover:from-[#b8960e] hover:to-[#9b7e09] text-[#fdfcf7] text-xs font-black shadow-md shadow-[#9b7e09]/20 flex items-center gap-1.5 transition-transform active:scale-95"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Pedir / Personalizar</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="my-auto text-center py-10 text-[#857f5d]">
            <UtensilsCrossed className="w-8 h-8 mx-auto mb-2 opacity-40 text-[#9b7e09]" />
            <p className="text-xs">Página de cierre del capítulo</p>
          </div>
        )}

        {/* Page Footer */}
        <div className="pt-2 border-t border-[#e9e2ca] flex items-center justify-between text-[9px] sm:text-[10px] text-[#857f5d]">
          <span className="font-bold text-[#1a1711]">LA TRATTORIA GOURMET</span>
          <span className="font-mono">PÁG. {pageIndex * 2 + 1}</span>
        </div>
      </div>
    );
  };

  // Helper renderer: Right Page (Secondary & Complementary Dishes)
  const renderRightPageContent = (pageIndex, isBackface = false) => {
    const dishes = pages[pageIndex] || [];
    const dish2 = dishes[1];
    const dish3 = dishes[2];

    return (
      <div className={`w-full h-full bg-[#fdfcf7] text-[#1a1711] flex flex-col justify-between p-4 sm:p-7 editorial-paper-texture ${isBackface ? 'magazine-page-shadow-left' : 'magazine-page-shadow-right'}`}>
        {/* Right Page Header */}
        <div className="flex items-center justify-between border-b border-[#e9e2ca] pb-2.5">
          <span className="text-[10px] font-black tracking-widest text-[#857f5d] uppercase">
            SELECCIÓN CULINARIA
          </span>
          <span className="text-[10px] font-bold text-[#9b7e09] flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> CARTA VIVA
          </span>
        </div>

        {/* Secondary Dishes Container */}
        <div className="space-y-4 my-auto py-2">
          {/* Dish 2 */}
          {dish2 ? (
            <div
              onClick={() => setSelectedProduct(dish2)}
              className="cursor-pointer group p-2.5 sm:p-3 rounded-2xl bg-[#e9e2ca]/20 hover:bg-[#e9e2ca]/40 border border-[#e7e1c9] hover:border-[#9b7e09]/40 transition-all flex items-center justify-between gap-3 overflow-hidden"
            >
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-base sm:text-lg font-black text-[#9b7e09]">
                    {formatEditorialPrice(dish2.price)}
                  </span>
                  {favorites.includes(dish2.id) && (
                    <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500 shrink-0" />
                  )}
                </div>
                <h4 className="text-xs sm:text-sm font-extrabold text-[#1a1711] group-hover:text-[#9b7e09] transition-colors leading-tight truncate">
                  {dish2.name}
                </h4>
                <p className="text-[10px] text-[#5e5541] line-clamp-2 leading-relaxed">
                  {dish2.ingredients?.join(', ') || dish2.description}
                </p>
                <div className="pt-0.5">
                  {dish2.soldOut ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-black text-rose-600">
                      <Ban className="w-3 h-3" /> No disponible
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-[#9b7e09] group-hover:translate-x-0.5 transition-transform">
                      <Plus className="w-3 h-3" /> Añadir
                    </span>
                  )}
                </div>
              </div>

              <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden shrink-0 shadow-md border border-[#e9e2ca] bg-[#110f0a] aspect-square">
                <img
                  src={dish2.image}
                  alt={dish2.name}
                  className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ${dish2.soldOut ? 'grayscale opacity-60' : ''}`}
                  loading="lazy"
                />
                {dish2.soldOut && (
                  <span className="absolute top-1 right-1 bg-rose-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full shadow-lg z-10 uppercase tracking-wide">
                    Agotado
                  </span>
                )}
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-xl border border-dashed border-[#e9e2ca] text-center text-[#857f5d] text-xs">
              Espacio disponible para creaciones de temporada
            </div>
          )}

          {/* Dish 3 */}
          {dish3 ? (
            <div
              onClick={() => setSelectedProduct(dish3)}
              className="cursor-pointer group p-2.5 sm:p-3 rounded-2xl bg-[#e9e2ca]/20 hover:bg-[#e9e2ca]/40 border border-[#e7e1c9] hover:border-[#9b7e09]/40 transition-all flex items-center justify-between gap-3 overflow-hidden"
            >
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-base sm:text-lg font-black text-[#9b7e09]">
                    {formatEditorialPrice(dish3.price)}
                  </span>
                  {favorites.includes(dish3.id) && (
                    <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500 shrink-0" />
                  )}
                </div>
                <h4 className="text-xs sm:text-sm font-extrabold text-[#1a1711] group-hover:text-[#9b7e09] transition-colors leading-tight truncate">
                  {dish3.name}
                </h4>
                <p className="text-[10px] text-[#5e5541] line-clamp-2 leading-relaxed">
                  {dish3.ingredients?.join(', ') || dish3.description}
                </p>
                <div className="pt-0.5">
                  {dish3.soldOut ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-black text-rose-600">
                      <Ban className="w-3 h-3" /> No disponible
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-[#9b7e09] group-hover:translate-x-0.5 transition-transform">
                      <Plus className="w-3 h-3" /> Añadir
                    </span>
                  )}
                </div>
              </div>

              <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden shrink-0 shadow-md border border-[#e9e2ca] bg-[#110f0a] aspect-square">
                <img
                  src={dish3.image}
                  alt={dish3.name}
                  className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ${dish3.soldOut ? 'grayscale opacity-60' : ''}`}
                  loading="lazy"
                />
                {dish3.soldOut && (
                  <span className="absolute top-1 right-1 bg-rose-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full shadow-lg z-10 uppercase tracking-wide">
                    Agotado
                  </span>
                )}
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-xl border border-dashed border-[#e9e2ca] text-center text-[#857f5d] text-xs">
              Fin de este volumen del menú
            </div>
          )}
        </div>

        {/* Right Page Footer */}
        <div className="pt-2 border-t border-[#e9e2ca] flex items-center justify-between text-[9px] sm:text-[10px] text-[#857f5d]">
          <span className="text-[#9b7e09] font-bold flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> Toca el plato para ordenar
          </span>
          <span className="font-mono">PÁG. {pageIndex * 2 + 2}</span>
        </div>
      </div>
    );
  };

  // Helper renderer: Mobile Single Page (Stacked 3 dishes cleanly)
  const renderMobilePageContent = (pageIndex) => {
    const dishes = pages[pageIndex] || [];
    const title = getTitleForPage(pageIndex);

    return (
      <div className="w-full h-full bg-[#fdfcf7] text-[#1a1711] flex flex-col justify-between p-4 editorial-paper-texture">
        {/* Mobile Header */}
        <div className="flex items-start justify-between border-b border-[#e9e2ca] pb-2">
          <div>
            <span className="text-[9px] font-black tracking-widest text-[#9b7e09] uppercase block">
              LA TRATTORIA GOURMET • {title.badge}
            </span>
            <h2 className="text-xl font-black text-[#1a1711] uppercase leading-tight font-sans">
              {title.main}
            </h2>
          </div>
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#e9e2ca] via-[#b8960e] to-[#9b7e09] p-0.5 flex items-center justify-center shrink-0">
            <div className="w-full h-full bg-[#1e1b13] rounded-[9px] flex items-center justify-center text-[#e9e2ca] font-serif font-bold text-xs">
              TG
            </div>
          </div>
        </div>

        {/* Mobile Dishes List */}
        <div className="space-y-3 my-auto py-2">
          {dishes.map((dish, idx) => {
            const isFav = favorites.includes(dish.id);
            return (
              <div
                key={dish.id}
                onClick={() => setSelectedProduct(dish)}
                className={`p-2.5 rounded-2xl flex items-center justify-between gap-3 border transition-all overflow-hidden ${
                  idx === 0
                    ? 'bg-[#e9e2ca]/35 border-[#9b7e09]/40'
                    : 'bg-[#e9e2ca]/15 border-[#e7e1c9]'
                }`}
              >
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-base font-black text-[#9b7e09]">
                      {formatEditorialPrice(dish.price)}
                    </span>
                    {dish.isChef && (
                      <span className="text-[9px] bg-[#9b7e09]/20 text-[#9b7e09] font-black px-1.5 py-0.2 rounded-full">
                        Chef
                      </span>
                    )}
                  </div>
                  <h3 className="text-xs font-bold text-[#1a1711] leading-tight truncate">
                    {dish.name}
                  </h3>
                  <p className="text-[10px] text-[#5e5541] line-clamp-1">
                    {dish.ingredients?.join(', ') || dish.description}
                  </p>
                  <div className="pt-0.5 flex items-center gap-2">
                    {dish.soldOut ? (
                      <span className="text-[9px] font-black text-rose-600 flex items-center gap-0.5">
                        <Ban className="w-2.5 h-2.5" /> No disponible
                      </span>
                    ) : (
                      <span className="text-[9px] font-black text-[#9b7e09] flex items-center gap-0.5">
                        <Plus className="w-2.5 h-2.5" /> Pedir
                      </span>
                    )}
                  </div>
                </div>

                <div className="relative shrink-0">
                  <div className="w-16 h-16 rounded-full overflow-hidden border border-[#9b7e09]/30 shadow bg-[#110f0a] aspect-square">
                    <img
                      src={dish.image}
                      alt={dish.name}
                      className={`w-full h-full object-cover ${dish.soldOut ? 'grayscale opacity-60' : ''}`}
                      loading="lazy"
                    />
                  </div>
                  {dish.soldOut && (
                    <span className="absolute -top-1 -left-1 bg-rose-600 text-white text-[7px] font-black px-1 py-0.5 rounded-full shadow uppercase">
                      Agotado
                    </span>
                  )}
                  {isFav && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-rose-500 text-white flex items-center justify-center shadow">
                      <Heart className="w-2.5 h-2.5 fill-current" />
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Mobile Footer */}
        <div className="pt-2 border-t border-[#e9e2ca] flex items-center justify-between text-[9px] text-[#857f5d]">
          <span className="text-[#9b7e09] font-extrabold flex items-center gap-1">
            <Sparkles className="w-2.5 h-2.5" /> Toca para ordenar
          </span>
          <span className="font-mono">PÁG. {pageIndex + 1}/{pages.length}</span>
        </div>
      </div>
    );
  };

  // If no products available in current filter
  if (pages.length === 0) {
    return (
      <div className="w-full max-w-2xl mx-auto rounded-3xl p-8 sm:p-12 bg-gradient-to-br from-[#1e1b13] via-[#14120c] to-[#242017] border border-[#9b7e09]/40 text-center space-y-4 shadow-2xl">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-[#2a2417] border border-[#9b7e09]/30 flex items-center justify-center text-[#9b7e09]">
          <UtensilsCrossed className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-black text-[#fdfcf7]">No hay creaciones en esta sección</h3>
        <p className="text-xs text-[#aba489] max-w-sm mx-auto leading-relaxed">
          Intenta cambiar el filtro dietario o la categoría en la barra superior para explorar otras páginas de nuestra carta.
        </p>
      </div>
    );
  }

  return (
    <div className="relative w-full max-w-5xl mx-auto space-y-3 select-none">

      {/* Floating Side Navigation Arrows (Desktop) */}
      <button
        type="button"
        onClick={goToPrevPage}
        disabled={currentPage === 0 || flippingState !== null}
        className="hidden md:flex absolute -left-5 top-1/2 -translate-y-1/2 z-40 w-11 h-11 rounded-full bg-[#1e1b13]/90 hover:bg-[#9b7e09] text-[#e9e2ca] hover:text-[#fdfcf7] border border-[#9b7e09]/50 shadow-2xl items-center justify-center transition-all disabled:opacity-0 disabled:pointer-events-none hover:scale-110 active:scale-95"
        title="Hoja anterior"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>

      <button
        type="button"
        onClick={goToNextPage}
        disabled={currentPage === pages.length - 1 || flippingState !== null}
        className="hidden md:flex absolute -right-5 top-1/2 -translate-y-1/2 z-40 w-11 h-11 rounded-full bg-[#1e1b13]/90 hover:bg-[#9b7e09] text-[#e9e2ca] hover:text-[#fdfcf7] border border-[#9b7e09]/50 shadow-2xl items-center justify-center transition-all disabled:opacity-0 disabled:pointer-events-none hover:scale-110 active:scale-95"
        title="Siguiente hoja"
      >
        <ChevronRight className="w-6 h-6" />
      </button>

      {/* 3D Book Viewport */}
      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="book-viewport w-full rounded-3xl p-1.5 sm:p-2.5 bg-gradient-to-br from-[#1e1b13] via-[#14120c] to-[#242017] border-2 border-[#9b7e09]/40 shadow-2xl shadow-black/90 relative overflow-hidden book-zoom-intro"
      >
        {/* Book Spine Highlight (Left edge outer border shadow) */}
        <div className="absolute top-0 bottom-0 left-0 w-3 sm:w-5 book-spine-shadow z-30 pointer-events-none rounded-l-2xl" />

        {/* Interactive Corner Dog-Ear / Curls (Top-Right and Bottom-Right for NEXT) */}
        {currentPage < pages.length - 1 && isBookOpened && !flippingState && (
          <>
            <div
              onClick={goToNextPage}
              className="corner-curl-interactive corner-curl-tr hidden sm:block"
              title="Pasa a la siguiente página"
            />
            <div
              onClick={goToNextPage}
              className="corner-curl-interactive corner-curl-br hidden sm:block"
              title="Pasa a la siguiente página"
            />
          </>
        )}

        {/* Interactive Corner Dog-Ear (Top-Left for PREV) */}
        {currentPage > 0 && isBookOpened && !flippingState && (
          <div
            onClick={goToPrevPage}
            className="corner-curl-interactive corner-curl-tl hidden sm:block"
            title="Volver a la página anterior"
          />
        )}

        {/* Closed Cover View Mode */}
        {!isBookOpened ? (
          <div
            onClick={() => setIsBookOpened(true)}
            className="w-full min-h-[540px] sm:min-h-[600px] rounded-2xl book-cover-texture border-2 border-[#9b7e09]/50 p-6 sm:p-12 flex flex-col justify-between items-center text-center cursor-pointer relative shadow-2xl group transition-all"
          >
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-[#e9e2ca] via-[#b8960e] to-[#9b7e09] p-0.5 shadow-xl flex items-center justify-center">
              <div className="w-full h-full bg-[#110f0a] rounded-[14px] flex items-center justify-center text-[#e9e2ca] font-serif font-black text-2xl sm:text-3xl">
                TG
              </div>
            </div>

            <div className="space-y-3">
              <span className="text-xs font-bold text-[#b8960e] tracking-[0.3em] uppercase block">
                CARTA DE AUTOR
              </span>
              <h1 className="text-3xl sm:text-6xl font-black text-[#fdfcf7] font-serif tracking-tight leading-tight">
                LA TRATTORIA<br />
                <span className="text-[#9b7e09] font-sans font-light text-2xl sm:text-4xl tracking-widest block pt-1">
                  GOURMET
                </span>
              </h1>
              <p className="text-xs sm:text-sm text-[#aba489] max-w-sm mx-auto leading-relaxed pt-2">
                Experiencia gastronómica sensorial, selección de cortes madurados, pastas artesanales y coctelería de autor.
              </p>
            </div>

            <div className="py-3 px-7 rounded-2xl bg-gradient-to-r from-[#9b7e09] to-[#b8960e] text-[#fdfcf7] font-black text-xs sm:text-sm shadow-xl shadow-[#9b7e09]/30 flex items-center gap-2 group-hover:scale-105 transition-transform">
              <BookOpen className="w-4 h-4" />
              <span>Abrir Carta Editorial</span>
            </div>
          </div>
        ) : (
          /* Open Magazine Spread with Genuine 3D Page Turn */
          <div className="relative w-full min-h-[560px] sm:min-h-[620px] rounded-2xl overflow-hidden shadow-inner">
            
            {/* ============================================================ */}
            {/* DESKTOP SPREAD (md and up: 2 facing pages side by side)     */}
            {/* ============================================================ */}
            <div className="hidden md:grid md:grid-cols-2 w-full h-full min-h-[620px] relative">
              
              {/* Center Gutter Crease Shadow */}
              <div className="magazine-spine-gutter" />

              {/* Base Stationary Layer */}
              {/* Left Column (Underneath) */}
              <div className="h-full border-r border-[#e9e2ca]/60 overflow-hidden min-w-0">
                {flippingState?.direction === 'prev'
                  ? renderLeftPageContent(flippingState.toPage)
                  : renderLeftPageContent(currentPage)}
              </div>

              {/* Right Column (Underneath) */}
              <div className="h-full overflow-hidden min-w-0">
                {flippingState?.direction === 'next'
                  ? renderRightPageContent(flippingState.toPage)
                  : renderRightPageContent(currentPage)}
              </div>

              {/* 3D Flipping Leaf (Active only during animation) */}
              {flippingState?.direction === 'next' && (
                <div className="magazine-leaf magazine-leaf-desktop-next">
                  {/* Front Face: Current Right Page */}
                  <div className="magazine-face-front">
                    {renderRightPageContent(flippingState.fromPage)}
                  </div>
                  {/* Back Face: Target Left Page */}
                  <div className="magazine-face-back">
                    {renderLeftPageContent(flippingState.toPage, true)}
                  </div>
                </div>
              )}

              {flippingState?.direction === 'prev' && (
                <div className="magazine-leaf magazine-leaf-desktop-prev">
                  {/* Front Face: Target Right Page */}
                  <div className="magazine-face-front">
                    {renderRightPageContent(flippingState.toPage, true)}
                  </div>
                  {/* Back Face: Current Left Page */}
                  <div className="magazine-face-back">
                    {renderLeftPageContent(flippingState.fromPage)}
                  </div>
                </div>
              )}

            </div>

            {/* ============================================================ */}
            {/* MOBILE SPREAD (< md: 1 page optimized for phones)            */}
            {/* ============================================================ */}
            <div className="md:hidden w-full h-full min-h-[560px] relative">
              
              {/* Mobile Base Page */}
              <div className="w-full h-full">
                {flippingState
                  ? renderMobilePageContent(flippingState.toPage)
                  : renderMobilePageContent(currentPage)}
              </div>

              {/* Mobile Flipping Leaf */}
              {flippingState?.direction === 'next' && (
                <div className="magazine-leaf magazine-leaf-mobile-next">
                  <div className="magazine-face-front">
                    {renderMobilePageContent(flippingState.fromPage)}
                  </div>
                  <div className="magazine-face-back bg-[#fdfcf7] editorial-paper-texture flex items-center justify-center p-6 text-center">
                    <div className="space-y-2 opacity-30">
                      <div className="w-12 h-12 mx-auto rounded-xl bg-[#9b7e09] flex items-center justify-center text-[#fdfcf7] font-serif font-black">
                        TG
                      </div>
                      <span className="text-[10px] uppercase tracking-widest text-[#857f5d] block">
                        LA TRATTORIA GOURMET
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {flippingState?.direction === 'prev' && (
                <div className="magazine-leaf magazine-leaf-mobile-prev">
                  <div className="magazine-face-front">
                    {renderMobilePageContent(flippingState.toPage)}
                  </div>
                  <div className="magazine-face-back bg-[#fdfcf7] editorial-paper-texture flex items-center justify-center p-6 text-center">
                    <div className="space-y-2 opacity-30">
                      <div className="w-12 h-12 mx-auto rounded-xl bg-[#9b7e09] flex items-center justify-center text-[#fdfcf7] font-serif font-black">
                        TG
                      </div>
                      <span className="text-[10px] uppercase tracking-widest text-[#857f5d] block">
                        LA TRATTORIA GOURMET
                      </span>
                    </div>
                  </div>
                </div>
              )}

            </div>

          </div>
        )}
      </div>

      {/* Interactive Control & Navigation Bar */}
      <div className="bg-[#1e1b13]/95 backdrop-blur-md border border-[#383324] p-2 sm:p-2.5 rounded-2xl shadow-xl flex items-center justify-between gap-3 text-[#fdfcf7]">
        <button
          type="button"
          onClick={goToPrevPage}
          disabled={currentPage === 0 || flippingState !== null || !isBookOpened}
          className="px-3 py-2 rounded-xl bg-[#2c271d] hover:bg-[#383324] disabled:opacity-30 disabled:cursor-not-allowed text-xs font-bold transition-all flex items-center gap-1.5 text-[#e9e2ca] active:scale-95"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Hoja Anterior</span>
        </button>

        {/* Center Page Dots & Info */}
        <div className="flex flex-col items-center space-y-1">
          <div className="flex items-center space-x-1.5">
            {pages.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  if (!flippingState && idx !== currentPage) {
                    const dir = idx > currentPage ? 'next' : 'prev';
                    setFlippingState({ direction: dir, fromPage: currentPage, toPage: idx });
                    flipTimeoutRef.current = setTimeout(() => {
                      setCurrentPage(idx);
                      setFlippingState(null);
                    }, 550);
                  }
                }}
                className={`h-2 rounded-full transition-all ${
                  currentPage === idx
                    ? 'w-7 bg-gradient-to-r from-[#9b7e09] to-[#b8960e] shadow-md'
                    : 'w-2 bg-[#383324] hover:bg-[#857f5d]'
                }`}
                title={`Página ${idx + 1}`}
              />
            ))}
          </div>
          <span className="text-[10px] text-[#aba489] font-medium">
            Sección <strong className="text-[#e9e2ca]">{currentPage + 1}</strong> de <strong className="text-[#e9e2ca]">{pages.length}</strong> • <span className="text-[#b8960e]">Desliza con el dedo o usa las flechas 👈👉</span>
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Toggle Hardcover */}
          <button
            type="button"
            onClick={() => setIsBookOpened(!isBookOpened)}
            className="hidden sm:flex px-2.5 py-2 rounded-xl bg-[#2c271d] hover:bg-[#383324] text-xs font-bold text-[#aba489] hover:text-[#fdfcf7] items-center gap-1 transition-all"
            title={isBookOpened ? 'Ver portada de la carta' : 'Abrir carta'}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>{isBookOpened ? 'Portada' : 'Abrir'}</span>
          </button>

          <button
            type="button"
            onClick={goToNextPage}
            disabled={currentPage === pages.length - 1 || flippingState !== null || !isBookOpened}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#9b7e09] to-[#b8960e] hover:from-[#b8960e] hover:to-[#9b7e09] disabled:opacity-30 disabled:cursor-not-allowed text-[#fdfcf7] text-xs font-black transition-all flex items-center gap-1.5 shadow-md shadow-[#9b7e09]/20 active:scale-95"
          >
            <span className="hidden sm:inline">Siguiente Hoja</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
