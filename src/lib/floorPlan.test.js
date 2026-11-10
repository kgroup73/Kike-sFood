import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DEFAULT_ENVIRONMENTS, environmentId, resolveTableLayout } from './environments';
import { groupAllActiveTables } from './billing';
import { localFloorPlanStore as store } from '../services/floorPlanStore';

describe('plano de sala: ubicación de mesas', () => {
  it('sin configuración sugiere zona por etiqueta o número y usa la forma del ambiente', () => {
    expect(resolveTableLayout({ label: '3' })).toEqual({ zone: 'salon', shape: 'square', capacity: 4 });
    expect(resolveTableLayout({ label: '8' })).toEqual({ zone: 'terraza', shape: 'round', capacity: 4 });
    expect(resolveTableLayout({ label: '12' })).toEqual({ zone: 'barra', shape: 'bar', capacity: 2 });
    expect(resolveTableLayout({ label: 'Terraza-1' }).zone).toBe('terraza');
  });

  it('lo guardado gana, y una zona que ya no existe vuelve a la sugerida', () => {
    expect(resolveTableLayout({ label: '12' }, { zone: 'salon', capacity: 6 })).toEqual({ zone: 'salon', shape: 'square', capacity: 6 });
    expect(resolveTableLayout({ label: '3' }, { zone: 'borrada' }).zone).toBe('salon');
    const soloVip = [{ id: 'vip', name: 'VIP', defaultShape: 'round', defaultCapacity: 6 }];
    expect(resolveTableLayout({ label: '12' }, {}, soloVip)).toEqual({ zone: 'vip', shape: 'round', capacity: 6 });
  });

  it('genera ids estables para los ambientes', () => {
    expect(environmentId('  Terraza VIP ')).toBe('terraza-vip');
    expect(environmentId('Salón & Barra')).toBe('salon-barra');
  });
});

describe('plano de sala: almacenamiento local', () => {
  beforeEach(() => localStorage.clear());

  it('separa el plano por restaurante y avisa los cambios', async () => {
    const onChange = vi.fn();
    const off = store.subscribeFloorPlan('r1', onChange);
    await store.saveTableLayout('r1', { t1: { zone: 'terraza', shape: 'round', capacity: 99 } });
    off();

    expect((await store.getFloorPlan('r1')).tables).toEqual({ t1: { zone: 'terraza', shape: 'round' } });
    expect((await store.getFloorPlan('r2')).tables).toEqual({});
    expect(onChange).toHaveBeenCalledTimes(1);

    await store.saveTableLayout('r1', { t1: null });
    expect((await store.getFloorPlan('r1')).tables).toEqual({});
  });

  it('valida los ambientes y no toca las constantes por defecto', async () => {
    await expect(store.saveEnvironments('r1', [])).rejects.toThrow(/al menos un ambiente/);
    const plan = await store.getFloorPlan('r1');
    plan.environments[0].name = 'cambiado';
    expect(DEFAULT_ENVIRONMENTS[0].name).toBe('Salón Principal');
    await store.saveEnvironments('r1', [...plan.environments, { id: 'vip', name: ' VIP ' }]);
    expect((await store.getFloorPlan('r1')).environments.at(-1)).toEqual({ id: 'vip', name: 'VIP', defaultShape: 'square', defaultCapacity: 4 });
  });
});

describe('caja: mesas activas en sala', () => {
  const order = (id, tableId, status, subtotal) => ({ id, tableId, tableLabel: tableId, status, subtotal, tip: 0, items: [] });

  it('agrupa por mesa, separa lo que sigue en cocina y pone primero lo listo para cobrar', () => {
    const groups = groupAllActiveTables([
      order(1, '2', 'Pendiente', 10),
      order(2, '2', 'Por Cobrar', 20),
      order(3, '5', 'Por Cobrar', 30),
      order(4, '7', 'Cobrado', 99)
    ]);
    expect(groups.map((g) => g.tableLabel)).toEqual(['5', '2']);
    expect(groups[0]).toMatchObject({ isReadyToPay: true, hasKitchenOrders: false, subtotal: 30 });
    expect(groups[1]).toMatchObject({ isReadyToPay: false, hasKitchenOrders: true, subtotal: 30 });
    expect(groups[1].kitchenOrders.map((o) => o.id)).toEqual([1]);
  });
});
