# Plano de sala: de localStorage a Supabase

**Estado actual:** los ambientes (Salón, Terraza, Barra…) y la ubicación de cada mesa (zona,
forma, capacidad) se guardan en el `localStorage` del navegador, separados por restaurante
(`kikes:floor-plan:v1:<tenantId>`). Por eso, la distribución que se arma en un equipo
**no se ve en los demás** hasta que se haga esta migración.

## Cómo está armado

```
TablesAdmin / PosPage
        │  useFloorPlan(tenantId)          ← hooks/useFloorPlan.js (no sabe dónde se guarda)
        ▼
api.getFloorPlan / saveEnvironments / saveTableLayout / subscribeFloorPlan
        │
        ├─ demoApi      → localFloorPlanStore (services/floorPlanStore.js)
        └─ supabaseApi  → localFloorPlanStore   ← TODO: reemplazar por consultas a Supabase
```

La lógica de valores por defecto (en qué zona cae una mesa sin configurar, forma y capacidad
del ambiente) está en `lib/environments.js` (`resolveTableLayout`) y no depende del almacenamiento.

Contrato que debe cumplir la versión Supabase (el mismo que hoy):

| Función | Entrada | Salida |
|---|---|---|
| `getFloorPlan(tenantId)` | — | `{ environments: [{ id, name, defaultShape, defaultCapacity }], tables: { [tableId]: { zone, shape, capacity } } }` |
| `saveEnvironments(tenantId, environments)` | lista completa | — |
| `saveTableLayout(tenantId, updates)` | `{ [tableId]: { zone?, shape?, capacity? } \| null }` | — |
| `subscribeFloorPlan(tenantId, onChange)` | callback | función para desuscribirse |

## Migración propuesta

> Borrador: aún no está en `supabase/migrations/`. Revisarlo antes de crearlo como migración.

```sql
create table public.floor_environments (
  id               uuid primary key default gen_random_uuid(),
  tenant_id        uuid not null references public.tenants(id) on delete cascade,
  slug             text not null check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name             text not null check (length(btrim(name)) between 1 and 40),
  default_shape    text not null default 'square' check (default_shape in ('square', 'round', 'bar')),
  default_capacity smallint not null default 4 check (default_capacity between 1 and 50),
  sort_order       int not null default 0,
  unique (tenant_id, slug)
);

alter table public.restaurant_tables
  add column environment_id uuid references public.floor_environments(id) on delete set null,
  add column shape          text check (shape in ('square', 'round', 'bar')),
  add column capacity       smallint check (capacity between 1 and 50);

-- Hoy el UPDATE está limitado por columnas: hay que incluir las nuevas.
grant update (label, is_active, sort_order, environment_id, shape, capacity) on public.restaurant_tables to authenticated;
grant select, insert, update, delete on public.floor_environments to authenticated;

alter table public.floor_environments enable row level security;
create policy floor_env_staff_read on public.floor_environments for select
  using (public.has_staff_role(tenant_id));
create policy floor_env_admin_write on public.floor_environments for all
  using (public.has_staff_role(tenant_id, array['owner', 'admin']))
  with check (public.has_staff_role(tenant_id, array['owner', 'admin']));

-- No borrar mesas con pedidos abiertos (hoy lo valida supabaseApi.deleteTable en el cliente).
create or replace function public.prevent_delete_table_with_open_orders() returns trigger
language plpgsql as $$
begin
  if exists (
    select 1 from public.orders
    where table_id = old.id and status in ('Pendiente', 'En Preparación', 'Listo', 'Por Cobrar')
  ) then
    raise exception 'No se puede eliminar la mesa %: tiene pedidos abiertos', old.label using errcode = 'P0001';
  end if;
  return old;
end $$;
create trigger restaurant_tables_no_delete_open before delete on public.restaurant_tables
  for each row execute function public.prevent_delete_table_with_open_orders();
```

## Pasos al implementarlo

1. Crear la migración (con el borrador de arriba) y sembrar los 3 ambientes por defecto para cada restaurante.
2. En `supabaseApi.js`, reemplazar las 4 funciones del plano:
   - `getFloorPlan`: `floor_environments` + `restaurant_tables(id, environment_id, shape, capacity)`;
     el `zone` que usa la app es el `slug` del ambiente.
   - `saveEnvironments`: upsert por `(tenant_id, slug)` y borrar los que ya no estén.
   - `saveTableLayout`: `update restaurant_tables set environment_id, shape, capacity`.
   - `subscribeFloorPlan`: `subscribe('floor', ['floor_environments', 'restaurant_tables'], tenantId, onChange)`.
3. Quitar de `supabaseApi.deleteTable` la limpieza en `localFloorPlanStore` y la verificación de pedidos del cliente (ya la hará el trigger).
4. Las vistas (`TablesAdmin`, `PosView`, `RestaurantFloorPlan`) no cambian.
