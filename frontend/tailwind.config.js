/** Adwa Lens Design System
 *  Inspired by the Victory of Adwa & Ethiopian heritage motifs.
 *  NOT a generic dark/grey theme — warm metallic + earthen palette.
 */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        "imperial-gold": {
          DEFAULT: "#D4AF37",
          light: "#E9CC6B",
          dark: "#9C7F22"
        },
        "adwa-emerald": {
          DEFAULT: "#009A44",
          light: "#2FBE68",
          dark: "#00622C"
        },
        "adwa-crimson": {
          DEFAULT: "#E00000",
          light: "#FF3B3B",
          dark: "#960000"
        },
        "obsidian": {
          DEFAULT: "#120E0C",
          raised: "#1C1613",
          overlay: "#241C18"
        },
        "wanza-wood": {
          DEFAULT: "#3E2723",
          light: "#5D4037"
        },
        "parchment": "#F4E9D8"
      },
      fontFamily: {
        display: ["'Noto Serif Ethiopic'", "'Playfair Display'", "serif"],
        body: ["'Inter'", "'Noto Sans Ethiopic'", "sans-serif"]
      },
      backgroundImage: {
        "adwa-geometry":
          "radial-gradient(circle at 20% 20%, rgba(212,175,55,0.10) 0%, transparent 45%), radial-gradient(circle at 80% 0%, rgba(0,154,68,0.10) 0%, transparent 40%), radial-gradient(circle at 50% 100%, rgba(224,0,0,0.08) 0%, transparent 45%)",
        "metallic-glass":
          "linear-gradient(135deg, rgba(212,175,55,0.16) 0%, rgba(212,175,55,0.02) 60%)"
      },
      boxShadow: {
        "gold-glow": "0 0 24px rgba(212,175,55,0.35)",
        "emerald-glow": "0 0 24px rgba(0,154,68,0.30)"
      },
      borderRadius: {
        xl2: "1.25rem"
      }
    }
  },
  plugins: []
};
