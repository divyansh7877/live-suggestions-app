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
        primary: "#6366f1",
        "primary-hover": "#4f46e5",
        surface: "#1e1e2e",
        "surface-light": "#2a2a3e",
        "surface-lighter": "#363650",
        border: "#3a3a52",
        "text-primary": "#e2e8f0",
        "text-secondary": "#94a3b8",
        "text-muted": "#64748b",
        accent: {
          blue: "#3b82f6",
          green: "#22c55e",
          amber: "#f59e0b",
          red: "#ef4444",
          purple: "#a855f7",
        },
      },
    },
  },
  plugins: [],
};

export default config;
