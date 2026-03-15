import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Palette LibraMali — éditorial épuré
        ivoire: {
          DEFAULT: "#F7F4EF",
          dark: "#EDE8DF",
        },
        encre: {
          DEFAULT: "#1A1814",
          light: "#2D2A26",
          muted: "#6B6560",
        },
        or: {
          DEFAULT: "#C9A84C",
          light: "#DFC278",
          dark: "#A8873A",
        },
        sable: {
          DEFAULT: "#E8E0D0",
          dark: "#D4C9B5",
        },
        success: "#2D7D5E",
        warning: "#C9A84C",
        error: "#C0392B",
      },
      fontFamily: {
        display: ["'Playfair Display'", "Georgia", "serif"],
        body: ["'DM Sans'", "system-ui", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
      },
      fontSize: {
        "display-xl": ["3.5rem", { lineHeight: "1.1", letterSpacing: "-0.02em" }],
        "display-lg": ["2.75rem", { lineHeight: "1.15", letterSpacing: "-0.02em" }],
        "display-md": ["2rem", { lineHeight: "1.2", letterSpacing: "-0.01em" }],
      },
      spacing: {
        "18": "4.5rem",
        "88": "22rem",
        "128": "32rem",
      },
      borderRadius: {
        "4xl": "2rem",
      },
      boxShadow: {
        "card": "0 2px 16px 0 rgba(26,24,20,0.06)",
        "card-hover": "0 8px 32px 0 rgba(26,24,20,0.12)",
        "float": "0 16px 48px 0 rgba(26,24,20,0.16)",
      },
      animation: {
        "fade-in": "fadeIn 0.4s ease-out forwards",
        "slide-up": "slideUp 0.4s ease-out forwards",
        "slide-in": "slideIn 0.3s ease-out forwards",
        "shimmer": "shimmer 1.5s infinite",
        "shake":   "shake 0.4s ease-in-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideIn: {
          "0%": { opacity: "0", transform: "translateX(-8px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        shake: {
          "0%, 100%": { transform: "translateX(0)" },
          "20%":       { transform: "translateX(-4px)" },
          "40%":       { transform: "translateX(4px)" },
          "60%":       { transform: "translateX(-4px)" },
          "80%":       { transform: "translateX(4px)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;