import { describe, it, expect } from 'vitest';
import {
  ProblemDetailsError,
  createValidationError,
  extractFieldErrors,
  toAppError,
  unwrap
} from '../services/errors';
import {
  validateProductDTO,
  validateTenantDTO,
  validateTableDTO,
  validateOrderDTO,
  categoryFromRow,
  productFromRow,
  productToRow
} from '../services/mappers';

describe('Fase 3: Contratos DTO y Estándar RFC 7807 (Problem Details)', () => {
  describe('ProblemDetailsError & RFC 7807 Specification', () => {
    it('instancia un ProblemDetailsError con los atributos canónicos de RFC 7807', () => {
      const error = new ProblemDetailsError({
        type: 'https://kikes.app/errors/out-of-stock',
        title: 'Insumo agotado',
        status: 409,
        detail: 'El insumo Salmón no tiene existencias suficientes',
        instance: '/orders/1045',
        fieldErrors: { salmon: 'Stock insuficiente' },
        code: 'STOCK_DEPLETED'
      });

      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe('ProblemDetailsError');
      expect(error.type).toBe('https://kikes.app/errors/out-of-stock');
      expect(error.title).toBe('Insumo agotado');
      expect(error.status).toBe(409);
      expect(error.detail).toBe('El insumo Salmón no tiene existencias suficientes');
      expect(error.fieldErrors).toEqual({ salmon: 'Stock insuficiente' });
      expect(error.code).toBe('STOCK_DEPLETED');
    });

    it('createValidationError produce un HTTP 422 con fieldErrors', () => {
      const err = createValidationError(
        { name: 'El nombre es obligatorio', price: 'Precio inválido' },
        'Datos del platillo incompletos'
      );

      expect(err.status).toBe(422);
      expect(err.title).toBe('Error de validación');
      expect(err.detail).toBe('Datos del platillo incompletos');
      expect(err.fieldErrors.name).toBe('El nombre es obligatorio');
      expect(err.fieldErrors.price).toBe('Precio inválido');
    });

    it('extractFieldErrors extrae fieldErrors de forma segura', () => {
      const rfcError = createValidationError({ label: 'Mesa duplicada' });
      expect(extractFieldErrors(rfcError)).toEqual({ label: 'Mesa duplicada' });

      expect(extractFieldErrors(new Error('Generic'))).toEqual({});
      expect(extractFieldErrors(null)).toEqual({});
    });

    it('toAppError traduce errores de restricción Postgres 23505 (Unique) a RFC 7807', () => {
      const pgError = {
        code: '23505',
        message: 'duplicate key value violates unique constraint "tenants_slug_key"'
      };
      const appErr = toAppError(pgError);

      expect(appErr).toBeInstanceOf(ProblemDetailsError);
      expect(appErr.status).toBe(409);
      expect(appErr.fieldErrors.slug).toContain('ya está en uso');
    });

    it('toAppError traduce errores de restricción Postgres 23502 (Not Null) a RFC 7807', () => {
      const pgError = {
        code: '23502',
        message: 'null value in column "name" violates not-null constraint',
        details: 'Failing row contains (null, 25000)'
      };
      const appErr = toAppError(pgError);

      expect(appErr).toBeInstanceOf(ProblemDetailsError);
      expect(appErr.status).toBe(422);
      expect(appErr.fieldErrors.name).toContain('es obligatorio');
    });

    it('unwrap desenvuelve datos exitosos o lanza ProblemDetailsError', () => {
      expect(unwrap({ data: { id: 1 }, error: null })).toEqual({ id: 1 });

      expect(() =>
        unwrap({ data: null, error: { code: '23505', message: 'duplicate key value violates unique constraint "products_name_key"' } })
      ).toThrow(ProblemDetailsError);
    });
  });

  describe('Validación Canónica de DTOs (mappers.js)', () => {
    it('validateProductDTO valida presencia de nombre y precio numérico no negativo', () => {
      const invalid = validateProductDTO({ name: '', price: -100 });
      expect(invalid.valid).toBe(false);
      expect(invalid.errors.name).toBeDefined();
      expect(invalid.errors.price).toBeDefined();

      const valid = validateProductDTO({ name: 'Pizza Margarita', price: 35000, ingredients: ['Queso', 'Tomate'] });
      expect(valid.valid).toBe(true);
      expect(valid.errors).toEqual({});
    });

    it('validateTenantDTO exige nombre y slug', () => {
      const invalid = validateTenantDTO({ name: '', slug: '' });
      expect(invalid.valid).toBe(false);
      expect(invalid.errors.name).toBeDefined();
      expect(invalid.errors.slug).toBeDefined();

      const valid = validateTenantDTO({ name: 'La Trattoria', slug: 'la-trattoria' });
      expect(valid.valid).toBe(true);
      expect(valid.errors).toEqual({});
    });

    it('validateTableDTO exige etiqueta o número de mesa', () => {
      const invalid = validateTableDTO({ label: '  ' });
      expect(invalid.valid).toBe(false);
      expect(invalid.errors.label).toBeDefined();

      const valid = validateTableDTO({ label: '4' });
      expect(valid.valid).toBe(true);
    });

    it('validateOrderDTO exige asignación a mesa e items no vacíos', () => {
      const invalid = validateOrderDTO({ items: [] });
      expect(invalid.valid).toBe(false);
      expect(invalid.errors.table).toBeDefined();
      expect(invalid.errors.items).toBeDefined();

      const valid = validateOrderDTO({ tableLabel: 'Mesa 4', items: [{ name: 'Café', quantity: 1 }] });
      expect(valid.valid).toBe(true);
    });

    it('categoryFromRow mapea columnas snake_case a camelCase', () => {
      const row = { id: 'c-1', name: 'Postres', sort_order: 3, print_station_id: 'st-postres' };
      const dto = categoryFromRow(row);

      expect(dto).toEqual({
        id: 'c-1',
        name: 'Postres',
        sortOrder: 3,
        printStationId: 'st-postres'
      });
    });

    it('re-exporta productFromRow y productToRow manteniendo paridad de catálogo', () => {
      const rawRow = {
        id: 'prod-1',
        tenant_id: 'ten-1',
        category_id: 'cat-1',
        name: 'Risotto',
        price: '32000',
        available: true,
        details: { rating: '4.9' }
      };
      const dto = productFromRow(rawRow, 'Platos fuertes');
      expect(dto.name).toBe('Risotto');
      expect(dto.price).toBe(32000);
      expect(dto.category).toBe('Platos fuertes');
      expect(dto.rating).toBe('4.9');

      const backRow = productToRow(dto, 'ten-1');
      expect(backRow.tenant_id).toBe('ten-1');
      expect(backRow.price).toBe(32000);
      expect(backRow.name).toBe('Risotto');
    });
  });
});
