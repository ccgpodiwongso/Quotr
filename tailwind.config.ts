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
        background: "#f5f5f6",
        card: "#ffffff",
        primary: "#111112",
        accent: "#2563eb",
        status: {
          paid: "#16a34a",
          accepted: "#16a34a",
          pending: "#d97706",
          overdue: "#dc2626",
          sent: "#2563eb",
        },
      },
      fontFamily: {
        sans: ['"Geist Sans"', "system-ui", "sans-serif"],
        mono: ['"Geist Mono"', "monospace"],
      },
      borderRadius: {
        card: "6px",
        input: "4px",
      },
    },
  },
  plugins: [],
};

export default config;
