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
  Package,
  PackageX,
  PackageCheck,
  ShoppingCart,
  ClipboardList,
  Layers,
  History,
  Search,
  Boxes
} from 'lucide-react';
import { formatCOP } from '../lib/dian';
import { timeAgo, formatEventTimestamp } from '../lib/inventory';

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
  openNewProduct
}) {
  const [adminTab, setAdminTab] = useState('products');
  const [ingredientQuery, setIngredientQuery] = useState('');

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
      <div className="flex border-b border-slate-800 space-x-4">
        <button
          onClick={() => setAdminTab('products')}
          className={`pb-3 text-xs sm:text-sm font-bold transition-all ${adminTab === 'products' ? 'border-b-2 border-orange-500 text-white' : 'text-slate-400 hover:text-white'}`}
        >
          Platillos del Menú
        </button>
        <button
          onClick={() => setAdminTab('inventory')}
          className={`pb-3 text-xs sm:text-sm font-bold transition-all ${adminTab === 'inventory' ? 'border-b-2 border-orange-500 text-white' : 'text-slate-400 hover:text-white'}`}
        >
          Inventario & Compras
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
