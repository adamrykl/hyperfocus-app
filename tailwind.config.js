/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "#0f0f0f",
        surface: "#1a1a1a",
        elevated: "#242424",
        border: "rgba(255, 255, 255, 0.08)",
        accent: "#e8d5b5",
        "text-primary": "#f5f5f5",
        "text-secondary": "#8a8a8a",
        "text-tertiary": "#555555",
        success: "#7fb069",
        warning: "#e8a838",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
      },
      animation: {
        "toast-enter": "toastEnter 300ms cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "toast-exit": "toastExit 200ms ease-in forwards",
        "collapse-open": "collapseOpen 300ms cubic-bezier(0.4, 0, 0.2, 1) forwards",
        "collapse-close": "collapseClose 300ms cubic-bezier(0.4, 0, 0.2, 1) forwards",
        spring: "spring 200ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards",
      },
      keyframes: {
        toastEnter: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        toastExit: {
          "0%": { opacity: "1", transform: "translateY(0)" },
          "100%": { opacity: "0", transform: "translateY(-10px)" },
        },
        collapseOpen: {
          "0%": { gridTemplateRows: "0fr" },
          "100%": { gridTemplateRows: "1fr" },
        },
        collapseClose: {
          "0%": { gridTemplateRows: "1fr" },
          "100%": { gridTemplateRows: "0fr" },
        },
        spring: {
          "0%": { transform: "scale(0)" },
          "100%": { transform: "scale(1)" },
        },
      },
    },
  },
  plugins: [],
};
