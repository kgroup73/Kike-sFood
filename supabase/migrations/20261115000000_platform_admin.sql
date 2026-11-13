-- ==============================================================================
-- Panel de Administración de la Plataforma (Super Admin) y Códigos de Upgrade
-- ==============================================================================

-- 1. Tabla de administradores autorizados de la plataforma
create table if not exists public.platform_admins (
  email       text primary key,
  role        text not null default 'superadmin',
  created_at  timestamptz not null default now()
);

alter table public.platform_admins enable row level security;

-- Política de lectura para usuarios autenticados
do $$ begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'platform_admins' and policyname = 'platform_admins_read') then
    create policy platform_admins_read on public.platform_admins for select to anon, authenticated using (true);
  end if;
end $$;

grant select on public.platform_admins to anon, authenticated;

-- Precargar el correo del administrador principal y de desarrollo local
insert into public.platform_admins (email, role) values
  ('omar6688.oc@gmail.com', 'superadmin'),
  ('dueño.local@kikesfood.com', 'superadmin'),
  ('dueno@local.dev', 'superadmin')
on conflict (email) do nothing;

-- 2. Columna de expiración del plan en restaurantes
alter table public.tenants
  add column if not exists plan_expires_at timestamptz default null;

-- 3. Tabla de códigos de actualización de plan (Upgrade Codes)
create table if not exists public.plan_upgrade_codes (
  id                    uuid primary key default gen_random_uuid(),
  code                  text not null unique check (length(btrim(code)) >= 6),
  target_tenant_id      uuid references public.tenants(id) on delete cascade,
  target_slug           text,
  plan                  text not null check (plan in ('basic', 'intermedio', 'premium')),
  duration_days         int default null, -- null = permanente
  expires_at            timestamptz not null default (now() + interval '30 days'),
  redeemed_at           timestamptz default null,
  redeemed_by_tenant_id uuid references public.tenants(id) on delete set null,
  created_by            text,
  created_at            timestamptz not null default now()
);

create index if not exists idx_upgrade_codes_code on public.plan_upgrade_codes(code);
create index if not exists idx_upgrade_codes_tenant on public.plan_upgrade_codes(target_tenant_id);

alter table public.plan_upgrade_codes enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'plan_upgrade_codes' and policyname = 'upgrade_codes_read') then
    create policy upgrade_codes_read on public.plan_upgrade_codes for select to anon, authenticated using (true);
  end if;
end $$;

grant select on public.plan_upgrade_codes to anon, authenticated;

-- 4. RPC: Comprobar si un correo es administrador de la plataforma
create or replace function public.is_platform_admin(p_email text default null)
returns boolean language plpgsql stable security definer set search_path = public as $$
declare
  v_email text := lower(btrim(coalesce(p_email, current_setting('request.jwt.claim.email', true), auth.jwt() ->> 'email', '')));
begin
  if v_email = '' then
    return false;
  end if;
  return exists (select 1 from public.platform_admins where lower(email) = v_email);
end $$;

grant execute on function public.is_platform_admin(text) to anon, authenticated;

-- 5. RPC: Listado de restaurantes para el panel de Super Admin con métricas agregadas
create or replace function public.superadmin_list_tenants()
returns table (
  id              uuid,
  slug            text,
  name            text,
  email           text,
  phone           text,
  city            text,
  plan            text,
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

-- 6. RPC: Activar o suspender un restaurante desde el Super Admin
create or replace function public.superadmin_toggle_tenant(p_tenant_id uuid, p_is_active boolean)
returns jsonb language plpgsql security definer set search_path = public as $$
begin
  update public.tenants
  set is_active = p_is_active
  where id = p_tenant_id;

  if not found then
    raise exception 'Restaurante no encontrado' using errcode = 'P0001';
  end if;

  return jsonb_build_object('ok', true, 'tenantId', p_tenant_id, 'isActive', p_is_active);
end $$;

grant execute on function public.superadmin_toggle_tenant(uuid, boolean) to anon, authenticated;

-- 7. RPC: Cambiar directamente el plan de un restaurante
create or replace function public.superadmin_change_tenant_plan(
  p_tenant_id uuid,
  p_plan text,
  p_duration_days int default null
) returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_exp timestamptz := null;
  v_slug text;
begin
  if p_plan not in ('basic', 'intermedio', 'premium') then
    raise exception 'Plan inválido: %', p_plan using errcode = 'P0001';
  end if;

  select slug into v_slug from public.tenants where id = p_tenant_id;
  if not found then
    raise exception 'Restaurante no encontrado' using errcode = 'P0001';
  end if;

  -- El plan Premium solo está disponible para pruebas en el restaurante la-trattoria
  if p_plan = 'premium' and v_slug <> 'la-trattoria' then
    raise exception 'El plan Premium se encuentra en desarrollo y solo está disponible para pruebas en el restaurante "la-trattoria"' using errcode = 'P0001';
  end if;

  if p_duration_days is not null and p_duration_days > 0 then
    v_exp := now() + (p_duration_days || ' days')::interval;
  end if;

  update public.tenants
  set plan = p_plan,
      plan_expires_at = v_exp
  where id = p_tenant_id;

  return jsonb_build_object('ok', true, 'tenantId', p_tenant_id, 'plan', p_plan, 'planExpiresAt', v_exp);
end $$;

grant execute on function public.superadmin_change_tenant_plan(uuid, text, int) to anon, authenticated;

-- 8. RPC: Generar código de upgrade
create or replace function public.superadmin_create_upgrade_code(
  p_plan text,
  p_duration_days int default null,
  p_target_slug text default null,
  p_created_by text default null
) returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare
  v_prefix    text;
  v_code      text;
  v_tenant_id uuid := null;
  v_rec       public.plan_upgrade_codes;
begin
  if p_plan not in ('basic', 'intermedio', 'premium') then
    raise exception 'Plan no válido' using errcode = 'P0001';
  end if;

  -- El plan Premium solo puede generarse explícitamente para el restaurante de pruebas la-trattoria
  if p_plan = 'premium' and coalesce(lower(btrim(p_target_slug)), '') <> 'la-trattoria' then
    raise exception 'El plan Premium solo está disponible para pruebas en el restaurante "la-trattoria"' using errcode = 'P0001';
  end if;

  if p_target_slug is not null and btrim(p_target_slug) <> '' then
    select id into v_tenant_id from public.tenants where slug = lower(btrim(p_target_slug));
    if not found then
      raise exception 'No existe un restaurante con el enlace "%"', p_target_slug using errcode = 'P0001';
    end if;
  end if;

  v_prefix := case p_plan
    when 'intermedio' then 'INT'
    when 'premium'    then 'PREM'
    else 'BAS'
  end;

  -- Formato: KIKE-<PLAN>-XXXX (ej. KIKE-INT-7A9B)
  v_code := 'KIKE-' || v_prefix || '-' || upper(substring(encode(gen_random_bytes(4), 'hex') from 1 for 4));

  insert into public.plan_upgrade_codes (
    code, target_tenant_id, target_slug, plan, duration_days, created_by
  ) values (
    v_code, v_tenant_id, nullif(lower(btrim(p_target_slug)), ''), p_plan, p_duration_days, p_created_by
  ) returning * into v_rec;

  return jsonb_build_object(
    'ok', true,
    'code', v_rec.code,
    'plan', v_rec.plan,
    'durationDays', v_rec.duration_days,
    'targetSlug', v_rec.target_slug,
    'expiresAt', v_rec.expires_at,
    'createdAt', v_rec.created_at
  );
end $$;

grant execute on function public.superadmin_create_upgrade_code(text, int, text, text) to anon, authenticated;

-- 9. RPC: Listar todos los códigos de upgrade generados
create or replace function public.superadmin_list_upgrade_codes()
returns table (
  id                    uuid,
  code                  text,
  target_slug           text,
  plan                  text,
  duration_days         int,
  expires_at            timestamptz,
  redeemed_at           timestamptz,
  redeemed_slug         text,
  created_by            text,
  created_at            timestamptz,
  is_valid              boolean
) language sql stable security definer set search_path = public as $$
  select
    c.id,
    c.code,
    c.target_slug,
    c.plan,
    c.duration_days,
    c.expires_at,
    c.redeemed_at,
    t.slug as redeemed_slug,
    c.created_by,
    c.created_at,
    (c.redeemed_at is null and c.expires_at > now()) as is_valid
  from public.plan_upgrade_codes c
  left join public.tenants t on t.id = c.redeemed_by_tenant_id
  order by c.created_at desc;
$$;

grant execute on function public.superadmin_list_upgrade_codes() to anon, authenticated;

-- 10. RPC: Canjear código de actualización de plan (Invocado por el restaurante)
create or replace function public.redeem_plan_code(p_slug text, p_code text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_tenant   public.tenants;
  v_code_rec public.plan_upgrade_codes;
  v_new_exp  timestamptz := null;
  v_clean_code text := upper(btrim(coalesce(p_code, '')));
begin
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

  -- Actualizar el plan del restaurante
  update public.tenants set
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
    'planExpiresAt', v_new_exp,
    'message', '¡Plan actualizado con éxito!'
  );
end $$;

grant execute on function public.redeem_plan_code(text, text) to anon, authenticated;
