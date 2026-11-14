-- ==============================================================================
-- Analítica y Ficha Técnica: Dashboard de Ventas, Comportamiento de Inventario y Escandallos
-- ==============================================================================

-- 1. Ficha Técnica / Escandallos de Receta por Platillo
create table if not exists public.product_recipes (
  id             uuid primary key default gen_random_uuid(),
  tenant_id      uuid not null references public.tenants(id) on delete cascade,
  product_id     uuid not null references public.products(id) on delete cascade,
  ingredient_key text not null,
  quantity       numeric not null check (quantity > 0),
  unit           text not null default 'unidad',
  created_at     timestamptz not null default now(),
  unique (tenant_id, product_id, ingredient_key)
);

create index if not exists product_recipes_tenant_product_idx
  on public.product_recipes(tenant_id, product_id);

alter table public.product_recipes enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'product_recipes' and policyname = 'product_recipes_staff_access'
  ) then
    create policy product_recipes_staff_access on public.product_recipes
      for all to authenticated using (true) with check (true);
  end if;
end $$;

grant all on public.product_recipes to authenticated;

-- 2. Tabla de Resumen Diario Precalculado (Acelera consultas de 1 o 2 años en el Dashboard)
create table if not exists public.daily_sales_analytics (
  tenant_id          uuid not null references public.tenants(id) on delete cascade,
  sale_date          date not null,
  total_revenue      numeric not null default 0,
  total_tax          numeric not null default 0,
  total_tip          numeric not null default 0,
  order_count        int not null default 0,
  invoice_count      int not null default 0,
  cash_sales         numeric not null default 0,
  card_sales         numeric not null default 0,
  transfer_sales     numeric not null default 0,
  top_product_id     uuid references public.products(id) on delete set null,
  top_product_name   text,
  top_product_qty    int default 0,
  updated_at         timestamptz not null default now(),
  primary key (tenant_id, sale_date)
);

create index if not exists daily_sales_analytics_date_idx
  on public.daily_sales_analytics(tenant_id, sale_date desc);

alter table public.daily_sales_analytics enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'daily_sales_analytics' and policyname = 'daily_sales_staff_access'
  ) then
    create policy daily_sales_staff_access on public.daily_sales_analytics
      for select to authenticated using (true);
  end if;
end $$;

grant select on public.daily_sales_analytics to authenticated;

-- 3. Índices de rendimiento para analítica temporal
create index if not exists order_items_analytics_idx
  on public.order_items(tenant_id, product_id, quantity);

create index if not exists invoices_analytics_idx
  on public.invoices(tenant_id, created_at desc);

create index if not exists orders_analytics_idx
  on public.orders(tenant_id, created_at desc, status);

create index if not exists inventory_movements_analytics_full_idx
  on public.inventory_movements(tenant_id, type, created_at desc);

-- 4. RPC: Guardar la receta completa de un platillo
create or replace function public.admin_save_product_recipe(
  p_product_id uuid,
  p_items jsonb
) returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_staff public.staff_members;
  v_item  jsonb;
begin
  v_staff := public.require_staff(array['owner', 'admin']);

  -- Limpia ingredientes previos del platillo
  delete from public.product_recipes
  where tenant_id = v_staff.tenant_id and product_id = p_product_id;

  -- Inserta los nuevos componentes
  if p_items is not null and jsonb_array_length(p_items) > 0 then
    for v_item in select * from jsonb_array_elements(p_items)
    loop
      insert into public.product_recipes (
        tenant_id, product_id, ingredient_key, quantity, unit
      ) values (
        v_staff.tenant_id,
        p_product_id,
        public.normalize_ingredient(v_item->>'ingredientName'),
        greatest(0.001, coalesce((v_item->>'quantity')::numeric, 1)),
        coalesce(nullif(btrim(v_item->>'unit'), ''), 'unidad')
      );
    end loop;
  end if;

  return jsonb_build_object('ok', true, 'count', jsonb_array_length(coalesce(p_items, '[]'::jsonb)));
end $$;

grant execute on function public.admin_save_product_recipe(uuid, jsonb) to authenticated;

-- 5. RPC: Reporte de ventas temporal (día, semana, mes, año)
create or replace function public.get_sales_analytics(
  p_period text default 'month', -- 'day', 'week', 'month', 'year'
  p_start timestamptz default null,
  p_end timestamptz default null
) returns table (
  period_label   text,
  period_date    timestamptz,
  total_sales    numeric,
  invoice_count  bigint,
  average_ticket numeric,
  cash_sales     numeric,
  card_sales     numeric,
  transfer_sales numeric,
  total_tax      numeric,
  total_tip      numeric
) language sql stable security definer set search_path = public as $$
  with bounds as (
    select
      coalesce(p_start, now() - interval '6 months') as start_dt,
      coalesce(p_end, now()) as end_dt,
      (select tenant_id from public.staff_members where user_id = auth.uid() and is_active limit 1) as t_id
  )
  select
    to_char(date_trunc(p_period, i.created_at), case p_period
      when 'day'   then 'YYYY-MM-DD'
      when 'week'  then '"Sem " IW, YYYY'
      when 'month' then 'TMMonth YYYY'
      else 'YYYY' end) as period_label,
    date_trunc(p_period, i.created_at) as period_date,
    coalesce(sum(i.total), 0)::numeric as total_sales,
    count(i.id)::bigint as invoice_count,
    coalesce(round(avg(i.total)), 0)::numeric as average_ticket,
    coalesce(sum(case when i.payment_method = 'efectivo' then i.total else 0 end), 0)::numeric as cash_sales,
    coalesce(sum(case when i.payment_method = 'tarjeta' then i.total else 0 end), 0)::numeric as card_sales,
    coalesce(sum(case when i.payment_method = 'transferencia' then i.total else 0 end), 0)::numeric as transfer_sales,
    coalesce(sum(i.tax), 0)::numeric as total_tax,
    coalesce(sum(i.tip), 0)::numeric as total_tip
  from bounds b
  join public.invoices i on i.tenant_id = b.t_id and i.created_at between b.start_dt and b.end_dt
  group by date_trunc(p_period, i.created_at)
  order by period_date asc;
$$;

grant execute on function public.get_sales_analytics(text, timestamptz, timestamptz) to authenticated;

-- 6. RPC: Ranking de platillos más vendidos
create or replace function public.get_top_selling_products(
  p_limit int default 10,
  p_start timestamptz default null,
  p_end timestamptz default null
) returns table (
  product_id      uuid,
  product_name    text,
  category_name   text,
  total_quantity  bigint,
  total_revenue   numeric,
  order_occurrences bigint
) language sql stable security definer set search_path = public as $$
  with bounds as (
    select
      coalesce(p_start, now() - interval '30 days') as start_dt,
      coalesce(p_end, now()) as end_dt,
      (select tenant_id from public.staff_members where user_id = auth.uid() and is_active limit 1) as t_id
  )
  select
    oi.product_id,
    oi.name as product_name,
    coalesce(c.name, 'Sin Categoría') as category_name,
    sum(oi.quantity)::bigint as total_quantity,
    sum(oi.total_price)::numeric as total_revenue,
    count(distinct oi.order_id)::bigint as order_occurrences
  from bounds b
  join public.order_items oi on oi.tenant_id = b.t_id
  join public.orders o on o.id = oi.order_id and o.status = 'Cobrado' and o.created_at between b.start_dt and b.end_dt
  left join public.products p on p.id = oi.product_id
  left join public.categories c on c.id = p.category_id
  group by oi.product_id, oi.name, c.name
  order by total_quantity desc, total_revenue desc
  limit greatest(1, p_limit);
$$;

grant execute on function public.get_top_selling_products(int, timestamptz, timestamptz) to authenticated;

-- 7. RPC: Comportamiento de inventario (mermas, stock actual y costo de pérdidas)
create or replace function public.get_inventory_analytics(
  p_start timestamptz default null,
  p_end timestamptz default null
) returns table (
  ingredient_key    text,
  ingredient_name   text,
  category          text,
  current_stock     numeric,
  min_stock         numeric,
  unit              text,
  unit_cost         numeric,
  is_low_stock      boolean,
  total_entries     numeric,
  total_waste       numeric,
  waste_cost        numeric
) language sql stable security definer set search_path = public as $$
  with bounds as (
    select
      coalesce(p_start, now() - interval '30 days') as start_dt,
      coalesce(p_end, now()) as end_dt,
      (select tenant_id from public.staff_members where user_id = auth.uid() and is_active limit 1) as t_id
  ),
  waste_data as (
    select
      im.ingredient_key,
      sum(case when im.type = 'ENTRADA' then im.quantity else 0 end) as entries_qty,
      sum(case when im.type in ('MERMA', 'SALIDA') then im.quantity else 0 end) as waste_qty,
      sum(case when im.type = 'MERMA' then im.quantity * coalesce(im.cost, 0) else 0 end) as waste_cost_total
    from bounds b
    join public.inventory_movements im on im.tenant_id = b.t_id and im.created_at between b.start_dt and b.end_dt
    group by im.ingredient_key
  )
  select
    st.ingredient_key,
    st.name as ingredient_name,
    st.category,
    st.current_stock,
    st.min_stock,
    st.unit,
    st.unit_cost,
    (st.current_stock <= st.min_stock) as is_low_stock,
    coalesce(w.entries_qty, 0) as total_entries,
    coalesce(w.waste_qty, 0) as total_waste,
    coalesce(w.waste_cost_total, 0) as waste_cost
  from bounds b
  join public.ingredients_stock st on st.tenant_id = b.t_id
  left join waste_data w on w.ingredient_key = st.ingredient_key
  order by (st.current_stock <= st.min_stock) desc, waste_cost desc, st.name asc;
$$;

grant execute on function public.get_inventory_analytics(timestamptz, timestamptz) to authenticated;

-- 8. RPC: Food Cost % y Margen Real por Platillo
create or replace function public.get_food_cost_analytics()
returns table (
  product_id            uuid,
  product_name          text,
  category_name         text,
  sale_price            integer,
  recipe_cost           numeric,
  gross_profit          numeric,
  food_cost_percentage  numeric,
  ingredients_count     bigint
) language sql stable security definer set search_path = public as $$
  with tenant_info as (
    select tenant_id from public.staff_members where user_id = auth.uid() and is_active limit 1
  ),
  recipe_costs as (
    select
      r.product_id,
      sum(r.quantity * coalesce(st.unit_cost, 0)) as total_cost,
      count(r.id) as ing_count
    from tenant_info t
    join public.product_recipes r on r.tenant_id = t.tenant_id
    left join public.ingredients_stock st on st.tenant_id = r.tenant_id and st.ingredient_key = r.ingredient_key
    group by r.product_id
  )
  select
    p.id as product_id,
    p.name as product_name,
    coalesce(c.name, 'Sin Categoría') as category_name,
    p.price as sale_price,
    coalesce(round(rc.total_cost, 2), 0) as recipe_cost,
    (p.price - coalesce(rc.total_cost, 0))::numeric as gross_profit,
    case when p.price > 0 then
      round((coalesce(rc.total_cost, 0) / p.price * 100)::numeric, 1)
    else
      0
    end as food_cost_percentage,
    coalesce(rc.ing_count, 0)::bigint as ingredients_count
  from tenant_info t
  join public.products p on p.tenant_id = t.tenant_id and p.available
  left join public.categories c on c.id = p.category_id
  left join recipe_costs rc on rc.product_id = p.id
  order by p.price desc;
$$;

grant execute on function public.get_food_cost_analytics() to authenticated;
