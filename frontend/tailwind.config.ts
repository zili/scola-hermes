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
        primary: {
          DEFAULT: "#1E3A5F",
          light: "#2D5A8A",
          dark: "#0F1F33",
          50: "#E8EEF4",
          100: "#C5D5E5",
          200: "#9FB9D3",
          300: "#789DC1",
          400: "#5281AF",
          500: "#1E3A5F",
          600: "#1A3352",
          700: "#162C45",
          800: "#122538",
          900: "#0E1E2B",
        },
        secondary: {
          DEFAULT: "#E07B2A",
          light: "#F5A54D",
          dark: "#C56A1F",
          50: "#FEF3E6",
          100: "#FDE4CC",
          200: "#FBCF99",
          300: "#F9BA66",
          400: "#F7A533",
          500: "#E07B2A",
          600: "#C56A1F",
          700: "#A55914",
          800: "#85480A",
          900: "#643700",
        },
        accent: {
          DEFAULT: "#3D6B1F",
          light: "#4D8A2E",
          dark: "#2D4F16",
        },
      },
      fontFamily: {
        sans: ["var(--font-dm-sans)", "IBM Plex Sans", "system-ui", "sans-serif"],
        heading: ["var(--font-dm-sans)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        "card": "0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)",
        "card-hover": "0 4px 6px rgba(0,0,0,0.1), 0 2px 4px rgba(0,0,0,0.06)",
        "dropdown": "0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)",
      },
      animation: {
        "fade-in": "fadeIn 0.3s ease-out",
        "slide-up": "slideUp 0.3s ease-out",
        "slide-down": "slideDown 0.3s ease-out",
        "scale-in": "scaleIn 0.2s ease-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        slideDown: {
          "0%": { transform: "translateY(-10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        scaleIn: {
          "0%": { transform: "scale(0.95)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};

export default config;