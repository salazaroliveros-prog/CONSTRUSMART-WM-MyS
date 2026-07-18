import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

vi.mock('react-i18next', () => {
  const translations: Record<string, string> = {
    'ajustes.titulo': 'Ajustes',
    'ajustes.subtitulo_desc': 'Personaliza la apariencia, idioma, notificaciones y configuración general del ERP',
    'ajustes.apariencia': 'Apariencia',
    'ajustes.generales_tab': 'Generales',
    'ajustes.notificaciones_tab': 'Notificaciones',
    'ajustes.datos_tab': 'Datos',
    'ajustes.cuenta_tab': 'Cuenta',
    'ajustes.acerca_tab': 'Acerca de',
    'ajustes.framework_ui': 'Framework UI',
    'ajustes.framework_ui_sub': 'Elige el motor visual del sistema',
    'ajustes.clasico': 'Clásico',
    'ajustes.moderno': 'Moderno',
    'ajustes.tema_visual': 'Tema Visual',
    'ajustes.tema_visual_sub': 'Elige entre 8 diseños para toda la app',
    'ajustes.color_primario': 'Color Primario',
    'ajustes.color_principal': 'Color Principal',
    'ajustes.color_principal_sub': 'Personaliza el color primario de la marca',
    'ajustes.tamano_fuente': 'Tamaño de Fuente',
    'ajustes.tamano_fuente_sub': 'Ajusta el tamaño del texto en toda la app',
    'ajustes.pequeno': 'Pequeño',
    'ajustes.mediano': 'Mediano',
    'ajustes.grande': 'Grande',
    'ajustes.tipografia': 'Tipografía',
    'ajustes.tipografia_sub': 'Fuente base del sistema',
    'ajustes.font_system_ui': 'System UI',
    'ajustes.font_inter': 'Inter',
    'ajustes.font_roboto': 'Roboto',
    'ajustes.font_open_sans': 'Open Sans',
    'ajustes.font_poppins': 'Poppins',
    'ajustes.radio_bordes': 'Radio de Bordes',
    'ajustes.radio_bordes_sub': 'Esquinas de cards, botones e inputs',
    'ajustes.ninguno': 'Ninguno',
    'ajustes.pill': 'Pill',
    'ajustes.espaciado_global': 'Espaciado Global',
    'ajustes.espaciado_global_sub': 'Padding/gaps generales',
    'ajustes.normal': 'Normal',
    'ajustes.amplio': 'Amplio',
    'ajustes.densidad_tablas': 'Densidad de Tablas',
    'ajustes.densidad_tablas_sub': 'Altura de filas y celdas',
    'ajustes.compacta': 'Compacta',
    'ajustes.comoda': 'Cómoda',
    'ajustes.animaciones': 'Animaciones',
    'ajustes.animaciones_sub': 'Transiciones suaves entre pantallas',
    'ajustes.tipo_animacion': 'Tipo de Animación',
    'ajustes.tipo_animacion_sub': 'Estilo de transición entre pantallas',
    'ajustes.fundido': 'Fundido',
    'ajustes.deslizar': 'Deslizar',
    'ajustes.escalar': 'Escalar',
    'ajustes.ninguna': 'Ninguna',
    'ajustes.modo_compacto': 'Modo Compacto',
    'ajustes.modo_compacto_sub': 'Reduce espaciado para mostrar más información',
    'ajustes.migas_pan': 'Migas de Pan',
    'ajustes.migas_pan_sub': 'Navegación jerárquica en la parte superior',
    'ajustes.pie_pagina': 'Pie de Página',
    'ajustes.pie_pagina_sub': 'Mostrar footer con información de la empresa',
    'ajustes.modo_tactil': 'Modo Táctil',
    'ajustes.modo_tactil_sub': 'Optimizado para tablets y pantallas táctiles',
    'ajustes.posicion_sidebar': 'Posición del Sidebar',
    'ajustes.posicion_sidebar_sub': 'Lado de la pantalla donde aparece el menú',
    'ajustes.izquierda': 'Izquierda',
    'ajustes.derecha': 'Derecha',
    'ajustes.overlay': 'Overlay',
    'ajustes.modo_sidebar': 'Modo del Sidebar',
    'ajustes.modo_sidebar_sub': 'Comportamiento de expansión/colapso',
    'ajustes.colapsado': 'Colapsado',
    'ajustes.hover_expand': 'Hover Expand',
    'ajustes.mini': 'Mini',
    'ajustes.expandido': 'Expandido',
    'ajustes.ancho_sidebar': 'Ancho del Sidebar',
    'ajustes.ancho_sidebar_sub': 'Ancho cuando está expandido',
    'ajustes.previsualizacion_vivo': 'Previsualización en Vivo',
    'ajustes.vista_previa_tema': 'Vista previa del tema activo',
    'ajustes.cambios_tiempo_real': 'Los cambios se aplican en tiempo real. El color primario y tema se reflejan en todos los componentes de Ant Design.',
    'ajustes.boton_primario': 'Botón Primario',
    'ajustes.boton_secundario': 'Botón Secundario',
    'ajustes.peligro': 'Peligro',
    'ajustes.modo_expandido': 'Modo expandido',
    'ajustes.idioma': 'Idioma',
    'ajustes.idioma_sub': 'Idioma de la interfaz',
    'ajustes.formato_fecha': 'Formato de Fecha',
    'ajustes.formato_fecha_sub': 'Cómo se muestran las fechas',
    'ajustes.moneda': 'Moneda',
    'ajustes.moneda_sub': 'Símbolo monetario del sistema',
    'ajustes.informacion_sistema': 'Información del Sistema',
    'ajustes.proyectos_activos': 'Proyectos Activos',
    'ajustes.total_proyectos': 'Total Proyectos',
    'ajustes.notificaciones_pendientes': 'Notificaciones Pendientes',
    'ajustes.framework_ui_actual': 'Framework UI Actual',
    'ajustes.tema_label': 'Tema',
    'ajustes.version_label': 'Versión',
    'ajustes.oscuro': 'Oscuro',
    'ajustes.claro': 'Claro',
    'ajustes.alto_contraste': 'Alto Contraste',
    'ajustes.version_tag': 'Versión 2.0.0',
    'ajustes.sonidos_notificacion': 'Sonidos de Notificación',
    'ajustes.sonidos_notificacion_sub': 'Reproducir sonido al recibir notificaciones',
    'ajustes.posicion_notificaciones': 'Posición de Notificaciones',
    'ajustes.posicion_notificaciones_sub': 'Dónde aparecen los mensajes toast en pantalla',
    'ajustes.stock_critico': 'Stock Crítico',
    'ajustes.stock_critico_sub': 'Alertas cuando el inventario está bajo',
    'ajustes.ordenes_cambio': 'Órdenes de Cambio',
    'ajustes.ordenes_cambio_sub': 'Notificar OC pendientes de revisión',
    'ajustes.avances_obra': 'Avances de Obra',
    'ajustes.avances_obra_sub': 'Registro de avances físicos',
    'ajustes.desviaciones': 'Desviaciones',
    'ajustes.desviaciones_sub': 'Alertas de rendimiento y costo',
    'ajustes.estado_notificaciones': 'Estado de Notificaciones',
    'ajustes.no_leidas': 'No leídas',
    'ajustes.marcar_todas_leidas': 'Marcar todas como leídas',
    'ajustes.exportar_backup': 'Exportar copia de seguridad',
    'ajustes.importar_datos': 'Importar datos',
    'ajustes.almacenamiento': 'Almacenamiento',
    'ajustes.datos_localstorage': 'Datos en localStorage',
    'ajustes.datos_sincronizacion': 'Los datos se almacenan localmente y se sincronizan con la nube cuando hay conexión.',
    'ajustes.rol': 'Rol',
    'ajustes.id_usuario': 'ID de Usuario',
    'ajustes.seguridad': 'Seguridad',
    'ajustes.autenticacion_2fa': 'Autenticación de Dos Factores (2FA)',
    'ajustes.protege_cuenta': 'Protege tu cuenta con verificación en dos pasos.',
    'ajustes.configurar_2fa': 'Configurar 2FA en Supabase',
    'ajustes.redirigido_supabase': 'Serás redirigido al panel de Supabase para configurar la autenticación multifactor.',
    'ajustes.cambiar_contrasena': 'Cambiar Contraseña',
    'ajustes.sesion_segura': 'Sesión Segura',
    'ajustes.sesion_segura_desc': 'La autenticación se maneja mediante Supabase con políticas de RLS (Row Level Security).',
    'ajustes.erp_nombre': 'ERP CONSTRUSMART',
    'ajustes.sistema_integral': 'Sistema Integral de Gestión para Proyectos de Construcción',
    'ajustes.desarrollado_por': 'Desarrollado por',
    'ajustes.edificando_futuro': 'Edificando el Futuro — Todos los derechos reservados',
    'ajustes.about_framework_frontend': 'Framework Frontend',
    'ajustes.about_react_ts': 'React + TypeScript',
    'ajustes.about_ui_principal': 'UI Principal',
    'ajustes.about_shadcn_ui': 'Shadcn UI + Ant Design',
    'ajustes.about_backend': 'Backend',
    'ajustes.about_supabase': 'Supabase',
    'ajustes.about_visualizacion': 'Visualización',
    'ajustes.about_recharts': 'Recharts',
    'ajustes.about_bim': 'BIM',
    'ajustes.about_threejs': 'Three.js / web-ifc',
    'ajustes.about_estilos': 'Estilos',
    'ajustes.about_tailwind': 'Tailwind CSS',
    'ajustes.restablecer_fabrica': 'Restablecer datos de fábrica',
    'ajustes.restablecer_titulo': 'Restablecer datos de fábrica',
    'ajustes.restablecer_alerta_titulo': '¿Estás seguro?',
    'ajustes.restablecer_alerta_desc': 'Esta acción eliminará todos los datos locales y restaurará la configuración predeterminada. Los datos en la nube no se verán afectados.',
    'ajustes.restablecer': 'Restablecer',
    'common.cancelar': 'Cancelar',
    'ajustes.copiado': 'Copiado',
    'ajustes.antd': 'Clásico (Ant Design)',
    'ajustes.shadcn': 'Moderno (Shadcn)',
    'ajustes.sidebar_izq': 'Izq',
    'ajustes.sidebar_der': 'Der',
    'ajustes.usuario': 'Usuario',
  };
  return {
    useTranslation: () => ({
      t: (key: string, params?: Record<string, string | number>, fallback?: string) => {
        if (translations[key]) return translations[key];
        if (fallback) return fallback;
        return key;
      },
      i18n: { language: 'es', changeLanguage: vi.fn() },
    }),
  };
});

const mockUpdateAppSettings = vi.fn();
const mockMarcarTodasLeidas = vi.fn();
const mockClearAllData = vi.fn();

let mockAppSettings: any = {};
let mockUser: any = {};
let mockProyectos: any[] = [];
let mockNotificacionesNoLeidas = 0;

vi.mock('../erp/store', () => ({
  useErp: () => ({
    appSettings: mockAppSettings,
    updateAppSettings: mockUpdateAppSettings,
    user: mockUser,
    proyectos: mockProyectos,
    notificacionesNoLeidas: mockNotificacionesNoLeidas,
    marcarTodasLeidas: mockMarcarTodasLeidas,
    clearAllData: mockClearAllData,
  }),
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
  },
}));

vi.mock('@/lib/theme-manager', () => ({
  THEMES: {
    'ant-design': { label: 'Ant Design', description: 'Estilo clásico profesional', colors: { primary: '#1677ff', background: '#ffffff', foreground: '#1a1a2e' } },
    'dark-pro': { label: 'Dark Pro', description: 'Modo oscuro premium', colors: { primary: '#00d9ff', background: '#0d1b2a', foreground: '#e0e0e0' } },
    'material3': { label: 'Material 3', description: 'Diseño moderno Material', colors: { primary: '#6750a4', background: '#fffbff', foreground: '#1c1b1f' } },
    'glassmorphism': { label: 'Glassmorphism', description: 'Efecto vidrio moderno', colors: { primary: '#00b4d8', background: '#f0f8ff', foreground: '#1a1a2e' } },
    'neomorphism': { label: 'Neomorphism', description: 'Estilo suave y elevado', colors: { primary: '#6c757d', background: '#e4ebf5', foreground: '#333333' } },
  },
  PRIMARY_COLORS: [
    { label: 'Azul Default', value: '#1677ff' },
    { label: 'Naranja Construcción', value: '#ff8c42' },
    { label: 'Verde Éxito', value: '#52c41a' },
    { label: 'Rojo Destructivo', value: '#f5222d' },
    { label: 'Púrpura Material', value: '#6750a4' },
    { label: 'Cian Oscuro', value: '#00d9ff' },
    { label: 'Amarillo Warning', value: '#faad14' },
    { label: 'Azul Info', value: '#1890ff' },
  ],
}));

async function renderAjustes() {
  const Ajustes = (await import('../erp/screens/Ajustes')).default;
  return render(React.createElement(Ajustes));
}

beforeEach(() => {
  vi.clearAllMocks();
  mockAppSettings = {
    uiMode: 'shadcn',
    appTheme: 'light',
    primaryColor: '#3b82f6',
    language: 'es',
    dateFormat: 'DD/MM/YYYY',
    currency: 'GTQ',
    sidebarPosition: 'left',
    sidebarMode: 'expanded',
    sidebarWidth: 240,
    sidebarMiniWidth: 64,
    animationsEnabled: true,
    animationType: 'fade',
    compactMode: false,
    fontSize: 'medium',
    fontFamily: 'system-ui',
    borderRadius: 'medium',
    spacingScale: 'normal',
    densityTable: 'normal',
    breadcrumbsEnabled: true,
    footerEnabled: true,
    touchMode: false,
    notificaciones: {
      stockCritico: true,
      ordenesCambio: true,
      avancesObra: false,
      desviaciones: true,
    },
    notificationSounds: true,
    toastPosition: 'bottom-right',
  };
  mockUser = {
    id: 'user-1',
    nombre: 'Juan Pérez',
    rol: 'Administrador',
  };
  mockProyectos = [
    { id: 'proj-1', nombre: 'Edificio Torre Centro', estado: 'ejecucion' },
    { id: 'proj-2', nombre: 'Parque Industrial', estado: 'planeacion' },
  ];
  mockNotificacionesNoLeidas = 3;
});

afterEach(cleanup);

describe('Ajustes Screen', () => {
  it('renders 6 tab buttons', async () => {
    await renderAjustes();
    await waitFor(() => {
      expect(screen.getByText('Apariencia')).toBeInTheDocument();
      expect(screen.getByText('Generales')).toBeInTheDocument();
      expect(screen.getByText('Notificaciones')).toBeInTheDocument();
      expect(screen.getByText('Datos')).toBeInTheDocument();
      expect(screen.getByText('Cuenta')).toBeInTheDocument();
      expect(screen.getByText('Acerca de')).toBeInTheDocument();
    });
  });

  it('switching tabs shows correct content', async () => {
    await renderAjustes();
    await waitFor(() => {
      expect(screen.getByText('Framework UI')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('Generales'));
    await waitFor(() => {
      expect(screen.getByText('Idioma')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('Notificaciones'));
    await waitFor(() => {
      expect(screen.getByText('Sonidos de Notificación')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('Datos'));
    await waitFor(() => {
      expect(screen.getByText('Exportar copia de seguridad')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('Cuenta'));
    await waitFor(() => {
      expect(screen.getByText('Seguridad')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('Acerca de'));
    await waitFor(() => {
      expect(screen.getByText('ERP CONSTRUSMART')).toBeInTheDocument();
    });
  });

  it('apariencia tab shows framework toggle, theme buttons, color swatches', async () => {
    await renderAjustes();
    await waitFor(() => {
      expect(screen.getByText('Framework UI')).toBeInTheDocument();
      expect(screen.getByText('Tema Visual')).toBeInTheDocument();
      expect(screen.getByText('Ant Design')).toBeInTheDocument();
      expect(screen.getByText('Dark Pro')).toBeInTheDocument();
      expect(screen.getByText('Material 3')).toBeInTheDocument();
      expect(screen.getByLabelText('Azul Default')).toBeInTheDocument();
      expect(screen.getByLabelText('Verde Éxito')).toBeInTheDocument();
    });
  });

  it('changing primary color calls updateAppSettings', async () => {
    await renderAjustes();
    await waitFor(() => {
      const colorBtn = screen.getByLabelText('Verde Éxito');
      fireEvent.click(colorBtn);
    });
    expect(mockUpdateAppSettings).toHaveBeenCalledWith({ primaryColor: '#52c41a' });
  });

  it('generales tab shows language/currency selectors', async () => {
    await renderAjustes();
    await waitFor(() => {
      fireEvent.click(screen.getByText('Generales'));
    });
    await waitFor(() => {
      expect(screen.getByText('Idioma')).toBeInTheDocument();
      expect(screen.getByText('Formato de Fecha')).toBeInTheDocument();
      expect(screen.getByText('Moneda')).toBeInTheDocument();
      const selects = screen.getAllByRole('combobox');
      expect(selects.length).toBeGreaterThanOrEqual(3);
    });
  });

  it('notificaciones tab shows toggle switches', async () => {
    await renderAjustes();
    await waitFor(() => {
      fireEvent.click(screen.getByText('Notificaciones'));
    });
    await waitFor(() => {
      expect(screen.getByText('Sonidos de Notificación')).toBeInTheDocument();
      expect(screen.getByText('Posición de Notificaciones')).toBeInTheDocument();
      expect(screen.getByText('Stock Crítico')).toBeInTheDocument();
      const switches = screen.getAllByRole('switch');
      expect(switches.length).toBeGreaterThanOrEqual(4);
    });
  });

  it('datos tab shows backup export/import buttons', async () => {
    await renderAjustes();
    await waitFor(() => {
      fireEvent.click(screen.getByText('Datos'));
    });
    await waitFor(() => {
      expect(screen.getByText('Exportar copia de seguridad')).toBeInTheDocument();
      expect(screen.getByText('Importar datos')).toBeInTheDocument();
      expect(screen.getByText('Restablecer datos de fábrica')).toBeInTheDocument();
    });
  });

  it('cuenta tab shows user profile info', async () => {
    await renderAjustes();
    await waitFor(() => {
      fireEvent.click(screen.getByText('Cuenta'));
    });
    await waitFor(() => {
      expect(screen.getByText('Juan Pérez')).toBeInTheDocument();
      expect(screen.getAllByText('Administrador').length).toBeGreaterThanOrEqual(1);
    });
  });

  it('factory reset shows confirmation modal', async () => {
    await renderAjustes();
    await waitFor(() => {
      fireEvent.click(screen.getByText('Datos'));
    });
    await waitFor(() => {
      fireEvent.click(screen.getByText('Restablecer datos de fábrica'));
    });
    await waitFor(() => {
      expect(screen.getByText('¿Estás seguro?')).toBeInTheDocument();
      expect(screen.getByText('Cancelar')).toBeInTheDocument();
      expect(screen.getByText('Restablecer')).toBeInTheDocument();
    });
  });

  it('live preview panel updates with settings', async () => {
    await renderAjustes();
    await waitFor(() => {
      expect(screen.getByText('Previsualización en Vivo')).toBeInTheDocument();
      expect(screen.getByText('Vista previa del tema activo')).toBeInTheDocument();
      expect(screen.getByText('Botón Primario')).toBeInTheDocument();
      expect(screen.getByText('Botón Secundario')).toBeInTheDocument();
      expect(screen.getByText('Peligro')).toBeInTheDocument();
    });
  });
});
