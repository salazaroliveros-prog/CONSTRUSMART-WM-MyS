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
          three: ['three'],
          'web-ifc': ['web-ifc'],
          antd: ['antd', '@ant-design/icons'],
        },
      },
    },
  },
}));