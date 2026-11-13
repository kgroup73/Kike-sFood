import { describe, it, expect, beforeAll } from 'vitest';
import { demoApi } from '../services/demo/demoApi';
import {
  formatQuantity,
  getInventoryStatus,
  mergeIngredientsWithProducts
} from '../lib/inventory';

const SLUG = 'la-trattoria';

describe('Lógica de inventario y existencias', () => {
  it('formatea cantidades respetando la unidad de medida', () => {
    expect(formatQuantity(5, 'kg')).toBe('5 kg');
    expect(formatQuantity(1.5, 'kg')).toBe('1.50 kg');
    expect(formatQuantity(12, 'unidad')).toBe('12 ud');
  });

  it('determina el estado de stock correctamente (Disponible, Stock bajo, Agotado)', () => {
    // Normal
    expect(getInventoryStatus({ currentStock: 10, minStock: 2, isSoldOut: false }).id).toBe('disponible');

    // Bajo
    expect(getInventoryStatus({ currentStock: 2, minStock: 3, isSoldOut: false }).id).toBe('bajo');

    // Agotado manual
    expect(getInventoryStatus({ currentStock: 10, minStock: 2, isSoldOut: true }).id).toBe('agotado');

    // Agotado automático por llegar a cero
    expect(getInventoryStatus({ currentStock: 0, minStock: 2, autoDeplete: true, isSoldOut: false }).id).toBe('agotado');
  });

  it('unifica insumos registrados y platillos vinculados', () => {
    const persisted = [
      { key: 'carne angus', name: 'Carne Angus', currentStock: 15, unit: 'kg', isSoldOut: false }
    ];
    const products = [
      { name: 'Burger', ingredients: ['Carne Angus', 'Queso Cheddar'] }
    ];
    const unified = mergeIngredientsWithProducts(persisted, products, {});

    const carne = unified.find((i) => i.key === 'carne angus');
    expect(carne).toBeDefined();
    expect(carne.usedBy).toContain('Burger');
    expect(carne.currentStock).toBe(15);

    // Queso Cheddar se incluye automáticamente aunque no estuviera guardado previamente
    const queso = unified.find((i) => i.key === 'queso cheddar');
    expect(queso).toBeDefined();
    expect(queso.usedBy).toContain('Burger');
  });
});

describe('API de gestión de inventario (demoApi)', () => {
  beforeAll(async () => {
    localStorage.clear();
    sessionStorage.clear();
    demoApi.resetDemo();
    await demoApi.loginStaff({ slug: SLUG, staffId: 'b0000000-0000-4000-8000-000000000001', pin: '1234' });
  });

  it('crea, edita y lista insumos en el inventario', async () => {
    const res = await demoApi.saveIngredient(null, {
      name: 'Pechuga de Pollo',
      category: 'carnes',
      unit: 'kg',
      currentStock: 20,
      minStock: 5,
      unitCost: 14000,
      autoDeplete: true,
      supplier: 'Avícola San Jorge'
    });
    expect(res.ok).toBe(true);

    const list = await demoApi.listIngredients();
    const pollo = list.find((i) => i.name === 'Pechuga de Pollo');
    expect(pollo).toBeDefined();
    expect(pollo.currentStock).toBe(20);
    expect(pollo.supplier).toBe('Avícola San Jorge');
  });

  it('registra entradas de mercancía (compra) y actualiza el stock', async () => {
    const res = await demoApi.registerStockMovement(null, {
      name: 'Pechuga de Pollo',
      type: 'ENTRADA',
      quantity: 10,
      cost: 140000,
      supplier: 'Avícola San Jorge',
      invoiceRef: 'FAC-991',
      note: 'Compra regular semanal'
    });

    expect(res.ok).toBe(true);
    expect(res.previousStock).toBe(20);
    expect(res.newStock).toBe(30);

    const movs = await demoApi.listInventoryMovements(null, 'pechuga de pollo');
    expect(movs.length).toBeGreaterThan(0);
    expect(movs[0].type).toBe('ENTRADA');
    expect(movs[0].quantity).toBe(10);
    expect(movs[0].supplier).toBe('Avícola San Jorge');
  });

  it('registra mermas y auto-agota el insumo si llega a 0 con autoDeplete', async () => {
    const res = await demoApi.registerStockMovement(null, {
      name: 'Pechuga de Pollo',
      type: 'MERMA',
      quantity: 30, // reduce los 30 kg a 0
      note: 'Falla en refrigeración'
    });

    expect(res.ok).toBe(true);
    expect(res.newStock).toBe(0);
    expect(res.isSoldOut).toBe(true);

    const menu = await demoApi.getMenu();
    expect(menu.ingredientsStock['pechuga de pollo']?.soldOut).toBe(true);
  });
});
