import { ShoppingBag } from 'lucide-react';
import { formatCOP, computeTip } from '../../lib/money';
import { cartSubtotal, cartCount } from '../../lib/pricing';

export default function FloatingClientBar({ cart = [], includeTip = false, tipRate = 10, onOpenCart, mode = 'order', tableLabel }) {
  if (mode !== 'order') {
    return (
      <div className="fixed bottom-3 inset-x-3 sm:inset-x-auto sm:right-6 sm:bottom-6 z-40 max-w-sm mx-auto sm:mx-0 animate-fadeIn">
        <div className="bg-brand-panel/95 backdrop-blur-xl border border-brand-line py-2.5 px-3.5 rounded-2xl shadow-2xl flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-brand-cream min-w-0">
            <span className="relative flex h-2 w-2 shrink-0" aria-hidden="true">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
            </span>
            <span className="font-bold shrink-0">{tableLabel ? `Mesa ${tableLabel}` : 'Carta digital'}</span>
          </div>
          <span className="text-[10px] bg-brand-gold/20 text-brand-gold-light font-black px-2 py-0.5 rounded-lg border border-brand-gold/30 shrink-0">
            Solo consulta
          </span>
        </div>
      </div>
    );
  }

  const count = cartCount(cart);
  const subtotal = cartSubtotal(cart);
  const total = subtotal + (includeTip ? computeTip(subtotal, tipRate) : 0);

  return (
    <div className="fixed bottom-3 inset-x-3 sm:inset-x-auto sm:right-6 sm:bottom-6 z-40 max-w-lg mx-auto sm:mx-0">
      <div className={`bg-brand-panel/95 backdrop-blur-xl border p-2 sm:p-2.5 rounded-2xl shadow-2xl ${count > 0 ? 'border-brand-gold/60 shadow-brand-gold/20 ring-1 ring-brand-gold/30' : 'border-brand-line'}`}>
        <button
          onClick={onOpenCart}
          className={`w-full py-2.5 px-3 sm:px-4 rounded-xl font-extrabold flex items-center justify-between gap-2 transition-all ${
            count > 0
              ? 'bg-gradient-to-r from-brand-gold to-brand-gold-light active:scale-95 text-brand-ivory shadow-lg shadow-brand-gold/30'
              : 'bg-brand-raised hover:bg-brand-line active:scale-95 text-brand-khaki'
          }`}
        >
          <span className="flex items-center gap-2 min-w-0">
            <span className="relative shrink-0">
              <ShoppingBag className="w-4 h-4" aria-hidden="true" />
              {count > 0 && (
                <span className="absolute -top-2 -right-2 bg-brand-ivory text-brand-gold text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow-md">
                  {count}
                </span>
              )}
            </span>
            <span className="text-xs truncate">
              {count > 0 ? 'Ver mi pedido' : 'Pedido vacío'}
              {tableLabel ? ` · Mesa ${tableLabel}` : ''}
            </span>
          </span>
          <span className={`px-2 py-0.5 rounded-lg text-xs font-black shrink-0 ${count > 0 ? 'bg-brand-dark/40' : 'bg-brand-night'}`}>
            {formatCOP(total)}
          </span>
        </button>
      </div>
    </div>
  );
}
