import React from 'react';
import { Bell, ShoppingBag, Sparkles } from 'lucide-react';
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
      <div
        className={`bg-[#1e1b13]/95 backdrop-blur-xl border p-2 sm:p-2.5 rounded-2xl shadow-2xl flex items-center justify-between gap-2.5 transition-all ${
          totalCount > 0
            ? 'border-[#9b7e09]/60 shadow-[#9b7e09]/20 ring-1 ring-[#9b7e09]/30'
            : 'border-[#383324]'
        }`}
      >
        <button
          onClick={triggerWaiterCall}
          className="px-3.5 py-2.5 bg-[#9b7e09]/15 text-[#e9e2ca] border border-[#9b7e09]/40 hover:bg-[#9b7e09]/25 active:scale-95 text-xs font-extrabold rounded-xl transition-all flex items-center gap-1.5 shrink-0"
        >
          <Bell className="w-4 h-4 text-[#b8960e]" />
          <span className="text-[11px] sm:text-xs">Llamar Mesero</span>
        </button>

        <button
          onClick={() => setIsCartOpen(true)}
          className={`flex-1 py-2.5 px-4 rounded-xl font-extrabold flex items-center justify-between gap-2 transition-all ${
            totalCount > 0
              ? 'bg-gradient-to-r from-[#9b7e09] to-[#b8960e] hover:from-[#b8960e] hover:to-[#9b7e09] active:scale-95 text-[#fdfcf7] shadow-lg shadow-[#9b7e09]/30'
              : 'bg-[#2c271d] hover:bg-[#383324] active:scale-95 text-[#857f5d]'
          }`}
        >
          <div className="flex items-center gap-2">
            <div className="relative">
              <ShoppingBag className="w-4 h-4" />
              {totalCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-[#fdfcf7] text-[#9b7e09] text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow-md animate-bounce">
                  {totalCount}
                </span>
              )}
            </div>
            <span className="text-xs">{totalCount > 0 ? 'Ver Mi Pedido' : 'Pedido Vacío'}</span>
          </div>

          <span
            className={`px-2.5 py-0.5 rounded-lg text-xs font-black ${
              totalCount > 0 ? 'bg-[#110f0a]/40 text-[#fdfcf7]' : 'bg-[#14120c] text-[#857f5d]'
            }`}
          >
            {formatCOP(total)}
          </span>
        </button>
      </div>
    </div>
  );
}
