import { existsSync, mkdirSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PGlite } from '@electric-sql/pglite';
import { pgcrypto } from '@electric-sql/pglite/contrib/pgcrypto';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const dataDir = path.resolve(rootDir, '.data');
const dbDir = path.resolve(dataDir, 'kikes-pglite');

let pgliteInstance = null;
let initPromise = null;
let currentMockUser = null;

async function getOrInitDb() {
  if (pgliteInstance) return pgliteInstance;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    if (!existsSync(dataDir)) {
      mkdirSync(dataDir, { recursive: true });
    }

    console.log('[PGlite] Inicializando base de datos local en:', dbDir);
    const db = new PGlite(dbDir, { extensions: { pgcrypto } });

    // 1. Esquemas base y extensiones
    await db.exec(`
      create schema if not exists extensions;
      create extension if not exists pgcrypto with schema extensions;
      create schema if not exists auth;
      create table if not exists auth.users (
        id uuid primary key default gen_random_uuid(),
        email text unique,
        raw_user_meta_data jsonb default '{}'::jsonb,
        created_at timestamptz default now()
      );
      create or replace function auth.uid() returns uuid language sql stable as
        $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
      create or replace function auth.jwt() returns jsonb language sql stable as
        $$ select coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb $$;

      do $$ begin
        if not exists (select from pg_roles where rolname = 'anon') then create role anon nologin; end if;
        if not exists (select from pg_roles where rolname = 'authenticated') then create role authenticated nologin; end if;
        if not exists (select from pg_roles where rolname = 'service_role') then create role service_role nologin bypassrls; end if;
      end $$;

      grant usage on schema public, auth, extensions to anon, authenticated, service_role;
      grant execute on function auth.uid() to anon, authenticated, service_role;
      grant execute on function auth.jwt() to anon, authenticated, service_role;

      alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
      alter default privileges in schema public grant all on functions to anon, authenticated, service_role;
      alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;

      do $$ begin
        if not exists (select from pg_publication where pubname = 'supabase_realtime') then
          create publication supabase_realtime;
        end if;
      end $$;
    `);

    // 2. Tabla de control de migraciones
    await db.exec(`
      create table if not exists public._pglite_migrations (
        name text primary key,
        applied_at timestamptz default now()
      );
    `);

    // 3. Aplicar migraciones pendientes
    const migrationsDir = path.resolve(rootDir, 'supabase', 'migrations');
    if (existsSync(migrationsDir)) {
      const files = readdirSync(migrationsDir)
        .filter((f) => f.endsWith('.sql'))
        .sort();

      for (const file of files) {
        const { rows } = await db.query(
          'select 1 from public._pglite_migrations where name = $1',
          [file]
        );
        if (!rows.length) {
          console.log(`[PGlite] Aplicando migración: ${file}`);
          const sql = readFileSync(path.join(migrationsDir, file), 'utf8');
          try {
            await db.exec(sql);
            await db.query(
              'insert into public._pglite_migrations (name) values ($1)',
              [file]
            );
          } catch (migErr) {
            console.error(`[PGlite] Error en migración ${file}:`, migErr.message);
          }
        }
      }
    }

    // 4. Asegurar permisos completos para desarrollo local
    await db.exec(`
      grant usage on schema public, auth, extensions to anon, authenticated, service_role;
      grant all privileges on all tables in schema public to anon, authenticated, service_role;
      grant all privileges on all sequences in schema public to anon, authenticated, service_role;
      grant execute on all functions in schema public to anon, authenticated, service_role;
    `);

    // 5. Cargar seed inicial si la base de datos de tenants está vacía
    try {
      const { rows: tenantRows } = await db.query('select count(*)::int as c from public.tenants');
      if (tenantRows[0]?.c === 0) {
        const seedFile = path.resolve(rootDir, 'supabase', 'seed.sql');
        if (existsSync(seedFile)) {
          console.log('[PGlite] Cargando datos semilla iniciales (seed.sql)...');
          const seedSql = readFileSync(seedFile, 'utf8');
          await db.exec(seedSql);
        }
      }
    } catch {
      /* ignorar si la tabla no está creada aún */
    }

    console.log('[PGlite] Base de datos local lista y sincronizada.');
    pgliteInstance = db;
    return db;
  })();

  return initPromise;
}

export function pglitePlugin() {
  return {
    name: 'vite-plugin-pglite',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url.startsWith('/api/pglite/')) {
          return next();
        }

        const parseBody = () =>
          new Promise((resolve, reject) => {
            let body = '';
            req.on('data', (chunk) => {
              body += chunk;
            });
            req.on('end', () => {
              try {
                resolve(body ? JSON.parse(body) : {});
              } catch (e) {
                reject(e);
              }
            });
          });

        res.setHeader('Content-Type', 'application/json');

        try {
          const db = await getOrInitDb();

          // Endpoint: Mock de Google OAuth para desarrollo local
          if (req.url === '/api/pglite/auth/user') {
            if (req.method === 'GET') {
              return res.end(JSON.stringify({ user: currentMockUser }));
            }
            if (req.method === 'POST') {
              const body = await parseBody();
              currentMockUser = body.user || null;
              return res.end(JSON.stringify({ user: currentMockUser }));
            }
            if (req.method === 'DELETE') {
              currentMockUser = null;
              return res.end(JSON.stringify({ ok: true }));
            }
          }

          // Endpoint: Query directo
          if (req.url === '/api/pglite/query' && req.method === 'POST') {
            const { sql, params = [] } = await parseBody();
            const result = await db.query(sql, params);
            return res.end(JSON.stringify({ rows: result.rows }));
          }

          // Endpoint: Exec DDL directo
          if (req.url === '/api/pglite/exec' && req.method === 'POST') {
            const { sql } = await parseBody();
            await db.exec(sql);
            return res.end(JSON.stringify({ ok: true }));
          }

          // Endpoint: RPC (Llamada a función de Postgres)
          if (req.url === '/api/pglite/rpc' && req.method === 'POST') {
            const { name, args = {}, auth = {} } = await parseBody();

            // Configurar contexto JWT simulado si viene auth
            const userId = auth.userId || (currentMockUser ? currentMockUser.id : null);
            const userEmail = auth.email || (currentMockUser ? currentMockUser.email : 'local@kikesfood.com');

            // Construir llamada: select * from public.<name>(p_1 => $1, ...)
            const keys = Object.keys(args);
            const placeholders = keys.map((k, i) => `${k} => $${i + 1}`).join(', ');
            const querySql = `select * from public.${name}(${placeholders});`;
            const params = keys.map((k) => args[k]);

            const result = await db.transaction(async (tx) => {
              if (auth.role === 'service_role' || !userId) {
                await tx.exec(`
                  set local "request.jwt.claim.sub" = '';
                  set local "request.jwt.claims" = '{}';
                  set local role service_role;
                `);
              } else {
                await tx.exec(`
                  set local "request.jwt.claim.sub" = '${userId}';
                  set local "request.jwt.claims" = '${JSON.stringify({ sub: userId, email: userEmail })}';
                  set local role authenticated;
                `);
              }
              return tx.query(querySql, params);
            });

            // Si la función devuelve un escalar o jsonb directo (campo único con el nombre de la función)
            const isScalar =
              result.fields.length === 1 && result.fields[0].name === name;
            let data;
            if (isScalar) {
              data = result.rows[0] ? result.rows[0][name] : null;
            } else {
              // Devuelve conjunto de registros / filas de tabla (ej. list_staff_for_login, claim_print_jobs)
              data = result.rows || [];
            }
            return res.end(JSON.stringify({ data }));
          }

          res.statusCode = 404;
          return res.end(JSON.stringify({ error: 'Ruta no encontrada en PGlite API' }));
        } catch (err) {
          console.error('[PGlite Server Error]:', err);
          res.statusCode = 500;
          return res.end(JSON.stringify({ error: err.message || 'Error en PGlite' }));
        }
      });
    }
  };
}
