import { NextRequest, NextResponse } from "next/server";

const CREST_BUCKET = "acreditaciones-b904f.firebasestorage.app";

/**
 * Proxy same-origin de los escudos. Storage no manda
 * Access-Control-Allow-Origin, así que el navegador no puede leer el PNG
 * directo y jsPDF se queda sin imagen.
 */
export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ file: string }> },
) {
  const { file } = await context.params;
  const name = file.toLowerCase();
  if (!/^[a-z0-9]+\.png$/.test(name)) {
    return NextResponse.json(
      { success: false, message: "Escudo no válido" },
      { status: 400 },
    );
  }

  const upstream = await fetch(
    `https://firebasestorage.googleapis.com/v0/b/${CREST_BUCKET}/o/${encodeURIComponent(name)}?alt=media`,
  );
  if (!upstream.ok) {
    return NextResponse.json(
      { success: false, message: "Escudo no encontrado" },
      { status: 404 },
    );
  }

  return new NextResponse(await upstream.arrayBuffer(), {
    status: 200,
    headers: {
      "Content-Type": upstream.headers.get("Content-Type") || "image/png",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
