/**
 * VIP Arena Experience Visual System Tokens · Club León
 *
 * Brand-aligned: green #0C8643, yellow #FADC06, black, white
 */

export const VIP_THEME = {
  colors: {
    primary: "#0C8643",
    primaryHover: "#0A6F38",
    primaryActive: "#065C2C",
    primaryLight: "#E3F5EB",
    primarySubtle: "rgba(12, 134, 67, 0.08)",
    primaryBorder: "rgba(12, 134, 67, 0.22)",

    gold: "#FADC06",
    goldHover: "#E5C805",
    goldLight: "#FFF9D6",
    goldSubtle: "rgba(250, 220, 6, 0.16)",
    goldBorder: "rgba(250, 220, 6, 0.4)",
    goldText: "#8A7600",

    darkStadium: "#000000",
    dark: "#0A1A12",
    darkElevated: "#102820",
    darkSurface: "#16352A",
    darkBorder: "#234D41",
    darkBorderLight: "rgba(35, 77, 65, 0.6)",

    background: "#F3F6F4",
    backgroundAlt: "#E8EEEA",
    surface: "#FFFFFF",
    surfaceMuted: "#F1F5F2",
    surfaceElevated: "#FFFFFF",

    textPrimary: "#000000",
    textSecondary: "#4A5550",
    textTertiary: "#7A8781",
    textOnDark: "#FFFFFF",
    textOnDarkMuted: "#D3DCD7",

    border: "#CFD8D3",
    borderSubtle: "#E5EBE7",
    borderStrong: "#B8C4BE",

    success: "#0C8643",
    successSubtle: "rgba(12, 134, 67, 0.1)",
    warning: "#FADC06",
    warningSubtle: "rgba(250, 220, 6, 0.18)",
    error: "#C43D3D",
    errorSubtle: "rgba(196, 61, 43, 0.1)",
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
    subtle: "0 2px 8px rgba(0, 0, 0, 0.05)",
    elevated: "0 8px 24px rgba(0, 0, 0, 0.08)",
    floating: "0 14px 36px rgba(0, 0, 0, 0.12)",
    overlay: "0 24px 60px rgba(0, 0, 0, 0.22)",
    goldGlow: "0 4px 20px rgba(250, 220, 6, 0.28)",
    greenGlow: "0 4px 20px rgba(12, 134, 67, 0.24)",
  },
} as const;
