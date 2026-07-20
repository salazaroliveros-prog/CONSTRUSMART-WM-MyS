import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['src/test-mocks.ts', 'src/test-setup.ts'],
    include: ['src/erp/__tests__/**/*.test.ts', 'src/lib/__tests__/**/*.test.ts', 'src/__tests__/**/*.test.tsx', 'tests/e2e/**/*.spec.ts'],
    env: { NODE_ENV: 'development' },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
