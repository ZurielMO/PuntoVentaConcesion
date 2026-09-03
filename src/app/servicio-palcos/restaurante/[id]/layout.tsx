/**
 * Params estáticos mínimos para `output: 'export'` (FTP).
 * En hosting sin rewrite Apache se usa `/restaurante/_/?id=...`
 */
export function generateStaticParams() {
  return [{ id: "_" }];
}

export default function PalcosRestauranteIdLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
