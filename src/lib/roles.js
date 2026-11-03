// Roles del personal. Deben coincidir con el CHECK de public.staff_members.
export const ROLES = Object.freeze({
  owner: 'Dueño',
  admin: 'Administrador',
  cocina: 'Cocina',
  caja: 'Caja',
  mesero: 'Mesero'
});

// Qué secciones del panel de personal ve cada rol (la BD aplica lo mismo con RLS).
export const SECTION_ROLES = Object.freeze({
  cocina: ['owner', 'admin', 'cocina', 'mesero'],
  caja: ['owner', 'admin', 'caja'],
  admin: ['owner', 'admin']
});

export const canAccess = (role, section) => (SECTION_ROLES[section] || []).includes(role);

/** Primera sección disponible para el rol (destino tras iniciar sesión). */
export function homeSectionFor(role) {
  if (role === 'caja') return 'caja';
  if (role === 'cocina' || role === 'mesero') return 'cocina';
  return 'admin';
}

/** Roles que un usuario puede asignar al crear personal. */
export const assignableRoles = (myRole) =>
  myRole === 'owner' ? ['admin', 'cocina', 'caja', 'mesero'] : ['cocina', 'caja', 'mesero'];
