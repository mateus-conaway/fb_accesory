/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        canvas: "#1e1e1e",
        surface: {
          DEFAULT: "#252526",
          raised: "#2d2d2d",
          card: "#333333",
          hover: "#3c3c3c",
          overlay: "#2d2d2d",
        },
        accent: {
          DEFAULT: "#00e5ff",
          dim: "#00e5ff33",
          glow: "#00e5ff40",
        },
      },
      boxShadow: {
        "accent-glow": "0 0 24px rgba(0, 229, 255, 0.22)",
        "accent-glow-sm": "0 0 12px rgba(0, 229, 255, 0.18)",
        card: "0 4px 24px rgba(0, 0, 0, 0.5)",
      },
      borderRadius: {
        "2xl": "16px",
        "3xl": "20px",
      },
    },
  },
  plugins: [],
};
