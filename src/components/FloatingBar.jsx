import React from 'react';
import { ShoppingBag } from 'lucide-react';
import { formatCOP } from '../lib/dian';

export default function FloatingClientBar({
  cart = [],
  includeTip = false,
  setIsCartOpen,
  plan = 'full',
  tableNumber = '1'
}) {
  if (plan === 'basic') {
    return (
      <div className="fixed bottom-3 inset-x-3 sm:inset-x-auto sm:right-6 sm:bottom-6 z-40 max-w-sm mx-auto sm:mx-0 animate-fadeIn">
        <div className="bg-[#1e1b13]/95 backdrop-blur-xl border border-[#383324] py-2.5 px-3.5 rounded-2xl shadow-2xl flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-[#e9e2ca] min-w-0">
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
            </span>
            <span className="font-bold shrink-0">Mesa {tableNumber}</span>
            <span className="text-[#857f5d]">•</span>
            <span className="text-[#aba489] text-[11px] truncate">Carta Digital de Autor</span>
          </div>
          <span className="text-[10px] bg-[#9b7e09]/20 text-[#b8960e] font-black px-2 py-0.5 rounded-lg border border-[#9b7e09]/30 shrink-0">
            Solo Consulta
          </span>
        </div>
      </div>
    );
  }

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
          onClick={() => setIsCartOpen(true)}
          className={`flex-1 py-2.5 px-3 sm:px-4 rounded-xl font-extrabold flex items-center justify-between gap-2 transition-all min-w-0 ${
            totalCount > 0
              ? 'bg-gradient-to-r from-[#9b7e09] to-[#b8960e] hover:from-[#b8960e] hover:to-[#9b7e09] active:scale-95 text-[#fdfcf7] shadow-lg shadow-[#9b7e09]/30'
              : 'bg-[#2c271d] hover:bg-[#383324] active:scale-95 text-[#857f5d]'
          }`}
        >
          <div className="flex items-center gap-2 min-w-0">
            <div className="relative shrink-0">
              <ShoppingBag className="w-4 h-4" />
              {totalCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-[#fdfcf7] text-[#9b7e09] text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow-md animate-bounce">
                  {totalCount}
                </span>
              )}
            </div>
            <span className="text-xs truncate">
              {totalCount > 0 ? 'Ver Mi Pedido' : 'Pedido Vacío'}
            </span>
          </div>

          <span
            className={`px-2 py-0.5 rounded-lg text-xs font-black shrink-0 ${
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