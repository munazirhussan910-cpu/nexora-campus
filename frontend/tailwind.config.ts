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
        background: "var(--background)",
        foreground: "var(--foreground)",
        nexora: {
          50: "#f6f7f9",
          100: "#edeef2",
          200: "#d7dbe3",
          300: "#b5bccb",
          400: "#8c97ad",
          500: "#6e7994",
          600: "#57607a",
          700: "#474e64",
          800: "#3d4254",
          900: "#1e2230",
          950: "#0f1118",
        },
        accent: {
          gold: "#D4AF37",
          crimson: "#9B111E",
          emerald: "#10B981",
          amber: "#F59E0B",
          cyan: "#18C5D8",
          indigo: "#6366F1",
        },
        brand: {
          purple: "#5B20A0",
          secondary: "#7A3DB8",
          light: "#E8DEFA",
          cyan: "#18C5D8",
          dark: "#0A0D14",
          card: "#121624",
          cardHover: "#181E30",
          border: "#232B3F",
          borderLight: "#323E5A",
        }
      },
    },
  },
  plugins: [],
};
export default config;
