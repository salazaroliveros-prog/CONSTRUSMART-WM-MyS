import { vi } from 'vitest';

const mockTranslations: Record<string, Record<string, string>> = {
  'calidad_cumplimiento': {
    'todos_proyectos': 'Cumplimiento de Calidad',
    'descripcion': 'Monitoreo de cumplimiento normativo',
    'cumplimiento_global': 'Cumplimiento Global',
    'nc_pendientes': 'NC Pendientes',
    'pruebas_realizadas': 'Pruebas Realizadas',
    'liberaciones_ok': 'Liberaciones OK',
    'selecciona_proyecto': 'Selecciona un proyecto',
    'todas': 'Todas',
    'nc': 'No Conformidades',
    'pruebas': 'Pruebas',
    'liberaciones': 'Liberaciones',
    'ok': 'OK',
    'de_total': 'de total',
  },
  'dashboard': {
    'todos_proyectos': 'Dashboard',
    'descripcion': 'Resumen general del sistema',
    'proyectos_totales': 'Proyectos Totales',
    'cartera': 'Cartera',
    'utilidad': 'Utilidad',
    'margen_promedio': 'Margen Promedio',
    'proyectos_en_riesgo': 'En Riesgo',
    'oc_pendientes': 'OC Pendientes',
    'empleados_activos': 'Empleados',
    'flujo_neto': 'Flujo Neto',
  },
  'presupuestos': {
    'todos_proyectos': 'Presupuestos',
    'descripcion': 'Gestión de presupuestos',
    'total': 'Total',
    'monto': 'Monto',
    'presupuestos': 'Presupuestos',
    'agregar_presupuesto': 'Agregar Presupuesto',
  },
  'hitos': {
    'todos_proyectos': 'Hitos',
    'descripcion': 'Gestión de hitos del proyecto',
    'total_hitos': 'Total hitos',
    'completados': 'Completados',
    'pendientes': 'Pendientes',
    'vencidos': 'Vencidos',
    'cumplimiento': '% Cumplimiento',
  },
  'rendimiento_campo': {
    'todos_proyectos': 'Rendimiento Campo',
    'descripcion': 'Análisis de rendimiento',
    'registros': 'Registros',
    'promedio': 'Promedio',
    'cuadrillas': 'Cuadrillas',
  },
  'bodega': {
    'todos_proyectos': 'Bodega',
    'descripcion': 'Gestión de inventarios',
  },
  'curvas_s': {
    'todos_proyectos': 'Curvas S',
    'descripcion': 'Análisis de curvas',
  },
  'crm': {
    'todos_proyectos': 'CRM',
    'descripcion': 'Gestión de clientes',
  },
  'cotizaciones': {
    'todos_proyectos': 'Cotizaciones',
    'descripcion': 'Gestión de cotizaciones',
  },
  'baseprecios': {
    'todos_proyectos': 'Base de Precios',
    'descripcion': 'Gestión de precios',
  },
  'auditoria': {
    'todos_proyectos': 'Auditoría',
    'descripcion': 'Registro de auditoría',
  },
  'ajustes': {
    'todos_proyectos': 'Ajustes',
    'descripcion': 'Configuración del sistema',
  },
};

const mockT = vi.fn((key: string, options?: { defaultValue?: string }) => {
  const parts = key.split('.');
  let current: Record<string, unknown> = mockTranslations;
  
  for (const part of parts) {
    if (current && typeof current === 'object' && part in current) {
      current = current[part] as Record<string, unknown>;
    } else {
      return options?.defaultValue || key;
    }
  }
  
  return (current as string) || key;
});

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: mockT,
    i18n: {
      changeLanguage: vi.fn(),
      language: 'es',
    },
  }),
  initReactI18next: {
    type: '3rdParty',
    init: vi.fn(),
  },
  Trans: ({ children }: { children: string }) => children,
}));

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
