/**
 * Build estático para subir por FTP (p. ej. foodmarket.clubleon.mx / concesiones.clubleon.mx)
 *
 * - Activa output: 'export' → carpeta `out/`
 * - Mueve temporalmente `src/app/api` (no soportado en export)
 * - Omite `.htaccess` (este Apache responde 500 si existe)
 * - Reescribe `out/index.html` como redirección a /login/
 */
import fs from "fs";
import path from "path";
import { spawnSync } from "child_process";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const apiDir = path.join(root, "src", "app", "api");
const apiBackup = path.join(root, "src", "app", "_api_ftp_backup");
const outDir = path.join(root, "out");

function restoreApi() {
  if (fs.existsSync(apiBackup)) {
    if (fs.existsSync(apiDir)) {
      fs.rmSync(apiDir, { recursive: true, force: true });
    }
    fs.cpSync(apiBackup, apiDir, { recursive: true });
    fs.rmSync(apiBackup, { recursive: true, force: true });
  }
}

process.on("exit", restoreApi);
process.on("SIGINT", () => {
  restoreApi();
  process.exit(1);
});
process.on("uncaughtException", (err) => {
  console.error(err);
  restoreApi();
  process.exit(1);
});

if (fs.existsSync(apiDir)) {
  if (fs.existsSync(apiBackup)) {
    fs.rmSync(apiBackup, { recursive: true, force: true });
  }
  fs.cpSync(apiDir, apiBackup, { recursive: true });
  fs.rmSync(apiDir, { recursive: true, force: true });
  console.log("→ API route ocultada temporalmente para export estático");
}

function readEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  const text = fs.readFileSync(filePath, "utf8");
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq <= 0) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

readEnvFile(path.join(root, ".env"));
readEnvFile(path.join(root, ".env.local"));

// El hosting estático no tiene el proxy `/api`. La API de .env.local suele ser
// localhost; el sitio publicado tiene que llamar a la Cloud Function.
const PRODUCTION_API = "https://us-central1-puntoventacl.cloudfunctions.net/apiV2";
const configured = (process.env.NEXT_PUBLIC_API_BASE_URL || "").replace(/\/$/, "");
const configuredIsLocal = !configured || /localhost|127\.0\.0\.1/.test(configured);
if (configuredIsLocal) {
  process.env.NEXT_PUBLIC_API_BASE_URL = PRODUCTION_API;
  console.log("→ NEXT_PUBLIC_API_BASE_URL de producción (el valor local no se publica)");
}

const env = {
  ...process.env,
  FTP_EXPORT: "1",
};

console.log(
  "→ NEXT_PUBLIC_API_BASE_URL =",
  env.NEXT_PUBLIC_API_BASE_URL || "(desde .env.local)",
);

const result = spawnSync("npx", ["next", "build"], {
  cwd: root,
  env,
  stdio: "inherit",
  shell: true,
});

restoreApi();
console.log("→ API route restaurada");

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}

// Este hosting Apache responde 500 si hay .htaccess EN LA RAÍZ (incluso vacío).
// El export ya trae carpetas con index.html; no hace falta rewrite.
if (fs.existsSync(outDir)) {
  const htaccessOut = path.join(outDir, ".htaccess");
  if (fs.existsSync(htaccessOut)) {
    fs.rmSync(htaccessOut);
    console.log("→ .htaccess de raíz omitido (el host responde 500 con él)");
  }
}

// Este host tampoco acepta .htaccess en subcarpetas (responde 500 porque no
// permite directivas Sec* fuera de la config del servidor). El bloqueo de
// mod_security en el retorno de Stripe se resolvió renombrando el query
// `session_id` a `cs`, así que aquí solo se limpia cualquier resto.
const palcosHtaccess = path.join(outDir, "servicio-palcos", ".htaccess");
if (fs.existsSync(palcosHtaccess)) {
  fs.rmSync(palcosHtaccess);
}

// `redirect()` de servidor no se puede resolver en `output: export`: Next
// prerenderiza un shell de error. Se sustituye por una redirección relativa,
// válida al subir el contenido de `out/` a la raíz del dominio.
function writeClientRedirect(filePath, url, title, linkLabel) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(
    filePath,
    `<!DOCTYPE html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta http-equiv="refresh" content="0; url=${url}" />
    <link rel="icon" href="/favicon.ico" type="image/x-icon" />
    <title>${title}</title>
    <style>
      html,
      body {
        margin: 0;
        height: 100%;
        background: #f4f6f8;
      }
    </style>
    <script>
      window.location.replace(${JSON.stringify(url)});
    </script>
  </head>
  <body>
    <noscript><a href="${url}">${linkLabel}</a></noscript>
  </body>
</html>
`,
    "utf8",
  );
}

writeClientRedirect(
  path.join(outDir, "index.html"),
  "./login/",
  "PuntoVenta - Concesiones Estadio",
  "Ir al inicio de sesión",
);
console.log("→ out/index.html reescrito como redirección a /login/");

writeClientRedirect(
  path.join(outDir, "servicio-palcos", "index.html"),
  "./inicio/",
  "Servicio de palcos",
  "Ir al inicio",
);
writeClientRedirect(
  path.join(outDir, "servicio-palcos", "pedidos", "index.html"),
  "../inicio/",
  "Servicio de palcos",
  "Ir al inicio",
);
writeClientRedirect(
  path.join(outDir, "vip", "index.html"),
  "../servicio-palcos/inicio/",
  "Servicio de palcos",
  "Ir al inicio",
);
console.log("→ redirecciones de servicio-palcos y /vip listas");

// Apache/cPanel a veces prioriza index.php sobre index.html.
const indexPhp = path.join(outDir, "index.php");
fs.writeFileSync(
  indexPhp,
  `<?php
// Fallback si DirectoryIndex no incluye index.html.
readfile(__DIR__ . '/index.html');
`,
  "utf8",
);
console.log("→ out/index.php escrito (fallback Apache)");

function detectInlinedApi(dir) {
  const stack = [dir];
  const pattern = /https:\/\/[^"'\\\s]+cloudfunctions\.net\/apiV2/;
  while (stack.length) {
    const current = stack.pop();
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === "node_modules") continue;
        stack.push(full);
        continue;
      }
      if (!entry.name.endsWith(".js")) continue;
      const text = fs.readFileSync(full, "utf8");
      const match = text.match(pattern);
      if (match) return match[0];
    }
  }
  return null;
}

const builtAt = new Date().toISOString();
const inlinedApi = detectInlinedApi(path.join(outDir, "_next")) ||
  (env.NEXT_PUBLIC_API_BASE_URL && !/localhost|127\.0\.0\.1/.test(env.NEXT_PUBLIC_API_BASE_URL)
    ? env.NEXT_PUBLIC_API_BASE_URL
    : null);
fs.writeFileSync(
  path.join(outDir, "version.json"),
  JSON.stringify(
    {
      app: "puntoventa-front",
      builtAt,
      apiBaseUrl: inlinedApi || "(no se encontró la URL pública en el bundle)",
      site: "foodmarket.clubleon.mx",
    },
    null,
    2,
  ),
  "utf8",
);
console.log(`→ out/version.json (${builtAt})`);

fs.writeFileSync(
  path.join(outDir, "DEPLOY.txt"),
  `Despliegue FTP — foodmarket.clubleon.mx
Build: ${builtAt}

IMPORTANTE (si ves diseño viejo o selects sin estilo):
1. En Cyberduck, BORRA por completo la carpeta remota "_next" (no solo sobrescribas).
2. Sube TODO el contenido INTERNO de esta carpeta "out/" a la raíz "/"
   (login, cortes, ventas, _next, brand, index.html, index.php, etc.).
3. No subas la carpeta "out" como carpeta padre; sube lo de adentro.
4. En el navegador: Ctrl+Shift+R (recarga forzada) o ventana de incógnito.
5. Verifica el build en: https://foodmarket.clubleon.mx/version.json

.htaccess: NO subas ninguno. Este host responde 500 con .htaccess, tanto en la
raíz "/" como en subcarpetas (no permite directivas Sec*). Si ya subiste uno a
"/servicio-palcos", BÓRRALO (Cyberduck > Visualización > Mostrar archivos ocultos).
`,
  "utf8",
);
console.log("→ out/DEPLOY.txt con instrucciones de subida");

console.log(
  "\n✔ Build FTP listo. Sube el contenido de la carpeta `out/` a la raíz del hosting",
  "(foodmarket.clubleon.mx o concesiones.clubleon.mx).",
);
console.log(
  "  El mismo `out/` vale para ambos: CSS/JS van por /_next/ (HTTP y HTTPS).",
);
console.log(
  "  Si el diseño no cambia: borra _next remoto, vuelve a subir todo, Ctrl+Shift+R.",
);
