/** Archivos en la raíz del Storage de acreditaciones, más alias de cómo llega el nombre. */
const TEAM_FILES: Array<{ file: string; names: string[] }> = [
  { file: "leon.png", names: ["leon", "club leon", "club leon fc"] },
  { file: "atlante.png", names: ["atlante"] },
  { file: "america.png", names: ["america", "club america"] },
  { file: "atlas.png", names: ["atlas"] },
  { file: "chivas.png", names: ["chivas", "guadalajara", "cd guadalajara"] },
  { file: "cruzazul.png", names: ["cruz azul", "cruzazul"] },
  { file: "juarez.png", names: ["juarez", "fc juarez"] },
  { file: "mazatlan.png", names: ["mazatlan"] },
  { file: "monterrey.png", names: ["monterrey", "rayados"] },
  { file: "necaxa.png", names: ["necaxa"] },
  { file: "pachuca.png", names: ["pachuca", "tuzos"] },
  { file: "puebla.png", names: ["puebla"] },
  { file: "queretaro.png", names: ["queretaro", "gallos"] },
  { file: "santos.png", names: ["santos", "santos laguna"] },
  { file: "tigres.png", names: ["tigres", "uanl"] },
  { file: "toluca.png", names: ["toluca"] },
  { file: "pumas.png", names: ["pumas", "unam"] },
  { file: "sanluis.png", names: ["atletico san luis", "san luis"] },
  { file: "tijuana.png", names: ["tijuana", "xolos"] },
];

const crestCache = new Map<string, Promise<string | null>>();

const foldName = (name: string): string =>
  name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

export function teamCrestFile(name?: string | null): string | null {
  const folded = foldName(String(name ?? ""));
  if (!folded) return null;

  const aliases = TEAM_FILES.flatMap((team) =>
    team.names.map((alias) => ({ alias, file: team.file })),
  ).sort((a, b) => b.alias.length - a.alias.length);

  const match = aliases.find(
    (team) => folded === team.alias || folded.includes(team.alias),
  );
  if (match) return match.file;

  const compact = folded.replace(/\s+/g, "");
  return compact ? `${compact}.png` : null;
}

/**
 * Mismo origen que la app. En local pasa por `/api/escudos`; en el export FTP
 * la API pública ya proxea Storage. El bucket no acepta lectura directa
 * desde el navegador.
 */
const crestUrl = (file: string): string => {
  const base = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "").replace(/\/$/, "");
  const path = `escudos/${encodeURIComponent(file)}`;
  if (base) return `${base}/${path}`;
  return `/api/${path}`;
};

const blobToDataUrl = async (blob: Blob): Promise<string> => {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  let binary = "";
  const chunk = 0x8000;
  for (let index = 0; index < bytes.length; index += chunk) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunk));
  }
  const mime = blob.type || "image/png";
  return `data:${mime};base64,${btoa(binary)}`;
};

/**
 * JPEG pequeño sobre fondo blanco. jsPDF a veces no pinta PNG con
 * transparencia, y el escudo en el PDF solo mide unos 11 mm.
 */
const toPrintableDataUrl = async (blob: Blob): Promise<string> => {
  if (typeof document === "undefined" || typeof createImageBitmap !== "function") {
    return blobToDataUrl(blob);
  }
  const bitmap = await createImageBitmap(blob);
  const max = 160;
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) return blobToDataUrl(blob);
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, width, height);
  context.drawImage(bitmap, 0, 0, width, height);
  return canvas.toDataURL("image/jpeg", 0.86);
};

/** Escudo en data URL, o null si el equipo no tiene archivo público. */
export function loadTeamCrest(name?: string | null): Promise<string | null> {
  const file = teamCrestFile(name);
  if (!file) return Promise.resolve(null);

  const cached = crestCache.get(file);
  if (cached) return cached;

  const pending = fetch(crestUrl(file))
    .then((response) => (response.ok ? response.blob() : null))
    .then((blob) => (blob ? toPrintableDataUrl(blob) : null))
    .catch(() => null);
  crestCache.set(file, pending);
  return pending;
}
