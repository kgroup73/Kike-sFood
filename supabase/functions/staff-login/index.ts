// Edge Function: login del personal con PIN por usuario.
//
// 1. Valida el PIN en la base de datos (verify_staff_pin: bcrypt + bloqueo tras 5 fallos).
// 2. Si el empleado aún no tiene usuario en Supabase Auth, lo crea (email sintético).
// 3. Inicia sesión con una contraseña derivada (HMAC del id con STAFF_AUTH_PEPPER),
//    que nunca sale del servidor, y devuelve la sesión al navegador.
//
// Secretos requeridos:  supabase secrets set STAFF_AUTH_PEPPER=<64+ caracteres aleatorios>
// Opcional:             supabase secrets set ALLOWED_ORIGIN=https://tu-dominio.com
import { createClient } from 'npm:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
const PEPPER = Deno.env.get('STAFF_AUTH_PEPPER') ?? '';
const ALLOWED_ORIGIN = Deno.env.get('ALLOWED_ORIGIN') ?? '*';

const corsHeaders = {
  'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

async function derivePassword(staffId: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', enc.encode(PEPPER), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(`kikes-staff:${staffId}`));
  return Array.from(new Uint8Array(sig), (b) => b.toString(16).padStart(2, '0')).join('');
}

const staffEmail = (staffId: string) => `staff-${staffId}@staff.example.com`;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Método no permitido' }, 405);
  if (PEPPER.length < 32 || !SERVICE_ROLE_KEY || !ANON_KEY) {
    console.error('staff-login: falta STAFF_AUTH_PEPPER (>= 32 caracteres) o las llaves de Supabase');
    return json({ error: 'El servidor de autenticación no está configurado' }, 500);
  }

  let body: { slug?: unknown; staffId?: unknown; pin?: unknown };
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Solicitud inválida' }, 400);
  }
  const { slug, staffId, pin } = body ?? {};
  if (typeof slug !== 'string' || typeof staffId !== 'string' || typeof pin !== 'string' || !/^[0-9]{4,6}$/.test(pin)) {
    return json({ error: 'Selecciona tu usuario e ingresa tu PIN (4 a 6 dígitos)' }, 400);
  }

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false }
  });

  const { data: check, error: checkError } = await admin.rpc('verify_staff_pin', {
    p_slug: slug,
    p_staff_id: staffId,
    p_pin: pin
  });
  if (checkError) {
    console.error('verify_staff_pin', checkError);
    return json({ error: 'No se pudo validar el PIN' }, 500);
  }
  if (!check?.ok) {
    if (check?.reason === 'locked') {
      return json({ error: 'Usuario bloqueado por intentos fallidos. Intenta de nuevo en 15 minutos.' }, 429);
    }
    return json({ error: 'PIN incorrecto', attemptsLeft: check?.attemptsLeft ?? null }, 401);
  }

  const email = staffEmail(check.staffId);
  const password = await derivePassword(check.staffId);
  let userId: string | null = check.userId;

  if (!userId) {
    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      app_metadata: { tenant_id: check.tenantId, staff_id: check.staffId }
    });
    if (createError || !created.user) {
      console.error('createUser', createError);
      return json({ error: 'No se pudo preparar el usuario' }, 500);
    }
    userId = created.user.id;
    const { error: linkError } = await admin.rpc('link_staff_user', { p_staff_id: check.staffId, p_user_id: userId });
    if (linkError) {
      console.error('link_staff_user', linkError);
      return json({ error: 'No se pudo vincular el usuario' }, 500);
    }
  }

  const pub = createClient(SUPABASE_URL, ANON_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
  let { data: signIn, error: signInError } = await pub.auth.signInWithPassword({ email, password });
  if (signInError) {
    // Si STAFF_AUTH_PEPPER cambió, se re-sincroniza la contraseña interna.
    await admin.auth.admin.updateUserById(userId, { password });
    ({ data: signIn, error: signInError } = await pub.auth.signInWithPassword({ email, password }));
  }
  if (signInError || !signIn?.session) {
    console.error('signInWithPassword', signInError);
    return json({ error: 'No se pudo iniciar sesión' }, 500);
  }

  const { session } = signIn;
  return json({
    session: {
      access_token: session.access_token,
      refresh_token: session.refresh_token,
      expires_at: session.expires_at,
      expires_in: session.expires_in,
      token_type: session.token_type
    },
    staff: {
      id: check.staffId,
      tenantId: check.tenantId,
      tenantSlug: slug,
      displayName: check.displayName,
      role: check.role
    }
  });
});
