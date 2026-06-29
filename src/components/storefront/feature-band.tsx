import Link from "next/link";
import { Button } from "@/components/ui/button";

type FeatureBandProps = {
  title: string;
  description: string;
  primaryLabel?: string;
  primaryHref?: string;
  secondaryLabel?: string;
  secondaryHref?: string;
};

export function FeatureBand({
  title,
  description,
  primaryLabel = "Comenzar",
  primaryHref = "/login",
  secondaryLabel = "Saber más",
  secondaryHref = "/products",
}: FeatureBandProps) {
  return (
    <section className="bg-house-green text-white">
      <div className="mx-auto grid max-w-[1440px] items-center gap-8 px-[var(--outer-gutter)] py-[var(--space-5)] md:grid-cols-2 lg:px-[var(--outer-gutter-lg)]">
        <div className="flex flex-col gap-4">
          <h2 className="text-[2.4rem] font-semibold text-white">{title}</h2>
          <p className="text-[1.6rem] leading-relaxed text-[var(--text-white-soft)]">
            {description}
          </p>
          <div className="flex flex-wrap gap-4 pt-2">
            <Button variant="secondary" asChild>
              <Link href={primaryHref}>{primaryLabel}</Link>
            </Button>
            <Button variant="on-dark" asChild>
              <Link href={secondaryHref}>{secondaryLabel}</Link>
            </Button>
          </div>
        </div>
        <div className="flex items-center justify-center">
          <div className="grid w-full max-w-md grid-cols-2 gap-4">
            {["Tickets", "Cortes", "Inventario", "Jornadas"].map((item) => (
              <div
                key={item}
                className="rounded-[var(--card-border-radius)] bg-white/10 px-4 py-6 text-center text-[1.4rem] font-medium"
              >
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
