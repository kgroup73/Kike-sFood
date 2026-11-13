import { useState } from 'react';
import { X, Plus, Minus, Check, Heart, Star, Clock, Flame, ChefHat, Leaf, WheatOff } from 'lucide-react';
import Sheet from './Sheet';
import DishImage from './DishImage';
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
  orderHint = 'Pide este plato directamente a tu mesero.'
}) {
  const [quantity, setQuantity] = useState(1);
  const [selections, setSelections] = useState({});
  const [includePairing, setIncludePairing] = useState(false);

  // El maridaje es otro producto de la carta: precio e imagen siempre los del catálogo.
  const pairingProduct = product.pairing
    ? allProducts.find((p) => p.id === product.pairing.productId && p.available !== false && !p.soldOut) || null
    : null;
  const pairingDescription = product.pairing?.description || pairingProduct?.description || '';
  const pairingNeedsOptions = pairingProduct?.modifiers?.some((m) => m.required);
  const canAddPairing = canOrder && pairingProduct && !pairingNeedsOptions;

  const { ok: selectionsOk, errors } = validateSelections(product, selections);
  const unitPrice = unitPriceFor(product, selections);
  const total = unitPrice * quantity + (includePairing && pairingProduct ? pairingProduct.price * quantity : 0);

  const handleAdd = () => {
    if (!selectionsOk) return;
    onAddToCart(product, selections, quantity);
    if (includePairing && canAddPairing) onAddToCart(pairingProduct, {}, quantity);
    onClose();
  };

  const facts = [
    product.rating && { icon: Star, text: `${product.rating}${product.reviewsCount ? ` (${product.reviewsCount})` : ''}` },
    product.prepTime && { icon: Clock, text: product.prepTime },
    product.calories && { icon: Flame, text: product.calories }
  ].filter(Boolean);
  const tags = [
    product.isChef && { icon: ChefHat, label: 'Receta del chef' },
    product.isPopular && { icon: Star, label: 'Más pedido' },
    product.isVeg && { icon: Leaf, label: 'Vegano' },
    product.isGf && { icon: WheatOff, label: 'Sin gluten' },
    (product.spicyLevel > 0 || product.isSpicy) && { icon: Flame, label: 'Picante', tone: 'text-aji' }
  ].filter(Boolean);

  const media = (
    <div className="relative">
      <DishImage src={product.image} alt={product.name} className="h-56 sm:h-64" imgClassName={product.soldOut ? 'grayscale' : ''} />
      <div className="absolute top-3 right-3 flex gap-2">
        {onToggleFavorite && (
          <button
            onClick={() => onToggleFavorite(product.id)}
            aria-label={isFavorite ? 'Quitar de favoritos' : 'Guardar en favoritos'}
            aria-pressed={isFavorite}
            className="w-10 h-10 rounded-full bg-plato/95 text-tinta flex items-center justify-center"
          >
            <Heart className={`w-5 h-5 ${isFavorite ? 'fill-aji text-aji' : ''}`} aria-hidden="true" />
          </button>
        )}
        <button onClick={onClose} aria-label="Cerrar" className="w-10 h-10 rounded-full bg-plato/95 text-tinta flex items-center justify-center">
          <X className="w-5 h-5" aria-hidden="true" />
        </button>
      </div>
    </div>
  );

  let footer;
  if (product.soldOut) {
    footer = (
      <p className="text-center font-bold text-aji py-2">
        Agotado hoy. La cocina avisará cuando vuelva.
      </p>
    );
  } else if (!canOrder) {
    footer = (
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-suave">{orderHint}</p>
        <span className="precio font-bold text-lg shrink-0">{formatCOP(total)}</span>
      </div>
    );
  } else {
    footer = (
      <div className="space-y-2">
        {!selectionsOk && (
          <p className="text-sm text-aji text-center" role="alert">
            {errors[0]}
          </p>
        )}
        <div className="flex items-center gap-3">
          <div className="flex items-center rounded-full border border-linea h-12 shrink-0">
            <button
              aria-label="Disminuir cantidad"
              onClick={() => setQuantity(clampQuantity(quantity - 1))}
              disabled={quantity <= 1}
              className="w-11 h-full flex items-center justify-center disabled:text-linea"
            >
              <Minus className="w-4 h-4" aria-hidden="true" />
            </button>
            <span className="precio font-bold w-6 text-center" aria-live="polite">
              {quantity}
            </span>
            <button aria-label="Aumentar cantidad" onClick={() => setQuantity(clampQuantity(quantity + 1))} className="w-11 h-full flex items-center justify-center">
              <Plus className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
          <button
            onClick={handleAdd}
            disabled={!selectionsOk}
            aria-label={`Agregar al pedido, ${formatCOP(total)}`}
            className="flex-1 min-w-0 h-12 rounded-full bg-hoja text-sobre-hoja font-bold flex items-center justify-between gap-2 px-5 whitespace-nowrap disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <span>Agregar</span>
            <span className="precio">{formatCOP(total)}</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <Sheet title={product.name} onClose={onClose} media={media} footer={footer}>
      <div className="-mt-3 space-y-3">
        <p className="precio text-lg font-bold">{formatCOP(product.price)}</p>
        {(facts.length > 0 || tags.length > 0) && (
          <ul className="flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-suave">
            {[...tags, ...facts.map((f) => ({ ...f, label: f.text }))].map(({ icon: Icon, label, tone }) => (
              <li key={label} className={`flex items-center gap-1.5 ${tone || ''}`}>
                <Icon className="w-4 h-4" aria-hidden="true" /> {label}
              </li>
            ))}
          </ul>
        )}
        {product.description && <p className="text-base leading-relaxed">{product.description}</p>}
      </div>

      {product.soldOut && product.soldOutInfo?.missingIngredients?.length > 0 && (
        <p className="text-sm text-suave">Falta en cocina: {product.soldOutInfo.missingIngredients.join(', ')}.</p>
      )}

      {/* Opciones */}
      {product.modifiers?.map((mod) => (
        <fieldset key={mod.title} className="space-y-2">
          <legend className="w-full flex items-baseline justify-between gap-3 mb-2">
            <span className="font-display font-bold text-lg">{mod.title}</span>
            <span className={`text-sm ${mod.required ? 'font-bold text-tinta' : 'text-suave'}`}>
              {mod.required ? 'Elige una' : 'Opcional'}
            </span>
          </legend>
          <div className="rounded-2xl border border-linea divide-y divide-linea overflow-hidden">
            {mod.options.map((opt) => {
              const isSelected = selections[mod.title] === opt.name;
              return (
                <label
                  key={opt.name}
                  className={`flex items-center justify-between gap-3 px-4 min-h-[52px] cursor-pointer ${isSelected ? 'bg-hoja/10' : 'hover:bg-mantel'}`}
                >
                  <span className="flex items-center gap-3">
                    <input
                      type="radio"
                      name={mod.title}
                      checked={isSelected}
                      onChange={() => setSelections({ ...selections, [mod.title]: opt.name })}
                      className="w-5 h-5 accent-[rgb(var(--c-hoja))]"
                    />
                    <span className={isSelected ? 'font-bold' : ''}>{opt.name}</span>
                  </span>
                  {opt.price > 0 && <span className="precio text-suave">+{formatCOP(opt.price)}</span>}
                </label>
              );
            })}
          </div>
        </fieldset>
      ))}

      {/* Maridaje */}
      {pairingProduct && (
        <section className="space-y-2">
          <h3 className="font-display font-bold text-lg">Va bien con</h3>
          <div className="flex gap-3 items-start rounded-2xl border border-linea p-3">
            <DishImage src={pairingProduct.image} className="w-16 h-16 rounded-xl shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-bold leading-snug">{pairingProduct.name}</p>
              {pairingDescription && <p className="text-sm text-suave leading-relaxed mt-0.5">{pairingDescription}</p>}
              <p className="precio text-sm font-bold mt-1">{formatCOP(pairingProduct.price)}</p>
            </div>
            {canAddPairing && (
              <button
                onClick={() => setIncludePairing(!includePairing)}
                aria-pressed={includePairing}
                className={`shrink-0 h-10 px-4 rounded-full text-sm font-bold flex items-center gap-1.5 border ${
                  includePairing ? 'bg-hoja border-hoja text-sobre-hoja' : 'border-tinta'
                }`}
              >
                {includePairing ? <Check className="w-4 h-4" aria-hidden="true" /> : <Plus className="w-4 h-4" aria-hidden="true" />}
                {includePairing ? 'Añadido' : 'Añadir'}
              </button>
            )}
          </div>
        </section>
      )}

      {/* Nota del chef e ingredientes */}
      {product.chefNotes && (
        <blockquote className="border-l-4 border-hoja pl-4 py-1">
          <p className="italic leading-relaxed">{product.chefNotes}</p>
          <footer className="text-sm text-suave mt-1">Nota del chef</footer>
        </blockquote>
      )}
      {product.ingredients?.length > 0 && (
        <p className="text-sm text-suave leading-relaxed">
          <span className="font-bold text-tinta">Ingredientes: </span>
          {product.ingredients.join(', ')}.
        </p>
      )}
    </Sheet>
  );
}
