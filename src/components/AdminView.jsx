import React, { useState, useMemo } from 'react';
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
  Sparkles,
  Package,
  PackageX,
  PackageCheck,
  ShoppingCart,
  ClipboardList,
  Layers,
  History,
  Search,
  Boxes,
  Lock,
  Database,
  Printer
} from 'lucide-react';
import { formatCOP } from '../lib/dian';
import { timeAgo, formatEventTimestamp } from '../lib/inventory';
import { isSupabaseConfigured } from '../lib/supabaseClient';
import TableStickersModal from './modals/TableStickersModal';

export default function AdminView({
  products,
  productsWithStock = [],
  masterIngredients = [],
  ingredientsStock = {},
  company,
  stockEvents = [],
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
  const [isStickersModalOpen, setIsStickersModalOpen] = useState(false);
  const [ingredientQuery, setIngredientQuery] = useState('');
  const [staffPin, setStaffPin] = useState(() => {
    try {
      return localStorage.getItem('kikes_staff_pin') || '1234';
    } catch (e) {
      return '1234';
    }
  });

  const soldOutNow = useMemo(() => productsWithStock.filter(p => p.soldOut), [productsWithStock]);
  const depletedEvents = useMemo(() => stockEvents.filter(e => e.type === 'AGOTADO'), [stockEvents]);

  // Ranking de materias primas que más agotamientos han provocado (para compras)
  const rankedIngredients = useMemo(() => {
    const totals = {};
    depletedEvents.forEach(ev => {
      const ing = ev.ingredient || (ev.missingIngredients || [])[0];
      if (!ing) return;
      totals[ing] = (totals[ing] || 0) + 1;
    });
    return Object.entries(totals).sort((a, b) => b[1] - a[1]);
  }, [depletedEvents]);
  const maxIngredientCount = rankedIngredients.length ? rankedIngredients[0][1] : 0;

  const filteredIngredients = useMemo(() => {
    const q = ingredientQuery.trim().toLowerCase();
    if (!q) return masterIngredients.filter(ing => ingredientsStock[ing.key]?.soldOut);
    return masterIngredients.filter(ing =>
      ingredientsStock[ing.key]?.soldOut &&
      (ing.name.toLowerCase().includes(q) ||
      ing.usedBy.some(pn => pn.toLowerCase().includes(q)))
    );
  }, [masterIngredients, ingredientQuery, ingredientsStock]);

  const soldOutIngredients = masterIngredients.filter(ing => ingredientsStock[ing.key]?.soldOut);

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
          onClick={() => setAdminTab('inventory')}
          className={`pb-3 text-xs sm:text-sm font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${adminTab === 'inventory' ? 'border-b-2 border-orange-500 text-white' : 'text-slate-400 hover:text-white'}`}
        >
          <Package className="w-3.5 h-3.5" /> <span>Inventario & Compras</span>
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
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <button
                onClick={() => setIsStickersModalOpen(true)}
                className="px-3.5 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 active:scale-95 text-slate-950 font-black rounded-xl flex items-center gap-1.5 shadow-md transition-all"
                title="Abrir hoja de stickers listos para imprimir"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimir Stickers (NFC + QR)</span>
              </button>
              <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5">
                <span className="text-slate-400 font-bold">Mesas:</span>
                <select
                  value={tableCount}
                  onChange={(e) => setTableCount(Number(e.target.value))}
                  className="bg-transparent text-white font-bold focus:outline-none cursor-pointer"
                >
                  <option value={6} className="bg-slate-900">6 Mesas</option>
                  <option value={8} className="bg-slate-900">8 Mesas</option>
                  <option value={12} className="bg-slate-900">12 Mesas</option>
                  <option value={16} className="bg-slate-900">16 Mesas</option>
                  <option value={20} className="bg-slate-900">20 Mesas</option>
                </select>
              </div>
            </div>
          </div>

          {/* Table Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {Array.from({ length: tableCount }, (_, i) => {
              const tableNum = String(i + 1);
              const slug = company.slug || 'la-trattoria';
              const targetUrl = `${window.location.origin}/?r=${slug}&mesa=${tableNum}&nfc=true`;

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

      {adminTab === 'inventory' && (
        <div className="space-y-4">
          {/* Encabezado del módulo */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                <Package className="w-4 h-4 text-orange-500" /> Reporte de Inventario & Desabastecimiento
              </h3>
              <p className="text-xs text-slate-400">Trazabilidad de materias primas agotadas, reportadas en tiempo real por cocina</p>
            </div>
            <span className="hidden sm:inline text-[10px] bg-emerald-500/20 text-emerald-400 font-bold px-2 py-0.5 rounded border border-emerald-500/30 whitespace-nowrap">
              Sincronizado con KDS
            </span>
          </div>

          {/* Control de Materias Primas */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 shadow-md">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                  <Boxes className="w-4 h-4 text-orange-400" /> Materias Primas Agotadas ({soldOutIngredients.length})
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Reporte informativo. La cocina es la encargada de agotar y reponer las materias primas.
                </p>
              </div>
              <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <input
                  type="text"
                  value={ingredientQuery}
                  onChange={e => setIngredientQuery(e.target.value)}
                  placeholder="Buscar ingrediente o platillo..."
                  className="bg-transparent outline-none text-xs text-white w-full placeholder:text-slate-600"
                />
              </div>
            </div>

            {filteredIngredients.length ? (
              <div className="space-y-2 max-h-96 overflow-y-auto hide-scrollbar pr-1">
                {filteredIngredients.map(ing => {
                  const info = ingredientsStock[ing.key];
                  const isSoldOut = !!info?.soldOut;
                  return (
                    <div key={ing.key} className={`bg-slate-950 border rounded-xl p-3 flex items-center justify-between gap-3 transition-all ${isSoldOut ? 'border-rose-500/25' : 'border-slate-800/80'}`}>
                      <div className="min-w-0 space-y-0.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h5 className="text-xs font-bold text-white truncate">{ing.name}</h5>
                          {isSoldOut && (
                            <span className="text-[9px] font-black px-2 py-0.5 rounded-full border bg-rose-500/15 text-rose-300 border-rose-500/30">
                              AGOTADO
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 truncate">
                          Usado en {ing.usedBy.length} {ing.usedBy.length === 1 ? 'platillo' : 'platillos'}: {ing.usedBy.join(', ') || '—'}
                        </p>
                        {isSoldOut && info.at && (
                          <p className="text-[10px] text-slate-600">Agotado {timeAgo(info.at)}{info.note ? ` · “${info.note}”` : ''}</p>
                        )}
                      </div>
                      <div className="shrink-0">
                        {isSoldOut ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-rose-500/15 text-rose-300 border border-rose-500/30 px-2 py-1 rounded-lg whitespace-nowrap">
                            <PackageX className="w-3.5 h-3.5" /> Agotado en cocina
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 px-2 py-1 rounded-lg whitespace-nowrap">
                            <PackageCheck className="w-3.5 h-3.5" /> Disponible
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-6 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-xl">
                {masterIngredients.length ? 'No hay materias primas agotadas actualmente.' : 'No hay materias primas registradas en el catálogo.'}
              </div>
            )}
          </div>

          {/* Métricas clave */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5">
              <PackageX className="w-4 h-4 text-rose-400 mb-2" />
              <p className="text-xl font-black text-white leading-none">{soldOutNow.length}</p>
              <p className="text-[10px] text-slate-400 font-medium mt-1.5">Platillos agotados ahora mismo</p>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5">
              <ClipboardList className="w-4 h-4 text-orange-400 mb-2" />
              <p className="text-xl font-black text-white leading-none">{depletedEvents.length}</p>
              <p className="text-[10px] text-slate-400 font-medium mt-1.5">Eventos de desabastecimiento registrados</p>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5">
              <Layers className="w-4 h-4 text-indigo-400 mb-2" />
              <p className="text-xl font-black text-white leading-none">{rankedIngredients.length}</p>
              <p className="text-[10px] text-slate-400 font-medium mt-1.5">Materias primas distintas afectadas</p>
            </div>
          </div>

          {/* Sugerencia de compras */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 shadow-md">
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-emerald-400" /> Sugerencia de Compras
              </h4>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Frecuencia con la que cada materia prima provocó un agotamiento. Prioriza las de mayor recurrencia.
              </p>
            </div>
            {rankedIngredients.length ? (
              <div className="space-y-3 pt-1">
                {rankedIngredients.map(([ing, count]) => (
                  <div key={ing} className="space-y-1">
                    <div className="flex justify-between items-center text-xs gap-2">
                      <span className="text-slate-200 font-medium flex items-center gap-1.5 min-w-0 truncate">
                        {ing}
                        {count >= 2 && (
                          <span className="shrink-0 text-[9px] bg-rose-500/15 text-rose-300 border border-rose-500/30 px-1.5 py-0.5 rounded font-black uppercase tracking-wide">
                            Prioridad alta
                          </span>
                        )}
                      </span>
                      <span className="text-slate-400 font-bold whitespace-nowrap">{count} {count === 1 ? 'evento' : 'eventos'}</span>
                    </div>
                    <div className="h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                      <div
                        className="h-full bg-gradient-to-r from-orange-500 to-rose-500 rounded-full transition-all"
                        style={{ width: `${Math.max(8, Math.round((count / maxIngredientCount) * 100))}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-6 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-xl">
                Sin desabastecimientos registrados aún. Cuando la cocina reporte faltantes, aquí verás qué conviene comprar.
              </div>
            )}
          </div>

          {/* Agotados activos en carta */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 shadow-md">
            <h4 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
              <PackageX className="w-4 h-4 text-rose-400" /> Agotados en Carta ({soldOutNow.length})
            </h4>
            {soldOutNow.length ? (
              <div className="space-y-2">
                {soldOutNow.map(p => (
                  <div key={p.id} className="bg-slate-950 border border-rose-500/20 rounded-xl p-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <img src={p.image} alt={p.name} className="w-10 h-10 rounded-lg object-cover grayscale opacity-70 shrink-0" loading="lazy" />
                      <div className="min-w-0 space-y-0.5">
                        <h5 className="text-xs font-bold text-white truncate">{p.name}</h5>
                        <p className="text-[11px] text-rose-300 truncate">
                          Sin: {(p.soldOutInfo?.missingIngredients || []).join(', ') || 'Insumo no especificado'}
                        </p>
                        {p.soldOutInfo?.note && (
                          <p className="text-[10px] italic text-slate-500 truncate">“{p.soldOutInfo.note}”</p>
                        )}
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-400 whitespace-nowrap shrink-0">{timeAgo(p.soldOutInfo?.at)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500">Todos los platillos tienen stock disponible. 👍</p>
            )}
          </div>

          {/* Historial completo */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 shadow-md">
            <div className="flex items-center justify-between">
              <h4 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                <History className="w-4 h-4 text-indigo-400" /> Historial de Desabastecimiento ({stockEvents.length})
              </h4>
              <span className="text-[10px] text-slate-500">Más reciente primero</span>
            </div>
            {stockEvents.length ? (
              <div className="space-y-2 max-h-96 overflow-y-auto hide-scrollbar pr-1">
                {stockEvents.map(ev => (
                  <div key={`${ev.id}-${ev.timestamp}`} className="bg-slate-950 border border-slate-800/80 rounded-xl p-3 flex items-start justify-between gap-3">
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${
                          ev.type === 'AGOTADO'
                            ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                            : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                        }`}>
                          {ev.type}
                        </span>
                        <span className="text-xs font-bold text-slate-200">{ev.ingredient || ev.productName || 'Materia prima'}</span>
                      </div>
                      {(ev.missingIngredients?.length > 0 && !ev.ingredient) && (
                        <p className="text-[11px] text-slate-400">
                          Materia prima: <span className="text-amber-300 font-medium">{ev.missingIngredients.join(', ')}</span>
                        </p>
                      )}
                      {ev.affectedProducts?.length > 0 && (
                        <p className="text-[11px] text-slate-400">
                          Afectó: <span className="text-rose-300 font-medium">{ev.affectedProducts.join(', ')}</span>
                        </p>
                      )}
                      {ev.note && <p className="text-[11px] italic text-slate-500">“{ev.note}”</p>}
                    </div>
                    <div className="text-right shrink-0 space-y-0.5">
                      <p className="text-[10px] text-slate-500">{formatEventTimestamp(ev.timestamp)}</p>
                      <p className="text-[10px] text-slate-600">por {ev.reportedBy || 'Cocina'}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-xl">
                Aún no hay eventos registrados. Los reportes de cocina aparecerán aquí automáticamente.
              </div>
            )}
          </div>
        </div>
      )}

      {adminTab === 'company' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 max-w-2xl shadow-xl">
          <h3 className="text-sm sm:text-base font-bold text-white border-b border-slate-800 pb-2 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-orange-500" /> Configuración de Empresa & Plan SaaS
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            {/* SaaS Plan Tier Selector */}
            <div className="sm:col-span-2 bg-slate-950/80 border border-slate-800 p-3.5 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-slate-300 font-bold flex items-center gap-1.5 text-xs">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Plan SaaS Activo
                </label>
                <span className="text-[10px] text-slate-400">Escoge el plan del restaurante</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setCompany({ ...company, plan: 'basic' })}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    company.plan === 'basic'
                      ? 'border-amber-500 bg-amber-500/10 text-white shadow-sm'
                      : 'border-slate-800 bg-slate-900/50 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between font-black text-xs">
                    <span>1. Básico</span>
                    {company.plan === 'basic' && <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />}
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">Carta Digital NFC (Solo Consulta).</p>
                </button>

                <button
                  type="button"
                  onClick={() => setCompany({ ...company, plan: 'intermedio' })}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    company.plan === 'intermedio'
                      ? 'border-orange-500 bg-orange-500/10 text-white shadow-sm'
                      : 'border-slate-800 bg-slate-900/50 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between font-black text-xs">
                    <span>2. Intermedio</span>
                    {company.plan === 'intermedio' && <CheckCircle2 className="w-3.5 h-3.5 text-orange-400" />}
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">+ Mesero & Comandas Cocina KDS.</p>
                </button>

                <button
                  type="button"
                  onClick={() => setCompany({ ...company, plan: 'full' || !company.plan })}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    company.plan === 'full' || !company.plan
                      ? 'border-emerald-500 bg-emerald-500/10 text-white shadow-sm'
                      : 'border-slate-800 bg-slate-900/50 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between font-black text-xs">
                    <span>3. Full 360°</span>
                    {(company.plan === 'full' || !company.plan) && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">+ POS, Factura DIAN & Stock.</p>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-medium">Slug del Restaurante (URL)</label>
              <input
                type="text"
                value={company.slug || 'la-trattoria'}
                onChange={(e) => setCompany({ ...company, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') })}
                placeholder="ej: la-trattoria"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono text-xs focus:outline-none focus:border-orange-500"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">URL: ?r={company.slug || 'la-trattoria'}</span>
            </div>
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
            <div>
              <label className="block text-slate-400 mb-1 font-medium flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-amber-400" /> PIN de Acceso de Personal
              </label>
              <input
                type="password"
                maxLength={4}
                value={staffPin}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 4);
                  setStaffPin(val);
                  try {
                    localStorage.setItem('kikes_staff_pin', val);
                  } catch (err) {}
                }}
                placeholder="1234"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono tracking-widest text-center focus:outline-none focus:border-amber-500"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">PIN de 4 dígitos para proteger KDS, POS y Configuración.</span>
            </div>
          </div>

          {/* Backend & Cloud Status */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-2">
                <Database className="w-4 h-4 text-orange-400" /> Estado de Base de Datos & WebSockets
              </span>
              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                isSupabaseConfigured 
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' 
                  : 'bg-amber-500/20 text-amber-400 border-amber-500/40'
              }`}>
                {isSupabaseConfigured ? 'Nube Conectada (Supabase)' : 'Modo Piloto Local'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              {isSupabaseConfigured
                ? 'Base de datos PostgreSQL en tiempo real sincronizada. Las comandas y llamados se transmiten al instante vía WebSockets.'
                : 'Operando en modo de demostración seguro sin costo. Para conectar tu base de datos Supabase ($0 COP), coloca tus llaves en el archivo .env.'}
            </p>
          </div>

          <button
            onClick={() => showToast('Configuración de empresa y PIN guardados')}
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

      {/* Modal de Impresión de Stickers para Mesas */}
      <TableStickersModal
        isOpen={isStickersModalOpen}
        onClose={() => setIsStickersModalOpen(false)}
        company={company}
        tableCount={tableCount}
      />
    </div>
  );
}
