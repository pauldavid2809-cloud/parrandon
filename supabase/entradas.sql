-- ==============================================================================
-- PARRANDÓN NAVIDEÑO 2026 · Entradas físicas con QR
-- Copia todo este archivo en Supabase → SQL Editor → Run.
-- Es lo único que hay que correr (no hace falta schema.sql) y se puede correr
-- más de una vez sin dañar datos.
--
-- IMPORTANTE: estas tablas NO tienen acceso público. Solo el servidor las lee
-- con la clave de servicio (SUPABASE_SERVICE_ROLE_KEY en Vercel). Así nadie puede
-- descargar los códigos secretos de las 500 entradas.
-- ==============================================================================

-- 0. Tablas base del sitio: configuración del evento (incluye los datos de Zelle y
--    Pago Móvil que ven los compradores) y donaciones. Si ya existen, no se tocan.
CREATE TABLE IF NOT EXISTS public.event_config (
    id INT PRIMARY KEY DEFAULT 1,
    event_name TEXT NOT NULL DEFAULT 'Parrandón Navideño 2026',
    subtitle TEXT DEFAULT 'Seminario Mayor Santo Tomás de Aquino',
    edition TEXT DEFAULT 'Gran Fiesta Tradicional y Familiar',
    date TEXT DEFAULT 'Sábado, 12 de Diciembre de 2026',
    time TEXT DEFAULT '06:00 PM - 01:00 AM',
    venue TEXT DEFAULT 'Bulevar del Seminario Mayor Santo Tomás de Aquino',
    venue_address TEXT DEFAULT 'Sede del Seminario Santo Tomás de Aquino, Maracaibo, Estado Zulia',
    total_quota INT DEFAULT 500,
    total_tables INT DEFAULT 50,
    seats_per_table INT DEFAULT 10,
    ticket_price_usd NUMERIC DEFAULT 20.00,
    child_ticket_price_usd NUMERIC DEFAULT 10.00,
    current_rate_bs NUMERIC DEFAULT 897.82,
    description TEXT,
    includes_meal BOOLEAN DEFAULT TRUE,
    meal_name TEXT DEFAULT 'Plato Navideño Tradicional Completo',
    announcement TEXT,
    -- Vacío hasta que se guarden en Administración → Configuración.
    payment_details JSONB,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO public.event_config (id) VALUES (1)
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.orders (
    id TEXT PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    buyer_name TEXT NOT NULL,
    buyer_email TEXT DEFAULT '',
    buyer_phone TEXT NOT NULL,
    buyer_doc_id TEXT DEFAULT '',
    quantity INT NOT NULL,
    seats JSONB DEFAULT '[]'::jsonb,
    attendees JSONB DEFAULT '[]'::jsonb,
    payment_method TEXT NOT NULL,
    payment_reference TEXT DEFAULT 'N/A',
    payment_proof_url TEXT,
    amount_paid NUMERIC NOT NULL,
    currency TEXT NOT NULL,
    converted_usd NUMERIC NOT NULL,
    rate_applied NUMERIC,
    status TEXT NOT NULL DEFAULT 'pending',
    sales_channel TEXT NOT NULL DEFAULT 'online',
    seller_name TEXT,
    parish_name TEXT,
    rejection_reason TEXT,
    verified_at TIMESTAMPTZ,
    verified_by TEXT,
    notes TEXT,
    tickets JSONB DEFAULT '[]'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);

-- Solo el servidor escribe. La configuración se puede leer (no tiene datos privados).
ALTER TABLE public.event_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read access on event_config" ON public.event_config;
CREATE POLICY "Allow public read access on event_config"
    ON public.event_config FOR SELECT USING (true);

-- 1. Fecha del evento en formato máquina (para cerrar cambios de mesa ese día)
ALTER TABLE public.event_config
  ADD COLUMN IF NOT EXISTS event_date_iso DATE DEFAULT '2026-12-12';

-- 2. Mesas del bulevar (50 mesas de 10 puestos)
CREATE TABLE IF NOT EXISTS public.mesas (
    id TEXT PRIMARY KEY,
    sector TEXT NOT NULL,
    number INT NOT NULL,
    capacity INT NOT NULL DEFAULT 10,
    label TEXT,
    blocked BOOLEAN NOT NULL DEFAULT FALSE
);

INSERT INTO public.mesas (id, sector, number)
SELECT s.sector || n.num, s.sector, n.num
FROM (VALUES ('A'), ('B'), ('C'), ('D'), ('E')) AS s(sector)
CROSS JOIN generate_series(1, 10) AS n(num)
ON CONFLICT (id) DO NOTHING;

-- 3. Parroquias que reciben lotes de entradas
CREATE TABLE IF NOT EXISTS public.parroquias (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    contact TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Las entradas físicas (se generan desde Administración → Entradas)
CREATE TABLE IF NOT EXISTS public.entradas (
    code TEXT PRIMARY KEY,
    number INT NOT NULL UNIQUE,
    holder_type TEXT NOT NULL DEFAULT 'sin_asignar',
    holder_id TEXT,
    holder_name TEXT,
    status TEXT NOT NULL DEFAULT 'sin_vender',
    attendee_name TEXT,
    attendee_first_name TEXT,
    attendee_last_name TEXT,
    attendee_cedula TEXT,
    attendee_phone TEXT,
    table_id TEXT REFERENCES public.mesas(id),
    payment_method TEXT,
    payment_reference TEXT,
    payment_proof_url TEXT,
    amount NUMERIC,
    currency TEXT,
    rate_applied NUMERIC,
    reported_by TEXT,
    reported_at TIMESTAMPTZ,
    verified_at TIMESTAMPTZ,
    verified_by TEXT,
    rejection_reason TEXT,
    door_activated BOOLEAN NOT NULL DEFAULT FALSE,
    checked_in_at TIMESTAMPTZ,
    checked_in_by TEXT,
    meal_served_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Nombre, apellido y cédula por separado (para bases creadas antes de este cambio)
ALTER TABLE public.entradas
  ADD COLUMN IF NOT EXISTS attendee_first_name TEXT,
  ADD COLUMN IF NOT EXISTS attendee_last_name TEXT,
  ADD COLUMN IF NOT EXISTS attendee_cedula TEXT;

CREATE INDEX IF NOT EXISTS idx_entradas_table ON public.entradas(table_id);
CREATE INDEX IF NOT EXISTS idx_entradas_status ON public.entradas(status);
CREATE INDEX IF NOT EXISTS idx_entradas_holder ON public.entradas(holder_type, holder_id);
CREATE INDEX IF NOT EXISTS idx_entradas_checkin ON public.entradas(checked_in_at DESC);

-- 5. PIN de cada área de trabajo (se definen desde Administración → Configuración)
CREATE TABLE IF NOT EXISTS public.staff_access (
    role TEXT PRIMARY KEY,
    pin TEXT
);

INSERT INTO public.staff_access (role) VALUES ('puerta'), ('cocina'), ('taquilla')
ON CONFLICT (role) DO NOTHING;

-- 6. Seguridad: RLS activo y SIN políticas públicas → solo la clave de servicio entra.
ALTER TABLE public.mesas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parroquias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entradas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_access ENABLE ROW LEVEL SECURITY;

-- 7. Apartar una mesa sin pasarse de 10 personas, aunque muchos elijan a la vez.
--    Bloquea la fila de la mesa, cuenta los puestos ocupados y asigna.
CREATE OR REPLACE FUNCTION public.claim_table(p_code TEXT, p_table TEXT, p_force BOOLEAN DEFAULT FALSE)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    v_capacity INT;
    v_blocked BOOLEAN;
    v_status TEXT;
    v_current TEXT;
    v_taken INT;
BEGIN
    SELECT capacity, blocked INTO v_capacity, v_blocked
    FROM public.mesas WHERE id = p_table FOR UPDATE;
    IF NOT FOUND THEN
        RETURN 'mesa_no_existe';
    END IF;

    SELECT status, table_id INTO v_status, v_current
    FROM public.entradas WHERE code = p_code FOR UPDATE;
    IF NOT FOUND THEN
        RETURN 'entrada_no_existe';
    END IF;

    IF v_status NOT IN ('por_verificar', 'activa') THEN
        RETURN 'entrada_no_activa';
    END IF;

    IF v_current = p_table THEN
        RETURN 'ok';
    END IF;

    IF NOT p_force THEN
        IF v_blocked THEN
            RETURN 'mesa_bloqueada';
        END IF;

        SELECT COUNT(*) INTO v_taken
        FROM public.entradas
        WHERE table_id = p_table
          AND status IN ('por_verificar', 'activa')
          AND code <> p_code;

        IF v_taken >= v_capacity THEN
            RETURN 'mesa_llena';
        END IF;
    END IF;

    UPDATE public.entradas
    SET table_id = p_table, updated_at = NOW()
    WHERE code = p_code;

    RETURN 'ok';
END;
$$;

REVOKE ALL ON FUNCTION public.claim_table(TEXT, TEXT, BOOLEAN) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_table(TEXT, TEXT, BOOLEAN) TO service_role;

-- 8. Cerrar las tablas anteriores a la clave pública.
--    La clave "anon" está en el código (que es público): con ella cualquiera podía
--    cambiar los datos de Zelle/Pago Móvil que ven los compradores, o crear y aprobar
--    órdenes. Desde ahora solo el servidor (clave de servicio) escribe en ellas.
--    La configuración se sigue pudiendo leer (no tiene datos privados).
DROP POLICY IF EXISTS "Allow service/anon write access on event_config" ON public.event_config;
DROP POLICY IF EXISTS "Allow public read access on orders" ON public.orders;
DROP POLICY IF EXISTS "Allow public insert and update on orders" ON public.orders;

DO $$
BEGIN
    -- Los capture se suben desde el servidor; nadie más necesita subir archivos.
    DROP POLICY IF EXISTS "Allow public uploads to comprobantes bucket" ON storage.objects;
EXCEPTION WHEN others THEN
    RAISE NOTICE 'No se pudo cambiar la política de storage: %', SQLERRM;
END $$;
