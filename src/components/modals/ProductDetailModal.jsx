import React, { useState } from 'react';
import {
  X,
  Plus,
  Minus,
  Sparkles,
  Flame,
  Clock,
  Star,
  Wine,
  Leaf,
  Info,
  Check,
  Heart,
  ChefHat,
  PackageX
} from 'lucide-react';
import { formatCOP } from '../../lib/dian';

export default function ProductDetailModal({
  product,
  onClose,
  onAddToCart,
  isFavorite = false,
  onToggleFavorite,
  allProducts = []
}) {
  const [quantity, setQuantity] = useState(1);
  const [selectedOptions, setSelectedOptions] = useState({});
  const [activeTab, setActiveTab] = useState('customize'); // 'customize' | 'pairing' | 'ingredients'
  const [includePairing, setIncludePairing] = useState(false);

  // Find paired product object if available
  const pairingProduct = product.pairing
    ? (allProducts.find(p => p.id === product.pairing.productId) || {
        name: product.pairing.name,
        price: product.pairing.price,
        image: product.pairing.image,
        description: product.pairing.description
      })
    : null;

  const calculateBaseTotal = () => {
    let base = product.price;
    Object.values(selectedOptions).forEach(group => {
      if (Array.isArray(group)) {
        group.forEach(opt => base += (opt.price || 0));
      }
    });
    return base * quantity;
  };

  const calculateTotal = () => {
    let total = calculateBaseTotal();
    if (includePairing && pairingProduct) {
      total += (pairingProduct.price || product.pairing.price || 0) * quantity;
    }
    return total;
  };

  const handleAddMainAndPairing = () => {
    const opts = [];
    Object.values(selectedOptions).forEach(group => group.forEach(o => opts.push(o.name)));
    
    // Add main dish
    onAddToCart({
      product,
      quantity,
      optionsText: opts.length ? opts.join(', ') : 'Sin especificaciones',
      totalPrice: calculateBaseTotal()
    });

    // If pairing is included, add pairing drink/side too!
    if (includePairing && pairingProduct) {
      onAddToCart({
        product: pairingProduct,
        quantity: quantity,
        optionsText: `Maridaje sugerido para: ${product.name}`,
        totalPrice: (pairingProduct.price || product.pairing.price) * quantity
      });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#14120c]/85 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-[#1e1b13] border border-[#383324] rounded-t-3xl sm:rounded-3xl max-w-lg w-full max-h-[92vh] sm:max-h-[85vh] overflow-y-auto hide-scrollbar shadow-2xl flex flex-col justify-between text-[#fdfcf7]">
        
        {/* Top Hero Image Banner */}
        <div className="relative h-44 sm:h-52 bg-[#110f0a] shrink-0 overflow-hidden">
          <img
            src={product.image}
            alt={product.name}
            className={`w-full h-full object-cover transition-transform duration-500 hover:scale-105 ${product.soldOut ? 'grayscale opacity-70' : ''}`}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#1e1b13] via-transparent to-black/40" />

          {/* Floating Badges */}
          <div className="absolute top-3.5 left-3.5 flex flex-wrap gap-1.5 z-10">
            {product.soldOut && (
              <span className="bg-rose-600 text-white text-[10px] font-extrabold px-2.5 py-0.5 rounded-full shadow-lg flex items-center gap-1">
                <PackageX className="w-3 h-3" /> Agotado
              </span>
            )}
            {product.isChef && (
              <span className="bg-[#9b7e09] text-[#fdfcf7] text-[10px] font-extrabold px-2.5 py-0.5 rounded-full shadow-lg flex items-center gap-1">
                <ChefHat className="w-3 h-3" /> Especial Chef
              </span>
            )}
            {product.isVeg && (
              <span className="bg-emerald-600 text-white text-[10px] font-extrabold px-2.5 py-0.5 rounded-full shadow-lg flex items-center gap-1">
                <Leaf className="w-3 h-3" /> Vegano
              </span>
            )}
            {product.isGf && (
              <span className="bg-indigo-600 text-white text-[10px] font-extrabold px-2.5 py-0.5 rounded-full shadow-lg">
                Sin Gluten
              </span>
            )}
          </div>

          {/* Top Actions: Favorite & Close */}
          <div className="absolute top-3.5 right-3.5 flex items-center space-x-2 z-10">
            {onToggleFavorite && (
              <button
                onClick={() => onToggleFavorite(product.id)}
                className={`w-9 h-9 rounded-full flex items-center justify-center backdrop-blur-md border transition-all ${
                  isFavorite
                    ? 'bg-rose-500 text-white border-rose-400 scale-110 shadow-lg shadow-rose-500/30'
                    : 'bg-[#110f0a]/70 text-[#857f5d] border-white/10 hover:bg-[#1a1711] hover:text-white'
                }`}
                title="Favorito"
              >
                <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
              </button>
            )}
            <button
              onClick={onClose}
              className="w-9 h-9 bg-[#110f0a]/70 hover:bg-[#1a1711] text-[#fdfcf7] rounded-full flex items-center justify-center backdrop-blur-md border border-white/10 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Sensory Info Pill Overlay */}
          <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2 bg-[#110f0a]/85 backdrop-blur-md px-3 py-1.5 rounded-xl border border-[#383324] text-[#fdfcf7] font-medium">
              {product.rating && (
                <span className="text-[#b8960e] font-black flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 fill-current" /> {product.rating}
                  <span className="text-[#857f5d] text-[10px]">({product.reviewsCount || 80})</span>
                </span>
              )}
              {product.prepTime && (
                <>
                  <span className="text-[#857f5d]">•</span>
                  <span className="text-[#aba489] flex items-center gap-1 text-[11px]">
                    <Clock className="w-3 h-3 text-[#b8960e]" /> {product.prepTime}
                  </span>
                </>
              )}
              {product.calories && (
                <>
                  <span className="text-[#857f5d]">•</span>
                  <span className="text-[#aba489] flex items-center gap-1 text-[11px]">
                    <Flame className="w-3 h-3 text-rose-400" /> {product.calories}
                  </span>
                </>
              )}
            </div>
            <span className="text-lg font-black text-[#9b7e09] bg-[#110f0a]/90 backdrop-blur-md px-3 py-1 rounded-xl border border-[#9b7e09]/30">
              {formatCOP(product.price)}
            </span>
          </div>
        </div>

        {/* Modal Body & Interactive Tabs */}
        <div className="p-4 sm:p-5 space-y-4 flex-1">
          <div>
            <h3 className="text-lg sm:text-xl font-extrabold text-[#fdfcf7]">{product.name}</h3>
            <p className="text-xs text-[#aba489] mt-1 leading-relaxed">{product.description}</p>
          </div>

          {/* Aviso de agotamiento (Inventario en tiempo real) */}
          {product.soldOut && (
            <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-2.5">
              <PackageX className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <p className="text-xs font-bold text-rose-300">Producto agotado</p>
                <p className="text-[11px] text-[#aba489] leading-relaxed">
                  La cocina reportó falta de insumos{product.soldOutInfo?.missingIngredients?.length ? ` (${product.soldOutInfo.missingIngredients.join(', ')})` : ''}.
                  No está disponible para pedir en este momento.
                </p>
              </div>
            </div>
          )}

          {/* Interactive Navigation Tabs */}
          <div className="flex items-center space-x-1.5 p-1 bg-[#14120c] rounded-xl border border-[#383324] text-xs font-semibold">
            <button
              onClick={() => setActiveTab('customize')}
              className={`flex-1 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'customize'
                  ? 'bg-gradient-to-r from-[#9b7e09] to-[#b8960e] text-[#fdfcf7] shadow-md'
                  : 'text-[#857f5d] hover:text-[#fdfcf7]'
              }`}
            >
              <span>Personalizar</span>
            </button>
            {product.pairing && (
              <button
                onClick={() => setActiveTab('pairing')}
                className={`flex-1 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 relative ${
                  activeTab === 'pairing'
                    ? 'bg-gradient-to-r from-[#9b7e09] to-[#b8960e] text-[#fdfcf7] shadow-md'
                    : 'text-[#857f5d] hover:text-[#fdfcf7]'
                }`}
              >
                <Wine className="w-3.5 h-3.5" />
                <span>Maridaje</span>
                <span className="w-1.5 h-1.5 rounded-full bg-[#b8960e] animate-ping absolute -top-0.5 -right-0.5" />
              </button>
            )}
            <button
              onClick={() => setActiveTab('ingredients')}
              className={`flex-1 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'ingredients'
                  ? 'bg-gradient-to-r from-[#9b7e09] to-[#b8960e] text-[#fdfcf7] shadow-md'
                  : 'text-[#857f5d] hover:text-[#fdfcf7]'
              }`}
            >
              <Info className="w-3.5 h-3.5" />
              <span>Detalles & Chef</span>
            </button>
          </div>

          {/* Tab Content 1: Customize Modifiers */}
          {activeTab === 'customize' && (
            <div className="space-y-4">
              {product.modifiers && product.modifiers.length > 0 ? (
                product.modifiers.map(mod => (
                  <div key={mod.title} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-[#b8960e] uppercase tracking-wider">
                        {mod.title}
                      </h4>
                      {mod.required && (
                        <span className="text-[10px] text-[#9b7e09] font-bold bg-[#9b7e09]/10 px-2 py-0.5 rounded-md border border-[#9b7e09]/30">
                          Requerido
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-1 gap-1.5">
                      {mod.options.map(opt => {
                        const isSelected = selectedOptions[mod.title]?.[0]?.name === opt.name;
                        return (
                          <label
                            key={opt.name}
                            className={`flex justify-between items-center p-3 rounded-xl cursor-pointer text-xs transition-all border ${
                              isSelected
                                ? 'bg-[#9b7e09]/15 border-[#9b7e09] text-[#fdfcf7] font-bold'
                                : 'bg-[#14120c]/80 border-[#383324] text-[#e9e2ca] hover:bg-[#242017]'
                            }`}
                          >
                            <div className="flex items-center space-x-2.5">
                              <input
                                type="radio"
                                name={mod.title}
                                checked={isSelected}
                                onChange={() =>
                                  setSelectedOptions({
                                    ...selectedOptions,
                                    [mod.title]: [opt]
                                  })
                                }
                                className="accent-[#9b7e09] w-4 h-4"
                              />
                              <span>{opt.name}</span>
                            </div>
                            <span className="text-xs font-bold text-[#b8960e]">
                              {opt.price > 0 ? `+${formatCOP(opt.price)}` : 'Incluido'}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-4 rounded-2xl bg-[#14120c]/60 border border-[#383324] text-center text-[#857f5d] text-xs">
                  Este platillo viene preparado según la receta maestra del chef. Sin modificaciones obligatorias.
                </div>
              )}

              {/* Quick Suggestion Box inside Customize Tab */}
              {product.pairing && !includePairing && (
                <div className="p-3 rounded-2xl bg-[#242017] border border-[#383324] flex items-center justify-between gap-3">
                  <div className="flex items-center space-x-2.5 min-w-0">
                    <div className="w-10 h-10 rounded-xl overflow-hidden bg-[#110f0a] shrink-0 border border-[#383324]">
                      <img src={product.pairing.image} alt={product.pairing.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] font-bold text-[#b8960e] flex items-center gap-1 uppercase tracking-wide">
                        <Wine className="w-3 h-3" /> Maridaje Sugerido
                      </span>
                      <p className="text-xs font-bold text-[#fdfcf7] truncate">{product.pairing.name}</p>
                      <span className="text-[11px] text-[#9b7e09] font-extrabold">{formatCOP(product.pairing.price)}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => setIncludePairing(true)}
                    className="px-3 py-1.5 bg-gradient-to-r from-[#9b7e09] to-[#b8960e] hover:from-[#b8960e] hover:to-[#9b7e09] text-[#fdfcf7] font-bold text-[11px] rounded-xl shrink-0 shadow transition-colors flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> Agregar
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Tab Content 2: Smart Pairing */}
          {activeTab === 'pairing' && product.pairing && (
            <div className="space-y-3 animate-in fade-in duration-150">
              <div className="p-4 rounded-2xl bg-[#242017] border border-[#383324] space-y-3">
                <div className="flex items-center gap-2 text-[#b8960e] font-extrabold text-xs">
                  <Wine className="w-4 h-4" />
                  <span>RECOMENDACIÓN DEL SOMMELIER</span>
                </div>
                
                <div className="flex items-start gap-3.5">
                  <div className="w-20 h-20 rounded-2xl overflow-hidden bg-[#110f0a] shrink-0 border border-[#9b7e09]/40 shadow-md">
                    <img src={product.pairing.image} alt={product.pairing.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-extrabold text-sm text-[#fdfcf7]">{product.pairing.name}</h4>
                    <p className="text-[11px] text-[#aba489] leading-relaxed">{product.pairing.description}</p>
                    <span className="text-sm font-black text-[#9b7e09] block pt-1">{formatCOP(product.pairing.price)}</span>
                  </div>
                </div>

                <button
                  onClick={() => setIncludePairing(!includePairing)}
                  className={`w-full py-2.5 rounded-xl font-extrabold text-xs flex items-center justify-center gap-2 transition-all ${
                    includePairing
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500 font-bold'
                      : 'bg-gradient-to-r from-[#9b7e09] to-[#b8960e] text-[#fdfcf7] shadow-lg'
                  }`}
                >
                  {includePairing ? (
                    <>
                      <Check className="w-4 h-4" /> Maridaje incluido en tu orden
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" /> Incluir este Maridaje (+{formatCOP(product.pairing.price)})
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Tab Content 3: Ingredients & Chef Notes */}
          {activeTab === 'ingredients' && (
            <div className="space-y-3 animate-in fade-in duration-150 text-xs">
              {product.chefNotes && (
                <div className="p-3.5 rounded-2xl bg-[#9b7e09]/10 border border-[#9b7e09]/30 text-[#e9e2ca] space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-[#b8960e]">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Nota del Chef Ejecutivo</span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-[#aba489]">{product.chefNotes}</p>
                </div>
              )}

              <div className="p-3.5 rounded-2xl bg-[#14120c]/80 border border-[#383324] space-y-2">
                <h4 className="font-bold text-[#e9e2ca] uppercase tracking-wider text-[10px]">
                  Ingredientes Principales
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {product.ingredients?.map(ing => (
                    <span
                      key={ing}
                      className="px-2.5 py-1 rounded-lg bg-[#242017] border border-[#383324] text-[11px] text-[#e9e2ca] font-medium"
                    >
                      {ing}
                    </span>
                  )) || <span className="text-[#857f5d]">Ingredientes de temporada.</span>}
                </div>
              </div>

              {product.spicyLevel > 0 && (
                <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-between text-rose-300">
                  <span className="font-bold text-[11px]">Nivel de Picante:</span>
                  <span className="font-black text-xs">
                    {'🌶️'.repeat(product.spicyLevel)} {product.spicyLevel === 1 ? 'Suave' : product.spicyLevel === 2 ? 'Medio' : 'Intenso'}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer & Quantity Stepper */}
        <div className="p-4 sm:p-5 border-t border-[#383324] bg-[#14120c]/95 backdrop-blur-md space-y-3 shrink-0">
          {product.soldOut ? (
            <button
              disabled
              className="w-full py-3.5 bg-[#383324] text-[#857f5d] font-black text-xs sm:text-sm rounded-2xl cursor-not-allowed flex justify-center items-center gap-2"
            >
              <PackageX className="w-4 h-4" /> No Disponible por Agotamiento
            </button>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#aba489]">Porciones / Cantidad:</span>
                <div className="flex items-center space-x-3 bg-[#1e1b13] px-3 py-1.5 rounded-xl border border-[#383324]">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="text-[#857f5d] hover:text-[#fdfcf7] font-bold p-1 transition-colors"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-sm font-black text-[#fdfcf7] min-w-[24px] text-center">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="text-[#857f5d] hover:text-[#fdfcf7] font-bold p-1 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <button
                onClick={handleAddMainAndPairing}
                className="w-full py-3.5 bg-gradient-to-r from-[#9b7e09] to-[#b8960e] hover:from-[#b8960e] hover:to-[#9b7e09] active:scale-98 text-[#fdfcf7] font-black text-xs sm:text-sm rounded-2xl shadow-xl shadow-[#9b7e09]/25 transition-all flex justify-between px-5 items-center"
              >
                <span>
                  {includePairing ? 'Agregar Platillo + Maridaje' : 'Agregar al Pedido'}
                </span>
                <span className="bg-[#110f0a]/40 px-2.5 py-1 rounded-xl text-xs sm:text-sm font-black">
                  {formatCOP(calculateTotal())}
                </span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
