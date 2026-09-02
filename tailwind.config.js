/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        atelier: {
          950: "#09080d",
          900: "#110f17",
          850: "#171420",
          800: "#1f1b2c",
          700: "#2d273f",
          600: "#443b5e",
          500: "#64578b",
          400: "#8e7eb8",
          300: "#baaed8",
          200: "#ded6f0",
          100: "#f1edfa",
        },
        gold: {
          50: "#fdfbf7",
          100: "#f9f5ec",
          200: "#f1e7d2",
          300: "#e5d2ac",
          400: "#d6b77e",
          500: "#c79b54",
          600: "#ab7d3f",
          700: "#8b5f33",
          800: "#724c2d",
        },
        emerald: {
          deep: "#0b2e23",
          vibrant: "#10b981",
        },
        ruby: {
          deep: "#3d0b16",
          vibrant: "#e11d48",
        }
      },
      fontFamily: {
        serif: ["Playfair Display", "Cinzel", "Georgia", "serif"],
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
      },
    },
  },
  plugins: [],
};
