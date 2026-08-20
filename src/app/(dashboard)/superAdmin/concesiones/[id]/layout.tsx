/**
 * Params estáticos mínimos para `output: 'export'` (FTP).
 * En hosting sin rewrite Apache se usa `/concesiones/_/?id=...`
 * (ver `concesionHubPath`).
 */
export function generateStaticParams() {
  return [{ id: "_" }];
}

export default function ConcesionIdLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
