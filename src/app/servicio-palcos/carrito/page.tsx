"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShieldCheck, ArrowLeft, Utensils } from "lucide-react";
import { VipTopBar } from "@/components/vip/ui/top-bar";
import { VipMascot } from "@/components/vip/ui/mascot";
import { VipCheckoutDetailsCard, type VipCheckoutDetails } from "@/components/vip/cart/checkout-details-card";
import { VipCartItemRow } from "@/components/vip/cart/cart-item-row";
import { VipPaymentSelectorCard } from "@/components/vip/cart/payment-selector-card";
import { VipOrderBreakdownCard } from "@/components/vip/cart/order-breakdown-card";
import { VipButton } from "@/components/vip/ui/button";
import { useVipCart } from "@/hooks/vip/use-vip-cart";
import { useVipOrders } from "@/hooks/vip/use-vip-orders";
import { VIP_STRIPE_PAYMENT_METHOD, normalizeVipFloor } from "@/lib/vip/types";
import { isValidMxPhone } from "@/lib/vip/phone";
import { vipToast } from "@/hooks/vip/use-vip-toast";
import { ApiError } from "@/lib/api/client";
import { vipRestaurantPath } from "@/lib/vip/vip-routes";
import { formatVipMxn } from "@/lib/vip/money";
import { motion } from "motion/react";

export default function VipCarritoPage() {
  const router = useRouter();
  const {
    items,
    updateQuantity,
    removeItem,
    subtotal,
    cargoServicio,
    descuento,
    total,
    restaurantId,
    restaurantNombre,
  } = useVipCart();

  const menuRestaurantId = restaurantId || items[0]?.producto.concesionId || "";
  const menuHref = menuRestaurantId
    ? vipRestaurantPath(menuRestaurantId)
    : "/servicio-palcos/inicio";

  const { createOrder } = useVipOrders();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkoutDetails, setCheckoutDetails] = useState<VipCheckoutDetails>({
    name: "",
    email: "",
    phone: "",
    zona: "",
    palco: "",
    nivel: "",
  });

  const finalTotal = total;

  const handleCheckout = async () => {
    if (items.length === 0) return;
    const name = checkoutDetails.name.trim();
    const email = checkoutDetails.email.trim();
    const phone = checkoutDetails.phone.trim();
    const palco = checkoutDetails.palco.trim();

    if (name.length < 2) {
      vipToast.error("Escribe tu nombre para la entrega en el palco.");
      return;
    }
    if (!email.includes("@") || !email.split("@")[1]?.includes(".")) {
      vipToast.error("Escribe un correo válido para tu recibo.");
      return;
    }
    if (!isValidMxPhone(phone)) {
      vipToast.error("Escribe un teléfono de 10 dígitos para contactarte en el palco.");
      return;
    }
    if (!palco) {
      vipToast.error("Indica el número de palco al que debemos entregar.");
      return;
    }
    if (checkoutDetails.zona !== "Oriente" && checkoutDetails.zona !== "Poniente") {
      vipToast.error("Elige Oriente o Poniente para la entrega.");
      return;
    }
    const piso = normalizeVipFloor(checkoutDetails.zona, checkoutDetails.nivel);
    if (!piso) {
      vipToast.error(
        checkoutDetails.zona === "Oriente"
          ? "Elige el piso 1, 2 o 3 para Oriente."
          : "Elige el piso 1 o 2 para Poniente.",
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const newOrder = await createOrder({
        restauranteId: restaurantId || items[0]?.producto.concesionId || "",
        restauranteNombre: restaurantNombre || "Servicio Palcos",
        restauranteLogo: items[0]?.producto.imagen || "",
        customer: { name, email, phone },
        delivery: {
          zona: checkoutDetails.zona,
          palco,
          nivel: piso,
        },
        items: [...items],
        subtotal,
        cargoServicio,
        descuento,
        propina: 0,
        total: finalTotal,
        metodoPago: VIP_STRIPE_PAYMENT_METHOD,
      });

      if (!newOrder.checkoutUrl) {
        throw new Error("No se pudo obtener la URL de pago.");
      }

      vipToast.info("Conectando con el cobro…", {
        description: "Completa tu pago seguro para confirmar la orden.",
      });
      window.location.assign(newOrder.checkoutUrl);
    } catch (error) {
      if (error instanceof ApiError && error.code === "VIP_OUT_OF_STOCK") {
        vipToast.error("Sin inventario", {
          description: error.message || "Uno o más productos ya no tienen stock en el POS.",
        });
      } else {
        const message =
          error instanceof Error
            ? error.message
            : "No se pudo iniciar el pago con tarjeta.";
        vipToast.error(message);
      }
      setIsSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="flex flex-col min-h-screen pb-28 bg-[#F6F8F7] text-[#111614]">
        <VipTopBar
          variant="linear"
          title="Mi Carrito"
          subtitle="Servicio Palcos · Estadio León"
          onBack={() => router.push("/servicio-palcos/inicio")}
        />
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center gap-4 max-w-md mx-auto">
          <VipMascot name="carrito" size="empty" className="-mt-2" />
          <div>
            <h2 className="font-headline-md text-2xl font-extrabold text-[#111614] tracking-tight">
              Tu carrito está vacío
            </h2>
            <p className="font-body-md text-sm sm:text-base text-[#4E5C56] mt-1 max-w-xs leading-relaxed">
              Explora las concesiones oficiales del Estadio León para ordenar directo a tu palco.
            </p>
          </div>
          <Link
            href="/servicio-palcos/inicio"
            className="mt-2 h-12 px-6 bg-[#187B56] hover:bg-[#136244] text-white font-headline-md font-bold text-sm sm:text-base rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm active:scale-95 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Explorar Menú</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen pb-44 lg:pb-16 bg-[#F6F8F7] text-[#111614]">
      {/* Top Header */}
      <VipTopBar
        variant="linear"
        title="Confirmar Pedido"
        subtitle="Entrega Exclusiva en Palco"
        onBack={() => router.push(menuHref)}
      />

      <motion.main
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="max-w-6xl mx-auto w-full px-4 sm:px-6 py-5 sm:py-8"
      >
        {/* Desktop 2-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_1fr] gap-6 items-start">
          {/* Left Column: Form Details & Items */}
          <div className="flex flex-col gap-6">
            {/* Step 1 & 2 Form */}
            <VipCheckoutDetailsCard value={checkoutDetails} onChange={setCheckoutDetails} />

            {/* Cart Items Section */}
            <section className="flex flex-col gap-3.5">
              <div className="flex justify-between items-center border-b border-[#DFE5E2] pb-3 gap-3">
                <h3 className="font-headline-md text-xl sm:text-2xl font-extrabold text-[#111614] tracking-tight">
                  Productos en la Orden
                </h3>
                <Link
                  href={menuHref}
                  className="inline-flex items-center gap-1.5 min-h-[38px] px-3.5 rounded-xl text-sm sm:text-base font-headline-md font-bold text-[#187B56] hover:text-[#136244] hover:bg-[#187B56]/8 border border-transparent hover:border-[#187B56]/20 transition-colors"
                >
                  <Utensils className="w-4 h-4" />
                  Volver al menú
                </Link>
              </div>

              <div className="flex flex-col gap-3">
                {items.map((item) => (
                  <VipCartItemRow
                    key={item.id}
                    item={item}
                    onUpdateQuantity={updateQuantity}
                    onRemove={removeItem}
                  />
                ))}
              </div>
            </section>
          </div>

          {/* Right Column: Payment Method, Breakdown & Sticky Checkout Action */}
          <div className="flex flex-col gap-5 lg:sticky lg:top-24">
            {/* Payment Method Card */}
            <VipPaymentSelectorCard />

            <VipOrderBreakdownCard subtotal={subtotal} total={total} />

            {/* Desktop Pay CTA */}
            <div className="hidden lg:flex flex-col gap-2.5">
              <VipButton
                onClick={handleCheckout}
                loading={isSubmitting}
                variant="primary"
                size="lg"
                fullWidth
                className="font-headline-md font-extrabold text-lg min-h-[54px] tracking-wide shadow-md cursor-pointer"
              >
                Pagar con tarjeta {formatVipMxn(finalTotal)}
              </VipButton>
              <VipButton
                type="button"
                variant="outline"
                size="md"
                fullWidth
                className="font-headline-md font-bold text-base"
                onClick={() => router.push(menuHref)}
              >
                <ArrowLeft className="w-4 h-4" />
                Volver al menú
              </VipButton>
              <div className="flex items-center justify-center gap-1.5 text-sm text-[#7E8E87] font-medium text-center">
                <ShieldCheck className="w-4 h-4 text-[#187B56]" />
                <span>Transacción segura encriptada</span>
              </div>
            </div>
          </div>
        </div>
      </motion.main>

      {/* Fixed Bottom Checkout Action for Mobile */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#DFE5E2] px-4 pt-3.5 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-[0_-12px_32px_rgba(10,28,22,0.14)]">
        <div className="max-w-2xl mx-auto flex flex-col gap-2">
          <VipButton
            onClick={handleCheckout}
            loading={isSubmitting}
            variant="primary"
            size="lg"
            fullWidth
            className="font-headline-md font-black text-lg min-h-[56px] shadow-lg cursor-pointer tracking-tight"
          >
            Pagar con tarjeta {formatVipMxn(finalTotal)}
          </VipButton>
          <div className="flex items-center justify-between px-1">
            <Link
              href={menuHref}
              className="inline-flex items-center gap-1.5 min-h-[38px] text-sm sm:text-base font-headline-md font-bold text-[#187B56]"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver al menú
            </Link>
            <div className="flex items-center gap-1.5 text-xs sm:text-sm text-[#7E8E87] font-medium">
              <ShieldCheck className="w-4 h-4 text-[#187B56]" />
              <span>Pago seguro con tarjeta</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
