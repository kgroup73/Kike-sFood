-- ==============================================================================
-- Cobro Fraccionado / Separar Cuenta por Platillos (Split Bill by Items)
-- ==============================================================================

-- 1. Agregar control de cantidad facturada a cada ítem de comanda
alter table public.order_items
  add column if not exists billed_quantity int not null default 0 check (billed_quantity >= 0);

-- Permitir que una misma comanda tenga cobros parciales en comprobantes distintos
alter table public.invoice_orders
  drop constraint if exists invoice_orders_order_id_key;

-- Sincronizar comandas históricas que ya fueron cobradas
update public.order_items oi
set billed_quantity = oi.quantity
from public.orders o
where oi.order_id = o.id and o.status = 'Cobrado' and oi.billed_quantity < oi.quantity;

-- Eliminar firmas anteriores para evitar ambigüedad en sobrecargas con parámetros por defecto
drop function if exists public.issue_invoice(bigint[], text, uuid, text);
drop function if exists public.issue_invoice(bigint[], text, uuid, text, integer);

-- 2. Actualizar issue_invoice para soportar facturación parcial por platillos
create or replace function public.issue_invoice(
  p_order_ids bigint[],
  p_kind text,
  p_customer_id uuid default null,
  p_payment_method text default 'efectivo',
  p_tip integer default null,
  p_items jsonb default null
) returns public.invoices
language plpgsql security definer set search_path = public as $$
declare
  v_staff     public.staff_members;
  v_tenant    public.tenants;
  v_ids       bigint[];
  v_found     int;
  v_tables    int;
  v_label     text;
  v_subtotal  int := 0;
  v_tip       int;
  v_rate      numeric;
  v_base      int;
  v_tax       int;
  v_items     jsonb;
  v_seq       public.invoice_sequences;
  v_number    int;
  v_cufe      text := null;
  v_customer  jsonb;
  v_invoice   public.invoices;
  v_bad       record;
  v_item      jsonb;
  v_item_id   uuid;
  v_item_qty  int;
  v_oid       bigint;
  v_unbilled  int;
begin
  v_staff := public.require_staff(array['owner', 'admin', 'caja']);
  select * into v_tenant from public.tenants where id = v_staff.tenant_id;

  if v_tenant.plan <> 'premium' then
    raise exception 'La caja requiere el plan Premium' using errcode = 'P0001';
  end if;
  if p_kind not in ('pos', 'electronica') then
    raise exception 'Tipo de comprobante no válido' using errcode = 'P0001';
  end if;
  if p_payment_method not in ('efectivo', 'tarjeta', 'transferencia') then
    raise exception 'Método de pago no válido' using errcode = 'P0001';
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

  -- Bloquea las comandas para evitar race conditions
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

  -- Facturación parcial por platillos
  if p_items is not null and jsonb_array_length(p_items) > 0 then
    v_subtotal := 0;
    v_items := p_items;

    for v_item in select * from jsonb_array_elements(p_items)
    loop
      v_item_id := (v_item->>'id')::uuid;
      v_item_qty := greatest(1, coalesce((v_item->>'quantity')::int, 1));
      v_subtotal := v_subtotal + ((v_item->>'unitPrice')::int * v_item_qty);

      -- Actualiza el contador de facturación del ítem si se suministró su UUID
      if v_item_id is not null then
        update public.order_items
        set billed_quantity = billed_quantity + v_item_qty
        where id = v_item_id and tenant_id = v_staff.tenant_id;
      end if;
    end loop;
  else
    -- Facturación de comanda completa (comportamiento tradicional)
    select coalesce(jsonb_agg(jsonb_build_object(
             'name', g.name, 'quantity', g.quantity, 'unitPrice', g.unit_price,
             'totalPrice', g.total_price, 'selectedOptions', to_jsonb(g.selected_options)
           ) order by g.name, g.unit_price), '[]'::jsonb)
      into v_items
    from (
      select oi.name, oi.unit_price, oi.selected_options,
             sum(oi.quantity - oi.billed_quantity)::int as quantity,
             sum((oi.quantity - oi.billed_quantity) * oi.unit_price)::int as total_price
      from public.order_items oi
      where oi.order_id = any(v_ids) and (oi.quantity - oi.billed_quantity) > 0
      group by oi.name, oi.unit_price, oi.selected_options
    ) g;

    -- Si se cobran las comandas completas, calcula el subtotal de lo pendiente
    select coalesce(sum((oi.quantity - oi.billed_quantity) * oi.unit_price), 0)::int
      into v_subtotal
    from public.order_items oi
    where oi.order_id = any(v_ids);

    -- Marca todos los ítems de estas comandas como totalmente facturados
    update public.order_items
    set billed_quantity = quantity
    where order_id = any(v_ids) and tenant_id = v_staff.tenant_id;
  end if;

  if v_subtotal <= 0 then
    raise exception 'No hay platillos pendientes por cobrar en la selección' using errcode = 'P0001';
  end if;

  -- Propina: si se envía un valor explícito en caja, se usa ese
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

  v_number := v_seq.next_number;
  update public.invoice_sequences set next_number = next_number + 1
  where tenant_id = v_seq.tenant_id and kind = v_seq.kind;

  if p_kind = 'electronica' then
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

  -- Cierre de comanda: solo pasa a 'Cobrado' si todos sus ítems ya fueron facturados
  perform set_config('kikes.issuing_invoice', 'on', true);
  foreach v_oid in array v_ids loop
    select count(*) into v_unbilled
    from public.order_items
    where order_id = v_oid and (quantity - billed_quantity) > 0;

    if v_unbilled = 0 then
      update public.orders set status = 'Cobrado' where id = v_oid;
    end if;
  end loop;
  perform set_config('kikes.issuing_invoice', 'off', true);

  return v_invoice;
end $$;

-- Compatibilidad: llamada escalar con una sola comanda (p_order_id bigint)
create or replace function public.issue_invoice(
  p_order_id bigint,
  p_kind text,
  p_customer_id uuid default null,
  p_payment_method text default 'efectivo'
) returns public.invoices
language sql security definer set search_path = public as $$
  select public.issue_invoice(array[p_order_id], p_kind, p_customer_id, p_payment_method, null, null);
$$;

grant execute on function public.issue_invoice(bigint[], text, uuid, text, integer, jsonb) to authenticated;
grant execute on function public.issue_invoice(bigint, text, uuid, text) to authenticated;
