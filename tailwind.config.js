// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",  // Scans all JS, JSX, TS, TSX files in src/
    "./public/index.html",         // Also scans your public/index.html
  ],
  theme: {
    extend: {
        fontFamily: {
            inter: ['Inter', 'sans-serif'], // Custom font family for Inter
        },
    },
  },
  plugins: [],
}