import { isSupabaseConfigured } from '../lib/supabaseClient';
import { supabaseApi } from './supabaseApi';
import { demoApi } from './demo/demoApi';
import { pgliteApi } from './pglite/pgliteApi';

/**
 * REGLA ESTRICTA DE ENTORNO:
 * - En desarrollo local (npm run dev / import.meta.env.DEV): PGlite (PostgreSQL local en disco).
 * - En pruebas unitarias (Vitest / MODE === 'test'): demoApi (en memoria aislado).
 * - En despliegue de producción (Vercel / import.meta.env.PROD): Supabase Cloud.
 */
const isLocalDev = import.meta.env.DEV && import.meta.env.MODE !== 'test';

export const isLocalDbMode = isLocalDev;
export const isDemoMode = !isLocalDev && !isSupabaseConfigured;

export const api = isLocalDev
  ? pgliteApi
  : (isSupabaseConfigured ? supabaseApi : demoApi);
