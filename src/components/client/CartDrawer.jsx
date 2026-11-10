import { Plus, Minus, Loader2 } from 'lucide-react';
import Sheet from './Sheet';
import { formatCOP } from '../../lib/money';
import { cartSubtotal } from '../../lib/pricing';

/** El pedido de la mesa antes de enviarlo a cocina. La propina se define al pagar, en caja. */
export default function CartDrawer({ cart, tableLabel, onChangeQuantity, onClose, onSubmit, submitting = false, blockedReason = '' }) {
  const subtotal = cartSubtotal(cart);

  const footer = (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between">
        <span className="font-bold">Total del pedido</span>
        <span className="precio font-bold text-xl" data-testid="cart-total">
          {formatCOP(subtotal)}
        </span>
      </div>
      <p className="text-sm text-suave">Impuestos incluidos. La propina es voluntaria y la defines al pagar.</p>
      {blockedReason && (
        <p className="text-sm font-bold text-aji" role="alert">
          {blockedReason}
        </p>
      )}
      <button
        onClick={onSubmit}
        disabled={!cart.length || submitting || !!blockedReason}
        className="w-full h-12 rounded-full bg-hoja text-sobre-hoja font-bold flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {submitting && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
        {submitting ? 'Enviando…' : 'Enviar pedido a cocina'}
      </button>
    </div>
  );

  return (
    <Sheet title="Tu pedido" onClose={onClose} footer={footer}>
      {tableLabel && <p className="-mt-4 text-suave">Mesa {tableLabel}</p>}
      {cart.length ? (
        <ul className="divide-y divide-linea -my-3">
          {cart.map((item) => (
            <li key={item.key} className="py-4 flex items-start gap-4">
              <div className="flex-1 min-w-0">
                <p className="font-bold leading-snug">{item.name}</p>
                {item.optionsText && <p className="text-sm text-suave mt-0.5">{item.optionsText}</p>}
                <p className="precio text-sm mt-1">{formatCOP(item.unitPrice * item.quantity)}</p>
              </div>
              <div className="flex items-center rounded-full border border-linea h-10 shrink-0">
                <button
                  onClick={() => onChangeQuantity(item.key, item.quantity - 1)}
                  aria-label={item.quantity === 1 ? `Quitar ${item.name} del pedido` : `Quitar una unidad de ${item.name}`}
                  className="w-10 h-full flex items-center justify-center"
                >
                  <Minus className="w-4 h-4" aria-hidden="true" />
                </button>
                <span className="precio font-bold w-5 text-center" aria-live="polite">
                  {item.quantity}
                </span>
                <button
                  onClick={() => onChangeQuantity(item.key, item.quantity + 1)}
                  aria-label={`Agregar una unidad de ${item.name}`}
                  className="w-10 h-full flex items-center justify-center"
                >
                  <Plus className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="py-8 text-center text-suave">Todavía no has agregado platos. Toca uno de la carta para verlo y pedirlo.</p>
      )}
    </Sheet>
  );
}
