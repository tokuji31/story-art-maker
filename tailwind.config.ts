import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // 絵本らしい、やさしくあたたかい色
        cream: "#FFF8F0",
        paper: "#FBF1E4",
        ink: "#4A3F35",
        peach: "#E8A87C",
        terracotta: "#C97B5A",
        sage: "#9DBF9E",
        sky: "#A7C7D9",
        sun: "#F2C879",
      },
      fontFamily: {
        rounded: [
          "Hiragino Maru Gothic ProN",
          "Quicksand",
          "Comic Sans MS",
          "system-ui",
          "sans-serif",
        ],
      },
      boxShadow: {
        soft: "0 4px 20px -8px rgba(120, 90, 60, 0.25)",
      },
    },
  },
  plugins: [],
};

export default config;
