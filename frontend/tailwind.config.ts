/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        heritage: {
          gold: "#C4A035",
          earth: "#8B4513",
          stone: "#4A4A4A",
          sand: "#F5E6D3",
        },
      },
    },
  },
  plugins: [],
};
