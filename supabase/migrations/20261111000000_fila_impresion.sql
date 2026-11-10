-- ==============================================================================
-- Fila de impresión por estaciones y agente local de impresión.
--
-- La app ya no imprime "directo": anota trabajos en print_jobs y un imprimidor los
-- saca. Hay dos imprimidores: el agente local (programa instalado en el computador
-- de la impresora, se vincula con el código del restaurante) y, como respaldo, el
-- navegador de un equipo del personal. Cada categoría de la carta va a una estación
-- (Cocina, Barra…); lo que no tiene estación va a la estación por defecto.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. Estaciones
-- ------------------------------------------------------------------------------
create table public.print_stations (
  id              uuid primary key default gen_random_uuid(),
  tenant_id       uuid not null references public.tenants(id) on delete cascade,
  name            text not null check (length(btrim(name)) between 1 and 40),
  is_default      boolean not null default false,  -- recibe los platos sin estación
  prints_receipts boolean not null default false,  -- recibe los tiquetes de caja
  sort_order      int not null default 0,
  created_at      timestamptz not null default now(),
  unique (tenant_id, name),
  unique (id, tenant_id)
);
create unique index print_stations_one_default on public.print_stations(tenant_id) where is_default;
create unique index print_stations_one_receipts on public.print_stations(tenant_id) where prints_receipts;

-- La estación de una categoría debe ser del mismo restaurante (FK compuesta).
alter table public.categories add column print_station_id uuid;
alter table public.categories add constraint categories_print_station_fk
  foreign key (print_station_id, tenant_id) references public.print_stations(id, tenant_id)
  on delete set null (print_station_id);

-- Cada restaurante arranca con una estación "Cocina" por defecto.
insert into public.print_stations (tenant_id, name, is_default)
select id, 'Cocina', true from public.tenants
on conflict do nothing;

create or replace function public.init_print_station() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.print_stations (tenant_id, name, is_default) values (new.id, 'Cocina', true)
  on conflict do nothing;
  return new;
end $$;
create trigger tenants_init_print_station after insert on public.tenants
  for each row execute function public.init_print_station();

-- ------------------------------------------------------------------------------
-- 2. Equipos de impresión (agente local)
-- ------------------------------------------------------------------------------
create table public.print_devices (
  id                 uuid primary key default gen_random_uuid(),
  tenant_id          uuid not null references public.tenants(id) on delete cascade,
  name               text not null check (length(btrim(name)) between 1 and 40),
  station_ids        uuid[] not null default '{}',
  token_hash         text unique,          -- sha256 del token del agente (NULL hasta vincular)
  pairing_code_hash  text,                 -- sha256 del código de vinculación (un solo uso)
  pairing_expires_at timestamptz,
  paired_at          timestamptz,
  last_seen_at       timestamptz,
  agent_version      text,
  revoked_at         timestamptz,
  created_at         timestamptz not null default now()
);
create index print_devices_tenant_idx on public.print_devices(tenant_id);

-- ------------------------------------------------------------------------------
-- 3. Fila de trabajos
-- ------------------------------------------------------------------------------
create table public.print_jobs (
  id                bigint generated always as identity primary key,
  tenant_id         uuid not null references public.tenants(id) on delete cascade,
  station_id        uuid not null references public.print_stations(id) on delete cascade,
  kind              text not null check (kind in ('comanda', 'tiquete', 'prueba')),
  order_id          bigint references public.orders(id) on delete cascade,
  invoice_id        uuid references public.invoices(id) on delete cascade,
  payload           jsonb not null,
  status            text not null default 'pendiente'
                    check (status in ('pendiente', 'imprimiendo', 'impreso', 'error')),
  attempts          int not null default 0,
  claimed_by_device uuid references public.print_devices(id) on delete set null,
  claimed_by_name   text,
  claimed_at        timestamptz,
  printed_at        timestamptz,
  error             text,
  created_at        timestamptz not null default now()
);
create index print_jobs_queue_idx on public.print_jobs(tenant_id, station_id, id)
  where status in ('pendiente', 'imprimiendo');
create index print_jobs_order_idx on public.print_jobs(order_id);

-- Trabajos que se pueden tomar: pendientes, o "imprimiendo" abandonados (el equipo se
-- apagó a mitad de camino), de las últimas 12 horas y con menos de 5 intentos.
create or replace function public.print_job_claimable(j public.print_jobs) returns boolean
language sql stable as $$
  select j.created_at > now() - interval '12 hours'
     and j.attempts < 5
     and (j.status = 'pendiente'
          or (j.status = 'imprimiendo' and j.claimed_at < now() - interval '60 seconds'));
$$;

-- Toma hasta p_limit trabajos de esas estaciones (NULL = todas) y los marca "imprimiendo".
-- FOR UPDATE SKIP LOCKED: con dos imprimidores a la vez, cada trabajo sale una sola vez.
create or replace function public.take_print_jobs(
  p_tenant uuid, p_station_ids uuid[], p_limit int, p_device uuid, p_name text
) returns setof public.print_jobs
language plpgsql security definer set search_path = public as $$
begin
  return query
  with picked as (
    select j.id from public.print_jobs j
    where j.tenant_id = p_tenant
      and (p_station_ids is null or j.station_id = any(p_station_ids))
      and public.print_job_claimable(j)
    order by j.id
    limit greatest(1, least(coalesce(p_limit, 10), 20))
    for update skip locked
  )
  update public.print_jobs j
     set status = 'imprimiendo', attempts = j.attempts + 1, claimed_at = now(),
         claimed_by_device = p_device, claimed_by_name = p_name, error = null
    from picked
   where j.id = picked.id
  returning j.*;
end $$;

-- Resultado de un trabajo. Tras 5 fallas queda en "error" para que alguien lo revise.
create or replace function public.finish_print_job(p_tenant uuid, p_job_id bigint, p_ok boolean, p_error text)
returns void language plpgsql security definer set search_path = public as $$
begin
  update public.print_jobs
     set status = case when p_ok then 'impreso' when attempts >= 5 then 'error' else 'pendiente' end,
         printed_at = case when p_ok then now() else null end,
         error = case when p_ok then null else left(coalesce(p_error, 'Error de impresión'), 300) end
   where id = p_job_id and tenant_id = p_tenant and status = 'imprimiendo';
end $$;

-- La comanda figura impresa cuando todos sus trabajos de comanda salieron.
create or replace function public.sync_order_printed() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.kind = 'comanda' and new.order_id is not null and new.status = 'impreso' then
    update public.orders o set printed_at = now()
     where o.id = new.order_id
       and not exists (
         select 1 from public.print_jobs j
          where j.order_id = new.order_id and j.kind = 'comanda' and j.status <> 'impreso');
  end if;
  return new;
end $$;
create trigger print_jobs_sync_order after update of status on public.print_jobs
  for each row execute function public.sync_order_printed();

-- ------------------------------------------------------------------------------
-- 4. Comandas a la fila: una por estación, con solo sus platos
-- ------------------------------------------------------------------------------
create or replace function public.enqueue_order_print(p_order_id bigint, p_reprint boolean default false)
returns int language plpgsql security definer set search_path = public as $$
declare
  v_order  public.orders;
  v_tenant public.tenants;
  v_count  int := 0;
  r        record;
begin
  select * into v_order from public.orders where id = p_order_id;
  if not found then
    return 0;
  end if;
  select * into v_tenant from public.tenants where id = v_order.tenant_id;

  for r in
    select coalesce(c.print_station_id, d.id) as station_id,
           jsonb_agg(jsonb_build_object('quantity', i.quantity, 'name', i.name, 'options', to_jsonb(i.selected_options))
                     order by i.name) as items
      from public.order_items i
      left join public.products p on p.id = i.product_id
      left join public.categories c on c.id = p.category_id
      left join public.print_stations d on d.tenant_id = v_order.tenant_id and d.is_default
     where i.order_id = p_order_id
     group by 1
  loop
    continue when r.station_id is null; -- sin estación y sin estación por defecto: no se imprime
    insert into public.print_jobs (tenant_id, station_id, kind, order_id, payload)
    select v_order.tenant_id, s.id, 'comanda', v_order.id,
           jsonb_build_object(
             'restaurant', v_tenant.name, 'station', s.name, 'orderId', v_order.id,
             'tableLabel', v_order.table_label, 'createdAt', v_order.created_at,
             'notes', coalesce(v_order.notes, ''), 'reprint', p_reprint, 'items', r.items)
      from public.print_stations s where s.id = r.station_id;
    v_count := v_count + 1;
  end loop;
  return v_count;
end $$;

-- Al confirmar el pedido (create_order ya insertó sus platos): DEFERRABLE hace que el
-- disparador corra al final de la transacción, cuando order_items está completo.
create or replace function public.enqueue_new_order() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if exists (select 1 from public.tenants t where t.id = new.tenant_id and t.plan <> 'basic') then
    perform public.enqueue_order_print(new.id, false);
  end if;
  return null;
end $$;
create constraint trigger orders_enqueue_print after insert on public.orders
  deferrable initially deferred
  for each row execute function public.enqueue_new_order();

-- Reimprimir: vuelve a la fila (marcada REIMPRESIÓN) en todas sus estaciones.
create or replace function public.request_order_reprint(p_order_id bigint)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_staff public.staff_members;
begin
  v_staff := public.require_staff();
  if not exists (select 1 from public.orders where id = p_order_id and tenant_id = v_staff.tenant_id) then
    raise exception 'Pedido no encontrado' using errcode = 'P0002';
  end if;
  update public.orders set printed_at = null where id = p_order_id;
  if public.enqueue_order_print(p_order_id, true) = 0 then
    raise exception 'No hay estaciones de impresión configuradas' using errcode = 'P0001';
  end if;
end $$;

-- La marca de impresión ahora la lleva la fila: el reclamo por comanda ya no se usa.
drop function if exists public.claim_order_print(bigint);

-- Lo que ya figuraba impreso no vuelve a salir; lo abierto y sin imprimir de las
-- últimas 12 horas entra a la fila.
select public.enqueue_order_print(o.id, false)
  from public.orders o join public.tenants t on t.id = o.tenant_id
 where o.printed_at is null and t.plan <> 'basic'
   and o.status in ('Pendiente', 'En Preparación', 'Listo', 'Por Cobrar')
   and o.created_at > now() - interval '12 hours';

-- ------------------------------------------------------------------------------
-- 5. Tiquete de caja y comanda de prueba
-- ------------------------------------------------------------------------------
create or replace function public.enqueue_invoice_print(p_invoice_id uuid)
returns bigint language plpgsql security definer set search_path = public as $$
declare
  v_staff   public.staff_members;
  v_inv     public.invoices;
  v_tenant  public.tenants;
  v_station public.print_stations;
  v_id      bigint;
begin
  v_staff := public.require_staff(array['owner', 'admin', 'caja']);
  select * into v_inv from public.invoices where id = p_invoice_id and tenant_id = v_staff.tenant_id;
  if not found then
    raise exception 'Comprobante no encontrado' using errcode = 'P0002';
  end if;
  select * into v_station from public.print_stations where tenant_id = v_staff.tenant_id and prints_receipts;
  if not found then
    raise exception 'Elige en Administración qué estación imprime los tiquetes de caja' using errcode = 'P0001';
  end if;
  select * into v_tenant from public.tenants where id = v_staff.tenant_id;
  insert into public.print_jobs (tenant_id, station_id, kind, invoice_id, payload)
  values (v_staff.tenant_id, v_station.id, 'tiquete', v_inv.id, jsonb_build_object(
    'restaurant', v_tenant.name, 'nit', v_tenant.nit, 'address', concat_ws(', ', v_tenant.address, v_tenant.city),
    'phone', v_tenant.phone, 'footer', v_tenant.footer_text, 'station', v_station.name,
    'kind', v_inv.kind, 'number', v_inv.full_number, 'createdAt', v_inv.created_at,
    'tableLabel', v_inv.table_label, 'customer', v_inv.customer, 'paymentMethod', v_inv.payment_method,
    'items', v_inv.items, 'itemsTotal', v_inv.items_total, 'taxBase', v_inv.tax_base, 'tax', v_inv.tax,
    'taxType', v_inv.tax_type, 'taxRate', v_inv.tax_rate, 'tip', v_inv.tip, 'total', v_inv.total,
    'cufe', v_inv.cufe, 'dianStatus', v_inv.dian_status, 'issuedByName', v_inv.issued_by_name))
  returning id into v_id;
  return v_id;
end $$;

create or replace function public.enqueue_test_print(p_station_id uuid)
returns bigint language plpgsql security definer set search_path = public as $$
declare
  v_staff   public.staff_members;
  v_station public.print_stations;
  v_id      bigint;
begin
  v_staff := public.require_staff(array['owner', 'admin']);
  select * into v_station from public.print_stations where id = p_station_id and tenant_id = v_staff.tenant_id;
  if not found then
    raise exception 'Estación no encontrada' using errcode = 'P0002';
  end if;
  insert into public.print_jobs (tenant_id, station_id, kind, payload)
  values (v_staff.tenant_id, v_station.id, 'prueba', jsonb_build_object(
    'restaurant', (select name from public.tenants where id = v_staff.tenant_id),
    'station', v_station.name, 'requestedBy', v_staff.display_name, 'createdAt', now()))
  returning id into v_id;
  return v_id;
end $$;

-- ------------------------------------------------------------------------------
-- 6. Imprimir desde el navegador (respaldo, personal con sesión)
-- ------------------------------------------------------------------------------
create or replace function public.claim_print_jobs(p_station_ids uuid[] default null, p_limit int default 10)
returns setof public.print_jobs language plpgsql security definer set search_path = public as $$
declare
  v_staff public.staff_members;
begin
  v_staff := public.require_staff();
  return query select * from public.take_print_jobs(v_staff.tenant_id, p_station_ids, p_limit, null,
                                                    'Navegador de ' || v_staff.display_name);
end $$;

create or replace function public.report_print_job(p_job_id bigint, p_ok boolean, p_error text default null)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_staff public.staff_members;
begin
  v_staff := public.require_staff();
  perform public.finish_print_job(v_staff.tenant_id, p_job_id, p_ok, p_error);
end $$;

-- ------------------------------------------------------------------------------
-- 7. Administración de estaciones y equipos (dueño o administrador)
-- ------------------------------------------------------------------------------
create or replace function public.admin_save_print_station(
  p_id uuid, p_name text, p_is_default boolean default false, p_prints_receipts boolean default false
) returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_staff public.staff_members;
  v_id    uuid := p_id;
begin
  v_staff := public.require_staff(array['owner', 'admin']);
  if p_is_default then
    update public.print_stations set is_default = false where tenant_id = v_staff.tenant_id and is_default and id is distinct from p_id;
  end if;
  if p_prints_receipts then
    update public.print_stations set prints_receipts = false where tenant_id = v_staff.tenant_id and prints_receipts and id is distinct from p_id;
  end if;
  if p_id is null then
    insert into public.print_stations (tenant_id, name, is_default, prints_receipts, sort_order)
    values (v_staff.tenant_id, btrim(p_name), p_is_default, p_prints_receipts,
            (select coalesce(max(sort_order), 0) + 1 from public.print_stations where tenant_id = v_staff.tenant_id))
    returning id into v_id;
  else
    update public.print_stations
       set name = btrim(p_name), is_default = p_is_default, prints_receipts = p_prints_receipts
     where id = p_id and tenant_id = v_staff.tenant_id;
    if not found then
      raise exception 'Estación no encontrada' using errcode = 'P0002';
    end if;
  end if;
  return v_id;
exception when unique_violation then
  raise exception 'Ya existe una estación con ese nombre' using errcode = 'P0001';
end $$;

create or replace function public.admin_delete_print_station(p_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_staff public.staff_members;
begin
  v_staff := public.require_staff(array['owner', 'admin']);
  if (select count(*) from public.print_stations where tenant_id = v_staff.tenant_id) <= 1 then
    raise exception 'El restaurante necesita al menos una estación de impresión' using errcode = 'P0001';
  end if;
  delete from public.print_stations where id = p_id and tenant_id = v_staff.tenant_id;
  update public.print_devices set station_ids = array_remove(station_ids, p_id) where tenant_id = v_staff.tenant_id;
end $$;

-- Código de vinculación: 8 caracteres sin letras ni números que se confundan (0/O, 1/I/L).
create or replace function public.new_pairing_code() returns text
language plpgsql volatile set search_path = public, extensions as $$
declare
  v_alpha text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  v_bytes bytea := extensions.gen_random_bytes(8);
  v_code  text := '';
begin
  for i in 0..7 loop
    v_code := v_code || substr(v_alpha, (get_byte(v_bytes, i) % 31) + 1, 1);
    if i = 3 then v_code := v_code || '-'; end if;
  end loop;
  return v_code;
end $$;

create or replace function public.sha256_hex(p text) returns text
language sql immutable set search_path = public, extensions as $$
  select encode(extensions.digest(upper(btrim(p)), 'sha256'), 'hex');
$$;

create or replace function public.valid_station_ids(p_tenant uuid, p_ids uuid[]) returns uuid[]
language sql stable security definer set search_path = public as $$
  select coalesce(array_agg(id order by sort_order), '{}') from public.print_stations
   where tenant_id = p_tenant and id = any(coalesce(p_ids, '{}'));
$$;

-- Crea el equipo y devuelve el código de vinculación (vale 30 minutos, un solo uso).
create or replace function public.admin_create_print_device(p_name text, p_station_ids uuid[])
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_staff public.staff_members;
  v_code  text := public.new_pairing_code();
  v_dev   public.print_devices;
begin
  v_staff := public.require_staff(array['owner', 'admin']);
  if cardinality(public.valid_station_ids(v_staff.tenant_id, p_station_ids)) = 0 then
    raise exception 'Elige al menos una estación para este equipo' using errcode = 'P0001';
  end if;
  insert into public.print_devices (tenant_id, name, station_ids, pairing_code_hash, pairing_expires_at)
  values (v_staff.tenant_id, btrim(p_name), public.valid_station_ids(v_staff.tenant_id, p_station_ids),
          public.sha256_hex(v_code), now() + interval '30 minutes')
  returning * into v_dev;
  return jsonb_build_object('deviceId', v_dev.id, 'code', v_code, 'expiresAt', v_dev.pairing_expires_at);
end $$;

-- Nuevo código para el mismo equipo (por ejemplo, al reinstalar). Invalida el token anterior.
create or replace function public.admin_new_pairing_code(p_device_id uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_staff public.staff_members;
  v_code  text := public.new_pairing_code();
  v_exp   timestamptz := now() + interval '30 minutes';
begin
  v_staff := public.require_staff(array['owner', 'admin']);
  update public.print_devices
     set pairing_code_hash = public.sha256_hex(v_code), pairing_expires_at = v_exp,
         token_hash = null, paired_at = null, revoked_at = null
   where id = p_device_id and tenant_id = v_staff.tenant_id;
  if not found then
    raise exception 'Equipo no encontrado' using errcode = 'P0002';
  end if;
  return jsonb_build_object('deviceId', p_device_id, 'code', v_code, 'expiresAt', v_exp);
end $$;

create or replace function public.admin_update_print_device(p_device_id uuid, p_name text, p_station_ids uuid[])
returns void language plpgsql security definer set search_path = public as $$
declare
  v_staff public.staff_members;
begin
  v_staff := public.require_staff(array['owner', 'admin']);
  update public.print_devices
     set name = btrim(p_name), station_ids = public.valid_station_ids(v_staff.tenant_id, p_station_ids)
   where id = p_device_id and tenant_id = v_staff.tenant_id;
  if not found then
    raise exception 'Equipo no encontrado' using errcode = 'P0002';
  end if;
end $$;

create or replace function public.admin_revoke_print_device(p_device_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_staff public.staff_members;
begin
  v_staff := public.require_staff(array['owner', 'admin']);
  update public.print_devices
     set revoked_at = now(), token_hash = null, pairing_code_hash = null, pairing_expires_at = null
   where id = p_device_id and tenant_id = v_staff.tenant_id;
end $$;

-- ------------------------------------------------------------------------------
-- 8. Agente local (sin sesión: se identifica con su token, como la mesa con el suyo)
-- ------------------------------------------------------------------------------
create or replace function public.agent_device(p_token text) returns public.print_devices
language plpgsql stable security definer set search_path = public as $$
declare
  v_dev public.print_devices;
begin
  select * into v_dev from public.print_devices
   where token_hash = encode(extensions.digest(p_token, 'sha256'), 'hex') and revoked_at is null;
  if not found or p_token is null or length(p_token) < 32 then
    raise exception 'Equipo de impresión no vinculado o revocado' using errcode = '42501';
  end if;
  return v_dev;
end $$;

create or replace function public.agent_stations(v_dev public.print_devices) returns jsonb
language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(jsonb_build_object('id', s.id, 'name', s.name, 'printsReceipts', s.prints_receipts)
                            order by s.sort_order), '[]')
    from public.print_stations s where s.id = any(v_dev.station_ids);
$$;

-- Vincula el agente con el código del restaurante y el código de un solo uso.
create or replace function public.agent_pair(p_slug text, p_code text, p_version text default null)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare
  v_tenant public.tenants;
  v_dev    public.print_devices;
  v_token  text := encode(extensions.gen_random_bytes(32), 'hex');
begin
  select * into v_tenant from public.tenants where slug = lower(btrim(p_slug)) and is_active;
  if found then
    select * into v_dev from public.print_devices
     where tenant_id = v_tenant.id and pairing_code_hash = public.sha256_hex(p_code)
       and pairing_expires_at > now() and revoked_at is null
     for update;
  end if;
  if v_tenant.id is null or v_dev.id is null then
    raise exception 'Código de vinculación inválido o vencido. Genera uno nuevo en Administración.' using errcode = 'P0001';
  end if;
  update public.print_devices
     set token_hash = encode(extensions.digest(v_token, 'sha256'), 'hex'), pairing_code_hash = null,
         pairing_expires_at = null, paired_at = now(), last_seen_at = now(), agent_version = left(p_version, 40)
   where id = v_dev.id
  returning * into v_dev;
  return jsonb_build_object('deviceId', v_dev.id, 'deviceName', v_dev.name, 'token', v_token,
                            'restaurant', v_tenant.name, 'slug', v_tenant.slug, 'stations', public.agent_stations(v_dev));
end $$;

create or replace function public.agent_info(p_token text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_dev public.print_devices := public.agent_device(p_token);
begin
  return jsonb_build_object('deviceId', v_dev.id, 'deviceName', v_dev.name,
                            'restaurant', (select name from public.tenants where id = v_dev.tenant_id),
                            'stations', public.agent_stations(v_dev));
end $$;

create or replace function public.agent_pull_jobs(p_token text, p_limit int default 5, p_version text default null)
returns setof public.print_jobs language plpgsql security definer set search_path = public as $$
declare
  v_dev public.print_devices := public.agent_device(p_token);
begin
  update public.print_devices set last_seen_at = now(), agent_version = coalesce(left(p_version, 40), agent_version)
   where id = v_dev.id;
  return query select * from public.take_print_jobs(v_dev.tenant_id, v_dev.station_ids, p_limit, v_dev.id, v_dev.name);
end $$;

create or replace function public.agent_report_job(p_token text, p_job_id bigint, p_ok boolean, p_error text default null)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_dev public.print_devices := public.agent_device(p_token);
begin
  -- Solo puede reportar lo que este mismo equipo tomó.
  if not exists (select 1 from public.print_jobs where id = p_job_id and claimed_by_device = v_dev.id) then
    raise exception 'Trabajo no encontrado para este equipo' using errcode = 'P0002';
  end if;
  perform public.finish_print_job(v_dev.tenant_id, p_job_id, p_ok, p_error);
end $$;

-- ------------------------------------------------------------------------------
-- 9. Permisos, RLS y tiempo real
-- ------------------------------------------------------------------------------
revoke all on public.print_stations, public.print_devices, public.print_jobs from public, anon, authenticated;
grant select on public.print_stations to authenticated;
grant select (id, tenant_id, name, station_ids, pairing_expires_at, paired_at, last_seen_at, agent_version, revoked_at, created_at)
  on public.print_devices to authenticated;
grant select on public.print_jobs to authenticated;
grant update (print_station_id) on public.categories to authenticated;

alter table public.print_stations enable row level security;
alter table public.print_devices enable row level security;
alter table public.print_jobs enable row level security;
create policy print_stations_staff_read on public.print_stations for select using (public.has_staff_role(tenant_id));
create policy print_devices_admin_read on public.print_devices for select using (public.has_staff_role(tenant_id, array['owner', 'admin']));
create policy print_jobs_staff_read on public.print_jobs for select using (public.has_staff_role(tenant_id));

do $$
declare
  f text;
begin
  -- Internas: no se exponen
  foreach f in array array[
    'print_job_claimable(public.print_jobs)', 'take_print_jobs(uuid, uuid[], integer, uuid, text)',
    'finish_print_job(uuid, bigint, boolean, text)', 'enqueue_order_print(bigint, boolean)',
    'new_pairing_code()', 'sha256_hex(text)', 'valid_station_ids(uuid, uuid[])',
    'agent_device(text)', 'agent_stations(public.print_devices)', 'init_print_station()',
    'sync_order_printed()', 'enqueue_new_order()'
  ] loop
    execute format('revoke execute on function public.%s from public, anon, authenticated', f);
  end loop;
  -- Personal con sesión
  foreach f in array array[
    'request_order_reprint(bigint)', 'enqueue_invoice_print(uuid)', 'enqueue_test_print(uuid)',
    'claim_print_jobs(uuid[], integer)', 'report_print_job(bigint, boolean, text)',
    'admin_save_print_station(uuid, text, boolean, boolean)', 'admin_delete_print_station(uuid)',
    'admin_create_print_device(text, uuid[])', 'admin_new_pairing_code(uuid)',
    'admin_update_print_device(uuid, text, uuid[])', 'admin_revoke_print_device(uuid)'
  ] loop
    execute format('revoke execute on function public.%s from public, anon, authenticated', f);
    execute format('grant execute on function public.%s to authenticated', f);
  end loop;
  -- Agente local (anon + token propio)
  foreach f in array array[
    'agent_pair(text, text, text)', 'agent_info(text)', 'agent_pull_jobs(text, integer, text)',
    'agent_report_job(text, bigint, boolean, text)'
  ] loop
    execute format('revoke execute on function public.%s from public, anon, authenticated', f);
    execute format('grant execute on function public.%s to anon, authenticated', f);
  end loop;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.print_jobs;
exception when duplicate_object then null;
end $$;

notify pgrst, 'reload schema';
