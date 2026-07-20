import { vi } from 'vitest';

// Mock global de safeLogger para todos los tests
// Use vi.hoisted to ensure mock is created before imports
const { safeLoggerMock } = vi.hoisted(() => ({
  safeLoggerMock: {
    log: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  },
}));

vi.mock('@/lib/safeLogger', () => ({
  safeLogger: safeLoggerMock,
}));

export { safeLoggerMock };
