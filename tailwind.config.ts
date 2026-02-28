import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        "wabi-washi": "var(--wabi-washi)",
        "wabi-patina": "var(--wabi-patina)",
        "wabi-clay": "var(--wabi-clay)",
        "wabi-sumi": "var(--wabi-sumi)",
        "wabi-ink": "var(--wabi-ink)",
        "wabi-ink-light": "var(--wabi-ink-light)",
        "wabi-moss": "var(--wabi-moss)",
        "wabi-rust": "var(--wabi-rust)",
        "wabi-stone": "var(--wabi-stone)",
        "wabi-sand": "var(--wabi-sand)",
        "wabi-charcoal": "var(--wabi-charcoal)",
        "mistral-dark": "#0B0C10",
        "mistral-sand": "#F4F0E8",
        "mistral-orange": "#FF8A00",
        "mistral-orange-light": "#FFB044",
        "mistral-beige": "#FBF9F6",
      },
      fontFamily: {
        serif: ["var(--font-crimson)", "var(--font-playfair)", "serif"],
        display: ["var(--font-playfair)", "serif"],
        mono: ["var(--font-geist-mono)", "monospace"],
      },
      animation: {
        breathe: "breathe 8s ease-in-out infinite",
        float: "float 6s ease-in-out infinite",
        drift: "drift 20s linear infinite",
        fadeIn: "fadeIn 1s ease-out forwards",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      boxShadow: {
        'mistral': '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
      }
    },
  },
  plugins: [
    require("@tailwindcss/typography"),
  ],
};
export default config;
