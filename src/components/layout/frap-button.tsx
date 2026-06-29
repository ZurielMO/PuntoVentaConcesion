"use client";

import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";

export function FrapButton() {
  return (
    <Button
      variant="default"
      size="frap"
      className="fixed right-4 bottom-4 z-40 md:right-8 md:bottom-8"
      style={{ margin: "calc(-1 * var(--space-2))" }}
      asChild
    >
      <Link href="/tickets" aria-label="Nueva venta">
        <ShoppingBag className="size-6 text-white" />
      </Link>
    </Button>
  );
}
