/**
 * Safe logging utility to prevent log injection attacks (CWE-117)
 */

const sanitizeLog = (msg: unknown): string => {
  if (typeof msg === 'string') {
    return msg.substring(0, 200).replace(/[\n\r]/g, ' ');
  }
  if (typeof msg === 'object' && msg !== null) {
    try {
      return JSON.stringify(msg).substring(0, 200);
    } catch {
      return '[Object]';
    }
  }
  return String(msg).substring(0, 200);
};

export const safeLogger = {
  log: (...args: unknown[]) => {
    console.log(...args.map(sanitizeLog));
  },
  error: (...args: unknown[]) => {
    console.error(...args.map(sanitizeLog));
  },
  warn: (...args: unknown[]) => {
    console.warn(...args.map(sanitizeLog));
  },
  info: (...args: unknown[]) => {
    console.info(...args.map(sanitizeLog));
  },
  debug: (...args: unknown[]) => {
    console.debug(...args.map(sanitizeLog));
  },
};
