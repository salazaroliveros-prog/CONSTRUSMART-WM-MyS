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
    include: ['antd', '@ant-design/icons'],
  },
  build: {
    chunkSizeWarningLimit: 5000,
    rollupOptions: {
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
