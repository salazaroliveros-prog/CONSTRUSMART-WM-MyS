// Tailwind CSS v4 configuration is done via CSS @import + @theme
// This file is kept for IDE support and reference only
// All configuration is in src/index.css
import type { Config } from 'tailwindcss';
import tailwindAnimate from 'tailwindcss-animate';

export default {
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  plugins: [tailwindAnimate],
} satisfies Config;