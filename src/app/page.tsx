import { FeatureBand } from "@/components/storefront/feature-band";
import { HeroSection } from "@/components/storefront/hero-section";
import { HomeModules } from "@/components/home/home-modules";

export default function HomePage() {
  return (
    <>
      <HeroSection
        title="Punto de venta para concesiones del estadio"
        subtitle="SuperAdmin gestiona concesiones y usuarios. Admin opera su concesión. Vendedor vende en caja."
        ctaLabel="Acceder al POS"
        ctaHref="/login"
        secondaryLabel="Explorar productos"
        secondaryHref="/products"
      />

      <section className="bg-white py-[var(--space-5)]">
        <div className="mx-auto max-w-[1440px] px-[var(--outer-gutter)] lg:px-[var(--outer-gutter-lg)]">
          <h2 className="mb-8 text-center">Módulos del sistema</h2>
          <HomeModules />
        </div>
      </section>

      <FeatureBand
        title="Conectado a tu backend"
        description="El frontend usa un BFF en /api/* que hace proxy a PuntoVentaBack. Autenticación con Firebase ID token y perfil POS desde la colección users."
        primaryLabel="Iniciar sesión"
        primaryHref="/login"
        secondaryLabel="Ver API health"
        secondaryHref="/api"
      />
    </>
  );
}
