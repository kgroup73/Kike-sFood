import { useEffect, useMemo, useState, useCallback } from 'react';
import {
  Package, Plus, Search, ArrowUpDown, History,
  CheckCircle2, XCircle, Edit3, Trash2,
  UtensilsCrossed
} from 'lucide-react';
import { useTenant } from '../../hooks/useTenant';
import { useMenu } from '../../hooks/useMenu';
import { useToast } from '../../hooks/useToast';
import { api } from '../../services/api';
import {
  INGREDIENT_CATEGORIES,
  formatQuantity,
  getInventoryStatus,
  mergeIngredientsWithProducts
} from '../../lib/inventory';
import { formatCOP } from '../../lib/money';
import { InlineError } from '../ui/Screens';
import AdminShell, { primaryButton } from './AdminShell';
import IngredientFormModal from './inventory/IngredientFormModal';
import StockMovementModal from './inventory/StockMovementModal';
import MovementsHistoryModal from './inventory/MovementsHistoryModal';

export default function InventoryAdmin() {
  const { tenant } = useTenant();
  const showToast = useToast();
  const { products, ingredientsStock, error: menuError, reload: reloadMenu } = useMenu(tenant.id);

  const [rawInventory, setRawInventory] = useState([]);
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filtros
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'disponible' | 'bajo' | 'agotado'

  // Modales
  const [editingItem, setEditingItem] = useState(null);
  const [movementItem, setMovementItem] = useState(null);
  const [historyTarget, setHistoryTarget] = useState(null);
  const [showGlobalHistory, setShowGlobalHistory] = useState(false);
  const [busyKey, setBusyKey] = useState(null);

  // Carga de inventario y movimientos
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [items, movs] = await Promise.all([
        api.listIngredients ? api.listIngredients(tenant.id).catch(() => []) : Promise.resolve([]),
        api.listInventoryMovements ? api.listInventoryMovements(tenant.id).catch(() => []) : Promise.resolve([])
      ]);
      setRawInventory(items || []);
      setMovements(movs || []);
      setError(null);
    } catch (err) {
      setError(err.message || 'Error cargando datos de inventario');
    } finally {
      setLoading(false);
    }
  }, [tenant.id]);

  useEffect(() => {
    loadData();
  }, [loadData, ingredientsStock]);

  // Lista unificada de insumos (guardados + deducidos de la carta)
  const allIngredients = useMemo(() => {
    return mergeIngredientsWithProducts(rawInventory, products, ingredientsStock);
  }, [rawInventory, products, ingredientsStock]);

  // Estadísticas para KPIs
  const stats = useMemo(() => {
    let total = allIngredients.length;
    let agotados = 0;
    let bajos = 0;
    let disponibles = 0;
    let totalValue = 0;

    allIngredients.forEach((ing) => {
      const st = getInventoryStatus(ing);
      if (st.id === 'agotado') agotados++;
      else if (st.id === 'bajo') bajos++;
      else disponibles++;

      if (ing.currentStock > 0 && ing.unitCost > 0) {
        totalValue += ing.currentStock * ing.unitCost;
      }
    });

    return { total, disponibles, bajos, agotados, totalValue };
  }, [allIngredients]);

  // Filtrado de la lista
  const filteredIngredients = useMemo(() => {
    const q = search.trim().toLowerCase();
    return allIngredients.filter((ing) => {
      // Búsqueda por texto (nombre, categoría, platos que lo usan o proveedor)
      if (q) {
        const matchesName = ing.name.toLowerCase().includes(q);
        const matchesCategory = (ing.category || '').toLowerCase().includes(q);
        const matchesDishes = ing.usedBy.some((p) => p.toLowerCase().includes(q));
        const matchesSupplier = (ing.supplier || '').toLowerCase().includes(q);
        if (!matchesName && !matchesCategory && !matchesDishes && !matchesSupplier) return false;
      }

      // Filtro de categoría
      if (selectedCategory !== 'all' && ing.category !== selectedCategory) {
        return false;
      }

      // Filtro de estado
      if (statusFilter !== 'all') {
        const st = getInventoryStatus(ing);
        if (st.id !== statusFilter) return false;
      }

      return true;
    });
  }, [allIngredients, search, selectedCategory, statusFilter]);

  // Toggle directo de Agotado / Disponible
  const handleToggleSoldOut = async (ing) => {
    const nextSoldOut = !ing.isSoldOut;
    setBusyKey(ing.key);
    try {
      if (api.setIngredientStock) {
        await api.setIngredientStock({
          name: ing.name,
          soldOut: nextSoldOut
        });
      }
      if (api.saveIngredient && ing.isPersisted) {
        await api.saveIngredient(tenant.id, {
          ...ing,
          isSoldOut: nextSoldOut
        });
      }
      await Promise.all([loadData(), reloadMenu()]);
      showToast(
        nextSoldOut
          ? `"${ing.name}" marcado como agotado (platos deshabilitados en carta)`
          : `"${ing.name}" restablecido como disponible`,
        'success'
      );
    } catch (err) {
      showToast(err.message || 'No se pudo actualizar el estado', 'error');
    } finally {
      setBusyKey(null);
    }
  };

  // Guardar ingrediente (Crear / Editar)
  const handleSaveIngredient = async (itemData) => {
    if (api.saveIngredient) {
      await api.saveIngredient(tenant.id, itemData);
    }
    await Promise.all([loadData(), reloadMenu()]);
    showToast(`Insumo "${itemData.name}" guardado correctamente`, 'success');
  };

  // Registrar movimiento
  const handleRegisterMovement = async (movData) => {
    if (api.registerStockMovement) {
      await api.registerStockMovement(tenant.id, movData);
    }
    await Promise.all([loadData(), reloadMenu()]);
    showToast('Movimiento de inventario registrado con éxito', 'success');
  };

  // Eliminar ingrediente
  const handleDeleteIngredient = async (ing) => {
    if (!window.confirm(`¿Seguro que deseas eliminar "${ing.name}" del inventario?`)) return;
    setBusyKey(ing.key);
    try {
      if (api.deleteIngredient) {
        await api.deleteIngredient(tenant.id, ing.key);
      }
      await Promise.all([loadData(), reloadMenu()]);
      showToast(`Insumo "${ing.name}" eliminado`, 'success');
    } catch (err) {
      showToast(err.message || 'Error eliminando el insumo', 'error');
    } finally {
      setBusyKey(null);
    }
  };

  return (
    <AdminShell
      title="Inventario"
      subtitle="Control de materias primas, existencias, entradas de compras y disponibilidad automática en la carta."
      actions={
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setShowGlobalHistory(true)}
            className="btn btn-quiet"
          >
            <History className="w-4 h-4" /> Movimientos ({movements.length})
          </button>
          <button
            type="button"
            onClick={() => setEditingItem({})}
            className={primaryButton}
          >
            <Plus className="w-4 h-4" /> Nuevo insumo
          </button>
        </div>
      }
    >
      {(error || menuError) && (
        <InlineError message={error || menuError} onRetry={() => { loadData(); reloadMenu(); }} />
      )}

      {/* Tarjetas KPI */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="surface px-4 py-3">
          <p className="text-sm text-suave">Total de insumos</p>
          <p className="precio font-extrabold text-3xl leading-tight">{stats.total}</p>
        </div>
        <div className="surface px-4 py-3">
          <p className="text-sm text-suave">Disponibles</p>
          <p className="precio font-extrabold text-3xl leading-tight text-hoja">{stats.disponibles}</p>
        </div>
        <div className="surface px-4 py-3">
          <p className="text-sm text-suave">Stock bajo / Alerta</p>
          <p className="precio font-extrabold text-3xl leading-tight text-aviso">{stats.bajos}</p>
        </div>
        <div className="surface px-4 py-3">
          <p className="text-sm text-suave">Agotados en carta</p>
          <p className="precio font-extrabold text-3xl leading-tight text-aji">{stats.agotados}</p>
        </div>
      </div>

      {/* Barra de Filtros y Búsqueda */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Campo de búsqueda */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-suave absolute left-3.5 top-1/2 -translate-y-1/2" aria-hidden="true" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por insumo, categoría o platillo..."
              aria-label="Buscar insumo"
              className="field !pl-10 w-full"
            />
          </div>

          {/* Selector de estado */}
          <div className="inline-flex p-1 rounded-full bg-linea/60 self-start sm:self-auto overflow-x-auto" role="tablist">
            {[
              ['all', 'Todos', stats.total],
              ['disponible', 'Disponibles', stats.disponibles],
              ['bajo', 'Stock bajo', stats.bajos],
              ['agotado', 'Agotados', stats.agotados]
            ].map(([id, label, count]) => (
              <button
                key={id}
                role="tab"
                aria-selected={statusFilter === id}
                onClick={() => setStatusFilter(id)}
                className={`h-9 px-3.5 rounded-full font-bold text-sm flex items-center gap-1.5 transition-colors whitespace-nowrap ${
                  statusFilter === id ? 'bg-plato text-tinta shadow-sm' : 'text-suave hover:text-tinta'
                }`}
              >
                <span>{label}</span>
                <span className="precio text-xs px-1.5 py-0.2 rounded-full bg-linea text-tinta">{count}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Categorías (Pills) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-xl font-bold text-xs shrink-0 transition-colors ${
              selectedCategory === 'all'
                ? 'bg-tinta text-mantel'
                : 'bg-mantel border border-linea text-suave hover:text-tinta'
            }`}
          >
            Todas las categorías
          </button>
          {INGREDIENT_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs shrink-0 transition-colors ${
                selectedCategory === cat.id
                  ? 'bg-tinta text-mantel'
                  : 'bg-mantel border border-linea text-suave hover:text-tinta'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Lista de Insumos */}
      {loading ? (
        <div className="py-16 px-6 text-center text-suave border border-linea surface rounded-3xl space-y-3">
          <div className="w-8 h-8 mx-auto border-3 border-linea border-t-maracuya rounded-full animate-spin" />
          <p className="text-sm font-semibold">Cargando inventario y materias primas...</p>
        </div>
      ) : filteredIngredients.length ? (
        <div className="surface divide-y divide-linea overflow-hidden shadow-sm">
          {filteredIngredients.map((ing) => {
            const status = getInventoryStatus(ing);
            const isBusy = busyKey === ing.key;
            const hasDishes = ing.usedBy?.length > 0;

            return (
              <article
                key={ing.key}
                className={`p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors hover:bg-mantel/30 ${
                  ing.isSoldOut ? 'border-l-4 border-aji bg-aji/[0.02]' : ''
                }`}
              >
                {/* Información principal */}
                <div className="min-w-0 flex-1 space-y-1.5">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h3 className="font-bold text-lg text-tinta leading-tight">{ing.name}</h3>
                    <span className={status.badgeClass}>{status.label}</span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-mantel border border-linea text-suave capitalize">
                      {ing.category}
                    </span>
                    {ing.autoDeplete && (
                      <span className="text-xs px-2 py-0.5 rounded-md bg-hoja/10 text-hoja font-bold" title="Si el stock llega a 0, se agota solo en la carta">
                        Auto-agotable
                      </span>
                    )}
                  </div>

                  {/* Platos que lo usan */}
                  <div className="flex items-center gap-1.5 text-sm text-suave">
                    <UtensilsCrossed className="w-3.5 h-3.5 shrink-0" />
                    {hasDishes ? (
                      <span className="truncate">
                        Lo usan: <strong className="text-tinta font-semibold">{ing.usedBy.join(', ')}</strong>
                      </span>
                    ) : (
                      <span className="italic">No está vinculado a ningún platillo todavía</span>
                    )}
                  </div>

                  {ing.supplier && (
                    <p className="text-xs text-suave">
                      Proveedor: <span className="font-semibold text-tinta">{ing.supplier}</span>
                      {ing.unitCost > 0 && ` · Costo aprox: ${formatCOP(ing.unitCost)} / ${ing.unit}`}
                    </p>
                  )}
                </div>

                {/* Stock actual & Mínimo */}
                <div className="flex items-center justify-between md:justify-end gap-6 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-linea">
                  <div className="text-left md:text-right">
                    <p className="text-xs text-suave">Existencias</p>
                    <p className={`precio font-extrabold text-2xl leading-none ${status.tone}`}>
                      {formatQuantity(ing.currentStock, ing.unit)}
                    </p>
                    {ing.minStock > 0 && (
                      <p className="text-xs text-suave mt-0.5">
                        Alerta mín: {formatQuantity(ing.minStock, ing.unit)}
                      </p>
                    )}
                  </div>

                  {/* Botones de acción */}
                  <div className="flex items-center gap-1.5">
                    {/* Botón rápido de Movimiento de Stock (+/-) */}
                    <button
                      type="button"
                      onClick={() => setMovementItem(ing)}
                      className="btn btn-sm btn-quiet"
                      title="Registrar entrada o ajuste de stock"
                    >
                      <ArrowUpDown className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Stock</span>
                    </button>

                    {/* Switch directo Agotar / Reponer */}
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => handleToggleSoldOut(ing)}
                      className={`btn btn-sm ${
                        ing.isSoldOut ? 'btn-primary' : 'btn-danger'
                      }`}
                      title={ing.isSoldOut ? 'Marcar como disponible en carta' : 'Marcar como agotado en carta'}
                    >
                      {ing.isSoldOut ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Reponer</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Agotar</span>
                        </>
                      )}
                    </button>

                    {/* Editar ingrediente */}
                    <button
                      type="button"
                      onClick={() => setEditingItem(ing)}
                      className="icon-btn"
                      title="Editar ficha del insumo"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>

                    {/* Historial de este insumo */}
                    <button
                      type="button"
                      onClick={() => setHistoryTarget(ing)}
                      className="icon-btn"
                      title="Ver historial de movimientos"
                    >
                      <History className="w-4 h-4" />
                    </button>

                    {/* Eliminar si está guardado formalmente */}
                    {ing.isPersisted && (
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => handleDeleteIngredient(ing)}
                        className="icon-btn hover:!text-aji hover:!bg-aji/10"
                        title="Eliminar insumo del catálogo"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="py-16 px-6 text-center text-suave border-2 border-dashed border-linea rounded-3xl space-y-3">
          <Package className="w-10 h-10 mx-auto text-suave/50" />
          <h3 className="font-display font-bold text-xl text-tinta">No hay insumos que coincidan</h3>
          <p className="text-sm max-w-md mx-auto">
            {search || selectedCategory !== 'all' || statusFilter !== 'all'
              ? 'Prueba cambiando los filtros o el término de búsqueda.'
              : 'Empieza agregando tu primer ingrediente para llevar el control de stock y compras.'}
          </p>
          <button
            type="button"
            onClick={() => setEditingItem({})}
            className={`${primaryButton} mx-auto`}
          >
            <Plus className="w-4 h-4" /> Crear primer ingrediente
          </button>
        </div>
      )}

      {/* Modal de Crear / Editar Ingrediente */}
      {editingItem && (
        <IngredientFormModal
          ingredient={editingItem}
          onClose={() => setEditingItem(null)}
          onSave={handleSaveIngredient}
        />
      )}

      {/* Modal de Movimiento de Stock */}
      {movementItem && (
        <StockMovementModal
          ingredient={movementItem}
          onClose={() => setMovementItem(null)}
          onSave={handleRegisterMovement}
        />
      )}

      {/* Modal de Historial de Movimientos de un ingrediente */}
      {historyTarget && (
        <MovementsHistoryModal
          movements={movements}
          ingredient={historyTarget}
          onClose={() => setHistoryTarget(null)}
        />
      )}

      {/* Modal de Historial Global */}
      {showGlobalHistory && (
        <MovementsHistoryModal
          movements={movements}
          onClose={() => setShowGlobalHistory(false)}
        />
      )}
    </AdminShell>
  );
}
