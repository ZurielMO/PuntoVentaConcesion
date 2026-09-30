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
import { VipHospitalityCrest } from "@/components/vip/ui/hospitality-crest";
import { UtensilsCrossed } from "lucide-react";
import { VipSalesClosedNotice } from "@/components/vip/ui/sales-closed-notice";
import { useVipPublicSalesOpen } from "@/hooks/vip/use-vip-public-sales";

function PalcosRestaurantePageInner() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const restaurantId =
    params.id && params.id !== "_"
      ? String(params.id)
      : String(searchParams.get("id") || "");
  const router = useRouter();
  const { addItem, setRestaurantInfo } = useVipCart();
  const { preordersEnabled, canOrder, ready } = useVipPublicSalesOpen();
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
    if (!canOrder || (product.disponible === false && !preordersEnabled)) return;
    addItem(product, { cantidad: 1, permitirSinStock: preordersEnabled });
  };

  if (!loading && !restaurant) {
    return (
      <div className="flex flex-col min-h-screen pb-44 bg-[#F8FAF9] text-[#111827]">
        <VipTopBar
          variant="linear"
          title="Concesión"
          subtitle="Carta · Entrega en palco"
          onBack={() => router.push("/servicio-palcos/inicio")}
        />
        <div className="flex flex-col items-center justify-center flex-1 gap-4 px-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#0D4A34]/8 border border-[#0D4A34]/15 flex items-center justify-center text-[#0D4A34]">
            <VipHospitalityCrest variant="mini" />
          </div>
          <p className="font-[family-name:var(--font-montserrat)] text-lg font-extrabold text-[#111827]">No encontramos esta concesión</p>
          <VipButton onClick={() => router.push("/servicio-palcos/inicio")}>Volver al menú</VipButton>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen pb-44 bg-[#F8FAF9] text-[#111827]">
      <VipTopBar
        variant="linear"
        title={restaurant?.nombre || "Carta"}
        subtitle="Carta · Entrega en palco"
        onBack={() => router.push("/servicio-palcos/inicio")}
      />

      {restaurant && <VipRestaurantHeader restaurant={restaurant} />}

      <main className="max-w-6xl mx-auto w-full px-3.5 sm:px-6 py-4 sm:py-6 flex flex-col gap-4 sm:gap-6">
        {ready && !canOrder && <VipSalesClosedNotice />}
        {loading ? (
          <div className="flex flex-col gap-4">
            <VipMenuItemSkeleton />
            <VipMenuItemSkeleton />
            <VipMenuItemSkeleton />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-5">
              {products.map((product) => (
                <VipMenuItemCard
                  key={product.id}
                  product={product}
                  salesOpen={canOrder}
                  allowWithoutStock={preordersEnabled}
                  onOpenDetail={setSelectedProduct}
                  onQuickAdd={handleQuickAdd}
                />
              ))}
            </div>
            {products.length === 0 && (
              <div className="flex flex-col items-center gap-3 py-12 text-center bg-white rounded-2xl border border-[#E5EBE8] my-4">
                <UtensilsCrossed className="w-10 h-10 text-[#C5A059]" />
                <p className="font-sans text-base text-[#4B5563]">
                  No hay productos disponibles actualmente en esta concesión.
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
        salesOpen={canOrder}
        allowWithoutStock={preordersEnabled}
        onAddToCart={(product, quantity, selectedOptions, notes) => {
          if (!canOrder || (product.disponible === false && !preordersEnabled)) return;
          addItem(product, {
            cantidad: quantity,
            opcionesSeleccionadas: selectedOptions,
            instrucciones: notes,
            permitirSinStock: preordersEnabled,
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
