import { describe, it, expect } from 'vitest';
import { canTransition, ORDER_STATUS as S } from './orderStatus';
import { planLevel, hasFeature } from './plans';
import { canAccess, homeSectionFor } from './roles';
import { buildMasterIngredientList, deriveProductsWithStock, getAffectedProducts } from './inventory';
import { buildStories } from './catalog';

describe('estados de pedido', () => {
  it('sigue el flujo de cocina e incluye Listo', () => {
    expect(canTransition(S.PENDING, S.PREPARING)).toBe(true);
    expect(canTransition(S.PREPARING, S.READY)).toBe(true);
    expect(canTransition(S.READY, S.TO_PAY)).toBe(true);
    expect(canTransition(S.PENDING, S.PAID)).toBe(false);
    expect(canTransition(S.PAID, S.CANCELLED)).toBe(false);
  });
});

describe('planes y roles', () => {
  it('un plan desconocido no da acceso premium', () => {
    expect(planLevel('full')).toBe(0);
    expect(planLevel(undefined)).toBe(0);
    expect(hasFeature('intermedio', 'pos')).toBe(true);
    expect(hasFeature('intermedio', 'dian')).toBe(false);
  });

  it('cada rol ve solo sus secciones', () => {
    expect(canAccess('cocina', 'caja')).toBe(false);
    expect(canAccess('caja', 'caja')).toBe(true);
    expect(canAccess('caja', 'admin')).toBe(false);
    expect(homeSectionFor('cocina')).toBe('cocina');
    expect(homeSectionFor('owner')).toBe('admin');
  });
});

describe('inventario', () => {
  const products = [
    { id: 1, name: 'Burger', ingredients: ['Queso Brie', 'Pan'] },
    { id: 2, name: 'Tabla', ingredients: ['queso brie '] },
    { id: 3, name: 'Ensalada', ingredients: ['Lechuga'] }
  ];

  it('agrupa ingredientes sin distinguir mayúsculas', () => {
    const list = buildMasterIngredientList(products);
    const brie = list.find((i) => i.key === 'queso brie');
    expect(brie.usedBy).toEqual(['Burger', 'Tabla']);
  });

  it('un ingrediente agotado desactiva todos los platillos que lo usan', () => {
    const stock = { 'queso brie': { name: 'Queso Brie', soldOut: true } };
    const derived = deriveProductsWithStock(products, stock);
    expect(derived.filter((p) => p.soldOut).map((p) => p.name)).toEqual(['Burger', 'Tabla']);
    expect(getAffectedProducts(products, 'Queso Brie')).toEqual(['Burger', 'Tabla']);
  });

  it('las historias no muestran platillos agotados', () => {
    const stories = buildStories([
      { id: 1, name: 'A', isChef: true, rating: 5, available: true, soldOut: true },
      { id: 2, name: 'B', isPopular: true, rating: 4, available: true }
    ]);
    expect(stories.map((s) => s.productId)).toEqual([2]);
  });
});
