import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        display: ["var(--font-oswald)", "Impact", "sans-serif"],
      },
      colors: {
        brand: {
          50: "#f7fee7",
          100: "#ecfccb",
          200: "#d9f99d",
          300: "#d4f97f",
          400: "#bef264", // Electric Lime — hero accent
          500: "#a3e635",
          600: "#84cc16",
          700: "#65a30d",
          800: "#4d7c0f",
          900: "#365314",
          950: "#1a2e05",
        },
        accent: {
          500: "#22d3ee",
          600: "#06b6d4",
        },
        surface: {
          DEFAULT: "#0f172a",
          raised: "#1e293b",
          overlay: "#334155",
        },
      },
      backgroundImage: {
        "gradient-brand": "linear-gradient(135deg, #65a30d 0%, #bef264 100%)",
        "gradient-brand-soft":
          "linear-gradient(135deg, #1a2e05 0%, #0f172a 100%)",
        "gradient-mesh":
          "radial-gradient(ellipse 80% 60% at 20% -10%, rgba(190,242,100,0.12) 0%, transparent 60%), radial-gradient(ellipse 60% 50% at 80% 110%, rgba(34,211,238,0.08) 0%, transparent 60%)",
      },
      boxShadow: {
        soft: "0 1px 2px rgba(0, 0, 0, 0.2), 0 4px 12px rgba(0, 0, 0, 0.15)",
        glow: "0 8px 32px -4px rgba(190, 242, 100, 0.3)",
        "glow-dark": "0 8px 32px -4px rgba(190, 242, 100, 0.4)",
        "glow-input": "0 0 0 3px rgba(190, 242, 100, 0.25)",
      },
      animation: {
        "fade-in": "fadeIn 200ms ease-out",
        "slide-up": "slideUp 250ms ease-out",
        pop: "pop 350ms cubic-bezier(0.34, 1.56, 0.64, 1)",
        shimmer: "shimmer 2s linear infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        pop: {
          "0%": { opacity: "0", transform: "scale(0.9)" },
          "60%": { opacity: "1", transform: "scale(1.05)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
