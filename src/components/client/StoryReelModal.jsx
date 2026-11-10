import { useState, useEffect, useCallback } from 'react';
import { X, ChevronLeft, Play, Pause } from 'lucide-react';
import { formatCOP } from '../../lib/money';

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

  const label = relatedProduct?.isChef ? 'Receta del chef' : 'De los más pedidos';

  return (
    <div className="fixed inset-0 z-50 bg-[#0d120f] flex items-center justify-center sm:p-6 animate-fadeIn" role="dialog" aria-modal="true" aria-label="Hoy recomendamos">
      <div className="relative w-full max-w-md h-full sm:h-[90vh] max-h-[820px] sm:rounded-[28px] overflow-hidden flex flex-col bg-black text-white">
        {/* Foto a pantalla completa; tocar a los lados avanza o retrocede */}
        <img src={currentStory.image} alt={currentStory.subtitle} className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/85" aria-hidden="true" />
        <button className="absolute inset-y-0 left-0 w-1/3 z-10" onClick={handlePrev} aria-label="Anterior" />
        <button className="absolute inset-y-0 right-0 w-1/3 z-10" onClick={handleNext} aria-label="Siguiente" />

        <div className="relative z-20 p-4 space-y-3">
          <div className="flex gap-1.5">
            {stories.map((story, idx) => (
              <button
                key={story.id}
                aria-label={`Ver recomendado ${idx + 1}`}
                className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden"
                onClick={() => {
                  setCurrentIndex(idx);
                  setProgress(0);
                }}
              >
                <span className="block h-full bg-white rounded-full" style={{ width: idx === currentIndex ? `${progress}%` : idx < currentIndex ? '100%' : '0%' }} />
              </button>
            ))}
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-display font-bold text-lg leading-tight">Hoy recomendamos</p>
              <p className="text-sm text-white/75">{label}</p>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsPaused(!isPaused)}
                className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/15"
                aria-label={isPaused ? 'Reanudar' : 'Pausar'}
              >
                {isPaused ? <Play className="w-5 h-5 fill-current" /> : <Pause className="w-5 h-5" />}
              </button>
              <button onClick={onClose} className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/15" aria-label="Cerrar">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        <div className="relative z-20 mt-auto p-5 pb-6 space-y-3">
          <h2 className="font-display font-extrabold text-3xl tracking-tight leading-tight">{currentStory.subtitle}</h2>
          {currentStory.storyText && <p className="text-white/85 leading-relaxed line-clamp-4">{currentStory.storyText}</p>}
          {relatedProduct && (
            <button
              onClick={() => {
                onClose();
                onOpenProductDetail(relatedProduct);
              }}
              className="btn btn-primary w-full h-12 justify-between px-6 mt-2"
            >
              <span>Ver el plato</span>
              <span className="precio">{formatCOP(relatedProduct.price)}</span>
            </button>
          )}
          {currentIndex > 0 && (
            <button onClick={handlePrev} className="hidden sm:flex absolute -top-16 left-3 w-10 h-10 rounded-full bg-black/40 items-center justify-center" aria-label="Anterior">
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
