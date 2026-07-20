import { vi } from 'vitest';

// Mock global de safeLogger para todos los tests
// El mock debe definirse antes de que se cargue el módulo
const safeLoggerMock = {
  log: vi.fn(),
  error: vi.fn(),
  warn: vi.fn(),
  info: vi.fn(),
  debug: vi.fn(),
};

vi.mock('@/lib/safeLogger', () => ({
  safeLogger: safeLoggerMock,
}));

export { safeLoggerMock };
