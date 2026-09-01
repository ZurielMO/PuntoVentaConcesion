/**
 * VIP Arena Experience Visual System Tokens · Club León
 * 
 * Hospitality Premium + Stadium Venue + Modern Commerce
 */

export const VIP_THEME = {
  colors: {
    // Club León / Emerald Greens
    primary: "#187B56",
    primaryHover: "#136244",
    primaryActive: "#0E4A33",
    primaryLight: "#E8F4EE",
    primarySubtle: "rgba(24, 123, 86, 0.08)",
    primaryBorder: "rgba(24, 123, 86, 0.22)",

    // Warm Gold / Champagne VIP Accents
    gold: "#9E7844",
    goldHover: "#846335",
    goldLight: "#F8F3EA",
    goldSubtle: "rgba(158, 120, 68, 0.12)",
    goldBorder: "rgba(158, 120, 68, 0.28)",
    goldText: "#C5A059",

    // Stadium Deep Greens
    darkStadium: "#0A1C16",
    dark: "#102D24",
    darkElevated: "#16382D",
    darkSurface: "#1B4336",
    darkBorder: "#234D41",
    darkBorderLight: "rgba(35, 77, 65, 0.6)",

    // Neutral Surfaces & Warm Background
    background: "#F6F8F7",
    backgroundAlt: "#ECEFEA",
    surface: "#FFFFFF",
    surfaceMuted: "#F2F5F3",
    surfaceElevated: "#FFFFFF",

    // Typography
    textPrimary: "#111614",
    textSecondary: "#4E5C56",
    textTertiary: "#7E8E87",
    textOnDark: "#FFFFFF",
    textOnDarkMuted: "#D3DCD7",

    // Borders & Dividers
    border: "#DFE5E2",
    borderSubtle: "#E9EFEB",
    borderStrong: "#CBD5D0",

    // Feedback & Operational Status
    success: "#1F8A55",
    successSubtle: "rgba(31, 138, 85, 0.1)",
    warning: "#D99721",
    warningSubtle: "rgba(217, 151, 33, 0.1)",
    error: "#C43D3D",
    errorSubtle: "rgba(196, 61, 61, 0.1)",
    info: "#2C7DA0",
    infoSubtle: "rgba(44, 125, 160, 0.1)",
  },
  typography: {
    fontDisplay: "var(--font-montserrat), Montserrat, sans-serif",
    fontBody: "var(--font-inter-vip), Inter, sans-serif",
  },
  borderRadius: {
    xs: "6px",
    sm: "10px",
    md: "14px",
    lg: "20px",
    xl: "28px",
    full: "9999px",
  },
  shadows: {
    subtle: "0 2px 8px rgba(10, 28, 22, 0.04)",
    elevated: "0 8px 24px rgba(10, 28, 22, 0.08)",
    floating: "0 14px 36px rgba(10, 28, 22, 0.12)",
    overlay: "0 24px 60px rgba(10, 28, 22, 0.22)",
    goldGlow: "0 4px 20px rgba(158, 120, 68, 0.18)",
    greenGlow: "0 4px 20px rgba(24, 123, 86, 0.22)",
  },
} as const;
