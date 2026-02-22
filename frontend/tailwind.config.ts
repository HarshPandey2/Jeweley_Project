import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        luxury: {
          dark: "#0F172A",
          slate: "#64748B",
          gold: "#D4AF37",
          "gold-light": "#E8C547",
          "gold-dark": "#B8962E",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-gold": "linear-gradient(135deg, #D4AF37 0%, #B8962E 100%)",
      },
      boxShadow: {
        gold: "0 0 20px rgba(212, 175, 55, 0.2)",
        "gold-lg": "0 0 40px rgba(212, 175, 55, 0.25)",
      },
    },
  },
  plugins: [],
};

export default config;
