---
name: Parrandón Navideño 2026
description: Navidad zuliana cálida, clara. La entrada de papel y el bulevar como protagonistas.
colors:
  paper: "#fbf4e6"
  paper-2: "#f3e6cc"
  paper-3: "#e8d6b4"
  card: "#fffaf0"
  line: "#dfccaa"
  ink: "#2a1a12"
  ink-2: "#5e4636"
  ink-3: "#7a6152"
  rojo: "#b3122e"
  rojo-2: "#8f0e24"
  rojo-soft: "#f7dcd6"
  verde: "#1f5a3d"
  verde-2: "#154530"
  verde-soft: "#dbeadb"
  oro: "#c99a2e"
  oro-ink: "#86600f"
  oro-soft: "#f6e7bf"
  noche: "#1a120d"
  noche-2: "#261a13"
  noche-3: "#3a2a20"
typography:
  display:
    fontFamily: "Young Serif, Georgia, serif"
    fontSize: "5.6rem"
    fontWeight: 400
    lineHeight: 0.95
    letterSpacing: "-0.02em"
  heading:
    fontFamily: "Young Serif, Georgia, serif"
    fontSize: "3rem"
    fontWeight: 400
    lineHeight: 1.1
  body:
    fontFamily: "Red Hat Text, system-ui, sans-serif"
    fontSize: "1.0625rem"
    fontWeight: 400
    lineHeight: 1.55
  label:
    fontFamily: "Red Hat Text, system-ui, sans-serif"
    fontSize: "0.95rem"
    fontWeight: 700
    lineHeight: 1.3
rounded:
  sm: "8px"
  md: "12px"
  lg: "16px"
  full: "999px"
spacing:
  xs: "8px"
  sm: "12px"
  md: "16px"
  lg: "24px"
  xl: "40px"
  section: "96px"
components:
  button-primary:
    backgroundColor: "{colors.rojo}"
    textColor: "{colors.paper}"
    rounded: "{rounded.md}"
    padding: "0 20px"
    height: "48px"
  button-primary-hover:
    backgroundColor: "{colors.rojo-2}"
  button-verde:
    backgroundColor: "{colors.verde}"
    textColor: "{colors.paper}"
    rounded: "{rounded.md}"
    height: "48px"
  button-outline:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    height: "48px"
  input:
    backgroundColor: "{colors.card}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    height: "48px"
    padding: "0 16px"
  card:
    backgroundColor: "{colors.card}"
    rounded: "{rounded.lg}"
    padding: "20px"
  pill-activa:
    backgroundColor: "{colors.verde-soft}"
    textColor: "{colors.verde-2}"
    rounded: "{rounded.full}"
  pill-por-verificar:
    backgroundColor: "{colors.oro-soft}"
    textColor: "{colors.oro-ink}"
    rounded: "{rounded.full}"
---

# Parrandón Navideño 2026

## Overview

Una entrada de papel con su QR es el objeto central: la web se construye con su lenguaje (papel crema, talón troquelado, número grande) y con el plano del Bulevar del Seminario. La Navidad zuliana entra por campos completos de rojo navideño y verde pino, dorado como adorno, y la Young Serif con su peso de carátula de disco de gaitas de los setenta.

Las superficies públicas (inicio, activar, mi entrada) son cálidas y amplias. Las de trabajo (puerta, cocina, taquilla, administración) usan el mismo mundo con restricción: tipografía, paleta y un gesto propio, controles de siempre.

## Colors

### Primary
Rojo navideño `#b3122e`: acción principal, campo del inicio, mesa elegida en el croquis, barra de taquilla.

### Secondary
Verde pino `#1f5a3d`: confirmaciones (entrada activa, “Adelante”), pie de página y riel de administración.

### Tertiary
Dorado `#c99a2e`: filetes, faroles del croquis, foco del teclado, pago por verificar. Nunca como texto sobre rojo (contraste 2.7:1). Para texto dorado sobre papel usar `oro-ink`.

### Neutral
Papel crema `#fbf4e6` de fondo, `card` para superficies elevadas, tinta marrón `#2a1a12` para texto. `noche` para la pantalla de puerta (se usa de noche, al aire libre).

### Named Rules
- **La regla del campo:** el color ocupa regiones completas (un campo rojo, un riel verde), no acentos sueltos.
- **Estado con nombre:** activa = verde, por verificar = dorado, sin vender = papel, anulada/llena = rojo o tinta. Siempre con texto, nunca solo color.

## Typography

Young Serif (un solo peso) para títulos, números de entrada y de mesa. Red Hat Text para todo lo demás: abierta y legible en teléfonos de noche; sus números no llevan cero tachado.

### Hierarchy
- Display: 3.4–5.6rem, solo el nombre del evento.
- Títulos de sección: 2.25–3rem.
- Número de mesa en puerta y taquilla: 5–5.5rem, para leerse a un brazo de distancia.
- Cuerpo: 17px; etiquetas en negrita 15px.

## Layout

Columnas de máximo 72rem. En pantallas anchas, el croquis va en una columna de 30rem con la información fija a la izquierda. En el teléfono todo es una sola columna y las acciones principales quedan fijas abajo sobre fondo opaco.

## Elevation & Depth

### Shadow Vocabulary
- `shadow-soft`: tarjetas y tablas (sombra cálida, corta).
- `shadow-ticket`: la entrada, barras de confirmación y paneles que flotan.

Sin sombras duras desplazadas ni brillos de color.

## Shapes

Esquinas de 12–16px; pastillas totalmente redondas para estados. El borde troquelado (línea punteada con muescas semicirculares) separa el talón de la entrada y las secciones de un comprobante. El campo rojo del inicio termina en festón.

## Components

### Buttons
Rojo para la acción principal, verde para confirmar algo positivo (despachar, activar), contorno para la secundaria, “quiet” para terciarias. Alto 48px (56px en acciones de puerta y taquilla).

### Inputs / Fields
Fondo `card`, borde `line` de 2px que pasa a tinta al enfocar; etiqueta en negrita encima, ayuda en `ink-3`, error en rojo debajo.

### Navigation
Barra superior en papel (en rojo sobre el inicio). Administración con riel verde a la izquierda; en el teléfono se vuelve una fila deslizable.

### Croquis del bulevar (componente propio)
SVG del bulevar: tarima roja con faldón al inicio, baranda negra con faroles a la izquierda, muro con jardines a la derecha, luces de Navidad entre sectores, toldo del bazar junto al Sector D y el giro final. Mesas redondas: borde verde con puestos, dorado si quedan 3 o menos, tinta “Llena”, roja la elegida, verde la propia.

### Entrada (componente propio)
Cuerpo con título rojo, filete dorado, fecha/hora/lugar y número grande; talón troquelado con el QR. Es la misma composición que el PDF de imprenta.

## Do's and Don'ts

### Do:
- Mostrar el número de mesa enorme cuando la persona lo necesita (puerta, taquilla, su entrada).
- Escribir en español claro y cercano; los botones dicen lo que hacen.
- Mantener las acciones fijas abajo en el teléfono con fondo opaco.

### Don't:
- No poner etiquetas pequeñas en mayúsculas encima de los títulos.
- No usar degradados en texto, vidrio decorativo ni sombras de neón.
- No poner texto dorado sobre rojo.
- No volver a mostrar sillas: se elige mesa, no puesto.
