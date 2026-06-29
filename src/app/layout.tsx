import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Footer } from "@/components/layout/footer";
import { FrapButton } from "@/components/layout/frap-button";
import { Header } from "@/components/layout/header";
import { Providers } from "@/components/providers";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "PuntoVenta — Concesiones Estadio",
  description: "Sistema de punto de venta para concesiones del estadio",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${inter.variable} antialiased`}>
        <Providers>
          <Header />
          <main className="min-h-screen pt-16 md:pt-[83px] lg:pt-[99px]">
            {children}
          </main>
          <Footer />
          <FrapButton />
        </Providers>
      </body>
    </html>
  );
}
