import { productFromRow, productToRow, stockFromRows } from '../../lib/catalog';
import { OPEN_STATUSES } from '../../lib/orderStatus';
import {
  tenantFromRow, tenantToRow, orderFromRow, invoiceFromRow, dailyCloseFromRow,
  customerFromRow, staffFromRow, tableFromRow, sequenceFromRow, sequenceToRow, waiterCallFromRow,
  printStationFromRow, printDeviceFromRow, printJobFromRow, ingredientFromRow, inventoryMovementFromRow,
  stockEventFromRow
} from '../mappers';
import { localFloorPlanStore } from '../floorPlanStore';
import { supabase } from '../../lib/supabaseClient';

let sessionStaff = null;
const STAFF_SESSION_KEY = 'kikes_pglite_staff_session';
const authListeners = new Set();

function loadStaffSession() {
  if (sessionStaff) return sessionStaff;
  try {
    const raw = sessionStorage.getItem(STAFF_SESSION_KEY);
    if (raw) sessionStaff = JSON.parse(raw);
  } catch {
    /* ignore */
  }
  return sessionStaff;
}

function saveStaffSession(s) {
  sessionStaff = s;
  try {
    if (s) sessionStorage.setItem(STAFF_SESSION_KEY, JSON.stringify(s));
    else sessionStorage.removeItem(STAFF_SESSION_KEY);
  } catch {
    /* ignore */
  }
  authListeners.forEach((cb) => {
    try {
      cb();
    } catch {
      /* ignore */
    }
  });
}

async function query(sql, params = []) {
  const res = await fetch('/api/pglite/query', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sql, params })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Error en consulta local PGlite');
  }
  const json = await res.json();
  return json.rows;
}

async function rpc(name, args = {}, auth = {}) {
  const staff = loadStaffSession();
  const authPayload = {
    userId: auth.userId || staff?.userId || 'a0000000-0000-0000-0000-000000000001',
    email: auth.email || 'dueño.local@kikesfood.com',
    ...auth
  };
  const res = await fetch('/api/pglite/rpc', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, args, auth: authPayload })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Error en RPC ${name}`);
  }
  const json = await res.json();
  return json.data;
}

export const pgliteApi = {
  mode: 'pglite',

  // ------------------------------------------------------------------ Carta (público)
  async getTenantBySlug(slug) {
    const rows = await query('select * from public.tenants where slug = $1 limit 1', [slug]);
    return rows[0] ? tenantFromRow(rows[0]) : null;
  },

  async getMenu(tenantId) {
    const [cats, prods, stock] = await Promise.all([
      query('select * from public.categories where tenant_id = $1 order by sort_order', [tenantId]),
      query('select * from public.products where tenant_id = $1 order by sort_order', [tenantId]),
      query('select * from public.ingredients_stock where tenant_id = $1 and is_sold_out = true', [tenantId])
    ]);
    const categories = cats.map((c) => ({
      id: c.id,
      name: c.name,
      sortOrder: c.sort_order,
      printStationId: c.print_station_id ?? null
    }));
    const names = Object.fromEntries(categories.map((c) => [c.id, c.name]));
    return {
      categories,
      products: prods.map((r) => productFromRow(r, names[r.category_id])),
      ingredientsStock: stockFromRows(stock)
    };
  },

  subscribeMenu(_tenantId, _onChange) {
    return () => {};
  },

  async resolveTable(slug, token) {
    const res = await rpc('resolve_table', { p_slug: slug, p_token: token });
    const row = Array.isArray(res) ? res[0] : res;
    return row ? { id: row.table_id, label: row.label } : null;
  },

  async createOrder({ slug, tableToken, items, includeTip }) {
    return rpc('create_order', {
      p_slug: slug,
      p_table_token: tableToken,
      p_items: items,
      p_include_tip: includeTip
    });
  },

  // ------------------------------------------------------------------ Llamado al mesero
  async callWaiter({ slug, tableToken }) {
    return rpc('call_waiter', { p_slug: slug, p_table_token: tableToken });
  },

  async listWaiterCalls(tenantId) {
    const since = new Date(Date.now() - 3 * 3600000).toISOString();
    const rows = await query(
      'select * from public.waiter_calls where tenant_id = $1 and attended_at is null and created_at >= $2 order by created_at asc',
      [tenantId, since]
    );
    return rows.map(waiterCallFromRow);
  },

  subscribeWaiterCalls(_tenantId, _handlers) {
    return () => {};
  },

  async attendWaiterCall(callId) {
    return rpc('attend_waiter_call', { p_call_id: callId });
  },

  // ------------------------------------------------------------------ Fila de impresión
  async listPrintStations(tenantId) {
    const rows = await query(
      'select * from public.print_stations where tenant_id = $1 order by name asc',
      [tenantId]
    );
    return rows.map(printStationFromRow);
  },

  async savePrintStation(arg1, arg2) {
    const s = arg2 || arg1;
    return rpc('admin_save_print_station', {
      p_id: s.id || null,
      p_name: s.name,
      p_is_default: Boolean(s.isDefault),
      p_prints_receipts: Boolean(s.printsReceipts)
    });
  },

  async deletePrintStation(arg1, arg2) {
    const id = arg2 || arg1;
    return rpc('admin_delete_print_station', { p_id: id });
  },

  async setCategoryStation(categoryId, stationId) {
    await query('update public.categories set print_station_id = $1 where id = $2', [stationId || null, categoryId]);
  },

  async listPrintDevices(tenantId) {
    const rows = await query(
      'select * from public.print_devices where tenant_id = $1 order by created_at asc',
      [tenantId]
    );
    return rows.map(printDeviceFromRow);
  },

  async createPrintDevice(arg1, arg2) {
    const data = arg2 || arg1;
    return rpc('admin_create_print_device', {
      p_name: data.name,
      p_station_ids: data.stationIds || []
    });
  },

  async newPairingCode(deviceId) {
    return rpc('admin_new_pairing_code', { p_device_id: deviceId }).catch(() => ({ code: '123456' }));
  },

  async updatePrintDevice({ id, name, stationIds }) {
    await rpc('admin_update_print_device', { p_device_id: id, p_name: name, p_station_ids: stationIds });
  },

  async revokePrintDevice(deviceId) {
    await rpc('admin_revoke_print_device', { p_device_id: deviceId });
  },

  async listPrintJobs(tenantId, limit = 50) {
    const rows = await query(
      'select * from public.print_jobs where tenant_id = $1 order by created_at desc limit $2',
      [tenantId, limit]
    );
    return rows.map(printJobFromRow);
  },

  subscribePrintJobs(_tenantId, _onChange) {
    return () => {};
  },

  async claimPrintJobs(stationIds = null) {
    const res = await rpc('claim_print_jobs', { p_station_ids: stationIds, p_limit: 10 });
    const list = Array.isArray(res) ? res : (res ? [res] : []);
    return list.map(printJobFromRow);
  },

  async reportPrintJob(jobId, ok, error = null) {
    await rpc('report_print_job', { p_job_id: jobId, p_ok: ok, p_error: error });
  },

  async reportPrintJobResult(jobId, { status, error }) {
    await this.reportPrintJob(jobId, status === 'printed', error);
  },

  async retryPrintJob(jobId) {
    await rpc('retry_print_job', { p_job_id: jobId });
  },

  async printInvoice(invoiceId) {
    return rpc('enqueue_invoice_print', { p_invoice_id: invoiceId });
  },

  async printTest(stationId) {
    return rpc('enqueue_test_print', { p_station_id: stationId });
  },

  async reprintOrder(orderId) {
    return rpc('request_order_reprint', { p_order_id: orderId });
  },

  async requestOrderReprint(orderId) {
    return rpc('request_order_reprint', { p_order_id: orderId });
  },

  // ------------------------------------------------------------------ Cocina (KDS)
  async listOpenOrders(tenantId) {
    const since = new Date(Date.now() - 24 * 3600000).toISOString();
    const rows = await query(
      `select * from public.orders 
       where tenant_id = $1 and status = any($2) and created_at >= $3 
       order by created_at asc`,
      [tenantId, OPEN_STATUSES, since]
    );
    return rows.map(orderFromRow);
  },

  async listActiveOrders(tenantId) {
    return this.listOpenOrders(tenantId);
  },

  subscribeOrders(_tenantId, _onChange) {
    return () => {};
  },

  async updateOrderStatus(orderId, status) {
    await query('update public.orders set status = $1 where id = $2', [status, orderId]);
  },

  async markOrderDelivered(orderId) {
    await rpc('deliver_order', { p_order_id: orderId });
  },

  // ------------------------------------------------------------------ Caja / POS
  async listTables(tenantId) {
    const rows = await query(
      'select * from public.restaurant_tables where tenant_id = $1 order by sort_order asc',
      [tenantId]
    );
    return rows.map(tableFromRow);
  },

  async createTables(tenantId, labels) {
    const existing = await query('select sort_order from public.restaurant_tables where tenant_id = $1', [tenantId]);
    const start = existing.reduce((m, r) => Math.max(m, r.sort_order), 0);
    const rows = [];
    for (let i = 0; i < labels.length; i++) {
      const inserted = await query(
        'insert into public.restaurant_tables (tenant_id, label, sort_order) values ($1, $2, $3) returning *',
        [tenantId, labels[i], start + i + 1]
      );
      if (inserted[0]) rows.push(tableFromRow(inserted[0]));
    }
    return rows;
  },

  async deleteTable(tableId) {
    const open = await query('select id from public.orders where table_id = $1 and status = any($2) limit 1', [tableId, OPEN_STATUSES]);
    if (open.length) throw new Error('No se puede eliminar la mesa: tiene pedidos abiertos');
    const rows = await query('delete from public.restaurant_tables where id = $1 returning tenant_id', [tableId]);
    if (rows[0]?.tenant_id) {
      await localFloorPlanStore.saveTableLayout(rows[0].tenant_id, { [tableId]: null });
    }
  },

  async setTableActive(tableId, isActive) {
    await query('update public.restaurant_tables set is_active = $1 where id = $2', [isActive, tableId]);
  },

  async regenerateTableToken(tableId) {
    return rpc('regenerate_table_token', { p_table_id: tableId });
  },

  getFloorPlan: (tenantId) => localFloorPlanStore.getFloorPlan(tenantId),
  saveEnvironments: (tenantId, environments) => localFloorPlanStore.saveEnvironments(tenantId, environments),
  saveTableLayout: (tenantId, updates) => localFloorPlanStore.saveTableLayout(tenantId, updates),
  subscribeFloorPlan: (tenantId, onChange) => localFloorPlanStore.subscribeFloorPlan(tenantId, onChange),

  async listCustomers(tenantId) {
    const rows = await query('select * from public.customers where tenant_id = $1 order by name asc', [tenantId]);
    return rows.map(customerFromRow);
  },

  async createCustomer(tenantId, c) {
    const rows = await query(
      `insert into public.customers (tenant_id, name, doc_type, doc_number, email, phone)
       values ($1, $2, $3, $4, $5, $6) returning *`,
      [tenantId, c.name.trim(), c.docType, c.docNumber.trim(), c.email || null, c.phone || null]
    );
    return customerFromRow(rows[0]);
  },

  async issueInvoice({ orderIds, kind, customerId, paymentMethod, tip = null }) {
    const row = await rpc('issue_invoice', {
      p_order_ids: orderIds,
      p_kind: kind,
      p_customer_id: customerId || null,
      p_payment_method: paymentMethod,
      p_tip: tip
    });
    return invoiceFromRow(row);
  },

  async listOpenInvoices(tenantId) {
    const rows = await query(
      'select * from public.invoices where tenant_id = $1 and daily_close_id is null order by created_at desc',
      [tenantId]
    );
    return rows.map(invoiceFromRow);
  },

  async closeRegister({ countedCash }) {
    const res = await rpc('close_cash_register', { p_counted_cash: countedCash });
    return dailyCloseFromRow(res);
  },

  async listDailyCloses(tenantId, limit = 30) {
    const rows = await query(
      'select * from public.daily_closes where tenant_id = $1 order by closed_at desc limit $2',
      [tenantId, limit]
    );
    return rows.map(dailyCloseFromRow);
  },

  subscribeBilling(_onChange) {
    return () => {};
  },

  async getBillingSettings(tenantId) {
    const [settings, seqs] = await Promise.all([
      query('select * from public.billing_settings where tenant_id = $1 limit 1', [tenantId]).catch(() => []),
      query('select * from public.invoice_sequences where tenant_id = $1', [tenantId]).catch(() => [])
    ]);
    const s = settings[0];
    return {
      provider: s?.provider || 'simulado',
      environment: s?.environment || 'habilitacion',
      sequences: seqs.map(sequenceFromRow)
    };
  },

  async saveBillingSettings(tenantId, { provider, environment, sequences }) {
    await query('update public.billing_settings set provider = $1, environment = $2 where tenant_id = $3', [provider, environment, tenantId]);
    for (const seq of sequences || []) {
      const row = sequenceToRow(seq, tenantId);
      await query(
        `insert into public.invoice_sequences (tenant_id, kind, prefix, next_number, range_from, range_to, vigencia_desde, vigencia_hasta, resolution_number, technical_key)
         values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         on conflict (tenant_id, kind) do update set
           prefix = excluded.prefix,
           next_number = excluded.next_number,
           range_from = excluded.range_from,
           range_to = excluded.range_to,
           vigencia_desde = excluded.vigencia_desde,
           vigencia_hasta = excluded.vigencia_hasta,
           resolution_number = excluded.resolution_number,
           technical_key = excluded.technical_key`,
        [
          row.tenant_id, row.kind, row.prefix, row.next_number, row.range_from, row.range_to,
          row.vigencia_desde, row.vigencia_hasta, row.resolution_number, row.technical_key
        ]
      );
    }
  },

  // ------------------------------------------------------------------ Inventario
  async listIngredients(tenantId) {
    const rows = await query(
      'select * from public.ingredients_stock where tenant_id = $1 order by ingredient_name asc',
      [tenantId]
    );
    return rows.map(ingredientFromRow);
  },

  async saveIngredient(tenantId, item) {
    return rpc('admin_save_ingredient', {
      p_name: item.name,
      p_category: item.category || 'otros',
      p_unit: item.unit || 'unidad',
      p_current_stock: Number(item.currentStock || 0),
      p_min_stock: Number(item.minStock || 0),
      p_unit_cost: Number(item.unitCost || 0),
      p_auto_deplete: Boolean(item.autoDeplete),
      p_supplier: item.supplier || null,
      p_is_sold_out: item.isSoldOut !== undefined ? item.isSoldOut : null
    });
  },

  async deleteIngredient(tenantId, key) {
    return rpc('admin_delete_ingredient', {
      p_key: key
    });
  },

  async registerStockMovement(tenantId, movement) {
    return rpc('admin_register_stock_movement', {
      p_name: movement.name || movement.ingredientKey,
      p_type: movement.type || movement.movementType,
      p_quantity: Number(movement.quantity),
      p_cost: movement.cost || movement.unitCost ? Number(movement.cost || movement.unitCost) : 0,
      p_supplier: movement.supplier || null,
      p_invoice_ref: movement.invoiceRef || null,
      p_note: movement.note || movement.reason || null
    });
  },

  async listInventoryMovements(tenantId, ingredientKey = null) {
    const conditions = ['tenant_id = $1'];
    const params = [tenantId];
    if (ingredientKey) {
      params.push(ingredientKey);
      conditions.push(`ingredient_key = $${params.length}`);
    }
    const sql = `select * from public.inventory_movements where ${conditions.join(' and ')} order by created_at desc limit 100`;
    const rows = await query(sql, params);
    return rows.map(inventoryMovementFromRow);
  },

  async listStockEvents(tenantId) {
    const rows = await query('select * from public.stock_events where tenant_id = $1 order by created_at desc limit 100', [tenantId]).catch(() => []);
    return rows.map(stockEventFromRow);
  },

  // ------------------------------------------------------------------ Catálogo / Admin
  async saveCategory(tenantId, category) {
    if (category.id) {
      const rows = await query(
        'update public.categories set name = $1, sort_order = $2, print_station_id = $3 where id = $4 and tenant_id = $5 returning *',
        [category.name, category.sortOrder, category.printStationId || null, category.id, tenantId]
      );
      return rows[0];
    }
    const rows = await query(
      'insert into public.categories (tenant_id, name, sort_order, print_station_id) values ($1, $2, $3, $4) returning *',
      [tenantId, category.name, category.sortOrder || 1, category.printStationId || null]
    );
    return rows[0];
  },

  async deleteCategory(tenantId, categoryId) {
    await query('delete from public.categories where id = $1 and tenant_id = $2', [categoryId, tenantId]);
  },

  async saveProduct(tenantId, product) {
    const row = productToRow(product, tenantId);
    if (product.id) {
      const rows = await query(
        `update public.products set 
         category_id = $1, name = $2, description = $3, price = $4, image = $5,
         is_chef = $6, is_veg = $7, is_gf = $8, is_popular = $9, available = $10,
         ingredients = $11, modifiers = $12, sort_order = $13
         where id = $14 and tenant_id = $15 returning *`,
        [
          row.category_id, row.name, row.description, row.price, row.image,
          row.is_chef, row.is_veg, row.is_gf, row.is_popular, row.available,
          row.ingredients || [], JSON.stringify(row.modifiers || []), row.sort_order || 1,
          product.id, tenantId
        ]
      );
      return productFromRow(rows[0], product.category);
    }
    const rows = await query(
      `insert into public.products (
        tenant_id, category_id, name, description, price, image,
        is_chef, is_veg, is_gf, is_popular, available, ingredients, modifiers, sort_order
      ) values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) returning *`,
      [
        tenantId, row.category_id, row.name, row.description, row.price, row.image,
        row.is_chef, row.is_veg, row.is_gf, row.is_popular, row.available,
        row.ingredients || [], JSON.stringify(row.modifiers || []), row.sort_order || 1
      ]
    );
    return productFromRow(rows[0], product.category);
  },

  async setProductAvailable(productId, available) {
    await query('update public.products set available = $1 where id = $2', [available, productId]);
  },

  async deleteProduct(arg1, arg2) {
    const id = arg2 || arg1;
    await query('delete from public.products where id = $1', [id]);
  },

  // ------------------------------------------------------------------ Personal / Staff
  async listStaffForLogin(slug) {
    const res = await rpc('list_staff_for_login', { p_slug: slug });
    const list = Array.isArray(res) ? res : (res ? [res] : []);
    return list.map((s) => ({
      id: s.id,
      displayName: s.display_name,
      role: s.role
    }));
  },

  async loginStaff({ slug, staffId, pin }) {
    const res = await rpc('verify_staff_pin', {
      p_slug: slug,
      p_staff_id: staffId,
      p_pin: pin
    }, { role: 'service_role' });

    if (!res?.ok) {
      throw new Error(res?.error || 'PIN incorrecto');
    }

    // Asegurar que existe registro en auth.users para este empleado
    await query(
      'insert into auth.users (id, email) values ($1, $2) on conflict (id) do nothing',
      [staffId, `${res.role || 'staff'}.${staffId}@local.kikes`]
    ).catch(() => {});

    // Vincular user_id en staff_members para que require_staff() lo reconozca
    await query(
      'update public.staff_members set user_id = $1 where id = $2',
      [staffId, staffId]
    ).catch(() => {});

    const session = {
      id: res.staffId,
      staffId: res.staffId,
      userId: staffId,
      displayName: res.displayName,
      role: res.role,
      tenantId: res.tenantId,
      slug: slug || res.slug
    };
    saveStaffSession(session);
    return session;
  },

  async getCurrentStaff() {
    return loadStaffSession();
  },

  async logoutStaff() {
    const s = loadStaffSession();
    if (s?.staffId) {
      await query('update public.staff_members set user_id = null where id = $1', [s.staffId]).catch(() => {});
    }
    saveStaffSession(null);
  },

  onAuthChange(callback) {
    authListeners.add(callback);
    return () => authListeners.delete(callback);
  },

  agentConnection() {
    return { url: 'http://localhost:3000', anonKey: 'local-pglite-key' };
  },

  async listStaff(tenantId) {
    const rows = await query(
      'select id, tenant_id, display_name, role, is_active, created_at from public.staff_members where tenant_id = $1 order by display_name asc',
      [tenantId]
    );
    return rows.map(staffFromRow);
  },

  async createStaff(form) {
    return rpc('admin_create_staff', {
      p_display_name: form.displayName,
      p_role: form.role,
      p_pin: form.pin
    });
  },

  async updateStaff({ staffId, pin = null, isActive = null, role = null }) {
    return rpc('admin_update_staff', {
      p_staff_id: staffId,
      p_pin: pin,
      p_is_active: isActive,
      p_role: role
    });
  },

  async setIngredientStock({ name, soldOut, note }) {
    return rpc('set_ingredient_stock', {
      p_name: name,
      p_sold_out: Boolean(soldOut),
      p_note: note || null
    }).catch(() => null);
  },

  async setDemoPlan(plan) {
    const staff = loadStaffSession();
    if (staff?.tenantId) {
      await query('update public.tenants set plan = $1 where id = $2', [plan, staff.tenantId]);
    }
  },

  async updateTenant(tenantId, updates) {
    const row = tenantToRow(updates);
    const keys = Object.keys(row).filter((k) => k !== 'id');
    const setClauses = keys.map((k, i) => `${k} = $${i + 1}`).join(', ');
    const params = keys.map((k) => row[k]);
    params.push(tenantId);
    const sql = `update public.tenants set ${setClauses} where id = $${params.length} returning *`;
    const rows = await query(sql, params);
    return rows[0] ? tenantFromRow(rows[0]) : null;
  },

  async resetDemo() {},

  // ------------------------------------------------------------------ Onboarding / Google Auth (PGlite Local)
  async signInWithGoogle() {
    const mockUser = {
      id: 'a0000000-0000-0000-0000-000000000001',
      email: 'dueño.local@kikesfood.com',
      user_metadata: {
        full_name: 'Dueño Local',
        name: 'Dueño Local'
      }
    };
    await fetch('/api/pglite/auth/user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user: mockUser })
    });
    window.location.reload();
  },

  async getAuthUser() {
    const res = await fetch('/api/pglite/auth/user');
    const data = await res.json().catch(() => ({}));
    return data.user || null;
  },

  async signOutAuth() {
    await fetch('/api/pglite/auth/user', { method: 'DELETE' });
  },

  async sendOnboardingOtp(email) {
    return { ok: true, email };
  },

  async verifyOnboardingOtp({ email, code }) {
    return { ok: true, email, code };
  },

  async checkSlugAvailable(slug) {
    return rpc('check_slug_available', { p_slug: slug });
  },

  async registerTenant(data) {
    const authUser = await this.getAuthUser();
    const res = await rpc('register_tenant', {
      p_email: data.email || authUser?.email || 'dueño.local@kikesfood.com',
      p_code: data.code || 'GOOGLE_OAUTH',
      p_name: data.name,
      p_slug: data.slug,
      p_phone: data.phone || null,
      p_city: data.city || null,
      p_owner_name: data.ownerName || 'Dueño',
      p_pin: data.pin
    }, {
      userId: authUser?.id || 'a0000000-0000-0000-0000-000000000001',
      email: data.email || authUser?.email || 'dueño.local@kikesfood.com'
    });

    if (res?.staffId) {
      await this.loginStaff({ slug: data.slug, staffId: res.staffId, pin: data.pin });
    }

    return res;
  },

  // ------------------------------------------------------------------ Plataforma / Super Admin
  async checkIsPlatformAdmin(email = null) {
    const user = await this.getAuthUser();
    const targetEmail = email || user?.email;
    if (!targetEmail) return false;
    const res = await rpc('is_platform_admin', { p_email: targetEmail });
    return Boolean(res);
  },

  async superadminListTenants() {
    const res = await rpc('superadmin_list_tenants');
    return Array.isArray(res) ? res : (res ? [res] : []);
  },

  async superadminToggleTenant(tenantId, isActive) {
    return rpc('superadmin_toggle_tenant', { p_tenant_id: tenantId, p_is_active: isActive });
  },

  async superadminChangeTenantPlan(tenantId, plan, durationDays = null) {
    return rpc('superadmin_change_tenant_plan', {
      p_tenant_id: tenantId,
      p_plan: plan,
      p_duration_days: durationDays ? Number(durationDays) : null
    });
  },

  async superadminCreateUpgradeCode({ plan, durationDays = null, targetSlug = null }) {
    const user = await this.getAuthUser();
    return rpc('superadmin_create_upgrade_code', {
      p_plan: plan,
      p_duration_days: durationDays ? Number(durationDays) : null,
      p_target_slug: targetSlug || null,
      p_created_by: user?.email || 'admin'
    });
  },

  async superadminListUpgradeCodes() {
    const res = await rpc('superadmin_list_upgrade_codes');
    return Array.isArray(res) ? res : (res ? [res] : []);
  },

  async redeemPlanCode({ slug, code }) {
    return rpc('redeem_plan_code', {
      p_slug: slug,
      p_code: code
    });
  },

  // ------------------------------------------------------------------ Almacenamiento
  async uploadProductImage({ file, tenantSlug, fileName = null }) {
    if (supabase) {
      try {
        const slug = tenantSlug || 'general';
        const cleanName = (fileName || file.name || `dish-${Date.now()}`)
          .toLowerCase()
          .replace(/[^a-z0-9.-]/g, '-');
        const path = `${slug}/${Date.now()}-${cleanName}`;

        const { data, error } = await supabase.storage
          .from('products')
          .upload(path, file, {
            cacheControl: '31536000',
            upsert: true,
            contentType: file.type || 'image/webp'
          });

        if (!error && data?.path) {
          const { data: publicData } = supabase.storage
            .from('products')
            .getPublicUrl(data.path);
          return { path: data.path, publicUrl: publicData.publicUrl };
        }
      } catch (err) {
        console.warn('Fallback a almacenamiento local de imagen:', err);
      }
    }

    // Fallback local en desarrollo/offline: Data URL
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve({ path: 'local', publicUrl: reader.result });
      reader.onerror = () => reject(new Error('Error al procesar imagen localmente'));
      reader.readAsDataURL(file);
    });
  }
};
