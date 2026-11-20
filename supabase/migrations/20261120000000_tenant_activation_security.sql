-- ==============================================================================
-- Blindaje de Seguridad y Activación de Restaurantes (KGroup Security Hardening)
-- ==============================================================================
-- 1. Los nuevos restaurantes se crean inactivos (is_active = false) por defecto.
-- 2. Se almacena el plan solicitado (requested_plan) seleccionado en el registro.
-- 3. La carta pública se bloquea en base de datos si el restaurante está inactivo
--    (RLS en categories y products ya restringen t.is_active; create_order y call_waiter rechazan).
-- 4. RLS en public.tenants permite lectura pública para que el frontend detecte
--    el estado inactivo y muestre la pantalla "Restaurante en preparación".
-- 5. Solo el usuario con rol 'owner' puede autenticarse con PIN en un restaurante inactivo
--    para acceder exclusivamente a la pantalla de canje de código de activación.
-- 6. El canje exitoso mediante redeem_plan_code activa el restaurante (is_active = true).
-- ==============================================================================

-- 1. Agregar columna requested_plan a la tabla tenants
alter table public.tenants
  add column if not exists requested_plan text default 'basic';

-- 2. Actualizar política RLS de tenants: permite a visitantes anónimos consultar
--    los metadatos públicos del restaurante (nombre, slug, is_active, etc.)
--    sin filtrar por is_active en esta tabla. El catálogo (categories, products)
--    y las operaciones de comensales siguen estrictamente bloqueadas por sus propias RLS y RPCs.
drop policy if exists tenants_public_read on public.tenants;
create policy tenants_public_read on public.tenants for select using (true);

-- 3. Actualizar la función atómica de registro para establecer is_active = false
--    y registrar el plan solicitado (requested_plan).
create or replace function public.register_tenant(
  p_email       text,
  p_code        text,
  p_name        text,
  p_slug        text,
  p_phone       text default null,
  p_city        text default null,
  p_owner_name  text default null,
  p_pin         text default null,
  p_plan        text default 'basic'
) returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare
  v_verify      jsonb;
  v_email       text := lower(btrim(p_email));
  v_slug        text := lower(btrim(p_slug));
  v_name        text := btrim(p_name);
  v_owner       text := btrim(coalesce(p_owner_name, 'Dueño'));
  v_pin         text := btrim(coalesce(p_pin, ''));
  v_plan        text := case when lower(btrim(coalesce(p_plan, 'basic'))) in ('basic', 'intermedio') then lower(btrim(p_plan)) else 'basic' end;
  v_tenant_id   uuid;
  v_staff_id    uuid;
begin
  -- 1. Validar OTP o token
  if coalesce(p_code, '') <> 'GOOGLE_OAUTH' then
    v_verify := public.verify_email_otp(v_email, p_code);
    if not (v_verify ->> 'ok')::boolean then
      raise exception '%', coalesce(v_verify ->> 'error', 'Código de verificación inválido o expirado') using errcode = 'P0001';
    end if;
  end if;

  if length(v_email) = 0 or v_email not like '%@%.%' then
    raise exception 'Ingresa un correo electrónico válido' using errcode = 'P0001';
  end if;

  -- 2. Validaciones de nombre y slug
  if length(v_name) = 0 then
    raise exception 'Escribe el nombre del restaurante' using errcode = 'P0001';
  end if;
  if not (v_slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and length(v_slug) between 3 and 60) then
    raise exception 'El enlace (slug) debe contener entre 3 y 60 caracteres (letras minúsculas, números y guiones)' using errcode = 'P0001';
  end if;
  if exists (select 1 from public.tenants where slug = v_slug) then
    raise exception 'El enlace "%" ya está en uso. Por favor elige otro.', v_slug using errcode = '23505';
  end if;

  -- 3. Validar PIN
  if not (v_pin ~ '^[0-9]{4,6}$') then
    raise exception 'El PIN debe ser de 4 a 6 dígitos numéricos' using errcode = 'P0001';
  end if;

  -- 4. Insertar el restaurante como INACTIVO (is_active = false) hasta el canje del código de activación
  insert into public.tenants (
    name, slug, email, phone, city, plan, requested_plan, tax_type, tax_rate, tip_rate, is_active
  ) values (
    v_name, v_slug, v_email, nullif(btrim(coalesce(p_phone, '')), ''), nullif(btrim(coalesce(p_city, '')), ''),
    'basic', v_plan, 'INC', 8.00, 10.00, false
  ) returning id into v_tenant_id;

  -- 5. Crear el usuario Dueño (Owner) en staff_members con su PIN hasheado con bcrypt
  insert into public.staff_members (
    tenant_id, user_id, display_name, role, pin_hash, is_active
  ) values (
    v_tenant_id, auth.uid(), v_owner, 'owner',
    extensions.crypt(v_pin, extensions.gen_salt('bf', 10)),
    true
  ) returning id into v_staff_id;

  -- 6. Crear mesas iniciales (Mesas 1 a 4) con tokens secretos únicos
  insert into public.restaurant_tables (tenant_id, label, sort_order)
  values
    (v_tenant_id, '1', 1),
    (v_tenant_id, '2', 2),
    (v_tenant_id, '3', 3),
    (v_tenant_id, '4', 4);

  -- 7. Crear categorías iniciales de la carta
  insert into public.categories (tenant_id, name, sort_order)
  values
    (v_tenant_id, 'Entradas', 1),
    (v_tenant_id, 'Platos Fuertes', 2),
    (v_tenant_id, 'Bebidas', 3);

  -- 8. Respuesta con datos esenciales
  return jsonb_build_object(
    'ok', true,
    'tenantId', v_tenant_id,
    'slug', v_slug,
    'name', v_name,
    'plan', 'basic',
    'requestedPlan', v_plan,
    'isActive', false,
    'staffId', v_staff_id,
    'ownerName', v_owner
  );
end $$;

grant execute on function public.register_tenant(text, text, text, text, text, text, text, text, text) to anon, authenticated;

-- 4. Actualizar list_staff_for_login:
--    Si el restaurante no está activo, únicamente muestra al Dueño (owner)
create or replace function public.list_staff_for_login(p_slug text)
returns table (id uuid, display_name text, role text)
language sql stable security definer set search_path = public as $$
  select s.id, s.display_name, s.role
  from public.staff_members s
  join public.tenants t on t.id = s.tenant_id
  where t.slug = p_slug
    and s.is_active
    and (t.is_active or s.role = 'owner')
  order by case s.role when 'owner' then 0 when 'admin' then 1 else 2 end, s.display_name;
$$;

grant execute on function public.list_staff_for_login(text) to anon, authenticated;

-- 5. Actualizar verify_staff_pin:
--    Permitir autenticación al Dueño incluso si el restaurante está inactivo (para poder canjear el código).
--    Rechazar con 'tenant_inactive' a cualquier otro rol si el restaurante no está activo.
create or replace function public.verify_staff_pin(p_slug text, p_staff_id uuid, p_pin text)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare
  v public.staff_members;
  v_tenant public.tenants;
begin
  select * into v_tenant from public.tenants where slug = p_slug;
  if not found then
    return jsonb_build_object('ok', false, 'reason', 'invalid');
  end if;

  select s.* into v from public.staff_members s
  where s.id = p_staff_id and s.tenant_id = v_tenant.id
  for update of s;

  if not found or not v.is_active then
    return jsonb_build_object('ok', false, 'reason', 'invalid');
  end if;

  -- Si el restaurante no está activo, únicamente el dueño (owner) puede ingresar
  if not v_tenant.is_active and v.role <> 'owner' then
    return jsonb_build_object('ok', false, 'reason', 'tenant_inactive');
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

-- 6. Actualizar redeem_plan_code para que active el restaurante (is_active = true)
create or replace function public.redeem_plan_code(
  p_slug text,
  p_code text
) returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_clean_code text := upper(btrim(coalesce(p_code, '')));
  v_tenant     public.tenants;
  v_code_rec   public.plan_upgrade_codes;
  v_new_exp    timestamptz := null;
begin
  if v_clean_code = '' then
    raise exception 'Por favor ingresa un código de activación' using errcode = 'P0001';
  end if;

  select * into v_tenant from public.tenants where slug = lower(btrim(p_slug));
  if not found then
    raise exception 'Restaurante no encontrado' using errcode = 'P0001';
  end if;

  select * into v_code_rec from public.plan_upgrade_codes
  where code = v_clean_code
  for update;

  if not found then
    raise exception 'El código de activación "%" no es válido', v_clean_code using errcode = 'P0001';
  end if;

  if v_code_rec.redeemed_at is not null then
    raise exception 'Este código ya fue canjeado el %', to_char(v_code_rec.redeemed_at, 'DD/MM/YYYY') using errcode = 'P0001';
  end if;

  if v_code_rec.expires_at < now() then
    raise exception 'Este código ha expirado y ya no es válido' using errcode = 'P0001';
  end if;

  if v_code_rec.target_tenant_id is not null and v_code_rec.target_tenant_id <> v_tenant.id then
    raise exception 'Este código fue emitido exclusivamente para otro restaurante' using errcode = 'P0001';
  end if;

  -- El plan Premium solo puede ser canjeado por el restaurante de pruebas la-trattoria
  if v_code_rec.plan = 'premium' and v_tenant.slug <> 'la-trattoria' then
    raise exception 'El plan Premium se encuentra en desarrollo y no está disponible para activación pública' using errcode = 'P0001';
  end if;

  if v_code_rec.duration_days is not null and v_code_rec.duration_days > 0 then
    -- Si ya tenía fecha futura, extenderla; de lo contrario, contar desde hoy
    if v_tenant.plan_expires_at is not null and v_tenant.plan_expires_at > now() and v_tenant.plan = v_code_rec.plan then
      v_new_exp := v_tenant.plan_expires_at + (v_code_rec.duration_days || ' days')::interval;
    else
      v_new_exp := now() + (v_code_rec.duration_days || ' days')::interval;
    end if;
  end if;

  -- Activar el restaurante y aplicar el plan canjeado
  update public.tenants set
    is_active = true,
    plan = v_code_rec.plan,
    plan_expires_at = v_new_exp
  where id = v_tenant.id;

  -- Marcar código como canjeado
  update public.plan_upgrade_codes set
    redeemed_at = now(),
    redeemed_by_tenant_id = v_tenant.id
  where id = v_code_rec.id;

  return jsonb_build_object(
    'ok', true,
    'plan', v_code_rec.plan,
    'isActive', true,
    'planExpiresAt', v_new_exp,
    'message', '¡Restaurante activado y plan actualizado con éxito!'
  );
end $$;

grant execute on function public.redeem_plan_code(text, text) to anon, authenticated;

-- 7. Actualizar superadmin_list_tenants para incluir requested_plan
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
