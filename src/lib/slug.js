/**
 * Convierte un nombre arbitrario a un slug válido para URL (ej. "La Trattoria Gourmet" -> "la-trattoria-gourmet").
 */
export function slugify(text) {
  if (!text) return '';
  return String(text)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Quitar tildes
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')     // Caracteres especiales a guión
    .replace(/^-+|-+$/g, '')         // Quitar guiones iniciales y finales
    .slice(0, 60);
}

/**
 * Valida si un slug cumple con el formato exigido por la base de datos:
 * Minúsculas, números, guiones intermedios, longitud entre 3 y 60 caracteres.
 */
export function isValidSlug(slug) {
  if (typeof slug !== 'string') return false;
  const s = slug.trim().toLowerCase();
  if (s.length < 3 || s.length > 60) return false;
  return /^[a-z0-9]+(-[a-z0-9]+)*$/.test(s);
}
