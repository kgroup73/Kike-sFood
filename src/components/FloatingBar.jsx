import React from 'react';
import { Bell, ShoppingBag } from 'lucide-react';
import { formatCOP } from '../lib/dian';

export default function FloatingClientBar({
  cart,
  includeTip,
  setIsCartOpen,
  triggerWaiterCall
}) {
  const totalCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cart.reduce((sum, item) => sum + item.totalPrice, 0);
  const total = subtotal + (includeTip ? subtotal * 0.10 : 0);

  return (
    <div className="fixed bottom-3 inset-x-3 sm:inset-x-auto sm:right-6 sm:bottom-6 z-40 max-w-lg mx-auto sm:mx-0">
      <div className="bg-slate-900/95 backdrop-blur-lg border border-slate-800 p-2 sm:p-2.5 rounded-2xl shadow-2xl flex items-center justify-between gap-2">
        <button
          onClick={triggerWaiterCall}
          className="px-3 py-2.5 bg-amber-500/10 text-amber-400 border border-amber-500/30 hover:bg-amber-500/20 active:scale-95 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shrink-0"
        >
          <Bell className="w-4 h-4 text-amber-400" />
          <span className="text-[11px] sm:text-xs">Llamar Mesero</span>
        </button>

        <button
          onClick={() => setIsCartOpen(true)}
          className="flex-1 py-2.5 px-4 bg-orange-500 hover:bg-orange-600 active:scale-95 text-white font-extrabold rounded-xl shadow-lg shadow-orange-500/20 flex items-center justify-between gap-2 transition-all"
        >
          <div className="flex items-center gap-2">
            <div className="relative">
              <ShoppingBag className="w-4 h-4" />
              {totalCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-white text-orange-600 text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow">
                  {totalCount}
                </span>
              )}
            </div>
            <span className="text-xs">Ver Pedido</span>
          </div>
          <span className="bg-orange-700/60 text-white px-2 py-0.5 rounded-lg text-xs font-black">
            {formatCOP(total)}
          </span>
        </button>
      </div>
    </div>
  );
}
