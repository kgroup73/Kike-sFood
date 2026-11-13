-- ==============================================================================
-- Auto-registro y creación de nuevos restaurantes (Multi-Tenant Onboarding)
-- ==============================================================================

-- 1. Tabla temporal para códigos de verificación de correo (OTP de 6 dígitos)
create table if not exists public.tenant_onboarding_codes (
  email       text primary key,
  code        text not null check (code ~ '^[0-9]{6}$'),
  attempts    int not null default 0,
  expires_at  timestamptz not null default (now() + interval '10 minutes'),
  created_at  timestamptz not null default now()
);

-- Solo el backend / service_role gestiona los códigos de verificación
alter table public.tenant_onboarding_codes enable row level security;
revoke all on public.tenant_onboarding_codes from anon, authenticated;

-- 2. Función RPC para verificar el código OTP de forma segura
create or replace function public.verify_onboarding_code(p_email text, p_code text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_rec public.tenant_onboarding_codes;
begin
  select * into v_rec from public.tenant_onboarding_codes
  where email = lower(btrim(p_email));

  if not found then
    return jsonb_build_object('ok', false, 'reason', 'not_found', 'error', 'No hay un código solicitado para este correo');
  end if;

  if v_rec.expires_at < now() then
    return jsonb_build_object('ok', false, 'reason', 'expired', 'error', 'El código de verificación ha expirado. Solicita uno nuevo.');
  end if;

  if v_rec.attempts >= 5 then
    return jsonb_build_object('ok', false, 'reason', 'too_many_attempts', 'error', 'Demasiados intentos fallidos. Solicita un nuevo código.');
  end if;

  if v_rec.code <> btrim(p_code) then
    update public.tenant_onboarding_codes set attempts = attempts + 1 where email = v_rec.email;
    return jsonb_build_object('ok', false, 'reason', 'invalid_code', 'error', 'El código ingresado es incorrecto', 'attemptsLeft', greatest(0, 4 - v_rec.attempts));
  end if;

  return jsonb_build_object('ok', true);
end $$;

grant execute on function public.verify_onboarding_code(text, text) to anon, authenticated;

-- 3. Función RPC para comprobar si un slug está disponible en tiempo real
create or replace function public.check_slug_available(p_slug text)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare
  v_slug text := lower(btrim(p_slug));
begin
  if not (v_slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and length(v_slug) between 3 and 60) then
    return jsonb_build_object('available', false, 'error', 'El enlace debe contener entre 3 y 60 letras minúsculas, números o guiones');
  end if;

  if exists (select 1 from public.tenants where slug = v_slug) then
    return jsonb_build_object('available', false, 'error', 'Este enlace ya está ocupado por otro restaurante');
  end if;

  return jsonb_build_object('available', true, 'slug', v_slug);
end $$;

grant execute on function public.check_slug_available(text) to anon, authenticated;

-- 4. Creación atómica del restaurante, usuario dueño y datos semilla
create or replace function public.register_tenant(
  p_email       text,
  p_code        text,
  p_name        text,
  p_slug        text,
  p_phone       text default null,
  p_city        text default null,
  p_owner_name  text default null,
  p_pin         text default null
) returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare
  v_verify      jsonb;
  v_email       text := lower(btrim(p_email));
  v_slug        text := lower(btrim(p_slug));
  v_name        text := btrim(p_name);
  v_owner       text := btrim(coalesce(p_owner_name, 'Dueño'));
  v_pin         text := btrim(coalesce(p_pin, ''));
  v_tenant_id   uuid;
  v_staff_id    uuid;
begin
  -- 1. Validar formato de correo
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

  -- 4. Insertar el restaurante (plan básico por defecto)
  insert into public.tenants (
    name, slug, email, phone, city, plan, tax_type, tax_rate, tip_rate, is_active
  ) values (
    v_name, v_slug, v_email, nullif(btrim(coalesce(p_phone, '')), ''), nullif(btrim(coalesce(p_city, '')), ''),
    'basic', 'INC', 8.00, 10.00, true
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

  -- 8. Consumir el código de verificación
  delete from public.tenant_onboarding_codes where email = v_email;

  return jsonb_build_object(
    'ok', true,
    'tenantId', v_tenant_id,
    'slug', v_slug,
    'name', v_name,
    'staffId', v_staff_id,
    'ownerName', v_owner
  );
end $$;

grant execute on function public.register_tenant(text, text, text, text, text, text, text, text) to anon, authenticated;
