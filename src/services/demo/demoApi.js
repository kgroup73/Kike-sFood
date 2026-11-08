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

const DB_KEY = 'kikes_demo_db_v2';
const SESSION_KEY = 'kikes_demo_session';
export const demoTableToken = (label) => `demo-mesa-${label}`;

// ------------------------------------------------------------------ almacenamiento
function seed() {
  const categories = DEMO_CATEGORIES.map((name, i) => ({ id: demoUuid('c', i + 1), name, sortOrder: i }));
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
    tables,
    staff: DEMO_STAFF.map((s) => ({ ...s, isActive: true, failedAttempts: 0, lockedUntil: null, createdAt: new Date().toISOString() })),
    orders,
    nextOrderId: orders.length + 1,
    customers: DEMO_CUSTOMERS.map((c) => ({ ...c })),
    sequences: DEMO_INVOICE_SEQUENCES.map((s) => ({ ...s })),
    billingSettings: { provider: 'simulado', environment: 'habilitacion' },
    invoices: [],
    dailyCloses: []
  };
}

let cache = null;
function load() {
  if (cache) return cache;
  try {
    const raw = localStorage.getItem(DB_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    cache = parsed?.version === 2 ? parsed : seed();
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
    return delay(db.tenant.slug === slug ? db.tenant : null);
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
        items: lines
      };
      d.orders.push(o);
      return o;
    });
    emit('orders', { type: 'insert', order });
    return delay({ orderId: order.id, tableLabel: order.tableLabel, subtotal, tip, total: subtotal + tip });
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
    if (!canTransition(o.status, status)) return fail(`Transición de estado no permitida: ${o.status} → ${status}`);
    const order = commit((d) => {
      const x = d.orders.find((y) => y.id === orderId);
      x.status = status;
      return x;
    });
    emit('orders', { type: 'update', order });
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

  async issueInvoice({ orderIds, kind, customerId, paymentMethod }) {
    const s = requireStaff(['owner', 'admin', 'caja']);
    const db = load();
    if (!hasFeature(db.tenant.plan, 'pos')) return fail('La Caja POS requiere el plan Intermedio o superior');
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
    const { subtotal, tip } = sumOrders(orders);
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
    commit((d) => Object.assign(d.tenant, editable), ['menu']);
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
    commit((d) => {
      labels.forEach((label, i) => {
        d.tables.push({ id: `table-${Date.now()}-${i}`, label, token: demoTableToken(label), isActive: true, sortOrder: d.tables.length + 1 });
      });
    });
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
  }
};
