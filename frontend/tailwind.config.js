/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"IBM Plex Sans Arabic"', '"IBM Plex Sans"', "system-ui", "sans-serif"],
        mono: ['"IBM Plex Mono"', "ui-monospace", "monospace"],
      },
      colors: {
        // Link Lift teal brand (from the original system) + considered slate neutrals
        brand: {
          50: "#e9f6f3", 100: "#c9ebe4", 200: "#95d8cb", 300: "#5cc1af",
          400: "#2ba48f", 500: "#0e7c6b", 600: "#0b6457", 700: "#0a5047",
          800: "#0a4038", 900: "#09332d",
        },
        ink: {
          DEFAULT: "#1b2127", soft: "#5c6773", faint: "#8a97a4",
        },
      },
      boxShadow: {
        card: "0 1px 2px rgba(27,33,39,0.05), 0 4px 16px rgba(27,33,39,0.06)",
      },
      borderRadius: { xl2: "1rem" },
    },
  },
  plugins: [],
};
