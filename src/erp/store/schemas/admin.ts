import { z } from 'zod';

export const centroCostoSchema = z.object({
  id: z.string(),
  proyectoId: z.string(),
  codigo: z.string(),
  nombre: z.string(),
  presupuestoAsignado: z.number().default(0),
  gastoActual: z.number().default(0),
  tipo: z.enum(['directo', 'indirecto', 'administrativo'] as const).default('directo'),
});

export const auditLogSchema = z.object({
  id: z.string(),
  usuarioId: z.string().optional(),
  usuarioNombre: z.string(),
  accion: z.string(),
  entidad: z.string(),
  entidadId: z.string().optional(),
  valoresAnteriores: z.record(z.unknown()).optional(),
  valoresNuevos: z.record(z.unknown()).optional(),
  createdAt: z.string(),
});

export const appSettingsSchema = z.object({
  uiMode: z.enum(['shadcn','antd'] as const).default('shadcn'),
  appTheme: z.enum(['light','dark','high-contrast','ant-design','dark-pro','material3','glassmorphism','neomorphism'] as const).default('ant-design'),
  primaryColor: z.string().default('#1677ff'),
  language: z.enum(['es','en'] as const).default('es'),
  dateFormat: z.enum(['DD/MM/YYYY','MM/DD/YYYY','YYYY-MM-DD'] as const).default('DD/MM/YYYY'),
  currency: z.enum(['GTQ','USD'] as const).default('GTQ'),
  sidebarCollapsed: z.boolean().default(false),
  sidebarPosition: z.enum(['left','right','overlay'] as const).default('left'),
  sidebarMode: z.enum(['expanded','collapsed','hover-expand','mini'] as const).default('expanded'),
  sidebarWidth: z.union([z.literal(240), z.literal(280), z.literal(320)]).default(240),
  sidebarMiniWidth: z.union([z.literal(64), z.literal(72), z.literal(80)]).default(64),
  animationsEnabled: z.boolean().default(true),
  compactMode: z.boolean().default(false),
  fontSize: z.enum(['small','medium','large'] as const).default('medium'),
  fontFamily: z.enum(['system-ui','inter','roboto','open-sans','poppins'] as const).default('system-ui'),
  borderRadius: z.enum(['none','small','medium','large','full'] as const).default('medium'),
  spacingScale: z.enum(['compact','normal','spacious'] as const).default('normal'),
  densityTable: z.enum(['compact','normal','comfortable'] as const).default('normal'),
  breadcrumbsEnabled: z.boolean().default(true),
  footerEnabled: z.boolean().default(true),
  touchMode: z.boolean().default(false),
  notificaciones: z.object({
    stockCritico: z.boolean().default(true),
    ordenesCambio: z.boolean().default(true),
    avancesObra: z.boolean().default(true),
    desviaciones: z.boolean().default(true),
  }).default({ stockCritico: true, ordenesCambio: true, avancesObra: true, desviaciones: true }),
  empresaInfo: z.object({
    nombre: z.string().optional(),
    nit: z.string().optional(),
    telefono: z.string().optional(),
    email: z.string().optional(),
    direccion: z.string().optional(),
    ciudad: z.string().optional(),
    pais: z.string().optional(),
  }).optional(),
});
