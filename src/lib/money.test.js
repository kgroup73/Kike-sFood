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

  it('tasa efectiva 0 cuando el restaurante no es responsable', () => {
    expect(effectiveTaxRate({ taxType: 'NINGUNO', taxRate: 8 })).toBe(0);
    expect(effectiveTaxRate({ taxType: 'INC', taxRate: 8 })).toBe(8);
  });
});
