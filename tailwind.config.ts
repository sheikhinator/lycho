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
        void: "var(--void)",
        deep: "var(--deep)",
        surface: "var(--surface)",
        border: "var(--border)",
        gold: "var(--gold)",
        pulse: "var(--pulse)",
        ivory: "var(--ivory)",
        muted: "var(--muted)",
      },
      fontFamily: {
        bebas: ["var(--font-bebas-neue)", "sans-serif"],
        cormorant: ["var(--font-cormorant)", "serif"],
        sans: ["var(--font-dm-sans)", "sans-serif"],
        mono: ["var(--font-dm-mono)", "monospace"],
      },
    },
  },
  plugins: [],
};
export default config;
