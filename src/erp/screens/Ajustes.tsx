import React, { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useErp, clearAllData, type UIMode, type AppThemeMode } from '../store';
import type { AppSettings } from '../utils';
import { THEMES, type ThemeName, PRIMARY_COLORS } from '@/lib/theme-manager';
import { toast } from 'sonner';
import {
  Settings, Globe, Bell, Shield, Info, Database, Moon, Sun,
  Palette, Type, Eye, Key, Download, Upload, Trash2, CheckCircle,
  FlaskConical, User, FileInput, Calendar, DollarSign, AlertTriangle,
  PlayCircle, FileText, TrendingUp, Users, ShieldCheck,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const ICON_SIZE = 18;
const controlWidthClass = 'w-full sm:w-40 md:w-44';
const halfWidthClass = 'w-full sm:w-44 md:w-52';

interface SettingRowProps {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

const SettingRow: React.FC<SettingRowProps> = ({ icon, title, subtitle, children }) => (
  <div className="mb-4">
    <div className="flex items-center justify-between w-full gap-3">
      <div className="flex items-center gap-2 min-w-0">
        <span className="flex-shrink-0 text-muted-foreground">{icon}</span>
        <div>
          <p className="text-sm font-medium text-foreground m-0">{title}</p>
          {subtitle ? <p className="text-xs text-muted-foreground m-0">{subtitle}</p> : null}
        </div>
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
    <hr className="my-3 border-t border-border" />
  </div>
);

const RadioGroup: React.FC<{
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: React.ReactNode }[];
  size?: 'small' | 'middle' | 'large';
  className?: string;
}> = ({ value, onChange, options, size = 'middle', className = '' }) => {
  const sizeClasses = size === 'small' ? 'text-xs px-2 py-1' : size === 'large' ? 'text-sm px-4 py-2.5' : 'text-sm px-3 py-1.5';
  return (
    <div className={`inline-flex rounded-lg border border-input bg-background overflow-hidden ${className}`}>
      {options.map(opt => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          data-state={value === opt.value ? 'on' : 'off'}
          aria-pressed={value === opt.value}
          className={`${sizeClasses} transition-colors ${
            value === opt.value
              ? 'bg-primary text-primary-foreground font-medium shadow-sm'
              : 'bg-transparent text-muted-foreground hover:text-foreground hover:bg-accent'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
};

const Switch: React.FC<{
  checked: boolean;
  onChange: (checked: boolean) => void;
  'aria-label'?: string;
}> = ({ checked, onChange, 'aria-label': ariaLabel }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    aria-label={ariaLabel}
    onClick={() => onChange(!checked)}
    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
      checked ? 'bg-primary' : 'bg-input'
    }`}
  >
    <span
      className={`pointer-events-none block h-4 w-4 rounded-full bg-background shadow-lg ring-0 transition-transform ${
        checked ? 'translate-x-4' : 'translate-x-0'
      }`}
    />
  </button>
);

const Select: React.FC<{
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  className?: string;
}> = ({ value, onChange, options, className = '' }) => (
  <select
    value={value}
    onChange={e => onChange(e.target.value)}
    className={`h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring ${className}`}
  >
    {options.map(opt => (
      <option key={opt.value} value={opt.value}>{opt.label}</option>
    ))}
  </select>
);

const ColorRadioGroup: React.FC<{
  value: string;
  onChange: (value: string) => void;
}> = ({ value, onChange }) => (
  <div className="inline-flex gap-1.5 flex-wrap">
    {PRIMARY_COLORS.map(c => (
      <button
        key={c.value}
        type="button"
        onClick={() => onChange(c.value)}
        aria-label={c.label}
        title={c.label}
        className={`w-7 h-7 rounded-full cursor-pointer transition-all ${
          value === c.value ? 'ring-2 ring-offset-2 ring-ring scale-110' : 'ring-0'
        }`}
        style={{ backgroundColor: c.value }}
      />
    ))}
  </div>
);

const Ajustes: React.FC = () => {
  const [loading, setLoading] = useState(true);
  useEffect(() => { const t = setTimeout(() => setLoading(false), 400); return () => clearTimeout(t); }, []);
  const { t } = useTranslation();
  const { appSettings, updateAppSettings, user, proyectos, notificacionesNoLeidas, marcarTodasLeidas, exportStoreData, importStoreData } = useErp();
  const safeProyectos = useMemo(() => Array.isArray(proyectos) ? proyectos : [], [proyectos]);
  const proyectosEnEjecucion = useMemo(() => safeProyectos.filter(p => p.estado === 'ejecucion').length, [safeProyectos]);
  const [resetModal, setResetModal] = useState(false);
  const [activeTab, setActiveTab] = useState('apariencia');

  const compactModeLabel = appSettings.compactMode ? 'compacto' : 'expandido';

  const exportBackup = () => {
    try {
      const data = exportStoreData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `construsmart_backup_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success(t('ajustes.respaldo_exportado'));
    } catch {
      toast.error(t('ajustes.error_exportar_respaldo'));
    }
  };

  const importBackup = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const data = JSON.parse(text);
        if (typeof data !== 'object' || Array.isArray(data)) {
          toast.error(t('ajustes.formato_invalido'));
          return;
        }
        const entityCount = Object.keys(data).filter(k =>
          ['proyectos','movimientos','empleados','materiales','ordenes','proveedores','presupuestos','appSettings'].includes(k)
        ).length;
        if (entityCount === 0) {
          toast.warning(t('ajustes.sin_datos_validos'));
          return;
        }
        importStoreData(data);
        toast.success(t('ajustes.importados_exito', { count: entityCount, archivo: file.name }));
      } catch {
        toast.error(t('ajustes.error_leer_respaldo'));
      }
    };
    input.click();
  };

  const tabs = [
    { key: 'apariencia', icon: Palette, label: t('ajustes.apariencia') },
    { key: 'generales', icon: Globe, label: t('ajustes.generales_tab') },
    { key: 'notificaciones', icon: Bell, label: t('ajustes.notificaciones_tab') },
    { key: 'datos', icon: Database, label: t('ajustes.datos_tab') },
    { key: 'cuenta', icon: Shield, label: t('ajustes.cuenta_tab') },
    ...(['Administrador'].includes(user?.rol || '') ? [{ key: 'roles', icon: ShieldCheck, label: 'Roles y permisos' }] : []),
    { key: 'acerca', icon: Info, label: t('ajustes.acerca_tab') },
  ];

  const visualTab = (
    <div className="hidden sm:inline-flex items-center gap-2 pr-6 pb-4">
      <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium ${
        appSettings.uiMode === 'antd' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' : 'bg-muted text-muted-foreground'
      }`}>
        <FlaskConical className="h-3.5 w-3.5" />
        UI: {appSettings.uiMode === 'antd' ? t('ajustes.antd') : t('ajustes.shadcn')}
      </span>
      <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
        {appSettings.appTheme === 'dark' ? <Moon className="h-3.5 w-3.5" /> : <Sun className="h-3.5 w-3.5" />}
        {appSettings.appTheme === 'dark' ? t('ajustes.oscuro') : t('ajustes.claro')}
      </span>
      <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
        <Palette className="h-3.5 w-3.5" />
        Sidebar: {appSettings.sidebarPosition === 'right' ? t('ajustes.sidebar_der') : appSettings.sidebarPosition === 'overlay' ? t('ajustes.overlay') : t('ajustes.sidebar_izq')}
      </span>
    </div>
  );

  if (loading) {
    return (
      <div className="p-4 sm:p-6 max-w-[1600px] mx-auto space-y-4">
        <Skeleton className="h-8 w-64 rounded-lg" />
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="flex flex-col p-4 sm:p-6 max-w-[1600px] mx-auto min-h-full">
      <div className="mb-6">
        <h1 className="m-0 text-foreground text-[22px] font-bold flex items-center gap-2">
          <Settings className="h-[22px] w-[22px] text-primary" />
          {t('ajustes.titulo')}
        </h1>
        <p className="text-muted-foreground text-sm m-0 mt-1">
          {t('ajustes.subtitulo_desc')}
        </p>
      </div>

      <div className="rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden">
        <div className="flex items-center justify-between border-b border-border">
          <div className="flex overflow-x-auto" role="tablist">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.key}
                  role="tab"
                  aria-selected={activeTab === tab.key}
                  data-state={activeTab === tab.key ? 'active' : 'inactive'}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap border-b-2 ${
                    activeTab === tab.key
                      ? 'border-primary text-primary bg-primary/5'
                      : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-accent/50'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
          {visualTab}
        </div>

        <div className="p-6">
          {activeTab === 'apariencia' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-4 sm:p-6">
                <SettingRow
                  icon={<FlaskConical className="h-[18px] w-[18px] text-primary" />}
                  title={t('ajustes.framework_ui')}
                  subtitle={t('ajustes.framework_ui_sub')}
                >
                  <RadioGroup
                    value={appSettings.uiMode}
                    onChange={v => updateAppSettings({ uiMode: v as UIMode })}
                    options={[
                      { value: 'shadcn', label: <><Palette className="h-3.5 w-3.5 inline-block mr-1" />{t('ajustes.clasico')}</> },
                      { value: 'antd', label: <><FlaskConical className="h-3.5 w-3.5 inline-block mr-1" />{t('ajustes.moderno')}</> },
                    ]}
                  />
                </SettingRow>

                <div className="mb-4">
                  <div className="flex flex-col w-full gap-0">
                    <div className="flex items-center gap-2">
                      <Palette className="h-[18px] w-[18px] text-primary" />
                      <div>
                        <span className="text-sm font-medium text-foreground">{t('ajustes.tema_visual')}</span>
                        <br /><span className="text-xs text-muted-foreground">{t('ajustes.tema_visual_sub')}</span>
                      </div>
                    </div>
                    <div className="flex gap-2 flex-wrap mt-3">
                      {(Object.entries(THEMES) as [ThemeName, typeof THEMES[ThemeName]][]).map(([key, theme]) => (
                        <button
                          key={key}
                          type="button"
                          title={theme.description}
                          onClick={() => updateAppSettings({ appTheme: key as AppThemeMode })}
                          className={`cursor-pointer px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                            appSettings.appTheme === key ? 'ring-2 ring-offset-1' : 'ring-1 ring-border'
                          }`}
                          style={{
                            backgroundColor: theme.colors.background,
                            color: theme.colors.foreground,
                            borderColor: appSettings.appTheme === key ? theme.colors.primary : undefined,
                            fontWeight: appSettings.appTheme === key ? 700 : 400,
                          }}
                        >
                          <span className="w-3 h-3 rounded-full inline-block flex-shrink-0" style={{ backgroundColor: theme.colors.primary }} />
                          {theme.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <hr className="my-3 border-t border-border" />

                <SettingRow
                  icon={<Palette className="h-[18px] w-[18px]" style={{ color: appSettings.primaryColor }} />}
                  title={t('ajustes.color_principal') || 'Color Principal'}
                  subtitle={t('ajustes.color_principal_sub') || 'Personaliza el color primario de la marca'}
                >
                  <ColorRadioGroup
                    value={appSettings.primaryColor}
                    onChange={v => updateAppSettings({ primaryColor: v })}
                  />
                </SettingRow>

                <SettingRow
                  icon={<Type className="h-[18px] w-[18px]" />}
                  title={t('ajustes.tamano_fuente')}
                  subtitle={t('ajustes.tamano_fuente_sub')}
                >
                  <RadioGroup
                    value={appSettings.fontSize}
                    onChange={v => updateAppSettings({ fontSize: v as 'small' | 'medium' | 'large' })}
                    options={[
                      { value: 'small', label: t('ajustes.pequeno') },
                      { value: 'medium', label: t('ajustes.mediano') },
                      { value: 'large', label: t('ajustes.grande') },
                    ]}
                  />
                </SettingRow>

                <SettingRow
                  icon={<Type className="h-[18px] w-[18px]" />}
                  title={t('ajustes.tipografia')}
                  subtitle={t('ajustes.tipografia_sub')}
                >
                  <Select
                    value={appSettings.fontFamily}
                    onChange={v => updateAppSettings({ fontFamily: v as string })}
                    className={controlWidthClass}
                    options={[
                      { value: 'system-ui', label: t('ajustes.font_system_ui') },
                      { value: 'inter', label: t('ajustes.font_inter') },
                      { value: 'roboto', label: t('ajustes.font_roboto') },
                      { value: 'open-sans', label: t('ajustes.font_open_sans') },
                      { value: 'poppins', label: t('ajustes.font_poppins') },
                    ]}
                  />
                </SettingRow>

                <SettingRow
                  icon={<Palette className="h-[18px] w-[18px]" />}
                  title={t('ajustes.radio_bordes')}
                  subtitle={t('ajustes.radio_bordes_sub')}
                >
                  <RadioGroup
                    value={appSettings.borderRadius}
                    onChange={v => updateAppSettings({ borderRadius: v })}
                    options={[
                      { value: 'none', label: t('ajustes.ninguno') },
                      { value: 'small', label: t('ajustes.pequeno') },
                      { value: 'medium', label: t('ajustes.mediano') },
                      { value: 'large', label: t('ajustes.grande') },
                      { value: 'full', label: t('ajustes.pill') },
                    ]}
                  />
                </SettingRow>

                <SettingRow
                  icon={<Palette className="h-[18px] w-[18px]" />}
                  title={t('ajustes.espaciado_global')}
                  subtitle={t('ajustes.espaciado_global_sub')}
                >
                  <RadioGroup
                    value={appSettings.spacingScale}
                    onChange={v => updateAppSettings({ spacingScale: v })}
                    options={[
                      { value: 'compact', label: t('ajustes.compacto') },
                      { value: 'normal', label: t('ajustes.normal') },
                      { value: 'spacious', label: t('ajustes.amplio') },
                    ]}
                  />
                </SettingRow>

                <SettingRow
                  icon={<Palette className="h-[18px] w-[18px]" />}
                  title={t('ajustes.densidad_tablas')}
                  subtitle={t('ajustes.densidad_tablas_sub')}
                >
                  <RadioGroup
                    value={appSettings.densityTable}
                    onChange={v => updateAppSettings({ densityTable: v })}
                    options={[
                      { value: 'compact', label: t('ajustes.compacta') },
                      { value: 'normal', label: t('ajustes.normal') },
                      { value: 'comfortable', label: t('ajustes.comoda') },
                    ]}
                  />
                </SettingRow>

                <SettingRow
                  icon={<PlayCircle className="h-[18px] w-[18px]" />}
                  title={t('ajustes.animaciones') || 'Animaciones'}
                  subtitle={t('ajustes.animaciones_sub') || 'Transiciones suaves entre pantallas'}
                >
                  <Switch
                    checked={appSettings.animationsEnabled}
                    onChange={v => updateAppSettings({ animationsEnabled: v })}
                    aria-label={t('ajustes.animaciones') || 'Animaciones'}
                  />
                </SettingRow>

                <SettingRow
                  icon={<PlayCircle className="h-[18px] w-[18px]" />}
                  title={t('ajustes.tipo_animacion')}
                  subtitle={t('ajustes.tipo_animacion_sub')}
                >
                  <RadioGroup
                    value={appSettings.animationType || 'fade'}
                    onChange={v => updateAppSettings({ animationType: v })}
                    options={[
                      { value: 'fade', label: t('ajustes.fundido') },
                      { value: 'slide', label: t('ajustes.deslizar') },
                      { value: 'scale', label: t('ajustes.escalar') },
                      { value: 'none', label: t('ajustes.ninguna') },
                    ]}
                  />
                </SettingRow>

                <SettingRow
                  icon={<Eye className="h-[18px] w-[18px]" />}
                  title={t('ajustes.modo_compacto')}
                  subtitle={t('ajustes.modo_compacto_sub')}
                >
                  <Switch
                    checked={appSettings.compactMode}
                    onChange={v => updateAppSettings({ compactMode: v })}
                  />
                </SettingRow>

                <SettingRow
                  icon={<span className="text-base">🔗</span>}
                  title={t('ajustes.migas_pan')}
                  subtitle={t('ajustes.migas_pan_sub')}
                >
                  <Switch
                    checked={appSettings.breadcrumbsEnabled !== false}
                    onChange={v => updateAppSettings({ breadcrumbsEnabled: v })}
                  />
                </SettingRow>

                <SettingRow
                  icon={<span className="text-base">📄</span>}
                  title={t('ajustes.pie_pagina')}
                  subtitle={t('ajustes.pie_pagina_sub')}
                >
                  <Switch
                    checked={appSettings.footerEnabled !== false}
                    onChange={v => updateAppSettings({ footerEnabled: v })}
                  />
                </SettingRow>

                <SettingRow
                  icon={<span className="text-base">👆</span>}
                  title={t('ajustes.modo_tactil')}
                  subtitle={t('ajustes.modo_tactil_sub')}
                >
                  <Switch
                    checked={appSettings.touchMode || false}
                    onChange={v => updateAppSettings({ touchMode: v })}
                  />
                </SettingRow>

                <SettingRow
                  icon={<Settings className="h-[18px] w-[18px]" />}
                  title={t('ajustes.posicion_sidebar')}
                  subtitle={t('ajustes.posicion_sidebar_sub')}
                >
                  <RadioGroup
                    value={appSettings.sidebarPosition}
                    onChange={v => updateAppSettings({ sidebarPosition: v })}
                    size="small"
                    options={[
                      { value: 'left', label: t('ajustes.izquierda') },
                      { value: 'right', label: t('ajustes.derecha') },
                      { value: 'overlay', label: t('ajustes.overlay') },
                    ]}
                  />
                </SettingRow>

                <SettingRow
                  icon={<Settings className="h-[18px] w-[18px]" />}
                  title={t('ajustes.modo_sidebar')}
                  subtitle={t('ajustes.modo_sidebar_sub')}
                >
                  <RadioGroup
                    value={appSettings.sidebarMode}
                    onChange={v => updateAppSettings({ sidebarMode: v })}
                    size="small"
                    options={[
                      { value: 'expanded', label: t('ajustes.expandido') },
                      { value: 'collapsed', label: t('ajustes.colapsado') },
                      { value: 'hover-expand', label: t('ajustes.hover_expand') },
                      { value: 'mini', label: t('ajustes.mini') },
                    ]}
                  />
                </SettingRow>

                <SettingRow
                  icon={<Settings className="h-[18px] w-[18px]" />}
                  title={t('ajustes.ancho_sidebar')}
                  subtitle={t('ajustes.ancho_sidebar_sub')}
                >
                  <RadioGroup
                    value={appSettings.sidebarWidth}
                    onChange={v => updateAppSettings({ sidebarWidth: v })}
                    size="small"
                    options={[
                      { value: '240', label: '240px' },
                      { value: '280', label: '280px' },
                      { value: '320', label: '320px' },
                    ]}
                  />
                </SettingRow>
              </div>

              <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-4 sm:p-6">
                <h4 className="text-sm font-semibold mb-4">{t('ajustes.previsualizacion_vivo')}</h4>
                <div className="rounded-lg border border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950 p-3 mb-4">
                  <div className="flex gap-2">
                    <Info className="h-4 w-4 mt-0.5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-blue-800 dark:text-blue-200 m-0">{t('ajustes.vista_previa_tema')}</p>
                      <p className="text-xs text-blue-700 dark:text-blue-300 m-0 mt-0.5">{t('ajustes.cambios_tiempo_real')}</p>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-3 w-full">
                  <span className="inline-flex items-center rounded-md border border-input bg-background px-2.5 py-0.5 text-xs font-medium text-foreground shadow-sm" style={{ borderColor: appSettings.primaryColor, color: appSettings.primaryColor }}>
                    {t('ajustes.color_primario')}: {appSettings.primaryColor}
                  </span>
                  <div className="flex gap-2 flex-wrap">
                    <button type="button" className="inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">{t('ajustes.boton_primario')}</button>
                    <button type="button" className="inline-flex items-center justify-center rounded-md border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-9 px-4 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">{t('ajustes.boton_secundario')}</button>
                    <button type="button" className="inline-flex items-center justify-center rounded-md bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90 h-9 px-4 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">{t('ajustes.peligro')}</button>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="relative inline-flex">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded bg-muted text-muted-foreground">
                        <Settings className="h-4 w-4" />
                      </span>
                      <span className="absolute -top-1.5 -right-1.5 inline-flex items-center justify-center rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold min-w-[18px] h-[18px] px-1">5</span>
                    </span>
                    <span className="flex items-center gap-1.5 text-sm">
                      <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
                      {appSettings.appTheme === 'dark' ? t('ajustes.oscuro') : t('ajustes.claro')}
                    </span>
                  </div>
                  <Select
                    value={compactModeLabel}
                    onChange={v => updateAppSettings({ compactMode: v === 'compacto' })}
                    className={controlWidthClass}
                    options={[
                      { value: 'compacto', label: t('ajustes.compacto') },
                      { value: 'expandido', label: t('ajustes.modo_expandido') },
                    ]}
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'generales' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-4 sm:p-6">
                <SettingRow
                  icon={<Globe className="h-[18px] w-[18px]" />}
                  title={t('ajustes.idioma') || 'Idioma'}
                  subtitle={t('ajustes.idioma_sub')}
                >
                  <Select
                    value={appSettings.language}
                    onChange={v => updateAppSettings({ language: v })}
                    className={controlWidthClass}
                    options={[
                      { value: 'es', label: '🇬🇹 Español' },
                      { value: 'en', label: '🇺🇸 English' },
                    ]}
                  />
                </SettingRow>

                <SettingRow
                  icon={<Calendar className="h-[18px] w-[18px]" />}
                  title={t('ajustes.formato_fecha')}
                  subtitle={t('ajustes.formato_fecha_sub')}
                >
                  <Select
                    value={appSettings.dateFormat}
                    onChange={v => updateAppSettings({ dateFormat: v as 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD' })}
                    className={controlWidthClass}
                    options={[
                      { value: 'DD/MM/YYYY', label: '31/12/2026' },
                      { value: 'MM/DD/YYYY', label: '12/31/2026' },
                      { value: 'YYYY-MM-DD', label: '2026-12-31' },
                    ]}
                  />
                </SettingRow>

                <SettingRow
                  icon={<DollarSign className="h-[18px] w-[18px]" />}
                  title={t('ajustes.moneda')}
                  subtitle={t('ajustes.moneda_sub')}
                >
                  <Select
                    value={appSettings.currency}
                    onChange={v => updateAppSettings({ currency: v as 'GTQ' | 'USD' })}
                    className={controlWidthClass}
                    options={[
                      { value: 'GTQ', label: 'Q (Quetzal GT)' },
                      { value: 'USD', label: '$ (Dólar US)' },
                    ]}
                  />
                </SettingRow>
              </div>

              <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-4 sm:p-6">
                <h4 className="text-sm font-semibold mb-4">{t('ajustes.informacion_sistema')}</h4>
                <div className="rounded-lg border border-border overflow-hidden text-sm">
                  <dl className="m-0">
                    <div className="grid grid-cols-[1fr_2fr] border-b border-border last:border-b-0">
                      <dt className="bg-muted/50 px-3 py-2 text-muted-foreground font-medium border-r border-border">{t('ajustes.proyectos_activos')}</dt>
                       <dd className="px-3 py-2 m-0 text-foreground">{proyectosEnEjecucion}</dd>
                    </div>
                    <div className="grid grid-cols-[1fr_2fr] border-b border-border last:border-b-0">
                      <dt className="bg-muted/50 px-3 py-2 text-muted-foreground font-medium border-r border-border">{t('ajustes.total_proyectos')}</dt>
                      <dd className="px-3 py-2 m-0 text-foreground">{safeProyectos.length}</dd>
                    </div>
                    <div className="grid grid-cols-[1fr_2fr] border-b border-border last:border-b-0">
                      <dt className="bg-muted/50 px-3 py-2 text-muted-foreground font-medium border-r border-border">{t('ajustes.notificaciones_pendientes')}</dt>
                      <dd className="px-3 py-2 m-0">
                        <span className="relative inline-flex">
                          <Bell className="h-4 w-4 text-muted-foreground" />
                          {notificacionesNoLeidas > 0 && (
                            <span className="absolute -top-1.5 -right-1.5 inline-flex items-center justify-center rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold min-w-[16px] h-4 px-1">{notificacionesNoLeidas}</span>
                          )}
                        </span>
                      </dd>
                    </div>
                    <div className="grid grid-cols-[1fr_2fr] border-b border-border last:border-b-0">
                      <dt className="bg-muted/50 px-3 py-2 text-muted-foreground font-medium border-r border-border">{t('ajustes.framework_ui_actual')}</dt>
                      <dd className="px-3 py-2 m-0">
                        <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium ${
                          appSettings.uiMode === 'antd' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' : 'bg-muted text-muted-foreground'
                        }`}>
                          <FlaskConical className="h-3 w-3" />
                          {appSettings.uiMode === 'antd' ? t('ajustes.antd') : t('ajustes.shadcn')}
                        </span>
                      </dd>
                    </div>
                    <div className="grid grid-cols-[1fr_2fr] border-b border-border last:border-b-0">
                      <dt className="bg-muted/50 px-3 py-2 text-muted-foreground font-medium border-r border-border">{t('ajustes.tema_label')}</dt>
                      <dd className="px-3 py-2 m-0 text-foreground">{appSettings.appTheme === 'dark' ? t('ajustes.oscuro') : appSettings.appTheme === 'high-contrast' ? t('ajustes.alto_contraste') : t('ajustes.claro')}</dd>
                    </div>
                    <div className="grid grid-cols-[1fr_2fr] border-b border-border last:border-b-0">
                      <dt className="bg-muted/50 px-3 py-2 text-muted-foreground font-medium border-r border-border">{t('ajustes.version_label')}</dt>
                      <dd className="px-3 py-2 m-0 text-foreground">{t('ajustes.version_tag')}</dd>
                    </div>
                  </dl>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'notificaciones' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-4 sm:p-6">
                <SettingRow
                  icon={<Bell className="h-[18px] w-[18px]" />}
                  title={t('ajustes.sonidos_notificacion')}
                  subtitle={t('ajustes.sonidos_notificacion_sub')}
                >
                  <Switch
                    checked={appSettings.notificationSounds !== false}
                    onChange={v => updateAppSettings({ notificationSounds: v })}
                  />
                </SettingRow>

                <SettingRow
                  icon={<Bell className="h-[18px] w-[18px]" />}
                  title={t('ajustes.posicion_notificaciones')}
                  subtitle={t('ajustes.posicion_notificaciones_sub')}
                >
                  <RadioGroup
                    value={appSettings.toastPosition ?? 'bottom-right'}
                    onChange={v => updateAppSettings({ toastPosition: v as AppSettings['toastPosition'] })}
                    size="small"
                    options={[
                      { value: 'top-left', label: '↖ Arr. Izq' },
                      { value: 'top-center', label: '↑ Arr. Centro' },
                      { value: 'top-right', label: '↗ Arr. Der' },
                      { value: 'bottom-left', label: '↙ Abj. Izq' },
                      { value: 'bottom-center', label: '↓ Abj. Centro' },
                      { value: 'bottom-right', label: '↘ Abj. Der' },
                    ]}
                  />
                </SettingRow>

                <SettingRow
                  icon={<Bell className="h-[18px] w-[18px]" />}
                  title={t('ajustes.stock_critico')}
                  subtitle={t('ajustes.stock_critico_sub')}
                >
                  <Switch
                    checked={appSettings.notificaciones?.stockCritico}
                    onChange={v => updateAppSettings({ notificaciones: { ...appSettings.notificaciones, stockCritico: v } })}
                  />
                </SettingRow>

                <SettingRow
                  icon={<FileText className="h-[18px] w-[18px]" />}
                  title={t('ajustes.ordenes_cambio') || 'Órdenes de Cambio'}
                  subtitle={t('ajustes.ordenes_cambio_sub') || 'Notificar OC pendientes de revisión'}
                >
                  <Switch
                    checked={appSettings.notificaciones?.ordenesCambio}
                    onChange={v => updateAppSettings({ notificaciones: { ...appSettings.notificaciones, ordenesCambio: v } })}
                  />
                </SettingRow>

                <SettingRow
                  icon={<TrendingUp className="h-[18px] w-[18px]" />}
                  title={t('ajustes.avances_obra') || 'Avances de Obra'}
                  subtitle={t('ajustes.avances_obra_sub') || 'Registro de avances físicos'}
                >
                  <Switch
                    checked={appSettings.notificaciones?.avancesObra}
                    onChange={v => updateAppSettings({ notificaciones: { ...appSettings.notificaciones, avancesObra: v } })}
                  />
                </SettingRow>

                <SettingRow
                  icon={<AlertTriangle className="h-[18px] w-[18px]" />}
                  title={t('ajustes.desviaciones')}
                  subtitle={t('ajustes.desviaciones_sub')}
                >
                  <Switch
                    checked={appSettings.notificaciones?.desviaciones}
                    onChange={v => updateAppSettings({ notificaciones: { ...appSettings.notificaciones, desviaciones: v } })}
                  />
                </SettingRow>
              </div>

              <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-4 sm:p-6">
                <h4 className="text-sm font-semibold mb-4">{t('ajustes.estado_notificaciones')}</h4>
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-2">
                    <Bell className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground m-0">{t('ajustes.no_leidas')}</p>
                      <p className="text-2xl font-bold text-foreground m-0">{notificacionesNoLeidas}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={marcarTodasLeidas}
                    className="inline-flex items-center justify-center gap-2 rounded-md bg-primary text-primary-foreground shadow hover:bg-primary/90 h-10 px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <CheckCircle className="h-4 w-4" />
                    {t('ajustes.marcar_todas_leidas')}
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'datos' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-4 sm:p-6">
                <div className="flex flex-col gap-4">
                  <button
                    type="button"
                    onClick={exportBackup}
                    className="inline-flex items-center justify-center gap-2 rounded-md border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground w-full h-12 px-4 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <Download className="h-4 w-4" />
                    {t('ajustes.exportar_backup')}
                  </button>
                  <button
                    type="button"
                    onClick={importBackup}
                    className="inline-flex items-center justify-center gap-2 rounded-md border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground w-full h-12 px-4 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <FileInput className="h-4 w-4" />
                    {t('ajustes.importar_datos')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setResetModal(true)}
                    className="inline-flex items-center justify-center gap-2 rounded-md bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90 w-full h-12 px-4 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <Trash2 className="h-4 w-4" />
                    {t('ajustes.restablecer_fabrica')}
                  </button>
                </div>
              </div>

              <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-4 sm:p-6">
                <h4 className="text-sm font-semibold mb-4">{t('ajustes.almacenamiento')}</h4>
                <div className="flex items-center gap-2 mb-4">
                  <Database className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground m-0">{t('ajustes.datos_localstorage')}</p>
                    <p className="text-2xl font-bold text-foreground m-0">~2.4 MB</p>
                  </div>
                </div>
                <hr className="my-3 border-t border-border" />
                <p className="text-xs text-muted-foreground m-0">{t('ajustes.datos_sincronizacion')}</p>
              </div>
            </div>
          )}

          {activeTab === 'cuenta' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-4 sm:p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-primary-foreground">
                    <User className="h-8 w-8" />
                  </div>
                  <div>
                    <h5 className="text-base font-semibold m-0 text-foreground">{user?.nombre || t('ajustes.usuario')}</h5>
                    <p className="text-sm text-muted-foreground m-0">{user?.rol}</p>
                  </div>
                </div>
                <div className="rounded-lg border border-border overflow-hidden text-sm">
                  <dl className="m-0">
                    <div className="grid grid-cols-[1fr_2fr] border-b border-border last:border-b-0">
                      <dt className="bg-muted/50 px-3 py-2 text-muted-foreground font-medium border-r border-border">{t('ajustes.rol')}</dt>
                      <dd className="px-3 py-2 m-0">
                        <span className="inline-flex items-center rounded-md bg-blue-100 dark:bg-blue-900 px-2 py-0.5 text-xs font-medium text-blue-700 dark:text-blue-300">{user?.rol}</span>
                      </dd>
                    </div>
                    <div className="grid grid-cols-[1fr_2fr] border-b border-border last:border-b-0">
                      <dt className="bg-muted/50 px-3 py-2 text-muted-foreground font-medium border-r border-border">{t('ajustes.id_usuario')}</dt>
                      <dd className="px-3 py-2 m-0">
                        <span className="text-xs text-foreground cursor-pointer hover:text-primary" title={t('ajustes.copiar')} onClick={() => { navigator.clipboard.writeText(user?.id || ''); toast.success(t('ajustes.copiado')); }}>{user?.id}</span>
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>

              <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-4 sm:p-6">
                <h4 className="text-sm font-semibold mb-4">{t('ajustes.seguridad')}</h4>
                <div className="flex flex-col gap-4">
                  <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-4">
                    <h5 className="text-sm font-medium mb-2">{t('ajustes.autenticacion_2fa')}</h5>
                    <div className="flex flex-col gap-3">
                      <p className="text-sm text-muted-foreground m-0">{t('ajustes.protege_cuenta')}</p>
                      <a
                        href="https://supabase.com/dashboard/project/_/auth/mfa"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-2 rounded-md bg-primary text-primary-foreground shadow hover:bg-primary/90 w-full h-10 px-4 text-sm font-medium transition-colors"
                      >
                        <Shield className="h-4 w-4" />
                        {t('ajustes.configurar_2fa')}
                      </a>
                      <p className="text-xs text-muted-foreground m-0">{t('ajustes.redirigido_supabase')}</p>
                    </div>
                  </div>
                  <hr className="border-t border-border" />
                  <button
                    type="button"
                    className="inline-flex items-center justify-center gap-2 rounded-md border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground w-full h-10 px-4 text-sm font-medium transition-colors"
                  >
                    <Key className="h-4 w-4" />
                    {t('ajustes.cambiar_contrasena')}
                  </button>
                  <hr className="border-t border-border" />
                  <div className="rounded-lg border border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950 p-3">
                    <div className="flex gap-2">
                      <CheckCircle className="h-4 w-4 mt-0.5 text-green-600 dark:text-green-400 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-green-800 dark:text-green-200 m-0">{t('ajustes.sesion_segura')}</p>
                        <p className="text-xs text-green-700 dark:text-green-300 m-0 mt-0.5">{t('ajustes.sesion_segura_desc')}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'roles' && user?.rol === 'Administrador' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-4 sm:p-6">
                <h4 className="text-sm font-semibold mb-4 flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" />
                  Roles del sistema
                </h4>
                <p className="text-xs text-muted-foreground mb-4">
                  Asigna los módulos que cada rol puede ver. El admin puede seleccionar exactamente qué pantallas quedan habilitadas por rol.
                </p>
                <div className="flex flex-col gap-3">
                  {(Object.entries({
                    Administrador: ['Todos los módulos'],
                    Gerente: ['dashboard','proyectos','presupuestos','seguimiento','financiero','hitos','riesgos','ordenes-cambio','notificaciones','sso-calidad','documentos','profitability','calidad-cumplimiento','curvas-s','auditoria','apu','rendimiento-campo','baseprecios','muro','visor-bim','predictivo','exportacion','comercial-fin'],
                    Residente: ['dashboard','proyectos','presupuestos','seguimiento','apu','rendimiento-campo','baseprecios','muro','hitos','bodega','ordenes-cambio','notificaciones','sso-calidad','documentos','profitability','calidad-cumplimiento','curvas-s'],
                    Compras: ['dashboard','bodega','proyectos','cotizaciones','proveedor-analytics','entradas-almacen'],
                    Bodeguero: ['dashboard','bodega'],
                  }) as [string, string[]][]).map(([rol, modulos]) => (
                    <div key={rol} className="rounded-lg border border-border p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-foreground">{rol}</span>
                        <span className="text-[11px] text-muted-foreground">{modulos.length} módulos</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {modulos.map(m => (
                          <span key={m} className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-[11px] font-medium text-foreground">{m}</span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-4 sm:p-6">
                <h4 className="text-sm font-semibold mb-4 flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                  Reglas de acceso
                </h4>
                <div className="flex flex-col gap-3 text-xs text-muted-foreground">
                  <p>• El administrador <strong className="text-foreground">salazaroliveros@gmail.com</strong> siempre tiene acceso total.</p>
                  <p>• Los demás usuarios obtienen su rol desde la tabla <code className="bg-muted px-1 py-0.5 rounded">profiles</code>.</p>
                  <p>• El admin puede modificar estos mapeos en el futuro desde Ajustes o Supabase.</p>
                  <p>• Si un usuario no tiene rol asignado, se le aplicará el rol <code className="bg-muted px-1 py-0.5 rounded">Gerente</code>.</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'acerca' && (
            <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-4 sm:p-6">
              <div className="flex flex-col items-center gap-4 text-center">
                <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center text-primary-foreground">
                  <Info className="h-10 w-10" />
                </div>
                <h3 className="text-lg font-bold m-0 text-foreground truncate" title={t('ajustes.erp_nombre')}>{t('ajustes.erp_nombre')}</h3>
                <p className="text-sm text-muted-foreground m-0">{t('ajustes.sistema_integral')}</p>
                <span className="inline-flex items-center rounded-md bg-orange-100 dark:bg-orange-900 px-3 py-1 text-sm font-medium text-orange-700 dark:text-orange-300">{t('ajustes.version_tag')}</span>
                <hr className="w-full border-t border-border my-2" />
                <div className="rounded-lg border border-border overflow-hidden text-sm w-full max-w-[600px] mx-auto">
                  <dl className="m-0 grid grid-cols-2">
                    <div className="border-b border-border border-r">
                      <dt className="bg-muted/50 px-3 py-2 text-muted-foreground font-medium">{t('ajustes.about_framework_frontend')}</dt>
                      <dd className="px-3 py-2 m-0 text-foreground">{t('ajustes.about_react_ts')}</dd>
                    </div>
                    <div className="border-b border-border">
                      <dt className="bg-muted/50 px-3 py-2 text-muted-foreground font-medium">{t('ajustes.about_ui_principal')}</dt>
                      <dd className="px-3 py-2 m-0 text-foreground">{t('ajustes.about_shadcn_ui')}</dd>
                    </div>
                    <div className="border-b border-border border-r">
                      <dt className="bg-muted/50 px-3 py-2 text-muted-foreground font-medium">{t('ajustes.about_backend')}</dt>
                      <dd className="px-3 py-2 m-0 text-foreground">{t('ajustes.about_supabase')}</dd>
                    </div>
                    <div className="border-b border-border">
                      <dt className="bg-muted/50 px-3 py-2 text-muted-foreground font-medium">{t('ajustes.about_visualizacion')}</dt>
                      <dd className="px-3 py-2 m-0 text-foreground">{t('ajustes.about_recharts')}</dd>
                    </div>
                    <div className="border-b border-border border-r">
                      <dt className="bg-muted/50 px-3 py-2 text-muted-foreground font-medium">{t('ajustes.about_bim')}</dt>
                      <dd className="px-3 py-2 m-0 text-foreground">{t('ajustes.about_threejs')}</dd>
                    </div>
                    <div className="border-b border-border">
                      <dt className="bg-muted/50 px-3 py-2 text-muted-foreground font-medium">{t('ajustes.about_estilos')}</dt>
                      <dd className="px-3 py-2 m-0 text-foreground">{t('ajustes.about_tailwind')}</dd>
                    </div>
                    <div className="col-span-2">
                      <dt className="bg-muted/50 px-3 py-2 text-muted-foreground font-medium border-r border-border">{t('ajustes.desarrollado_por')}</dt>
                      <dd className="px-3 py-2 m-0 text-foreground">{t('ajustes.about_constructora')}</dd>
                    </div>
                  </dl>
                </div>
                <hr className="w-full border-t border-border" />
                <p className="text-xs text-muted-foreground m-0">{t('ajustes.edificando_futuro')}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {resetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setResetModal(false)}>
          <div className="bg-background rounded-xl border shadow-lg w-[95vw] max-w-[520px] p-6" onClick={e => e.stopPropagation()}>
            <h4 className="text-lg font-semibold mb-4 text-foreground">{t('ajustes.restablecer_titulo', 'Restablecer datos de fábrica')}</h4>
            <div className="rounded-lg border border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950 p-3 mb-6">
              <div className="flex gap-2">
                <AlertTriangle className="h-4 w-4 mt-0.5 text-yellow-600 dark:text-yellow-400 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200 m-0">{t('ajustes.restablecer_alerta_titulo', '¿Estás seguro?')}</p>
                  <p className="text-xs text-yellow-700 dark:text-yellow-300 m-0 mt-0.5">{t('ajustes.restablecer_alerta_desc', 'Esta acción eliminará todos los datos locales y restaurará la configuración predeterminada. Los datos en la nube no se verán afectados.')}</p>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setResetModal(false)}
                className="inline-flex items-center justify-center rounded-md border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-11 px-4 text-sm font-medium transition-colors"
              >
                {t('common.cancelar')}
              </button>
              <button
                type="button"
                onClick={() => { clearAllData(); setResetModal(false); }}
                className="inline-flex items-center justify-center rounded-md bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90 h-11 px-4 text-sm font-medium transition-colors"
              >
                {t('ajustes.restablecer')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Ajustes;