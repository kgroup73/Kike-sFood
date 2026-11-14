import { describe, it, expect } from 'vitest';
import { api } from '../services/api';

describe('Analytics & Dashboard API (Preparación Local)', () => {
  it('obtiene el reporte de ventas por periodo con métricas tributarias y desglose de medios de pago', async () => {
    const data = await api.getSalesAnalytics({ period: 'month' });
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);

    const first = data[0];
    expect(first).toHaveProperty('period_label');
    expect(first).toHaveProperty('total_sales');
    expect(first).toHaveProperty('invoice_count');
    expect(first).toHaveProperty('average_ticket');
    expect(first).toHaveProperty('cash_sales');
    expect(first).toHaveProperty('card_sales');
    expect(first).toHaveProperty('transfer_sales');
    expect(first).toHaveProperty('total_tax');
    expect(first).toHaveProperty('total_tip');
  });

  it('obtiene el ranking de los platillos más vendidos con volumen y facturación', async () => {
    const top = await api.getTopSellingProducts({ limit: 5 });
    expect(Array.isArray(top)).toBe(true);
    expect(top.length).toBeLessThanOrEqual(5);

    const bestSeller = top[0];
    expect(bestSeller).toHaveProperty('product_name');
    expect(bestSeller).toHaveProperty('category_name');
    expect(bestSeller).toHaveProperty('total_quantity');
    expect(bestSeller).toHaveProperty('total_revenue');
    expect(bestSeller.total_quantity).toBeGreaterThan(0);
  });

  it('obtiene el comportamiento de inventario con alertas de stock mínimo y costo de mermas', async () => {
    const inv = await api.getInventoryAnalytics();
    expect(Array.isArray(inv)).toBe(true);
    expect(inv.length).toBeGreaterThan(0);

    const item = inv[0];
    expect(item).toHaveProperty('ingredient_name');
    expect(item).toHaveProperty('current_stock');
    expect(item).toHaveProperty('min_stock');
    expect(item).toHaveProperty('unit_cost');
    expect(item).toHaveProperty('is_low_stock');
    expect(item).toHaveProperty('waste_cost');
  });

  it('calcula el Food Cost % y margen real por platillo basado en escandallos', async () => {
    const foodCost = await api.getFoodCostAnalytics();
    expect(Array.isArray(foodCost)).toBe(true);
    expect(foodCost.length).toBeGreaterThan(0);

    const dish = foodCost[0];
    expect(dish).toHaveProperty('product_name');
    expect(dish).toHaveProperty('sale_price');
    expect(dish).toHaveProperty('recipe_cost');
    expect(dish).toHaveProperty('gross_profit');
    expect(dish).toHaveProperty('food_cost_percentage');
    expect(dish.gross_profit).toBe(dish.sale_price - dish.recipe_cost);
  });

  it('permite registrar la ficha técnica de un platillo', async () => {
    const result = await api.saveProductRecipe({
      productId: 'p1',
      items: [
        { ingredientName: 'Carne Angus Molida', quantity: 0.18, unit: 'kg' },
        { ingredientName: 'Pan Brioche', quantity: 1, unit: 'unidad' }
      ]
    });
    expect(result).toHaveProperty('ok', true);
    expect(result.count).toBe(2);
  });
});
