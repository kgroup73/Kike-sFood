-- ==============================================================================
-- SCHEMA MULTI-TENANT PARA KIKE'S FOOD / GOURMET POS & KDS (SUPABASE POSTGRESQL)
-- ==============================================================================
-- Este script crea la arquitectura completa para operar como un SaaS:
-- 1. Soporte Multi-restaurante (Multi-tenancy por tenant_id y slug de URL)
-- 2. Diferenciación de Planes SaaS (Básico, Intermedio, Premium)
-- 3. Sincronización en tiempo real (WebSockets para Cocina KDS y Meseros)
-- 4. Políticas de Seguridad RLS (Row Level Security)
-- ==============================================================================

-- Habilitar extensión UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------------------------------------------
-- 1. TABLA: RESTAURANTES (TENANTS)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug VARCHAR(60) UNIQUE NOT NULL, -- ej: 'trattoria', 'kikes-food'
    name VARCHAR(120) NOT NULL,
    nit VARCHAR(30),
    dv VARCHAR(2),
    address VARCHAR(200),
    city VARCHAR(60) DEFAULT 'Medellín',
    phone VARCHAR(30),
    email VARCHAR(100),
    plan VARCHAR(20) NOT NULL DEFAULT 'basic' CHECK (plan IN ('basic', 'intermedio', 'premium')),
    dian_prefix VARCHAR(10) DEFAULT 'SETP',
    dian_resolution VARCHAR(80) DEFAULT 'Resolución DIAN No. 18764000001',
    currency VARCHAR(10) DEFAULT 'COP',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 2. TABLA: MESAS Y CONFIGURACIÓN NFC
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS restaurant_tables (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    table_number VARCHAR(20) NOT NULL, -- '1', '2', 'VIP-1', 'Terraza-3'
    qr_token VARCHAR(100) DEFAULT uuid_generate_v4()::text,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tenant_id, table_number)
);

-- ------------------------------------------------------------------------------
-- 3. TABLA: CATEGORÍAS DEL MENÚ
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(80) NOT NULL,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tenant_id, name)
);

-- ------------------------------------------------------------------------------
-- 4. TABLA: PLATILLOS / PRODUCTOS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    name VARCHAR(120) NOT NULL,
    category_name VARCHAR(80),
    description TEXT,
    price NUMERIC(12, 2) NOT NULL CHECK (price >= 0),
    image TEXT,
    is_chef BOOLEAN DEFAULT false,
    is_veg BOOLEAN DEFAULT false,
    is_gf BOOLEAN DEFAULT false,
    is_popular BOOLEAN DEFAULT false,
    available BOOLEAN DEFAULT true,
    ingredients TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 5. TABLA: INVENTARIO DE MATERIAS PRIMAS (CONTROL DE DESABASTECIMIENTO)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ingredients_stock (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    ingredient_key VARCHAR(100) NOT NULL,
    name VARCHAR(100) NOT NULL,
    is_sold_out BOOLEAN DEFAULT false,
    note TEXT,
    reported_by VARCHAR(80) DEFAULT 'Cocina',
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tenant_id, ingredient_key)
);

-- ------------------------------------------------------------------------------
-- 6. TABLA: COMANDAS / PEDIDOS (EN TIEMPO REAL CON COCINA KDS)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS orders (
    id BIGSERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    table_number VARCHAR(20) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'Pendiente' CHECK (status IN ('Pendiente', 'En Preparación', 'Por Cobrar', 'Cobrado', 'Cancelado')),
    subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0,
    tip NUMERIC(12, 2) NOT NULL DEFAULT 0,
    total NUMERIC(12, 2) NOT NULL DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 7. TABLA: DETALLE DE COMANDA (ITEMS)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    name VARCHAR(120) NOT NULL,
    quantity INT NOT NULL CHECK (quantity > 0),
    unit_price NUMERIC(12, 2) NOT NULL CHECK (unit_price >= 0),
    total_price NUMERIC(12, 2) NOT NULL CHECK (total_price >= 0),
    selected_options TEXT[] DEFAULT '{}'
);

-- ------------------------------------------------------------------------------
-- 8. TABLA: LLAMADOS AL MESERO EN TIEMPO REAL
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS waiter_calls (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    table_number VARCHAR(20) NOT NULL,
    reason VARCHAR(80) NOT NULL,
    sub_option VARCHAR(80),
    note TEXT,
    dian_data JSONB,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'attending', 'completed')),
    waiter_name VARCHAR(80),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 9. TABLA: HISTORIAL DE DESABASTECIMIENTO / AGOTAMIENTOS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS stock_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('AGOTADO', 'REPUESTO')),
    ingredient VARCHAR(100) NOT NULL,
    missing_ingredients TEXT[] DEFAULT '{}',
    affected_products TEXT[] DEFAULT '{}',
    note TEXT,
    reported_by VARCHAR(80) DEFAULT 'Cocina',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 10. ACTIVAR PUBLICACIÓN EN TIEMPO REAL (WEBSOCKETS DE SUPABASE)
-- ------------------------------------------------------------------------------
-- Permite que la pantalla de cocina (KDS), el POS y el cliente escuchen cambios
-- sin necesidad de recargar la página (idempotente):
DO $$ 
BEGIN
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE orders;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE waiter_calls;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE ingredients_stock;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE stock_events;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
END $$;

-- ------------------------------------------------------------------------------
-- 11. POLÍTICAS DE SEGURIDAD ROW LEVEL SECURITY (RLS)
-- ------------------------------------------------------------------------------
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurant_tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingredients_stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE waiter_calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_events ENABLE ROW LEVEL SECURITY;

-- Limpieza preventiva de políticas para permitir re-ejecución del script
DROP POLICY IF EXISTS "Lectura pública de restaurantes activos" ON tenants;
DROP POLICY IF EXISTS "Lectura pública de mesas activas" ON restaurant_tables;
DROP POLICY IF EXISTS "Lectura pública de categorías" ON categories;
DROP POLICY IF EXISTS "Lectura pública de productos disponibles" ON products;
DROP POLICY IF EXISTS "Lectura pública de stock de ingredientes" ON ingredients_stock;
DROP POLICY IF EXISTS "Comensal puede crear pedido" ON orders;
DROP POLICY IF EXISTS "Comensal puede ver estado de su pedido" ON orders;
DROP POLICY IF EXISTS "Comensal puede insertar items de pedido" ON order_items;
DROP POLICY IF EXISTS "Lectura de items de pedidos" ON order_items;
DROP POLICY IF EXISTS "Comensal puede crear llamado a mesero" ON waiter_calls;
DROP POLICY IF EXISTS "Lectura de llamados a mesero" ON waiter_calls;
DROP POLICY IF EXISTS "Staff puede actualizar llamado a mesero" ON waiter_calls;
DROP POLICY IF EXISTS "Staff puede actualizar órdenes" ON orders;
DROP POLICY IF EXISTS "Lectura pública de eventos de stock" ON stock_events;
DROP POLICY IF EXISTS "Staff puede insertar eventos de stock" ON stock_events;

-- Políticas públicas de lectura para comensales en mesa (Menú, productos e insumos):
CREATE POLICY "Lectura pública de restaurantes activos" ON tenants
    FOR SELECT USING (is_active = true);

CREATE POLICY "Lectura pública de mesas activas" ON restaurant_tables
    FOR SELECT USING (is_active = true);

CREATE POLICY "Lectura pública de categorías" ON categories
    FOR SELECT USING (true);

CREATE POLICY "Lectura pública de productos disponibles" ON products
    FOR SELECT USING (available = true);

CREATE POLICY "Lectura pública de stock de ingredientes" ON ingredients_stock
    FOR SELECT USING (true);

-- Políticas para pedidos desde mesa (Insertar orden y sus items de forma anónima desde mesa):
CREATE POLICY "Comensal puede crear pedido" ON orders
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Comensal puede ver estado de su pedido" ON orders
    FOR SELECT USING (true);

CREATE POLICY "Comensal puede insertar items de pedido" ON order_items
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Lectura de items de pedidos" ON order_items
    FOR SELECT USING (true);

CREATE POLICY "Comensal puede crear llamado a mesero" ON waiter_calls
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Lectura de llamados a mesero" ON waiter_calls
    FOR SELECT USING (true);

CREATE POLICY "Staff puede actualizar llamado a mesero" ON waiter_calls
    FOR UPDATE USING (true);

CREATE POLICY "Staff puede actualizar órdenes" ON orders
    FOR UPDATE USING (true);

CREATE POLICY "Lectura pública de eventos de stock" ON stock_events
    FOR SELECT USING (true);

CREATE POLICY "Staff puede insertar eventos de stock" ON stock_events
    FOR INSERT WITH CHECK (true);

-- ------------------------------------------------------------------------------
-- 12. DATOS SEMILLA (SEED DATA) DE PRUEBA: "LA TRATTORIA GOURMET"
-- ------------------------------------------------------------------------------
INSERT INTO tenants (id, slug, name, nit, dv, address, city, phone, email, plan)
VALUES (
    'a0000000-0000-0000-0000-000000000001',
    'trattoria',
    'La Trattoria Gourmet S.A.S.',
    '901452889',
    '1',
    'Cra 43A # 1-50, El Poblado',
    'Medellín',
    '+57 (4) 444-8899',
    'info@trattoriagourmet.com',
    'premium'
) ON CONFLICT (slug) DO NOTHING;

-- Crear 12 mesas iniciales para la Trattoria
INSERT INTO restaurant_tables (tenant_id, table_number)
SELECT 'a0000000-0000-0000-0000-000000000001', generate_series(1, 12)::text
ON CONFLICT (tenant_id, table_number) DO NOTHING;
