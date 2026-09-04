import type { Metadata, Viewport } from "next";
import { Montserrat, Inter } from "next/font/google";
import { VipProviders } from "@/components/vip/vip-providers";
import { VipMobileChrome } from "@/components/vip/ui/mobile-chrome";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter-vip",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#102D24",
};

export const metadata: Metadata = {
  title: "Servicio Palcos · Entrega en palcos | Estadio León",
  description: "Servicio oficial de alimentos y bebidas con entrega directa a tu palco durante el partido.",
  icons: {
    icon: [{ url: "/imgs/iconoapppalcos.png", type: "image/png", sizes: "any" }],
    apple: [{ url: "/imgs/iconoapppalcos.png", type: "image/png" }],
  },
};

export default function VipRootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div
      className={`
        ${montserrat.variable} ${inter.variable}
        min-h-screen bg-[#F3F6F4] text-[#000000] antialiased text-[17px] sm:text-[16px]
        selection:bg-[#0C8643] selection:text-white
      `}
      style={{
        fontFamily: "var(--font-inter-vip), Inter, sans-serif",
      }}
    >
      <VipProviders>
        <div className="w-full min-h-screen flex flex-col bg-[#F3F6F4] relative">
          {children}
          <VipMobileChrome />
        </div>
      </VipProviders>
    </div>
  );
}
