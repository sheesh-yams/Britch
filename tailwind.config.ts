import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Britch design system
        ink: {
          DEFAULT: "#0E0E12",
          2: "#16161C",
          3: "#20202A",
        },
        paper: {
          DEFAULT: "#F4F1E9",
          2: "#E7E2D4",
        },
        volt: "#D6FB46",
        flush: "#FF4365",
        electric: "#2D2DF5",
      },
      fontFamily: {
        display: ["var(--font-clash-display)", "sans-serif"],
        sans: ["var(--font-general-sans)", "Helvetica Neue", "Arial", "sans-serif"],
        mono: ["var(--font-space-mono)", "Courier New", "monospace"],
      },
      fontSize: {
        "display-hero": "clamp(56px, 9vw, 128px)",
        "display-lg": "clamp(48px, 7vw, 96px)",
        "display-md": "clamp(32px, 5vw, 64px)",
      },
      boxShadow: {
        hard: "4px 4px 0 #0E0E12",
        "hard-volt": "5px 5px 0 #D6FB46",
        "hard-flush": "5px 5px 0 #FF4365",
        "hard-paper": "4px 4px 0 #F4F1E9",
      },
      borderRadius: {
        britch: "5px",
      },
      keyframes: {
        pulse: {
          "0%": { boxShadow: "0 0 0 0 rgba(214,251,70,0.7)" },
          "70%": { boxShadow: "0 0 0 7px rgba(214,251,70,0)" },
          "100%": { boxShadow: "0 0 0 0 rgba(214,251,70,0)" },
        },
        ticker: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
      },
      animation: {
        "pulse-volt": "pulse 2s infinite",
        ticker: "ticker 24s linear infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
