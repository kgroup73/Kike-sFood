-- ==============================================================================
-- Llamado al mesero, cocina opcional con comandas impresas y caja en el plan Premium.
--
-- Planes: 1 Básico = solo carta; 2 Intermedio = pedidos, llamado al mesero, cocina y
-- comandas; 3 Premium = además caja, cierre Z y facturación electrónica.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. Pantalla de cocina opcional (la decide el dueño o el administrador)
-- ------------------------------------------------------------------------------
alter table public.tenants add column if not exists kitchen_display boolean not null default true;
grant update (kitchen_display) on public.tenants to authenticated;

-- ------------------------------------------------------------------------------
-- 2. Comandas: estado final "Entregado" (sin caja) y marca de impresión
-- ------------------------------------------------------------------------------
alter table public.orders drop constraint if exists orders_status_check;
alter table public.orders add constraint orders_status_check
  check (status in ('Pendiente', 'En Preparación', 'Listo', 'Por Cobrar', 'Cobrado', 'Entregado', 'Cancelado'));

-- printed_at: cuándo la imprimió el equipo de la impresora. NULL = falta imprimir.
alter table public.orders add column if not exists printed_at timestamptz;
alter table public.orders add column if not exists print_count int not null default 0;
-- Lo anterior a esta migración no se imprime al activar la impresora.
update public.orders set printed_at = created_at where printed_at is null;
create index if not exists orders_unprinted_idx on public.orders(tenant_id) where printed_at is null;

-- Con caja (Premium) lo listo pasa a caja; sin caja se entrega y se cobra por fuera.
create or replace function public.enforce_order_status() returns trigger
language plpgsql as $$
declare
  v_with_pos boolean;
begin
  if new.status = old.status then
    return new;
  end if;
  if not (
       (old.status = 'Pendiente'      and new.status in ('En Preparación', 'Cancelado'))
    or (old.status = 'En Preparación' and new.status in ('Listo', 'Cancelado'))
    or (old.status = 'Listo'          and new.status in ('Por Cobrar', 'Entregado', 'Cancelado'))
    or (old.status = 'Por Cobrar'     and new.status in ('Cobrado', 'Cancelado'))
  ) then
    raise exception 'Transición de estado no permitida: % → %', old.status, new.status
      using errcode = 'P0001';
  end if;
  if old.status = 'Listo' and new.status in ('Por Cobrar', 'Entregado') then
    select plan = 'premium' into v_with_pos from public.tenants where id = new.tenant_id;
    if new.status = 'Por Cobrar' and not v_with_pos then
      raise exception 'Sin caja en tu plan: marca la comanda como entregada' using errcode = 'P0001';
    end if;
    if new.status = 'Entregado' and v_with_pos then
      raise exception 'Con caja, la comanda lista pasa a caja para cobrarse' using errcode = 'P0001';
    end if;
  end if;
  if new.status = 'Cobrado' then
    if coalesce(current_setting('kikes.issuing_invoice', true), '') <> 'on' then
      raise exception 'Un pedido solo pasa a Cobrado al emitir su comprobante' using errcode = 'P0001';
    end if;
    new.paid_at := now();
  end if;
  return new;
end $$;

-- El equipo de la impresora "reclama" la comanda antes de imprimirla: si hay dos
-- equipos encendidos, solo uno la imprime. Devuelve la comanda o NULL si ya estaba impresa.
create or replace function public.claim_order_print(p_order_id bigint)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_staff public.staff_members;
  v_order public.orders;
begin
  v_staff := public.require_staff();
  update public.orders
     set printed_at = now(), print_count = print_count + 1
   where id = p_order_id and tenant_id = v_staff.tenant_id and printed_at is null
     and status not in ('Cancelado', 'Cobrado', 'Entregado')
  returning * into v_order;
  if not found then
    return null;
  end if;
  return jsonb_build_object('id', v_order.id, 'printCount', v_order.print_count);
end $$;

-- Reimprimir desde cualquier equipo: la comanda vuelve a la fila de la impresora.
create or replace function public.request_order_reprint(p_order_id bigint)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_staff public.staff_members;
begin
  v_staff := public.require_staff();
  update public.orders set printed_at = null
   where id = p_order_id and tenant_id = v_staff.tenant_id;
  if not found then
    raise exception 'Pedido no encontrado' using errcode = 'P0002';
  end if;
end $$;

revoke execute on function public.claim_order_print(bigint) from public, anon, authenticated;
revoke execute on function public.request_order_reprint(bigint) from public, anon, authenticated;
grant execute on function public.claim_order_print(bigint) to authenticated;
grant execute on function public.request_order_reprint(bigint) to authenticated;

-- ------------------------------------------------------------------------------
-- 3. Llamado al mesero
-- ------------------------------------------------------------------------------
create table if not exists public.waiter_calls (
  id               bigint generated always as identity primary key,
  tenant_id        uuid not null references public.tenants(id) on delete cascade,
  table_id         uuid references public.restaurant_tables(id) on delete set null,
  table_label      text not null,
  created_at       timestamptz not null default now(),
  attended_at      timestamptz,
  attended_by_name text
);
create index if not exists waiter_calls_open_idx on public.waiter_calls(tenant_id, created_at desc)
  where attended_at is null;

alter table public.waiter_calls enable row level security;
create policy waiter_calls_staff_read on public.waiter_calls for select
  using (public.has_staff_role(tenant_id));
revoke all on public.waiter_calls from anon, authenticated;
grant select on public.waiter_calls to authenticated;

-- El comensal llama desde su mesa (anon). Si la mesa ya tiene un llamado sin atender,
-- se devuelve ese mismo: tocar el botón varias veces no llena la pantalla del personal.
create or replace function public.call_waiter(p_slug text, p_table_token text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_tenant public.tenants;
  v_table  public.restaurant_tables;
  v_call   public.waiter_calls;
begin
  select * into v_tenant from public.tenants where slug = p_slug and is_active;
  if not found then
    raise exception 'Restaurante no encontrado' using errcode = 'P0002';
  end if;
  if v_tenant.plan = 'basic' then
    raise exception 'Este restaurante no recibe llamados desde la mesa' using errcode = 'P0001';
  end if;
  select * into v_table from public.restaurant_tables
  where tenant_id = v_tenant.id and token = p_table_token and is_active;
  if not found then
    raise exception 'Código de mesa inválido. Escanea de nuevo el código de tu mesa.' using errcode = 'P0001';
  end if;

  select * into v_call from public.waiter_calls
  where table_id = v_table.id
    and (attended_at is null or created_at > now() - interval '30 seconds')
  order by created_at desc limit 1;
  if not found then
    insert into public.waiter_calls (tenant_id, table_id, table_label)
    values (v_tenant.id, v_table.id, v_table.label)
    returning * into v_call;
  end if;
  return jsonb_build_object('callId', v_call.id, 'tableLabel', v_call.table_label, 'createdAt', v_call.created_at);
end $$;

create or replace function public.attend_waiter_call(p_call_id bigint)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_staff public.staff_members;
begin
  v_staff := public.require_staff();
  update public.waiter_calls
     set attended_at = now(), attended_by_name = v_staff.display_name
   where id = p_call_id and tenant_id = v_staff.tenant_id and attended_at is null;
end $$;

revoke execute on function public.call_waiter(text, text) from public, anon, authenticated;
revoke execute on function public.attend_waiter_call(bigint) from public, anon, authenticated;
grant execute on function public.call_waiter(text, text) to anon, authenticated;
grant execute on function public.attend_waiter_call(bigint) to authenticated;

do $$
begin
  alter publication supabase_realtime add table public.waiter_calls;
exception when duplicate_object then null;
end $$;

-- ------------------------------------------------------------------------------
-- 4. La caja pasa al plan Premium. Se recrea issue_invoice con la nueva regla;
--    el resto es igual a 20261109000000_tip_at_checkout.sql.
-- ------------------------------------------------------------------------------
create or replace function public.issue_invoice(
  p_order_ids bigint[],
  p_kind text,
  p_customer_id uuid default null,
  p_payment_method text default 'efectivo',
  p_tip integer default null
) returns public.invoices
language plpgsql security definer set search_path = public, extensions as $$
declare
  v_staff    public.staff_members;
  v_tenant   public.tenants;
  v_ids      bigint[];
  v_found    int;
  v_tables   int;
  v_bad      record;
  v_label    text;
  v_subtotal int;
  v_tip      int;
  v_seq      public.invoice_sequences;
  v_customer jsonb;
  v_rate     numeric;
  v_base     int;
  v_tax      int;
  v_items    jsonb;
  v_number   int;
  v_cufe     text;
  v_invoice  public.invoices;
begin
  v_staff := public.require_staff(array['owner', 'admin', 'caja']);
  select * into v_tenant from public.tenants where id = v_staff.tenant_id;

  if p_kind not in ('pos', 'electronica') then
    raise exception 'Tipo de comprobante inválido' using errcode = 'P0001';
  end if;
  if p_payment_method not in ('efectivo', 'tarjeta', 'transferencia') then
    raise exception 'Método de pago inválido' using errcode = 'P0001';
  end if;
  -- La caja y la facturación son del plan Premium (antes la caja estaba en Intermedio).
  if v_tenant.plan <> 'premium' then
    raise exception 'La caja requiere el plan Premium' using errcode = 'P0001';
  end if;

  select coalesce(array_agg(distinct x order by x), '{}') into v_ids
  from unnest(p_order_ids) as x where x is not null;
  if cardinality(v_ids) = 0 then
    raise exception 'Selecciona al menos una comanda para cobrar' using errcode = 'P0001';
  end if;
  if cardinality(v_ids) > 50 then
    raise exception 'Demasiadas comandas en un solo comprobante' using errcode = 'P0001';
  end if;

  -- Bloquea las comandas (en orden, para evitar interbloqueos entre cajas).
  perform 1 from public.orders
  where id = any(v_ids) and tenant_id = v_staff.tenant_id
  order by id
  for update;

  select count(*), count(distinct coalesce(table_id::text, 'label:' || table_label)),
         min(table_label), coalesce(sum(subtotal), 0)::int, coalesce(sum(tip), 0)::int
    into v_found, v_tables, v_label, v_subtotal, v_tip
  from public.orders
  where id = any(v_ids) and tenant_id = v_staff.tenant_id;

  if v_found <> cardinality(v_ids) then
    raise exception 'Pedido no encontrado' using errcode = 'P0002';
  end if;
  select id, status into v_bad from public.orders
  where id = any(v_ids) and status <> 'Por Cobrar'
  order by id limit 1;
  if found then
    raise exception 'El pedido #% no está listo para cobrar (estado: %)', v_bad.id, v_bad.status using errcode = 'P0001';
  end if;
  if v_tables > 1 then
    raise exception 'Todas las comandas de un comprobante deben ser de la misma mesa' using errcode = 'P0001';
  end if;

  -- Propina voluntaria (Ley 1935 de 2018): la confirma la caja con el cliente al cobrar.
  -- Sin p_tip se usa lo que traían las comandas (compatibilidad con la caja anterior).
  if p_tip is not null then
    if p_tip < 0 then
      raise exception 'La propina no puede ser negativa' using errcode = 'P0001';
    end if;
    if p_tip > v_subtotal then
      raise exception 'La propina no puede superar el valor del consumo' using errcode = 'P0001';
    end if;
    v_tip := p_tip;
  end if;

  select * into v_seq from public.invoice_sequences
  where tenant_id = v_staff.tenant_id and kind = p_kind
  for update;
  if not found then
    raise exception 'Configura primero la numeración de % en Administración', p_kind using errcode = 'P0001';
  end if;
  if v_seq.range_to is not null and v_seq.next_number > v_seq.range_to then
    raise exception 'Se agotó el rango autorizado (% a %). Solicita una nueva resolución.', v_seq.range_from, v_seq.range_to using errcode = 'P0001';
  end if;
  if p_kind = 'electronica' and (v_seq.valid_until is null or v_seq.valid_until < current_date) then
    raise exception 'La resolución de facturación está vencida o sin fecha de vigencia' using errcode = 'P0001';
  end if;

  if p_customer_id is null then
    v_customer := jsonb_build_object('name', 'Consumidor Final', 'docType', 'CC', 'docNumber', '222222222222');
  else
    select jsonb_build_object('id', c.id, 'name', c.name, 'docType', c.doc_type, 'docNumber', c.doc_number,
                              'email', c.email, 'phone', c.phone)
      into v_customer
    from public.customers c where c.id = p_customer_id and c.tenant_id = v_staff.tenant_id;
    if v_customer is null then
      raise exception 'Cliente no encontrado' using errcode = 'P0002';
    end if;
  end if;

  -- El precio de carta ya incluye el impuesto: se desglosa, no se suma.
  v_rate := case when v_tenant.tax_type = 'NINGUNO' then 0 else v_tenant.tax_rate end;
  v_base := round(v_subtotal / (1 + v_rate / 100.0))::int;
  v_tax  := v_subtotal - v_base;

  -- Las líneas iguales (mismo platillo, precio y opciones) de distintas comandas se suman.
  select coalesce(jsonb_agg(jsonb_build_object(
           'name', g.name, 'quantity', g.quantity, 'unitPrice', g.unit_price,
           'totalPrice', g.total_price, 'selectedOptions', to_jsonb(g.selected_options)
         ) order by g.name, g.unit_price), '[]'::jsonb)
    into v_items
  from (
    select oi.name, oi.unit_price, oi.selected_options,
           sum(oi.quantity)::int as quantity, sum(oi.total_price)::int as total_price
    from public.order_items oi
    where oi.order_id = any(v_ids)
    group by oi.name, oi.unit_price, oi.selected_options
  ) g;

  v_number := v_seq.next_number;
  update public.invoice_sequences set next_number = next_number + 1
  where tenant_id = v_seq.tenant_id and kind = v_seq.kind;

  if p_kind = 'electronica' then
    -- SIMULADO: el CUFE real lo devuelve el proveedor tecnológico (Factus / Siigo).
    v_cufe := encode(extensions.digest(concat_ws('|', v_seq.prefix || v_number, now()::text, v_subtotal,
                     v_tenant.nit, v_customer->>'docNumber', 'SIMULADO'), 'sha384'), 'hex');
  end if;

  insert into public.invoices (
    tenant_id, order_ids, kind, prefix, number, customer, payment_method, table_label, items,
    items_total, tax_base, tax, tax_type, tax_rate, tip, total, cufe, dian_status,
    issued_by, issued_by_name
  ) values (
    v_staff.tenant_id, v_ids, p_kind, v_seq.prefix, v_number, v_customer, p_payment_method,
    v_label, v_items, v_subtotal, v_base, v_tax, v_tenant.tax_type, v_rate,
    v_tip, v_subtotal + v_tip, v_cufe,
    case when p_kind = 'electronica' then 'simulado' else 'no_aplica' end,
    v_staff.id, v_staff.display_name
  ) returning * into v_invoice;

  insert into public.invoice_orders (invoice_id, order_id, tenant_id)
  select v_invoice.id, x, v_staff.tenant_id from unnest(v_ids) as x;

  perform set_config('kikes.issuing_invoice', 'on', true);
  update public.orders set status = 'Cobrado' where id = any(v_ids);
  perform set_config('kikes.issuing_invoice', 'off', true);

  return v_invoice;
end $$;

revoke execute on function public.issue_invoice(bigint[], text, uuid, text, integer) from public, anon, authenticated;
grant execute on function public.issue_invoice(bigint[], text, uuid, text, integer) to authenticated;

notify pgrst, 'reload schema';
