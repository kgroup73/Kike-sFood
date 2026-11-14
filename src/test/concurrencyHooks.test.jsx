import { renderHook, act, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useOrders } from '../hooks/useOrders';
import { useMenu } from '../hooks/useMenu';
import { useFloorPlan } from '../hooks/useFloorPlan';
import { api } from '../services/api';

describe('Fase 2: Concurrencia y Resiliencia en Hooks (AbortController)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  describe('useOrders', () => {
    it('cancela peticiones en vuelo previas ante llamadas rápidas consecutivas (anti-race condition)', async () => {
      let firstCallSignal;
      let secondCallSignal;

      vi.spyOn(api, 'listOpenOrders')
        .mockImplementationOnce((tenantId, { signal }) => {
          firstCallSignal = signal;
          return new Promise((resolve) => {
            setTimeout(() => resolve([{ id: 'order-1', tenant_id: tenantId }]), 60);
          });
        })
        .mockImplementationOnce((tenantId, { signal }) => {
          secondCallSignal = signal;
          return new Promise((resolve) => {
            setTimeout(() => resolve([{ id: 'order-2', tenant_id: tenantId }]), 10);
          });
        });

      const { result } = renderHook(() => useOrders('tenant-a'));

      // Inmediatamente forzar otra recarga antes de que la primera termine
      await act(async () => {
        result.current.reload();
      });

      // La primera señal debe haber sido abortada
      expect(firstCallSignal.aborted).toBe(true);
      expect(secondCallSignal.aborted).toBe(false);

      // Esperar a que el segundo complete
      await vi.waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // El estado final debe ser el de la segunda petición (order-2), no la vieja (order-1)
      expect(result.current.orders).toEqual([{ id: 'order-2', tenant_id: 'tenant-a' }]);
    });

    it('aborta la petición en vuelo cuando el componente se desmonta', () => {
      let capturedSignal;
      vi.spyOn(api, 'listOpenOrders').mockImplementation((_, { signal }) => {
        capturedSignal = signal;
        return new Promise(() => {}); // nunca resuelve
      });

      const { unmount } = renderHook(() => useOrders('tenant-1'));
      expect(capturedSignal).toBeDefined();
      expect(capturedSignal.aborted).toBe(false);

      unmount();
      expect(capturedSignal.aborted).toBe(true);
    });

    it('ignora errores de tipo AbortError y no ensucia el estado de error', async () => {
      vi.spyOn(api, 'listOpenOrders').mockImplementation(() => {
        const err = new Error('The user aborted a request.');
        err.name = 'AbortError';
        return Promise.reject(err);
      });

      const { result } = renderHook(() => useOrders('tenant-1'));

      await vi.waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBeNull();
    });
  });

  describe('useMenu', () => {
    it('evita stale state cuando tenantId cambia rápidamente', async () => {
      let signalA;
      let signalB;

      vi.spyOn(api, 'getMenu')
        .mockImplementationOnce((tenantId, { signal }) => {
          signalA = signal;
          return new Promise((resolve) => {
            setTimeout(() => resolve({ categories: ['Cat-A'], products: [{ id: 'p-a', name: 'Plato A' }], ingredientsStock: {} }), 50);
          });
        })
        .mockImplementationOnce((tenantId, { signal }) => {
          signalB = signal;
          return new Promise((resolve) => {
            setTimeout(() => resolve({ categories: ['Cat-B'], products: [{ id: 'p-b', name: 'Plato B' }], ingredientsStock: {} }), 10);
          });
        });

      let currentTenant = 'rest-a';
      const { result, rerender } = renderHook(() => useMenu(currentTenant));

      // Cambiar de restaurante rápidamente
      currentTenant = 'rest-b';
      rerender();

      expect(signalA.aborted).toBe(true);
      expect(signalB.aborted).toBe(false);

      await vi.waitFor(() => {
        expect(result.current.loading).toBe(false);
        expect(result.current.categories).toEqual(['Cat-B']);
      });

      expect(result.current.products).toEqual([{ id: 'p-b', name: 'Plato B' }]);
    });

    it('cancela la petición activa al desmontar el hook', () => {
      let menuSignal;
      vi.spyOn(api, 'getMenu').mockImplementation((_, { signal }) => {
        menuSignal = signal;
        return new Promise(() => {});
      });

      const { unmount } = renderHook(() => useMenu('rest-test'));
      expect(menuSignal.aborted).toBe(false);

      unmount();
      expect(menuSignal.aborted).toBe(true);
    });
  });

  describe('useFloorPlan', () => {
    it('pasa AbortSignal a getFloorPlan y aborta al desmontarse', () => {
      let floorSignal;
      vi.spyOn(api, 'getFloorPlan').mockImplementation((_, { signal }) => {
        floorSignal = signal;
        return new Promise(() => {});
      });

      const { unmount } = renderHook(() => useFloorPlan('tenant-floor'));
      expect(floorSignal).toBeDefined();
      expect(floorSignal.aborted).toBe(false);

      unmount();
      expect(floorSignal.aborted).toBe(true);
    });
  });
});
