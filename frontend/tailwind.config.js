/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        fintech: {
          darkBg: "#0b0f19",
          panel: "#111827",
          panelBorder: "#1f2937",
          accentBlue: "#3b82f6",
          accentTeal: "#14b8a6",
          accentCyan: "#06b6d4",
          bullish: "#10b981",
          bearish: "#ef4444",
        },
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
        mono: ["JetBrains Mono", "SFMono-Regular", "Menlo", "Monaco", "Consolas", "monospace"],
      },
    },
  },
  plugins: [],
};
