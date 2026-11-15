import { useState, useEffect, useMemo } from 'react';
import {
  TrendingUp, BarChart3, DollarSign, Receipt, Calendar,
  AlertTriangle, Package, PieChart, Award, ArrowUpRight,
  UtensilsCrossed, Sparkles, RefreshCw, Layers
} from 'lucide-react';
import AdminShell from './AdminShell';
import { api, isDemoMode } from '../../services/api';
import { formatCOP } from '../../lib/money';

const PERIODS = [
  { key: 'day', label: 'Por Día (Últimos 7 días)' },
  { key: 'week', label: 'Por Semana (Últimas 4 semanas)' },
  { key: 'month', label: 'Por Mes (Últimos 6 meses)' }
];

export default function AnalyticsDashboard() {
  const [period, setPeriod] = useState('month');
  const [loading, setLoading] = useState(true);
  const [salesData, setSalesData] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [inventoryData, setInventoryData] = useState([]);
  const [foodCostData, setFoodCostData] = useState([]);
  const [activeTab, setActiveTab] = useState('ventas'); // 'ventas' | 'inventario' | 'escandallos'

  const loadData = async (selectedPeriod) => {
    setLoading(true);
    try {
      const [sales, top, inv, food] = await Promise.all([
        api.getSalesAnalytics({ period: selectedPeriod }),
        api.getTopSellingProducts({ limit: 6 }),
        api.getInventoryAnalytics(),
        api.getFoodCostAnalytics()
      ]);
      setSalesData(sales || []);
      setTopProducts(top || []);
      setInventoryData(inv || []);
      setFoodCostData(food || []);
    } catch (err) {
      console.error('Error al cargar analítica:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(period);
  }, [period]);

  // Agregados del periodo seleccionado
  const totals = useMemo(() => {
    if (!salesData.length) return { sales: 0, count: 0, avgTicket: 0, cash: 0, card: 0, transfer: 0, tax: 0, tip: 0 };
    const sales = salesData.reduce((acc, row) => acc + (row.total_sales || 0), 0);
    const count = salesData.reduce((acc, row) => acc + (row.invoice_count || 0), 0);
    const cash = salesData.reduce((acc, row) => acc + (row.cash_sales || 0), 0);
    const card = salesData.reduce((acc, row) => acc + (row.card_sales || 0), 0);
    const transfer = salesData.reduce((acc, row) => acc + (row.transfer_sales || 0), 0);
    const tax = salesData.reduce((acc, row) => acc + (row.total_tax || 0), 0);
    const tip = salesData.reduce((acc, row) => acc + (row.total_tip || 0), 0);
    const avgTicket = count > 0 ? Math.round(sales / count) : 0;
    return { sales, count, avgTicket, cash, card, transfer, tax, tip };
  }, [salesData]);

  // Escala para el gráfico de barras
  const maxSale = useMemo(() => {
    return Math.max(...salesData.map((d) => d.total_sales || 0), 1);
  }, [salesData]);

  // Alertas de stock crítico
  const lowStockItems = useMemo(() => {
    return inventoryData.filter((i) => i.is_low_stock);
  }, [inventoryData]);

  const totalWasteCost = useMemo(() => {
    return inventoryData.reduce((acc, i) => acc + (i.waste_cost || 0), 0);
  }, [inventoryData]);

  return (
    <AdminShell
      title="Métricas y Analítica"
      subtitle="Comportamiento de ventas, facturación, productos estrella, inventario y costos de recetas (Food Cost)."
      actions={
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-maracuya/20 text-maracuya border border-maracuya/30">
            <Sparkles className="w-3.5 h-3.5" aria-hidden="true" /> Datos Simulados (Muestreo Activo)
          </span>
          <button
            onClick={() => loadData(period)}
            className="btn btn-outline py-1.5 px-3 text-xs flex items-center gap-1.5"
            title="Refrescar métricas"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} aria-hidden="true" />
            Actualizar
          </button>
        </div>
      }
    >
      <div className="space-y-8">
        {/* Selector de sub-sección / pestañas */}
        <div className="flex border-b border-linea gap-6 text-sm font-bold">
          <button
            onClick={() => setActiveTab('ventas')}
            className={`pb-3 border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'ventas' ? 'border-hoja text-hoja' : 'border-transparent text-suave hover:text-tinta'
            }`}
          >
            <TrendingUp className="w-4 h-4" aria-hidden="true" />
            Ventas y Facturación
          </button>
          <button
            onClick={() => setActiveTab('inventario')}
            className={`pb-3 border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'inventario' ? 'border-hoja text-hoja' : 'border-transparent text-suave hover:text-tinta'
            }`}
          >
            <Package className="w-4 h-4" aria-hidden="true" />
            Inventario y Mermas
            {lowStockItems.length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-aji text-white font-bold">
                {lowStockItems.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('escandallos')}
            className={`pb-3 border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'escandallos' ? 'border-hoja text-hoja' : 'border-transparent text-suave hover:text-tinta'
            }`}
          >
            <PieChart className="w-4 h-4" aria-hidden="true" />
            Food Cost & Rentabilidad
          </button>
        </div>

        {/* -------------------- TAB 1: VENTAS Y FACTURACIÓN -------------------- */}
        {activeTab === 'ventas' && (
          <div className="space-y-8">
            {/* Controles de Período */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-mantel/60 p-4 rounded-xl border border-linea">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-hoja" aria-hidden="true" />
                <span className="font-bold text-sm">Visualizar periodo:</span>
              </div>
              <div className="inline-flex rounded-lg p-1 bg-plato border border-linea text-xs font-bold w-full sm:w-auto">
                {PERIODS.map((p) => (
                  <button
                    key={p.key}
                    onClick={() => setPeriod(p.key)}
                    className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-md transition-colors ${
                      period === p.key ? 'bg-tinta text-mantel shadow-sm' : 'text-suave hover:text-tinta'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="surface p-5 rounded-2xl border border-linea space-y-2">
                <div className="flex items-center justify-between text-suave">
                  <span className="text-xs font-bold uppercase tracking-wider">Ventas Totales</span>
                  <DollarSign className="w-4 h-4 text-hoja" aria-hidden="true" />
                </div>
                <p className="text-2xl sm:text-3xl font-display font-black text-tinta" data-testid="kpi-total-sales">
                  {formatCOP(totals.sales)}
                </p>
                <p className="text-xs text-suave">Periodo actual acumulado</p>
              </div>

              <div className="surface p-5 rounded-2xl border border-linea space-y-2">
                <div className="flex items-center justify-between text-suave">
                  <span className="text-xs font-bold uppercase tracking-wider">Ticket Promedio</span>
                  <Receipt className="w-4 h-4 text-hoja" aria-hidden="true" />
                </div>
                <p className="text-2xl sm:text-3xl font-display font-black text-tinta" data-testid="kpi-avg-ticket">
                  {formatCOP(totals.avgTicket)}
                </p>
                <p className="text-xs text-suave">Por cada cuenta facturada</p>
              </div>

              <div className="surface p-5 rounded-2xl border border-linea space-y-2">
                <div className="flex items-center justify-between text-suave">
                  <span className="text-xs font-bold uppercase tracking-wider">Comprobantes</span>
                  <BarChart3 className="w-4 h-4 text-hoja" aria-hidden="true" />
                </div>
                <p className="text-2xl sm:text-3xl font-display font-black text-tinta" data-testid="kpi-invoice-count">
                  {totals.count}
                </p>
                <p className="text-xs text-suave">Facturas y tiquetes POS</p>
              </div>

              <div className="surface p-5 rounded-2xl border border-linea space-y-2">
                <div className="flex items-center justify-between text-suave">
                  <span className="text-xs font-bold uppercase tracking-wider">Propinas Voluntarias</span>
                  <Award className="w-4 h-4 text-hoja" aria-hidden="true" />
                </div>
                <p className="text-2xl sm:text-3xl font-display font-black text-tinta" data-testid="kpi-total-tips">
                  {formatCOP(totals.tip)}
                </p>
                <p className="text-xs text-suave">Ley 1935 (recaudo para staff)</p>
              </div>
            </div>

            {/* Gráfico de Barras SVG (Comportamiento de ventas por intervalo) */}
            <div className="surface p-6 rounded-2xl border border-linea space-y-6">
              <div className="flex justify-between items-center">
                <div className="space-y-0.5">
                  <h3 className="font-bold text-lg text-tinta">Curva de Ventas por {period === 'day' ? 'Día' : period === 'week' ? 'Semana' : 'Mes'}</h3>
                  <p className="text-xs text-suave">Distribución temporal y volumen transaccional</p>
                </div>
                <span className="text-xs font-bold px-2.5 py-1 rounded bg-mantel border border-linea text-suave">
                  Pico: {formatCOP(maxSale)}
                </span>
              </div>

              {/* Contenedor gráfico de barras responsivo */}
              <div className="pt-6 pb-2" data-testid="sales-chart-container">
                <div className="grid gap-2 sm:gap-4 items-end min-h-[220px]" style={{ gridTemplateColumns: `repeat(${salesData.length || 1}, minmax(0, 1fr))` }}>
                  {salesData.map((bar, idx) => {
                    const heightPercent = Math.max(12, Math.round((bar.total_sales / maxSale) * 100));
                    return (
                      <div key={idx} className="flex flex-col items-center gap-2 group relative">
                        {/* Tooltip flotante al pasar el mouse */}
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-12 z-20 pointer-events-none bg-tinta text-mantel text-[11px] rounded-lg py-1 px-2.5 shadow-lg whitespace-nowrap">
                          <p className="font-bold">{formatCOP(bar.total_sales)}</p>
                          <p className="text-[10px] opacity-80">{bar.invoice_count} comprobantes</p>
                        </div>

                        {/* Valor en la parte superior de la barra (desktop) */}
                        <span className="hidden md:block text-[11px] font-bold text-suave group-hover:text-hoja transition-colors">
                          {formatCOP(bar.total_sales)}
                        </span>

                        {/* Barra animada */}
                        <div className="w-full max-w-[54px] bg-mantel rounded-t-lg h-44 flex items-end overflow-hidden p-1 border border-linea/60">
                          <div
                            className="w-full bg-hoja group-hover:bg-hoja/80 rounded-t transition-all duration-500 shadow-sm"
                            style={{ height: `${heightPercent}%` }}
                          />
                        </div>

                        {/* Etiqueta del período */}
                        <span className="text-[11px] font-bold text-center text-suave truncate w-full group-hover:text-tinta">
                          {bar.period_label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Fila Doble: Desglose por Medio de Pago y Top Platillos */}
            <div className="grid lg:grid-cols-2 gap-8 items-start">
              {/* Medios de Pago */}
              <div className="surface p-6 rounded-2xl border border-linea space-y-5">
                <div className="space-y-1">
                  <h3 className="font-bold text-lg text-tinta flex items-center gap-2">
                    <PieChart className="w-5 h-5 text-hoja" aria-hidden="true" />
                    Medios de Pago
                  </h3>
                  <p className="text-xs text-suave">Distribución de recaudo por canal financiero</p>
                </div>

                {totals.sales > 0 ? (
                  <div className="space-y-4">
                    {/* Barra de distribución combinada */}
                    <div className="h-4 rounded-full overflow-hidden flex bg-mantel border border-linea">
                      <div
                        style={{ width: `${(totals.card / totals.sales) * 100}%` }}
                        className="bg-blue-500 transition-all duration-500"
                        title={`Tarjeta: ${formatCOP(totals.card)}`}
                      />
                      <div
                        style={{ width: `${(totals.cash / totals.sales) * 100}%` }}
                        className="bg-emerald-500 transition-all duration-500"
                        title={`Efectivo: ${formatCOP(totals.cash)}`}
                      />
                      <div
                        style={{ width: `${(totals.transfer / totals.sales) * 100}%` }}
                        className="bg-purple-500 transition-all duration-500"
                        title={`Transferencia: ${formatCOP(totals.transfer)}`}
                      />
                    </div>

                    {/* Desglose individual */}
                    <div className="space-y-3 pt-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full bg-blue-500 shrink-0" />
                          <span className="font-medium">Tarjeta Débito / Crédito</span>
                        </span>
                        <div className="text-right">
                          <span className="font-bold">{formatCOP(totals.card)}</span>
                          <span className="text-xs text-suave block">
                            {totals.sales > 0 ? Math.round((totals.card / totals.sales) * 100) : 0}%
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full bg-emerald-500 shrink-0" />
                          <span className="font-medium">Efectivo en Caja</span>
                        </span>
                        <div className="text-right">
                          <span className="font-bold">{formatCOP(totals.cash)}</span>
                          <span className="text-xs text-suave block">
                            {totals.sales > 0 ? Math.round((totals.cash / totals.sales) * 100) : 0}%
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full bg-purple-500 shrink-0" />
                          <span className="font-medium">Transferencia (Nequi / Daviplata / Bancolombia)</span>
                        </span>
                        <div className="text-right">
                          <span className="font-bold">{formatCOP(totals.transfer)}</span>
                          <span className="text-xs text-suave block">
                            {totals.sales > 0 ? Math.round((totals.transfer / totals.sales) * 100) : 0}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-suave">Sin registros de ventas en este rango.</p>
                )}
              </div>

              {/* Platillos Estrella (Top Sellers) */}
              <div className="surface p-6 rounded-2xl border border-linea space-y-5">
                <div className="space-y-1">
                  <h3 className="font-bold text-lg text-tinta flex items-center gap-2">
                    <UtensilsCrossed className="w-5 h-5 text-hoja" aria-hidden="true" />
                    Platillos Más Vendidos
                  </h3>
                  <p className="text-xs text-suave">Platos de mayor rotación y aporte a la facturación</p>
                </div>

                <div className="space-y-3">
                  {topProducts.map((dish, i) => {
                    const maxQty = Math.max(...topProducts.map((p) => p.total_quantity || 1));
                    const widthPct = Math.round((dish.total_quantity / maxQty) * 100);
                    return (
                      <div key={dish.product_id} className="p-2.5 rounded-xl bg-mantel/60 border border-linea/60 space-y-1.5">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="w-5 h-5 rounded-full bg-plato border border-linea flex items-center justify-center font-bold text-xs text-suave shrink-0">
                              {i + 1}
                            </span>
                            <span className="font-bold truncate text-tinta">{dish.product_name}</span>
                            <span className="text-[11px] text-suave px-1.5 py-0.2 rounded bg-plato border border-linea hidden sm:inline-block">
                              {dish.category_name}
                            </span>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="font-bold text-sm block">{formatCOP(dish.total_revenue)}</span>
                            <span className="text-xs text-suave">{dish.total_quantity} unidades</span>
                          </div>
                        </div>
                        {/* Barra de volumen relativo */}
                        <div className="w-full bg-plato h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-hoja h-full rounded-full transition-all duration-500"
                            style={{ width: `${widthPct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* -------------------- TAB 2: INVENTARIO Y MERMAS -------------------- */}
        {activeTab === 'inventario' && (
          <div className="space-y-6">
            {/* Tarjeta resumen de mermas y alertas */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="surface p-5 rounded-2xl border border-linea flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-aji/10 text-aji flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-6 h-6" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-xs text-suave font-bold uppercase tracking-wider">Insumos en Stock Crítico</p>
                  <p className="text-2xl font-black text-tinta" data-testid="crit-stock-count">
                    {lowStockItems.length} insumos
                  </p>
                  <p className="text-xs text-suave">Por debajo del stock mínimo configurado</p>
                </div>
              </div>

              <div className="surface p-5 rounded-2xl border border-linea flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-maracuya/10 text-maracuya flex items-center justify-center shrink-0">
                  <Package className="w-6 h-6" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-xs text-suave font-bold uppercase tracking-wider">Costo Acumulado por Mermas</p>
                  <p className="text-2xl font-black text-tinta" data-testid="waste-cost-total">
                    {formatCOP(totalWasteCost)}
                  </p>
                  <p className="text-xs text-suave">Desperdicios, caducidad y pérdidas registradas</p>
                </div>
              </div>
            </div>

            {/* Tabla de Existencias y Mermas */}
            <div className="surface rounded-2xl border border-linea overflow-hidden">
              <div className="p-5 border-b border-linea flex justify-between items-center">
                <h3 className="font-bold text-lg text-tinta">Control de Existencias & Muestreo de Consumo</h3>
                <span className="text-xs text-suave">{inventoryData.length} insumos monitoreados</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-mantel/80 text-suave text-xs uppercase tracking-wider border-b border-linea">
                    <tr>
                      <th className="py-3 px-4">Insumo</th>
                      <th className="py-3 px-4">Categoría</th>
                      <th className="py-3 px-4 text-right">Existencia Actual</th>
                      <th className="py-3 px-4 text-right">Mínimo Sugerido</th>
                      <th className="py-3 px-4 text-right">Costo Unitario</th>
                      <th className="py-3 px-4 text-right">Mermas Registradas</th>
                      <th className="py-3 px-4 text-center">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-linea">
                    {inventoryData.map((item) => (
                      <tr key={item.ingredient_key} className="hover:bg-mantel/40 transition-colors">
                        <td className="py-3 px-4 font-bold text-tinta">{item.ingredient_name}</td>
                        <td className="py-3 px-4 text-suave text-xs">{item.category}</td>
                        <td className="py-3 px-4 text-right font-bold">
                          {item.current_stock} {item.unit}
                        </td>
                        <td className="py-3 px-4 text-right text-suave">
                          {item.min_stock} {item.unit}
                        </td>
                        <td className="py-3 px-4 text-right text-suave">{formatCOP(item.unit_cost)}</td>
                        <td className="py-3 px-4 text-right">
                          <span className="font-medium text-aji">{item.total_waste} {item.unit}</span>
                          <span className="block text-[11px] text-suave">({formatCOP(item.waste_cost)})</span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          {item.is_low_stock ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-aji/10 text-aji border border-aji/30">
                              <AlertTriangle className="w-3 h-3" aria-hidden="true" /> Agotándose
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-hoja/10 text-hoja border border-hoja/30">
                              Óptimo
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* -------------------- TAB 3: FOOD COST & ESCANDALLOS -------------------- */}
        {activeTab === 'escandallos' && (
          <div className="space-y-6">
            <div className="surface p-6 rounded-2xl border border-linea space-y-2">
              <h3 className="font-bold text-lg text-tinta flex items-center gap-2">
                <PieChart className="w-5 h-5 text-hoja" aria-hidden="true" />
                Matriz de Escandallos y Food Cost %
              </h3>
              <p className="text-sm text-suave leading-relaxed max-w-3xl">
                El <strong>Food Cost %</strong> refleja qué porcentaje del precio de venta al público se destina directamente
                a los ingredientes. El estándar óptimo en gastronomía oscila entre el <strong>25% y 32%</strong>.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {foodCostData.map((dish) => {
                const fc = dish.food_cost_percentage;
                const isGreat = fc <= 28;
                const isFair = fc > 28 && fc <= 33;
                const badgeColor = isGreat
                  ? 'bg-hoja/10 text-hoja border-hoja/30'
                  : isFair
                  ? 'bg-maracuya/10 text-maracuya border-maracuya/30'
                  : 'bg-aji/10 text-aji border-aji/30';

                return (
                  <div key={dish.product_id} className="surface p-5 rounded-2xl border border-linea space-y-4">
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <h4 className="font-bold text-base text-tinta">{dish.product_name}</h4>
                        <span className="text-xs text-suave">{dish.category_name}</span>
                      </div>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold border ${badgeColor}`}>
                        {fc.toFixed(1)}% FC
                      </span>
                    </div>

                    <div className="space-y-2 pt-2 border-t border-linea text-xs">
                      <div className="flex justify-between">
                        <span className="text-suave">Precio de venta en carta:</span>
                        <span className="font-bold text-tinta">{formatCOP(dish.sale_price)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-suave">Costo de ingredientes (Receta):</span>
                        <span className="font-medium text-aji">{formatCOP(dish.recipe_cost)}</span>
                      </div>
                      <div className="flex justify-between pt-1 border-t border-linea/60 font-bold text-sm">
                        <span className="text-tinta">Margen Bruto de Contribución:</span>
                        <span className="text-hoja">{formatCOP(dish.gross_profit)}</span>
                      </div>
                    </div>

                    {/* Barra visual de costo vs margen */}
                    <div className="space-y-1">
                      <div className="w-full bg-mantel h-2 rounded-full overflow-hidden flex border border-linea/40">
                        <div
                          className="bg-aji/70 h-full"
                          style={{ width: `${fc}%` }}
                          title={`Costo: ${fc.toFixed(1)}%`}
                        />
                        <div
                          className="bg-hoja h-full"
                          style={{ width: `${100 - fc}%` }}
                          title={`Margen: ${(100 - fc).toFixed(1)}%`}
                        />
                      </div>
                      <div className="flex justify-between text-[10px] text-suave">
                        <span>Costo ({fc.toFixed(0)}%)</span>
                        <span>Margen ({(100 - fc).toFixed(0)}%)</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
