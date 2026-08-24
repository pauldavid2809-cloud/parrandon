-- ==============================================================================
-- SCHEMA SQL PARA SUPABASE (PARRANDÓN NAVIDEÑO 2026)
-- Seminario Mayor Santo Tomás de Aquino
-- ==============================================================================

-- 1. Tabla para la Configuración Global del Evento
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
    description TEXT DEFAULT 'Una noche inolvidable en el Bulevar del Seminario Santo Tomás de Aquino de Maracaibo: gaitas en vivo, villancicos, bazar navideño, rifas y plato navideño completo.',
    includes_meal BOOLEAN DEFAULT TRUE,
    meal_name TEXT DEFAULT 'Plato Navideño Tradicional Completo',
    announcement TEXT DEFAULT '¡Preventa activa! 50 mesas numeradas en el Bulevar. Elige tu mesa y sillas hoy.',
    payment_details JSONB DEFAULT '{
        "pagoMovil": {
            "bank": "0102 - Banco de Venezuela",
            "phone": "0414-7001122",
            "docId": "J-30456789-0",
            "holder": "Seminario Santo Tomás de Aquino"
        },
        "zelle": {
            "email": "parrandonseminariosta@gmail.com",
            "holder": "Seminario Santo Tomás de Aquino"
        },
        "binance": {
            "payId": "89342019",
            "email": "pagosbinance.seminario@gmail.com",
            "network": "USDT (BEP20 / TRC20)",
            "address": "0x71C28B89a42f5348911F7Db463Ab35f37E5a7201"
        },
        "cash": {
            "location": "Oficina de Administración del Seminario y Parroquias Asignadas",
            "schedule": "Lunes a Domingo con los Seminaristas"
        },
        "paypal": {
            "clientId": "BAAycXcLnxs_Yony3FAFx25j6r-6tmdRUKdvVQgyPb-6VTIgWmsgSBjWzNZtdy9TzJn5pnKaGEIUtfCVyg",
            "paymentLink": "https://www.paypal.com/ncp/links/7Q68BFZ87W9QG",
            "buttonId": "7Q68BFZ87W9QG"
        }
    }'::jsonb,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insertar configuración inicial si no existe
INSERT INTO public.event_config (id)
VALUES (1)
ON CONFLICT (id) DO NOTHING;

-- 2. Tabla Principal de Órdenes y Ventas
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

-- Índices para búsquedas rápidas (por ID, cédula, teléfono y estatus)
CREATE INDEX IF NOT EXISTS idx_orders_buyer_phone ON public.orders(buyer_phone);
CREATE INDEX IF NOT EXISTS idx_orders_buyer_doc_id ON public.orders(buyer_doc_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);

-- 3. Habilitar RLS (Row Level Security) con acceso público/anon para consultas y creación
ALTER TABLE public.event_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access on event_config"
    ON public.event_config FOR SELECT USING (true);

CREATE POLICY "Allow service/anon write access on event_config"
    ON public.event_config FOR ALL USING (true);

CREATE POLICY "Allow public read access on orders"
    ON public.orders FOR SELECT USING (true);

CREATE POLICY "Allow public insert and update on orders"
    ON public.orders FOR ALL USING (true);

-- 4. Crear Bucket de Storage para Comprobantes de Pago
INSERT INTO storage.buckets (id, name, public)
VALUES ('comprobantes', 'comprobantes', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Allow public uploads to comprobantes bucket"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'comprobantes');

CREATE POLICY "Allow public view from comprobantes bucket"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'comprobantes');
