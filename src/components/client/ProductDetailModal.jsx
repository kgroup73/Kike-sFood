import { useState } from 'react';
import {
  X,
  Plus,
  Minus,
  Sparkles,
  Flame,
  Clock,
  Star,
  Wine,
  Info,
  Check,
  Heart,
  ChefHat,
  Leaf,
  PackageX
} from 'lucide-react';
import { formatCOP } from '../../lib/money';
import { validateSelections, unitPriceFor, clampQuantity } from '../../lib/pricing';

/**
 * Detalle del platillo. Un modificador por grupo; los obligatorios se exigen
 * antes de agregar (el servidor también lo valida).
 */
export default function ProductDetailModal({
  product,
  onClose,
  onAddToCart,
  isFavorite = false,
  onToggleFavorite,
  allProducts = [],
  canOrder = true,
  orderHint = 'Pide este platillo directamente a tu mesero'
}) {
  const [quantity, setQuantity] = useState(1);
  const [selections, setSelections] = useState({});
  const [activeTab, setActiveTab] = useState('customize'); // 'customize' | 'pairing' | 'ingredients'
  const [includePairing, setIncludePairing] = useState(false);

  // El maridaje es otro producto de la carta: precio e imagen siempre los del catálogo.
  const pairingProduct = product.pairing
    ? allProducts.find(p => p.id === product.pairing.productId && p.available !== false && !p.soldOut) || null
    : null;
  const pairingDescription = product.pairing?.description || pairingProduct?.description || '';
  const pairingNeedsOptions = pairingProduct?.modifiers?.some(m => m.required);

  const { ok: selectionsOk, errors } = validateSelections(product, selections);
  const unitPrice = unitPriceFor(product, selections);
  const mainTotal = unitPrice * quantity;
  const total = mainTotal + (includePairing && pairingProduct ? pairingProduct.price * quantity : 0);

  const handleAdd = () => {
    if (!selectionsOk) return;
    onAddToCart(product, selections, quantity);
    if (includePairing && pairingProduct && !pairingNeedsOptions) {
      onAddToCart(pairingProduct, {}, quantity);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-brand-night/85 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-brand-panel border border-brand-line rounded-t-3xl sm:rounded-3xl max-w-lg w-full max-h-[92vh] sm:max-h-[85vh] overflow-y-auto hide-scrollbar shadow-2xl flex flex-col justify-between text-brand-ivory">
        
        {/* Top Hero Image Banner */}
        <div className="relative h-44 sm:h-52 bg-brand-dark shrink-0 overflow-hidden">
          <img
            src={product.image}
            alt={product.name}
            className={`w-full h-full object-cover transition-transform duration-500 hover:scale-105 ${product.soldOut ? 'grayscale opacity-70' : ''}`}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-brand-panel via-transparent to-black/40" />

          {/* Floating Badges */}
          <div className="absolute top-3.5 left-3.5 flex flex-wrap gap-1.5 z-10">
            {product.soldOut && (
              <span className="bg-rose-600 text-white text-[10px] font-extrabold px-2.5 py-0.5 rounded-full shadow-lg flex items-center gap-1">
                <PackageX className="w-3 h-3" /> Agotado
              </span>
            )}
            {product.isChef && (
              <span className="bg-brand-gold text-brand-ivory text-[10px] font-extrabold px-2.5 py-0.5 rounded-full shadow-lg flex items-center gap-1">
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
                    : 'bg-brand-dark/70 text-brand-khaki border-white/10 hover:bg-brand-surface hover:text-white'
                }`}
                title="Favorito"
                aria-label={isFavorite ? 'Quitar de favoritos' : 'Guardar en favoritos'}
                aria-pressed={isFavorite}
              >
                <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
              </button>
            )}
            <button
              onClick={onClose}
              aria-label="Cerrar"
              className="w-9 h-9 bg-brand-dark/70 hover:bg-brand-surface text-brand-ivory rounded-full flex items-center justify-center backdrop-blur-md border border-white/10 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Sensory Info Pill Overlay */}
          <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2 bg-brand-dark/85 backdrop-blur-md px-3 py-1.5 rounded-xl border border-brand-line text-brand-ivory font-medium">
              {product.rating && (
                <span className="text-brand-gold-light font-black flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 fill-current" /> {product.rating}
                  <span className="text-brand-khaki text-[10px]">({product.reviewsCount || 80})</span>
                </span>
              )}
              {product.prepTime && (
                <>
                  <span className="text-brand-khaki">•</span>
                  <span className="text-brand-mute flex items-center gap-1 text-[11px]">
                    <Clock className="w-3 h-3 text-brand-gold-light" /> {product.prepTime}
                  </span>
                </>
              )}
              {product.calories && (
                <>
                  <span className="text-brand-khaki">•</span>
                  <span className="text-brand-mute flex items-center gap-1 text-[11px]">
                    <Flame className="w-3 h-3 text-rose-400" /> {product.calories}
                  </span>
                </>
              )}
            </div>
            <span className="text-lg font-black text-brand-gold bg-brand-dark/90 backdrop-blur-md px-3 py-1 rounded-xl border border-brand-gold/30">
              {formatCOP(product.price)}
            </span>
          </div>
        </div>

        {/* Modal Body & Interactive Tabs */}
        <div className="p-4 sm:p-5 space-y-4 flex-1">
          <div>
            <h3 className="text-lg sm:text-xl font-extrabold text-brand-ivory">{product.name}</h3>
            <p className="text-xs text-brand-mute mt-1 leading-relaxed">{product.description}</p>
          </div>

          {/* Aviso de agotamiento (Inventario en tiempo real) */}
          {product.soldOut && (
            <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-2.5">
              <PackageX className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <p className="text-xs font-bold text-rose-300">Producto agotado</p>
                <p className="text-[11px] text-brand-mute leading-relaxed">
                  La cocina reportó falta de insumos{product.soldOutInfo?.missingIngredients?.length ? ` (${product.soldOutInfo.missingIngredients.join(', ')})` : ''}.
                  No está disponible para pedir en este momento.
                </p>
              </div>
            </div>
          )}

          {/* Interactive Navigation Tabs */}
          <div className="flex items-center space-x-1.5 p-1 bg-brand-night rounded-xl border border-brand-line text-xs font-semibold">
            <button
              onClick={() => setActiveTab('customize')}
              className={`flex-1 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'customize'
                  ? 'bg-gradient-to-r from-brand-gold to-brand-gold-light text-brand-ivory shadow-md'
                  : 'text-brand-khaki hover:text-brand-ivory'
              }`}
            >
              <span>Personalizar</span>
            </button>
            {pairingProduct && (
              <button
                onClick={() => setActiveTab('pairing')}
                className={`flex-1 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 relative ${
                  activeTab === 'pairing'
                    ? 'bg-gradient-to-r from-brand-gold to-brand-gold-light text-brand-ivory shadow-md'
                    : 'text-brand-khaki hover:text-brand-ivory'
                }`}
              >
                <Wine className="w-3.5 h-3.5" />
                <span>Maridaje</span>
                <span className="w-1.5 h-1.5 rounded-full bg-brand-gold-light animate-ping absolute -top-0.5 -right-0.5" />
              </button>
            )}
            <button
              onClick={() => setActiveTab('ingredients')}
              className={`flex-1 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'ingredients'
                  ? 'bg-gradient-to-r from-brand-gold to-brand-gold-light text-brand-ivory shadow-md'
                  : 'text-brand-khaki hover:text-brand-ivory'
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
                      <h4 className="text-xs font-bold text-brand-gold-light uppercase tracking-wider">
                        {mod.title}
                      </h4>
                      {mod.required && (
                        <span className="text-[10px] text-brand-gold font-bold bg-brand-gold/10 px-2 py-0.5 rounded-md border border-brand-gold/30">
                          Requerido
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-1 gap-1.5">
                      {mod.options.map(opt => {
                        const isSelected = selections[mod.title] === opt.name;
                        return (
                          <label
                            key={opt.name}
                            className={`flex justify-between items-center p-3 rounded-xl cursor-pointer text-xs transition-all border ${
                              isSelected
                                ? 'bg-brand-gold/15 border-brand-gold text-brand-ivory font-bold'
                                : 'bg-brand-night/80 border-brand-line text-brand-cream hover:bg-brand-hover'
                            }`}
                          >
                            <div className="flex items-center space-x-2.5">
                              <input
                                type="radio"
                                name={mod.title}
                                checked={isSelected}
                                onChange={() => setSelections({ ...selections, [mod.title]: opt.name })}
                                className="accent-brand-gold w-4 h-4"
                              />
                              <span>{opt.name}</span>
                            </div>
                            <span className="text-xs font-bold text-brand-gold-light">
                              {opt.price > 0 ? `+${formatCOP(opt.price)}` : 'Incluido'}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-4 rounded-2xl bg-brand-night/60 border border-brand-line text-center text-brand-khaki text-xs">
                  Este platillo viene preparado según la receta maestra del chef. Sin modificaciones obligatorias.
                </div>
              )}

              {/* Quick Suggestion Box inside Customize Tab */}
              {pairingProduct && !pairingNeedsOptions && !includePairing && canOrder && (
                <div className="p-3 rounded-2xl bg-brand-hover border border-brand-line flex items-center justify-between gap-3">
                  <div className="flex items-center space-x-2.5 min-w-0">
                    <div className="w-10 h-10 rounded-xl overflow-hidden bg-brand-dark shrink-0 border border-brand-line">
                      <img src={pairingProduct.image} alt={pairingProduct.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] font-bold text-brand-gold-light flex items-center gap-1 uppercase tracking-wide">
                        <Wine className="w-3 h-3" /> Maridaje Sugerido
                      </span>
                      <p className="text-xs font-bold text-brand-ivory truncate">{pairingProduct.name}</p>
                      <span className="text-[11px] text-brand-gold font-extrabold">{formatCOP(pairingProduct.price)}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => setIncludePairing(true)}
                    className="px-3 py-1.5 bg-gradient-to-r from-brand-gold to-brand-gold-light hover:from-brand-gold-light hover:to-brand-gold text-brand-ivory font-bold text-[11px] rounded-xl shrink-0 shadow transition-colors flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> Agregar
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Tab Content 2: Smart Pairing */}
          {activeTab === 'pairing' && pairingProduct && (
            <div className="space-y-3 animate-fadeIn">
              <div className="p-4 rounded-2xl bg-brand-hover border border-brand-line space-y-3">
                <div className="flex items-center gap-2 text-brand-gold-light font-extrabold text-xs">
                  <Wine className="w-4 h-4" />
                  <span>RECOMENDACIÓN DEL SOMMELIER</span>
                </div>
                
                <div className="flex items-start gap-3.5">
                  <div className="w-20 h-20 rounded-2xl overflow-hidden bg-brand-dark shrink-0 border border-brand-gold/40 shadow-md">
                    <img src={pairingProduct.image} alt={pairingProduct.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-extrabold text-sm text-brand-ivory">{pairingProduct.name}</h4>
                    <p className="text-[11px] text-brand-mute leading-relaxed">{pairingDescription}</p>
                    <span className="text-sm font-black text-brand-gold block pt-1">{formatCOP(pairingProduct.price)}</span>
                  </div>
                </div>

                {canOrder && !pairingNeedsOptions && <button
                  onClick={() => setIncludePairing(!includePairing)}
                  className={`w-full py-2.5 rounded-xl font-extrabold text-xs flex items-center justify-center gap-2 transition-all ${
                    includePairing
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500 font-bold'
                      : 'bg-gradient-to-r from-brand-gold to-brand-gold-light text-brand-ivory shadow-lg'
                  }`}
                >
                  {includePairing ? (
                    <>
                      <Check className="w-4 h-4" /> Maridaje incluido en tu orden
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" /> Incluir este Maridaje (+{formatCOP(pairingProduct.price)})
                    </>
                  )}
                </button>}
              </div>
            </div>
          )}

          {/* Tab Content 3: Ingredients & Chef Notes */}
          {activeTab === 'ingredients' && (
            <div className="space-y-3 animate-fadeIn text-xs">
              {product.chefNotes && (
                <div className="p-3.5 rounded-2xl bg-brand-gold/10 border border-brand-gold/30 text-brand-cream space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-brand-gold-light">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Nota del Chef Ejecutivo</span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-brand-mute">{product.chefNotes}</p>
                </div>
              )}

              <div className="p-3.5 rounded-2xl bg-brand-night/80 border border-brand-line space-y-2">
                <h4 className="font-bold text-brand-cream uppercase tracking-wider text-[10px]">
                  Ingredientes Principales
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {product.ingredients?.map(ing => (
                    <span
                      key={ing}
                      className="px-2.5 py-1 rounded-lg bg-brand-hover border border-brand-line text-[11px] text-brand-cream font-medium"
                    >
                      {ing}
                    </span>
                  )) || <span className="text-brand-khaki">Ingredientes de temporada.</span>}
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
        <div className="p-4 sm:p-5 border-t border-brand-line bg-brand-night/95 backdrop-blur-md space-y-3 shrink-0">
          {product.soldOut ? (
            <button
              disabled
              className="w-full py-3.5 bg-brand-line text-brand-khaki font-black text-xs sm:text-sm rounded-2xl cursor-not-allowed flex justify-center items-center gap-2"
            >
              <PackageX className="w-4 h-4" /> No Disponible por Agotamiento
            </button>
          ) : !canOrder ? (
            <div className="py-3 px-4 bg-brand-panel border border-brand-line rounded-2xl flex items-center justify-between gap-2">
              <div className="min-w-0">
                <span className="text-xs font-black text-brand-cream block truncate">Carta Digital de Consulta</span>
                <span className="text-[11px] text-brand-khaki block">{orderHint}</span>
              </div>
              <span className="bg-brand-dark/80 border border-brand-line px-3 py-1.5 rounded-xl text-xs sm:text-sm font-black text-brand-gold-light shrink-0">
                {formatCOP(total)}
              </span>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-brand-mute">Porciones / Cantidad:</span>
                <div className="flex items-center space-x-3 bg-brand-panel px-3 py-1.5 rounded-xl border border-brand-line">
                  <button
                    aria-label="Disminuir cantidad"
                    onClick={() => setQuantity(clampQuantity(quantity - 1))}
                    className="text-brand-khaki hover:text-brand-ivory font-bold p-1 transition-colors"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-sm font-black text-brand-ivory min-w-[24px] text-center">{quantity}</span>
                  <button
                    aria-label="Aumentar cantidad"
                    onClick={() => setQuantity(clampQuantity(quantity + 1))}
                    className="text-brand-khaki hover:text-brand-ivory font-bold p-1 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {!selectionsOk && (
                <p className="text-[11px] text-amber-300 text-center" role="alert">{errors[0]}</p>
              )}
              <button
                onClick={handleAdd}
                disabled={!selectionsOk}
                className="disabled:opacity-50 disabled:cursor-not-allowed w-full py-3.5 bg-gradient-to-r from-brand-gold to-brand-gold-light hover:from-brand-gold-light hover:to-brand-gold active:scale-98 text-brand-ivory font-black text-xs sm:text-sm rounded-2xl shadow-xl shadow-brand-gold/25 transition-all flex justify-between px-5 items-center"
              >
                <span>
                  {includePairing ? 'Agregar Platillo + Maridaje' : 'Agregar al Pedido'}
                </span>
                <span className="bg-brand-dark/40 px-2.5 py-1 rounded-xl text-xs sm:text-sm font-black">
                  {formatCOP(total)}
                </span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
