# PuntoVentaFront

Frontend del **Punto de Venta — Concesiones Estadio**, construido con Next.js 15 según `STACK.md` y diseño inspirado en `DESIGN.md`.

## Stack

- Next.js 15 (App Router) + React 19 + TypeScript
- Tailwind CSS 4 + shadcn/ui (componentes base)
- Firebase Web SDK (auth)
- BFF en `/api/*` → proxy a `PuntoVentaBack`

## Requisitos

- Node.js 20+
- npm 10+
- Backend `PuntoVentaBack` corriendo en `http://localhost:3000`

## Instalación

```bash
cd puntoventa-front
npm install
cp env.example .env.local
# Edita .env.local con credenciales Firebase
```

En `PuntoVentaBack/functions/.env.local`, agrega el origen del frontend a CORS:

```
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001,http://localhost:9002
```

## Desarrollo

```bash
# Terminal 1 — backend
cd ../PuntoVentaBack && npm run dev

# Terminal 2 — frontend
npm run dev
```

- Frontend: http://localhost:9002
- API BFF: http://localhost:9002/api/*
- Backend directo: http://localhost:3000/api

## Estructura

```
src/
├── app/                    App Router + BFF (/api/[...path])
├── components/
│   ├── ui/                 shadcn/ui (button, card, input, label)
│   ├── layout/             header, footer, frap-button
│   └── storefront/         hero, feature-band, product-card
├── hooks/                  use-auth, use-products
└── lib/
    ├── api/client.ts       Cliente HTTP (vía BFF)
    ├── firebase/client.ts  Firebase Auth
    └── server/backend-client.ts  Proxy server-side
```

## Rutas

| Ruta | Descripción |
|------|-------------|
| `/` | Home |
| `/login` | Inicio de sesión Firebase |
| `/products` | Catálogo (requiere auth) |
| `/tickets` | Placeholder |
| `/inventarios` | Placeholder |
| `/cortes` | Placeholder |

## Scripts

| Script | Acción |
|--------|--------|
| `npm run dev` | Dev con Turbopack en puerto 9002 |
| `npm run build` | Build de producción |
| `npm run start` | Servidor de producción |
| `npm run lint` | ESLint |
| `npm run typecheck` | Verificación TypeScript |

## Conexión con el backend

El BFF reenvía peticiones a los dominios de `PuntoVentaBack`:

`auth`, `concessions`, `products`, `sucursales`, `zonas`, `jornadas`, `inventarios`, `tickets`, `cortes`, `users`, `detalle-venta`

El header `Authorization: Bearer <firebase-id-token>` se propaga automáticamente.
