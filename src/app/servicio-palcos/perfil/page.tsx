"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function VipPerfilPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/servicio-palcos/inicio");
  }, [router]);

  return null;
}
