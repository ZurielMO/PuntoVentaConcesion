/**
 * Build estático para subir por FTP a concesiones.clubleon.mx
 *
 * - Activa output: 'export' → carpeta `out/`
 * - Mueve temporalmente `src/app/api` (no soportado en export)
 * - Copia `.htaccess` a `out/`
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
const htaccessSrc = path.join(root, "public", ".htaccess");

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
  NEXT_PUBLIC_SITE_URL:
    process.env.NEXT_PUBLIC_SITE_URL || "https://concesiones.clubleon.mx",
};

console.log("→ NEXT_PUBLIC_SITE_URL =", env.NEXT_PUBLIC_SITE_URL);
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

if (fs.existsSync(htaccessSrc) && fs.existsSync(outDir)) {
  fs.copyFileSync(htaccessSrc, path.join(outDir, ".htaccess"));
  console.log("→ .htaccess copiado a out/");
}

console.log(
  "\n✔ Build FTP listo. Sube el contenido de la carpeta `out/` a la raíz de concesiones.clubleon.mx",
);
console.log(
  "  Asegúrate de que CORS del backend permita: https://concesiones.clubleon.mx",
);
