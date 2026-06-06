import { defineConfig } from "vite";
import path from "path";
import react from "@vitejs/plugin-react-swc";

// https://vitejs.dev/config/
export default defineConfig(({ mode: _mode }) => ({
  plugins: [react()],
  base: "/",
  server: {
    host: "::",
    port: 8080,
  },
  esbuild: {
    jsx: "automatic",
    jsxImportSource: "react",
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    chunkSizeWarningLimit: 2000,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          'ui-heavy': ['antd', 'recharts', 'framer-motion', '@tanstack/react-query'],
          three: ['three'],
          'web-ifc': ['web-ifc'],
          ofimatica: ['jspdf', 'html2canvas', 'xlsx'],
        },
      },
    },
  },
}));
