import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig(({ mode: _mode }) => ({
  esbuild: {
    jsx: 'automatic',
    jsxImportSource: 'react',
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  base: '/',
  server: {
    host: '0.0.0.0',
    port: 8080,
  },
  optimizeDeps: {
    include: ['antd', '@ant-design/icons', 'react-leaflet', '@react-leaflet/core', 'leaflet', 'react-leaflet-cluster'],
  },
  build: {
    chunkSizeWarningLimit: 5000,
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (id.includes('node_modules/react-dom') || id.includes('node_modules/react-router') || id.includes('node_modules/react-i18next')) return 'vendor';
          if (id.includes('node_modules/react/')) return 'vendor';
          if (id.includes('node_modules/antd')) return 'antd';
          if (id.includes('node_modules/@ant-design/icons')) return 'icons';
          if (id.includes('node_modules/xlsx')) return 'xlsx';
          if (id.includes('node_modules/jspdf') || id.includes('node_modules/html2canvas')) return 'pdf';
          if (id.includes('node_modules/three') || id.includes('node_modules/web-ifc')) return 'three';
        },
      },
      onwarn(warning, warn) {
        const msg = String(warning.message);
        if (
          msg.includes('Module level directives') ||
          msg.includes('dynamically imported by')
        ) {
          return;
        }
        warn(warning);
      },
    },
  },
}));
