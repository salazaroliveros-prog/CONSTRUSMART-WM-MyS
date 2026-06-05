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
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          'ui-radix': [
            '@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-accordion', '@radix-ui/react-tabs',
            '@radix-ui/react-tooltip', '@radix-ui/react-select',
          ],
          'antd-chunk': ['antd'],
          three: ['three'],
          'web-ifc': ['web-ifc'],
          'jspdf': ['jspdf', 'html2canvas'],
          charts: ['recharts'],
          'react-query': ['@tanstack/react-query'],
          xlsx: ['xlsx'],
          framer: ['framer-motion'],
        },
      },
    },
  },
}));
