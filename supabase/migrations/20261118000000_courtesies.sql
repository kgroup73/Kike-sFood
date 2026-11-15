-- ==============================================================================
-- Cortesías Comerciales: Registro, Auditoría y Analítica de Inversión en Atenciones
-- ==============================================================================

-- 1. Tabla de Registro y Auditoría de Cortesías
create table if not exists public.courtesy_logs (
  id                      uuid primary key default gen_random_uuid(),
  tenant_id               uuid not null references public.tenants(id) on delete cascade,
  invoice_id              uuid references public.invoices(id) on delete set null,
  order_id                bigint references public.orders(id) on delete set null,
  product_name            text not null,
  quantity                int not null check (quantity > 0),
  commercial_value        integer not null check (commercial_value >= 0),
  estimated_cost          numeric not null default 0 check (estimated_cost >= 0),
  reason                  text not null check (reason in ('fidelizacion', 'compensacion_servicio', 'degustacion', 'invitacion_casa')),
  authorized_by_staff_id  uuid references public.staff_members(id) on delete set null,
  authorized_by_name      text not null,
  created_at              timestamptz not null default now()
);

create index if not exists courtesy_logs_tenant_created_idx
  on public.courtesy_logs(tenant_id, created_at desc);

alter table public.courtesy_logs enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'courtesy_logs' and policyname = 'courtesy_logs_staff_access'
  ) then
    create policy courtesy_logs_staff_access on public.courtesy_logs
      for all to authenticated using (true) with check (true);
  end if;
end $$;

grant all on public.courtesy_logs to authenticated;

-- 2. RPC: Obtener Analítica de Cortesías para el Dashboard
create or replace function public.get_courtesy_analytics(
  p_start timestamptz default null,
  p_end timestamptz default null
) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare
  v_tenant_id uuid;
  v_start timestamptz := coalesce(p_start, now() - interval '6 months');
  v_end timestamptz := coalesce(p_end, now());
  v_result jsonb;
begin
  select tenant_id into v_tenant_id
  from public.staff_members
  where user_id = auth.uid() and is_active
  limit 1;

  if v_tenant_id is null then
    select id into v_tenant_id from public.tenants limit 1;
  end if;

  select jsonb_build_object(
    'total_commercial_value', coalesce(sum(commercial_value), 0),
    'total_estimated_cost', coalesce(sum(estimated_cost), 0),
    'total_count', count(id),
    'by_reason', jsonb_build_object(
      'fidelizacion', coalesce(sum(case when reason = 'fidelizacion' then commercial_value else 0 end), 0),
      'compensacion_servicio', coalesce(sum(case when reason = 'compensacion_servicio' then commercial_value else 0 end), 0),
      'degustacion', coalesce(sum(case when reason = 'degustacion' then commercial_value else 0 end), 0),
      'invitacion_casa', coalesce(sum(case when reason = 'invitacion_casa' then commercial_value else 0 end), 0)
    ),
    'recent_items', coalesce(
      (
        select jsonb_agg(sub)
        from (
          select
            id,
            product_name,
            quantity,
            commercial_value,
            estimated_cost,
            reason,
            authorized_by_name,
            created_at
          from public.courtesy_logs
          where tenant_id = v_tenant_id
            and created_at between v_start and v_end
          order by created_at desc
          limit 15
        ) sub
      ),
      '[]'::jsonb
    )
  ) into v_result
  from public.courtesy_logs
  where tenant_id = v_tenant_id
    and created_at between v_start and v_end;

  return v_result;
end $$;

grant execute on function public.get_courtesy_analytics(timestamptz, timestamptz) to authenticated;
