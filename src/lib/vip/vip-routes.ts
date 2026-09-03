/**
 * Rutas VIP para export FTP estático.
 * Sin rewrite de Apache no existe `/restaurante/{id}` en disco;
 * solo se genera `/restaurante/_/` (generateStaticParams).
 */
export function vipRestaurantPath(restaurantId: string): string {
  const id = restaurantId.trim();
  if (!id || id === "_") return "/servicio-palcos/inicio";
  return `/servicio-palcos/restaurante/_/?id=${encodeURIComponent(id)}`;
}

export function vipSeguimientoPath(orderId: string): string {
  const id = orderId.trim();
  if (!id || id === "_") return "/servicio-palcos/pedidos";
  return `/servicio-palcos/seguimiento/_/?id=${encodeURIComponent(id)}`;
}
