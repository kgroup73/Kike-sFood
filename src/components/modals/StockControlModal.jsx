import React, { useState } from 'react';
import { X, Plus, PackageX, Info, Check } from 'lucide-react';

export default function StockControlModal({ product, onClose, onConfirm }) {
  const [selected, setSelected] = useState([]);
  const [customIngredient, setCustomIngredient] = useState('');
  const [note, setNote] = useState('');

  if (!product) return null;

  const allOptions = [...(product.ingredients || [])];
  selected.forEach(s => {
    if (!allOptions.includes(s)) allOptions.push(s);
  });

  const toggleIngredient = (name) => {
    setSelected(prev => prev.includes(name) ? prev.filter(i => i !== name) : [...prev, name]);
  };

  const addCustomIngredient = () => {
    const clean = customIngredient.trim();
    if (!clean) return;
    toggleIngredient(clean);
    setCustomIngredient('');
  };

  const handleConfirm = () => {
    if (!selected.length) return;
    onConfirm({ missingIngredients: selected, note: note.trim() });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-5 shadow-2xl space-y-4 text-xs max-h-[90vh] overflow-y-auto hide-scrollbar">

        <div className="flex justify-between items-center pb-2 border-b border-slate-800">
          <h4 className="font-bold text-white text-sm flex items-center gap-2">
            <PackageX className="w-4 h-4 text-rose-400" /> Reportar Producto Agotado
          </h4>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1"><X className="w-4 h-4" /></button>
        </div>

        <div className="flex items-center gap-3 bg-slate-950 border border-slate-800 rounded-xl p-2.5">
          <img src={product.image} alt={product.name} className="w-11 h-11 rounded-lg object-cover shrink-0" loading="lazy" />
          <div className="min-w-0">
            <h5 className="font-bold text-white text-xs truncate">{product.name}</h5>
            <span className="text-[10px] text-slate-500">{product.category}</span>
          </div>
        </div>

        <div className="flex items-start gap-2 p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/25 text-blue-200 leading-relaxed">
          <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <span>El platillo se mostrará como <strong>No Disponible</strong> en la carta del cliente al instante y el faltante quedará registrado para el reporte del administrador.</span>
        </div>

        <div className="space-y-2">
          <label className="block text-slate-300 font-bold">¿Qué materia prima se agotó? <span className="text-rose-400">*</span></label>
          {allOptions.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {allOptions.map(opt => {
                const isSelected = selected.includes(opt);
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => toggleIngredient(opt)}
                    className={`px-2.5 py-1.5 rounded-lg border text-[11px] font-semibold transition-all flex items-center gap-1 ${
                      isSelected
                        ? 'bg-rose-500/20 border-rose-500 text-rose-200'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-600 hover:text-slate-200'
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3" />}
                    {opt}
                  </button>
                );
              })}
            </div>
          ) : (
            <p className="text-slate-500">Este platillo no tiene materias primas registradas. Agrégalas manualmente:</p>
          )}

          <div className="flex gap-2 pt-1">
            <input
              type="text"
              value={customIngredient}
              onChange={e => setCustomIngredient(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addCustomIngredient();
                }
              }}
              placeholder="Otra materia prima (ej: Palta Hass)"
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-orange-500"
            />
            <button
              type="button"
              onClick={addCustomIngredient}
              className="px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl border border-slate-700 transition-colors flex items-center"
              title="Agregar materia prima"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="block text-slate-300 font-bold">Nota para el administrador (opcional)</label>
          <textarea
            rows="2"
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="Ej: El proveedor retrasó la entrega semanal..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-orange-500"
          ></textarea>
        </div>

        <div className="flex gap-2 pt-1">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl border border-slate-700 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={!selected.length}
            className={`flex-1 py-2.5 font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              selected.length
                ? 'bg-rose-600 hover:bg-rose-500 active:scale-95 text-white shadow-lg shadow-rose-600/20'
                : 'bg-slate-800 text-slate-600 cursor-not-allowed'
            }`}
          >
            <PackageX className="w-3.5 h-3.5" /> Confirmar Agotado
          </button>
        </div>
        {!selected.length && (
          <p className="text-center text-[10px] text-slate-500">Debes seleccionar al menos una materia prima faltante.</p>
        )}
      </div>
    </div>
  );
}
