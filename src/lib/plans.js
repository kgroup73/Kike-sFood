// Planes del SaaS. El plan real vive en tenants.plan y solo lo cambia la plataforma.
export const PLANS = Object.freeze({
  basic: { level: 0, label: 'Básico', summary: 'Carta digital QR/NFC de consulta.' },
  intermedio: { level: 1, label: 'Intermedio', summary: 'Pedidos desde la mesa, cocina KDS, inventario y caja POS.' },
  premium: { level: 2, label: 'Premium', summary: 'Todo lo anterior + facturación electrónica DIAN.' }
});

export const FEATURE_MIN_LEVEL = Object.freeze({
  ordering: 1,
  kitchen: 1,
  inventory: 1,
  pos: 1,
  dian: 2
});

/** Un plan desconocido NUNCA da acceso premium: cae al nivel más bajo. */
export const planLevel = (plan) => PLANS[plan]?.level ?? 0;
export const planLabel = (plan) => PLANS[plan]?.label ?? PLANS.basic.label;
export const hasFeature = (plan, feature) => planLevel(plan) >= (FEATURE_MIN_LEVEL[feature] ?? Infinity);

export function requiredPlanFor(feature) {
  const level = FEATURE_MIN_LEVEL[feature];
  return Object.values(PLANS).find((p) => p.level === level)?.label ?? 'Premium';
}
