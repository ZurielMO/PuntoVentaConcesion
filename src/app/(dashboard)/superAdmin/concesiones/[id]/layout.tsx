/**
 * Params estáticos mínimos para `output: 'export'` (FTP).
 * Las rutas reales se resuelven en el cliente + rewrite de .htaccess.
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
