import { useCallback, useEffect, useState } from 'react';
import { useTenant } from '../../../hooks/useTenant';
import { useToast } from '../../../hooks/useToast';
import { api } from '../../../services/api';
import { useFloorPlan } from '../../../hooks/useFloorPlan';
import { tableUrl } from '../tableLinks';

/**
 * Custom Hook de Orquestación para Administración de Mesas (SoC - Capa 3).
 * Aísla la gestión de ambientes, adición de mesas por lotes,
 * sincronización del plano de sala y acciones de estado (activo/inactivo/eliminar).
 */
export function useTablesManager() {
  const { tenant } = useTenant();
  const showToast = useToast();
  const [tables, setTables] = useState([]);
  const [error, setError] = useState(null);
  const [stickersTarget, setStickersTarget] = useState(null);

  // Gestión de ambientes y ubicación de mesas (plano de sala compartido con la caja)
  const { environments, layoutOf, addEnvironment, saveLayout } = useFloorPlan(tenant?.id);
  const [newEnvName, setNewEnvName] = useState('');
  const [selectedEnvForNew, setSelectedEnvForNew] = useState('salon');
  const [addMode, setAddMode] = useState('quantity'); // 'quantity' | 'manual'
  const [newLabelManual, setNewLabelManual] = useState('');
  const [quantityToAdd, setQuantityToAdd] = useState(1);
  const [prefixCustom, setPrefixCustom] = useState('');
  const [activeEnvTab, setActiveEnvTab] = useState('all'); // 'all' | environment id

  const load = useCallback(async () => {
    if (!tenant?.id) return;
    try {
      setTables(await api.listTables(tenant.id));
      setError(null);
    } catch (err) {
      setError(err.message);
    }
  }, [tenant?.id]);

  useEffect(() => {
    load();
  }, [load]);

  const act = async (fn, ok) => {
    try {
      await fn();
      await load();
      if (ok) showToast(ok, 'success');
      return true;
    } catch (err) {
      showToast(err.message, 'error');
      return false;
    }
  };

  // Crear un nuevo ambiente
  const handleAddEnvironment = async (e) => {
    e.preventDefault();
    const trimmed = newEnvName.trim();
    if (!trimmed) return;
    try {
      const id = await addEnvironment(trimmed);
      setSelectedEnvForNew(id);
      setNewEnvName('');
      showToast(`Ambiente "${trimmed}" añadido`, 'success');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Agregar mesas (por lote/cantidad o manual)
  const handleAddTables = (e) => {
    e.preventDefault();
    let labels = [];

    if (addMode === 'quantity') {
      const qty = parseInt(quantityToAdd, 10);
      if (!qty || qty < 1) {
        showToast('Indica una cantidad válida de mesas', 'error');
        return;
      }

      // Detecta números existentes para continuar correlativo
      const existingNumbers = tables
        .map((t) => parseInt(t.label.replace(/\D/g, ''), 10))
        .filter((n) => !isNaN(n));
      const maxExisting = existingNumbers.length > 0 ? Math.max(...existingNumbers) : 0;

      const pfx = prefixCustom.trim();
      for (let i = 1; i <= qty; i++) {
        const nextNum = maxExisting + i;
        labels.push(pfx ? `${pfx}${nextNum}` : String(nextNum));
      }
    } else {
      labels = newLabelManual
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
    }

    if (!labels.length) return;

    const zone = environments.some((env) => env.id === selectedEnvForNew) ? selectedEnvForNew : environments[0]?.id;
    const create = async () => {
      const created = (await api.createTables(tenant.id, labels)) || [];
      if (created.length && zone) await saveLayout(Object.fromEntries(created.map((t) => [t.id, { zone }])));
    };
    act(create, labels.length === 1 ? `Mesa ${labels[0]} creada` : `${labels.length} mesas creadas`).then((done) => {
      if (done) {
        setNewLabelManual('');
        setQuantityToAdd(1);
      }
    });
  };

  // Cambiar ambiente asignado a una mesa existente
  const updateTableEnvironment = (tableId, tableLabel, zoneId) => {
    saveLayout({ [tableId]: { zone: zoneId } }).then(
      () => showToast(`Mesa ${tableLabel} reasignada`, 'success'),
      (err) => showToast(err.message, 'error')
    );
  };

  // Eliminar una mesa permanentemente
  const handleDeleteTable = (table) => {
    const ok = window.confirm(
      `¿Seguro que deseas eliminar la Mesa ${table.label}? Esta acción quitará la mesa del restaurante de forma definitiva.`
    );
    if (!ok) return;
    act(() => api.deleteTable(table.id), `Mesa ${table.label} eliminada`);
  };

  const copyTableLink = (table) => {
    const url = tableUrl(tenant.slug, table.token);
    navigator.clipboard.writeText(url);
    showToast(`Enlace copiado: Mesa ${table.label}`, 'success');
  };

  const toggleTableActive = (table) => {
    const nextState = !table.isActive;
    act(
      () => api.updateTable(table.id, { isActive: nextState }),
      `Mesa ${table.label} ${nextState ? 'activada' : 'desactivada'}`
    );
  };

  const activeTables = tables.filter((t) => t.isActive);

  // Agrupación de mesas por ambiente para vista estructurada
  const tablesByEnvironment = environments.map((env) => ({
    ...env,
    tables: tables.filter((t) => layoutOf(t).zone === env.id)
  }));

  const unassignedTables = tables.filter(
    (t) => !environments.some((env) => env.id === layoutOf(t).zone)
  );

  const displayedGroups =
    activeEnvTab === 'all'
      ? [
          ...tablesByEnvironment,
          ...(unassignedTables.length
            ? [{ id: 'unassigned', name: 'Sin ambiente asignado', tables: unassignedTables }]
            : [])
        ].filter((g) => g.tables.length > 0)
      : [
          tablesByEnvironment.find((g) => g.id === activeEnvTab) || {
            id: activeEnvTab,
            name: environments.find((e) => e.id === activeEnvTab)?.name || 'Ambiente',
            tables: tables.filter((t) => layoutOf(t).zone === activeEnvTab)
          }
        ];

  return {
    tenant,
    tables,
    activeTables,
    error,
    load,
    stickersTarget,
    setStickersTarget,
    environments,
    layoutOf,
    newEnvName,
    setNewEnvName,
    handleAddEnvironment,
    selectedEnvForNew,
    setSelectedEnvForNew,
    addMode,
    setAddMode,
    quantityToAdd,
    setQuantityToAdd,
    prefixCustom,
    setPrefixCustom,
    newLabelManual,
    setNewLabelManual,
    handleAddTables,
    activeEnvTab,
    setActiveEnvTab,
    displayedGroups,
    updateTableEnvironment,
    handleDeleteTable,
    copyTableLink,
    toggleTableActive
  };
}
