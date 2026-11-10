/**
 * Llamadas al servidor de Kike's (funciones de Supabase). El agente no tiene sesión de
 * personal: se identifica con el token que recibió al vincularse. La llave "anon" es
 * pública por diseño, igual que en la carta del comensal.
 */
export function crearApi({ servidor, llave, fetchImpl = globalThis.fetch, timeoutMs = 15000 }) {
  if (!servidor || !llave) throw new Error('Faltan la dirección del servidor y la llave pública');
  const base = servidor.replace(/\/+$/, '');

  async function rpc(nombre, cuerpo) {
    let res;
    try {
      res = await fetchImpl(`${base}/rest/v1/rpc/${nombre}`, {
        method: 'POST',
        headers: { apikey: llave, Authorization: `Bearer ${llave}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(cuerpo),
        signal: AbortSignal.timeout(timeoutMs)
      });
    } catch (err) {
      const e = new Error(`Sin conexión con el servidor: ${err.message}`);
      e.red = true;
      throw e;
    }
    const texto = await res.text();
    const datos = texto ? JSON.parse(texto) : null;
    if (!res.ok) {
      const e = new Error(datos?.message || `Error ${res.status} del servidor`);
      e.codigo = datos?.code;
      e.revocado = datos?.code === '42501';
      throw e;
    }
    return datos;
  }

  return {
    vincular: (slug, codigo, version) => rpc('agent_pair', { p_slug: slug, p_code: codigo, p_version: version }),
    info: (token) => rpc('agent_info', { p_token: token }),
    tomar: (token, limite, version) => rpc('agent_pull_jobs', { p_token: token, p_limit: limite, p_version: version }),
    reportar: (token, id, ok, error = null) => rpc('agent_report_job', { p_token: token, p_job_id: id, p_ok: ok, p_error: error })
  };
}
