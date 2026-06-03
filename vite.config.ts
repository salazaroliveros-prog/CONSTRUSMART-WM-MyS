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
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          'ui-radix': ['@radix-ui/react-dialog', '@radix-ui/react-tooltip', '@radix-ui/react-toast', '@radix-ui/react-popover', '@radix-ui/react-select', '@radix-ui/react-dropdown-menu', '@radix-ui/react-tabs'],
          three: ['three'],
          'web-ifc': ['web-ifc'],
          pdf: ['jspdf', 'html2canvas'],
          charts: ['recharts'],
          icons: ['lucide-react'],
          'react-query': ['@tanstack/react-query'],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
}));
