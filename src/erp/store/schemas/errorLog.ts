import { z } from 'zod';

export const errorLogSchema = z.object({
  id: z.string(),
  errorCode: z.string().optional(),
  errorMessage: z.string(),
  errorStack: z.string().optional(),
  errorType: z.string().optional(),
  severity: z.enum(['debug', 'info', 'warning', 'error', 'critical'] as const).default('error'),
  component: z.string().optional(),
  functionName: z.string().optional(),
  lineNumber: z.number().optional(),
  userId: z.string().nullable().optional(),
  proyectoId: z.string().nullable().optional(),
  requestId: z.string().optional(),
  requestMethod: z.string().optional(),
  requestPath: z.string().optional(),
  requestParams: z.record(z.any()).optional(),
  requestHeaders: z.record(z.any()).optional(),
  context: z.record(z.any()).optional(),
  resolved: z.boolean().default(false),
  resolvedAt: z.string().nullable().optional(),
  resolvedBy: z.string().nullable().optional(),
  resolutionNotes: z.string().nullable().optional(),
  createdAt: z.string(),
  entidad: z.string().optional(),
  entidadId: z.string().optional(),
});

export type ErrorLogEntry = z.infer<typeof errorLogSchema>;
