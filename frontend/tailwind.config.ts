import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  "#e8f1fb",
          100: "#c0d9f4",
          300: "#5ba3e8",
          400: "#378add",
          500: "#1a6ebf",
          600: "#185fa5",
          700: "#0e4a80",
          900: "#042c53",
        },
        surface: {
          DEFAULT: "#03091A",
          card: "#071428",
          deep: "#040d1c",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      animation: {
        "fade-up": "fadeUp 0.4s ease-out both",
        "fade-in": "fadeIn 0.3s ease-out both",
      },
      keyframes: {
        fadeUp: { "0%": { opacity: "0", transform: "translateY(16px)" }, "100%": { opacity: "1", transform: "translateY(0)" } },
        fadeIn: { "0%": { opacity: "0" }, "100%": { opacity: "1" } },
      },
    },
  },
  plugins: [],
};
export default config;
