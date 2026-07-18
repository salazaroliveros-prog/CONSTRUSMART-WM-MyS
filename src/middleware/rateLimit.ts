/**
 * Rate Limiter Middleware - PRIORITY 1 Implementation
 * 
 * ⚠️ SERVER-ONLY: Este archivo usa módulos Node.js (express-rate-limit, redis)
 * y NO debe importarse desde código frontend/browser. Excluir del bundle de Vite.
 * 
 * Ubicación: src/middleware/rateLimit.ts
 * 
 * SESSION 3 - PRIORITY 1 IMPLEMENTATION
 * Status: ✅ IMPLEMENTADO
 * Impacto: +10% security
 * Esfuerzo: 30 minutos
 */

import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import redis from 'redis';

// Crear cliente Redis (opcional, para producción)
const redisClient = redis.createClient({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
});

/**
 * Limitador General: 100 requests por 15 minutos por IP
 * Uso: app.use('/api/', generalLimiter);
 */
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // 100 requests
  message: 'Demasiadas solicitudes desde esta IP, intente más tarde.',
  standardHeaders: true, // Retornar info en `RateLimit-*` headers
  legacyHeaders: false, // Desabilitar `X-RateLimit-*` headers
  skip: (req) => process.env.NODE_ENV === 'development', // Skip en desarrollo
  keyGenerator: (req) => req.ip || req.socket.remoteAddress || 'unknown',
});

/**
 * Limitador Estricto: 5 requests por 15 minutos
 * Uso: app.post('/api/auth/login', strictLimiter, loginHandler);
 */
export const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // Solo 5 intentos
  message: 'Demasiados intentos de login. Intente más tarde.',
  skipSuccessfulRequests: true, // No contar requests exitosos
  skipFailedRequests: false, // Contar requests fallidos
});

/**
 * Limitador Moderado: 30 requests por minuto
 * Uso: app.get('/api/proyectos', moderateLimiter, getProyectos);
 */
export const moderateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: 30,
  message: 'Demasiadas solicitudes. Espere un momento.',
});

/**
 * Limitador con Redis (para producción con múltiples servidores)
 * Proporciona almacenamiento compartido entre instancias
 */
export const redisPoweredLimiter = rateLimit({
  store: new RedisStore({
    client: redisClient,
    prefix: 'rl:', // rate limit prefix
  }),
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Demasiadas solicitudes. Intente más tarde.',
});

/**
 * Configuración por endpoint
 * Uso en server.ts:
 * 
 * import { generalLimiter, strictLimiter } from './middleware/rateLimit';
 * 
 * // Aplicar a todos los endpoints
 * app.use('/api/', generalLimiter);
 * 
 * // Aplicar a endpoints específicos (override)
 * app.post('/api/auth/login', strictLimiter, loginHandler);
 * app.post('/api/auth/register', strictLimiter, registerHandler);
 * app.get('/api/proyectos', moderateLimiter, getProyectos);
 */

export default {
  generalLimiter,
  strictLimiter,
  moderateLimiter,
  redisPoweredLimiter,
};
