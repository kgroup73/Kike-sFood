import React, { useState } from 'react';
import { X, Smartphone } from 'lucide-react';

export function NewCustomerModal({ onClose, onSave }) {
  const [form, setForm] = useState({ name: '', nit: '', email: '', phone: '' });

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-sm w-full p-5 shadow-2xl space-y-3 text-xs">
        <div className="flex justify-between items-center pb-1 border-b border-slate-800">
          <h4 className="font-bold text-white text-sm">Registrar Nuevo Cliente</h4>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1"><X className="w-4 h-4" /></button>
        </div>
        <input
          type="text"
          placeholder="Nombre completo / Razón Social"
          value={form.name}
          onChange={e => setForm({ ...form, name: e.target.value })}
          className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-orange-500"
        />
        <input
          type="text"
          placeholder="NIT / Cédula"
          value={form.nit}
          onChange={e => setForm({ ...form, nit: e.target.value })}
          className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-orange-500"
        />
        <input
          type="email"
          placeholder="Correo electrónico (para FE)"
          value={form.email}
          onChange={e => setForm({ ...form, email: e.target.value })}
          className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-orange-500"
        />
        <input
          type="text"
          placeholder="Teléfono"
          value={form.phone}
          onChange={e => setForm({ ...form, phone: e.target.value })}
          className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-orange-500"
        />
        <button
          onClick={() => {
            if (!form.name.trim()) return;
            onSave(form);
          }}
          className="w-full py-2.5 bg-orange-500 hover:bg-orange-600 active:scale-95 text-white font-bold rounded-xl shadow transition-all"
        >
          Guardar Cliente
        </button>
      </div>
    </div>
  );
}

export function GeoNfcModal({ onClose, simulateNfc, confirmGps, currentTable = '4' }) {
  const PRESET_TABLES = ['1', '2', '3', '4', '5', '6', '7', '8', '10', '12', 'VIP-1', 'Terraza-A'];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 xs:p-4 animate-in fade-in duration-200">
      <div className="bg-[#1e1b13] border border-[#b8960e]/40 rounded-3xl max-w-sm w-full p-5 sm:p-6 shadow-2xl text-[#fdfcf7] space-y-4 text-center">
        
        {/* Top NFC Visual Icon */}
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#9b7e09]/30 via-[#b8960e]/20 to-transparent border border-[#b8960e]/50 flex items-center justify-center mx-auto text-[#e9e2ca] shadow-lg animate-pulse">
          <Smartphone className="w-7 h-7 text-[#b8960e]" />
        </div>

        <div>
          <h3 className="text-base font-black text-[#fdfcf7]">Vinculación por NFC / Mesa</h3>
          <p className="text-xs text-[#aba489] leading-relaxed pt-1">
            En un restaurante real, el comensal solo acerca su teléfono a la etiqueta NFC o QR de la mesa para vincularse de inmediato.
          </p>
        </div>

        {/* Table Selector for Demos */}
        <div className="bg-[#14120c] p-3 rounded-2xl border border-[#383324] space-y-2 text-left">
          <span className="text-[10px] font-black text-[#857f5d] uppercase tracking-wider block">
            Selecciona la mesa a simular:
          </span>
          <div className="grid grid-cols-4 gap-1.5">
            {PRESET_TABLES.map(t => (
              <button
                key={t}
                onClick={() => simulateNfc(t)}
                className={`py-2 rounded-xl text-xs font-bold transition-all ${
                  currentTable === t
                    ? 'bg-gradient-to-r from-[#9b7e09] to-[#b8960e] text-[#fdfcf7] ring-1 ring-white/40 shadow'
                    : 'bg-[#2c271d] hover:bg-[#383324] text-[#aba489] hover:text-[#fdfcf7]'
                }`}
              >
                Mesa {t}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2 pt-1 text-xs">
          <button
            onClick={() => simulateNfc(currentTable || '4')}
            className="w-full py-2.5 bg-gradient-to-r from-[#9b7e09] to-[#b8960e] active:scale-95 text-[#fdfcf7] font-extrabold rounded-xl flex items-center justify-center gap-2 shadow-md shadow-[#9b7e09]/20 transition-all"
          >
            <span>⚡ Simular Toque NFC (Mesa {currentTable || '4'})</span>
          </button>
          <button
            onClick={confirmGps}
            className="w-full py-2 bg-[#2c271d] hover:bg-[#383324] text-[#aba489] hover:text-[#fdfcf7] font-bold rounded-xl border border-[#383324] transition-colors"
          >
            Validar Ubicación por GPS
          </button>
          <button
            onClick={onClose}
            className="py-1 text-[#857f5d] hover:text-[#aba489] text-[11px] transition-colors"
          >
            Cerrar
          </button>
        </div>

      </div>
    </div>
  );
}

export function AdminProductModal({ formData, setFormData, categories, onClose, onSave }) {
  if (!formData) return null;
  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-5 shadow-2xl space-y-3 text-xs max-h-[90vh] overflow-y-auto hide-scrollbar">
        <div className="flex justify-between items-center pb-1 border-b border-slate-800">
          <h4 className="font-bold text-white text-sm">{formData.id ? 'Editar Platillo' : 'Nuevo Platillo'}</h4>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1"><X className="w-4 h-4" /></button>
        </div>
        
        <div>
          <label className="block text-slate-400 mb-1">Nombre</label>
          <input
            type="text"
            value={formData.name}
            onChange={e => setFormData({ ...formData, name: e.target.value })}
            placeholder="Ej: Hamburguesa Suprema"
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-orange-500"
          />
        </div>

        <div>
          <label className="block text-slate-400 mb-1">Categoría</label>
          <select
            value={formData.category}
            onChange={e => setFormData({ ...formData, category: e.target.value })}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-orange-500"
          >
            {categories.filter(c => c !== 'Todos').map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-slate-400 mb-1">Precio ($ COP)</label>
          <input
            type="number"
            value={formData.price}
            onChange={e => setFormData({ ...formData, price: Number(e.target.value) })}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-orange-500"
          />
        </div>

        <div>
          <label className="block text-slate-400 mb-1">URL Imagen</label>
          <input
            type="text"
            value={formData.image}
            onChange={e => setFormData({ ...formData, image: e.target.value })}
            placeholder="https://images.unsplash.com/..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-orange-500"
          />
        </div>

        <div>
          <label className="block text-slate-400 mb-1">Descripción</label>
          <textarea
            value={formData.description}
            onChange={e => setFormData({ ...formData, description: e.target.value })}
            rows="2"
            placeholder="Descripción de los ingredientes..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-orange-500"
          ></textarea>
        </div>

        <div className="flex items-center space-x-4 pt-1">
          <label className="flex items-center space-x-1.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={formData.isChef}
              onChange={e => setFormData({ ...formData, isChef: e.target.checked })}
              className="accent-orange-500"
            />
            <span className="text-slate-300 font-medium">Chef</span>
          </label>
          <label className="flex items-center space-x-1.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={formData.isVeg}
              onChange={e => setFormData({ ...formData, isVeg: e.target.checked })}
              className="accent-orange-500"
            />
            <span className="text-slate-300 font-medium">Vegano</span>
          </label>
          <label className="flex items-center space-x-1.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={formData.isGf}
              onChange={e => setFormData({ ...formData, isGf: e.target.checked })}
              className="accent-orange-500"
            />
            <span className="text-slate-300 font-medium">Sin Gluten</span>
          </label>
        </div>

        <button
          onClick={onSave}
          className="w-full py-2.5 bg-orange-500 hover:bg-orange-600 active:scale-95 text-white font-bold rounded-xl transition-all shadow"
        >
          Guardar Platillo
        </button>
      </div>
    </div>
  );
}
