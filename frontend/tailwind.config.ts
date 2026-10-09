import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
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
        sidebar: "var(--sidebar)",
        header: "var(--header)",
        surface: {
          DEFAULT: "var(--surface)",
          secondary: "var(--surface-secondary)",
          hover: "var(--surface-hover)",
          elevated: "var(--surface-elevated)",
        },
        gold: {
          DEFAULT: "var(--gold)",
          hover: "var(--gold-hover)",
          foreground: "var(--gold-foreground)",
        },
        border: {
          DEFAULT: "var(--border)",
          subtle: "var(--border-subtle)",
        },
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        primary: {
          DEFAULT: "var(--primary)",
          hover: "var(--primary-hover)",
          foreground: "var(--primary-foreground)",
        },
        accentTheme: {
          DEFAULT: "var(--accent)",
          hover: "var(--accent-hover)",
          foreground: "var(--accent-foreground)",
        },
        success: {
          DEFAULT: "var(--success)",
          foreground: "var(--success-foreground)",
        },
        warning: {
          DEFAULT: "var(--warning)",
          foreground: "var(--warning-foreground)",
        },
        danger: {
          DEFAULT: "var(--danger)",
          foreground: "var(--danger-foreground)",
        },
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
          DEFAULT: "var(--accent)",
          gold: "#D4AF37",
          crimson: "#9B111E",
          emerald: "#10B981",
          amber: "#F59E0B",
          cyan: "#18C5D8",
          indigo: "#6366F1",
          violet: "#A78BFA",
          blue: "#245CFF",
        },
        brand: {
          purple: "#5B20A0",
          secondary: "#7A3DB8",
          light: "#E8DEFA",
          cyan: "#18C5D8",
          dark: "#0A0D14",
          card: "var(--surface)",
          cardHover: "var(--surface-hover)",
          border: "var(--border)",
          borderLight: "var(--border-subtle)",
        },
      },
      boxShadow: {
        'subtle': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'elevated': '0 4px 12px 0 rgba(0, 0, 0, 0.08)',
        'elevated-dark': '0 8px 30px -10px rgba(0, 0, 0, 0.5)',
      },
    },
  },
  plugins: [],
};
export default config;
