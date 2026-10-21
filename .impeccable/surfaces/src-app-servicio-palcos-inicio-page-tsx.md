---
version: 1
slug: "src-app-servicio-palcos-inicio-page-tsx"
primary_target: "src/app/servicio-palcos/inicio/page.tsx"
related_targets: ["src/app/servicio-palcos/restaurante","src/app/servicio-palcos/carrito","src/app/servicio-palcos/guia"]
---

# Servicio Palcos · storefront del aficionado

Scope: rutas públicas de `/servicio-palcos` (inicio, restaurante, carrito/checkout, pago, guía, legales). Excluye la intro (intacta por contrato) y Central (personal).
Mode: Operate. El visitante completa una compra desde su palco, con el teléfono y una mano, entre jugadas.
Audience: aficionados en palcos del Estadio León que escanean un QR; algunos programan su pedido días antes (preventa).
Job: encontrar comida o bebida, armar el pedido, indicar el palco, pagar con Stripe y seguir la entrega con la guía.
Constraints: verdes institucionales y dorado de acento; Stripe, precios, cargos e inventario los decide el backend; sin tiempos ni estados inventados; sin datos ficticios en producción; extras ocultos por decisión del usuario; nombres en formato título solo en pantalla.

## Direction contract

THESIS: El palco es la dirección de entrega. Como una app de delivery lleva la calle arriba, aquí cada pantalla dice primero si se puede pedir ahora o programar para el partido, y a qué palco llega. Rechaza la portada institucional (hero, tarjetas explicativas, insignias VIP) antes del menú.

OWN-WORLD: Verde León #062E20 como casco (barra superior y banda de contexto) sobre un fondo blanco cálido #F6F5F1; superficies blancas con línea de 1px #E3E6E1 y sin sombras en reposo; dorado #E6C687 solo sobre verde (contador del carrito, palco activo); verde #0D4A34 como único color de acción sobre claro; Montserrat 700/800 para nombres, precios tabulares y títulos, Inter para texto; controles en píldora, tarjetas de 20px, fotos de producto sobre blanco.

STORY: Escanea el QR, ve el estado real del servicio y su palco, busca o toca una categoría, agrega desde resultados o entra al establecimiento, la píldora del carrito bajo el pulgar muestra conteo y total, el checkout agrupa entrega, contacto, horario y pago, paga en Stripe y sigue el pedido con una línea de tiempo real.

FIRST VIEWPORT: 390×844. Barra verde de 56px (escudo + Servicio Palcos; en escritorio, Mi pedido y Carrito con total). Banda verde de ~150px: título de 26px "Pide sin salir de tu palco", línea de estado con punto (servicio en vivo, preventa o cerrado) y botón del palco guardado. Búsqueda montada en el borde de la banda, chips de categoría con conteo y la primera tarjeta de establecimiento antes de y=440. Barra inferior: Menú, Mi pedido y píldora del carrito.

FORM: canon de delivery (estructura Uber Eats / DiDi Food) fijado por el brief del usuario, ejecutado a fidelidad completa con la identidad Club León; seed: none — tirada omitida a propósito: el brief del usuario fija la dirección (canon de delivery tipo Uber Eats / DiDi Food con identidad Club León), así que es un contrato no sorteado.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Memorable moment
La píldora del carrito en la barra inferior: crece con el primer producto y muestra conteo y total sin tapar el menú.

## Unresolved
- Miniaturas de imágenes en backend (las portadas pesan 1–2 MB).
- Categorías reales de producto en backend (hoy se derivan por palabras clave).
