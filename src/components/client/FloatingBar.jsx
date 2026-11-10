import { BellRing, Check } from 'lucide-react';
import { formatCOP } from '../../lib/money';
import { cartSubtotal, cartCount } from '../../lib/pricing';

/**
 * Barra fija al pie. Con pedidos: el botón del pedido cuando hay algo. Con llamado al
 * mesero: el botón de llamar, siempre a mano. `waiter` = 'idle' | 'sending' | 'called'.
 */
export default function FloatingClientBar({ cart = [], onOpenCart, mode = 'order', onCallWaiter, waiter = 'idle' }) {
  const count = cartCount(cart);

  if (mode !== 'order' && !onCallWaiter) {
    return (
      <div className="fixed bottom-0 inset-x-0 z-40 bg-mantel/95 backdrop-blur border-t border-linea px-4 py-3 text-center text-sm text-suave">
        Carta de consulta: haz tu pedido con el mesero.
      </div>
    );
  }
  const showCart = mode === 'order' && count > 0;
  if (!showCart && !onCallWaiter) return null;

  const called = waiter === 'called';
  const callLabel = called ? 'Mesero avisado' : waiter === 'sending' ? 'Avisando…' : 'Llamar al mesero';

  return (
    <div className="fixed bottom-0 inset-x-0 z-40 px-4 pb-4 pt-2 sm:pb-6 pointer-events-none">
      <div className="mx-auto w-full max-w-md flex items-center justify-center gap-2">
        {onCallWaiter && (
          <button
            onClick={onCallWaiter}
            disabled={waiter !== 'idle'}
            aria-label={callLabel}
            title={callLabel}
            className={`pointer-events-auto h-14 rounded-full font-bold flex items-center justify-center gap-2 shadow-lg border transition-colors animate-sheet ${
              showCart ? 'w-14 shrink-0' : 'px-6'
            } ${called ? 'bg-hoja text-sobre-hoja border-hoja' : 'bg-plato text-tinta border-linea hover:border-tinta'}`}
          >
            {called ? <Check className="w-5 h-5" aria-hidden="true" /> : <BellRing className="w-5 h-5" aria-hidden="true" />}
            {!showCart && <span>{callLabel}</span>}
          </button>
        )}
        {showCart && (
          <button
            onClick={onOpenCart}
            className="pointer-events-auto flex-1 h-14 rounded-full bg-tinta text-mantel flex items-center justify-between px-6 font-bold animate-sheet"
          >
            <span>
              Ver pedido <span className="font-normal opacity-80">· {count} {count === 1 ? 'plato' : 'platos'}</span>
            </span>
            <span className="precio">{formatCOP(cartSubtotal(cart))}</span>
          </button>
        )}
      </div>
    </div>
  );
}
