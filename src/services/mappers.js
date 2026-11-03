// Filas de la base de datos (snake_case) → objetos de la app (camelCase).

export const tenantFromRow = (r) =>
  r && {
    id: r.id,
    slug: r.slug,
    name: r.name,
    nit: r.nit || '',
    address: r.address || '',
    city: r.city || '',
    phone: r.phone || '',
    email: r.email || '',
    plan: r.plan,
    taxType: r.tax_type,
    taxRate: Number(r.tax_rate),
    tipRate: Number(r.tip_rate),
    footerText: r.footer_text || ''
  };

export const tenantToRow = (t) => ({
  name: t.name,
  nit: t.nit || null,
  address: t.address || null,
  city: t.city || null,
  phone: t.phone || null,
  email: t.email || null,
  tax_type: t.taxType,
  tax_rate: Number(t.taxRate) || 0,
  tip_rate: Number(t.tipRate) || 0,
  footer_text: t.footerText || null
});

export const orderFromRow = (o) => ({
  id: o.id,
  tenantId: o.tenant_id,
  tableLabel: o.table_label,
  status: o.status,
  subtotal: o.subtotal,
  tip: o.tip,
  total: o.total,
  notes: o.notes || '',
  createdAt: o.created_at,
  items: (o.order_items || []).map((it) => ({
    name: it.name,
    quantity: it.quantity,
    unitPrice: it.unit_price,
    totalPrice: it.total_price,
    selectedOptions: it.selected_options || []
  }))
});

export const invoiceFromRow = (r) => ({
  id: r.id,
  orderId: r.order_id,
  dailyCloseId: r.daily_close_id,
  kind: r.kind,
  number: r.full_number || `${r.prefix}-${r.number}`,
  customer: r.customer,
  paymentMethod: r.payment_method,
  tableLabel: r.table_label,
  items: r.items || [],
  itemsTotal: r.items_total,
  taxBase: r.tax_base,
  tax: r.tax,
  taxType: r.tax_type,
  taxRate: Number(r.tax_rate),
  tip: r.tip,
  total: r.total,
  cufe: r.cufe,
  dianStatus: r.dian_status,
  issuedByName: r.issued_by_name,
  createdAt: r.created_at
});

export const dailyCloseFromRow = (r) => ({
  id: r.id,
  code: r.code,
  closedByName: r.closed_by_name,
  periodStart: r.period_start,
  periodEnd: r.period_end,
  invoiceCount: r.invoice_count,
  totalSales: r.total_sales,
  cashSales: r.cash_sales,
  cardSales: r.card_sales,
  transferSales: r.transfer_sales,
  tips: r.tips,
  countedCash: r.counted_cash,
  difference: r.difference,
  createdAt: r.created_at
});

export const stockEventFromRow = (r) => ({
  id: r.id,
  type: r.type,
  ingredient: r.ingredient,
  affectedProducts: r.affected_products || [],
  note: r.note,
  reportedBy: r.reported_by,
  timestamp: r.created_at
});

export const customerFromRow = (r) => ({
  id: r.id,
  name: r.name,
  docType: r.doc_type,
  docNumber: r.doc_number,
  email: r.email || '',
  phone: r.phone || ''
});

export const staffFromRow = (r) => ({
  id: r.id,
  displayName: r.display_name,
  role: r.role,
  isActive: r.is_active,
  lockedUntil: r.locked_until,
  createdAt: r.created_at
});

export const tableFromRow = (r) => ({
  id: r.id,
  label: r.label,
  token: r.token,
  isActive: r.is_active,
  sortOrder: r.sort_order
});

export const sequenceFromRow = (r) => ({
  kind: r.kind,
  prefix: r.prefix,
  nextNumber: r.next_number,
  rangeFrom: r.range_from,
  rangeTo: r.range_to,
  resolutionNumber: r.resolution_number || '',
  resolutionDate: r.resolution_date || '',
  validUntil: r.valid_until || ''
});

export const sequenceToRow = (s, tenantId) => ({
  tenant_id: tenantId,
  kind: s.kind,
  prefix: String(s.prefix || '').toUpperCase(),
  next_number: Number(s.nextNumber) || 1,
  range_from: Number(s.rangeFrom) || 1,
  range_to: s.rangeTo === '' || s.rangeTo === null || s.rangeTo === undefined ? null : Number(s.rangeTo),
  resolution_number: s.resolutionNumber || null,
  resolution_date: s.resolutionDate || null,
  valid_until: s.validUntil || null
});
