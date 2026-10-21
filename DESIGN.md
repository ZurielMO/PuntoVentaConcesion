---
name: Servicio Palcos · Club León
description: Storefront del aficionado para pedir comida y bebida con entrega en palco en el Estadio León.
colors:
  leon-deep: "#062e20"
  leon-night: "#041f16"
  leon-shell-raised: "#0a3a29"
  action-green: "#0d4a34"
  action-green-hover: "#145c42"
  positive-green: "#1b7350"
  green-tint: "#e1eee6"
  green-wash: "#eff6f1"
  palco-gold: "#e6c687"
  palco-gold-strong: "#d4ac5c"
  gold-ink: "#74561c"
  ink: "#0f1a15"
  ink-secondary: "#39443e"
  ink-tertiary: "#5c6862"
  on-dark: "#f4f1e8"
  on-dark-secondary: "#b8c9c0"
  warm-ground: "#f5f4ef"
  surface: "#ffffff"
  sunken: "#eeede7"
  hairline: "#e2e3dd"
  hairline-strong: "#c9ccc4"
  field-border: "#858e88"
  live-signal: "#5ed292"
  danger: "#b3261e"
  danger-wash: "#fcedeb"
  warning: "#845000"
  warning-wash: "#fff2d9"
typography:
  display:
    fontFamily: "Montserrat, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.625rem"
    fontWeight: 800
    lineHeight: 1.08
    letterSpacing: "-0.03em"
  headline:
    fontFamily: "Montserrat, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.015em"
  title:
    fontFamily: "Montserrat, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 700
    lineHeight: 1.3
  price:
    fontFamily: "Montserrat, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 700
    fontFeature: "\"tnum\" 1"
  body:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 600
    lineHeight: 1.3
  guide-code:
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace"
    fontSize: "1.0625rem"
    fontWeight: 600
    letterSpacing: "0.14em"
rounded:
  sm: "10px"
  md: "14px"
  lg: "20px"
  xl: "28px"
  full: "9999px"
spacing:
  gutter-mobile: "16px"
  gutter-desktop: "24px"
  card-padding: "16px"
  card-padding-desktop: "24px"
  section-gap: "16px"
  catalog-gap: "40px"
components:
  button-primary:
    backgroundColor: "{colors.action-green}"
    textColor: "{colors.surface}"
    rounded: "{rounded.full}"
    height: "48px"
    padding: "0 20px"
  button-primary-hover:
    backgroundColor: "{colors.action-green-hover}"
  button-primary-disabled:
    backgroundColor: "{colors.sunken}"
    textColor: "{colors.ink-tertiary}"
  button-outline:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.full}"
    height: "48px"
  button-gold:
    backgroundColor: "{colors.palco-gold}"
    textColor: "{colors.leon-deep}"
    rounded: "{rounded.full}"
  chip:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.full}"
    height: "40px"
  chip-selected:
    backgroundColor: "{colors.leon-deep}"
    textColor: "{colors.on-dark}"
  card:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.lg}"
    padding: "16px"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    height: "52px"
  top-bar:
    backgroundColor: "{colors.leon-deep}"
    textColor: "{colors.on-dark}"
    height: "56px"
---

# Design System: Servicio Palcos · Club León

Alcance: rutas públicas de `/servicio-palcos` (inicio, menú del establecimiento, carrito y pago, guía de pedido, legales). La introducción animada tiene su propia hoja (`vip-intro-film.css`) y queda fuera de este sistema por contrato. El panel de concesiones y Central conservan su sistema incumbente, que no se documenta aquí.

## Overview

**Creative North Star: "El palco es la dirección de entrega"**

Servicio Palcos se usa de pie o sentado en un palco del Estadio León, con el teléfono en una mano y el partido al frente. Por eso el sistema es el de una app de delivery que ya sabes usar: barra superior con la ubicación, búsqueda, categorías, tarjetas de establecimiento, filas de producto con un "+" a la mano y un carrito que vive bajo el pulgar. Lo que lo vuelve Club León no es ornamento sino tres decisiones: el verde profundo del club como casco de la app, el dorado reservado para lo que es tuyo (tu palco, tu carrito, tu horario) y el palco tratado como dirección de entrega en cada pantalla.

La densidad es de producto, no de portada: el catálogo aparece en el primer pantallazo y la información institucional se queda en la intro. Las superficies son planas y cálidas; la profundidad aparece solo en lo que flota (búsqueda sobre la banda, barra del carrito, hojas y diálogos). Los estados (en vivo, preventa, cerrado, agotado, solo preventa) vienen del backend y se nombran tal cual; nada se estima ni se inventa.

**Key Characteristics:**
- Casco verde León (#062e20) arriba; contenido en blanco cálido.
- Un solo color de acción sobre claro: verde #0d4a34. El dorado vive sobre verde.
- Montserrat para nombres, títulos y precios; Inter para leer.
- Controles en píldora; tarjetas de 20px; fotos de producto sobre blanco.
- Estados honestos: punto vivo, preventa con partido real, avisos que explican por qué algo no se puede.

## Colors

Verde de estadio de noche sobre papel cálido, con un oro que marca lo personal.

### Primary
- **Verde León profundo** (#062e20): barra superior, banda de contexto de inicio, chip seleccionado, boleto de preventa, aviso de cookies. Es el color que dice "esto es del Club León".
- **Verde de acción** (#0d4a34): el único color de botón primario sobre fondos claros (Agregar, Ir a pagar, Consultar, Ver estado del pedido), anillos de foco y casillas marcadas. Hover #145c42.

### Secondary
- **Oro de palco** (#e6c687): solo sobre verde. Contador del carrito, botón del carrito en escritorio cuando tiene productos, ícono del palco guardado, horario del boleto de preventa, mes en las fechas de partido.
- **Tinta dorada** (#74561c): la versión legible del oro sobre claro, para rótulos de fecha.

### Neutral
- **Blanco cálido** (#f5f4ef): fondo de página.
- **Superficie** (#ffffff): tarjetas, hojas, campos.
- **Hundido** (#eeede7): controles segmentados (zona, piso), botones de cierre, esqueletos de carga.
- **Línea** (#e2e3dd) y **línea fuerte** (#c9ccc4): bordes de tarjetas y divisores de filas.
- **Borde de campo** (#858e88): bordes de inputs y casillas (3.4:1 contra blanco, WCAG 1.4.11).
- **Tinta** (#0f1a15), **tinta secundaria** (#39443e), **tinta terciaria** (#5c6862): texto; la terciaria cumple 4.96:1 incluso sobre el hundido.
- **Sobre verde** (#f4f1e8) y **sobre verde secundario** (#b8c9c0): texto en el casco.

### Estado
- **Señal en vivo** (#5ed292): solo el punto de "Entrega inmediata abierta".
- **Peligro** (#b3261e sobre #fcedeb): errores de campo y "Agotado".
- **Aviso** (#845000 sobre #fff2d9): "Solo en preventa", servicio no disponible, pago en validación.

### Named Rules
**The Gold On Green Rule.** El dorado nunca va sobre blanco como texto ni como relleno de botón; sobre claro se usa la tinta dorada.

**The One Action Rule.** Sobre fondos claros hay un solo verde de acción. Los demás botones son contorno o texto.

## Typography

**Display Font:** Montserrat (con ui-sans-serif, system-ui)
**Body Font:** Inter (con ui-sans-serif, system-ui)
**Label/Mono Font:** monoespaciada del sistema, solo para la guía de pedido

**Character:** Montserrat da la voz deportiva y compacta del club en nombres y precios; Inter lee bien en tamaños pequeños bajo la luz del estadio.

### Hierarchy
- **Display** (800, 26–30px en teléfono / 36–44px en escritorio, 1.05–1.1): título de inicio (26px) y de cada establecimiento, titular de confirmación y de estado del pedido.
- **Headline** (700, 20–24px, 1.2): títulos de sección (Establecimientos, Bebidas, Tu pedido, Resumen).
- **Title** (700, 15–17px): nombres de producto y establecimiento, botones.
- **Price** (700, 15px, cifras tabulares): precios, totales, horarios.
- **Body** (400, 15px, 1.5): descripciones, ayudas, avisos.
- **Label** (600, 13–14px): etiquetas de campo, metadatos, pestañas de la barra inferior (11px, el mínimo).

### Named Rules
**The No Kicker Rule.** No hay rótulos en mayúsculas espaciadas sobre los títulos; el título dice lo que es.

**The Tabular Money Rule.** Todo precio, total, cantidad y horario usa cifras tabulares (`.palco-num`).

## Layout

Contenedor de 72rem (max-w-6xl) centrado; márgenes de 16px en teléfono y 24px desde 768px. Inicio: banda verde de contexto, búsqueda montada sobre su borde, chips de categoría fijos bajo la barra superior al desplazarse, cuadrícula de establecimientos (2 columnas en teléfono, 3 en 1024px, 4 en 1280px) y rieles horizontales por categoría. Menú: portada a sangre en teléfono (176px, 208px desde 640px) y redondeada en escritorio (240px), lista de productos en una columna que pasa a dos desde 768px. Checkout: una columna en teléfono con barra de pago fija; desde 1024px, formulario a la izquierda y resumen fijo de 24rem a la derecha. Entre secciones de inicio, 40px; entre tarjetas del checkout, 16px. Sin desbordamiento horizontal de 360px a 1440px.

## Elevation & Depth

Plano en reposo. Las tarjetas se separan del fondo por tono (blanco sobre blanco cálido) y una línea de 1px. La sombra aparece solo en lo que flota sobre el contenido.

### Shadow Vocabulary
- **Raise** (`0 1px 2px rgb(4 31 22 / 0.05), 0 6px 16px -6px rgb(4 31 22 / 0.12)`): hover de tarjetas con puntero fino y los botones "+" sobre fotos.
- **Float** (`0 2px 6px rgb(4 31 22 / 0.1), 0 14px 32px -10px rgb(4 31 22 / 0.35)`): búsqueda sobre la banda, píldora del carrito, aviso de cookies, diálogos en escritorio, toasts.
- **Sheet** (`0 -10px 40px rgb(4 31 22 / 0.18)`): hojas inferiores y la barra de pago fija.

### Named Rules
**The Flat-By-Default Rule.** Nada en reposo lleva sombra salvo lo que de verdad flota. Los anillos de foco (0 0 0 3px verde claro) son estado, no elevación.

## Shapes

Píldora para todo lo que se toca (botones, chips, búsqueda, segmentados, stepper, píldora del carrito). Tarjetas a 20px; fotos de producto y campos a 14px; hojas inferiores a 28px arriba. Las fotos de producto van con `object-contain` sobre blanco y borde de 1px; el arte de los establecimientos llena su marco y, cuando es un logotipo casi cuadrado en un marco ancho, se muestra completo sobre blanco con una línea de 1px, sin desenfoques; el gris (#e9e8e1–#f1f0ea) queda reservado para el esqueleto de carga.

## Components

### Buttons
- **Shape:** píldora (9999px); alturas 44, 48 y 56px.
- **Primary:** verde de acción #0d4a34 con texto blanco, Montserrat 700. Hover #145c42.
- **Hover / Focus:** al presionar baja a 0.97 en 160ms (`--ease-palco-out`); foco con contorno de 2px verde de acción (dorado sobre el casco).
- **Disabled:** fondo hundido y texto terciario: se ve inactivo sin perder legibilidad.
- **Outline / Ghost / Gold:** contorno con línea fuerte para la acción secundaria; ghost para acciones terciarias; dorado solo sobre verde.

### Chips
- **Style:** blanco con línea, ícono gris y conteo de productos en tinta terciaria.
- **State:** seleccionado en verde León con ícono dorado; `aria-pressed`.

### Cards / Containers
- **Corner Style:** 20px.
- **Background:** blanco sobre blanco cálido.
- **Shadow Strategy:** ninguna en reposo; Raise al pasar el puntero.
- **Border:** 1px #e2e3dd.
- **Internal Padding:** 16px en teléfono, 24px desde 640px.

### Inputs / Fields
- **Style:** blanco, borde de 1px #858e88, radio 14px, 52px de alto, texto de 16px (evita el zoom en iOS).
- **Focus:** borde verde de acción y anillo de 3px #e1eee6.
- **Error / Disabled:** borde y mensaje en rojo #b3261e bajo el campo, `aria-invalid` y `aria-describedby`; el pago lleva el foco al primer campo con error.

### Navigation
- **Barra superior:** verde León, 56px (64px en escritorio). Inicio: escudo y "Servicio Palcos", palco de entrega como botón. Interiores: regresar y título. Escritorio: Mi pedido y carrito con conteo y subtotal.
- **Barra inferior (teléfono):** blanca, Menú y Mi pedido como pestañas, y la píldora del carrito a la derecha. Oculta en checkout y Central.

### Píldora del carrito (signature)
Vacía es un contorno discreto; con el primer producto crece hasta ocupar el resto de la barra en verde de acción con el contador dorado y el subtotal. Al agregar, el texto cambia un momento a "✓ Producto" y vuelve a "Ver carrito"; un lector de pantalla lo anuncia. Sustituye al toast de "agregado".

### Hoja de producto
Hoja inferior en el teléfono (se cierra arrastrando, con Escape o tocando fuera) y diálogo en escritorio. Foto del producto sobre blanco, nombre, precio y establecimiento, opciones (radio para una, casillas para varias), indicaciones para cocina o barra según lo que se pide, y una barra fija con cantidad y "Agregar · $total". Atrapa el foco y lo devuelve al cerrar.

## Do's and Don'ts

### Do:
- **Do** mostrar el catálogo (búsqueda, categorías y establecimientos) dentro del primer pantallazo del teléfono.
- **Do** usar el verde de acción #0d4a34 para la única acción principal de cada pantalla.
- **Do** nombrar el estado real del servicio y del pedido con las etiquetas del backend; una etapa sin hora registrada va sin hora.
- **Do** derivar categorías y ejemplos de búsqueda del catálogo que llega del backend.
- **Do** dar a cada carga su esqueleto en la misma geometría, y a cada error su salida (Reintentar, Ver establecimientos).
- **Do** pedir las imágenes del catálogo solo cuando estén cerca de la vista y mostrarlas ya decodificadas.
- **Do** respetar `prefers-reduced-motion`: sin desplazamientos, solo cambios de opacidad.

### Don't:
- **Don't** poner rótulos en mayúsculas espaciadas sobre los títulos ni insignias "VIP" decorativas.
- **Don't** usar degradados en fondos, botones o texto, ni vidrio esmerilado como decoración.
- **Don't** mostrar tiempos de entrega, distancias o mapas que el backend no entrega.
- **Don't** repetir en cada tarjeta un estado general que la banda de inicio ya dice.
- **Don't** marcar un pago como confirmado antes de la respuesta del servidor.
- **Don't** poner el dorado como texto sobre fondos claros.
