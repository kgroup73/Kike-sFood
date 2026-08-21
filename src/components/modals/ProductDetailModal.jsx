import React, { useState } from 'react';
import { X, Plus, Minus } from 'lucide-react';
import { formatCOP } from '../../lib/dian';

export default function ProductDetailModal({ product, onClose, onAddToCart }) {
  const [quantity, setQuantity] = useState(1);
  const [selectedOptions, setSelectedOptions] = useState({});

  const calculateTotal = () => {
    let base = product.price;
    Object.values(selectedOptions).forEach(group => {
      if (Array.isArray(group)) {
        group.forEach(opt => base += (opt.price || 0));
      }
    });
    return base * quantity;
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-3xl max-w-md w-full max-h-[90vh] overflow-y-auto hide-scrollbar shadow-2xl space-y-4">
        <div className="relative h-48 bg-slate-950">
          <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 bg-slate-950/80 text-white rounded-full flex items-center justify-center hover:bg-slate-900 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 sm:p-5 space-y-4">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-white">{product.name}</h3>
            <p className="text-xs text-slate-400 mt-1">{product.description}</p>
          </div>

          {product.modifiers?.map(mod => (
            <div key={mod.title} className="space-y-2 border-t border-slate-800 pt-3">
              <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider">{mod.title}</h4>
              <div className="space-y-1">
                {mod.options.map(opt => (
                  <label
                    key={opt.name}
                    className="flex justify-between items-center p-2.5 rounded-xl bg-slate-950 cursor-pointer text-xs text-slate-300 hover:bg-slate-800/80 border border-slate-800/50 transition-colors"
                  >
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name={mod.title}
                        onChange={() => setSelectedOptions({ ...selectedOptions, [mod.title]: [opt] })}
                        className="accent-orange-500"
                      />
                      <span>{opt.name}</span>
                    </div>
                    <span className="text-slate-400">{opt.price > 0 ? `+${formatCOP(opt.price)}` : 'Incluido'}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}

          <div className="flex items-center justify-between border-t border-slate-800 pt-3">
            <span className="text-xs font-bold text-slate-300">Cantidad:</span>
            <div className="flex items-center space-x-3 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="text-slate-400 hover:text-white font-bold p-1"
              >
                <Minus className="w-3 h-3" />
              </button>
              <span className="text-sm font-bold text-white min-w-[20px] text-center">{quantity}</span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="text-slate-400 hover:text-white font-bold p-1"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>
          </div>

          <button
            onClick={() => {
              const opts = [];
              Object.values(selectedOptions).forEach(group => group.forEach(o => opts.push(o.name)));
              onAddToCart({
                product,
                quantity,
                optionsText: opts.length ? opts.join(', ') : 'Sin especificaciones',
                totalPrice: calculateTotal()
              });
            }}
            className="w-full py-3 bg-orange-500 hover:bg-orange-600 active:scale-95 text-white font-bold text-xs rounded-xl shadow-lg shadow-orange-500/20 transition-all flex justify-between px-4"
          >
            <span>Agregar al Pedido</span>
            <span>{formatCOP(calculateTotal())}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
