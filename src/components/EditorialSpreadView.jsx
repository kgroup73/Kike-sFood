import React, { useState, useRef, useEffect } from 'react';
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
  BookMarked,
  RotateCcw,
  Ban
} from 'lucide-react';
import { formatCOP } from '../lib/dian';

export default function EditorialSpreadView({
  products,
  setSelectedProduct,
  favorites = [],
  toggleFavorite
}) {
  const [currentPage, setCurrentPage] = useState(0);
  const [activeDishId, setActiveDishId] = useState(null);
  const [isFlipping, setIsFlipping] = useState(false);
  const [flipDirection, setFlipDirection] = useState('next'); // 'next' | 'prev'
  const [isBookOpened, setIsBookOpened] = useState(true);
  const [isIntroAnimating, setIsIntroAnimating] = useState(true);

  const touchStartX = useRef(0);
  const touchEndX = useRef(0);
  const lastScrollTime = useRef(0);

  // Group products into book pages (3 dishes per page)
  const pages = React.useMemo(() => {
    const pageSize = 3;
    const chunks = [];
    for (let i = 0; i < products.length; i += pageSize) {
      chunks.push(products.slice(i, i + pageSize));
    }
    return chunks.length > 0 ? chunks : [products];
  }, [products]);

  const pageTitles = [
    { main: 'NEW RELEASE', sub: 'EDICIÓN ESPECIAL DE AUTOR', badge: 'VOL. 1' },
    { main: 'CHEF PICKS', sub: 'SELECCIÓN EXCLUSIVA GOURMET', badge: 'VOL. 2' },
    { main: 'SIGNATURE', sub: 'RECETAS EMBLEMÁTICAS', badge: 'VOL. 3' },
    { main: 'SWEET & SIPS', sub: 'MARIDAJES & FINAL DULCE', badge: 'VOL. 4' }
  ];

  const currentTitle = pageTitles[currentPage % pageTitles.length];
  const currentDishes = pages[currentPage] || [];

  // Flip page handlers
  const goToNextPage = () => {
    if (currentPage < pages.length - 1 && !isFlipping) {
      setFlipDirection('next');
      setIsFlipping(true);
      setTimeout(() => {
        setCurrentPage(p => p + 1);
        setIsFlipping(false);
      }, 350);
    }
  };

  const goToPrevPage = () => {
    if (currentPage > 0 && !isFlipping) {
      setFlipDirection('prev');
      setIsFlipping(true);
      setTimeout(() => {
        setCurrentPage(p => p - 1);
        setIsFlipping(false);
      }, 350);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight') goToNextPage();
      if (e.key === 'ArrowLeft') goToPrevPage();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentPage, isFlipping, pages.length]);

  // Touch Swipe Handlers (Mobile)
  const handleTouchStart = (e) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    const deltaX = touchStartX.current - touchEndX.current;
    if (touchEndX.current === 0) return;
    if (deltaX > 40) {
      goToNextPage();
    } else if (deltaX < -40) {
      goToPrevPage();
    }
    touchStartX.current = 0;
    touchEndX.current = 0;
  };

  // Wheel scroll to flip pages subtly
  const handleWheel = (e) => {
    const now = Date.now();
    if (now - lastScrollTime.current < 600) return; // Debounce scroll
    if (Math.abs(e.deltaY) > 30) {
      lastScrollTime.current = now;
      if (e.deltaY > 0) {
        goToNextPage();
      } else {
        goToPrevPage();
      }
    }
  };

  const formatEditorialPrice = (val) => {
    const thousands = Math.round(val / 1000);
    return `${thousands}.`;
  };

  const dish1 = currentDishes[0];
  const dish2 = currentDishes[1];
  const dish3 = currentDishes[2];

  return (
    <div className="relative w-full max-w-2xl mx-auto space-y-3 select-none">
      
      {/* 3D Book Container */}
      <div
        onWheel={handleWheel}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className={`book-viewport w-full rounded-3xl p-1.5 sm:p-2.5 bg-gradient-to-br from-[#1e1b13] via-[#14120c] to-[#242017] border-2 border-[#9b7e09]/40 shadow-2xl shadow-black/90 relative overflow-hidden ${
          isIntroAnimating ? 'book-zoom-intro' : ''
        }`}
      >
        {/* Book Spine Highlight (Left edge realistic shadow) */}
        <div className="absolute top-0 bottom-0 left-0 w-4 sm:w-6 book-spine-shadow z-30 pointer-events-none rounded-l-2xl" />

        {/* Interactive Corner Dog-Ear / Fold */}
        {currentPage < pages.length - 1 && isBookOpened && (
          <div
            onClick={goToNextPage}
            className="corner-curl z-40 cursor-pointer group"
            title="Pasa a la siguiente página"
          >
            <span className="absolute -top-1 -right-1 text-[8px] font-black text-white/90 uppercase tracking-tighter -rotate-45 hidden group-hover:block">
              Pasar
            </span>
          </div>
        )}

        {/* Closed Cover View Mode (If user wants to view the luxury cover) */}
        {!isBookOpened ? (
          <div
            onClick={() => setIsBookOpened(true)}
            className="w-full min-h-[580px] sm:min-h-[640px] rounded-2xl book-cover-texture border-2 border-[#9b7e09]/50 p-6 sm:p-10 flex flex-col justify-between items-center text-center cursor-pointer relative shadow-2xl group transition-all"
          >
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#e9e2ca] via-[#b8960e] to-[#9b7e09] p-0.5 shadow-xl flex items-center justify-center">
              <div className="w-full h-full bg-[#110f0a] rounded-[14px] flex items-center justify-center text-[#e9e2ca] font-serif font-black text-2xl">
                TG
              </div>
            </div>

            <div className="space-y-3">
              <span className="text-xs font-bold text-[#b8960e] tracking-[0.3em] uppercase block">
                CARTA DE AUTOR
              </span>
              <h1 className="text-3xl sm:text-5xl font-black text-[#fdfcf7] font-serif tracking-tight leading-tight">
                LA TRATTORIA<br />
                <span className="text-[#9b7e09] font-sans font-light text-2xl sm:text-3xl tracking-widest block pt-1">
                  GOURMET
                </span>
              </h1>
              <p className="text-xs text-[#aba489] max-w-xs mx-auto leading-relaxed pt-2">
                Experiencia gastronómica sensorial, selección de cortes madurados y coctelería de autor.
              </p>
            </div>

            <div className="py-3 px-6 rounded-2xl bg-gradient-to-r from-[#9b7e09] to-[#b8960e] text-[#fdfcf7] font-black text-xs sm:text-sm shadow-xl shadow-[#9b7e09]/30 flex items-center gap-2 group-hover:scale-105 transition-transform">
              <BookOpen className="w-4 h-4" />
              <span>Abrir Carta Interactiva</span>
            </div>
          </div>
        ) : (
          /* Open Page Card with 3D Flip Physics and 100% Crisp Brand Palette */
          <div
            className={`w-full min-h-[580px] sm:min-h-[640px] rounded-2xl relative overflow-hidden bg-[#fdfcf7] text-[#1a1711] flex flex-col justify-between p-4 sm:p-7 editorial-paper-texture border border-[#e9e2ca] shadow-inner ${
              isFlipping
                ? flipDirection === 'next'
                  ? 'page-flip-next'
                  : 'page-flip-prev'
                : ''
            }`}
          >
            {/* Top Page Header & Luxury Monogram */}
            <div className="relative z-10 flex items-start justify-between border-b border-[#e9e2ca] pb-3">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] sm:text-xs font-black tracking-widest text-[#9b7e09] uppercase">
                    LA TRATTORIA GOURMET • {currentTitle.badge}
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full bg-[#9b7e09] animate-ping" />
                </div>
                <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-[#1a1711] uppercase leading-none font-sans scale-y-105 origin-top-left">
                  {currentTitle.main}
                </h2>
                <p className="text-[9px] sm:text-[10px] font-bold text-[#857f5d] tracking-wider uppercase">
                  {currentTitle.sub}
                </p>
              </div>

              {/* Monogram Emblem */}
              <div className="flex flex-col items-end">
                <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-[#e9e2ca] via-[#b8960e] to-[#9b7e09] p-0.5 shadow-md flex items-center justify-center">
                  <div className="w-full h-full bg-[#1e1b13] rounded-[9px] flex items-center justify-center text-[#e9e2ca] font-serif font-bold text-base sm:text-lg">
                    TG
                  </div>
                </div>
                <span className="text-[8px] font-bold text-[#857f5d] uppercase tracking-widest mt-1">
                  EST. 2026
                </span>
              </div>
            </div>

            {/* 3 Perfectly Laid Out Dishes (Clean, High Contrast, 100% Brand Colors) */}
            <div className="space-y-4 my-auto py-2">
              
              {/* DISH 1 */}
              {dish1 && (
                <div
                  onClick={() => setSelectedProduct(dish1)}
                  onMouseEnter={() => setActiveDishId(dish1.id)}
                  onMouseLeave={() => setActiveDishId(null)}
                  onTouchStart={() => setActiveDishId(dish1.id)}
                  className="cursor-pointer group transition-all duration-300 flex items-center justify-between gap-3 sm:gap-6 p-2 rounded-2xl hover:bg-[#e9e2ca]/30 border border-transparent hover:border-[#e9e2ca]"
                >
                  <div className="flex-1 space-y-1">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl sm:text-4xl font-black text-[#9b7e09] tracking-tighter group-hover:scale-105 transition-transform inline-block">
                        {formatEditorialPrice(dish1.price)}
                      </span>
                      <span className="text-[10px] font-bold text-[#857f5d]">mil COP</span>
                    </div>
                    <h3 className="text-sm sm:text-base font-extrabold text-[#1a1711] group-hover:text-[#9b7e09] transition-colors leading-tight">
                      {dish1.name}
                    </h3>
                    <p className="text-[10px] sm:text-[11px] text-[#5e5541] line-clamp-2 leading-relaxed">
                      {dish1.ingredients?.join(', ') || dish1.description}
                    </p>
                  </div>

                  {/* Circular Floating Plate with Light-up Effect */}
                  <div className="relative shrink-0">
                    <div
                      className={`w-24 h-24 sm:w-32 sm:h-32 rounded-full p-1 bg-[#fdfcf7] shadow-xl dish-spotlight overflow-hidden transition-all duration-500 border-2 border-[#e9e2ca] ${
                        activeDishId === dish1.id ? 'dish-spotlight-active scale-110 ring-4 ring-[#9b7e09]/40' : ''
                      }`}
                    >
                      <img
                        src={dish1.image}
                        alt={dish1.name}
                        className={`w-full h-full rounded-full object-cover group-hover:scale-110 transition-transform duration-500 ${dish1.soldOut ? 'grayscale opacity-60' : ''}`}
                      />
                    </div>
                    {dish1.soldOut && (
                      <span className="absolute -top-1 -right-1 bg-rose-600 text-white text-[8px] font-black px-2 py-0.5 rounded-full shadow-lg z-10 uppercase tracking-wide">
                        Agotado
                      </span>
                    )}
                    {dish1.soldOut ? (
                      <div className="absolute -bottom-2 -left-1 bg-rose-600 text-white text-[9px] font-black px-2 py-0.5 rounded-full shadow-lg flex items-center gap-1">
                        <Ban className="w-2.5 h-2.5" /> No disponible
                      </div>
                    ) : (
                      <div className="absolute -bottom-2 -left-1 bg-gradient-to-r from-[#9b7e09] to-[#b8960e] text-[#fdfcf7] text-[9px] font-black px-2 py-0.5 rounded-full shadow-lg flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Plus className="w-2.5 h-2.5" /> Pedir
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* DISH 2 (Refined Center Layout with Brand Sand Accent) */}
              {dish2 && (
                <div
                  onClick={() => setSelectedProduct(dish2)}
                  onMouseEnter={() => setActiveDishId(dish2.id)}
                  onMouseLeave={() => setActiveDishId(null)}
                  onTouchStart={() => setActiveDishId(dish2.id)}
                  className="cursor-pointer group transition-all duration-300 flex items-center justify-between flex-row-reverse gap-3 sm:gap-6 p-2 rounded-2xl bg-[#e9e2ca]/25 border border-[#e7e1c9] hover:border-[#9b7e09]/40 hover:bg-[#e9e2ca]/45"
                >
                  <div className="flex-1 space-y-1 text-right">
                    <div className="flex items-baseline justify-end gap-1">
                      <span className="text-3xl sm:text-4xl font-black text-[#9b7e09] tracking-tighter group-hover:scale-105 transition-transform inline-block">
                        {formatEditorialPrice(dish2.price)}
                      </span>
                      <span className="text-[10px] font-bold text-[#857f5d]">mil COP</span>
                    </div>
                    <h3 className="text-sm sm:text-base font-extrabold text-[#1a1711] group-hover:text-[#9b7e09] transition-colors leading-tight">
                      {dish2.name}
                    </h3>
                    <p className="text-[10px] sm:text-[11px] text-[#5e5541] line-clamp-2 leading-relaxed ml-auto">
                      {dish2.ingredients?.join(', ') || dish2.description}
                    </p>
                  </div>

                  {/* Circular Plate */}
                  <div className="relative shrink-0">
                    <div
                      className={`w-28 h-28 sm:w-36 sm:h-36 rounded-full p-1 bg-[#fdfcf7] shadow-xl dish-spotlight overflow-hidden transition-all duration-500 border-2 border-[#9b7e09]/40 ${
                        activeDishId === dish2.id ? 'dish-spotlight-active scale-110 ring-4 ring-[#9b7e09]/50' : ''
                      }`}
                    >
                      <img
                        src={dish2.image}
                        alt={dish2.name}
                        className={`w-full h-full rounded-full object-cover group-hover:scale-110 transition-transform duration-500 ${dish2.soldOut ? 'grayscale opacity-60' : ''}`}
                      />
                    </div>
                    {dish2.soldOut && (
                      <span className="absolute -top-1 -right-1 bg-rose-600 text-white text-[8px] font-black px-2 py-0.5 rounded-full shadow-lg z-10 uppercase tracking-wide">
                        Agotado
                      </span>
                    )}
                    {dish2.soldOut ? (
                      <div className="absolute -bottom-2 -right-1 bg-rose-600 text-white text-[9px] font-black px-2 py-0.5 rounded-full shadow-lg flex items-center gap-1">
                        <Ban className="w-2.5 h-2.5" /> No disponible
                      </div>
                    ) : (
                      <div className="absolute -bottom-2 -right-1 bg-gradient-to-r from-[#9b7e09] to-[#b8960e] text-[#fdfcf7] text-[9px] font-black px-2 py-0.5 rounded-full shadow-lg flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Plus className="w-2.5 h-2.5" /> Pedir
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* DISH 3 */}
              {dish3 && (
                <div
                  onClick={() => setSelectedProduct(dish3)}
                  onMouseEnter={() => setActiveDishId(dish3.id)}
                  onMouseLeave={() => setActiveDishId(null)}
                  onTouchStart={() => setActiveDishId(dish3.id)}
                  className="cursor-pointer group transition-all duration-300 flex items-center justify-between gap-3 sm:gap-6 p-2 rounded-2xl hover:bg-[#e9e2ca]/30 border border-transparent hover:border-[#e9e2ca]"
                >
                  <div className="flex-1 space-y-1">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl sm:text-4xl font-black text-[#9b7e09] tracking-tighter group-hover:scale-105 transition-transform inline-block">
                        {formatEditorialPrice(dish3.price)}
                      </span>
                      <span className="text-[10px] font-bold text-[#857f5d]">mil COP</span>
                    </div>
                    <h3 className="text-sm sm:text-base font-extrabold text-[#1a1711] group-hover:text-[#9b7e09] transition-colors leading-tight">
                      {dish3.name}
                    </h3>
                    <p className="text-[10px] sm:text-[11px] text-[#5e5541] line-clamp-2 leading-relaxed">
                      {dish3.ingredients?.join(', ') || dish3.description}
                    </p>
                  </div>

                  <div className="relative shrink-0">
                    <div
                      className={`w-24 h-24 sm:w-32 sm:h-32 rounded-full p-1 bg-[#fdfcf7] shadow-xl dish-spotlight overflow-hidden transition-all duration-500 border-2 border-[#e9e2ca] ${
                        activeDishId === dish3.id ? 'dish-spotlight-active scale-110 ring-4 ring-[#9b7e09]/40' : ''
                      }`}
                    >
                      <img
                        src={dish3.image}
                        alt={dish3.name}
                        className={`w-full h-full rounded-full object-cover group-hover:scale-110 transition-transform duration-500 ${dish3.soldOut ? 'grayscale opacity-60' : ''}`}
                      />
                    </div>
                    {dish3.soldOut && (
                      <span className="absolute -top-1 -right-1 bg-rose-600 text-white text-[8px] font-black px-2 py-0.5 rounded-full shadow-lg z-10 uppercase tracking-wide">
                        Agotado
                      </span>
                    )}
                    {dish3.soldOut ? (
                      <div className="absolute -bottom-2 -left-1 bg-rose-600 text-white text-[9px] font-black px-2 py-0.5 rounded-full shadow-lg flex items-center gap-1">
                        <Ban className="w-2.5 h-2.5" /> No disponible
                      </div>
                    ) : (
                      <div className="absolute -bottom-2 -left-1 bg-gradient-to-r from-[#9b7e09] to-[#b8960e] text-[#fdfcf7] text-[9px] font-black px-2 py-0.5 rounded-full shadow-lg flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Plus className="w-2.5 h-2.5" /> Pedir
                      </div>
                    )}
                  </div>
                </div>
              )}

            </div>

            {/* Page Footer */}
            <div className="relative z-10 pt-2 border-t border-[#e9e2ca] flex items-center justify-between text-[9px] sm:text-[10px] text-[#857f5d] font-medium">
              <div>
                <span className="font-bold text-[#1a1711]">LA TRATTORIA GOURMET</span>
                <span className="hidden sm:inline"> • Medellín</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[#9b7e09] font-extrabold flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Toca el plato para ordenar
                </span>
                <span className="text-[#857f5d] font-mono">PÁG. {currentPage + 1}/{pages.length}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Interactive Flip Controls Bar */}
      <div className="bg-[#1e1b13]/95 backdrop-blur-md border border-[#383324] p-2 sm:p-2.5 rounded-2xl shadow-xl flex items-center justify-between gap-3 text-[#fdfcf7]">
        <button
          onClick={goToPrevPage}
          disabled={currentPage === 0 || isFlipping || !isBookOpened}
          className="px-3 py-2 rounded-xl bg-[#2c271d] hover:bg-[#383324] disabled:opacity-30 disabled:cursor-not-allowed text-xs font-bold transition-all flex items-center gap-1.5 text-[#e9e2ca]"
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
                onClick={() => {
                  if (!isFlipping && idx !== currentPage) {
                    setFlipDirection(idx > currentPage ? 'next' : 'prev');
                    setIsFlipping(true);
                    setTimeout(() => {
                      setCurrentPage(idx);
                      setIsFlipping(false);
                    }, 300);
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
            Página <strong className="text-[#e9e2ca]">{currentPage + 1}</strong> de <strong className="text-[#e9e2ca]">{pages.length}</strong> • <span className="text-[#b8960e]">Desliza con el dedo o rueda 👆</span>
          </span>
        </div>

        <button
          onClick={goToNextPage}
          disabled={currentPage === pages.length - 1 || isFlipping || !isBookOpened}
          className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#9b7e09] to-[#b8960e] hover:from-[#b8960e] hover:to-[#9b7e09] disabled:opacity-30 disabled:cursor-not-allowed text-[#fdfcf7] text-xs font-black transition-all flex items-center gap-1.5 shadow-md shadow-[#9b7e09]/20"
        >
          <span className="hidden sm:inline">Siguiente Hoja</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
