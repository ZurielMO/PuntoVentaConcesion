/**
 * Hub de una concesión en export FTP estático.
 * Sin rewrite de Apache no existe `/concesiones/{id}` en disco;
 * solo se genera `/concesiones/_/` (generateStaticParams).
 */
export function concesionHubPath(concesionId: string): string {
  const id = concesionId.trim();
  if (!id || id === "_") return "/superAdmin/concesiones";
  return `/superAdmin/concesiones/_/?id=${encodeURIComponent(id)}`;
}
