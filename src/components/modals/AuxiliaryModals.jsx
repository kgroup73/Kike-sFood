import React, { useState } from 'react';
import { MapPin, X } from 'lucide-react';

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

export function WaiterCallModal({ tableNumber, onClose, callWaiter }) {
  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xs w-full p-5 shadow-2xl space-y-3 text-center">
        <div className="flex justify-between items-center pb-1 border-b border-slate-800">
          <h3 className="text-sm font-bold text-white">Llamar Mesero (Mesa {tableNumber})</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1"><X className="w-4 h-4" /></button>
        </div>
        <div className="grid grid-cols-1 gap-2 text-xs pt-1">
          <button
            onClick={() => callWaiter('Servilletas / Salsas')}
            className="py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl border border-slate-700/80 transition-colors"
          >
            Servilletas / Salsas
          </button>
          <button
            onClick={() => callWaiter('Agua / Vasos con Hielo')}
            className="py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl border border-slate-700/80 transition-colors"
          >
            Agua / Vasos con Hielo
          </button>
          <button
            onClick={() => callWaiter('Atención presencial')}
            className="py-2.5 bg-orange-500 hover:bg-orange-600 active:scale-95 text-white font-bold rounded-xl transition-all shadow"
          >
            Atención del Mesero
          </button>
        </div>
      </div>
    </div>
  );
}

export function GeoNfcModal({ onClose, simulateNfc, confirmGps }) {
  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-sm w-full p-5 shadow-2xl space-y-3 text-center text-xs">
        <div className="w-12 h-12 bg-amber-500/20 text-amber-400 rounded-full flex items-center justify-center mx-auto text-xl">
          <MapPin className="w-6 h-6 text-amber-400" />
        </div>
        <h3 className="text-sm font-bold text-white">Verificación de Presencia</h3>
        <p className="text-slate-400">
          Para realizar pedidos desde la mesa debes estar dentro del establecimiento o escanear la etiqueta NFC.
        </p>
        <div className="pt-2 flex flex-col gap-2">
          <button
            onClick={() => simulateNfc('4')}
            className="py-2.5 bg-orange-500 hover:bg-orange-600 active:scale-95 text-white font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all shadow"
          >
            ⚡ Simular Toque NFC (Mesa 4)
          </button>
          <button
            onClick={confirmGps}
            className="py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl border border-slate-700 transition-colors"
          >
            Validar Ubicación GPS
          </button>
          <button
            onClick={onClose}
            className="py-1.5 text-slate-400 hover:text-white transition-colors"
          >
            Cancelar
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
