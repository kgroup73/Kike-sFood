import React, { useState } from 'react';
import {
  Plus,
  Eye,
  EyeOff,
  Edit3,
  Trash2,
  Building2,
  ShieldCheck,
  CheckCircle2,
  Smartphone,
  QrCode,
  Copy,
  ExternalLink,
  Zap,
  Sparkles
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
  openNewProduct,
  onSimulateTableNfc
}) {
  const [adminTab, setAdminTab] = useState('products');
  const [tableCount, setTableCount] = useState(12);

  return (
    <div className="space-y-6">
      <div className="flex border-b border-slate-800 space-x-2 sm:space-x-4 overflow-x-auto hide-scrollbar">
        <button
          onClick={() => setAdminTab('products')}
          className={`pb-3 text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${adminTab === 'products' ? 'border-b-2 border-orange-500 text-white' : 'text-slate-400 hover:text-white'}`}
        >
          Platillos del Menú
        </button>
        <button
          onClick={() => setAdminTab('nfc')}
          className={`pb-3 text-xs sm:text-sm font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${adminTab === 'nfc' ? 'border-b-2 border-amber-500 text-amber-400' : 'text-slate-400 hover:text-white'}`}
        >
          <Smartphone className="w-3.5 h-3.5" /> <span>Mesas & Tags NFC</span>
        </button>
        <button
          onClick={() => setAdminTab('company')}
          className={`pb-3 text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${adminTab === 'company' ? 'border-b-2 border-orange-500 text-white' : 'text-slate-400 hover:text-white'}`}
        >
          Datos Empresa
        </button>
        <button
          onClick={() => setAdminTab('dian')}
          className={`pb-3 text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${adminTab === 'dian' ? 'border-b-2 border-orange-500 text-white' : 'text-slate-400 hover:text-white'}`}
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

      {adminTab === 'nfc' && (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-slate-900 p-4 rounded-2xl border border-slate-800 gap-3 shadow-lg">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-amber-400" />
                Configuración de Mesas, Tags NFC y Códigos QR
              </h3>
              <p className="text-xs text-slate-400">
                Genera los enlaces directos y códigos para grabar en chips NFC (NTAG213) o imprimir en displays físicos.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400 font-bold">Total Mesas:</span>
              <select
                value={tableCount}
                onChange={(e) => setTableCount(Number(e.target.value))}
                className="bg-slate-950 border border-slate-800 text-white font-bold rounded-xl px-3 py-1.5 focus:outline-none focus:border-amber-500"
              >
                <option value={8}>8 Mesas</option>
                <option value={12}>12 Mesas</option>
                <option value={16}>16 Mesas</option>
                <option value={20}>20 Mesas</option>
              </select>
            </div>
          </div>

          {/* Table Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {Array.from({ length: tableCount }, (_, i) => {
              const tableNum = String(i + 1);
              const targetUrl = `${window.location.origin}/?mesa=${tableNum}&nfc=true`;

              return (
                <div
                  key={tableNum}
                  className="bg-slate-900 border border-slate-800 hover:border-amber-500/50 rounded-2xl p-4 space-y-3 shadow-md transition-all flex flex-col justify-between group"
                >
                  <div className="space-y-2.5">
                    <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 font-black flex items-center justify-center text-xs border border-amber-500/30">
                          #{tableNum}
                        </div>
                        <div>
                          <h4 className="font-bold text-white text-xs sm:text-sm">Mesa {tableNum}</h4>
                          <span className="text-[10px] text-slate-400 flex items-center gap-1">
                            <Zap className="w-2.5 h-2.5 text-amber-400" /> Chip NFC NTAG213
                          </span>
                        </div>
                      </div>

                      <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                        Activa
                      </span>
                    </div>

                    {/* URL Snippet */}
                    <div className="bg-slate-950 p-2 rounded-xl border border-slate-800 text-[10px] text-slate-400 font-mono break-all select-all flex items-center justify-between gap-1">
                      <span className="truncate">{targetUrl}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-2 border-t border-slate-800 flex items-center gap-2 text-xs">
                    <button
                      onClick={() => {
                        if (navigator?.clipboard?.writeText) {
                          navigator.clipboard.writeText(targetUrl).catch(() => {});
                        }
                        showToast(`Enlace para Mesa ${tableNum} copiado al portapapeles 📋`);
                      }}
                      className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl border border-slate-700 flex items-center justify-center gap-1.5 transition-colors"
                      title="Copiar URL para quemar en el tag NFC"
                    >
                      <Copy className="w-3.5 h-3.5 text-amber-400" />
                      <span>Copiar Enlace</span>
                    </button>

                    <button
                      onClick={() => {
                        if (onSimulateTableNfc) {
                          onSimulateTableNfc(tableNum);
                        }
                      }}
                      className="py-2 px-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black rounded-xl flex items-center justify-center gap-1 transition-all shadow"
                      title="Simular cliente escaneando NFC en esta mesa"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Probar</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* B2B Onboarding Hardware Guide */}
          <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-amber-950/30 border border-amber-500/30 rounded-3xl p-5 sm:p-6 space-y-3 shadow-xl">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-extrabold text-sm sm:text-base text-white">
                  ¿Cómo instalar y vender los Tags NFC físicos a tus restaurantes?
                </h4>
                <p className="text-xs text-slate-400">
                  Guía paso a paso para que cualquier restaurante implemente el menú de mesa en menos de 10 minutos.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-2 text-xs">
              <div className="bg-slate-950/70 p-3.5 rounded-2xl border border-slate-800 space-y-1.5">
                <span className="text-amber-400 font-black text-sm">1. Adquiere los Stickers</span>
                <p className="text-slate-300 leading-relaxed">
                  Compra etiquetas adhesivas NFC circulares estándar <strong>NTAG213 o NTAG215</strong> en MercadoLibre o AliExpress (cuestan aprox. <strong>$1.200 a $1.800 COP cada una</strong>).
                </p>
              </div>

              <div className="bg-slate-950/70 p-3.5 rounded-2xl border border-slate-800 space-y-1.5">
                <span className="text-amber-400 font-black text-sm">2. Graba el Enlace en 5 Segundos</span>
                <p className="text-slate-300 leading-relaxed">
                  Descarga la app gratuita <strong>NFC Tools</strong> en tu iPhone o Android. Selecciona <em>Escribir &gt; Añadir Registro URL</em>, pega el enlace de la mesa correspondiente y acerca el sticker al teléfono.
                </p>
              </div>

              <div className="bg-slate-950/70 p-3.5 rounded-2xl border border-slate-800 space-y-1.5">
                <span className="text-amber-400 font-black text-sm">3. Fija en Mesa o Soporte</span>
                <p className="text-slate-300 leading-relaxed">
                  Pega la etiqueta debajo de la madera de la mesa o dentro de un soporte acrílico/madera de diseño. <strong>No requiere baterías ni mantenimiento de por vida.</strong>
                </p>
              </div>
            </div>
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
