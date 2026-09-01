import type { NextConfig } from "next";

const isFtpExport = process.env.FTP_EXPORT === "1";

const nextConfig: NextConfig = isFtpExport
  ? {
      output: "export",
      trailingSlash: true,
      images: { unoptimized: true },
      // Sin assetPrefix: CSS/JS usan /_next/... (válido en HTTP y HTTPS).
      // Un prefijo http:// lo bloquea Chrome por mixed-content al forzar HTTPS.
    }
  : {
      allowedDevOrigins: ["172.18.2.131", "http://172.18.2.131:9002"],
      async redirects() {
        return [
          { source: "/vip", destination: "/servicio-palcos", permanent: true },
          { source: "/vip/:path*", destination: "/servicio-palcos/:path*", permanent: true },
        ];
      },
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
