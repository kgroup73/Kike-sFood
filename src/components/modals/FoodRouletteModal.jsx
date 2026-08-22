import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Sparkles,
  Dices,
  RotateCcw,
  Flame,
  Check,
  Utensils,
  Heart,
  Swords,
  Plus,
  Trash2,
  Search,
  CheckCircle2,
  Trophy
} from 'lucide-react';
import { ROULETTE_MOODS } from '../../data/mockData';
import { formatCOP } from '../../lib/dian';

export default function FoodRouletteModal({
  products,
  onClose,
  onOpenProductDetail,
  playChime
}) {
  const [activeMode, setActiveMode] = useState('duel');
  const [selectedMood, setSelectedMood] = useState('all');

  // Custom Duel state (2-4 dishes)
  const [customCandidates, setCustomCandidates] = useState([]);
  const [duelSearch, setDuelSearch] = useState('');

  // Spinning & Result state
  const [isSpinning, setIsSpinning] = useState(false);
  const [displayedProduct, setDisplayedProduct] = useState(null);
  const [selectedResult, setSelectedResult] = useState(null);

  useEffect(() => {
    if (products.length >= 2 && customCandidates.length === 0) {
      setCustomCandidates([products[0].id, products[1].id]);
    }
  }, [products]);

  const currentPool = useMemo(() => {
    if (activeMode === 'duel') {
      const selected = products.filter(p => customCandidates.includes(p.id));
      return selected.length > 0 ? selected : products.slice(0, 2);
    } else {
      const moodObj = ROULETTE_MOODS.find(m => m.id === selectedMood);
      if (!moodObj || !moodObj.filter) return products.filter(p => p.available !== false);
      const filtered = products.filter(p => p.available !== false && moodObj.filter(p));
      return filtered.length > 0 ? filtered : products;
    }
  }, [products, activeMode, customCandidates, selectedMood]);

  useEffect(() => {
    if (currentPool.length > 0 && !selectedResult) {
      setDisplayedProduct(currentPool[0]);
    }
  }, [currentPool, activeMode]);

  const toggleCandidate = (productId) => {
    if (customCandidates.includes(productId)) {
      setCustomCandidates(prev => prev.filter(id => id !== productId));
    } else {
      if (customCandidates.length >= 4) return;
      setCustomCandidates(prev => [...prev, productId]);
    }
    setSelectedResult(null);
  };

  const handleSpin = () => {
    if (isSpinning || currentPool.length < 2) return;
    setIsSpinning(true);
    setSelectedResult(null);
    if (playChime) playChime();

    let counter = 0;
    const maxSteps = 24;
    const intervalTime = 70;

    const interval = setInterval(() => {
      const randomItem = currentPool[Math.floor(Math.random() * currentPool.length)];
      setDisplayedProduct(randomItem);
      counter++;

      if (counter >= maxSteps) {
        clearInterval(interval);
        const finalPick = currentPool[Math.floor(Math.random() * currentPool.length)];
        setDisplayedProduct(finalPick);
        setSelectedResult(finalPick);
        setIsSpinning(false);
        if (playChime) playChime();
      }
    }, intervalTime);
  };

  const searchableProducts = useMemo(() => {
    return products.filter(p =>
      p.available !== false &&
      (p.name.toLowerCase().includes(duelSearch.toLowerCase()) ||
       p.category.toLowerCase().includes(duelSearch.toLowerCase()))
    );
  }, [products, duelSearch]);

  const candidateObjects = useMemo(() => {
    return customCandidates.map(id => products.find(p => p.id === id)).filter(Boolean);
  }, [customCandidates, products]);

  return (
    <div className="fixed inset-0 z-50 bg-[#14120c]/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-[#1e1b13] border border-[#383324] rounded-3xl max-w-lg w-full max-h-[92vh] overflow-y-auto hide-scrollbar shadow-2xl flex flex-col text-[#fdfcf7] relative">
        
        {/* Top Decorative Gradient */}
        <div className="h-2 bg-gradient-to-r from-[#9b7e09] via-[#b8960e] to-[#e9e2ca] animate-pulse shrink-0" />

        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#383324] flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#9b7e09] to-[#b8960e] flex items-center justify-center text-[#fdfcf7] shadow-lg shadow-[#9b7e09]/20 border border-[#b8960e]/30">
              {activeMode === 'duel' ? <Swords className="w-5 h-5 animate-pulse" /> : <Dices className="w-5 h-5 animate-bounce" />}
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-[#fdfcf7] flex items-center gap-1.5">
                Ruleta Gastronómica
                <span className="text-[10px] bg-[#9b7e09]/20 text-[#e9e2ca] border border-[#9b7e09]/30 px-2 py-0.5 rounded-full font-bold">
                  {activeMode === 'duel' ? '⚔️ Duelo de Platos' : '🎲 Chef AI'}
                </span>
              </h3>
              <p className="text-[11px] text-[#aba489]">
                {activeMode === 'duel'
                  ? 'Elige tus platos indecisos y la ruleta elegirá al ganador'
                  : 'Déjanos recomendarte el plato perfecto según tu antojo'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#2c271d] hover:bg-[#383324] text-[#857f5d] hover:text-[#fdfcf7] flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Main Mode Navigation Tabs */}
        <div className="p-3 bg-[#14120c]/80 border-b border-[#383324] shrink-0">
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-[#1e1b13] rounded-2xl border border-[#383324] text-xs font-bold">
            <button
              onClick={() => {
                setActiveMode('duel');
                setSelectedResult(null);
              }}
              disabled={isSpinning}
              className={`py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                activeMode === 'duel'
                  ? 'bg-gradient-to-r from-[#9b7e09] to-[#b8960e] text-[#fdfcf7] shadow-md shadow-[#9b7e09]/20'
                  : 'text-[#857f5d] hover:text-[#e9e2ca]'
              }`}
            >
              <Swords className="w-3.5 h-3.5" />
              <span>Duelo de Mis Platos ({customCandidates.length})</span>
            </button>

            <button
              onClick={() => {
                setActiveMode('mood');
                setSelectedResult(null);
              }}
              disabled={isSpinning}
              className={`py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                activeMode === 'mood'
                  ? 'bg-gradient-to-r from-[#9b7e09] to-[#b8960e] text-[#fdfcf7] shadow-md shadow-[#9b7e09]/20'
                  : 'text-[#857f5d] hover:text-[#e9e2ca]'
              }`}
            >
              <Dices className="w-3.5 h-3.5" />
              <span>Por Tipo de Antojo</span>
            </button>
          </div>
        </div>

        {/* MODE A: CUSTOM DISH DUEL */}
        {activeMode === 'duel' && (
          <div className="p-4 bg-[#14120c]/60 border-b border-[#383324] space-y-3 shrink-0">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-[#e9e2ca] flex items-center gap-1.5">
                <span>Platos en Duelo:</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                  customCandidates.length >= 2 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                }`}>
                  {customCandidates.length} de 4 seleccionados
                </span>
              </span>
              <span className="text-[10px] text-[#857f5d]">Mínimo 2 platos</span>
            </div>

            {/* Selected Candidates Badges */}
            <div className="grid grid-cols-2 gap-2">
              {candidateObjects.map((prod, idx) => (
                <div
                  key={prod.id}
                  className="bg-[#242017] border border-[#9b7e09]/40 rounded-xl p-2 flex items-center justify-between gap-2 shadow-md relative group"
                >
                  <div className="flex items-center space-x-2 min-w-0">
                    <img src={prod.image} alt={prod.name} className="w-8 h-8 rounded-lg object-cover shrink-0" />
                    <div className="min-w-0">
                      <span className="text-[9px] font-bold text-[#b8960e] uppercase tracking-tight block">Opción {idx + 1}</span>
                      <p className="text-[11px] font-bold text-[#fdfcf7] truncate">{prod.name}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleCandidate(prod.id)}
                    disabled={isSpinning}
                    className="text-[#857f5d] hover:text-rose-400 p-1 rounded-lg hover:bg-[#383324] transition-colors"
                    title="Quitar"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}

              {customCandidates.length < 4 && (
                <div className="border-2 border-dashed border-[#383324] rounded-xl p-2 flex items-center justify-center text-[11px] text-[#857f5d]">
                  <span>+ Agrega hasta {4 - customCandidates.length} más</span>
                </div>
              )}
            </div>

            {/* Dish Picker */}
            <div className="space-y-1.5 pt-1">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-[#857f5d]" />
                <input
                  type="text"
                  value={duelSearch}
                  onChange={(e) => setDuelSearch(e.target.value)}
                  placeholder="Buscar plato para añadir al duelo..."
                  className="w-full bg-[#14120c] border border-[#383324] text-[#fdfcf7] pl-8 pr-3 py-1.5 rounded-xl text-xs focus:outline-none focus:border-[#9b7e09] transition-colors placeholder-[#857f5d]"
                />
              </div>

              <div className="flex space-x-2 overflow-x-auto hide-scrollbar py-1">
                {searchableProducts.map(p => {
                  const isSelected = customCandidates.includes(p.id);
                  return (
                    <button
                      key={p.id}
                      onClick={() => toggleCandidate(p.id)}
                      disabled={isSpinning || (!isSelected && customCandidates.length >= 4)}
                      className={`px-2.5 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap flex items-center gap-1.5 transition-all border shrink-0 ${
                        isSelected
                          ? 'bg-[#9b7e09]/20 text-[#e9e2ca] border-[#9b7e09] font-bold'
                          : 'bg-[#14120c] text-[#857f5d] border-[#383324] hover:text-[#fdfcf7] hover:border-[#857f5d]'
                      } ${!isSelected && customCandidates.length >= 4 ? 'opacity-40 cursor-not-allowed' : ''}`}
                    >
                      {isSelected ? <CheckCircle2 className="w-3 h-3 text-[#b8960e]" /> : <Plus className="w-3 h-3" />}
                      <span>{p.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* MODE B: MOOD PILLS */}
        {activeMode === 'mood' && (
          <div className="p-4 bg-[#14120c]/60 border-b border-[#383324] space-y-2 shrink-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#aba489]">
              ¿Qué tipo de antojo tienes hoy?
            </span>
            <div className="flex flex-wrap gap-1.5">
              {ROULETTE_MOODS.map(mood => (
                <button
                  key={mood.id}
                  onClick={() => {
                    setSelectedMood(mood.id);
                    setSelectedResult(null);
                  }}
                  disabled={isSpinning}
                  className={`text-[11px] px-3 py-1.5 rounded-xl font-bold transition-all ${
                    selectedMood === mood.id
                      ? 'bg-gradient-to-r from-[#9b7e09] to-[#b8960e] text-[#fdfcf7] shadow-md shadow-[#9b7e09]/20 scale-105'
                      : 'bg-[#14120c] text-[#857f5d] hover:text-[#e9e2ca] border border-[#383324]'
                  }`}
                >
                  {mood.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Interactive Center Roulette Wheel & Winner Showcase */}
        <div className="p-4 sm:p-5 flex flex-col items-center space-y-4 flex-1">
          {displayedProduct && (
            <div
              className={`w-full bg-[#14120c] rounded-2xl border transition-all duration-300 overflow-hidden relative ${
                selectedResult
                  ? 'border-[#9b7e09] shadow-2xl shadow-[#9b7e09]/25 scale-[1.02] ring-2 ring-[#9b7e09]/50'
                  : 'border-[#383324]'
              }`}
            >
              {/* Dish Image */}
              <div className="relative h-44 sm:h-52 overflow-hidden bg-[#110f0a]">
                <img
                  src={displayedProduct.image}
                  alt={displayedProduct.name}
                  className={`w-full h-full object-cover transition-all duration-300 ${
                    isSpinning ? 'scale-110 blur-[1px]' : 'scale-100'
                  }`}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#14120c] via-[#14120c]/40 to-transparent" />

                {/* Top Badges */}
                <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1.5">
                  {displayedProduct.isChef && (
                    <span className="bg-[#9b7e09] text-[#fdfcf7] text-[10px] font-extrabold px-2 py-0.5 rounded-md shadow">
                      ⭐ Especial Chef
                    </span>
                  )}
                  {displayedProduct.rating && (
                    <span className="bg-[#110f0a]/80 backdrop-blur-md text-[#b8960e] text-[10px] font-bold px-2 py-0.5 rounded-md border border-[#9b7e09]/30">
                      ★ {displayedProduct.rating}
                    </span>
                  )}
                </div>

                {/* Winner Celebration Banner */}
                {selectedResult && (
                  <div className="absolute top-2.5 right-2.5 bg-gradient-to-r from-[#b8960e] to-[#9b7e09] text-[#fdfcf7] text-[10px] font-black px-3 py-1 rounded-full shadow-xl flex items-center gap-1.5 animate-bounce">
                    <Trophy className="w-3.5 h-3.5 fill-current" />
                    <span>{activeMode === 'duel' ? '¡GANADOR DEL DUELO!' : '¡TU MATCH IDEAL!'}</span>
                  </div>
                )}

                <div className="absolute bottom-2.5 left-3 right-3 flex items-end justify-between">
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-[#b8960e] font-bold">
                      {displayedProduct.category}
                    </span>
                    <h4 className="text-sm sm:text-base font-extrabold text-[#fdfcf7] leading-tight">
                      {displayedProduct.name}
                    </h4>
                  </div>
                  <span className="text-base sm:text-lg font-black text-[#9b7e09]">
                    {formatCOP(displayedProduct.price)}
                  </span>
                </div>
              </div>

              {/* Dish Description & Chef Note */}
              <div className="p-3.5 space-y-2 bg-[#14120c]/90 text-xs">
                <p className="text-[#aba489] text-[11px] line-clamp-2 leading-relaxed">
                  {displayedProduct.description}
                </p>

                {displayedProduct.chefNotes && (
                  <div className="p-2 rounded-xl bg-[#9b7e09]/10 border border-[#9b7e09]/20 text-[10px] text-[#e9e2ca] flex items-start gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 shrink-0 text-[#b8960e] mt-0.5" />
                    <span><strong>Nota del Chef:</strong> {displayedProduct.chefNotes}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Action Spin & Customization Buttons */}
          <div className="w-full space-y-2 pt-1">
            {!selectedResult ? (
              <button
                onClick={handleSpin}
                disabled={isSpinning || currentPool.length < 2}
                className={`w-full py-3.5 bg-gradient-to-r from-[#9b7e09] to-[#b8960e] hover:from-[#b8960e] hover:to-[#9b7e09] active:scale-98 text-[#fdfcf7] font-black text-xs sm:text-sm rounded-2xl shadow-xl shadow-[#9b7e09]/25 flex items-center justify-center gap-2 transition-all ${
                  currentPool.length < 2 ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {activeMode === 'duel' ? (
                  <Swords className={`w-4 h-4 ${isSpinning ? 'animate-spin' : ''}`} />
                ) : (
                  <Dices className={`w-4 h-4 ${isSpinning ? 'animate-spin' : ''}`} />
                )}
                <span>
                  {isSpinning
                    ? '¡Girando el Duelo...!'
                    : activeMode === 'duel'
                    ? `¡Girar Duelo entre Mis ${customCandidates.length} Platos!`
                    : '¡Girar y Descubrir Platillo!'}
                </span>
              </button>
            ) : (
              <div className="space-y-2 w-full">
                <button
                  onClick={() => {
                    onClose();
                    onOpenProductDetail(selectedResult);
                  }}
                  className="w-full py-3.5 bg-gradient-to-r from-[#9b7e09] to-[#b8960e] hover:from-[#b8960e] hover:to-[#9b7e09] active:scale-98 text-[#fdfcf7] font-black text-xs sm:text-sm rounded-2xl shadow-xl shadow-[#9b7e09]/25 flex items-center justify-center gap-2 transition-all"
                >
                  <Utensils className="w-4 h-4" />
                  <span>¡Ganó este plato! Personalizar y Pedir</span>
                </button>

                <button
                  onClick={handleSpin}
                  className="w-full py-2.5 bg-[#2c271d] hover:bg-[#383324] text-[#aba489] hover:text-[#fdfcf7] font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>{activeMode === 'duel' ? 'Revancha (Girar de nuevo)' : 'Girar de nuevo'}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
