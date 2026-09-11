import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Sparkles,
  BookOpen,
  Plus,
  ArrowRight,
  ArrowLeft,
  Ban,
  Heart
} from 'lucide-react';

// Subcomponent: Luxury Leather Hardcover (Front Cover)
function BookCoverCard({ onOpenBook, coverAnimationClass = '' }) {
  return (
    <div
      onClick={onOpenBook}
      className={`w-full min-h-[540px] xs:min-h-[580px] sm:min-h-[660px] rounded-2xl book-cover-texture border-2 border-[#b8960e]/50 p-4 xs:p-6 sm:p-10 flex flex-col justify-between items-center text-center cursor-pointer relative shadow-2xl group transition-all duration-300 hover:scale-[1.01] hover:border-[#b8960e] select-none ${coverAnimationClass}`}
    >
      {/* 4 Brass Corner Fittings */}
      <div className="brass-corner-tl" />
      <div className="brass-corner-tr" />
      <div className="brass-corner-bl" />
      <div className="brass-corner-br" />

      {/* Top Monogram Crest */}
      <div className="pt-2">
        <div className="w-16 h-16 xs:w-18 xs:h-18 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-[#e9e2ca] via-[#b8960e] to-[#9b7e09] p-0.5 shadow-2xl flex items-center justify-center mx-auto group-hover:scale-105 transition-transform duration-500">
          <div className="w-full h-full bg-[#110f0a] rounded-[14px] flex items-center justify-center text-[#e9e2ca] font-serif font-black text-xl xs:text-2xl sm:text-3xl border border-[#b8960e]/40">
            TG
          </div>
        </div>
        <span className="text-[9px] sm:text-[10px] font-black text-[#b8960e] tracking-[0.35em] uppercase block mt-2.5 sm:mt-3">
          CARTA DE AUTOR
        </span>
      </div>

      {/* Center Embossed Titles */}
      <div className="space-y-2 xs:space-y-3 py-2 sm:py-4 max-w-md mx-auto">
        <div className="w-10 sm:w-12 h-0.5 bg-[#b8960e]/60 mx-auto" />
        <h1 className="text-2xl xs:text-3xl sm:text-5xl font-black text-[#fdfcf7] font-serif tracking-tight leading-none">
          LA TRATTORIA<br />
          <span className="text-[#b8960e] font-sans font-light text-xl xs:text-2xl sm:text-3xl tracking-[0.25em] block pt-1 sm:pt-2">
            GOURMET
          </span>
        </h1>
        <div className="w-10 sm:w-12 h-0.5 bg-[#b8960e]/60 mx-auto" />
        <p className="text-[11px] sm:text-xs text-[#aba489] leading-relaxed pt-1 sm:pt-2 px-2">
          Experiencia gastronómica sensorial, selección de cortes madurados, pastas artesanales y coctelería de autor.
        </p>
        <span className="text-[8px] sm:text-[9px] text-[#857f5d] uppercase tracking-[0.2em] font-bold block pt-1">
          Medellín • Alta Gastronomía • Est. 2026
        </span>
      </div>

      {/* Bottom Call-To-Action Button / Seal (Mobile-friendly min-h 44px) */}
      <div className="pb-1 sm:pb-2 w-full max-w-xs">
        <button
          type="button"
          className="w-full py-3 sm:py-3.5 px-6 sm:px-8 rounded-2xl bg-gradient-to-r from-[#9b7e09] via-[#b8960e] to-[#9b7e09] text-[#fdfcf7] font-black text-xs sm:text-sm shadow-2xl shadow-[#9b7e09]/50 flex items-center justify-center gap-2 group-hover:scale-105 transition-all duration-300 border border-[#fdfcf7]/30 ring-4 ring-[#9b7e09]/25 animate-pulse min-h-[44px]"
        >
          <BookOpen className="w-4 h-4 text-[#fdfcf7] shrink-0" />
          <span className="tracking-wide">TOCA PARA ABRIR LA CARTA</span>
        </button>
        <span className="text-[8px] sm:text-[9px] text-[#857f5d] block mt-1.5 font-medium">
          Haz clic o pulsa para abrir el menú
        </span>
      </div>
    </div>
  );
}

// Subcomponent: Mobile-first luxury single page inside the book
function PageCard({
  dishes = [],
  pageTitle = { main: 'CHEF SELECTION', sub: 'CLÁSICOS & ENTRADAS DE AUTOR', badge: 'VOL. 1' },
  pageIndex = 0,
  totalPages = 1,
  setSelectedProduct,
  activeDishId,
  setActiveDishId,
  formatEditorialPrice,
  onDogEarClick,
  canGoNext,
  isEntering = false,
  favorites = [],
  toggleFavorite
}) {
  return (
    <div className="w-full min-h-[540px] xs:min-h-[580px] sm:min-h-[660px] rounded-2xl relative overflow-hidden bg-[#fdfcf7] text-[#1a1711] flex flex-col justify-between p-3 xs:p-4 sm:p-6 editorial-paper-texture border border-[#e9e2ca] shadow-inner select-none">
      
      {/* Corner Dog-Ear Fold to flip page (Mobile touch-friendly 48px) */}
      {canGoNext && onDogEarClick && (
        <div
          onClick={onDogEarClick}
          className="corner-curl z-40 cursor-pointer group"
          title="Pasa a la siguiente página"
        >
          <span className="absolute -top-1 -right-1 text-[8px] font-black text-white/90 uppercase tracking-tighter -rotate-45 hidden group-hover:block pointer-events-none">
            Pasar
          </span>
        </div>
      )}

      {/* Top Page Header (Mobile First, clean monogram without redundant close button) */}
      <div className="relative z-10 flex items-start justify-between border-b border-[#e9e2ca] pb-2 sm:pb-2.5">
        <div className="space-y-0.5">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="text-[9px] xs:text-[10px] sm:text-xs font-black tracking-widest text-[#9b7e09] uppercase">
              LA TRATTORIA GOURMET • {pageTitle.badge}
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#9b7e09] animate-ping" />
          </div>
          <h2 className="text-xl xs:text-2xl sm:text-3xl font-black tracking-tight text-[#1a1711] uppercase leading-none font-sans scale-y-105 origin-top-left">
            {pageTitle.main}
          </h2>
          <p className="text-[8px] xs:text-[9px] sm:text-[10px] font-bold text-[#857f5d] tracking-wider uppercase">
            {pageTitle.sub}
          </p>
        </div>

        {/* Monogram Crest */}
        <div className="flex flex-col items-end gap-1">
          <div className="w-8 h-8 xs:w-9 xs:h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-[#e9e2ca] via-[#b8960e] to-[#9b7e09] p-0.5 shadow-md flex items-center justify-center shrink-0">
            <div className="w-full h-full bg-[#1e1b13] rounded-[9px] flex items-center justify-center text-[#e9e2ca] font-serif font-bold text-xs xs:text-sm sm:text-base">
              TG
            </div>
          </div>
          <span className="text-[7px] sm:text-[8px] font-bold text-[#857f5d] uppercase tracking-widest">
            EST. 2026
          </span>
        </div>
      </div>

      {/* Multiple Dishes (Compact sample images so 4 dishes fit gracefully per page) */}
      <div className="space-y-2 xs:space-y-2.5 sm:space-y-3 my-auto py-1 sm:py-2">
        {dishes.map((dish, idx) => {
          const isReversed = idx % 2 === 1;
          const staggerClass = isEntering ? `dish-stagger-${idx + 1}` : '';
          const isFav = favorites.includes(dish.id);

          return (
            <div
              key={dish.id}
              onClick={() => setSelectedProduct && setSelectedProduct(dish)}
              onMouseEnter={() => setActiveDishId && setActiveDishId(dish.id)}
              onMouseLeave={() => setActiveDishId && setActiveDishId(null)}
              className={`cursor-pointer group transition-all duration-300 flex items-center justify-between gap-2.5 xs:gap-3 sm:gap-4 p-1.5 sm:p-2 rounded-xl sm:rounded-2xl border transition-colors ${
                isReversed ? 'flex-row-reverse bg-[#e9e2ca]/20 text-right' : 'hover:bg-[#e9e2ca]/30'
              } border-transparent hover:border-[#e9e2ca] ${staggerClass}`}
            >
              {/* Dish Info */}
              <div className={`flex-1 space-y-0.5 min-w-0 ${isReversed ? 'text-right' : 'text-left'}`}>
                <div className={`flex items-baseline gap-1 ${isReversed ? 'justify-end' : 'justify-start'}`}>
                  <span className="text-xl xs:text-2xl sm:text-3xl font-black text-[#9b7e09] tracking-tighter group-hover:scale-105 transition-transform inline-block">
                    {formatEditorialPrice(dish.price)}
                  </span>
                  <span className="text-[8px] xs:text-[9px] sm:text-[10px] font-bold text-[#857f5d]">mil COP</span>
                  {dish.soldOut && (
                    <span className="ml-1.5 text-[8px] sm:text-[9px] font-black text-rose-600 bg-rose-100 px-1.5 py-0.5 rounded-full uppercase tracking-wide">
                      Agotado
                    </span>
                  )}
                </div>
                <h3 className="text-xs xs:text-sm sm:text-base font-extrabold text-[#1a1711] group-hover:text-[#9b7e09] transition-colors leading-tight truncate">
                  {dish.name}
                </h3>
                <p className={`text-[8px] xs:text-[9px] sm:text-[10px] text-[#5e5541] line-clamp-1 xs:line-clamp-2 leading-relaxed ${isReversed ? 'ml-auto' : ''}`}>
                  {dish.ingredients?.join(', ') || dish.description}
                </p>
              </div>

              {/* Smaller Sample Image with Spotlight Hover */}
              <div className="relative shrink-0">
                <div
                  className={`w-14 h-14 xs:w-16 xs:h-16 sm:w-20 sm:h-20 rounded-full p-0.5 bg-[#fdfcf7] shadow-md dish-spotlight overflow-hidden transition-all duration-500 border-2 ${
                    isReversed ? 'border-[#9b7e09]/40' : 'border-[#e9e2ca]'
                  } ${
                    activeDishId === dish.id ? 'dish-spotlight-active scale-105 ring-2 ring-[#9b7e09]/50' : ''
                  }`}
                >
                  <img
                    src={dish.image}
                    alt={dish.name}
                    className={`w-full h-full rounded-full object-cover group-hover:scale-110 transition-transform duration-700 ${
                      dish.soldOut ? 'grayscale opacity-60' : ''
                    }`}
                  />
                </div>

                {/* Favorite button */}
                {toggleFavorite && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(dish.id);
                    }}
                    className={`absolute -top-1 ${isReversed ? '-left-1' : '-right-1'} w-5 h-5 rounded-full flex items-center justify-center backdrop-blur-sm transition-all shadow-sm ${
                      isFav ? 'bg-rose-500 text-white' : 'bg-white/80 text-[#857f5d] hover:text-rose-500'
                    }`}
                    title={isFav ? 'Quitar de favoritos' : 'Guardar en favoritos'}
                  >
                    <Heart className={`w-2.5 h-2.5 ${isFav ? 'fill-current' : ''}`} />
                  </button>
                )}

                {dish.soldOut ? (
                  <div className={`absolute -bottom-1 ${isReversed ? '-right-1' : '-left-1'} bg-rose-600 text-white text-[7px] xs:text-[8px] font-black px-1.5 py-0.5 rounded-full shadow flex items-center gap-0.5`}>
                    <Ban className="w-2 h-2" /> Agotado
                  </div>
                ) : (
                  <div className={`absolute -bottom-1 ${isReversed ? '-right-1' : '-left-1'} bg-gradient-to-r from-[#9b7e09] to-[#b8960e] text-[#fdfcf7] text-[7px] xs:text-[8px] font-black px-1.5 py-0.5 rounded-full shadow flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity`}>
                    <Plus className="w-2 h-2" /> Pedir
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Page Footer (Mobile First) */}
      <div className="relative z-10 pt-1.5 sm:pt-2 border-t border-[#e9e2ca] flex items-center justify-between text-[8px] xs:text-[9px] sm:text-[10px] text-[#857f5d] font-medium">
        <div>
          <span className="font-bold text-[#1a1711]">LA TRATTORIA GOURMET</span>
          <span className="hidden xs:inline"> • Medellín</span>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2">
          <span className="text-[#9b7e09] font-extrabold flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> Toca para ordenar
          </span>
          <span className="text-[#857f5d] font-mono">PÁG. {pageIndex + 1}/{totalPages}</span>
        </div>
      </div>
    </div>
  );
}

export default function EditorialSpreadView({
  products = [],
  setSelectedProduct,
  favorites = [],
  toggleFavorite
}) {
  // Starts with the book closed so the user sees the luxury hardcover first
  const [isBookOpened, setIsBookOpened] = useState(false);
  const [coverState, setCoverState] = useState('idle'); // 'idle' | 'opening' | 'closing'
  
  const [currentPage, setCurrentPage] = useState(0);
  const [targetPage, setTargetPage] = useState(null);
  const [transitionDirection, setTransitionDirection] = useState(null); // 'next' | 'prev' | null
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [activeDishId, setActiveDishId] = useState(null);

  const touchStartX = useRef(0);
  const touchEndX = useRef(0);
  const lastScrollTime = useRef(0);

  // Soft page turn sound effect using Web Audio API (extended to match slower 1.35s turn)
  const playPageTurnSound = () => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(360, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.55);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(900, ctx.currentTime);

      gain.gain.setValueAtTime(0.06, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.55);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.56);
    } catch (e) {
      // Audio fallback
    }
  };

  // Heavy leather book opening/closing sound (extended to match slower 1.35s turn)
  const playBookCoverSound = () => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(130, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.7);

      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.7);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.71);
    } catch (e) {}
  };

  // Open the book with slower 1.35s 3D animation
  const handleOpenBook = () => {
    if (coverState !== 'idle' || isTransitioning) return;
    playBookCoverSound();
    setCoverState('opening');
    setIsTransitioning(true);
    setTimeout(() => {
      setIsBookOpened(true);
      setCoverState('idle');
      setCurrentPage(0);
      setIsTransitioning(false);
    }, 1350);
  };

  // Close the book back to the cover (1.35s 3D swing shut)
  const handleCloseBook = () => {
    if (coverState !== 'idle' || isTransitioning) return;
    playBookCoverSound();
    setCoverState('closing');
    setIsTransitioning(true);
    setTimeout(() => {
      setIsBookOpened(false);
      setCoverState('idle');
      setCurrentPage(0);
      setTargetPage(null);
      setTransitionDirection(null);
      setIsTransitioning(false);
    }, 1350);
  };

  // Group products into book pages (4 dishes per page so more dishes fit per sheet!)
  const pages = useMemo(() => {
    if (!products || products.length === 0) return [];
    const pageSize = 4;
    const chunks = [];
    for (let i = 0; i < products.length; i += pageSize) {
      chunks.push(products.slice(i, i + pageSize));
    }
    return chunks.length > 0 ? chunks : [products];
  }, [products]);

  // Safe clamping of currentPage when products change
  useEffect(() => {
    if (pages.length === 0) {
      setCurrentPage(0);
    } else if (currentPage >= pages.length) {
      setCurrentPage(Math.max(0, pages.length - 1));
    }
  }, [pages.length, currentPage]);

  const pageTitles = [
    { main: 'CHEF SELECTION', sub: 'CLÁSICOS & ENTRADAS DE AUTOR', badge: 'VOL. 1' },
    { main: 'PASTA & MARE', sub: 'ALTA COCINA MEDITERRÁNEA', badge: 'VOL. 2' },
    { main: 'CARNES & BRASAS', sub: 'CORTES NOBLES & ESPECIALIDADES', badge: 'VOL. 3' },
    { main: 'RAW & SIGNATURE SIPS', sub: 'TARTARE & COCTELERÍA DE AUTOR', badge: 'VOL. 4' },
    { main: 'DOLCI & FINALE', sub: 'POSTRES EMBLEMÁTICOS & MARIDAJES', badge: 'VOL. 5' },
    { main: 'RESERVA PRIVADA', sub: 'SELECCIÓN EXCLUSIVA DEL CHEF', badge: 'VOL. 6' }
  ];

  // Slower, ultra-fluid 1.35s 3D leaf turn (Sequential: if on Page 1, going back closes the book!)
  const goToPrevPage = () => {
    if (isTransitioning || coverState !== 'idle') return;
    
    // Intuitive sequential flow: going previous from page 1 closes the book cover
    if (currentPage === 0) {
      handleCloseBook();
      return;
    }

    if (currentPage > 0) {
      playPageTurnSound();
      const prevIdx = currentPage - 1;
      setTargetPage(prevIdx);
      setTransitionDirection('prev');
      setIsTransitioning(true);

      setTimeout(() => {
        setCurrentPage(prevIdx);
        setTargetPage(null);
        setTransitionDirection(null);
        setIsTransitioning(false);
      }, 1350);
    }
  };

  const goToNextPage = () => {
    if (isTransitioning || coverState !== 'idle') return;

    // If closed, next opens the book
    if (!isBookOpened) {
      handleOpenBook();
      return;
    }

    if (currentPage < pages.length - 1) {
      playPageTurnSound();
      const nextIdx = currentPage + 1;
      setTargetPage(nextIdx);
      setTransitionDirection('next');
      setIsTransitioning(true);

      setTimeout(() => {
        setCurrentPage(nextIdx);
        setTargetPage(null);
        setTransitionDirection(null);
        setIsTransitioning(false);
      }, 1350);
    }
  };

  const goToPage = (idx) => {
    if (idx !== currentPage && !isTransitioning && coverState === 'idle' && idx >= 0 && idx < pages.length) {
      playPageTurnSound();
      const dir = idx > currentPage ? 'next' : 'prev';
      setTargetPage(idx);
      setTransitionDirection(dir);
      setIsTransitioning(true);

      setTimeout(() => {
        setCurrentPage(idx);
        setTargetPage(null);
        setTransitionDirection(null);
        setIsTransitioning(false);
      }, 1350);
    }
  };

  // Keyboard navigation: Left Arrow on Page 1 closes the book sequentially
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isBookOpened) {
        if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowRight') handleOpenBook();
        return;
      }
      if (e.key === 'ArrowRight') goToNextPage();
      if (e.key === 'ArrowLeft') goToPrevPage();
      if (e.key === 'Escape') handleCloseBook();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentPage, isTransitioning, isBookOpened, coverState, pages.length]);

  // Touch Swipe Handlers: Swiping right on Page 1 closes the book sequentially
  const handleTouchStart = (e) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!isBookOpened) return;
    const deltaX = touchStartX.current - touchEndX.current;
    if (touchEndX.current === 0) return;
    if (deltaX > 35) {
      goToNextPage();
    } else if (deltaX < -35) {
      goToPrevPage();
    }
    touchStartX.current = 0;
    touchEndX.current = 0;
  };

  // Wheel scroll to flip pages subtly: scrolling up on Page 1 closes the book
  const handleWheel = (e) => {
    if (!isBookOpened || isTransitioning || coverState !== 'idle') return;
    const now = Date.now();
    if (now - lastScrollTime.current < 1400) return;
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

  return (
    <div className="relative w-full max-w-2xl mx-auto space-y-3 sm:space-y-3.5 select-none">
      
      {/* 3D Book Frame Container (Mobile First) */}
      <div
        onWheel={handleWheel}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="book-viewport w-full rounded-2xl sm:rounded-3xl p-1.5 xs:p-2 sm:p-3 bg-gradient-to-br from-[#1e1b13] via-[#14120c] to-[#242017] border-2 border-[#9b7e09]/40 shadow-2xl shadow-black/95 relative overflow-visible"
      >
        {/* Book Spine on Left Edge */}
        <div className="absolute top-0 bottom-0 left-0 w-4 xs:w-5 sm:w-7 book-spine-shadow z-30 pointer-events-none rounded-l-2xl sm:rounded-l-3xl" />

        {/* Stacked Paper Page Edges on Right */}
        <div className="book-page-stack-right" />

        {/* Silk Red Ribbon Bookmark (Mobile accessible) */}
        <div
          onClick={isBookOpened ? handleCloseBook : handleOpenBook}
          className="ribbon-bookmark right-8 xs:right-10 sm:right-12"
          title={isBookOpened ? "Cerrar libro" : "Abrir libro"}
        />

        {/* ============================================================== */}
        {/* 3D VIEWPORT: HARDCOVER & PAGES                                 */}
        {/* ============================================================== */}

        {/* STATE 1: Closed Hardcover (Stationary) */}
        {!isBookOpened && coverState === 'idle' && (
          <BookCoverCard onOpenBook={handleOpenBook} />
        )}

        {/* STATE 2: Cover Opening in 3D (Dual-Layer: Page 1 reveals, Cover swings open to -112deg) */}
        {coverState === 'opening' && (
          <div className="relative w-full min-h-[540px] xs:min-h-[580px] sm:min-h-[660px] overflow-hidden rounded-2xl">
            <div className="absolute inset-0 w-full h-full z-10 page-reveal-underneath">
              <PageCard
                dishes={pages[0] || []}
                pageTitle={pageTitles[0]}
                pageIndex={0}
                totalPages={pages.length}
                setSelectedProduct={setSelectedProduct}
                activeDishId={activeDishId}
                setActiveDishId={setActiveDishId}
                formatEditorialPrice={formatEditorialPrice}
                canGoNext={false}
                favorites={favorites}
                toggleFavorite={toggleFavorite}
              />
            </div>
            <div className="absolute inset-0 w-full h-full z-20 book-cover-open-3d">
              <BookCoverCard />
            </div>
          </div>
        )}

        {/* STATE 3: Cover Closing in 3D (Dual-Layer: Page 1 rests, Cover swings shut from -112deg to 0deg) */}
        {coverState === 'closing' && (
          <div className="relative w-full min-h-[540px] xs:min-h-[580px] sm:min-h-[660px] overflow-hidden rounded-2xl">
            <div className="absolute inset-0 w-full h-full z-10 page-hide-underneath">
              <PageCard
                dishes={pages[0] || []}
                pageTitle={pageTitles[0]}
                pageIndex={0}
                totalPages={pages.length}
                setSelectedProduct={setSelectedProduct}
                activeDishId={activeDishId}
                setActiveDishId={setActiveDishId}
                formatEditorialPrice={formatEditorialPrice}
                canGoNext={false}
                favorites={favorites}
                toggleFavorite={toggleFavorite}
              />
            </div>
            <div className="absolute inset-0 w-full h-full z-20 book-cover-close-3d">
              <BookCoverCard />
            </div>
          </div>
        )}

        {/* STATE 4: Book Opened (Pages with 3D leaf turn physics) */}
        {isBookOpened && coverState === 'idle' && (
          <div className="relative w-full min-h-[540px] xs:min-h-[580px] sm:min-h-[660px] overflow-hidden rounded-2xl">
            
            {/* SCENARIO 4A: NEXT PAGE TRANSITION */}
            {isTransitioning && transitionDirection === 'next' && targetPage !== null && (
              <>
                {/* Layer 1 (Underneath): Target Page with subtle lighting reveal */}
                <div className="absolute inset-0 w-full h-full z-10 page-reveal-underneath">
                  <PageCard
                    dishes={pages[targetPage] || []}
                    pageTitle={pageTitles[targetPage % pageTitles.length]}
                    pageIndex={targetPage}
                    totalPages={pages.length}
                    setSelectedProduct={setSelectedProduct}
                    activeDishId={activeDishId}
                    setActiveDishId={setActiveDishId}
                    formatEditorialPrice={formatEditorialPrice}
                    canGoNext={false}
                    favorites={favorites}
                    toggleFavorite={toggleFavorite}
                  />
                </div>

                {/* Layer 2 (On Top): Current Page swinging open to -112deg around left hinge */}
                <div className="absolute inset-0 w-full h-full z-20 page-leaf-turn-next">
                  <PageCard
                    dishes={pages[currentPage] || []}
                    pageTitle={pageTitles[currentPage % pageTitles.length]}
                    pageIndex={currentPage}
                    totalPages={pages.length}
                    setSelectedProduct={setSelectedProduct}
                    activeDishId={activeDishId}
                    setActiveDishId={setActiveDishId}
                    formatEditorialPrice={formatEditorialPrice}
                    canGoNext={false}
                    favorites={favorites}
                    toggleFavorite={toggleFavorite}
                  />
                </div>
              </>
            )}

            {/* SCENARIO 4B: PREV PAGE TRANSITION */}
            {isTransitioning && transitionDirection === 'prev' && targetPage !== null && (
              <>
                {/* Layer 1 (Underneath): Current Page resting with subtle darkening */}
                <div className="absolute inset-0 w-full h-full z-10 page-hide-underneath">
                  <PageCard
                    dishes={pages[currentPage] || []}
                    pageTitle={pageTitles[currentPage % pageTitles.length]}
                    pageIndex={currentPage}
                    totalPages={pages.length}
                    setSelectedProduct={setSelectedProduct}
                    activeDishId={activeDishId}
                    setActiveDishId={setActiveDishId}
                    formatEditorialPrice={formatEditorialPrice}
                    canGoNext={false}
                    favorites={favorites}
                    toggleFavorite={toggleFavorite}
                  />
                </div>

                {/* Layer 2 (On Top): Target Page swinging closed from -112deg to 0deg around left hinge */}
                <div className="absolute inset-0 w-full h-full z-20 page-leaf-turn-prev">
                  <PageCard
                    dishes={pages[targetPage] || []}
                    pageTitle={pageTitles[targetPage % pageTitles.length]}
                    pageIndex={targetPage}
                    totalPages={pages.length}
                    setSelectedProduct={setSelectedProduct}
                    activeDishId={activeDishId}
                    setActiveDishId={setActiveDishId}
                    formatEditorialPrice={formatEditorialPrice}
                    canGoNext={false}
                    favorites={favorites}
                    toggleFavorite={toggleFavorite}
                  />
                </div>
              </>
            )}

            {/* SCENARIO 4C: IDLE STATE (Stationary Active Page) */}
            {!isTransitioning && (
              <div className="w-full h-full relative z-20">
                <PageCard
                  dishes={pages[currentPage] || []}
                  pageTitle={pageTitles[currentPage % pageTitles.length]}
                  pageIndex={currentPage}
                  totalPages={pages.length}
                  setSelectedProduct={setSelectedProduct}
                  activeDishId={activeDishId}
                  setActiveDishId={setActiveDishId}
                  formatEditorialPrice={formatEditorialPrice}
                  onDogEarClick={goToNextPage}
                  canGoNext={currentPage < pages.length - 1}
                  favorites={favorites}
                  toggleFavorite={toggleFavorite}
                />
              </div>
            )}

          </div>
        )}
      </div>

      {/* ================================================================ */}
      {/* NAVIGATION CONTROLS BAR (INTUITIVE & SEQUENTIAL)                */}
      {/* ================================================================ */}
      <div className="bg-[#1e1b13]/95 backdrop-blur-md border border-[#383324] p-2 xs:p-2.5 sm:p-3 rounded-2xl shadow-xl flex items-center justify-between gap-2 text-[#fdfcf7]">
        
        {/* Left: Previous Page button (On Page 1 it smoothly closes the book cover!) */}
        <button
          type="button"
          onClick={goToPrevPage}
          disabled={!isBookOpened || isTransitioning || coverState !== 'idle'}
          className="px-2.5 xs:px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-[#2c271d] hover:bg-[#383324] active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed text-xs font-bold transition-all flex items-center gap-1 sm:gap-1.5 text-[#e9e2ca] shrink-0 min-h-[40px] sm:min-h-[44px]"
          title={currentPage === 0 ? "Cerrar la carta y volver a la portada" : "Ir a la hoja anterior"}
        >
          <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#b8960e]" />
          {currentPage === 0 ? (
            <>
              <span className="hidden xs:inline">Cerrar Portada</span>
              <span className="xs:hidden">Portada</span>
            </>
          ) : (
            <>
              <span className="hidden xs:inline">Hoja Anterior</span>
              <span className="xs:hidden">Ant.</span>
            </>
          )}
        </button>

        {/* Center: Book State & Progress Dots (Sequential & Clean) */}
        <div className="flex flex-col items-center space-y-1 min-w-0">
          {isBookOpened ? (
            <>
              <div className="flex items-center space-x-1 sm:space-x-1.5">
                {pages.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    disabled={isTransitioning || coverState !== 'idle'}
                    onClick={() => goToPage(idx)}
                    className={`h-2 sm:h-2.5 rounded-full transition-all ${
                      currentPage === idx
                        ? 'w-5 sm:w-7 bg-gradient-to-r from-[#9b7e09] to-[#b8960e] shadow-md'
                        : 'w-2 sm:w-2.5 bg-[#383324] hover:bg-[#857f5d]'
                    }`}
                    title={`Ir a Página ${idx + 1}`}
                  />
                ))}
              </div>
              <div className="flex items-center gap-1.5 text-[9px] sm:text-[10px] text-[#aba489] truncate">
                <span>Pág. <strong className="text-[#e9e2ca]">{currentPage + 1}</strong> de <strong className="text-[#e9e2ca]">{pages.length}</strong></span>
              </div>
            </>
          ) : (
            <button
              type="button"
              onClick={handleOpenBook}
              disabled={coverState !== 'idle'}
              className="text-[11px] sm:text-xs font-black text-[#e9e2ca] hover:text-[#fdfcf7] flex items-center gap-1 sm:gap-1.5 transition-colors truncate"
            >
              <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#b8960e] shrink-0" />
              <span className="truncate">Portada Cerrada</span>
            </button>
          )}
        </div>

        {/* Right: Next Page or Open Cover */}
        {!isBookOpened ? (
          <button
            type="button"
            onClick={handleOpenBook}
            disabled={coverState !== 'idle'}
            className="px-3 xs:px-4 py-2 sm:py-2.5 rounded-xl bg-gradient-to-r from-[#9b7e09] to-[#b8960e] hover:from-[#b8960e] hover:to-[#9b7e09] active:scale-95 text-[#fdfcf7] text-xs font-black transition-all flex items-center gap-1 sm:gap-1.5 shadow-md shadow-[#9b7e09]/25 shrink-0 min-h-[40px] sm:min-h-[44px]"
          >
            <span>Abrir Carta</span>
            <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={goToNextPage}
            disabled={currentPage === pages.length - 1 || isTransitioning || coverState !== 'idle'}
            className="px-2.5 xs:px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-gradient-to-r from-[#9b7e09] to-[#b8960e] hover:from-[#b8960e] hover:to-[#9b7e09] active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed text-[#fdfcf7] text-xs font-black transition-all flex items-center gap-1 sm:gap-1.5 shadow-md shadow-[#9b7e09]/20 shrink-0 min-h-[40px] sm:min-h-[44px]"
          >
            <span className="hidden xs:inline">Siguiente Hoja</span>
            <span className="xs:hidden">Sig.</span>
            <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        )}
      </div>

    </div>
  );
}
