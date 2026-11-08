-- ==============================================================================
-- Una factura por mesa: un comprobante puede cubrir varias comandas.
--
-- Antes: invoices.order_id era único (1 comanda = 1 comprobante).
-- Ahora: invoice_orders relaciona el comprobante con sus comandas. El UNIQUE de
--        invoice_orders.order_id impide cobrar dos veces la misma comanda.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. Relación comprobante ↔ comandas
-- ------------------------------------------------------------------------------
create table public.invoice_orders (
  invoice_id uuid   not null references public.invoices(id) on delete cascade,
  order_id   bigint not null unique references public.orders(id) on delete restrict,
  tenant_id  uuid   not null references public.tenants(id) on delete cascade,
  primary key (invoice_id, order_id)
);

-- Copia de las comandas cobradas, para mostrarlas en el tiquete (el comprobante
-- es una foto inmutable, igual que items).
alter table public.invoices add column order_ids bigint[] not null default '{}';

insert into public.invoice_orders (invoice_id, order_id, tenant_id)
select id, order_id, tenant_id from public.invoices where order_id is not null;
update public.invoices set order_ids = array[order_id] where order_id is not null;

alter table public.invoices drop column order_id;

revoke all on public.invoice_orders from public, anon, authenticated;
grant select on public.invoice_orders to authenticated;
alter table public.invoice_orders enable row level security;
create policy invoice_orders_cashier_read on public.invoice_orders for select
  using (public.has_staff_role(tenant_id, array['owner', 'admin', 'caja']));

-- ------------------------------------------------------------------------------
-- 2. issue_invoice: recibe las comandas de una mesa
-- ------------------------------------------------------------------------------
drop function public.issue_invoice(bigint, text, uuid, text);

create or replace function public.issue_invoice(
  p_order_ids bigint[],
  p_kind text,
  p_customer_id uuid default null,
  p_payment_method text default 'efectivo'
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
  if v_tenant.plan = 'basic' then
    raise exception 'La Caja POS requiere el plan Intermedio o superior' using errcode = 'P0001';
  end if;
  if p_kind = 'electronica' and v_tenant.plan <> 'premium' then
    raise exception 'La facturación electrónica requiere el plan Premium' using errcode = 'P0001';
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

-- Compatibilidad: el frontend anterior llama con una sola comanda (p_order_id).
create or replace function public.issue_invoice(
  p_order_id bigint,
  p_kind text,
  p_customer_id uuid default null,
  p_payment_method text default 'efectivo'
) returns public.invoices
language sql security definer set search_path = public as $$
  select public.issue_invoice(array[p_order_id], p_kind, p_customer_id, p_payment_method);
$$;

revoke execute on function public.issue_invoice(bigint[], text, uuid, text) from public, anon, authenticated;
revoke execute on function public.issue_invoice(bigint, text, uuid, text) from public, anon, authenticated;
grant execute on function public.issue_invoice(bigint[], text, uuid, text) to authenticated;
grant execute on function public.issue_invoice(bigint, text, uuid, text) to authenticated;

-- Que PostgREST vea la nueva firma de inmediato.
notify pgrst, 'reload schema';
