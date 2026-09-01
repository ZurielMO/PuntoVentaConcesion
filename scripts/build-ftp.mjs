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

// Este hosting Apache responde 500 si hay .htaccess (incluso vacío).
// El export ya trae carpetas con index.html; no hace falta rewrite.
if (fs.existsSync(outDir)) {
  const htaccessOut = path.join(outDir, ".htaccess");
  if (fs.existsSync(htaccessOut)) {
    fs.rmSync(htaccessOut);
    console.log("→ .htaccess omitido (el host responde 500 con ese archivo)");
  }
}

// La raíz usa `redirect()` de servidor, que en `output: export` no se puede
// resolver: Next prerenderiza un shell de error sin estilos. Se sustituye por
// una redirección que funciona en cualquier hosting, con o sin mod_rewrite.
const indexHtml = path.join(outDir, "index.html");
if (fs.existsSync(indexHtml)) {
  fs.writeFileSync(
    indexHtml,
    `<!DOCTYPE html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta http-equiv="refresh" content="0; url=./login/" />
    <link rel="icon" href="./favicon.ico" type="image/x-icon" />
    <title>PuntoVenta - Concesiones Estadio</title>
    <style>
      html,
      body {
        margin: 0;
        height: 100%;
        background: #f4f6f8;
      }
    </style>
    <script>
      window.location.replace("./login/");
    </script>
  </head>
  <body>
    <noscript><a href="./login/">Ir al inicio de sesión</a></noscript>
  </body>
</html>
`,
    "utf8",
  );
  console.log("→ out/index.html reescrito como redirección a /login/");
}

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

const builtAt = new Date().toISOString();
fs.writeFileSync(
  path.join(outDir, "version.json"),
  JSON.stringify(
    {
      app: "puntoventa-front",
      builtAt,
      apiBaseUrl:
        env.NEXT_PUBLIC_API_BASE_URL ||
        "(definido en .env.local / entorno de build)",
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

No subas .htaccess (este host responde 500 con ese archivo).
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
