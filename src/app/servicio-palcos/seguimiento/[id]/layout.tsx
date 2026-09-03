/**
 * Params estáticos mínimos para `output: 'export'` (FTP).
 * En hosting sin rewrite Apache se usa `/seguimiento/_/?id=...`
 */
export function generateStaticParams() {
  return [{ id: "_" }];
}

export default function PalcosSeguimientoIdLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
