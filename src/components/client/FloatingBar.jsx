import { formatCOP } from '../../lib/money';
import { cartSubtotal, cartCount } from '../../lib/pricing';

/** Barra fija al pie: aparece cuando hay algo en el pedido. */
export default function FloatingClientBar({ cart = [], onOpenCart, mode = 'order' }) {
  if (mode !== 'order') {
    return (
      <div className="fixed bottom-0 inset-x-0 z-40 bg-mantel/95 backdrop-blur border-t border-linea px-4 py-3 text-center text-sm text-suave">
        Carta de consulta: haz tu pedido con el mesero.
      </div>
    );
  }

  const count = cartCount(cart);
  if (!count) return null;

  return (
    <div className="fixed bottom-0 inset-x-0 z-40 px-4 pb-4 pt-2 sm:pb-6 pointer-events-none">
      <button
        onClick={onOpenCart}
        className="pointer-events-auto mx-auto w-full max-w-md h-14 rounded-full bg-tinta text-mantel flex items-center justify-between px-6 font-bold animate-sheet"
      >
        <span>
          Ver pedido <span className="font-normal opacity-80">· {count} {count === 1 ? 'plato' : 'platos'}</span>
        </span>
        <span className="precio">{formatCOP(cartSubtotal(cart))}</span>
      </button>
    </div>
  );
}
