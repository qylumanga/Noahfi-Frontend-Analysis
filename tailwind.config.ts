import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./features/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: { DEFAULT: "#0A2342", soft: "#475569", faint: "#94A3B8" },
        glacier: { DEFAULT: "#F4F8FB", deep: "#E8F5F9" },
        lake: { DEFAULT: "#0B6B8F", dark: "#084E69", light: "#E8F5F9" },
        teal: { DEFAULT: "#14B6A4", dark: "#0E8F82" },
        maple: "#EF4444",
      },
      fontFamily: {
        display: ["'Plus Jakarta Sans Variable'", "system-ui", "sans-serif"],
        sans: ["'Plus Jakarta Sans Variable'", "system-ui", "sans-serif"],
      },
      letterSpacing: { tightest: "-0.035em" },
      boxShadow: {
        panel: "0 1px 0 rgba(10,35,66,.04), 0 24px 48px -24px rgba(10,35,66,.28)",
      },
      keyframes: {
        marquee: {
          from: { transform: "translateX(0)" },
          to: { transform: "translateX(calc(-100% - var(--gap)))" },
        },
        "marquee-vertical": {
          from: { transform: "translateY(0)" },
          to: { transform: "translateY(calc(-100% - var(--gap)))" },
        },
        "shimmer-slide": {
          to: { transform: "translate(calc(100cqw - 100%), 0)" },
        },
        "spin-around": {
          "0%": { transform: "translateZ(0) rotate(0)" },
          "15%, 35%": { transform: "translateZ(0) rotate(90deg)" },
          "65%, 85%": { transform: "translateZ(0) rotate(270deg)" },
          "100%": { transform: "translateZ(0) rotate(360deg)" },
        },
        "shiny-text": {
          "0%, 90%, 100%": { "background-position": "calc(-100% - var(--shiny-width)) 0" },
          "30%, 60%": { "background-position": "calc(100% + var(--shiny-width)) 0" },
        },
      },
      animation: {
        marquee: "marquee var(--duration) linear infinite",
        "marquee-vertical": "marquee-vertical var(--duration) linear infinite",
        "shimmer-slide": "shimmer-slide var(--speed) ease-in-out infinite alternate",
        "spin-around": "spin-around calc(var(--speed) * 2) infinite linear",
        "shiny-text": "shiny-text 8s infinite",
      },
    },
  },
  plugins: [],
};

export default config;
