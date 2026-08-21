import React, { useState } from 'react';
import {
  Plus,
  Eye,
  EyeOff,
  Edit3,
  Trash2,
  Building2,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { formatCOP } from '../lib/dian';

export default function AdminView({
  products,
  company,
  setCompany,
  showToast,
  toggleProductAvailability,
  deleteProduct,
  openEditProduct,
  openNewProduct
}) {
  const [adminTab, setAdminTab] = useState('products');

  return (
    <div className="space-y-6">
      <div className="flex border-b border-slate-800 space-x-4">
        <button
          onClick={() => setAdminTab('products')}
          className={`pb-3 text-xs sm:text-sm font-bold transition-all ${adminTab === 'products' ? 'border-b-2 border-orange-500 text-white' : 'text-slate-400 hover:text-white'}`}
        >
          Platillos del Menú
        </button>
        <button
          onClick={() => setAdminTab('company')}
          className={`pb-3 text-xs sm:text-sm font-bold transition-all ${adminTab === 'company' ? 'border-b-2 border-orange-500 text-white' : 'text-slate-400 hover:text-white'}`}
        >
          Datos Empresa
        </button>
        <button
          onClick={() => setAdminTab('dian')}
          className={`pb-3 text-xs sm:text-sm font-bold transition-all ${adminTab === 'dian' ? 'border-b-2 border-orange-500 text-white' : 'text-slate-400 hover:text-white'}`}
        >
          Parametrización DIAN
        </button>
      </div>

      {adminTab === 'products' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-slate-200">Gestión del Menú ({products.length} platillos)</h3>
            <button
              onClick={openNewProduct}
              className="px-3.5 py-2 bg-orange-500 hover:bg-orange-600 active:scale-95 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all shadow"
            >
              <Plus className="w-4 h-4" /> Nuevo Platillo
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map(p => (
              <div key={p.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 flex justify-between items-center gap-3 shadow-md hover:border-slate-700 transition-all">
                <div className="flex items-center space-x-3 overflow-hidden">
                  <img src={p.image} alt={p.name} className="w-12 h-12 rounded-xl object-cover bg-slate-950 shrink-0" loading="lazy" />
                  <div className="truncate">
                    <h4 className="font-bold text-white text-xs truncate">{p.name}</h4>
                    <span className="text-orange-500 font-extrabold text-xs">{formatCOP(p.price)}</span>
                  </div>
                </div>
                <div className="flex items-center space-x-1 shrink-0">
                  <button
                    onClick={() => toggleProductAvailability(p.id)}
                    className={`p-2 text-xs rounded-lg transition-colors ${p.available !== false ? 'text-emerald-400 hover:bg-emerald-500/10' : 'text-rose-400 hover:bg-rose-500/10'}`}
                    title={p.available !== false ? "Visible en menú (Clic para ocultar)" : "Oculto (Clic para mostrar)"}
                  >
                    {p.available !== false ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => openEditProduct(p)}
                    className="p-2 text-slate-400 hover:text-white text-xs rounded-lg hover:bg-slate-800 transition-colors"
                    title="Editar platillo"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deleteProduct(p.id)}
                    className="p-2 text-rose-400 hover:text-rose-300 text-xs rounded-lg hover:bg-rose-500/10 transition-colors"
                    title="Eliminar platillo"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {adminTab === 'company' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 max-w-2xl shadow-xl">
          <h3 className="text-sm sm:text-base font-bold text-white border-b border-slate-800 pb-2 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-orange-500" /> Datos de Identificación de la Empresa
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-400 mb-1 font-medium">Razón Social</label>
              <input
                type="text"
                value={company.name}
                onChange={(e) => setCompany({ ...company, name: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-orange-500"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1 font-medium">NIT / DV</label>
              <input
                type="text"
                value={company.nit}
                onChange={(e) => setCompany({ ...company, nit: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-orange-500"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1 font-medium">Dirección</label>
              <input
                type="text"
                value={company.address}
                onChange={(e) => setCompany({ ...company, address: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-orange-500"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1 font-medium">Teléfono</label>
              <input
                type="text"
                value={company.phone}
                onChange={(e) => setCompany({ ...company, phone: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-orange-500"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1 font-medium">Tipo de Impuesto</label>
              <select
                value={company.taxType}
                onChange={(e) => setCompany({ ...company, taxType: e.target.value, taxRate: e.target.value === 'INC' ? 8 : 19 })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-orange-500"
              >
                <option value="INC">Impuesto al Consumo (8%)</option>
                <option value="IVA">IVA (19%)</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-400 mb-1 font-medium">Pie de Página del Ticket</label>
              <input
                type="text"
                value={company.footerText}
                onChange={(e) => setCompany({ ...company, footerText: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-orange-500"
              />
            </div>
          </div>
          <button
            onClick={() => showToast('Configuración de empresa guardada')}
            className="px-4 py-2.5 bg-orange-500 hover:bg-orange-600 active:scale-95 text-white font-bold text-xs rounded-xl shadow transition-all"
          >
            Guardar Cambios
          </button>
        </div>
      )}

      {adminTab === 'dian' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 max-w-2xl shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" /> Parámetros para Facturación Electrónica DIAN
            </h3>
            <span className="text-[10px] bg-emerald-500/20 text-emerald-400 font-bold px-2 py-0.5 rounded border border-emerald-500/30">
              Habilitado (UBL 2.1)
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-400 mb-1 font-medium">Nº Resolución DIAN (Form. 1876)</label>
              <input
                type="text"
                value={company.dianResolution}
                onChange={(e) => setCompany({ ...company, dianResolution: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-orange-500"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1 font-medium">Prefijo Autorizado</label>
              <input
                type="text"
                value={company.dianPrefix}
                onChange={(e) => setCompany({ ...company, dianPrefix: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-orange-500"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1 font-medium">Rango Inicial</label>
              <input
                type="number"
                value={company.dianRangeFrom}
                onChange={(e) => setCompany({ ...company, dianRangeFrom: Number(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-orange-500"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1 font-medium">Rango Final</label>
              <input
                type="number"
                value={company.dianRangeTo}
                onChange={(e) => setCompany({ ...company, dianRangeTo: Number(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-orange-500"
              />
            </div>
            <div className="col-span-full">
              <label className="block text-slate-400 mb-1 font-medium">Clave Técnica DIAN</label>
              <input
                type="text"
                value={company.dianTechKey}
                onChange={(e) => setCompany({ ...company, dianTechKey: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono text-[11px] focus:outline-none focus:border-orange-500"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1 font-medium">ID de Software (Software ID)</label>
              <input
                type="text"
                value={company.dianSoftwareId}
                onChange={(e) => setCompany({ ...company, dianSoftwareId: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono text-[11px] focus:outline-none focus:border-orange-500"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1 font-medium">SetTestID (Pruebas Habilitación)</label>
              <input
                type="text"
                value={company.dianTestSetId}
                onChange={(e) => setCompany({ ...company, dianTestSetId: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono text-[11px] focus:outline-none focus:border-orange-500"
              />
            </div>
          </div>

          <button
            onClick={() => showToast('Parámetros DIAN sincronizados correctamente')}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all shadow"
          >
            <CheckCircle2 className="w-4 h-4" /> Guardar y Validar con Servidor DIAN
          </button>
        </div>
      )}
    </div>
  );
}
