import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#F8FAFC",
        foreground: "#0F172A",
        primary: {
          DEFAULT: "#1F7A63",
          foreground: "#F8FAFC",
        },
        accent: {
          DEFAULT: "#F97316",
          foreground: "#F8FAFC",
        },
      },
      borderRadius: {
        lg: "0.75rem",
        md: "0.5rem",
        sm: "0.375rem",
      },
    },
  },
  plugins: [],
};

export default config;
