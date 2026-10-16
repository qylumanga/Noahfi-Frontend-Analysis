import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: { DEFAULT: "#0C1A2B", soft: "#4A5B70", faint: "#8091A5" },
        glacier: { DEFAULT: "#EEF3F7", deep: "#DCE6EE" },
        lake: { DEFAULT: "#0E7C8B", dark: "#0A5F6B", light: "#CFEAEE" },
        maple: "#DC3B2F",
      },
      fontFamily: {
        display: ["'Bricolage Grotesque Variable'", "system-ui", "sans-serif"],
        sans: ["'Instrument Sans Variable'", "system-ui", "sans-serif"],
      },
      letterSpacing: { tightest: "-0.035em" },
      boxShadow: {
        panel: "0 1px 0 rgba(12,26,43,.04), 0 24px 48px -24px rgba(12,26,43,.28)",
      },
    },
  },
  plugins: [],
};

export default config;
