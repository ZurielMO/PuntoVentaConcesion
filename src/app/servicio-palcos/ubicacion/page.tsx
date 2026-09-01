"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function VipUbicacionPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/servicio-palcos/carrito");
  }, [router]);
  return null;
}
