import type { NextConfig } from "next";

const isFtpExport = process.env.FTP_EXPORT === "1";
const siteOrigin = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://concesiones.clubleon.mx"
).replace(/\/$/, "");

const nextConfig: NextConfig = isFtpExport
  ? {
      output: "export",
      trailingSlash: true,
      images: { unoptimized: true },
      // URLs absolutas para CSS/JS en hosting FTP/Apache
      assetPrefix: siteOrigin,
    }
  : {
      async headers() {
        return [
          {
            source: "/(.*)",
            headers: [
              { key: "X-Frame-Options", value: "DENY" },
              {
                key: "Referrer-Policy",
                value: "strict-origin-when-cross-origin",
              },
              {
                key: "Strict-Transport-Security",
                value: "max-age=63072000; includeSubDomains; preload",
              },
            ],
          },
        ];
      },
    };

export default nextConfig;
