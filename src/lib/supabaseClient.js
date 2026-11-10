import { createClient } from '@supabase/supabase-js';

const rawUrl = import.meta.env.VITE_SUPABASE_URL || '';
// Si se copia la URL de la Data API con /rest/v1/, se limpia automáticamente
const supabaseUrl = rawUrl.trim().replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');
const supabaseAnonKey = (
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  ''
).trim();

export const isSupabaseConfigured = Boolean(
  supabaseUrl && supabaseAnonKey && supabaseUrl.startsWith('https://') && supabaseAnonKey.length > 20
);

/**
 * Cliente de Supabase. La llave anon/publishable es pública por diseño: la
 * seguridad la dan las políticas RLS y las funciones del servidor.
 * Sin variables de entorno la app funciona en modo demo (src/services/demo).
 */
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: true, autoRefreshToken: true, storageKey: 'kikes-staff-session' },
      realtime: { params: { eventsPerSecond: 10 } }
    })
  : null;

/** Dirección y llave pública que usa el agente local de impresión al vincularse. */
export const publicConnection = isSupabaseConfigured ? { servidor: supabaseUrl, llave: supabaseAnonKey } : null;
