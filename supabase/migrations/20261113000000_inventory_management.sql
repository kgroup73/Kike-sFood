-- ==============================================================================
-- Gestión de Inventario: Catálogo de Insumos, Control de Existencias y Movimientos
-- ==============================================================================

-- 1. Ampliación de la tabla ingredients_stock con campos cuantitativos
alter table public.ingredients_stock
  add column if not exists current_stock numeric not null default 0,
  add column if not exists min_stock numeric not null default 0,
  add column if not exists unit text not null default 'unidad',
  add column if not exists category text not null default 'otros',
  add column if not exists unit_cost numeric not null default 0,
  add column if not exists auto_deplete boolean not null default false,
  add column if not exists supplier text;

-- 2. Historial de movimientos de inventario (Entradas, Mermas, Ajustes)
create table if not exists public.inventory_movements (
  id                uuid primary key default gen_random_uuid(),
  tenant_id         uuid not null references public.tenants(id) on delete cascade,
  ingredient_key    text not null,
  ingredient_name   text not null,
  type              text not null check (type in ('ENTRADA', 'SALIDA', 'AJUSTE', 'MERMA')),
  quantity          numeric not null,
  previous_stock    numeric not null default 0,
  new_stock         numeric not null default 0,
  cost              numeric default 0,
  supplier          text,
  invoice_ref       text,
  note              text,
  created_by        text,
  created_at        timestamptz not null default now()
);

create index if not exists inventory_movements_tenant_idx on public.inventory_movements(tenant_id, created_at desc);
create index if not exists inventory_movements_ing_idx on public.inventory_movements(tenant_id, ingredient_key, created_at desc);

alter table public.inventory_movements enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'inventory_movements' and policyname = 'inventory_movements_staff_access'
  ) then
    create policy inventory_movements_staff_access on public.inventory_movements
      for select to authenticated using (true);
  end if;
end $$;

grant select on public.inventory_movements to authenticated;

-- 3. Función RPC para guardar o crear un insumo en el inventario maestro
create or replace function public.admin_save_ingredient(
  p_name text,
  p_category text default 'otros',
  p_unit text default 'unidad',
  p_current_stock numeric default 0,
  p_min_stock numeric default 0,
  p_unit_cost numeric default 0,
  p_auto_deplete boolean default false,
  p_supplier text default null,
  p_is_sold_out boolean default null
) returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_staff   public.staff_members;
  v_key     text := public.normalize_ingredient(p_name);
  v_sold    boolean;
begin
  v_staff := public.require_staff(array['owner', 'admin']);
  if v_key = '' then
    raise exception 'Nombre de ingrediente inválido' using errcode = 'P0001';
  end if;

  if p_is_sold_out is not null then
    v_sold := p_is_sold_out;
  else
    -- Si está en modo automático y el stock es <= 0, se agota por defecto
    v_sold := case when coalesce(p_auto_deplete, false) and coalesce(p_current_stock, 0) <= 0 then true else false end;
  end if;

  insert into public.ingredients_stock (
    tenant_id, ingredient_key, name, category, unit,
    current_stock, min_stock, unit_cost, auto_deplete, supplier,
    is_sold_out, updated_at
  ) values (
    v_staff.tenant_id, v_key, btrim(p_name), coalesce(p_category, 'otros'), coalesce(p_unit, 'unidad'),
    coalesce(p_current_stock, 0), coalesce(p_min_stock, 0), coalesce(p_unit_cost, 0), coalesce(p_auto_deplete, false), nullif(btrim(coalesce(p_supplier, '')), ''),
    v_sold, now()
  )
  on conflict (tenant_id, ingredient_key) do update set
    name = excluded.name,
    category = excluded.category,
    unit = excluded.unit,
    min_stock = excluded.min_stock,
    unit_cost = excluded.unit_cost,
    auto_deplete = excluded.auto_deplete,
    supplier = excluded.supplier,
    current_stock = excluded.current_stock,
    is_sold_out = case when p_is_sold_out is not null then p_is_sold_out else ingredients_stock.is_sold_out end,
    updated_at = now();

  return jsonb_build_object('ok', true, 'key', v_key);
end $$;

grant execute on function public.admin_save_ingredient(text, text, text, numeric, numeric, numeric, boolean, text, boolean) to authenticated;

-- 4. Función RPC para registrar movimiento de stock (Entrada, Ajuste o Merma)
create or replace function public.admin_register_stock_movement(
  p_name text,
  p_type text,
  p_quantity numeric,
  p_cost numeric default 0,
  p_supplier text default null,
  p_invoice_ref text default null,
  p_note text default null
) returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_staff       public.staff_members;
  v_key         text := public.normalize_ingredient(p_name);
  v_prev_stock  numeric := 0;
  v_new_stock   numeric := 0;
  v_auto        boolean := false;
  v_sold_out    boolean := false;
  v_affected    text[];
begin
  v_staff := public.require_staff(array['owner', 'admin']);
  if v_key = '' then
    raise exception 'Ingrediente inválido' using errcode = 'P0001';
  end if;
  if p_quantity = 0 then
    raise exception 'La cantidad no puede ser cero' using errcode = 'P0001';
  end if;

  select coalesce(current_stock, 0), coalesce(auto_deplete, false), coalesce(is_sold_out, false)
  into v_prev_stock, v_auto, v_sold_out
  from public.ingredients_stock
  where tenant_id = v_staff.tenant_id and ingredient_key = v_key;

  if p_type = 'ENTRADA' then
    v_new_stock := v_prev_stock + abs(p_quantity);
  elsif p_type in ('MERMA', 'SALIDA') then
    v_new_stock := greatest(0, v_prev_stock - abs(p_quantity));
  elsif p_type = 'AJUSTE' then
    v_new_stock := greatest(0, p_quantity);
  else
    raise exception 'Tipo de movimiento inválido' using errcode = 'P0001';
  end if;

  -- Si está en modo auto-agotamiento y el stock sube de 0, se reactiva; si baja a 0, se agota
  if v_auto then
    if v_new_stock > 0 and v_sold_out then
      v_sold_out := false;
    elsif v_new_stock <= 0 and not v_sold_out then
      v_sold_out := true;
    end if;
  end if;

  update public.ingredients_stock
  set current_stock = v_new_stock,
      is_sold_out = v_sold_out,
      updated_at = now()
  where tenant_id = v_staff.tenant_id and ingredient_key = v_key;

  insert into public.inventory_movements (
    tenant_id, ingredient_key, ingredient_name, type, quantity,
    previous_stock, new_stock, cost, supplier, invoice_ref, note, created_by
  ) values (
    v_staff.tenant_id, v_key, btrim(p_name), p_type, p_quantity,
    v_prev_stock, v_new_stock, coalesce(p_cost, 0),
    nullif(btrim(coalesce(p_supplier, '')), ''),
    nullif(btrim(coalesce(p_invoice_ref, '')), ''),
    nullif(btrim(coalesce(p_note, '')), ''),
    v_staff.display_name
  );

  return jsonb_build_object(
    'ok', true,
    'previousStock', v_prev_stock,
    'newStock', v_new_stock,
    'isSoldOut', v_sold_out
  );
end $$;

grant execute on function public.admin_register_stock_movement(text, text, numeric, numeric, text, text, text) to authenticated;

-- 5. Función RPC para eliminar un insumo del catálogo maestro
create or replace function public.admin_delete_ingredient(p_key text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_staff public.staff_members;
begin
  v_staff := public.require_staff(array['owner', 'admin']);
  delete from public.ingredients_stock
  where tenant_id = v_staff.tenant_id and ingredient_key = p_key;

  return jsonb_build_object('ok', true);
end $$;

grant execute on function public.admin_delete_ingredient(text) to authenticated;
