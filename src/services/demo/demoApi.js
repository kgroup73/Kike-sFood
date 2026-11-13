/**
 * Backend de demostración (sin Supabase). Persiste en localStorage y se
 * sincroniza entre pestañas, así se puede probar "comensal en una pestaña,
 * cocina en otra". Replica las reglas del servidor usando las mismas funciones
 * puras de src/lib (precios, impuestos, estados), pero NO es seguro: cualquiera
 * puede editar localStorage. Solo para demos y desarrollo.
 */
import {
  DEMO_TENANT, DEMO_INVOICE_SEQUENCES, DEMO_TABLE_COUNT, DEMO_STAFF, DEMO_CUSTOMERS,
  DEMO_CATEGORIES, INITIAL_PRODUCTS, INITIAL_KITCHEN_ORDERS, demoUuid
} from './seedData';
import { DETAIL_KEYS } from '../../lib/catalog';
import { validateSelections, unitPriceFor, selectedOptionNames } from '../../lib/pricing';
import { normalizeIngredient, getAffectedProducts } from '../../lib/inventory';
import { splitTaxIncluded, computeTip, effectiveTaxRate } from '../../lib/money';
import { canTransition, ORDER_STATUS, OPEN_STATUSES } from '../../lib/orderStatus';
import { hasFeature } from '../../lib/plans';
import { CONSUMIDOR_FINAL, sumOrders, mergeInvoiceItems } from '../../lib/billing';
import { localFloorPlanStore } from '../floorPlanStore';

const DB_KEY = 'kikes_demo_db_v2';
const SESSION_KEY = 'kikes_demo_session';
export const demoTableToken = (label) => `demo-mesa-${label}`;

// ------------------------------------------------------------------ almacenamiento
function seed() {
  const categories = DEMO_CATEGORIES.map((name, i) => ({ id: demoUuid('c', i + 1), name, sortOrder: i, printStationId: null }));
  const catId = (name) => categories.find((c) => c.name === name)?.id ?? null;
  const products = INITIAL_PRODUCTS.map((p, i) => ({
    id: demoUuid('p', p.id),
    tenantId: DEMO_TENANT.id,
    categoryId: catId(p.category),
    name: p.name,
    description: p.description,
    price: p.price,
    image: p.image,
    isChef: !!p.isChef,
    isVeg: !!p.isVeg,
    isGf: !!p.isGf,
    isPopular: !!p.isPopular,
    available: p.available !== false,
    ingredients: p.ingredients || [],
    modifiers: p.modifiers || [],
    pairing: p.pairing ? { productId: demoUuid('p', p.pairing.productId), description: p.pairing.description } : null,
    sortOrder: i,
    ...Object.fromEntries(DETAIL_KEYS.map((k) => [k, p[k] ?? null]))
  }));
  const tables = Array.from({ length: DEMO_TABLE_COUNT }, (_, i) => ({
    id: demoUuid('t', i + 1),
    label: String(i + 1),
    token: demoTableToken(i + 1),
    isActive: true,
    sortOrder: i + 1
  }));
  const now = Date.now();
  const orders = INITIAL_KITCHEN_ORDERS.map((o, i) => {
    const items = o.items.map((it) => ({
      name: it.name,
      quantity: it.quantity,
      unitPrice: it.price,
      totalPrice: it.price * it.quantity,
      selectedOptions: it.selectedOptions || []
    }));
    const subtotal = items.reduce((s, it) => s + it.totalPrice, 0);
    const tip = computeTip(subtotal, DEMO_TENANT.tipRate);
    return {
      id: i + 1,
      tenantId: DEMO_TENANT.id,
      tableId: demoUuid('t', Number(o.table)),
      tableLabel: o.table,
      status: o.status,
      subtotal,
      tip,
      total: subtotal + tip,
      notes: '',
      createdAt: new Date(now - (8 - i * 6) * 60000).toISOString(),
      // Las comandas de ejemplo figuran como impresas: activar la impresora no las imprime.
      printedAt: new Date(now - (8 - i * 6) * 60000).toISOString(),
      items
    };
  });
  return {
    version: 2,
    tenant: { ...DEMO_TENANT },
    categories,
    products,
    ingredientsStock: {},
    stockEvents: [],
    inventoryItems: {},
    inventoryMovements: [],
    tables,
    staff: DEMO_STAFF.map((s) => ({ ...s, isActive: true, failedAttempts: 0, lockedUntil: null, createdAt: new Date().toISOString() })),
    orders,
    nextOrderId: orders.length + 1,
    customers: DEMO_CUSTOMERS.map((c) => ({ ...c })),
    sequences: DEMO_INVOICE_SEQUENCES.map((s) => ({ ...s })),
    billingSettings: { provider: 'simulado', environment: 'habilitacion' },
    invoices: [],
    dailyCloses: [],
    waiterCalls: [],
    nextCallId: 1,
    ...printSeed()
  };
}

// Fila de impresión: misma lógica que supabase/migrations/20261111000000_fila_impresion.sql.
const DEMO_STATION = 'st-cocina';
function printSeed() {
  return { printStations: [{ id: DEMO_STATION, name: 'Cocina', isDefault: true, printsReceipts: false, sortOrder: 0 }], printJobs: [], nextJobId: 1 };
}

/** Datos guardados por una versión anterior de la demo: se completan sin borrarlos. */
function upgrade(db) {
  db.tenant.kitchenDisplay ??= true;
  db.waiterCalls ??= [];
  db.nextCallId ??= db.waiterCalls.length + 1;
  for (const o of db.orders) if (o.printedAt === undefined) o.printedAt = o.createdAt;
  if (!db.printStations) Object.assign(db, printSeed());
  for (const c of db.categories) c.printStationId ??= null;
  return db;
}

/** Arma los trabajos de una comanda: uno por estación, con solo sus platos. */
function enqueueOrder(d, order, reprint = false) {
  const fallback = d.printStations.find((s) => s.isDefault)?.id || null;
  const groups = new Map();
  for (const it of order.items) {
    const product = d.products.find((p) => p.id === it.productId);
    const category = product && d.categories.find((c) => c.id === product.categoryId);
    const stationId = category?.printStationId || fallback;
    if (!stationId) continue;
    if (!groups.has(stationId)) groups.set(stationId, []);
    groups.get(stationId).push({ quantity: it.quantity, name: it.name, options: it.selectedOptions || [] });
  }
  for (const [stationId, items] of groups) {
    const station = d.printStations.find((s) => s.id === stationId);
    d.printJobs.push(newJob(d, stationId, 'comanda', {
      restaurant: d.tenant.name, station: station.name, orderId: order.id, tableLabel: order.tableLabel,
      createdAt: order.createdAt, notes: order.notes || '', reprint, items
    }, { orderId: order.id }));
  }
  d.printJobs = d.printJobs.slice(-300);
  return groups.size;
}

function newJob(d, stationId, kind, payload, extra = {}) {
  return { id: d.nextJobId++, stationId, kind, payload, status: 'pendiente', attempts: 0, claimedByName: '', claimedAt: null, error: '', createdAt: new Date().toISOString(), orderId: null, invoiceId: null, ...extra };
}

const claimable = (j) =>
  Date.now() - new Date(j.createdAt).getTime() < 12 * 3600000 &&
  j.attempts < 5 &&
  (j.status === 'pendiente' || (j.status === 'imprimiendo' && Date.now() - new Date(j.claimedAt).getTime() > 60000));

let cache = null;
function load() {
  if (cache) return cache;
  try {
    const raw = localStorage.getItem(DB_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    cache = parsed?.version === 2 ? upgrade(parsed) : seed();
  } catch {
    cache = seed();
  }
  return cache;
}

const listeners = new Set();
const bc = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('kikes-demo') : null;

function emit(topic, payload, { remote = false } = {}) {
  for (const l of listeners) if (l.topic === topic) l.cb(payload);
  if (!remote && bc) bc.postMessage({ topic, payload });
}

bc?.addEventListener('message', (e) => {
  cache = null; // otra pestaña cambió los datos
  emit(e.data.topic, e.data.payload, { remote: true });
});

function commit(mutator, topics = []) {
  const db = load();
  const result = mutator(db);
  try {
    localStorage.setItem(DB_KEY, JSON.stringify(db));
  } catch {
    // modo privado / almacenamiento lleno: se mantiene en memoria
  }
  for (const t of topics) emit(t.topic || t, t.payload);
  return result;
}

function on(topic, cb) {
  const l = { topic, cb };
  listeners.add(l);
  return () => listeners.delete(l);
}

const clone = (v) => JSON.parse(JSON.stringify(v));
const delay = (v) => new Promise((resolve) => setTimeout(() => resolve(clone(v)), 60));
const fail = (message) => Promise.reject(new Error(message));

// ------------------------------------------------------------------ sesión demo
function sessionStaff() {
  try {
    const id = sessionStorage.getItem(SESSION_KEY);
    const s = id && load().staff.find((x) => x.id === id && x.isActive);
    return s || null;
  } catch {
    return null;
  }
}

function requireStaff(roles) {
  const s = sessionStaff();
  if (!s) throw new Error('Sesión de personal no válida');
  if (roles && !roles.includes(s.role)) throw new Error(`Tu rol (${s.role}) no tiene permiso para esta acción`);
  return s;
}

const publicStaff = (s, db) => ({
  id: s.id,
  tenantId: db.tenant.id,
  tenantSlug: db.tenant.slug,
  displayName: s.displayName,
  role: s.role
});

const withCategory = (db) => (p) => ({ ...p, category: db.categories.find((c) => c.id === p.categoryId)?.name || '' });

function soldOutMissing(db, product) {
  return (product.ingredients || []).find((i) => db.ingredientsStock[normalizeIngredient(i)]?.soldOut);
}

// ------------------------------------------------------------------ API
export const demoApi = {
  mode: 'demo',

  /** Solo demo: en Supabase el plan lo cambia la plataforma (service_role). */
  async setDemoPlan(plan) {
    requireStaff(['owner']);
    commit((d) => {
      d.tenant.plan = plan;
    }, ['menu']);
  },

  resetDemo() {
    cache = seed();
    commit(() => {}, ['menu', 'orders', 'billing']);
  },

  async getTenantBySlug(slug) {
    const db = load();
    if (db.tenant.slug === slug) return delay(db.tenant);
    const found = (db.tenants || []).find((t) => t.slug === slug);
    if (found) return delay(found);
    if (slug) return delay({ ...db.tenant, slug, name: slug, plan: 'basic' });
    return delay(null);
  },

  async getMenu() {
    const db = load();
    return delay({
      categories: db.categories,
      products: db.products.map(withCategory(db)),
      ingredientsStock: db.ingredientsStock
    });
  },

  subscribeMenu(_tenantId, onChange) {
    return on('menu', onChange);
  },

  async resolveTable(slug, token) {
    const db = load();
    if (db.tenant.slug !== slug) return delay(null);
    const t = db.tables.find((x) => x.token === token && x.isActive);
    return delay(t ? { id: t.id, label: t.label } : null);
  },

  async createOrder({ slug, tableToken, items, includeTip }) {
    const db = load();
    if (db.tenant.slug !== slug) return fail('Restaurante no encontrado');
    if (!hasFeature(db.tenant.plan, 'ordering')) return fail('Este restaurante no recibe pedidos desde la mesa. Pide a tu mesero.');
    const table = db.tables.find((t) => t.token === tableToken && t.isActive);
    if (!table) return fail('Código de mesa inválido. Escanea de nuevo el código de tu mesa.');
    if (!Array.isArray(items) || !items.length || items.length > 30) return fail('El pedido no tiene productos válidos');

    const lines = [];
    for (const it of items) {
      const product = db.products.find((p) => p.id === it.productId && p.available);
      if (!product) return fail('Un producto del pedido ya no está disponible');
      const missing = soldOutMissing(db, product);
      if (missing) return fail(`"${product.name}" está agotado (sin ${missing})`);
      const qty = Number(it.quantity);
      if (!Number.isInteger(qty) || qty < 1 || qty > 50) return fail(`Cantidad inválida para ${product.name}`);
      const check = validateSelections(product, it.selections || {});
      if (!check.ok) return fail(`${check.errors[0]} (${product.name})`);
      const unit = unitPriceFor(product, it.selections || {});
      lines.push({
        productId: product.id,
        name: product.name,
        quantity: qty,
        unitPrice: unit,
        totalPrice: unit * qty,
        selectedOptions: selectedOptionNames(product, it.selections || {})
      });
    }
    const subtotal = lines.reduce((s, l) => s + l.totalPrice, 0);
    const tip = includeTip ? computeTip(subtotal, db.tenant.tipRate) : 0;

    const order = commit((d) => {
      const o = {
        id: d.nextOrderId++,
        tenantId: d.tenant.id,
        tableId: table.id,
        tableLabel: table.label,
        status: ORDER_STATUS.PENDING,
        subtotal,
        tip,
        total: subtotal + tip,
        notes: '',
        createdAt: new Date().toISOString(),
        printedAt: null,
        items: lines
      };
      d.orders.push(o);
      enqueueOrder(d, o);
      return o;
    });
    emit('orders', { type: 'insert', order });
    emit('print');
    return delay({ orderId: order.id, tableLabel: order.tableLabel, subtotal, tip, total: subtotal + tip });
  },

  // ---------------------------------------------------------------- llamado al mesero
  async callWaiter({ slug, tableToken }) {
    const db = load();
    if (db.tenant.slug !== slug) return fail('Restaurante no encontrado');
    if (!hasFeature(db.tenant.plan, 'waiterCall')) return fail('Este restaurante no recibe llamados desde la mesa');
    const table = db.tables.find((t) => t.token === tableToken && t.isActive);
    if (!table) return fail('Código de mesa inválido. Escanea de nuevo el código de tu mesa.');
    // Igual que call_waiter(): un llamado abierto por mesa, y tocar de nuevo no crea otro.
    const recent = db.waiterCalls
      .filter((c) => c.tableId === table.id && (!c.attendedAt || Date.now() - new Date(c.createdAt).getTime() < 30000))
      .at(-1);
    if (recent) return delay({ callId: recent.id, tableLabel: recent.tableLabel, createdAt: recent.createdAt });
    const call = commit((d) => {
      const c = { id: d.nextCallId++, tableId: table.id, tableLabel: table.label, createdAt: new Date().toISOString(), attendedAt: null, attendedByName: '' };
      d.waiterCalls.push(c);
      d.waiterCalls = d.waiterCalls.slice(-200);
      return c;
    });
    emit('waiter', { type: 'insert', call });
    return delay({ callId: call.id, tableLabel: call.tableLabel, createdAt: call.createdAt });
  },

  async listWaiterCalls() {
    requireStaff();
    const since = Date.now() - 3 * 3600000;
    return delay(load().waiterCalls.filter((c) => !c.attendedAt && new Date(c.createdAt).getTime() >= since));
  },

  subscribeWaiterCalls(_tenantId, { onInsert, onChange }) {
    return on('waiter', (e) => (e?.type === 'insert' ? onInsert?.(e.call) : onChange?.()));
  },

  async attendWaiterCall(callId) {
    const s = requireStaff();
    commit((d) => {
      const c = d.waiterCalls.find((x) => x.id === callId);
      if (c && !c.attendedAt) Object.assign(c, { attendedAt: new Date().toISOString(), attendedByName: s.displayName });
    });
    emit('waiter', { type: 'update' });
  },

  // ---------------------------------------------------------------- sesión
  async listStaffForLogin(slug) {
    const db = load();
    if (db.tenant.slug !== slug) return delay([]);
    return delay(db.staff.filter((s) => s.isActive).map((s) => ({ id: s.id, displayName: s.displayName, role: s.role })));
  },

  async loginStaff({ slug, staffId, pin }) {
    const db = load();
    const s = db.tenant.slug === slug && db.staff.find((x) => x.id === staffId && x.isActive);
    if (!s) return fail('PIN incorrecto');
    if (s.lockedUntil && new Date(s.lockedUntil) > new Date()) {
      return fail('Usuario bloqueado por intentos fallidos. Intenta de nuevo en 15 minutos.');
    }
    if (s.pin !== pin) {
      commit((d) => {
        const x = d.staff.find((y) => y.id === staffId);
        x.failedAttempts += 1;
        if (x.failedAttempts >= 5) {
          x.failedAttempts = 0;
          x.lockedUntil = new Date(Date.now() + 15 * 60000).toISOString();
        }
      });
      return fail('PIN incorrecto');
    }
    commit((d) => {
      const x = d.staff.find((y) => y.id === staffId);
      x.failedAttempts = 0;
      x.lockedUntil = null;
    });
    try {
      sessionStorage.setItem(SESSION_KEY, s.id);
    } catch {
      // sin sessionStorage
    }
    emit('auth');
    return delay(publicStaff(s, db));
  },

  async logoutStaff() {
    try {
      sessionStorage.removeItem(SESSION_KEY);
    } catch {
      // sin sessionStorage
    }
    emit('auth');
  },

  async getCurrentStaff() {
    const s = sessionStaff();
    return delay(s ? publicStaff(s, load()) : null);
  },

  onAuthChange(cb) {
    return on('auth', cb);
  },

  // ---------------------------------------------------------------- cocina
  async listOpenOrders() {
    requireStaff();
    return delay(load().orders.filter((o) => OPEN_STATUSES.includes(o.status)));
  },

  subscribeOrders(_tenantId, { onInsert, onChange }) {
    return on('orders', (e) => {
      if (e?.type === 'insert') onInsert?.({ id: e.order.id, table_label: e.order.tableLabel });
      else onChange?.(e?.order);
    });
  },

  async updateOrderStatus(orderId, status) {
    requireStaff();
    const db = load();
    const o = db.orders.find((x) => x.id === orderId);
    if (!o) return fail('Pedido no encontrado');
    if (status === ORDER_STATUS.PAID) return fail('Un pedido solo pasa a Cobrado al emitir su comprobante');
    const withPos = hasFeature(db.tenant.plan, 'pos');
    if (!canTransition(o.status, status, { withPos })) {
      if (o.status === ORDER_STATUS.READY && status === ORDER_STATUS.TO_PAY) return fail('Sin caja en tu plan: marca la comanda como entregada');
      if (o.status === ORDER_STATUS.READY && status === ORDER_STATUS.DELIVERED) return fail('Con caja, la comanda lista pasa a caja para cobrarse');
      return fail(`Transición de estado no permitida: ${o.status} → ${status}`);
    }
    const order = commit((d) => {
      const x = d.orders.find((y) => y.id === orderId);
      x.status = status;
      return x;
    });
    emit('orders', { type: 'update', order });
  },

  async requestOrderReprint(orderId) {
    requireStaff();
    if (!load().orders.some((x) => x.id === orderId)) return fail('Pedido no encontrado');
    const { order, count } = commit((d) => {
      const x = d.orders.find((y) => y.id === orderId);
      x.printedAt = null;
      return { order: x, count: enqueueOrder(d, x, true) };
    });
    if (!count) return fail('No hay estaciones de impresión configuradas');
    emit('orders', { type: 'update', order });
    emit('print');
  },

  // ---------------------------------------------------------------- fila de impresión
  async listPrintStations() {
    requireStaff();
    return delay([...load().printStations].sort((a, b) => a.sortOrder - b.sortOrder));
  },

  async savePrintStation({ id = null, name, isDefault = false, printsReceipts = false }) {
    requireStaff(['owner', 'admin']);
    const clean = String(name || '').trim();
    if (!clean || clean.length > 40) return fail('El nombre de la estación debe tener entre 1 y 40 caracteres');
    if (load().printStations.some((s) => s.id !== id && s.name.toLowerCase() === clean.toLowerCase())) return fail('Ya existe una estación con ese nombre');
    if (id && !load().printStations.some((s) => s.id === id)) return fail('Estación no encontrada');
    const saved = commit((d) => {
      if (isDefault) d.printStations.forEach((s) => (s.isDefault = false));
      if (printsReceipts) d.printStations.forEach((s) => (s.printsReceipts = false));
      if (id) {
        Object.assign(d.printStations.find((s) => s.id === id), { name: clean, isDefault, printsReceipts });
        return id;
      }
      const nid = `st-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`;
      d.printStations.push({ id: nid, name: clean, isDefault, printsReceipts, sortOrder: d.printStations.length });
      return nid;
    }, ['print']);
    return delay(saved);
  },

  async deletePrintStation(id) {
    requireStaff(['owner', 'admin']);
    if (load().printStations.length <= 1) return fail('El restaurante necesita al menos una estación de impresión');
    commit((d) => {
      d.printStations = d.printStations.filter((s) => s.id !== id);
      d.printJobs = d.printJobs.filter((j) => j.stationId !== id);
      for (const c of d.categories) if (c.printStationId === id) c.printStationId = null;
    }, ['print', 'menu']);
  },

  async setCategoryStation(categoryId, stationId) {
    requireStaff(['owner', 'admin']);
    commit((d) => {
      d.categories.find((c) => c.id === categoryId).printStationId = stationId || null;
    }, ['menu']);
  },

  // El agente local se conecta a la nube: en la demo solo imprime el navegador.
  async listPrintDevices() {
    requireStaff(['owner', 'admin']);
    return delay([]);
  },
  createPrintDevice: () => fail('Los equipos de impresión necesitan la versión en la nube (Supabase). En la demo, usa "Este navegador imprime".'),
  newPairingCode: () => fail('Solo disponible con Supabase'),
  updatePrintDevice: () => fail('Solo disponible con Supabase'),
  revokePrintDevice: () => fail('Solo disponible con Supabase'),
  agentConnection: () => null,

  async claimPrintJobs(stationIds = null) {
    const s = requireStaff();
    const jobs = commit((d) => {
      const picked = d.printJobs.filter((j) => (!stationIds || stationIds.includes(j.stationId)) && claimable(j)).slice(0, 10);
      for (const j of picked) Object.assign(j, { status: 'imprimiendo', attempts: j.attempts + 1, claimedAt: new Date().toISOString(), claimedByName: `Navegador de ${s.displayName}`, error: '' });
      return picked;
    });
    return delay(jobs);
  },

  async reportPrintJob(jobId, ok, error = null) {
    requireStaff();
    const order = commit((d) => {
      const j = d.printJobs.find((x) => x.id === jobId && x.status === 'imprimiendo');
      if (!j) return null;
      j.status = ok ? 'impreso' : j.attempts >= 5 ? 'error' : 'pendiente';
      j.error = ok ? '' : String(error || 'Error de impresión').slice(0, 300);
      if (!ok || j.kind !== 'comanda') return null;
      const pending = d.printJobs.some((x) => x.orderId === j.orderId && x.kind === 'comanda' && x.status !== 'impreso');
      const o = d.orders.find((x) => x.id === j.orderId);
      if (o && !pending) o.printedAt = new Date().toISOString();
      return o && !pending ? o : null;
    }, ['print']);
    if (order) emit('orders', { type: 'update', order });
  },

  async printInvoice(invoiceId) {
    requireStaff(['owner', 'admin', 'caja']);
    const db = load();
    const inv = db.invoices.find((i) => i.id === invoiceId);
    if (!inv) return fail('Comprobante no encontrado');
    const station = db.printStations.find((s) => s.printsReceipts);
    if (!station) return fail('Elige en Administración qué estación imprime los tiquetes de caja');
    const t = db.tenant;
    const id = commit((d) => {
      const job = newJob(d, station.id, 'tiquete', {
        restaurant: t.name, nit: t.nit, address: [t.address, t.city].filter(Boolean).join(', '), phone: t.phone, footer: t.footerText,
        station: station.name, kind: inv.kind, number: inv.number, createdAt: inv.createdAt, tableLabel: inv.tableLabel,
        customer: inv.customer, paymentMethod: inv.paymentMethod, items: inv.items, itemsTotal: inv.itemsTotal, taxBase: inv.taxBase,
        tax: inv.tax, taxType: inv.taxType, taxRate: inv.taxRate, tip: inv.tip, total: inv.total, cufe: inv.cufe,
        dianStatus: inv.dianStatus, issuedByName: inv.issuedByName
      }, { invoiceId: inv.id });
      d.printJobs.push(job);
      return job.id;
    }, ['print']);
    return delay(id);
  },

  async printTest(stationId) {
    const s = requireStaff(['owner', 'admin']);
    const station = load().printStations.find((x) => x.id === stationId);
    if (!station) return fail('Estación no encontrada');
    const id = commit((d) => {
      const job = newJob(d, station.id, 'prueba', { restaurant: d.tenant.name, station: station.name, requestedBy: s.displayName, createdAt: new Date().toISOString() });
      d.printJobs.push(job);
      return job.id;
    }, ['print']);
    return delay(id);
  },

  subscribePrintJobs(_tenantId, onChange) {
    return on('print', onChange);
  },

  async setIngredientStock({ name, soldOut, note }) {
    const s = requireStaff(['owner', 'admin', 'cocina']);
    const key = normalizeIngredient(name);
    if (!key) return fail('Ingrediente inválido');
    const db = load();
    if (!!db.ingredientsStock[key]?.soldOut === soldOut) return delay({ changed: false });
    const affected = getAffectedProducts(db.products, key);
    commit(
      (d) => {
        if (soldOut) {
          d.ingredientsStock[key] = { name: name.trim(), soldOut: true, at: new Date().toISOString(), by: s.displayName, note: note || '' };
        } else {
          delete d.ingredientsStock[key];
        }
        d.stockEvents.unshift({
          id: `ev-${Date.now()}-${Math.random().toString(16).slice(2)}`,
          type: soldOut ? 'AGOTADO' : 'REPUESTO',
          ingredient: name.trim(),
          affectedProducts: affected,
          note: note || '',
          reportedBy: s.displayName,
          timestamp: new Date().toISOString()
        });
        d.stockEvents = d.stockEvents.slice(0, 300);
      },
      ['menu']
    );
    return delay({ changed: true, affectedProducts: affected });
  },

  async listStockEvents() {
    requireStaff();
    return delay(load().stockEvents);
  },

  async listIngredients() {
    requireStaff(['owner', 'admin', 'cocina']);
    const db = load();
    const items = Object.values(db.inventoryItems || {});
    return delay(items);
  },

  async saveIngredient(_tenantId, item) {
    const s = requireStaff(['owner', 'admin']);
    const key = normalizeIngredient(item.name);
    if (!key) return fail('Nombre de ingrediente inválido');
    const isSoldOut = item.isSoldOut !== undefined
      ? Boolean(item.isSoldOut)
      : (Boolean(item.autoDeplete) && (Number(item.currentStock) || 0) <= 0);

    const saved = {
      key,
      name: item.name.trim(),
      category: item.category || 'otros',
      unit: item.unit || 'unidad',
      currentStock: Number(item.currentStock ?? 0),
      minStock: Number(item.minStock ?? 0),
      unitCost: Number(item.unitCost ?? 0),
      autoDeplete: Boolean(item.autoDeplete),
      supplier: item.supplier ? item.supplier.trim() : '',
      isSoldOut,
      note: item.note || '',
      reportedBy: s.displayName,
      updatedAt: new Date().toISOString()
    };

    commit((d) => {
      d.inventoryItems = d.inventoryItems || {};
      d.inventoryItems[key] = saved;
      if (isSoldOut) {
        d.ingredientsStock[key] = {
          name: saved.name,
          soldOut: true,
          at: saved.updatedAt,
          by: s.displayName,
          note: saved.note
        };
      } else {
        delete d.ingredientsStock[key];
      }
    }, ['menu']);

    return delay({ ok: true, key, item: saved });
  },

  async deleteIngredient(_tenantId, key) {
    requireStaff(['owner', 'admin']);
    commit((d) => {
      d.inventoryItems = d.inventoryItems || {};
      delete d.inventoryItems[key];
      delete d.ingredientsStock[key];
    }, ['menu']);
    return delay({ ok: true });
  },

  async registerStockMovement(_tenantId, mov) {
    const s = requireStaff(['owner', 'admin']);
    const key = normalizeIngredient(mov.name);
    if (!key) return fail('Ingrediente inválido');
    const qty = Number(mov.quantity);
    if (!qty || isNaN(qty)) return fail('Cantidad inválida');

    const db = load();
    const existing = db.inventoryItems?.[key] || {
      key,
      name: mov.name.trim(),
      category: 'otros',
      unit: 'unidad',
      currentStock: 0,
      minStock: 0,
      unitCost: 0,
      autoDeplete: false,
      supplier: '',
      isSoldOut: false
    };

    const prevStock = Number(existing.currentStock) || 0;
    let newStock = prevStock;
    if (mov.type === 'ENTRADA') newStock = prevStock + Math.abs(qty);
    else if (mov.type === 'MERMA' || mov.type === 'SALIDA') newStock = Math.max(0, prevStock - Math.abs(qty));
    else if (mov.type === 'AJUSTE') newStock = Math.max(0, qty);

    let isSoldOut = existing.isSoldOut;
    if (existing.autoDeplete) {
      if (newStock > 0 && isSoldOut) isSoldOut = false;
      else if (newStock <= 0 && !isSoldOut) isSoldOut = true;
    }

    const updated = {
      ...existing,
      currentStock: newStock,
      isSoldOut,
      updatedAt: new Date().toISOString()
    };

    const movementRecord = {
      id: `mov-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      ingredientKey: key,
      ingredientName: mov.name.trim(),
      type: mov.type,
      quantity: qty,
      previousStock: prevStock,
      newStock,
      cost: Number(mov.cost || 0),
      supplier: mov.supplier || '',
      invoiceRef: mov.invoiceRef || '',
      note: mov.note || '',
      createdBy: s.displayName,
      createdAt: new Date().toISOString()
    };

    commit((d) => {
      d.inventoryItems = d.inventoryItems || {};
      d.inventoryItems[key] = updated;
      d.inventoryMovements = d.inventoryMovements || [];
      d.inventoryMovements.unshift(movementRecord);
      d.inventoryMovements = d.inventoryMovements.slice(0, 300);

      if (isSoldOut) {
        d.ingredientsStock[key] = {
          name: updated.name,
          soldOut: true,
          at: updated.updatedAt,
          by: s.displayName,
          note: updated.note
        };
      } else {
        delete d.ingredientsStock[key];
      }
    }, ['menu']);

    return delay({ ok: true, previousStock: prevStock, newStock, isSoldOut });
  },

  async listInventoryMovements(_tenantId, ingredientKey = null) {
    requireStaff(['owner', 'admin']);
    const db = load();
    let list = db.inventoryMovements || [];
    if (ingredientKey) {
      list = list.filter((m) => m.ingredientKey === ingredientKey);
    }
    return delay(list);
  },

  // ---------------------------------------------------------------- caja
  async listCustomers() {
    requireStaff(['owner', 'admin', 'caja']);
    return delay(load().customers);
  },

  async createCustomer(_tenantId, c) {
    requireStaff(['owner', 'admin', 'caja']);
    const db = load();
    if (db.customers.some((x) => x.docType === c.docType && x.docNumber === c.docNumber.trim())) {
      return fail('Ya existe un cliente con ese documento');
    }
    const customer = commit((d) => {
      const x = { id: `cust-${Date.now()}`, name: c.name.trim(), docType: c.docType, docNumber: c.docNumber.trim(), email: c.email || '', phone: c.phone || '' };
      d.customers.push(x);
      return x;
    });
    return delay(customer);
  },

  async issueInvoice({ orderIds, kind, customerId, paymentMethod, tip: tipInput = null }) {
    const s = requireStaff(['owner', 'admin', 'caja']);
    const db = load();
    if (!hasFeature(db.tenant.plan, 'pos')) return fail('La caja requiere el plan Premium');
    if (kind === 'electronica' && !hasFeature(db.tenant.plan, 'dian')) return fail('La facturación electrónica requiere el plan Premium');
    const ids = [...new Set((orderIds || []).filter((x) => x != null))].sort((a, b) => a - b);
    if (!ids.length) return fail('Selecciona al menos una comanda para cobrar');
    const orders = ids.map((id) => db.orders.find((o) => o.id === id));
    if (orders.some((o) => !o)) return fail('Pedido no encontrado');
    const notReady = orders.find((o) => o.status !== ORDER_STATUS.TO_PAY);
    if (notReady) return fail(`El pedido #${notReady.id} no está listo para cobrar (estado: ${notReady.status})`);
    if (new Set(orders.map((o) => o.tableId || `label:${o.tableLabel}`)).size > 1) {
      return fail('Todas las comandas de un comprobante deben ser de la misma mesa');
    }
    const seq = db.sequences.find((x) => x.kind === kind);
    if (!seq) return fail(`Configura primero la numeración de ${kind} en Administración`);
    if (seq.rangeTo && seq.nextNumber > seq.rangeTo) return fail(`Se agotó el rango autorizado (${seq.rangeFrom} a ${seq.rangeTo}). Solicita una nueva resolución.`);
    if (kind === 'electronica' && (!seq.validUntil || new Date(seq.validUntil) < new Date(new Date().toDateString()))) {
      return fail('La resolución de facturación está vencida o sin fecha de vigencia');
    }
    const customer = customerId ? db.customers.find((c) => c.id === customerId) : CONSUMIDOR_FINAL;
    if (!customer) return fail('Cliente no encontrado');
    const { subtotal, tip: ordersTip } = sumOrders(orders);
    // Propina voluntaria: la confirma la caja al cobrar. Sin valor, la de las comandas.
    let tip = ordersTip;
    if (tipInput !== null && tipInput !== undefined) {
      tip = Math.round(Number(tipInput));
      if (!Number.isFinite(tip) || tip < 0) return fail('La propina no puede ser negativa');
      if (tip > subtotal) return fail('La propina no puede superar el valor del consumo');
    }
    const rate = effectiveTaxRate(db.tenant);
    const { base, tax } = splitTaxIncluded(subtotal, rate);

    const invoice = commit(
      (d) => {
        const sq = d.sequences.find((x) => x.kind === kind);
        const number = sq.nextNumber;
        sq.nextNumber += 1;
        const inv = {
          id: `inv-${Date.now()}`,
          orderIds: ids,
          dailyCloseId: null,
          kind,
          number: `${sq.prefix}-${number}`,
          customer: { ...customer },
          paymentMethod,
          tableLabel: orders[0].tableLabel,
          items: mergeInvoiceItems(orders),
          itemsTotal: subtotal,
          taxBase: base,
          tax,
          taxType: d.tenant.taxType,
          taxRate: rate,
          tip,
          total: subtotal + tip,
          cufe: kind === 'electronica' ? Array.from({ length: 96 }, () => '0123456789abcdef'[Math.floor(Math.random() * 16)]).join('') : null,
          dianStatus: kind === 'electronica' ? 'simulado' : 'no_aplica',
          issuedByName: s.displayName,
          createdAt: new Date().toISOString()
        };
        d.invoices.unshift(inv);
        for (const o of d.orders) if (ids.includes(o.id)) o.status = ORDER_STATUS.PAID;
        return inv;
      },
      ['billing']
    );
    for (const order of orders) emit('orders', { type: 'update', order: { ...order, status: ORDER_STATUS.PAID } });
    return delay(invoice);
  },

  async listOpenInvoices() {
    requireStaff(['owner', 'admin', 'caja']);
    return delay(load().invoices.filter((i) => !i.dailyCloseId));
  },

  async closeRegister({ countedCash }) {
    const s = requireStaff(['owner', 'admin', 'caja']);
    if (!Number.isFinite(countedCash) || countedCash < 0) return fail('Ingresa el efectivo contado en caja');
    const close = commit(
      (d) => {
        const open = d.invoices.filter((i) => !i.dailyCloseId);
        const day = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota' }).format(new Date()).replace(/-/g, '');
        const seqToday = d.dailyCloses.filter((c) => c.code.startsWith(`Z-${day}-`)).length + 1;
        const sum = (list) => list.reduce((acc, i) => acc + i.total, 0);
        const cash = sum(open.filter((i) => i.paymentMethod === 'efectivo'));
        const c = {
          id: `z-${Date.now()}`,
          code: `Z-${day}-${String(seqToday).padStart(2, '0')}`,
          closedByName: s.displayName,
          periodStart: d.dailyCloses[0]?.periodEnd || open[open.length - 1]?.createdAt || null,
          periodEnd: new Date().toISOString(),
          invoiceCount: open.length,
          totalSales: sum(open),
          cashSales: cash,
          cardSales: sum(open.filter((i) => i.paymentMethod === 'tarjeta')),
          transferSales: sum(open.filter((i) => i.paymentMethod === 'transferencia')),
          tips: open.reduce((acc, i) => acc + i.tip, 0),
          countedCash,
          difference: countedCash - cash,
          createdAt: new Date().toISOString()
        };
        open.forEach((i) => {
          i.dailyCloseId = c.id;
        });
        d.dailyCloses.unshift(c);
        return c;
      },
      ['billing']
    );
    return delay(close);
  },

  async listDailyCloses() {
    requireStaff(['owner', 'admin', 'caja']);
    return delay(load().dailyCloses.slice(0, 30));
  },

  subscribeBilling(cb) {
    return on('billing', cb);
  },

  // ---------------------------------------------------------------- administración
  async updateTenant(_tenantId, tenant) {
    requireStaff(['owner', 'admin']);
    const { plan: _plan, slug: _slug, id: _id, ...editable } = tenant;
    const tipRate = Number(editable.tipRate);
    if (!(tipRate >= 0 && tipRate <= 10)) return fail('La propina sugerida debe estar entre 0 % y 10 %');
    commit((d) => Object.assign(d.tenant, editable, { kitchenDisplay: editable.kitchenDisplay !== false }), ['menu']);
  },

  async saveProduct(_tenantId, product) {
    requireStaff(['owner', 'admin']);
    const saved = commit(
      (d) => {
        const { category: _c, soldOut: _s, soldOutInfo: _i, ...clean } = product;
        if (clean.id) {
          const idx = d.products.findIndex((p) => p.id === clean.id);
          d.products[idx] = { ...d.products[idx], ...clean };
          return d.products[idx];
        }
        const p = { ...clean, id: `prod-${Date.now()}`, tenantId: d.tenant.id, sortOrder: d.products.length };
        d.products.push(p);
        return p;
      },
      ['menu']
    );
    return delay(withCategory(load())(saved));
  },

  async setProductAvailable(productId, available) {
    requireStaff(['owner', 'admin']);
    commit((d) => {
      d.products.find((p) => p.id === productId).available = available;
    }, ['menu']);
  },

  async deleteProduct(productId) {
    requireStaff(['owner', 'admin']);
    commit((d) => {
      d.products = d.products.filter((p) => p.id !== productId);
    }, ['menu']);
  },

  async listTables() {
    requireStaff();
    return delay(load().tables);
  },

  async createTables(_tenantId, labels) {
    requireStaff(['owner', 'admin']);
    const db = load();
    const dup = labels.find((l) => db.tables.some((t) => t.label === l));
    if (dup) return fail(`Ya existe la mesa ${dup}`);
    return commit((d) => {
      const created = labels.map((label, i) => ({ id: `table-${Date.now()}-${i}`, label, token: demoTableToken(label), isActive: true, sortOrder: d.tables.length + i + 1 }));
      d.tables.push(...created);
      return created.map((t) => ({ ...t }));
    });
  },

  async deleteTable(tableId) {
    requireStaff(['owner', 'admin']);
    const db = load();
    const table = db.tables.find((t) => t.id === tableId);
    if (!table) return fail('Mesa no encontrada');
    const hasOpenOrders = db.orders.some((o) => o.tableId === tableId && OPEN_STATUSES.includes(o.status));
    if (hasOpenOrders) return fail(`No se puede eliminar la mesa ${table.label}: tiene pedidos abiertos`);
    commit((d) => {
      d.tables = d.tables.filter((t) => t.id !== tableId);
    });
    await localFloorPlanStore.saveTableLayout(db.tenant.id, { [tableId]: null });
  },

  // Plano de sala (ambientes y ubicación de mesas). Ver services/floorPlanStore.js.
  async getFloorPlan(tenantId) {
    requireStaff();
    return localFloorPlanStore.getFloorPlan(tenantId);
  },

  async saveEnvironments(tenantId, environments) {
    requireStaff(['owner', 'admin']);
    return localFloorPlanStore.saveEnvironments(tenantId, environments);
  },

  async saveTableLayout(tenantId, updates) {
    requireStaff(['owner', 'admin']);
    return localFloorPlanStore.saveTableLayout(tenantId, updates);
  },

  subscribeFloorPlan(tenantId, onChange) {
    return localFloorPlanStore.subscribeFloorPlan(tenantId, onChange);
  },

  async setTableActive(tableId, isActive) {
    requireStaff(['owner', 'admin']);
    commit((d) => {
      d.tables.find((t) => t.id === tableId).isActive = isActive;
    });
  },

  async regenerateTableToken(tableId) {
    requireStaff(['owner', 'admin']);
    return commit((d) => {
      const t = d.tables.find((x) => x.id === tableId);
      t.token = `demo-${Math.random().toString(16).slice(2, 10)}`;
      return t.token;
    });
  },

  async listStaff() {
    requireStaff(['owner', 'admin']);
    return delay(
      load().staff.map((s) => ({ id: s.id, displayName: s.displayName, role: s.role, isActive: s.isActive, lockedUntil: s.lockedUntil, createdAt: s.createdAt }))
    );
  },

  async createStaff({ displayName, role, pin }) {
    const me = requireStaff(['owner', 'admin']);
    if (['owner', 'admin'].includes(role) && me.role !== 'owner') return fail('Solo el dueño puede crear administradores');
    if (!/^[0-9]{4,6}$/.test(pin || '')) return fail('El PIN debe tener entre 4 y 6 dígitos');
    if (load().staff.some((s) => s.displayName === displayName.trim())) return fail('Ya existe un usuario con ese nombre');
    return commit((d) => {
      const id = `staff-${Date.now()}`;
      d.staff.push({ id, displayName: displayName.trim(), role, pin, isActive: true, failedAttempts: 0, lockedUntil: null, createdAt: new Date().toISOString() });
      return id;
    });
  },

  async updateStaff({ staffId, pin = null, isActive = null, role = null }) {
    const me = requireStaff(['owner', 'admin']);
    const target = load().staff.find((s) => s.id === staffId);
    if (!target) return fail('Usuario no encontrado');
    if (me.role !== 'owner' && (['owner', 'admin'].includes(target.role) || ['owner', 'admin'].includes(role))) {
      return fail('Solo el dueño puede modificar administradores');
    }
    if (target.id === me.id && (isActive === false || (role && role !== me.role))) return fail('No puedes desactivarte ni cambiar tu propio rol');
    if (pin !== null && !/^[0-9]{4,6}$/.test(pin)) return fail('El PIN debe tener entre 4 y 6 dígitos');
    commit((d) => {
      const s = d.staff.find((x) => x.id === staffId);
      if (pin !== null) Object.assign(s, { pin, failedAttempts: 0, lockedUntil: null });
      if (isActive !== null) s.isActive = isActive;
      if (role !== null) s.role = role;
    });
  },

  async getBillingSettings() {
    requireStaff(['owner', 'admin', 'caja']);
    const db = load();
    return delay({ ...db.billingSettings, sequences: db.sequences });
  },

  async saveBillingSettings(_tenantId, { provider, environment, sequences }) {
    requireStaff(['owner', 'admin']);
    commit((d) => {
      d.billingSettings = { provider, environment };
      for (const seq of sequences) {
        const clean = {
          ...seq,
          prefix: String(seq.prefix || '').toUpperCase(),
          rangeFrom: Number(seq.rangeFrom) || 1,
          rangeTo: seq.rangeTo === '' || seq.rangeTo === null ? null : Number(seq.rangeTo),
          nextNumber: Math.max(Number(seq.nextNumber) || 1, Number(seq.rangeFrom) || 1)
        };
        const idx = d.sequences.findIndex((x) => x.kind === seq.kind);
        if (idx >= 0) d.sequences[idx] = clean;
        else d.sequences.push(clean);
      }
    });
  },

  // ------------------------------------------------------------------ Registro de nuevo restaurante (Multi-tenant)
  async sendOnboardingOtp(email) {
    const cleanEmail = String(email || '').trim().toLowerCase();
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return fail('Ingresa un correo electrónico válido');
    }
    const code = '123456';
    commit((d) => {
      d.onboardingCodes = d.onboardingCodes || {};
      d.onboardingCodes[cleanEmail] = {
        code,
        attempts: 0,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString()
      };
    });
    return delay({ ok: true, simulated: true, code });
  },

  async verifyOnboardingOtp({ email, code }) {
    const cleanEmail = String(email || '').trim().toLowerCase();
    const cleanCode = String(code || '').trim();
    const db = load();
    const entry = db.onboardingCodes?.[cleanEmail];
    if (!entry) return fail('No hay un código solicitado para este correo');
    if (new Date(entry.expiresAt).getTime() < Date.now()) return fail('El código ha expirado');
    if (entry.code !== cleanCode) return fail('Código de verificación incorrecto');
    return delay({ ok: true });
  },

  async checkSlugAvailable(slug) {
    const s = String(slug || '').trim().toLowerCase();
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(s) || s.length < 3 || s.length > 60) {
      return delay({ available: false, error: 'El enlace debe tener entre 3 y 60 letras, números o guiones' });
    }
    const db = load();
    if (db.tenant?.slug === s) {
      return delay({ available: false, error: 'Este enlace ya está ocupado por otro restaurante' });
    }
    return delay({ available: true, slug: s });
  },

  async registerTenant(data) {
    const name = String(data.name || '').trim();
    const slug = String(data.slug || '').trim().toLowerCase();
    const email = String(data.email || '').trim().toLowerCase();
    const pin = String(data.pin || '').trim();
    const ownerName = String(data.ownerName || 'Dueño').trim();

    if (!name) return fail('Escribe el nombre del restaurante');
    if (!slug) return fail('El enlace del restaurante es obligatorio');
    if (!/^[0-9]{4,6}$/.test(pin)) return fail('El PIN debe tener de 4 a 6 dígitos');

    const tenantId = `tenant-${Date.now()}`;
    const staffId = `staff-${Date.now()}`;

    commit((d) => {
      d.tenant = {
        id: tenantId,
        slug,
        name,
        email,
        phone: data.phone || '',
        city: data.city || '',
        plan: 'basic',
        taxType: 'INC',
        taxRate: 8,
        tipRate: 10,
        footerText: '',
        kitchenDisplay: true
      };
      d.staff = [
        {
          id: staffId,
          displayName: ownerName,
          role: 'owner',
          pin,
          isActive: true,
          failedAttempts: 0,
          lockedUntil: null,
          createdAt: new Date().toISOString()
        }
      ];
      d.tables = [
        { id: 't-1', label: '1', token: `mesa-${slug}-1`, isActive: true, sortOrder: 1 },
        { id: 't-2', label: '2', token: `mesa-${slug}-2`, isActive: true, sortOrder: 2 },
        { id: 't-3', label: '3', token: `mesa-${slug}-3`, isActive: true, sortOrder: 3 },
        { id: 't-4', label: '4', token: `mesa-${slug}-4`, isActive: true, sortOrder: 4 }
      ];
      d.categories = [
        { id: 'c-1', name: 'Entradas', sortOrder: 1 },
        { id: 'c-2', name: 'Platos Fuertes', sortOrder: 2 },
        { id: 'c-3', name: 'Bebidas', sortOrder: 3 }
      ];
      d.products = [];
      d.orders = [];
      d.invoices = [];
      d.dailyCloses = [];
      if (d.onboardingCodes) delete d.onboardingCodes[email];
    });

    // Iniciar sesión del dueño inmediatamente
    await this.loginStaff({ slug, staffId, pin });

    return delay({
      ok: true,
      tenantId,
      slug,
      name,
      staffId,
      ownerName
    });
  },

  async signInWithGoogle() {
    return delay({ url: `${window.location.origin}/registro` });
  },

  async getAuthUser() {
    return null;
  },

  async signOutAuth() {
    return delay(true);
  },

  // ------------------------------------------------------------------ Super Admin (Demo / Vitest)
  async checkIsPlatformAdmin(email = null) {
    const adminEmails = ['omar6688.oc@gmail.com', 'dueño.local@kikesfood.com', 'dueno@local.dev'];
    if (email && adminEmails.includes(email.toLowerCase())) return delay(true);
    const user = await this.getAuthUser();
    return delay(Boolean(user?.email && adminEmails.includes(user.email.toLowerCase())));
  },

  async superadminListTenants() {
    const db = load();
    const t = db.tenant;
    const paidOrders = (db.orders || []).filter((o) => ['paid', 'delivered'].includes(o.status));
    const totalSales = paidOrders.reduce((acc, o) => acc + (o.total || 0), 0);
    return delay([
      {
        id: t.id,
        slug: t.slug,
        name: t.name,
        email: 'demo@kikesfood.com',
        phone: t.phone || '3001234567',
        city: t.city || 'Bogotá',
        plan: t.plan || 'basic',
        plan_expires_at: t.planExpiresAt || null,
        is_active: t.isActive !== false,
        created_at: new Date().toISOString(),
        orders_count: (db.orders || []).length,
        total_sales: totalSales,
        last_order_at: db.orders?.[db.orders.length - 1]?.createdAt || null
      }
    ]);
  },

  async superadminToggleTenant(tenantId, isActive) {
    commit((d) => {
      if (d.tenant.id === tenantId) {
        d.tenant.isActive = isActive;
      }
    });
    return delay({ ok: true, tenantId, isActive });
  },

  async superadminChangeTenantPlan(tenantId, plan, durationDays = null) {
    const db = load();
    const isTrattoria = tenantId === db.tenant.id;
    if (plan === 'premium' && !isTrattoria) {
      return fail('El plan Premium se encuentra en desarrollo y solo está disponible para pruebas en el restaurante "la-trattoria"');
    }

    let exp = null;
    if (durationDays) {
      exp = new Date(Date.now() + durationDays * 86400000).toISOString();
    }
    commit((d) => {
      if (d.tenant.id === tenantId) {
        d.tenant.plan = plan;
        d.tenant.planExpiresAt = exp;
      }
    });
    return delay({ ok: true, tenantId, plan, planExpiresAt: exp });
  },

  async superadminCreateUpgradeCode({ plan, durationDays = null, targetSlug = null }) {
    if (plan === 'premium' && targetSlug !== 'la-trattoria') {
      return fail('El plan Premium solo está disponible para pruebas en el restaurante "la-trattoria"');
    }

    const prefix = plan === 'intermedio' ? 'INT' : (plan === 'premium' ? 'PREM' : 'BAS');
    const randomHex = Math.random().toString(36).slice(2, 6).toUpperCase();
    const code = `KIKE-${prefix}-${randomHex}`;
    const codeObj = {
      id: `code-${Date.now()}`,
      code,
      targetSlug: targetSlug || null,
      target_slug: targetSlug || null,
      plan,
      durationDays: durationDays ? Number(durationDays) : null,
      duration_days: durationDays ? Number(durationDays) : null,
      expiresAt: new Date(Date.now() + 30 * 86400000).toISOString(),
      expires_at: new Date(Date.now() + 30 * 86400000).toISOString(),
      redeemedAt: null,
      redeemed_at: null,
      redeemedSlug: null,
      redeemed_slug: null,
      createdBy: 'omar6688.oc@gmail.com',
      created_by: 'omar6688.oc@gmail.com',
      createdAt: new Date().toISOString(),
      created_at: new Date().toISOString(),
      isValid: true,
      is_valid: true
    };
    commit((d) => {
      d.upgradeCodes = d.upgradeCodes || [];
      d.upgradeCodes.unshift(codeObj);
    });
    return delay({
      ok: true,
      code,
      plan,
      durationDays,
      targetSlug,
      expiresAt: codeObj.expiresAt,
      createdAt: codeObj.createdAt
    });
  },

  async superadminListUpgradeCodes() {
    const db = load();
    return delay(db.upgradeCodes || []);
  },

  async redeemPlanCode({ slug, code }) {
    const db = load();
    const cleanCode = (code || '').trim().toUpperCase();
    const codeObj = (db.upgradeCodes || []).find((c) => c.code === cleanCode);
    if (!codeObj) {
      return fail(`El código de activación "${cleanCode}" no es válido`);
    }
    if (codeObj.redeemed_at) {
      return fail('Este código ya fue canjeado');
    }
    if (codeObj.target_slug && codeObj.target_slug !== slug) {
      return fail('Este código fue emitido para otro restaurante');
    }
    if (codeObj.plan === 'premium' && slug !== 'la-trattoria') {
      return fail('El plan Premium se encuentra en desarrollo y no está disponible para activación pública');
    }

    let exp = null;
    if (codeObj.duration_days) {
      exp = new Date(Date.now() + codeObj.duration_days * 86400000).toISOString();
    }

    commit((d) => {
      d.tenant.plan = codeObj.plan;
      d.tenant.planExpiresAt = exp;
      const target = (d.upgradeCodes || []).find((c) => c.code === cleanCode);
      if (target) {
        target.redeemed_at = new Date().toISOString();
        target.redeemed_slug = slug;
        target.is_valid = false;
      }
    });

    return delay({
      ok: true,
      plan: codeObj.plan,
      planExpiresAt: exp,
      message: '¡Plan actualizado con éxito!'
    });
  }
};
