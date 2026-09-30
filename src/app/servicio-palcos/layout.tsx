import type { Metadata, Viewport } from "next";
import { Montserrat, Inter } from "next/font/google";
import { VipProviders } from "@/components/vip/vip-providers";
import { VipMobileChrome } from "@/components/vip/ui/mobile-chrome";
import { VipCookieNotice } from "@/components/vip/legal/cookie-notice";
import "./vip-hospitality.css";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter-vip",
  subsets: ["latin"],
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#062319",
};

export const metadata: Metadata = {
  title: "Servicio Palcos VIP · Club León | Hospitality Estadio León",
  description: "Servicio oficial de alimentos y bebidas con entrega directa a tu palco durante el partido.",
  icons: {
    icon: [{ url: "/brand/club-leon-fc.png", type: "image/png", sizes: "any" }],
    apple: [{ url: "/brand/club-leon-fc.png", type: "image/png" }],
  },
};

/** Aísla Servicio Palcos del rem del dashboard. El estilo vive en `html:has([data-vip-root])`. */
export default function VipRootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div
      data-vip-root="true"
      className={`
        ${montserrat.variable} ${inter.variable}
        min-h-screen bg-[#F8FAF9] text-[#111827] antialiased
        selection:bg-[#0D4A34] selection:text-white
      `}
      style={{
        fontFamily: "var(--font-inter-vip), Inter, sans-serif",
      }}
    >
      <VipProviders>
        <div className="w-full min-h-screen flex flex-col bg-[#F8FAF9] relative">
          {children}
          <VipCookieNotice />
          <VipMobileChrome />
        </div>
      </VipProviders>
    </div>
  );
}
