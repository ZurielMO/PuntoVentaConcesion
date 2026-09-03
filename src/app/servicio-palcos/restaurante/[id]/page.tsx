"use client";

import React, { Suspense, useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { VipTopBar } from "@/components/vip/ui/top-bar";
import { VipRestaurantHeader } from "@/components/vip/menu/restaurant-header";
import { VipMenuItemCard } from "@/components/vip/menu/menu-item-card";
import { VipProductDetailModal } from "@/components/vip/menu/product-detail-modal";
import { VipCartFloatingBar } from "@/components/vip/menu/cart-floating-bar";
import { VipMenuItemSkeleton } from "@/components/vip/ui/skeleton";
import { VipService } from "@/lib/vip/vip-service";
import type { VipProduct, VipRestaurant } from "@/lib/vip/types";
import { useVipCart } from "@/hooks/vip/use-vip-cart";
import { VipButton } from "@/components/vip/ui/button";
import { VipMascot } from "@/components/vip/ui/mascot";

function PalcosRestaurantePageInner() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const restaurantId =
    params.id && params.id !== "_"
      ? String(params.id)
      : String(searchParams.get("id") || "");
  const router = useRouter();
  const { addItem, setRestaurantInfo } = useVipCart();
  const [restaurant, setRestaurant] = useState<VipRestaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<VipProduct | null>(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const data = await VipService.getRestaurantById(restaurantId);
        if (!mounted) return;
        setRestaurant(data);
        if (data) setRestaurantInfo(data.id, data.nombre);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [restaurantId, setRestaurantInfo]);

  const products = restaurant?.productos || [];

  const handleQuickAdd = (product: VipProduct) => {
    if (!product.disponible) return;
    addItem(product, { cantidad: 1 });
  };

  if (!loading && !restaurant) {
    return (
      <div className="flex flex-col min-h-screen pb-28 bg-[#F6F8F7] text-[#111614]">
        <VipTopBar
          variant="linear"
          title="Concesión"
          subtitle="Carta · Entrega en palco"
          onBack={() => router.push("/servicio-palcos/inicio")}
        />
        <div className="flex flex-col items-center justify-center flex-1 gap-3 px-6 text-center">
          <VipMascot name="cta" size="empty" />
          <p className="font-headline-md text-lg font-extrabold">No encontramos esta concesión</p>
          <VipButton onClick={() => router.push("/servicio-palcos/inicio")}>Volver al menú</VipButton>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen pb-28 bg-[#F6F8F7] text-[#111614]">
      <VipTopBar
        variant="linear"
        title={restaurant?.nombre || "Carta"}
        subtitle="Carta · Entrega en palco"
        onBack={() => router.push("/servicio-palcos/inicio")}
      />

      {restaurant && <VipRestaurantHeader restaurant={restaurant} />}

      <main className="max-w-6xl mx-auto w-full px-3 sm:px-6 py-3 sm:py-5 flex flex-col gap-3 sm:gap-5">
        {loading ? (
          <div className="flex flex-col gap-4">
            <VipMenuItemSkeleton />
            <VipMenuItemSkeleton />
            <VipMenuItemSkeleton />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
              {products.map((product) => (
                <VipMenuItemCard
                  key={product.id}
                  product={product}
                  onOpenDetail={setSelectedProduct}
                  onQuickAdd={handleQuickAdd}
                />
              ))}
            </div>
            {products.length === 0 && (
              <div className="flex flex-col items-center gap-3 py-8 text-center">
                <VipMascot name="postres" size="empty" decorative />
                <p className="text-base text-[#4E5C56]">
                  No hay productos disponibles en esta concesión.
                </p>
              </div>
            )}
          </>
        )}
      </main>

      <VipProductDetailModal
        product={selectedProduct}
        isOpen={Boolean(selectedProduct)}
        onClose={() => setSelectedProduct(null)}
        onAddToCart={(product, quantity, selectedOptions, notes) => {
          if (!product.disponible) return;
          addItem(product, {
            cantidad: quantity,
            opcionesSeleccionadas: selectedOptions,
            instrucciones: notes,
          });
          setSelectedProduct(null);
        }}
      />
      <VipCartFloatingBar />
    </div>
  );
}

export default function PalcosRestaurantePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#F6F8F7] text-[#7E8E87]">
          Cargando…
        </div>
      }
    >
      <PalcosRestaurantePageInner />
    </Suspense>
  );
}
