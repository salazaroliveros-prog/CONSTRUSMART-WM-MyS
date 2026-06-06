import { defineConfig } from "vite";
import path from "path";

// https://vitejs.dev/config/
// Vite 5.x processa JSX nativamente con esbuild - no necesita plugin
export default defineConfig(({ mode: _mode }) => ({
  esbuild: {
    jsx: "automatic",
    jsxImportSource: "react",
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: "::",
    port: 8080,
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