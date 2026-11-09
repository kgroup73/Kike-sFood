# Kike's — Carta digital, cocina y caja para restaurantes

SaaS multi-restaurante con:

1. **Carta digital QR/NFC** para el comensal: categorías, filtros, modificadores, maridajes, historias destacadas y pedidos desde la mesa.
2. **Cocina KDS** en tiempo real: flujo `Pendiente → En Preparación → Listo → Por Cobrar` y control de materias primas agotadas.
3. **Caja POS**: tiquete POS, factura electrónica (*simulada por ahora*), impuesto al consumo desglosado, propina voluntaria y cierre de caja (Reporte Z).
4. **Administración**: datos de la empresa, carta, personal con PIN, mesas con QR/NFC, inventario, numeración de facturación y plan.

Stack: React 18 · Vite 6 · Tailwind 3 · react-router 7 · Supabase (Postgres + RLS + Realtime + Edge Functions).

---

## Arranque rápido (modo demo, sin Supabase)

```bash
npm install
npm run dev        # http://localhost:3000
```

Sin variables de Supabase la app funciona en **modo demo**. Los datos viven en el navegador y se sincronizan entre pestañas. Puedes abrir la carta en una pestaña y la cocina en otra.

| Ruta | Qué es |
|---|---|
| `/r/la-trattoria/m/demo-mesa-4` | Carta del comensal en la Mesa 4 |
| `/staff/la-trattoria/login` | Ingreso del personal. PIN demo: dueño `1234`, cocina `1111`, caja `2222` |

> El modo demo no es seguro (cualquiera puede editar `localStorage`). Úsalo solo para demostraciones y desarrollo.

## Scripts

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Compilación de producción en `dist/` |
| `npm run lint` | ESLint (incluye `react-hooks/exhaustive-deps`) |
| `npm test` | Pruebas unitarias y de integración (Vitest + Testing Library) |
| `npm run test:db` | Prueba la migración, el seed y las políticas RLS en un Postgres embebido (PGlite) |
| `node scripts/generate-seed.mjs` | Regenera `supabase/seed.sql` a partir de los datos demo |

El CI (`.github/workflows/ci.yml`) ejecuta lint, test, test:db y build en cada PR.

---

## Arquitectura

```text
Navegador del comensal ── anon key ──► create_order() / resolve_table()   (RPC, SECURITY DEFINER)
                                     └► SELECT carta pública                 (RLS: solo lectura)

Tablet de cocina / caja ── PIN ──► Edge Function staff-login ──► sesión Supabase Auth
                                     └► tablas del restaurante (RLS por tenant y rol)
                                     └► issue_invoice() / close_cash_register() / set_ingredient_stock()
```

**Principio:** el navegador nunca decide precios, totales, plan ni numeración. Todo eso se calcula en la base de datos.

- **Pedidos:** `create_order` valida el token de la mesa, recalcula los precios desde el catálogo (incluidos los adicionales), exige los modificadores obligatorios, rechaza los platillos agotados y limita a 6 pedidos por mesa cada 10 minutos.
- **Mesas:** cada una tiene un token secreto (`restaurant_tables.token`) que va en el QR o NFC. Sin el token se puede ver la carta, pero no pedir. Si un enlace se filtra, se regenera desde *Admin → Mesas*.
- **Personal:** cada empleado tiene un PIN propio (bcrypt) y uno de estos roles: `owner`, `admin`, `cocina`, `caja` o `mesero`. Tras 5 intentos fallidos el usuario queda bloqueado 15 minutos.
- **Facturación (una por mesa):** la caja agrupa por mesa las comandas en `Por Cobrar`. `issue_invoice(p_order_ids[])` exige que todas sean de la misma mesa y estén en `Por Cobrar`, suma consumo y propinas, une las líneas iguales, toma el consecutivo con bloqueo de fila, valida el rango y la vigencia de la resolución, desglosa el impuesto y marca todas las comandas como `Cobrado` en la misma transacción. `invoice_orders.order_id` es único, así que una comanda no se puede cobrar dos veces. Las comandas que siguen en cocina se cobran aparte cuando pasan a caja.
- **Planes:** `tenants.plan` no se puede editar desde el navegador (GRANT por columna). Lo cambia la plataforma.

### Impuesto al consumo (INC)

Los restaurantes en Colombia cobran normalmente el **INC del 8 %** en lugar del IVA. El precio que ve el cliente en la carta **ya incluye el impuesto**, así que el tiquete lo **desglosa** (`base = total / 1,08`) en vez de sumarlo. La propina es voluntaria (Ley 1935 de 2018): el comensal no la elige al pedir; la caja la confirma con él al cobrar (sugerida, sin propina u otro valor). Va aparte y no hace parte de la base gravable. La propina sugerida se configura en *Admin → Datos de Empresa* y no puede superar el 10 %. El tipo de impuesto y la tarifa se configuran en *Admin → Datos de Empresa*.

### Estructura

```text
src/
├── App.jsx                  # Rutas
├── pages/                   # HomePage, MenuPage (comensal) y staff/ (cocina, caja, admin, login)
├── components/
│   ├── client/              # Carta, carrito, detalle de platillo, historias
│   ├── staff/               # KDS, POS, cobro, tiquete, cierre Z
│   ├── admin/               # Un módulo por sección de administración
│   └── ui/                  # Modal, QR, pantallas de carga/error
├── hooks/                   # useMenu, useOrders, useTenant, useStaffSession, useToast, useSound
├── services/
│   ├── api.js               # Elige Supabase o demo
│   ├── supabaseApi.js       # Implementación real
│   └── demo/                # Backend demo + datos de ejemplo
└── lib/                     # Lógica pura con tests: money, pricing, orderStatus, plans, roles, inventory
supabase/
├── migrations/              # Esquema, RLS, RPCs
├── functions/staff-login/   # Login con PIN → sesión de Supabase Auth
├── seed.sql                 # Restaurante demo (generado)
└── config.toml
scripts/                     # generate-seed.mjs, test-db.mjs
```

---

## Configurar Supabase

Requiere la [Supabase CLI](https://supabase.com/docs/guides/cli).

```bash
supabase link --project-ref <tu-proyecto>

# 1. Esquema (la migración elimina las tablas del prototipo anterior, que no tenía datos)
supabase db push

# 2. (Opcional) restaurante demo: ejecuta supabase/seed.sql en el SQL Editor

# 3. Secreto del login con PIN (64+ caracteres aleatorios; no lo cambies a la ligera)
supabase secrets set STAFF_AUTH_PEPPER="$(openssl rand -hex 48)"
#    Opcional: restringe CORS a tu dominio
supabase secrets set ALLOWED_ORIGIN=https://tu-dominio.com

# 4. Edge Function
supabase functions deploy staff-login --no-verify-jwt
```

En el panel de Supabase, en **Authentication → Sign In / Providers**, desactiva **"Allow new users to sign up"**. Las cuentas del personal las crea la Edge Function.

Variables del frontend (en `.env` local y en Vercel):

```bash
VITE_SUPABASE_URL=https://<tu-proyecto>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon o publishable key>
```

### Dar de alta un restaurante y su dueño

Ejecuta en el SQL Editor (como `postgres`):

```sql
insert into tenants (slug, name, nit, plan) values ('mi-restaurante', 'Mi Restaurante S.A.S.', '900123456-7', 'intermedio');
select create_staff_member('mi-restaurante', 'Nombre del dueño', 'owner', '123456');
```

El dueño entra en `/staff/mi-restaurante/login` y desde *Admin → Personal* crea al resto del equipo. Las mesas y sus QR se crean en *Admin → Mesas*.

Para cambiar el plan: `update tenants set plan = 'premium' where slug = 'mi-restaurante';`

### Al agregar tablas o funciones nuevas

La migración revoca los privilegios por defecto de `anon` y `authenticated`. Cada tabla o función nueva debe:

1. Hacer `GRANT` explícito de lo que necesita.
2. Activar RLS (`enable row level security`) con políticas que usen `has_staff_role(tenant_id, ...)`.
3. Tener su caso en `scripts/test-db.mjs`.

---

## Facturación electrónica DIAN: estado actual

La factura electrónica está **simulada**. Se genera numeración real, el desglose de impuestos y un CUFE de prueba, pero **no se envía a la DIAN**. El tiquete y la caja lo indican como *"SIMULADO — sin validez fiscal"*.

El proveedor tecnológico está pendiente de decisión (**Factus** o **Siigo**). La integración prevista es:

1. Una Edge Function `emit-invoice` que reciba el `invoice_id`, arme el documento desde la BD y lo envíe al proveedor.
2. Credenciales del proveedor y clave técnica como **secretos del servidor** (`supabase secrets set ...`), nunca en el navegador ni en tablas legibles.
3. Guardar el CUFE real, el QR, el PDF y el estado (`pendiente` / `aceptada` / `rechazada`) en `invoices.dian_status`.

`billing_settings.provider` ya admite `factus` y `siigo`.

---

## Despliegue (Vercel)

El preset es **Vite**: build `npm run build` y salida `dist`. `vercel.json` ya incluye el rewrite para la SPA, la caché de los assets y los headers de seguridad. `Referrer-Policy` evita que el token de la mesa se filtre a sitios externos.

## Licencia

[MIT](./LICENSE)
