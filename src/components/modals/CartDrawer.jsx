import React from 'react';
import { ShoppingBag, X, Plus, Minus } from 'lucide-react';
import { formatCOP } from '../../lib/dian';

export default function CartDrawer({
  cart,
  setCart,
  tableNumber,
  includeTip,
  setIncludeTip,
  onClose,
  submitOrder
}) {
  const subtotal = cart.reduce((sum, item) => sum + item.totalPrice, 0);
  const total = subtotal + (includeTip ? subtotal * 0.10 : 0);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex justify-end animate-in fade-in duration-200">
      <div className="bg-slate-900 border-t sm:border-t-0 sm:border-l border-slate-800 w-full sm:max-w-md h-[90vh] sm:h-full mt-auto sm:mt-0 rounded-t-3xl sm:rounded-none flex flex-col justify-between p-4 sm:p-5 shadow-2xl">
        <div className="space-y-4 overflow-y-auto hide-scrollbar flex-1 pr-1">
          <div className="flex justify-between items-center border-b border-slate-800 pb-3">
            <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-orange-500" /> Tu Pedido (Mesa {tableNumber})
            </h3>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-2.5">
            {cart.map((item, idx) => (
              <div key={idx} className="bg-slate-950 p-3 rounded-2xl border border-slate-800/80 flex justify-between items-start gap-3">
                <div className="space-y-1">
                  <h4 className="font-bold text-xs text-white">{item.product.name}</h4>
                  <p className="text-[11px] text-slate-400">{item.optionsText}</p>
                  <span className="text-xs font-black text-orange-500">{formatCOP(item.totalPrice)}</span>
                </div>
                <div className="flex items-center space-x-2 bg-slate-900 px-2 py-1 rounded-xl border border-slate-800 shrink-0">
                  <button
                    onClick={() => {
                      const newCart = [...cart];
                      newCart[idx].quantity -= 1;
                      if (newCart[idx].quantity <= 0) {
                        newCart.splice(idx, 1);
                      } else {
                        newCart[idx].totalPrice = (newCart[idx].totalPrice / (newCart[idx].quantity + 1)) * newCart[idx].quantity;
                      }
                      setCart(newCart);
                    }}
                    className="text-xs text-slate-400 hover:text-white font-bold p-1"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="text-xs font-bold text-white min-w-[14px] text-center">{item.quantity}</span>
                  <button
                    onClick={() => {
                      const newCart = [...cart];
                      const unitPrice = newCart[idx].totalPrice / newCart[idx].quantity;
                      newCart[idx].quantity += 1;
                      newCart[idx].totalPrice = unitPrice * newCart[idx].quantity;
                      setCart(newCart);
                    }}
                    className="text-xs text-slate-400 hover:text-white font-bold p-1"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
            {!cart.length && (
              <div className="py-12 text-center text-slate-500 text-xs">
                No has agregado platillos a tu pedido.
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-slate-800 pt-3 space-y-3 shrink-0">
          <div className="space-y-1 text-xs">
            <div className="flex justify-between text-slate-400">
              <span>Subtotal:</span>
              <span>{formatCOP(subtotal)}</span>
            </div>
            <div className="flex justify-between items-center text-slate-400">
              <label className="flex items-center gap-1.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={includeTip}
                  onChange={(e) => setIncludeTip(e.target.checked)}
                  className="accent-orange-500 rounded"
                />
                <span>Propina Voluntaria (10%):</span>
              </label>
              <span>{formatCOP(includeTip ? subtotal * 0.10 : 0)}</span>
            </div>
            <div className="flex justify-between text-base font-black text-white pt-2 border-t border-slate-800">
              <span>Total:</span>
              <span className="text-orange-500">{formatCOP(total)}</span>
            </div>
          </div>

          <button
            onClick={submitOrder}
            disabled={!cart.length}
            className={`w-full py-3 bg-orange-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 ${!cart.length ? 'opacity-50 cursor-not-allowed' : 'hover:bg-orange-600 active:scale-95 shadow-orange-500/20'}`}
          >
            Enviar Pedido a Cocina
          </button>
        </div>
      </div>
    </div>
  );
}
