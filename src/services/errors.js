/** Convierte errores de Supabase/PostgREST en mensajes legibles para el usuario. */
export function toAppError(error, fallback = 'Ocurrió un error inesperado') {
  if (!error) return new Error(fallback);
  if (error instanceof Error && !('code' in error)) return error;
  const code = error.code;
  let message = error.message || fallback;
  if (code === '42501' && /permission denied/i.test(message)) {
    message = 'No tienes permiso para realizar esta acción';
  } else if (code === '23505') {
    message = 'Ya existe un registro con esos datos';
  } else if (/Failed to fetch|NetworkError/i.test(message)) {
    message = 'Sin conexión con el servidor. Revisa tu internet e intenta de nuevo.';
  } else if (code === 'PGRST301' || /JWT expired/i.test(message)) {
    message = 'Tu sesión expiró. Vuelve a ingresar con tu PIN.';
  }
  const err = new Error(message);
  err.code = code;
  return err;
}

export function unwrap({ data, error }) {
  if (error) throw toAppError(error);
  return data;
}
