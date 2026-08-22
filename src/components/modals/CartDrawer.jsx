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
    <div className="fixed inset-0 z-50 bg-[#14120c]/85 backdrop-blur-sm flex justify-end animate-in fade-in duration-200">
      <div className="bg-[#1e1b13] border-t sm:border-t-0 sm:border-l border-[#383324] w-full sm:max-w-md h-[90vh] sm:h-full mt-auto sm:mt-0 rounded-t-3xl sm:rounded-none flex flex-col justify-between p-4 sm:p-5 shadow-2xl text-[#fdfcf7]">
        <div className="space-y-4 overflow-y-auto hide-scrollbar flex-1 pr-1">
          <div className="flex justify-between items-center border-b border-[#383324] pb-3">
            <h3 className="text-sm sm:text-base font-bold text-[#fdfcf7] flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-[#b8960e]" /> Tu Pedido (Mesa {tableNumber})
            </h3>
            <button
              onClick={onClose}
              className="text-[#857f5d] hover:text-[#fdfcf7] p-1 rounded-lg hover:bg-[#2c271d] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-2.5">
            {cart.map((item, idx) => (
              <div key={idx} className="bg-[#14120c] p-3 rounded-2xl border border-[#383324] flex justify-between items-start gap-3">
                <div className="space-y-1">
                  <h4 className="font-bold text-xs text-[#fdfcf7]">{item.product.name}</h4>
                  <p className="text-[11px] text-[#857f5d]">{item.optionsText}</p>
                  <span className="text-xs font-black text-[#9b7e09]">{formatCOP(item.totalPrice)}</span>
                </div>
                <div className="flex items-center space-x-2 bg-[#1e1b13] px-2 py-1 rounded-xl border border-[#383324] shrink-0">
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
                    className="text-xs text-[#857f5d] hover:text-[#fdfcf7] font-bold p-1"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="text-xs font-bold text-[#fdfcf7] min-w-[14px] text-center">{item.quantity}</span>
                  <button
                    onClick={() => {
                      const newCart = [...cart];
                      const unitPrice = newCart[idx].totalPrice / newCart[idx].quantity;
                      newCart[idx].quantity += 1;
                      newCart[idx].totalPrice = unitPrice * newCart[idx].quantity;
                      setCart(newCart);
                    }}
                    className="text-xs text-[#857f5d] hover:text-[#fdfcf7] font-bold p-1"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
            {!cart.length && (
              <div className="py-12 text-center text-[#857f5d] text-xs">
                No has agregado platillos a tu pedido.
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-[#383324] pt-3 space-y-3 shrink-0">
          <div className="space-y-1 text-xs">
            <div className="flex justify-between text-[#857f5d]">
              <span>Subtotal:</span>
              <span className="text-[#e9e2ca] font-bold">{formatCOP(subtotal)}</span>
            </div>
            <div className="flex justify-between items-center text-[#857f5d]">
              <label className="flex items-center gap-1.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={includeTip}
                  onChange={(e) => setIncludeTip(e.target.checked)}
                  className="accent-[#9b7e09] rounded"
                />
                <span>Propina Voluntaria (10%):</span>
              </label>
              <span className="text-[#e9e2ca]">{formatCOP(includeTip ? subtotal * 0.10 : 0)}</span>
            </div>
            <div className="flex justify-between text-base font-black text-[#fdfcf7] pt-2 border-t border-[#383324]">
              <span>Total:</span>
              <span className="text-[#9b7e09]">{formatCOP(total)}</span>
            </div>
          </div>

          <button
            onClick={submitOrder}
            disabled={!cart.length}
            className={`w-full py-3.5 bg-gradient-to-r from-[#9b7e09] to-[#b8960e] text-[#fdfcf7] font-bold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 ${
              !cart.length ? 'opacity-40 cursor-not-allowed' : 'hover:from-[#b8960e] hover:to-[#9b7e09] active:scale-95 shadow-[#9b7e09]/20'
            }`}
          >
            Enviar Pedido a Cocina
          </button>
        </div>
      </div>
    </div>
  );
}
