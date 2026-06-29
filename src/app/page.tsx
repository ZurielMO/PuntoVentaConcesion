import Link from "next/link";
import { FeatureBand } from "@/components/storefront/feature-band";
import { HeroSection } from "@/components/storefront/hero-section";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const MODULES = [
  {
    title: "Productos",
    description: "Catálogo de artículos por concesión, precios y disponibilidad.",
    href: "/products",
  },
  {
    title: "Tickets",
    description: "Registro de ventas en tiempo real durante el evento.",
    href: "/tickets",
  },
  {
    title: "Inventario",
    description: "Control de existencias por jornada y sucursal.",
    href: "/inventarios",
  },
  {
    title: "Cortes",
    description: "Cierre de caja y reportes al final de la jornada.",
    href: "/cortes",
  },
];

export default function HomePage() {
  return (
    <>
      <HeroSection
        title="Punto de venta para concesiones del estadio"
        subtitle="Gestiona productos, tickets, inventario y cortes de caja desde una sola plataforma conectada al backend PuntoVentaBack."
        ctaLabel="Explorar productos"
        ctaHref="/products"
        secondaryLabel="Acceder al POS"
        secondaryHref="/login"
      />

      <section className="bg-white py-[var(--space-5)]">
        <div className="mx-auto max-w-[1440px] px-[var(--outer-gutter)] lg:px-[var(--outer-gutter-lg)]">
          <h2 className="mb-8 text-center">Módulos del sistema</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {MODULES.map((mod) => (
              <Card key={mod.href}>
                <CardHeader>
                  <CardTitle className="text-[1.8rem]">{mod.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-[1.4rem] text-muted-foreground">
                    {mod.description}
                  </p>
                </CardContent>
                <Button variant="outline" asChild className="mx-[var(--space-3)] mb-[var(--space-3)] w-[calc(100%-3.2rem)]">
                  <Link href={mod.href}>Abrir</Link>
                </Button>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <FeatureBand
        title="Conectado a tu backend"
        description="El frontend usa un BFF en /api/* que hace proxy a PuntoVentaBack (Cloud Functions). Autenticación con Firebase ID token y perfil POS desde la colección users."
        primaryLabel="Iniciar sesión"
        primaryHref="/login"
        secondaryLabel="Ver API health"
        secondaryHref="/api"
      />
    </>
  );
}
