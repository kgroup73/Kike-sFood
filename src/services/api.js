import { isSupabaseConfigured } from '../lib/supabaseClient';
import { supabaseApi } from './supabaseApi';
import { demoApi } from './demo/demoApi';

/** Sin VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY la app funciona en modo demo. */
export const isDemoMode = !isSupabaseConfigured;

/** Única puerta de acceso a datos: los componentes nunca llaman a Supabase directo. */
export const api = isDemoMode ? demoApi : supabaseApi;
