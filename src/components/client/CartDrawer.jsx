import { useEffect } from 'react';
import { ShoppingBag, X, Plus, Minus, Loader2 } from 'lucide-react';
import { formatCOP, computeTip } from '../../lib/money';
import { cartSubtotal } from '../../lib/pricing';

export default function CartDrawer({
  cart,
  tableLabel,
  tipRate = 10,
  includeTip,
  setIncludeTip,
  onChangeQuantity,
  onClose,
  onSubmit,
  submitting = false,
  blockedReason = ''
}) {
  const subtotal = cartSubtotal(cart);
  const tip = includeTip ? computeTip(subtotal, tipRate) : 0;
  const total = subtotal + tip;

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 bg-brand-night/85 backdrop-blur-sm flex justify-end animate-fadeIn" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div role="dialog" aria-modal="true" aria-label="Tu pedido" className="bg-brand-panel border-t sm:border-t-0 sm:border-l border-brand-line w-full sm:max-w-md h-[90vh] sm:h-full mt-auto sm:mt-0 rounded-t-3xl sm:rounded-none flex flex-col justify-between p-4 sm:p-5 shadow-2xl text-brand-ivory">
        <div className="space-y-4 overflow-y-auto hide-scrollbar flex-1 pr-1">
          <div className="flex justify-between items-center border-b border-brand-line pb-3">
            <h3 className="text-sm sm:text-base font-bold flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-brand-gold-light" aria-hidden="true" />
              Tu Pedido {tableLabel ? `(Mesa ${tableLabel})` : ''}
            </h3>
            <button onClick={onClose} aria-label="Cerrar pedido" className="text-brand-khaki hover:text-brand-ivory p-1 rounded-lg hover:bg-brand-raised transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <ul className="space-y-2.5">
            {cart.map((item) => (
              <li key={item.key} className="bg-brand-night p-3 rounded-2xl border border-brand-line flex justify-between items-start gap-3">
                <div className="space-y-1 min-w-0">
                  <h4 className="font-bold text-xs">{item.name}</h4>
                  {item.optionsText && <p className="text-[11px] text-brand-khaki">{item.optionsText}</p>}
                  <span className="text-xs font-black text-brand-gold">{formatCOP(item.unitPrice * item.quantity)}</span>
                </div>
                <div className="flex items-center space-x-2 bg-brand-panel px-2 py-1 rounded-xl border border-brand-line shrink-0">
                  <button
                    onClick={() => onChangeQuantity(item.key, item.quantity - 1)}
                    aria-label={`Quitar una unidad de ${item.name}`}
                    className="text-brand-khaki hover:text-brand-ivory p-1"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="text-xs font-bold min-w-[14px] text-center" aria-live="polite">{item.quantity}</span>
                  <button
                    onClick={() => onChangeQuantity(item.key, item.quantity + 1)}
                    aria-label={`Agregar una unidad de ${item.name}`}
                    className="text-brand-khaki hover:text-brand-ivory p-1"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
          {!cart.length && <div className="py-12 text-center text-brand-khaki text-xs">No has agregado platillos a tu pedido.</div>}
        </div>

        <div className="border-t border-brand-line pt-3 space-y-3 shrink-0">
          <div className="space-y-1 text-xs">
            <div className="flex justify-between text-brand-khaki">
              <span>Subtotal (impuestos incluidos):</span>
              <span className="text-brand-cream font-bold">{formatCOP(subtotal)}</span>
            </div>
            <div className="flex justify-between items-center text-brand-khaki">
              <label className="flex items-center gap-1.5 cursor-pointer select-none">
                <input type="checkbox" checked={includeTip} onChange={(e) => setIncludeTip(e.target.checked)} className="accent-brand-gold rounded" />
                <span>Propina voluntaria ({tipRate}%):</span>
              </label>
              <span className="text-brand-cream">{formatCOP(tip)}</span>
            </div>
            <div className="flex justify-between text-base font-black pt-2 border-t border-brand-line">
              <span>Total:</span>
              <span className="text-brand-gold">{formatCOP(total)}</span>
            </div>
            <p className="text-[10px] text-brand-khaki leading-relaxed">
              La propina es voluntaria y puedes quitarla. El total final lo confirma la caja.
            </p>
          </div>

          {blockedReason && <p className="text-[11px] text-amber-300" role="alert">{blockedReason}</p>}
          <button
            onClick={onSubmit}
            disabled={!cart.length || submitting || !!blockedReason}
            className="w-full py-3.5 bg-gradient-to-r from-brand-gold to-brand-gold-light text-brand-ivory font-bold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed enabled:hover:from-brand-gold-light enabled:active:scale-95"
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
            {submitting ? 'Enviando…' : 'Enviar Pedido a Cocina'}
          </button>
        </div>
      </div>
    </div>
  );
}
