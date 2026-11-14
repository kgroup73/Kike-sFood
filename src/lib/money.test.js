import { describe, it, expect } from 'vitest';
import { formatCOP, splitTaxIncluded, computeTip, effectiveTaxRate } from './money';

describe('money', () => {
  it('formatea pesos colombianos sin decimales', () => {
    expect(formatCOP(34000)).toBe('$34.000');
    expect(formatCOP(1234.6)).toBe('$1.235');
    expect(formatCOP(undefined)).toBe('$0');
  });

  it('desglosa el INC del precio (no lo suma)', () => {
    // Mismo resultado que issue_invoice() en la BD
    expect(splitTaxIncluded(78000, 8)).toEqual({ base: 72222, tax: 5778, total: 78000 });
    expect(splitTaxIncluded(10800, 8)).toEqual({ base: 10000, tax: 800, total: 10800 });
    expect(splitTaxIncluded(50000, 0)).toEqual({ base: 50000, tax: 0, total: 50000 });
  });

  it('la base más el impuesto siempre suman el total', () => {
    for (let total = 0; total < 200000; total += 997) {
      const { base, tax } = splitTaxIncluded(total, 8);
      expect(base + tax).toBe(total);
    }
  });

  it('calcula la propina en pesos enteros', () => {
    expect(computeTip(78000, 10)).toBe(7800);
    expect(computeTip(12345, 10)).toBe(1235);
    expect(computeTip(12345, 0)).toBe(0);
  });

  describe('matriz tributaria colombiana table-driven (it.each)', () => {
    it.each([
      { total: 10800, rate: 8, expectedBase: 10000, expectedTax: 800, scenario: 'INC 8% comensal estándar' },
      { total: 21600, rate: 8, expectedBase: 20000, expectedTax: 1600, scenario: 'INC 8% consumo doble' },
      { total: 78000, rate: 8, expectedBase: 72222, expectedTax: 5778, scenario: 'INC 8% redondeo con decimal periódico' },
      { total: 15350, rate: 8, expectedBase: 14213, expectedTax: 1137, scenario: 'INC 8% cifra impar con centenas' },
      { total: 119000, rate: 19, expectedBase: 100000, expectedTax: 19000, scenario: 'IVA 19% estándar' },
      { total: 59500, rate: 19, expectedBase: 50000, expectedTax: 9500, scenario: 'IVA 19% consumo mediano' },
      { total: 50000, rate: 0, expectedBase: 50000, expectedTax: 0, scenario: 'Exento / No responsable (0%)' },
      { total: 0, rate: 8, expectedBase: 0, expectedTax: 0, scenario: 'Total cero con tasa INC 8%' },
    ])('$scenario: $total COP con tasa $rate% -> Base: $expectedBase, Impuesto: $expectedTax', ({ total, rate, expectedBase, expectedTax }) => {
      const result = splitTaxIncluded(total, rate);
      expect(result.base).toBe(expectedBase);
      expect(result.tax).toBe(expectedTax);
      expect(result.total).toBe(total);
      expect(result.base + result.tax).toBe(total);
    });
  });

  describe('cálculo de propinas voluntarias table-driven (it.each)', () => {
    it.each([
      { subtotal: 100000, tipRate: 10, expectedTip: 10000, desc: '10% sobre 100k' },
      { subtotal: 50000, tipRate: 10, expectedTip: 5000, desc: '10% sobre 50k' },
      { subtotal: 85500, tipRate: 10, expectedTip: 8550, desc: '10% sobre 85.500' },
      { subtotal: 85550, tipRate: 10, expectedTip: 8555, desc: '10% redondeado sobre 85.550' },
      { subtotal: 75000, tipRate: 5, expectedTip: 3750, desc: '5% sobre 75k' },
      { subtotal: 75000, tipRate: 15, expectedTip: 11250, desc: '15% sobre 75k' },
      { subtotal: 50000, tipRate: 0, expectedTip: 0, desc: '0% propina voluntaria rechazada' },
    ])('$desc ($tipRate% de $subtotal COP = $expectedTip)', ({ subtotal, tipRate, expectedTip }) => {
      expect(computeTip(subtotal, tipRate)).toBe(expectedTip);
    });
  });

  it('tasa efectiva 0 cuando el restaurante no es responsable', () => {
    expect(effectiveTaxRate({ taxType: 'NINGUNO', taxRate: 8 })).toBe(0);
    expect(effectiveTaxRate({ taxType: 'INC', taxRate: 8 })).toBe(8);
  });
});
