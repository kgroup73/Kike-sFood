-- ==============================================================================
-- KIKE'S FOOD — ESQUEMA MULTI-TENANT (SUPABASE / POSTGRESQL)
-- ==============================================================================
-- Principios:
--   * El navegador NUNCA decide precios, totales, plan ni numeración: todo eso
--     se calcula aquí, en funciones SECURITY DEFINER.
--   * El comensal (rol anon) solo puede: leer la carta pública, resolver su mesa
--     con el token del QR/NFC y crear pedidos con create_order().
--   * El personal entra con PIN (Edge Function staff-login) y obtiene una sesión
--     de Supabase Auth; las políticas RLS filtran por restaurante y por rol.
-- ==============================================================================

create extension if not exists pgcrypto with schema extensions;

-- El prototipo anterior (supabase/schema.sql) no tenía datos reales: se elimina.
drop table if exists waiter_calls, stock_events, order_items, orders, ingredients_stock,
  products, categories, restaurant_tables, tenants cascade;

-- ------------------------------------------------------------------------------
-- Utilidades
-- ------------------------------------------------------------------------------
create or replace function public.touch_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

create or replace function public.normalize_ingredient(p text) returns text
language sql immutable as $$ select lower(btrim(coalesce(p, ''))) $$;

-- ------------------------------------------------------------------------------
-- 1. Restaurantes (tenants)
-- ------------------------------------------------------------------------------
create table public.tenants (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and length(slug) between 3 and 60),
  name        text not null check (length(btrim(name)) > 0),
  nit         text,
  address     text,
  city        text,
  phone       text,
  email       text,
  plan        text not null default 'basic' check (plan in ('basic', 'intermedio', 'premium')),
  tax_type    text not null default 'INC' check (tax_type in ('INC', 'IVA', 'NINGUNO')),
  tax_rate    numeric(5,2) not null default 8 check (tax_rate between 0 and 100),
  tip_rate    numeric(5,2) not null default 10 check (tip_rate between 0 and 30),
  footer_text text,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create trigger tenants_touch before update on public.tenants
  for each row execute function public.touch_updated_at();

-- ------------------------------------------------------------------------------
-- 2. Personal (staff) con PIN por usuario
-- ------------------------------------------------------------------------------
create table public.staff_members (
  id              uuid primary key default gen_random_uuid(),
  tenant_id       uuid not null references public.tenants(id) on delete cascade,
  user_id         uuid unique references auth.users(id) on delete set null,
  display_name    text not null check (length(btrim(display_name)) between 1 and 60),
  role            text not null check (role in ('owner', 'admin', 'cocina', 'caja', 'mesero')),
  pin_hash        text not null,
  failed_attempts int not null default 0,
  locked_until    timestamptz,
  is_active       boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (tenant_id, display_name)
);
create index staff_members_tenant_idx on public.staff_members(tenant_id);
create trigger staff_members_touch before update on public.staff_members
  for each row execute function public.touch_updated_at();

-- ¿El usuario autenticado es personal activo de este restaurante (con alguno de estos roles)?
create or replace function public.has_staff_role(p_tenant uuid, p_roles text[] default null)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.staff_members s
    where s.user_id = auth.uid()
      and s.is_active
      and s.tenant_id = p_tenant
      and (p_roles is null or s.role = any(p_roles))
  );
$$;

-- Fila del personal autenticado (o error si no lo es / no tiene el rol).
create or replace function public.require_staff(p_roles text[] default null)
returns public.staff_members language plpgsql stable security definer set search_path = public as $$
declare
  v public.staff_members;
begin
  select * into v from public.staff_members
  where user_id = auth.uid() and is_active;
  if not found then
    raise exception 'Sesión de personal no válida' using errcode = '42501';
  end if;
  if p_roles is not null and not (v.role = any(p_roles)) then
    raise exception 'Tu rol (%) no tiene permiso para esta acción', v.role using errcode = '42501';
  end if;
  return v;
end $$;

-- ------------------------------------------------------------------------------
-- 3. Mesas (token secreto para QR / NFC)
-- ------------------------------------------------------------------------------
create table public.restaurant_tables (
  id         uuid primary key default gen_random_uuid(),
  tenant_id  uuid not null references public.tenants(id) on delete cascade,
  label      text not null check (length(btrim(label)) between 1 and 20),
  token      text not null unique default encode(extensions.gen_random_bytes(16), 'hex'),
  is_active  boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  unique (tenant_id, label)
);

-- ------------------------------------------------------------------------------
-- 4. Carta: categorías y platillos
-- ------------------------------------------------------------------------------
create table public.categories (
  id         uuid primary key default gen_random_uuid(),
  tenant_id  uuid not null references public.tenants(id) on delete cascade,
  name       text not null check (length(btrim(name)) between 1 and 60),
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  unique (tenant_id, name)
);

create table public.products (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references public.tenants(id) on delete cascade,
  category_id uuid references public.categories(id) on delete set null,
  name        text not null check (length(btrim(name)) between 1 and 120),
  description text not null default '',
  price       integer not null check (price >= 0),          -- COP con impuesto incluido
  image       text,
  is_chef     boolean not null default false,
  is_veg      boolean not null default false,
  is_gf       boolean not null default false,
  is_popular  boolean not null default false,
  available   boolean not null default true,
  ingredients text[] not null default '{}',
  -- [{ "title": "Término", "required": true, "options": [{ "name": "Medio", "price": 0 }] }]
  modifiers   jsonb not null default '[]' check (jsonb_typeof(modifiers) = 'array'),
  -- { "productId": "<uuid>", "description": "..." }
  pairing     jsonb check (pairing is null or jsonb_typeof(pairing) = 'object'),
  -- Datos de presentación: rating, reviewsCount, prepTime, spicyLevel, calories, chefNotes
  details     jsonb not null default '{}' check (jsonb_typeof(details) = 'object'),
  sort_order  int not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index products_tenant_idx on public.products(tenant_id);
create trigger products_touch before update on public.products
  for each row execute function public.touch_updated_at();

-- ------------------------------------------------------------------------------
-- 5. Inventario de materias primas (agotados) e historial
-- ------------------------------------------------------------------------------
create table public.ingredients_stock (
  tenant_id      uuid not null references public.tenants(id) on delete cascade,
  ingredient_key text not null,
  name           text not null,
  is_sold_out    boolean not null default false,
  note           text,
  reported_by    text,
  updated_at     timestamptz not null default now(),
  primary key (tenant_id, ingredient_key)
);

create table public.stock_events (
  id                uuid primary key default gen_random_uuid(),
  tenant_id         uuid not null references public.tenants(id) on delete cascade,
  type              text not null check (type in ('AGOTADO', 'REPUESTO')),
  ingredient        text not null,
  affected_products text[] not null default '{}',
  note              text,
  reported_by       text,
  created_at        timestamptz not null default now()
);
create index stock_events_tenant_idx on public.stock_events(tenant_id, created_at desc);

-- ------------------------------------------------------------------------------
-- 6. Pedidos (comandas)
-- ------------------------------------------------------------------------------
create table public.orders (
  id          bigint generated always as identity primary key,
  tenant_id   uuid not null references public.tenants(id) on delete cascade,
  table_id    uuid references public.restaurant_tables(id) on delete set null,
  table_label text not null,
  status      text not null default 'Pendiente'
              check (status in ('Pendiente', 'En Preparación', 'Listo', 'Por Cobrar', 'Cobrado', 'Cancelado')),
  subtotal    integer not null check (subtotal >= 0),   -- suma de ítems (impuesto incluido)
  tip         integer not null default 0 check (tip >= 0),
  total       integer not null check (total >= 0),
  notes       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  paid_at     timestamptz
);
create index orders_tenant_status_idx on public.orders(tenant_id, status);
create index orders_table_recent_idx on public.orders(table_id, created_at desc);
create trigger orders_touch before update on public.orders
  for each row execute function public.touch_updated_at();

create table public.order_items (
  id               uuid primary key default gen_random_uuid(),
  order_id         bigint not null references public.orders(id) on delete cascade,
  tenant_id        uuid not null references public.tenants(id) on delete cascade,
  product_id       uuid references public.products(id) on delete set null,
  name             text not null,
  quantity         int not null check (quantity between 1 and 50),
  unit_price       integer not null check (unit_price >= 0),
  total_price      integer not null check (total_price >= 0),
  selected_options text[] not null default '{}'
);
create index order_items_order_idx on public.order_items(order_id);

-- Flujo permitido: Pendiente → En Preparación → Listo → Por Cobrar → Cobrado
-- (Cancelado desde cualquier estado no final). "Cobrado" solo lo pone issue_invoice().
create or replace function public.enforce_order_status() returns trigger
language plpgsql as $$
begin
  if new.status = old.status then
    return new;
  end if;
  if not (
       (old.status = 'Pendiente'      and new.status in ('En Preparación', 'Cancelado'))
    or (old.status = 'En Preparación' and new.status in ('Listo', 'Cancelado'))
    or (old.status = 'Listo'          and new.status in ('Por Cobrar', 'Cancelado'))
    or (old.status = 'Por Cobrar'     and new.status in ('Cobrado', 'Cancelado'))
  ) then
    raise exception 'Transición de estado no permitida: % → %', old.status, new.status
      using errcode = 'P0001';
  end if;
  if new.status = 'Cobrado' then
    if coalesce(current_setting('kikes.issuing_invoice', true), '') <> 'on' then
      raise exception 'Un pedido solo pasa a Cobrado al emitir su comprobante' using errcode = 'P0001';
    end if;
    new.paid_at := now();
  end if;
  return new;
end $$;
create trigger orders_status_guard before update of status on public.orders
  for each row execute function public.enforce_order_status();

-- ------------------------------------------------------------------------------
-- 7. Facturación: clientes, numeración, comprobantes y cierres de caja
-- ------------------------------------------------------------------------------
create table public.customers (
  id         uuid primary key default gen_random_uuid(),
  tenant_id  uuid not null references public.tenants(id) on delete cascade,
  name       text not null check (length(btrim(name)) between 1 and 120),
  doc_type   text not null default 'CC' check (doc_type in ('CC', 'NIT', 'CE', 'PP', 'TI', 'NUIP')),
  doc_number text not null check (length(btrim(doc_number)) between 3 and 20),
  email      text,
  phone      text,
  created_at timestamptz not null default now(),
  unique (tenant_id, doc_type, doc_number)
);

-- Configuración de facturación. Las credenciales del proveedor (Factus / Siigo) y la
-- clave técnica NO se guardan aquí: van como secretos de Edge Functions / Vault.
create table public.billing_settings (
  tenant_id   uuid primary key references public.tenants(id) on delete cascade,
  provider    text not null default 'simulado' check (provider in ('simulado', 'factus', 'siigo')),
  environment text not null default 'habilitacion' check (environment in ('habilitacion', 'produccion')),
  updated_at  timestamptz not null default now()
);
create trigger billing_settings_touch before update on public.billing_settings
  for each row execute function public.touch_updated_at();

create table public.invoice_sequences (
  tenant_id         uuid not null references public.tenants(id) on delete cascade,
  kind              text not null check (kind in ('pos', 'electronica')),
  prefix            text not null check (prefix ~ '^[A-Z0-9]{1,6}$'),
  next_number       integer not null default 1 check (next_number >= 1),
  range_from        integer not null default 1 check (range_from >= 1),
  range_to          integer check (range_to is null or range_to >= range_from),
  resolution_number text,
  resolution_date   date,
  valid_until       date,
  primary key (tenant_id, kind)
);

-- next_number nunca puede quedar por debajo del rango autorizado.
create or replace function public.clamp_invoice_sequence() returns trigger
language plpgsql as $$
begin
  if new.next_number < new.range_from then
    new.next_number := new.range_from;
  end if;
  return new;
end $$;
create trigger invoice_sequences_clamp before insert or update on public.invoice_sequences
  for each row execute function public.clamp_invoice_sequence();

create table public.daily_closes (
  id             uuid primary key default gen_random_uuid(),
  tenant_id      uuid not null references public.tenants(id) on delete cascade,
  code           text not null,
  closed_by      uuid references public.staff_members(id) on delete set null,
  closed_by_name text,
  period_start   timestamptz,
  period_end     timestamptz not null default now(),
  invoice_count  int not null default 0,
  total_sales    integer not null default 0,
  cash_sales     integer not null default 0,
  card_sales     integer not null default 0,
  transfer_sales integer not null default 0,
  tips           integer not null default 0,
  counted_cash   integer not null default 0,
  difference     integer not null default 0,
  created_at     timestamptz not null default now(),
  unique (tenant_id, code)
);

create table public.invoices (
  id             uuid primary key default gen_random_uuid(),
  tenant_id      uuid not null references public.tenants(id) on delete cascade,
  order_id       bigint unique references public.orders(id) on delete restrict,
  daily_close_id uuid references public.daily_closes(id) on delete set null,
  kind           text not null check (kind in ('pos', 'electronica')),
  prefix         text not null,
  number         integer not null,
  full_number    text generated always as (prefix || '-' || number::text) stored,
  customer       jsonb not null,
  payment_method text not null check (payment_method in ('efectivo', 'tarjeta', 'transferencia')),
  table_label    text,
  items          jsonb not null default '[]',
  items_total    integer not null,   -- precio de carta (impuesto incluido)
  tax_base       integer not null,   -- base gravable
  tax            integer not null,
  tax_type       text not null,
  tax_rate       numeric(5,2) not null,
  tip            integer not null default 0,
  total          integer not null,   -- items_total + tip
  cufe           text,
  dian_status    text not null check (dian_status in ('no_aplica', 'simulado', 'pendiente', 'aceptada', 'rechazada')),
  issued_by      uuid references public.staff_members(id) on delete set null,
  issued_by_name text,
  created_at     timestamptz not null default now(),
  unique (tenant_id, kind, prefix, number)
);
create index invoices_open_idx on public.invoices(tenant_id) where daily_close_id is null;

-- ------------------------------------------------------------------------------
-- 8. Funciones (RPC) públicas para el comensal
-- ------------------------------------------------------------------------------

-- Valida el token del QR/NFC y devuelve la mesa.
create or replace function public.resolve_table(p_slug text, p_token text)
returns table (table_id uuid, label text)
language sql stable security definer set search_path = public as $$
  select rt.id, rt.label
  from public.restaurant_tables rt
  join public.tenants t on t.id = rt.tenant_id
  where t.slug = p_slug and t.is_active and rt.token = p_token and rt.is_active;
$$;

-- Personal visible en la pantalla de login (sin datos sensibles).
create or replace function public.list_staff_for_login(p_slug text)
returns table (id uuid, display_name text, role text)
language sql stable security definer set search_path = public as $$
  select s.id, s.display_name, s.role
  from public.staff_members s
  join public.tenants t on t.id = s.tenant_id
  where t.slug = p_slug and t.is_active and s.is_active
  order by case s.role when 'owner' then 0 when 'admin' then 1 else 2 end, s.display_name;
$$;

-- Crea un pedido calculando precios desde el catálogo. El cliente solo envía:
--   p_items = [{ "productId": "<uuid>", "quantity": 2, "selections": { "Término": "Medio" } }]
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
  select * into v_tenant from public.tenants where slug = p_slug and is_active;
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

-- ------------------------------------------------------------------------------
-- 9. Funciones (RPC) para el personal
-- ------------------------------------------------------------------------------

-- Datos de la sesión actual del personal (sin PIN).
create or replace function public.whoami()
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare
  v public.staff_members;
  v_slug text;
begin
  v := public.require_staff();
  select slug into v_slug from public.tenants where id = v.tenant_id;
  return jsonb_build_object(
    'id', v.id, 'tenantId', v.tenant_id, 'tenantSlug', v_slug,
    'displayName', v.display_name, 'role', v.role
  );
end $$;

-- Agotar / reponer una materia prima (cocina o administración).
create or replace function public.set_ingredient_stock(p_name text, p_sold_out boolean, p_note text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_staff    public.staff_members;
  v_key      text := public.normalize_ingredient(p_name);
  v_current  boolean;
  v_affected text[];
begin
  v_staff := public.require_staff(array['owner', 'admin', 'cocina']);
  if v_key = '' then
    raise exception 'Ingrediente inválido' using errcode = 'P0001';
  end if;

  select is_sold_out into v_current from public.ingredients_stock
  where tenant_id = v_staff.tenant_id and ingredient_key = v_key;
  if coalesce(v_current, false) = p_sold_out then
    return jsonb_build_object('changed', false);
  end if;

  select coalesce(array_agg(p.name order by p.name), '{}') into v_affected
  from public.products p
  where p.tenant_id = v_staff.tenant_id
    and exists (select 1 from unnest(p.ingredients) i where public.normalize_ingredient(i) = v_key);

  insert into public.ingredients_stock (tenant_id, ingredient_key, name, is_sold_out, note, reported_by, updated_at)
  values (v_staff.tenant_id, v_key, btrim(p_name), p_sold_out, nullif(btrim(coalesce(p_note, '')), ''), v_staff.display_name, now())
  on conflict (tenant_id, ingredient_key) do update
    set is_sold_out = excluded.is_sold_out, note = excluded.note, name = excluded.name,
        reported_by = excluded.reported_by, updated_at = now();

  insert into public.stock_events (tenant_id, type, ingredient, affected_products, note, reported_by)
  values (v_staff.tenant_id, case when p_sold_out then 'AGOTADO' else 'REPUESTO' end,
          btrim(p_name), v_affected, nullif(btrim(coalesce(p_note, '')), ''), v_staff.display_name);

  return jsonb_build_object('changed', true, 'affectedProducts', to_jsonb(v_affected));
end $$;

-- Emite el comprobante de un pedido "Por Cobrar" y lo marca "Cobrado" (atómico).
create or replace function public.issue_invoice(
  p_order_id bigint,
  p_kind text,
  p_customer_id uuid default null,
  p_payment_method text default 'efectivo'
) returns public.invoices
language plpgsql security definer set search_path = public, extensions as $$
declare
  v_staff    public.staff_members;
  v_tenant   public.tenants;
  v_order    public.orders;
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

  select * into v_order from public.orders
  where id = p_order_id and tenant_id = v_staff.tenant_id
  for update;
  if not found then
    raise exception 'Pedido no encontrado' using errcode = 'P0002';
  end if;
  if v_order.status <> 'Por Cobrar' then
    raise exception 'El pedido #% no está listo para cobrar (estado: %)', v_order.id, v_order.status using errcode = 'P0001';
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
  v_base := round(v_order.subtotal / (1 + v_rate / 100.0))::int;
  v_tax  := v_order.subtotal - v_base;

  select coalesce(jsonb_agg(jsonb_build_object(
           'name', oi.name, 'quantity', oi.quantity, 'unitPrice', oi.unit_price,
           'totalPrice', oi.total_price, 'selectedOptions', to_jsonb(oi.selected_options)
         ) order by oi.name), '[]'::jsonb)
    into v_items
  from public.order_items oi where oi.order_id = v_order.id;

  v_number := v_seq.next_number;
  update public.invoice_sequences set next_number = next_number + 1
  where tenant_id = v_seq.tenant_id and kind = v_seq.kind;

  if p_kind = 'electronica' then
    -- SIMULADO: el CUFE real lo devuelve el proveedor tecnológico (Factus / Siigo).
    v_cufe := encode(extensions.digest(concat_ws('|', v_seq.prefix || v_number, now()::text, v_order.subtotal,
                     v_tenant.nit, v_customer->>'docNumber', 'SIMULADO'), 'sha384'), 'hex');
  end if;

  insert into public.invoices (
    tenant_id, order_id, kind, prefix, number, customer, payment_method, table_label, items,
    items_total, tax_base, tax, tax_type, tax_rate, tip, total, cufe, dian_status,
    issued_by, issued_by_name
  ) values (
    v_staff.tenant_id, v_order.id, p_kind, v_seq.prefix, v_number, v_customer, p_payment_method,
    v_order.table_label, v_items, v_order.subtotal, v_base, v_tax, v_tenant.tax_type, v_rate,
    v_order.tip, v_order.subtotal + v_order.tip, v_cufe,
    case when p_kind = 'electronica' then 'simulado' else 'no_aplica' end,
    v_staff.id, v_staff.display_name
  ) returning * into v_invoice;

  perform set_config('kikes.issuing_invoice', 'on', true);
  update public.orders set status = 'Cobrado' where id = v_order.id;
  perform set_config('kikes.issuing_invoice', 'off', true);

  return v_invoice;
end $$;

-- Cierre de caja (Reporte Z) de todos los comprobantes aún no cerrados.
create or replace function public.close_cash_register(p_counted_cash integer)
returns public.daily_closes
language plpgsql security definer set search_path = public as $$
declare
  v_staff  public.staff_members;
  v_close  public.daily_closes;
  v_day    text := to_char(now() at time zone 'America/Bogota', 'YYYYMMDD');
  v_seq    int;
  v_prev   timestamptz;
  v_cash   int;
begin
  v_staff := public.require_staff(array['owner', 'admin', 'caja']);
  if p_counted_cash is null or p_counted_cash < 0 then
    raise exception 'Ingresa el efectivo contado en caja' using errcode = 'P0001';
  end if;

  -- Serializa los cierres del mismo restaurante.
  perform 1 from public.tenants where id = v_staff.tenant_id for update;

  select count(*) + 1 into v_seq from public.daily_closes
  where tenant_id = v_staff.tenant_id and code like 'Z-' || v_day || '-%';
  select max(period_end) into v_prev from public.daily_closes where tenant_id = v_staff.tenant_id;

  select coalesce(sum(total) filter (where payment_method = 'efectivo'), 0)::int into v_cash
  from public.invoices where tenant_id = v_staff.tenant_id and daily_close_id is null;

  insert into public.daily_closes (
    tenant_id, code, closed_by, closed_by_name, period_start, period_end, invoice_count,
    total_sales, cash_sales, card_sales, transfer_sales, tips, counted_cash, difference
  )
  select v_staff.tenant_id, 'Z-' || v_day || '-' || lpad(v_seq::text, 2, '0'), v_staff.id, v_staff.display_name,
         coalesce(v_prev, min(i.created_at)), now(), count(*),
         coalesce(sum(i.total), 0),
         v_cash,
         coalesce(sum(i.total) filter (where i.payment_method = 'tarjeta'), 0),
         coalesce(sum(i.total) filter (where i.payment_method = 'transferencia'), 0),
         coalesce(sum(i.tip), 0),
         p_counted_cash,
         p_counted_cash - v_cash
  from public.invoices i
  where i.tenant_id = v_staff.tenant_id and i.daily_close_id is null
  returning * into v_close;

  update public.invoices set daily_close_id = v_close.id
  where tenant_id = v_staff.tenant_id and daily_close_id is null;

  return v_close;
end $$;

-- Genera un token nuevo para una mesa (invalida el QR/NFC anterior).
create or replace function public.regenerate_table_token(p_table_id uuid)
returns text language plpgsql security definer set search_path = public, extensions as $$
declare
  v_staff public.staff_members;
  v_token text := encode(extensions.gen_random_bytes(16), 'hex');
begin
  v_staff := public.require_staff(array['owner', 'admin']);
  update public.restaurant_tables set token = v_token
  where id = p_table_id and tenant_id = v_staff.tenant_id;
  if not found then
    raise exception 'Mesa no encontrada' using errcode = 'P0002';
  end if;
  return v_token;
end $$;

-- ------------------------------------------------------------------------------
-- 10. Gestión de personal y PIN (hash bcrypt, bloqueo tras intentos fallidos)
-- ------------------------------------------------------------------------------
create or replace function public.hash_pin(p_pin text) returns text
language plpgsql security definer set search_path = public, extensions as $$
begin
  if p_pin is null or p_pin !~ '^[0-9]{4,6}$' then
    raise exception 'El PIN debe tener entre 4 y 6 dígitos' using errcode = 'P0001';
  end if;
  return extensions.crypt(p_pin, extensions.gen_salt('bf', 10));
end $$;

-- Alta inicial del dueño (ejecutar desde el SQL Editor o con service_role).
create or replace function public.create_staff_member(p_slug text, p_display_name text, p_role text, p_pin text)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_tenant uuid;
  v_id     uuid;
begin
  select id into v_tenant from public.tenants where slug = p_slug;
  if v_tenant is null then
    raise exception 'Restaurante % no existe', p_slug using errcode = 'P0002';
  end if;
  insert into public.staff_members (tenant_id, display_name, role, pin_hash)
  values (v_tenant, btrim(p_display_name), p_role, public.hash_pin(p_pin))
  returning id into v_id;
  return v_id;
end $$;

-- Alta de personal desde el panel (owner/admin). Solo el owner crea admins/owners.
create or replace function public.admin_create_staff(p_display_name text, p_role text, p_pin text)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_me public.staff_members;
  v_id uuid;
begin
  v_me := public.require_staff(array['owner', 'admin']);
  if p_role in ('owner', 'admin') and v_me.role <> 'owner' then
    raise exception 'Solo el dueño puede crear administradores' using errcode = '42501';
  end if;
  insert into public.staff_members (tenant_id, display_name, role, pin_hash)
  values (v_me.tenant_id, btrim(p_display_name), p_role, public.hash_pin(p_pin))
  returning id into v_id;
  return v_id;
end $$;

create or replace function public.admin_update_staff(
  p_staff_id uuid,
  p_pin text default null,
  p_is_active boolean default null,
  p_role text default null
) returns void language plpgsql security definer set search_path = public as $$
declare
  v_me     public.staff_members;
  v_target public.staff_members;
begin
  v_me := public.require_staff(array['owner', 'admin']);
  select * into v_target from public.staff_members where id = p_staff_id and tenant_id = v_me.tenant_id;
  if not found then
    raise exception 'Usuario no encontrado' using errcode = 'P0002';
  end if;
  if v_me.role <> 'owner' and (v_target.role in ('owner', 'admin') or p_role in ('owner', 'admin')) then
    raise exception 'Solo el dueño puede modificar administradores' using errcode = '42501';
  end if;
  if v_target.id = v_me.id and (p_is_active = false or (p_role is not null and p_role <> v_me.role)) then
    raise exception 'No puedes desactivarte ni cambiar tu propio rol' using errcode = 'P0001';
  end if;
  update public.staff_members set
    pin_hash        = case when p_pin is not null then public.hash_pin(p_pin) else pin_hash end,
    failed_attempts = case when p_pin is not null then 0 else failed_attempts end,
    locked_until    = case when p_pin is not null then null else locked_until end,
    is_active       = coalesce(p_is_active, is_active),
    role            = coalesce(p_role, role)
  where id = v_target.id;
end $$;

-- Verificación del PIN (solo la usa la Edge Function staff-login con service_role).
create or replace function public.verify_staff_pin(p_slug text, p_staff_id uuid, p_pin text)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare
  v public.staff_members;
begin
  select s.* into v from public.staff_members s
  join public.tenants t on t.id = s.tenant_id
  where s.id = p_staff_id and t.slug = p_slug and t.is_active
  for update of s;
  if not found or not v.is_active then
    return jsonb_build_object('ok', false, 'reason', 'invalid');
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

-- Vincula el usuario de Supabase Auth creado por staff-login (service_role).
create or replace function public.link_staff_user(p_staff_id uuid, p_user_id uuid)
returns void language sql security definer set search_path = public as $$
  update public.staff_members set user_id = p_user_id where id = p_staff_id;
$$;

-- Al crear un restaurante: configuración de facturación y numeración POS por defecto.
create or replace function public.init_tenant_defaults() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.billing_settings (tenant_id) values (new.id) on conflict do nothing;
  insert into public.invoice_sequences (tenant_id, kind, prefix, next_number, range_from)
  values (new.id, 'pos', 'POS', 1, 1) on conflict do nothing;
  return new;
end $$;
create trigger tenants_init_defaults after insert on public.tenants
  for each row execute function public.init_tenant_defaults();

-- ------------------------------------------------------------------------------
-- 11. Permisos (GRANT) — mínimo privilegio
-- ------------------------------------------------------------------------------
revoke all on all tables in schema public from anon, authenticated;
revoke execute on all functions in schema public from public, anon, authenticated;
-- Lo que se cree en migraciones futuras tampoco queda expuesto por defecto:
-- cada tabla/función nueva debe otorgar sus permisos explícitamente.
alter default privileges for role postgres in schema public revoke all on tables from anon, authenticated;
alter default privileges for role postgres in schema public revoke execute on functions from public, anon, authenticated;

-- Lectura pública de la carta
grant select on public.tenants, public.categories, public.products, public.ingredients_stock to anon, authenticated;

-- Personal autenticado
grant select (id, tenant_id, user_id, display_name, role, is_active, failed_attempts, locked_until, created_at)
  on public.staff_members to authenticated;
grant update (name, nit, address, city, phone, email, tax_type, tax_rate, tip_rate, footer_text)
  on public.tenants to authenticated;
grant select, insert, delete on public.restaurant_tables to authenticated;
grant update (label, is_active, sort_order) on public.restaurant_tables to authenticated;
grant insert, update, delete on public.categories, public.products to authenticated;
grant select on public.stock_events, public.orders, public.order_items, public.invoices,
  public.daily_closes, public.billing_settings, public.invoice_sequences to authenticated;
grant update (status, notes) on public.orders to authenticated;
grant select, insert, update on public.customers to authenticated;
grant update (provider, environment) on public.billing_settings to authenticated;
grant insert on public.invoice_sequences to authenticated;
grant update (prefix, next_number, range_from, range_to, resolution_number, resolution_date, valid_until)
  on public.invoice_sequences to authenticated;

-- Funciones expuestas
grant execute on function public.resolve_table(text, text) to anon, authenticated;
grant execute on function public.list_staff_for_login(text) to anon, authenticated;
grant execute on function public.create_order(text, text, jsonb, boolean) to anon, authenticated;
grant execute on function public.normalize_ingredient(text) to anon, authenticated;
grant execute on function public.has_staff_role(uuid, text[]) to anon, authenticated;
grant execute on function public.whoami() to authenticated;
grant execute on function public.set_ingredient_stock(text, boolean, text) to authenticated;
grant execute on function public.issue_invoice(bigint, text, uuid, text) to authenticated;
grant execute on function public.close_cash_register(integer) to authenticated;
grant execute on function public.regenerate_table_token(uuid) to authenticated;
grant execute on function public.admin_create_staff(text, text, text) to authenticated;
grant execute on function public.admin_update_staff(uuid, text, boolean, text) to authenticated;
-- Solo service_role (Edge Functions / SQL Editor)
grant execute on function public.verify_staff_pin(text, uuid, text) to service_role;
grant execute on function public.link_staff_user(uuid, uuid) to service_role;
grant execute on function public.create_staff_member(text, text, text, text) to service_role;

-- ------------------------------------------------------------------------------
-- 12. Row Level Security
-- ------------------------------------------------------------------------------
alter table public.tenants            enable row level security;
alter table public.staff_members      enable row level security;
alter table public.restaurant_tables  enable row level security;
alter table public.categories         enable row level security;
alter table public.products           enable row level security;
alter table public.ingredients_stock  enable row level security;
alter table public.stock_events       enable row level security;
alter table public.orders             enable row level security;
alter table public.order_items        enable row level security;
alter table public.customers          enable row level security;
alter table public.billing_settings   enable row level security;
alter table public.invoice_sequences  enable row level security;
alter table public.daily_closes       enable row level security;
alter table public.invoices           enable row level security;

-- Carta pública
create policy tenants_public_read on public.tenants for select using (is_active);
create policy tenants_admin_update on public.tenants for update
  using (public.has_staff_role(id, array['owner', 'admin']))
  with check (public.has_staff_role(id, array['owner', 'admin']));

create policy categories_public_read on public.categories for select
  using (exists (select 1 from public.tenants t where t.id = tenant_id and t.is_active));
create policy categories_admin_write on public.categories for all
  using (public.has_staff_role(tenant_id, array['owner', 'admin']))
  with check (public.has_staff_role(tenant_id, array['owner', 'admin']));

create policy products_public_read on public.products for select
  using ((available and exists (select 1 from public.tenants t where t.id = tenant_id and t.is_active))
         or public.has_staff_role(tenant_id));
create policy products_admin_write on public.products for all
  using (public.has_staff_role(tenant_id, array['owner', 'admin']))
  with check (public.has_staff_role(tenant_id, array['owner', 'admin']));

create policy ingredients_public_read on public.ingredients_stock for select using (true);

-- Solo personal del mismo restaurante
create policy staff_same_tenant_read on public.staff_members for select
  using (public.has_staff_role(tenant_id));

create policy tables_staff_read on public.restaurant_tables for select
  using (public.has_staff_role(tenant_id));
create policy tables_admin_write on public.restaurant_tables for all
  using (public.has_staff_role(tenant_id, array['owner', 'admin']))
  with check (public.has_staff_role(tenant_id, array['owner', 'admin']));

create policy stock_events_staff_read on public.stock_events for select
  using (public.has_staff_role(tenant_id));

create policy orders_staff_read on public.orders for select
  using (public.has_staff_role(tenant_id));
create policy orders_staff_update on public.orders for update
  using (public.has_staff_role(tenant_id))
  with check (public.has_staff_role(tenant_id));
create policy order_items_staff_read on public.order_items for select
  using (public.has_staff_role(tenant_id));

create policy customers_cashier_all on public.customers for all
  using (public.has_staff_role(tenant_id, array['owner', 'admin', 'caja']))
  with check (public.has_staff_role(tenant_id, array['owner', 'admin', 'caja']));

create policy billing_settings_read on public.billing_settings for select
  using (public.has_staff_role(tenant_id, array['owner', 'admin', 'caja']));
create policy billing_settings_admin_update on public.billing_settings for update
  using (public.has_staff_role(tenant_id, array['owner', 'admin']))
  with check (public.has_staff_role(tenant_id, array['owner', 'admin']));

create policy invoice_sequences_read on public.invoice_sequences for select
  using (public.has_staff_role(tenant_id, array['owner', 'admin', 'caja']));
create policy invoice_sequences_admin_write on public.invoice_sequences for insert
  with check (public.has_staff_role(tenant_id, array['owner', 'admin']));
create policy invoice_sequences_admin_update on public.invoice_sequences for update
  using (public.has_staff_role(tenant_id, array['owner', 'admin']))
  with check (public.has_staff_role(tenant_id, array['owner', 'admin']));

create policy invoices_cashier_read on public.invoices for select
  using (public.has_staff_role(tenant_id, array['owner', 'admin', 'caja']));
create policy daily_closes_cashier_read on public.daily_closes for select
  using (public.has_staff_role(tenant_id, array['owner', 'admin', 'caja']));

-- ------------------------------------------------------------------------------
-- 13. Realtime (WebSockets). Respeta RLS: cada quien recibe solo lo que puede leer.
-- ------------------------------------------------------------------------------
do $$
declare
  t text;
begin
  foreach t in array array['orders', 'ingredients_stock', 'products', 'categories'] loop
    begin
      execute format('alter publication supabase_realtime add table public.%I', t);
    exception when duplicate_object then null;
    end;
  end loop;
end $$;
