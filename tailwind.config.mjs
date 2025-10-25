import { defineConfig } from "tailwindcss";

export default defineConfig({
  darkMode: false,
  content: [
    "./src/**/*.{js,jsx,ts,tsx,mdx}",
    "./components/**/*.{js,jsx,ts,tsx,mdx}",
    "./app/**/*.{js,jsx,ts,tsx,mdx}",
  ],
  plugins: [
    ({ addVariant }) => {
      addVariant("theme-dark", '[data-theme="dark"] &');
    },
  ],
});
