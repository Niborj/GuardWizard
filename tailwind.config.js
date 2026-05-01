/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        cato: {
          black: "#231F20",
          green: "#158864",
          "green-2": "#1FA078",
          "green-3": "#0E684C",
          forest: "#0A3529",
          navy: "#12362F",
          "navy-2": "#173F36",
          "navy-3": "#1F4C42",
          ink: "#101513",
          orange: "#158864",
          "orange-2": "#1FA078",
          cyan: "#158864",
          mist: "#F2F7F4",
          "mist-2": "#B7CEC5",
          line: "#315A50",
          danger: "#EF4444",
          ok: "#22C55E",
          warn: "#F59E0B",
        },
      },
      fontFamily: {
        sans: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
        mono: [
          "JetBrains Mono",
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "Consolas",
          "monospace",
        ],
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(21,136,100,0.38), 0 12px 36px rgba(0,0,0,0.28)",
      },
    },
  },
  plugins: [],
};
