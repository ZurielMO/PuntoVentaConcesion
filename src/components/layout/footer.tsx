import Link from "next/link";

export function Footer() {
  return (
    <footer className="bg-house-green text-[var(--text-white)]">
      <div className="mx-auto flex flex-col gap-6 px-[var(--outer-gutter)] py-[var(--space-5)] md:flex-row md:items-center md:justify-between lg:px-[var(--outer-gutter-lg)]">
        <div>
          <p className="text-[2rem] font-semibold">PuntoVenta</p>
          <p className="mt-1 text-[1.4rem] text-[var(--text-white-soft)]">
            Sistema de punto de venta para concesiones del estadio
          </p>
        </div>
        <div className="flex flex-wrap gap-6 text-[1.4rem]">
          <Link
            href="/products"
            className="text-[var(--text-white-soft)] transition-colors hover:text-white"
          >
            Productos
          </Link>
          <Link
            href="/login"
            className="text-[var(--text-white-soft)] transition-colors hover:text-white"
          >
            Acceso
          </Link>
        </div>
      </div>
      <div className="border-t border-white/10 px-[var(--outer-gutter)] py-4 text-center text-[1.3rem] text-[var(--text-white-soft)] lg:px-[var(--outer-gutter-lg)]">
        © {new Date().getFullYear()} PuntoVenta — Concesiones Estadio
      </div>
    </footer>
  );
}
