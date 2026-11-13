import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { demoApi } from '../services/demo/demoApi';
import { ToastProvider } from '../hooks/useToast';
import PlansView from '../components/admin/PlansView';
import { TenantProvider } from '../hooks/useTenant';

describe('Super Admin & Sistema de Códigos de Upgrade', () => {
  beforeEach(() => {
    demoApi.resetDemo();
  });

  it('reconoce el correo admin@kikesfood.com como administrador de plataforma', async () => {
    const isAdmin = await demoApi.checkIsPlatformAdmin('admin@kikesfood.com');
    expect(isAdmin).toBe(true);

    const isRandomAdmin = await demoApi.checkIsPlatformAdmin('alguien@otrodominio.com');
    expect(isRandomAdmin).toBe(false);
  });

  it('genera un código de upgrade con duración y prefijo correcto', async () => {
    const res = await demoApi.superadminCreateUpgradeCode({
      plan: 'intermedio',
      durationDays: 30,
      targetSlug: 'chalas-bar'
    });

    expect(res.ok).toBe(true);
    expect(res.code).toMatch(/^KIKE-INT-[A-Z0-9]{4}$/);
    expect(res.plan).toBe('intermedio');
    expect(res.durationDays).toBe(30);

    const codes = await demoApi.superadminListUpgradeCodes();
    expect(codes.length).toBeGreaterThan(0);
    expect(codes[0].code).toBe(res.code);
  });

  it('permite canjear un código válido y actualiza el plan del restaurante', async () => {
    // 1. Generar código para la-trattoria
    const gen = await demoApi.superadminCreateUpgradeCode({
      plan: 'intermedio',
      durationDays: 60,
      targetSlug: 'la-trattoria'
    });

    // 2. Canjear código
    const redeemRes = await demoApi.redeemPlanCode({
      slug: 'la-trattoria',
      code: gen.code
    });

    expect(redeemRes.ok).toBe(true);
    expect(redeemRes.plan).toBe('intermedio');
    expect(redeemRes.planExpiresAt).toBeTruthy();

    // 3. Verificar que el tenant ahora tiene el plan 'intermedio'
    const tenant = await demoApi.getTenantBySlug('la-trattoria');
    expect(tenant.plan).toBe('intermedio');

    // 4. Intentar canjear el mismo código de nuevo debe fallar
    await expect(
      demoApi.redeemPlanCode({ slug: 'la-trattoria', code: gen.code })
    ).rejects.toThrow(/ya fue canjeado/i);
  });

  it('rechaza un código destinado a otro restaurante', async () => {
    const gen = await demoApi.superadminCreateUpgradeCode({
      plan: 'intermedio',
      durationDays: 30,
      targetSlug: 'otro-restaurante'
    });

    await expect(
      demoApi.redeemPlanCode({ slug: 'la-trattoria', code: gen.code })
    ).rejects.toThrow(/otro restaurante/i);
  });

  it('permite suspender y reactivar un restaurante desde el superadmin', async () => {
    const tenants = await demoApi.superadminListTenants();
    const target = tenants[0];
    expect(target.is_active).toBe(true);

    // Suspender
    await demoApi.superadminToggleTenant(target.id, false);
    const updated1 = await demoApi.getTenantBySlug(target.slug);
    expect(updated1.isActive).toBe(false);

    // Reactivar
    await demoApi.superadminToggleTenant(target.id, true);
    const updated2 = await demoApi.getTenantBySlug(target.slug);
    expect(updated2.isActive).toBe(true);
  });

  it('bloquea el plan Premium para restaurantes normales y solo lo permite en la-trattoria', async () => {
    // 1. Rechaza generar código Premium para un restaurante ordinario
    await expect(
      demoApi.superadminCreateUpgradeCode({
        plan: 'premium',
        durationDays: 30,
        targetSlug: 'chalas-bar'
      })
    ).rejects.toThrow(/solo está disponible para pruebas en el restaurante "la-trattoria"/i);

    // 2. Permite generar código Premium exclusivamente para la-trattoria
    const trattoriaCode = await demoApi.superadminCreateUpgradeCode({
      plan: 'premium',
      durationDays: 30,
      targetSlug: 'la-trattoria'
    });
    expect(trattoriaCode.ok).toBe(true);
    expect(trattoriaCode.plan).toBe('premium');

    // 3. Rechaza canjear un código Premium en un restaurante ordinario
    await expect(
      demoApi.redeemPlanCode({ slug: 'chalas-bar', code: trattoriaCode.code })
    ).rejects.toThrow(/otro restaurante/i);

    // 4. Rechaza cambio directo a Premium si el tenant no es la-trattoria
    await expect(
      demoApi.superadminChangeTenantPlan('regular-tenant-uuid', 'premium', 30)
    ).rejects.toThrow(/solo está disponible para pruebas/i);
  });

  it('la vista de Planes muestra el banner de Próximamente en el plan Premium para restaurantes normales', async () => {
    render(
      <BrowserRouter>
        <ToastProvider>
          <TenantProvider slug="chalas-bar">
            <PlansView />
          </TenantProvider>
        </ToastProvider>
      </BrowserRouter>
    );

    // Esperar a que cargue la vista
    await waitFor(() => {
      expect(screen.getByText('Plan')).toBeInTheDocument();
    });

    // Debe mostrar la etiqueta "Próximamente / En desarrollo (Bloqueado)" en el plan Premium
    expect(screen.getByText(/Próximamente \/ En desarrollo/i)).toBeInTheDocument();

    // Debe mostrar la sección de canje de código
    expect(screen.getByText(/Canjear código de actualización/i)).toBeInTheDocument();
  });
});
