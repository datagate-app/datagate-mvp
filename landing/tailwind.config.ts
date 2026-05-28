import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#0D1A34",
        navy: "#123B73",
        blue: "#3B82F6",
        cyan: "#06B6D4",
        success: "#10B981",
        bg: "#F8FAFC",
        text: "#0F172A",
        muted: "#64748B",
        line: "#E2E8F0",
        amber: "#F59E0B",
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      boxShadow: {
        soft: "0 1px 3px rgba(13,26,52,0.04), 0 8px 24px rgba(13,26,52,0.06)",
        lift: "0 4px 12px rgba(13,26,52,0.06), 0 20px 50px rgba(13,26,52,0.10)",
        glow: "0 0 0 1px rgba(59,130,246,0.15), 0 20px 60px rgba(18,59,115,0.25)",
      },
      keyframes: {
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        draw: {
          "0%": { strokeDashoffset: "1000" },
          "100%": { strokeDashoffset: "0" },
        },
        growBar: {
          "0%": { transform: "scaleY(0)" },
          "100%": { transform: "scaleY(1)" },
        },
      },
      animation: {
        fadeUp: "fadeUp 0.7s ease forwards",
        draw: "draw 1.6s ease forwards",
        growBar: "growBar 1s cubic-bezier(.2,.7,.2,1) forwards",
      },
    },
  },
  plugins: [],
};

export default config;
