import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/lib/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/types/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: "#f4f4f5",
        ink: "#18181b",
        stone: "#71717a",
        line: "#e4e4e7",
        panel: "#ffffff",
        success: "#16a34a",
        danger: "#dc2626",
      },
      fontFamily: {
        sans: ["var(--font-sans)"],
      },
      boxShadow: {
        panel: "0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)",
        card: "0 4px 12px rgba(0,0,0,0.06)",
      },
    },
  },
  plugins: [],
};

export default config;
