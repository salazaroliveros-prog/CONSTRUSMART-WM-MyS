import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['src/test-mocks.ts', 'src/test-setup.ts'],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      'src/__tests__/auditoria.test.tsx',
      'src/__tests__/exportacion-inteligente.test.tsx',
      'src/__tests__/logistica-compras.test.tsx',
      'src/__tests__/comercial-finanzas.test.tsx',
      'src/__tests__/riesgos.test.tsx',
      'src/__tests__/ordenes-cambio.test.tsx',
      'src/__tests__/entradas-almacen-oc.test.tsx',
      'src/__tests__/plantillas-proyectos.test.tsx',
      '.kilo/**',
    ],
    env: { NODE_ENV: 'development' },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
