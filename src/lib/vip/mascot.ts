export const VIP_MASCOT = {
  icono: "/imgs/iconoapppalcos.png",
  inicio: "/imgs/inicioPalcos.png",
  carrito: "/imgs/CarritoPalcos.png",
  pagos: "/imgs/PagosPalcos.png",
  ordenConfirmada: "/imgs/ordenconfirmadaPalcos.png",
  comida: "/imgs/DecoracionPalcos2.png",
  pizza: "/imgs/DecoracionPalcos3.png",
  postres: "/imgs/DecoracionPalcos4.png",
  cta: "/imgs/DecoracionPalcos5.png",
} as const;

export type VipMascotName = keyof typeof VIP_MASCOT;

export const VIP_MASCOT_ALT: Record<VipMascotName, string> = {
  icono: "Servicio Palcos",
  inicio: "León chef mostrando el menú a palcos",
  carrito: "León chef con el carrito de pedidos",
  pagos: "León chef con pago seguro",
  ordenConfirmada: "León chef entregando el pedido al palco",
  comida: "León chef con hamburguesa y papas",
  pizza: "León chef con pizza",
  postres: "León chef con postre y bebida",
  cta: "León chef indicando el menú",
};
