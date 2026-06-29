import Link from "next/link";
import { Button } from "@/components/ui/button";

type HeroSectionProps = {
  title: string;
  subtitle: string;
  ctaLabel?: string;
  ctaHref?: string;
  secondaryLabel?: string;
  secondaryHref?: string;
};

export function HeroSection({
  title,
  subtitle,
  ctaLabel = "Ver productos",
  ctaHref = "/products",
  secondaryLabel = "Iniciar sesión",
  secondaryHref = "/login",
}: HeroSectionProps) {
  return (
    <section className="bg-neutral-warm">
      <div className="mx-auto grid max-w-[1440px] items-center gap-8 px-[var(--outer-gutter)] py-[var(--space-6)] md:grid-cols-[40%_60%] md:py-[var(--space-8)] lg:px-[var(--outer-gutter-lg)]">
        <div className="order-2 flex flex-col gap-6 md:order-1">
          <h1 className="text-[3.6rem] font-semibold leading-tight tracking-[-0.016px] text-starbucks-green md:text-[4.5rem]">
            {title}
          </h1>
          <p className="max-w-xl text-[1.9rem] leading-relaxed text-[var(--text-black-soft)]">
            {subtitle}
          </p>
          <div className="flex flex-wrap gap-4">
            <Button asChild size="lg">
              <Link href={ctaHref}>{ctaLabel}</Link>
            </Button>
            <Button variant="outline" asChild size="lg">
              <Link href={secondaryHref}>{secondaryLabel}</Link>
            </Button>
          </div>
        </div>
        <div className="order-1 md:order-2">
          <div className="aspect-[4/3] overflow-hidden rounded-[var(--card-border-radius)] bg-ceramic shadow-[var(--card-shadow)]">
            <div className="flex h-full items-center justify-center bg-green-light p-8">
              <div className="text-center">
                <p className="text-[6rem]">🏟️</p>
                <p className="mt-4 text-[1.6rem] font-medium text-house-green">
                  Concesiones del estadio
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
