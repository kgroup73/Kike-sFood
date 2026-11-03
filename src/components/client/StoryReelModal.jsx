import { useState, useEffect, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight, Play, Pause, Sparkles } from 'lucide-react';

export default function StoryReelModal({
  stories = [],
  initialStoryIndex = 0,
  products,
  onClose,
  onOpenProductDetail
}) {
  const [currentIndex, setCurrentIndex] = useState(initialStoryIndex);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const currentStory = stories[currentIndex] || stories[0];
  const relatedProduct = currentStory ? products.find(p => p.id === currentStory.productId) : null;
  const isLast = currentIndex >= stories.length - 1;

  const handleNext = useCallback(() => {
    if (isLast) {
      onClose();
    } else {
      setCurrentIndex(i => i + 1);
      setProgress(0);
    }
  }, [isLast, onClose]);

  const handlePrev = useCallback(() => {
    setCurrentIndex(i => Math.max(0, i - 1));
    setProgress(0);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'Escape') onClose();
      if (e.key === ' ') {
        e.preventDefault();
        setIsPaused(p => !p);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNext, handlePrev, onClose]);

  // Barra de progreso: al llegar a 100 % pasa a la siguiente historia.
  const duration = currentStory?.duration || 5000;
  useEffect(() => {
    if (isPaused) return undefined;
    const intervalTime = 50;
    const step = (intervalTime / duration) * 100;
    const id = setInterval(() => setProgress(prev => Math.min(100, prev + step)), intervalTime);
    return () => clearInterval(id);
  }, [currentIndex, isPaused, duration]);

  useEffect(() => {
    if (progress >= 100) handleNext();
  }, [progress, handleNext]);

  if (!currentStory) return null;

  return (
    <div className="fixed inset-0 z-50 bg-brand-night/95 backdrop-blur-xl flex items-center justify-center p-0 sm:p-4 animate-fadeIn">
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-25">
        <img
          src={currentStory.image}
          alt=""
          className="w-full h-full object-cover blur-3xl scale-125"
        />
      </div>

      <div className="relative w-full max-w-md h-full sm:h-[90vh] max-h-[820px] bg-brand-panel sm:rounded-3xl overflow-hidden shadow-2xl flex flex-col justify-between border border-brand-line">
        {/* Story Progress Indicators */}
        <div className="absolute top-0 inset-x-0 z-20 p-3 pt-4 sm:pt-3 space-y-2.5 bg-gradient-to-b from-brand-night/90 via-brand-night/50 to-transparent">
          <div className="flex gap-1.5 w-full">
            {stories.map((story, idx) => (
              <div
                key={story.id}
                className="flex-1 h-1 sm:h-1.5 bg-white/20 rounded-full overflow-hidden cursor-pointer"
                onClick={() => {
                  setCurrentIndex(idx);
                  setProgress(0);
                }}
              >
                <div
                  className="h-full bg-gradient-to-r from-brand-gold to-brand-gold-light transition-all duration-75 ease-linear rounded-full"
                  style={{
                    width: idx === currentIndex ? `${progress}%` : idx < currentIndex ? '100%' : '0%'
                  }}
                />
              </div>
            ))}
          </div>

          {/* Top Bar Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-full p-0.5 bg-gradient-to-tr from-brand-gold to-brand-gold-light">
                <img
                  src={currentStory.image}
                  alt={currentStory.title}
                  className="w-full h-full rounded-full object-cover"
                />
              </div>
              <div>
                <h4 className="text-xs font-black text-brand-ivory flex items-center gap-1.5">
                  <span>{currentStory.title}</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-brand-gold/20 text-brand-cream border border-brand-gold/30 uppercase tracking-wide font-bold">
                    {currentStory.tag}
                  </span>
                </h4>
                <p className="text-[10px] text-brand-mute font-medium">Historias Gastronómicas</p>
              </div>
            </div>

            <div className="flex items-center space-x-1.5">
              <button
                onClick={() => setIsPaused(!isPaused)}
                className="w-8 h-8 bg-brand-night/70 hover:bg-brand-panel text-white/90 rounded-full flex items-center justify-center backdrop-blur-md border border-white/10 transition-colors"
                title={isPaused ? 'Reanudar' : 'Pausar'}
              >
                {isPaused ? <Play className="w-3.5 h-3.5 fill-current" /> : <Pause className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={onClose}
                className="w-8 h-8 bg-brand-night/70 hover:bg-brand-panel text-brand-ivory rounded-full flex items-center justify-center backdrop-blur-md border border-white/10 transition-colors"
                title="Cerrar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Center Tappable Navigation */}
        <div className="relative flex-1 w-full overflow-hidden flex items-center justify-center bg-brand-dark">
          <img
            src={currentStory.image}
            alt={currentStory.subtitle}
            className="w-full h-full object-cover transition-transform duration-700 ease-out"
          />

          <div className="absolute inset-y-0 left-0 w-1/3 cursor-pointer z-10" onClick={handlePrev} />
          <div className="absolute inset-y-0 right-0 w-1/3 cursor-pointer z-10" onClick={handleNext} />

          {currentIndex > 0 && (
            <button
              onClick={handlePrev}
              className="hidden sm:flex absolute left-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-black/40 text-white/80 hover:text-white hover:bg-black/70 backdrop-blur-md items-center justify-center transition-all"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}
          {currentIndex < stories.length - 1 && (
            <button
              onClick={handleNext}
              className="hidden sm:flex absolute right-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-black/40 text-white/80 hover:text-white hover:bg-black/70 backdrop-blur-md items-center justify-center transition-all"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Bottom Story Content & Quick Action */}
        <div className="relative z-20 p-5 bg-gradient-to-t from-brand-night via-brand-night/90 to-transparent space-y-3.5 text-brand-ivory">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full text-brand-ivory bg-gradient-to-r from-brand-gold to-brand-gold-light shadow-md">
                {currentStory.tag}
              </span>
              {relatedProduct && (
                <span className="text-[11px] font-black text-brand-gold-light flex items-center gap-1">
                  ⭐ {relatedProduct.rating} ({relatedProduct.reviewsCount})
                </span>
              )}
            </div>
            <h3 className="text-lg sm:text-xl font-black text-brand-ivory leading-snug">
              {currentStory.subtitle}
            </h3>
            <p className="text-xs text-brand-mute leading-relaxed font-normal">
              {currentStory.storyText}
            </p>
          </div>

          {relatedProduct && (
            <div className="pt-2 flex items-center gap-2">
              <button
                onClick={() => {
                  onClose();
                  onOpenProductDetail(relatedProduct);
                }}
                className="flex-1 py-3 px-4 bg-gradient-to-r from-brand-gold to-brand-gold-light hover:from-brand-gold-light hover:to-brand-gold active:scale-95 text-brand-ivory font-black text-xs sm:text-sm rounded-2xl shadow-xl shadow-brand-gold/25 flex items-center justify-center gap-2 transition-all"
              >
                <Sparkles className="w-4 h-4" />
                <span>Pedir este Platillo</span>
                <span className="bg-brand-dark/40 px-2 py-0.5 rounded-lg text-xs font-bold text-brand-cream">
                  ${relatedProduct.price.toLocaleString('es-CO')}
                </span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
