/**
 * Estándar RFC 7807 / RFC 9457: Problem Details for HTTP APIs.
 * Provee estructura canónica para errores de validación, dominio y base de datos,
 * incluyendo mapa de errores granulares por campo (`fieldErrors`).
 */
export class ProblemDetailsError extends Error {
  constructor({
    type = 'about:blank',
    title = 'Error en la solicitud',
    status = 400,
    detail = '',
    instance = '',
    fieldErrors = {},
    code = null
  } = {}) {
    super(detail || title);
    this.name = 'ProblemDetailsError';
    this.type = type;
    this.title = title;
    this.status = status;
    this.detail = detail || title;
    this.instance = instance;
    this.fieldErrors = fieldErrors || {};
    this.code = code;
  }
}

/** Crea un error estructurado de validación RFC 7807 (HTTP 422 Unprocessable Entity). */
export function createValidationError(fieldErrors = {}, detail = 'Uno o más campos no cumplen con las validaciones requeridas.') {
  return new ProblemDetailsError({
    type: 'https://kikes.app/errors/validation-failed',
    title: 'Error de validación',
    status: 422,
    detail,
    fieldErrors
  });
}

/** Extrae el mapa de errores por campo de cualquier error. */
export function extractFieldErrors(error) {
  if (error instanceof ProblemDetailsError) {
    return error.fieldErrors || {};
  }
  return error?.fieldErrors || {};
}

/** Convierte errores de Supabase/PostgREST en instancias legibles y estructuradas (RFC 7807). */
export function toAppError(error, fallback = 'Ocurrió un error inesperado') {
  if (!error) return new ProblemDetailsError({ title: fallback, detail: fallback });
  if (error instanceof ProblemDetailsError) return error;
  if (error instanceof Error && !('code' in error)) return error;

  const code = error.code;
  let message = error.message || fallback;
  const rawInfo = `${error.message || ''} ${error.details || ''} ${error.hint || ''}`;
  const fieldErrors = {};

  if (code === '42501' && /permission denied/i.test(rawInfo)) {
    message = 'No tienes permiso para realizar esta acción';
  } else if (code === '23505') {
    // Violación de unicidad en Postgres: inferir el campo en conflicto desde el mensaje original
    message = 'Ya existe un registro con esos datos';
    if (/slug/i.test(rawInfo)) {
      fieldErrors.slug = 'Este código o slug ya está en uso por otro restaurante';
    } else if (/name/i.test(rawInfo)) {
      fieldErrors.name = 'Ya existe un elemento con este nombre';
    } else if (/label/i.test(rawInfo)) {
      fieldErrors.label = 'Ya existe una mesa con este número o etiqueta';
    }
    return new ProblemDetailsError({
      type: 'https://kikes.app/errors/conflict',
      title: 'Conflicto de registro duplicado',
      status: 409,
      detail: message,
      fieldErrors,
      code
    });
  } else if (code === '23502') {
    // Violación Not-Null en Postgres
    message = 'Un campo obligatorio no fue provisto';
    const match = /column "([^"]+)"/i.exec(rawInfo);
    if (match?.[1]) {
      fieldErrors[match[1]] = `El campo ${match[1]} es obligatorio`;
    }
    return new ProblemDetailsError({
      type: 'https://kikes.app/errors/required-field-missing',
      title: 'Campo obligatorio requerido',
      status: 422,
      detail: message,
      fieldErrors,
      code
    });
  } else if (/Failed to fetch|NetworkError/i.test(rawInfo)) {
    message = 'Sin conexión con el servidor. Revisa tu internet e intenta de nuevo.';
  } else if (code === 'PGRST301' || /JWT expired/i.test(rawInfo)) {
    message = 'Tu sesión expiró. Vuelve a ingresar con tu PIN.';
  }

  const err = new ProblemDetailsError({
    type: 'https://kikes.app/errors/general',
    title: message,
    status: error.status || 400,
    detail: message,
    fieldErrors,
    code
  });

  return err;
}

export function unwrap({ data, error }) {
  if (error) throw toAppError(error);
  return data;
}
