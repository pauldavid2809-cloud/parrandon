# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Asistentes y compradores** (familias de las parroquias de Maracaibo y el Zulia, muchas personas mayores): tienen en la mano una entrada física con QR. La escanean con la cámara del teléfono para activarla, reportar el pago y escoger su mesa.
- **Vendedores**: los seminaristas del Seminario Mayor Santo Tomás de Aquino (6 entradas cada uno), el Padre Jorge y las parroquias a las que administración asigna lotes.
- **Personal de la noche**: puerta (escanea y deja pasar), cocina (despacha platos por mesa), taquilla (vende entradas del lote de taquilla). Trabajan de noche, al aire libre, con teléfonos o tabletas.
- **Administración**: verifica pagos, asigna lotes, mueve gente de mesa y configura el evento.

## Product Purpose

Controlar las 500 entradas físicas del Parrandón Navideño 2026 de principio a fin: quién tiene cada lote, quién pagó (Zelle o Pago Móvil), en qué mesa se sienta cada persona, quién entró y a qué mesa ya se le sirvió el plato. Éxito = nadie entra sin pagar, ninguna mesa pasa de 10 personas y la cocina despacha mesa por mesa sin adivinar.

## Positioning

Entrada de papel con QR que se activa al escanearla: el papel es la credencial, la web hace la verificación y la elección de mesa. No hay venta online de entradas.

## Operating Context

- Evento: viernes 11 de diciembre de 2026, 6:00 p. m. – 1:00 a. m., Bulevar del Seminario Mayor Santo Tomás de Aquino, Maracaibo.
- 50 mesas de 10 puestos en 5 sectores (A–E) a lo largo del bulevar: tarima de gaitas al inicio (frente al Sector A), baranda negra a la izquierda, muro gris a la derecha, bazar cerca del Sector D, giro a la derecha al final (Sector E).
- Pagos: Zelle y Pago Móvil (taquilla también acepta efectivo en dólares). Precio único $20, incluye plato navideño. Bolívares a la tasa oficial del día.
- Estados de una entrada: sin vender → por verificar (pago reportado, mesa apartada) → activa (pago verificado). Puede anularse.
- El comprador puede cambiar de mesa hasta el día anterior al evento.

## Capabilities and Constraints

- Next.js 16 (App Router) en Vercel; datos en Supabase. Las tablas de entradas solo se leen con la clave de servicio del servidor; el repositorio es público, así que los códigos de las entradas nunca se guardan en el repositorio.
- Sin WhatsApp automático para entradas.
- Donaciones sin entrada siguen existiendo (órdenes de donación).

## Brand Commitments

- Nombre: “Parrandón Navideño 2026”, del Seminario Mayor Santo Tomás de Aquino. Logo del seminario en `public/images/seminario-logo.png`.
- Dirección elegida por el usuario: Navidad zuliana cálida, clara: fondo crema, rojo navideño, verde pino y dorado; tipografía editorial; detalles de gaita.
- Voz: cercana, católica, zuliana, sin exageraciones de mercadeo.

## Evidence on Hand

- Fotos propias en `public/images/` (ambiente de gala, gaitas en vivo, bazar navideño, plato navideño, comunidad del seminario).
- Directorio oficial de seminaristas en `src/lib/seminaristas.ts`.
- No hay testimonios ni cifras de ediciones anteriores: no inventarlos.

## Product Principles

1. El papel manda: todo flujo empieza por escanear la entrada física.
2. Una mesa nunca pasa de 10 personas, aunque muchos elijan al mismo tiempo.
3. Cada pago se verifica una vez y queda rastro de quién lo reportó y quién lo aprobó.
4. Las pantallas de la noche se leen de un vistazo, con una mano, a oscuras.

## Accessibility & Inclusion

Público con muchas personas mayores: texto grande, alto contraste, botones amplios, español claro sin jerga técnica.
