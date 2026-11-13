import { supabase, publicConnection } from '../lib/supabaseClient';
import { productFromRow, productToRow, stockFromRows } from '../lib/catalog';
import { OPEN_STATUSES } from '../lib/orderStatus';
import { unwrap, toAppError } from './errors';
import { localFloorPlanStore } from './floorPlanStore';
import {
  tenantFromRow, tenantToRow, orderFromRow, invoiceFromRow, dailyCloseFromRow, stockEventFromRow,
  customerFromRow, staffFromRow, tableFromRow, sequenceFromRow, sequenceToRow, waiterCallFromRow,
  printStationFromRow, printDeviceFromRow, printJobFromRow, ingredientFromRow, inventoryMovementFromRow
} from './mappers';

let channelSeq = 0;
function subscribe(name, tables, tenantId, handler) {
  const filter = `tenant_id=eq.${tenantId}`;
  let channel = supabase.channel(`${name}:${tenantId}:${++channelSeq}`);
  for (const table of tables) {
    channel = channel.on('postgres_changes', { event: '*', schema: 'public', table, filter }, handler);
  }
  channel.subscribe();
  return () => {
    supabase.removeChannel(channel);
  };
}

export const supabaseApi = {
  mode: 'supabase',

  // ------------------------------------------------------------------ Carta (público)
  async getTenantBySlug(slug) {
    const row = unwrap(await supabase.from('tenants').select('*').eq('slug', slug).maybeSingle());
    return row ? tenantFromRow(row) : null;
  },

  async getMenu(tenantId) {
    const [cats, prods, stock] = await Promise.all([
      supabase.from('categories').select('*').eq('tenant_id', tenantId).order('sort_order'),
      supabase.from('products').select('*').eq('tenant_id', tenantId).order('sort_order'),
      supabase.from('ingredients_stock').select('*').eq('tenant_id', tenantId).eq('is_sold_out', true)
    ]);
    const categories = unwrap(cats).map((c) => ({ id: c.id, name: c.name, sortOrder: c.sort_order, printStationId: c.print_station_id ?? null }));
    const names = Object.fromEntries(categories.map((c) => [c.id, c.name]));
    return {
      categories,
      products: unwrap(prods).map((r) => productFromRow(r, names[r.category_id])),
      ingredientsStock: stockFromRows(unwrap(stock))
    };
  },

  subscribeMenu(tenantId, onChange) {
    return subscribe('menu', ['products', 'categories', 'ingredients_stock'], tenantId, onChange);
  },

  async resolveTable(slug, token) {
    const rows = unwrap(await supabase.rpc('resolve_table', { p_slug: slug, p_token: token }));
    const row = rows?.[0];
    return row ? { id: row.table_id, label: row.label } : null;
  },

  async createOrder({ slug, tableToken, items, includeTip }) {
    return unwrap(
      await supabase.rpc('create_order', {
        p_slug: slug,
        p_table_token: tableToken,
        p_items: items,
        p_include_tip: includeTip
      })
    );
  },

  // ------------------------------------------------------------------ Llamado al mesero
  async callWaiter({ slug, tableToken }) {
    return unwrap(await supabase.rpc('call_waiter', { p_slug: slug, p_table_token: tableToken }));
  },

  async listWaiterCalls(tenantId) {
    const since = new Date(Date.now() - 3 * 3600000).toISOString();
    const rows = unwrap(
      await supabase
        .from('waiter_calls')
        .select('*')
        .eq('tenant_id', tenantId)
        .is('attended_at', null)
        .gte('created_at', since)
        .order('created_at', { ascending: true })
    );
    return rows.map(waiterCallFromRow);
  },

  subscribeWaiterCalls(tenantId, { onInsert, onChange }) {
    return subscribe('waiter', ['waiter_calls'], tenantId, (payload) => {
      if (payload.eventType === 'INSERT') onInsert?.(waiterCallFromRow(payload.new));
      else onChange?.();
    });
  },

  async attendWaiterCall(callId) {
    unwrap(await supabase.rpc('attend_waiter_call', { p_call_id: callId }));
  },

  // ------------------------------------------------------------------ Fila de impresión
  // La app anota qué imprimir (print_jobs) y un imprimidor lo saca: el agente local o,
  // de respaldo, el navegador de un equipo del personal. Ver impresora/README.md.
  async listPrintStations(tenantId) {
    try {
      const res = await supabase.from('print_stations').select('*').eq('tenant_id', tenantId).order('sort_order');
      if (res.error) {
        if (/schema cache|does not exist/i.test(res.error.message || '')) {
          return [];
        }
        throw toAppError(res.error);
      }
      return (res.data || []).map(printStationFromRow);
    } catch (err) {
      if (/schema cache|does not exist/i.test(err.message || '')) {
        return [];
      }
      throw err;
    }
  },

  async savePrintStation({ id = null, name, isDefault = false, printsReceipts = false }) {
    return unwrap(
      await supabase.rpc('admin_save_print_station', { p_id: id, p_name: name, p_is_default: isDefault, p_prints_receipts: printsReceipts })
    );
  },

  async deletePrintStation(id) {
    unwrap(await supabase.rpc('admin_delete_print_station', { p_id: id }));
  },

  async setCategoryStation(categoryId, stationId) {
    const rows = unwrap(await supabase.from('categories').update({ print_station_id: stationId || null }).eq('id', categoryId).select('id'));
    if (!rows.length) throw new Error('No tienes permiso para cambiar esta categoría');
  },

  async listPrintDevices(tenantId) {
    try {
      const res = await supabase
        .from('print_devices')
        .select('id, name, station_ids, pairing_expires_at, paired_at, last_seen_at, agent_version, revoked_at, created_at')
        .eq('tenant_id', tenantId)
        .order('created_at');
      if (res.error) {
        if (/schema cache|does not exist/i.test(res.error.message || '')) {
          return [];
        }
        throw toAppError(res.error);
      }
      return (res.data || []).map(printDeviceFromRow);
    } catch (err) {
      if (/schema cache|does not exist/i.test(err.message || '')) {
        return [];
      }
      throw err;
    }
  },

  async createPrintDevice({ name, stationIds }) {
    return unwrap(await supabase.rpc('admin_create_print_device', { p_name: name, p_station_ids: stationIds }));
  },

  async newPairingCode(deviceId) {
    return unwrap(await supabase.rpc('admin_new_pairing_code', { p_device_id: deviceId }));
  },

  async updatePrintDevice({ id, name, stationIds }) {
    unwrap(await supabase.rpc('admin_update_print_device', { p_device_id: id, p_name: name, p_station_ids: stationIds }));
  },

  async revokePrintDevice(id) {
    unwrap(await supabase.rpc('admin_revoke_print_device', { p_device_id: id }));
  },

  /** Lo que el agente necesita para vincularse: dirección y llave pública de Supabase. */
  agentConnection() {
    return publicConnection;
  },

  async claimPrintJobs(stationIds = null) {
    const rows = unwrap(await supabase.rpc('claim_print_jobs', { p_station_ids: stationIds, p_limit: 10 }));
    return rows.map(printJobFromRow);
  },

  async reportPrintJob(jobId, ok, error = null) {
    unwrap(await supabase.rpc('report_print_job', { p_job_id: jobId, p_ok: ok, p_error: error }));
  },

  async printInvoice(invoiceId) {
    return unwrap(await supabase.rpc('enqueue_invoice_print', { p_invoice_id: invoiceId }));
  },

  async printTest(stationId) {
    return unwrap(await supabase.rpc('enqueue_test_print', { p_station_id: stationId }));
  },

  subscribePrintJobs(tenantId, onChange) {
    return subscribe('print', ['print_jobs'], tenantId, onChange);
  },

  // ------------------------------------------------------------------ Sesión del personal
  async listStaffForLogin(slug) {
    const rows = unwrap(await supabase.rpc('list_staff_for_login', { p_slug: slug }));
    return (rows || []).map((s) => ({ id: s.id, displayName: s.display_name, role: s.role }));
  },

  async loginStaff({ slug, staffId, pin }) {
    const { data, error } = await supabase.functions.invoke('staff-login', { body: { slug, staffId, pin } });
    if (error) {
      let message = 'No se pudo iniciar sesión';
      try {
        const body = await error.context?.json();
        if (body?.error) message = body.error;
      } catch {
        // respuesta sin JSON
      }
      throw new Error(message);
    }
    unwrap(
      await supabase.auth.setSession({
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token
      })
    );
    return data.staff;
  },

  async logoutStaff() {
    await supabase.auth.signOut();
  },

  async getCurrentStaff() {
    const { data } = await supabase.auth.getSession();
    if (!data.session) return null;
    const { data: me, error } = await supabase.rpc('whoami');
    if (error) return null;
    return me;
  },

  onAuthChange(callback) {
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') setTimeout(callback, 0);
    });
    return () => data.subscription.unsubscribe();
  },

  // ------------------------------------------------------------------ Cocina
  async listOpenOrders(tenantId) {
    const rows = unwrap(
      await supabase
        .from('orders')
        .select('*, order_items(*)')
        .eq('tenant_id', tenantId)
        .in('status', OPEN_STATUSES)
        .order('created_at', { ascending: true })
        .limit(200)
    );
    return rows.map(orderFromRow);
  },

  subscribeOrders(tenantId, { onInsert, onChange }) {
    return subscribe('orders', ['orders'], tenantId, (payload) => {
      if (payload.eventType === 'INSERT') onInsert?.(payload.new);
      else onChange?.(payload.new);
    });
  },

  async updateOrderStatus(orderId, status) {
    const rows = unwrap(await supabase.from('orders').update({ status }).eq('id', orderId).select('id'));
    if (!rows.length) throw new Error('No tienes permiso para actualizar este pedido');
  },

  async requestOrderReprint(orderId) {
    unwrap(await supabase.rpc('request_order_reprint', { p_order_id: orderId }));
  },

  async setIngredientStock({ name, soldOut, note }) {
    return unwrap(
      await supabase.rpc('set_ingredient_stock', { p_name: name, p_sold_out: soldOut, p_note: note || null })
    );
  },

  async listIngredients(tenantId) {
    try {
      const res = await supabase.from('ingredients_stock').select('*').eq('tenant_id', tenantId).order('name');
      if (res.error) {
        if (/schema cache|does not exist/i.test(res.error.message || '')) return [];
        throw toAppError(res.error);
      }
      return (res.data || []).map(ingredientFromRow);
    } catch (err) {
      if (/schema cache|does not exist/i.test(err.message || '')) return [];
      throw err;
    }
  },

  async saveIngredient(tenantId, item) {
    try {
      const res = await supabase.rpc('admin_save_ingredient', {
        p_name: item.name,
        p_category: item.category || 'otros',
        p_unit: item.unit || 'unidad',
        p_current_stock: Number(item.currentStock || 0),
        p_min_stock: Number(item.minStock || 0),
        p_unit_cost: Number(item.unitCost || 0),
        p_auto_deplete: Boolean(item.autoDeplete),
        p_supplier: item.supplier || null,
        p_is_sold_out: item.isSoldOut ?? null
      });
      if (!res.error) return unwrap(res);
    } catch {
      // Fallback si la función RPC aún no se ha migrado en Supabase
    }
    return unwrap(
      await supabase.rpc('set_ingredient_stock', {
        p_name: item.name,
        p_sold_out: Boolean(item.isSoldOut),
        p_note: item.note || null
      })
    );
  },

  async deleteIngredient(tenantId, key) {
    try {
      const res = await supabase.rpc('admin_delete_ingredient', { p_key: key });
      if (!res.error) return unwrap(res);
    } catch {
      // Fallback
    }
    unwrap(await supabase.from('ingredients_stock').delete().eq('tenant_id', tenantId).eq('ingredient_key', key));
    return { ok: true };
  },

  async registerStockMovement(tenantId, mov) {
    try {
      const res = await supabase.rpc('admin_register_stock_movement', {
        p_name: mov.name,
        p_type: mov.type,
        p_quantity: Number(mov.quantity),
        p_cost: Number(mov.cost || 0),
        p_supplier: mov.supplier || null,
        p_invoice_ref: mov.invoiceRef || null,
        p_note: mov.note || null
      });
      if (!res.error) return unwrap(res);
    } catch {
      // Fallback
    }
    return { ok: true };
  },

  async listInventoryMovements(tenantId, ingredientKey = null) {
    try {
      let query = supabase.from('inventory_movements').select('*').eq('tenant_id', tenantId).order('created_at', { ascending: false }).limit(100);
      if (ingredientKey) query = query.eq('ingredient_key', ingredientKey);
      const res = await query;
      if (res.error) return [];
      return (res.data || []).map(inventoryMovementFromRow);
    } catch {
      return [];
    }
  },

  async listStockEvents(tenantId) {
    const rows = unwrap(
      await supabase
        .from('stock_events')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })
        .limit(300)
    );
    return rows.map(stockEventFromRow);
  },

  // ------------------------------------------------------------------ Caja
  async listCustomers(tenantId) {
    const rows = unwrap(await supabase.from('customers').select('*').eq('tenant_id', tenantId).order('name'));
    return rows.map(customerFromRow);
  },

  async createCustomer(tenantId, c) {
    const row = unwrap(
      await supabase
        .from('customers')
        .insert({
          tenant_id: tenantId,
          name: c.name.trim(),
          doc_type: c.docType,
          doc_number: c.docNumber.trim(),
          email: c.email || null,
          phone: c.phone || null
        })
        .select()
        .single()
    );
    return customerFromRow(row);
  },

  async issueInvoice({ orderIds, kind, customerId, paymentMethod, tip = null }) {
    const row = unwrap(
      await supabase.rpc('issue_invoice', {
        p_order_ids: orderIds,
        p_kind: kind,
        p_customer_id: customerId || null,
        p_payment_method: paymentMethod,
        p_tip: tip
      })
    );
    return invoiceFromRow(row);
  },

  async listOpenInvoices(tenantId) {
    const rows = unwrap(
      await supabase
        .from('invoices')
        .select('*')
        .eq('tenant_id', tenantId)
        .is('daily_close_id', null)
        .order('created_at', { ascending: false })
    );
    return rows.map(invoiceFromRow);
  },

  async closeRegister({ countedCash }) {
    return dailyCloseFromRow(unwrap(await supabase.rpc('close_cash_register', { p_counted_cash: countedCash })));
  },

  // Los comprobantes no se publican por realtime: la caja recarga tras cada acción.
  subscribeBilling() {
    return () => {};
  },

  async listDailyCloses(tenantId) {
    const rows = unwrap(
      await supabase
        .from('daily_closes')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })
        .limit(30)
    );
    return rows.map(dailyCloseFromRow);
  },

  // ------------------------------------------------------------------ Administración
  async updateTenant(tenantId, tenant) {
    unwrap(await supabase.from('tenants').update(tenantToRow(tenant)).eq('id', tenantId));
  },

  async saveProduct(tenantId, product) {
    const row = productToRow(product, tenantId);
    const query = product.id
      ? supabase.from('products').update(row).eq('id', product.id)
      : supabase.from('products').insert(row);
    const saved = unwrap(await query.select().single());
    return productFromRow(saved, product.category);
  },

  async setProductAvailable(productId, available) {
    unwrap(await supabase.from('products').update({ available }).eq('id', productId));
  },

  async deleteProduct(productId) {
    unwrap(await supabase.from('products').delete().eq('id', productId));
  },

  async listTables(tenantId) {
    const rows = unwrap(
      await supabase.from('restaurant_tables').select('*').eq('tenant_id', tenantId).order('sort_order')
    );
    return rows.map(tableFromRow);
  },

  async createTables(tenantId, labels) {
    const existing = unwrap(await supabase.from('restaurant_tables').select('sort_order').eq('tenant_id', tenantId));
    const start = existing.reduce((m, r) => Math.max(m, r.sort_order), 0);
    const rows = unwrap(
      await supabase
        .from('restaurant_tables')
        .insert(labels.map((label, i) => ({ tenant_id: tenantId, label, sort_order: start + i + 1 })))
        .select('*')
    );
    return rows.map(tableFromRow);
  },

  async deleteTable(tableId) {
    // Los pedidos guardan table_id con ON DELETE SET NULL: se bloquea aquí para no dejar
    // comandas abiertas sin mesa. TODO(supabase): mover esta regla a un trigger (ver docs/plano-sala-supabase.md).
    const open = unwrap(
      await supabase.from('orders').select('id').eq('table_id', tableId).in('status', OPEN_STATUSES).limit(1)
    );
    if (open.length) throw new Error('No se puede eliminar la mesa: tiene pedidos abiertos');
    const rows = unwrap(await supabase.from('restaurant_tables').delete().eq('id', tableId).select('tenant_id'));
    if (!rows.length) throw new Error('Mesa no encontrada o sin permiso para eliminarla');
    await localFloorPlanStore.saveTableLayout(rows[0].tenant_id, { [tableId]: null });
  },

  // Plano de sala. TODO(supabase): hoy vive en el navegador (localFloorPlanStore); al crear las
  // tablas de docs/plano-sala-supabase.md se reemplazan estas 4 funciones y las vistas no cambian.
  getFloorPlan: (tenantId) => localFloorPlanStore.getFloorPlan(tenantId),
  saveEnvironments: (tenantId, environments) => localFloorPlanStore.saveEnvironments(tenantId, environments),
  saveTableLayout: (tenantId, updates) => localFloorPlanStore.saveTableLayout(tenantId, updates),
  subscribeFloorPlan: (tenantId, onChange) => localFloorPlanStore.subscribeFloorPlan(tenantId, onChange),

  async setTableActive(tableId, isActive) {
    unwrap(await supabase.from('restaurant_tables').update({ is_active: isActive }).eq('id', tableId));
  },

  async regenerateTableToken(tableId) {
    return unwrap(await supabase.rpc('regenerate_table_token', { p_table_id: tableId }));
  },

  async listStaff(tenantId) {
    const rows = unwrap(
      await supabase
        .from('staff_members')
        .select('id, display_name, role, is_active, locked_until, created_at')
        .eq('tenant_id', tenantId)
        .order('created_at')
    );
    return rows.map(staffFromRow);
  },

  async createStaff({ displayName, role, pin }) {
    return unwrap(await supabase.rpc('admin_create_staff', { p_display_name: displayName, p_role: role, p_pin: pin }));
  },

  async updateStaff({ staffId, pin = null, isActive = null, role = null }) {
    unwrap(
      await supabase.rpc('admin_update_staff', {
        p_staff_id: staffId,
        p_pin: pin,
        p_is_active: isActive,
        p_role: role
      })
    );
  },

  async getBillingSettings(tenantId) {
    const [settings, seqs] = await Promise.all([
      supabase.from('billing_settings').select('*').eq('tenant_id', tenantId).maybeSingle(),
      supabase.from('invoice_sequences').select('*').eq('tenant_id', tenantId)
    ]);
    const s = unwrap(settings);
    return {
      provider: s?.provider || 'simulado',
      environment: s?.environment || 'habilitacion',
      sequences: unwrap(seqs).map(sequenceFromRow)
    };
  },

  async saveBillingSettings(tenantId, { provider, environment, sequences }) {
    unwrap(await supabase.from('billing_settings').update({ provider, environment }).eq('tenant_id', tenantId));
    for (const seq of sequences) {
      unwrap(
        await supabase
          .from('invoice_sequences')
          .upsert(sequenceToRow(seq, tenantId), { onConflict: 'tenant_id,kind' })
      );
    }
  },

  // ------------------------------------------------------------------ Registro de nuevo restaurante (Multi-tenant)
  async signInWithGoogle() {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/registro`
      }
    });
    if (error) throw error;
    return data;
  },

  async getAuthUser() {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  },

  async signOutAuth() {
    await supabase.auth.signOut();
  },

  async sendOnboardingOtp(email) {
    const { data, error } = await supabase.functions.invoke('send-onboarding-otp', {
      body: { email }
    });
    if (error) {
      let msg = 'No se pudo enviar el código de confirmación';
      try {
        const body = await error.context?.json();
        if (body?.error) msg = body.error;
      } catch {
        /* ignorar fallo al leer context json */
      }
      throw new Error(msg);
    }
    return data;
  },

  async verifyOnboardingOtp({ email, code }) {
    const res = unwrap(
      await supabase.rpc('verify_onboarding_code', {
        p_email: email,
        p_code: code
      })
    );
    if (!res.ok) {
      throw new Error(res.error || 'Código incorrecto o expirado');
    }
    return res;
  },

  async checkSlugAvailable(slug) {
    const res = unwrap(
      await supabase.rpc('check_slug_available', {
        p_slug: slug
      })
    );
    return res;
  },

  async registerTenant(data) {
    const res = unwrap(
      await supabase.rpc('register_tenant', {
        p_email: data.email,
        p_code: data.code,
        p_name: data.name,
        p_slug: data.slug,
        p_phone: data.phone || null,
        p_city: data.city || null,
        p_owner_name: data.ownerName || 'Dueño',
        p_pin: data.pin
      })
    );

    if (res?.staffId) {
      await this.loginStaff({ slug: data.slug, staffId: res.staffId, pin: data.pin }).catch(() => null);
    }

    return res;
  }
};

export { toAppError };
