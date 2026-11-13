// Edge Function: Envío de código OTP de verificación con Resend para registro de restaurantes.
//
// Secretos necesarios en Supabase:
//   supabase secrets set RESEND_API_KEY=re_...
//   supabase secrets set RESEND_FROM="Kike's Food <onboarding@resend.dev>" (o tu dominio verificado)
//
import { createClient } from 'npm:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') ?? '';
const RESEND_FROM = Deno.env.get('RESEND_FROM') ?? "Kike's Food <onboarding@resend.dev>";
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

function buildEmailHtml(code: string) {
  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Código de verificación Kike's Food</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F6F7F3; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1E2B24;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #F6F7F3; padding: 40px 15px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 520px; background-color: #FFFFFF; border-radius: 24px; border: 1px solid #E5E7EB; padding: 40px 32px; box-shadow: 0 4px 16px rgba(30, 43, 36, 0.04);">
          <!-- Cabecera / Marca -->
          <tr>
            <td align="center" style="padding-bottom: 24px;">
              <h1 style="margin: 0; font-size: 28px; font-weight: 900; color: #1E2B24; letter-spacing: -0.5px;">
                Kike's <span style="color: #2F6B3F;">Food</span>
              </h1>
              <p style="margin: 6px 0 0 0; font-size: 14px; color: #64748B;">Plataforma gastronómica para restaurantes</p>
            </td>
          </tr>

          <!-- Título principal -->
          <tr>
            <td align="center" style="padding-bottom: 20px;">
              <h2 style="margin: 0; font-size: 20px; font-weight: 700; color: #1E2B24;">
                Crea tu nuevo restaurante
              </h2>
              <p style="margin: 10px 0 0 0; font-size: 15px; line-height: 22px; color: #475569;">
                Usa el siguiente código de confirmación para validar tu correo electrónico y completar la creación de tu cuenta:
              </p>
            </td>
          </tr>

          <!-- Código OTP destacado -->
          <tr>
            <td align="center" style="padding: 24px 0;">
              <div style="background-color: #F6F7F3; border: 2px dashed #F3C64B; border-radius: 18px; padding: 20px 24px; display: inline-block;">
                <span style="font-family: 'Courier New', Courier, monospace; font-size: 38px; font-weight: 900; letter-spacing: 10px; color: #1E2B24; display: block;">
                  ${code}
                </span>
              </div>
            </td>
          </tr>

          <!-- Aviso de vencimiento y seguridad -->
          <tr>
            <td align="center" style="padding-bottom: 24px;">
              <p style="margin: 0; font-size: 13px; color: #64748B;">
                ⏱️ Este código es válido por <strong>10 minutos</strong> y de un solo uso.
              </p>
              <p style="margin: 12px 0 0 0; font-size: 12px; color: #94A3B8; line-height: 18px;">
                Si tú no solicitaste este código para crear un restaurante en Kike's Food, puedes ignorar este mensaje de forma segura.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="border-top: 1px solid #F1F5F9; padding-top: 20px; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #94A3B8;">
                © 2026 Kike's Food · La plataforma digital para salas y cocinas.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Método no permitido' }, 405);

  let body: { email?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Cuerpo de solicitud inválido' }, 400);
  }

  const email = (body.email || '').trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json({ error: 'Ingresa un correo electrónico válido' }, 400);
  }

  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    return json({ error: 'Configuración del servidor incompleta (Supabase)' }, 500);
  }

  // Generar código numérico criptográficamente seguro de 6 dígitos
  const codeArray = new Uint32Array(1);
  crypto.getRandomValues(codeArray);
  const code = String(100000 + (codeArray[0] % 900000));

  // Guardar en la base de datos con expiración a 10 min
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false }
  });

  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
  const { error: dbError } = await admin
    .from('tenant_onboarding_codes')
    .upsert({
      email,
      code,
      attempts: 0,
      expires_at: expiresAt,
      created_at: new Date().toISOString()
    });

  if (dbError) {
    console.error('Error guardando código OTP:', dbError);
    return json({ error: 'No se pudo generar el código de verificación' }, 500);
  }

  // Enviar con Resend si la API Key está configurada
  if (!RESEND_API_KEY) {
    console.warn(`[DEV/TEST] RESEND_API_KEY no configurada. Código para ${email}: ${code}`);
    return json({
      ok: true,
      simulated: true,
      message: 'Código generado (modo prueba). Revisa la consola o logs del servidor.'
    });
  }

  try {
    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: RESEND_FROM,
        to: [email],
        subject: `Tu código de verificación de Kike's Food: ${code}`,
        html: buildEmailHtml(code)
      })
    });

    if (!resendRes.ok) {
      const errBody = await resendRes.text();
      console.warn('Resend no pudo despachar el correo (modo prueba / sandbox activo):', errBody);

      // Si Resend está en modo sandbox o sin dominio verificado (403, validation_error),
      // devolvemos el código para permitir pruebas en vivo sin bloquear al desarrollador.
      return json({
        ok: true,
        sent: false,
        simulated: true,
        previewOtp: code,
        message: 'Resend en modo sandbox. Usa el código de verificación en pantalla.'
      });
    }

    return json({ ok: true, sent: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('Excepción enviando correo:', msg);
    return json({ error: 'Error de red contactando el servicio de correos' }, 500);
  }
});
