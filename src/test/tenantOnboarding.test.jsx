import { describe, it, expect, beforeAll } from 'vitest';
import { slugify, isValidSlug } from '../lib/slug';
import { demoApi } from '../services/demo/demoApi';

describe('Validación y generación de Slugs (lib/slug)', () => {
  it('convierte nombres con tildes y caracteres especiales a slugs limpios', () => {
    expect(slugify('La Trattoria Gourmet')).toBe('la-trattoria-gourmet');
    expect(slugify('¡Hamburguesas & Asados del Café! 100%')).toBe('hamburguesas-asados-del-cafe-100');
    expect(slugify('   Rincón Paisa   ')).toBe('rincon-paisa');
  });

  it('valida formato de slug estrictamente según reglas de base de datos', () => {
    expect(isValidSlug('la-trattoria')).toBe(true);
    expect(isValidSlug('burger-house-2')).toBe(true);
    expect(isValidSlug('ab')).toBe(false); // muy corto (< 3)
    expect(isValidSlug('un-slug-con-Mayusculas')).toBe(true); // se normaliza
    expect(isValidSlug('-guion-al-inicio')).toBe(false);
    expect(isValidSlug('espacio en medio')).toBe(false);
  });
});

describe('Flujo de Registro y Onboarding Multi-Tenant (demoApi)', () => {
  const testEmail = 'dueno@nuevorestaurante.com';
  const testSlug = 'pizzeria-napoles';

  beforeAll(async () => {
    localStorage.clear();
    sessionStorage.clear();
    demoApi.resetDemo();
  });

  it('envía y valida el código OTP de confirmación de correo', async () => {
    const sendRes = await demoApi.sendOnboardingOtp(testEmail);
    expect(sendRes.ok).toBe(true);
    expect(sendRes.code).toBe('123456');

    // Código erróneo
    await expect(demoApi.verifyOnboardingOtp({ email: testEmail, code: '000000' }))
      .rejects.toThrow(/incorrecto/i);

    // Código correcto
    const verifyRes = await demoApi.verifyOnboardingOtp({ email: testEmail, code: '123456' });
    expect(verifyRes.ok).toBe(true);
  });

  it('verifica disponibilidad de slug', async () => {
    // Slug libre
    const freeRes = await demoApi.checkSlugAvailable(testSlug);
    expect(freeRes.available).toBe(true);

    // Slug del restaurante de la demo (ya ocupado)
    const takenRes = await demoApi.checkSlugAvailable('la-trattoria');
    expect(takenRes.available).toBe(false);
  });

  it('crea el restaurante de forma atómica con dueño, mesas y categorías iniciales', async () => {
    const res = await demoApi.registerTenant({
      email: testEmail,
      code: '123456',
      name: 'Pizzería Nápoles',
      slug: testSlug,
      city: 'Medellín',
      phone: '3001234567',
      ownerName: 'Marco Rossi',
      pin: '7788'
    });

    expect(res.ok).toBe(true);
    expect(res.slug).toBe(testSlug);
    expect(res.name).toBe('Pizzería Nápoles');

    // Verifica que el dueño quedó logueado
    const currentStaff = await demoApi.getCurrentStaff();
    expect(currentStaff).toBeDefined();
    expect(currentStaff.displayName).toBe('Marco Rossi');
    expect(currentStaff.role).toBe('owner');

    // Verifica catálogo y mesas iniciales creadas
    const menu = await demoApi.getMenu(res.tenantId);
    expect(menu.categories.length).toBe(3);
    expect(menu.categories.map((c) => c.name)).toEqual(['Entradas', 'Platos Fuertes', 'Bebidas']);

    const tables = await demoApi.listTables(res.tenantId);
    expect(tables.length).toBe(4);
    expect(tables.map((t) => t.label)).toEqual(['1', '2', '3', '4']);
  });
});
