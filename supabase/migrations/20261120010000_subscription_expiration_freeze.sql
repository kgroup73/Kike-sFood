-- ==============================================================================
-- Congelamiento Dinámico por Vencimiento de Suscripción (Subscription Expiration Freeze)
-- ==============================================================================
-- 1. Si un restaurante tiene plan_expires_at <= now(), se considera automáticamente
--    congelado (vencido) sin necesidad de procesos en segundo plano ni crons.
-- 2. La carta pública bloquea categorías, productos, pedidos y llamados al mesero
--    cuando la suscripción está vencida.
-- 3. En la pantalla de login del personal, solo el Dueño (owner) puede ingresar
--    para poder renovar el plan mediante su código de activación.
-- 4. El canje de un nuevo código mediante redeem_plan_code extiende la fecha y
--    reactiva inmediatamente todas las operaciones.
-- ==============================================================================

-- 1. Actualizar RLS de categorías y productos para exigir restaurante operativo
--    (is_active = true Y fecha de expiración nula o futura)
drop policy if exists categories_public_read on public.categories;
create policy categories_public_read on public.categories for select
  using (exists (
    select 1 from public.tenants t
    where t.id = tenant_id
      and t.is_active
      and (t.plan_expires_at is null or t.plan_expires_at > now())
  ));

drop policy if exists products_public_read on public.products;
create policy products_public_read on public.products for select
  using (
    (available and exists (
      select 1 from public.tenants t
      where t.id = tenant_id
        and t.is_active
        and (t.plan_expires_at is null or t.plan_expires_at > now())
    ))
    or public.has_staff_role(tenant_id)
  );

-- 2. Actualizar resolve_table para que rechace mesas si el restaurante está vencido
create or replace function public.resolve_table(p_slug text, p_token text)
returns table (table_id uuid, label text)
language sql stable security definer set search_path = public as $$
  select rt.id, rt.label
  from public.restaurant_tables rt
  join public.tenants t on t.id = rt.tenant_id
  where t.slug = p_slug
    and t.is_active
    and (t.plan_expires_at is null or t.plan_expires_at > now())
    and rt.token = p_token
    and rt.is_active;
$$;

grant execute on function public.resolve_table(text, text) to anon, authenticated;

-- 3. Actualizar create_order para rechazar pedidos si el restaurante está vencido
create or replace function public.create_order(
  p_slug text,
  p_table_token text,
  p_items jsonb,
  p_include_tip boolean default true
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_tenant   public.tenants;
  v_table    public.restaurant_tables;
  v_item     jsonb;
  v_product  public.products;
  v_group    jsonb;
  v_sel      jsonb;
  v_qty      int;
  v_opt_name text;
  v_opt_price int;
  v_extra    int;
  v_options  text[];
  v_unit     int;
  v_missing  text;
  v_subtotal int := 0;
  v_tip      int;
  v_order_id bigint;
  v_lines    jsonb := '[]'::jsonb;
  v_recent   int;
begin
  select * into v_tenant from public.tenants
  where slug = p_slug
    and is_active
    and (plan_expires_at is null or plan_expires_at > now());

  if not found then
    raise exception 'Restaurante no encontrado' using errcode = 'P0002';
  end if;
  if v_tenant.plan = 'basic' then
    raise exception 'Este restaurante no recibe pedidos desde la mesa. Pide a tu mesero.' using errcode = 'P0001';
  end if;

  select * into v_table from public.restaurant_tables
  where tenant_id = v_tenant.id and token = p_table_token and is_active;
  if not found then
    raise exception 'Código de mesa inválido. Escanea de nuevo el código de tu mesa.' using errcode = 'P0001';
  end if;

  if p_items is null or jsonb_typeof(p_items) <> 'array'
     or jsonb_array_length(p_items) = 0 or jsonb_array_length(p_items) > 30 then
    raise exception 'El pedido no tiene productos válidos' using errcode = 'P0001';
  end if;

  -- Freno anti-abuso: máximo 6 pedidos por mesa cada 10 minutos.
  select count(*) into v_recent from public.orders
  where table_id = v_table.id and created_at > now() - interval '10 minutes';
  if v_recent >= 6 then
    raise exception 'Demasiados pedidos seguidos desde esta mesa. Llama a tu mesero.' using errcode = 'P0001';
  end if;

  for v_item in select value from jsonb_array_elements(p_items) loop
    begin
      select * into v_product from public.products
      where id = (v_item->>'productId')::uuid and tenant_id = v_tenant.id and available;
    exception when invalid_text_representation then
      raise exception 'Producto inválido' using errcode = 'P0001';
    end;
    if not found then
      raise exception 'Un producto del pedido ya no está disponible' using errcode = 'P0001';
    end if;

    select s.name into v_missing
    from public.ingredients_stock s
    where s.tenant_id = v_tenant.id and s.is_sold_out
      and s.ingredient_key in (select public.normalize_ingredient(i) from unnest(v_product.ingredients) as i)
    limit 1;
    if v_missing is not null then
      raise exception '"%" está agotado (sin %)', v_product.name, v_missing using errcode = 'P0001';
    end if;

    begin
      v_qty := (v_item->>'quantity')::int;
    exception when others then
      v_qty := null;
    end;
    if v_qty is null or v_qty < 1 or v_qty > 50 then
      raise exception 'Cantidad inválida para %', v_product.name using errcode = 'P0001';
    end if;

    v_sel := coalesce(v_item->'selections', '{}'::jsonb);
    if jsonb_typeof(v_sel) <> 'object' then
      raise exception 'Opciones inválidas para %', v_product.name using errcode = 'P0001';
    end if;
    if exists (
      select 1 from jsonb_object_keys(v_sel) k
      where not exists (select 1 from jsonb_array_elements(v_product.modifiers) m where m->>'title' = k)
    ) then
      raise exception 'Opción desconocida para %', v_product.name using errcode = 'P0001';
    end if;

    v_extra := 0;
    v_options := '{}';
    for v_group in select value from jsonb_array_elements(v_product.modifiers) loop
      v_opt_name := v_sel->>(v_group->>'title');
      if v_opt_name is null then
        if coalesce((v_group->>'required')::boolean, false) then
          raise exception 'Falta elegir "%" para %', v_group->>'title', v_product.name using errcode = 'P0001';
        end if;
        continue;
      end if;
      select coalesce((o->>'price')::int, 0) into v_opt_price
      from jsonb_array_elements(v_group->'options') o
      where o->>'name' = v_opt_name;
      if not found then
        raise exception 'La opción "%" no existe para %', v_opt_name, v_product.name using errcode = 'P0001';
      end if;
      v_extra := v_extra + v_opt_price;
      v_options := v_options || v_opt_name;
    end loop;

    v_unit := v_product.price + v_extra;
    v_subtotal := v_subtotal + v_unit * v_qty;
    v_lines := v_lines || jsonb_build_object(
      'product_id', v_product.id, 'name', v_product.name, 'quantity', v_qty,
      'unit_price', v_unit, 'total_price', v_unit * v_qty, 'selected_options', to_jsonb(v_options)
    );
  end loop;

  v_tip := case when p_include_tip then round(v_subtotal * v_tenant.tip_rate / 100.0)::int else 0 end;

  insert into public.orders (tenant_id, table_id, table_label, status, subtotal, tip, total)
  values (v_tenant.id, v_table.id, v_table.label, 'Pendiente', v_subtotal, v_tip, v_subtotal + v_tip)
  returning id into v_order_id;

  insert into public.order_items (order_id, tenant_id, product_id, name, quantity, unit_price, total_price, selected_options)
  select v_order_id, v_tenant.id, (l->>'product_id')::uuid, l->>'name', (l->>'quantity')::int,
         (l->>'unit_price')::int, (l->>'total_price')::int,
         array(select jsonb_array_elements_text(l->'selected_options'))
  from jsonb_array_elements(v_lines) l;

  return jsonb_build_object(
    'orderId', v_order_id, 'tableLabel', v_table.label,
    'subtotal', v_subtotal, 'tip', v_tip, 'total', v_subtotal + v_tip
  );
end $$;

grant execute on function public.create_order(text, text, jsonb, boolean) to anon, authenticated;

-- 4. Actualizar call_waiter para rechazar llamados si el restaurante está vencido
create or replace function public.call_waiter(p_slug text, p_table_token text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_tenant public.tenants;
  v_table  public.restaurant_tables;
  v_call   public.waiter_calls;
begin
  select * into v_tenant from public.tenants
  where slug = p_slug
    and is_active
    and (plan_expires_at is null or plan_expires_at > now());

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

grant execute on function public.call_waiter(text, text) to anon, authenticated;

-- 5. Actualizar list_staff_for_login:
--    Si el restaurante no está operativo (inactivo o suscripción vencida), únicamente muestra al Dueño (owner)
create or replace function public.list_staff_for_login(p_slug text)
returns table (id uuid, display_name text, role text)
language sql stable security definer set search_path = public as $$
  select s.id, s.display_name, s.role
  from public.staff_members s
  join public.tenants t on t.id = s.tenant_id
  where t.slug = p_slug
    and s.is_active
    and (
      (t.is_active and (t.plan_expires_at is null or t.plan_expires_at > now()))
      or s.role = 'owner'
    )
  order by case s.role when 'owner' then 0 when 'admin' then 1 else 2 end, s.display_name;
$$;

grant execute on function public.list_staff_for_login(text) to anon, authenticated;

-- 6. Actualizar verify_staff_pin:
--    Si el restaurante está vencido o inactivo, solo permite al Dueño (owner) ingresar.
create or replace function public.verify_staff_pin(p_slug text, p_staff_id uuid, p_pin text)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare
  v public.staff_members;
  v_tenant public.tenants;
  v_is_operational boolean;
begin
  select * into v_tenant from public.tenants where slug = p_slug;
  if not found then
    return jsonb_build_object('ok', false, 'reason', 'invalid');
  end if;

  v_is_operational := v_tenant.is_active and (v_tenant.plan_expires_at is null or v_tenant.plan_expires_at > now());

  select s.* into v from public.staff_members s
  where s.id = p_staff_id and s.tenant_id = v_tenant.id
  for update of s;

  if not found or not v.is_active then
    return jsonb_build_object('ok', false, 'reason', 'invalid');
  end if;

  -- Si el restaurante no está operativo (inactivo o suscripción vencida), únicamente el dueño puede ingresar
  if not v_is_operational and v.role <> 'owner' then
    return jsonb_build_object('ok', false, 'reason', case when not v_tenant.is_active then 'tenant_inactive' else 'subscription_expired' end);
  end if;

  if v.locked_until is not null and v.locked_until > now() then
    return jsonb_build_object('ok', false, 'reason', 'locked', 'lockedUntil', v.locked_until);
  end if;

  if p_pin is null or extensions.crypt(p_pin, v.pin_hash) <> v.pin_hash then
    update public.staff_members set
      failed_attempts = case when failed_attempts + 1 >= 5 then 0 else failed_attempts + 1 end,
      locked_until    = case when failed_attempts + 1 >= 5 then now() + interval '15 minutes' else null end
    where id = v.id;
    return jsonb_build_object('ok', false, 'reason',
      case when v.failed_attempts + 1 >= 5 then 'locked' else 'invalid' end,
      'attemptsLeft', greatest(0, 4 - v.failed_attempts));
  end if;

  update public.staff_members set failed_attempts = 0, locked_until = null where id = v.id;
  return jsonb_build_object('ok', true, 'staffId', v.id, 'tenantId', v.tenant_id,
                            'userId', v.user_id, 'role', v.role, 'displayName', v.display_name);
end $$;

grant execute on function public.verify_staff_pin(text, uuid, text) to service_role;

-- 7. Actualizar superadmin_list_tenants para incluir estado derivado exacto
drop function if exists public.superadmin_list_tenants();

create or replace function public.superadmin_list_tenants()
returns table (
  id              uuid,
  slug            text,
  name            text,
  email           text,
  phone           text,
  city            text,
  plan            text,
  requested_plan  text,
  plan_expires_at timestamptz,
  is_active       boolean,
  status          text,
  created_at      timestamptz,
  orders_count    bigint,
  total_sales     numeric,
  last_order_at   timestamptz
) language sql stable security definer set search_path = public as $$
  select
    t.id,
    t.slug,
    t.name,
    t.email,
    t.phone,
    t.city,
    t.plan,
    coalesce(t.requested_plan, t.plan, 'basic') as requested_plan,
    t.plan_expires_at,
    t.is_active,
    case
      when not t.is_active and t.plan_expires_at is null then 'pending_activation'
      when not t.is_active then 'suspended'
      when t.plan_expires_at is not null and t.plan_expires_at <= now() then 'expired'
      else 'active'
    end as status,
    t.created_at,
    coalesce(count(o.id), 0)::bigint as orders_count,
    coalesce(sum(case when o.status in ('paid', 'delivered') then o.total else 0 end), 0)::numeric as total_sales,
    max(o.created_at) as last_order_at
  from public.tenants t
  left join public.orders o on o.tenant_id = t.id
  group by t.id
  order by t.created_at desc;
$$;

grant execute on function public.superadmin_list_tenants() to anon, authenticated;
