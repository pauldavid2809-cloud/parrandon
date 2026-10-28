# Parrandón Navideño 2026

Sistema de las 500 entradas físicas con QR del Parrandón del Seminario Mayor Santo Tomás de Aquino: activación de cada entrada, verificación de pagos (Zelle y Pago Móvil), elección de mesa, puerta, cocina y taquilla.

## Cómo funciona

1. **Entradas de papel.** Desde Administración se generan las 500 entradas (#001–#500). Cada una tiene un código secreto y un QR que abre `https://parrandon-seven.vercel.app/e/<código>`. Los 39 seminaristas reciben 6 cada uno (#001–#234, en el orden del directorio). El resto se asigna por rangos al Padre Jorge, a las parroquias o a la taquilla.
2. **Venta.** El comprador escanea su QR, escribe sus datos, reporta el pago (Zelle o Pago Móvil con referencia y capture) y escoge su mesa. También puede registrarlo el vendedor desde `/vendedores`. La entrada queda **por verificar** con la mesa apartada.
3. **Verificación.** En `/admin/verificaciones` se aprueba el pago (la entrada queda **activa**) o se rechaza (vuelve a sin vender y se libera la mesa; la persona ve el motivo al escanear).
4. **Mesas.** 50 mesas de 10 puestos. Ninguna pasa de 10 aunque muchos elijan a la vez. Se puede cambiar de mesa hasta el día anterior al evento. Administración puede mover gente, reservar mesas o ponerles nombre.
5. **La noche del evento.**
   - `/puerta`: escanea; si está activa y con mesa, entra de una vez y muestra la mesa en grande. Si llega sin activar, el portero anota los datos, escogen la mesa y entra (queda marcada para revisión).
   - `/cocina`: en vivo quién va llegando y cuántos platos faltan por mesa; «Despachar» sirve a los que ya llegaron (con opción de deshacer).
   - `/taquilla`: vende entradas del lote de taquilla (Pago Móvil, Zelle o efectivo en dólares), asigna mesa y registra la entrada.

Puerta, cocina y taquilla piden un PIN (se define en `/admin/configuracion`). Administración pide la contraseña.

## Puesta en marcha (una sola vez)

1. **Supabase → SQL Editor:** pega y corre [`supabase/entradas.sql`](supabase/entradas.sql). Crea las tablas `entradas`, `mesas`, `parroquias` y `staff_access`, sin acceso público.
2. **Vercel → Settings → Environment Variables:**
   - `SUPABASE_SERVICE_ROLE_KEY` (obligatoria): Supabase → Project Settings → API → `service_role`. Sin ella el servidor no puede leer las entradas.
   - `ADMIN_PASSWORD` (recomendada): la contraseña de administración. Si no se define, sigue siendo la anterior, que es pública en este repositorio.
   - `SESSION_SECRET` (opcional): una frase larga al azar para firmar las sesiones.
   - `NEXT_PUBLIC_SITE_URL` (opcional): dominio que va dentro del QR. Por defecto `https://parrandon-seven.vercel.app`. **No cambiarlo después de imprimir.**
3. Vuelve a desplegar en Vercel.
4. Entra a `/admin`, pulsa **Generar entradas**, define los PIN en Configuración y revisa los datos de Zelle y Pago Móvil.
5. En `/admin/entradas` descarga el **PDF para imprenta** (4 entradas por hoja A4, QR vectorial) o el **CSV con códigos** si la imprenta hace la impresión de datos variables.

> El repositorio es público: los códigos de las entradas solo existen en Supabase. Guarda el PDF y el CSV en un lugar privado; quien tenga un QR puede activar esa entrada.

## Desarrollo local

```bash
npm install
PARRANDON_LOCAL_DB=1 npm run dev
```

Con `PARRANDON_LOCAL_DB=1` todo se guarda en `.data/` (sin Supabase). La contraseña de administración por defecto funciona en local.

## Diseño

La dirección visual y sus reglas están en [`DESIGN.md`](DESIGN.md) y el contexto del producto en [`PRODUCT.md`](PRODUCT.md). La skill de diseño [impeccable](https://impeccable.style) está instalada en `.claude/skills/impeccable`.
