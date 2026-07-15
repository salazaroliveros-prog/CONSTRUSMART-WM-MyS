import { Skeleton } from '@/components/ui/skeleton';
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useErp, clearAllData, type UIMode, type AppThemeMode } from '../store';
import type { AppSettings } from '../utils';
import { THEMES, type ThemeName, PRIMARY_COLORS } from '@/lib/themes';
import {
  Layout, Card, Row, Col, Switch, Select, Button, Divider,
  Typography, Space, Tabs, Tag, Avatar, Descriptions, Modal,
  Radio, Tooltip, Badge, Alert, Statistic, theme as antTheme,
} from 'antd';
import {
  SettingOutlined, GlobalOutlined, BellOutlined,
  SafetyOutlined, InfoCircleOutlined, DatabaseOutlined,
  MoonOutlined, SunOutlined, BgColorsOutlined,
  FontSizeOutlined, EyeOutlined, KeyOutlined,
  DownloadOutlined, UploadOutlined, DeleteOutlined,
  CheckCircleOutlined, ExperimentOutlined, UserOutlined, ImportOutlined,

  CalendarOutlined, DollarOutlined, WarningOutlined,
  PlayCircleOutlined, FileTextOutlined, RiseOutlined,
} from '@ant-design/icons';

const { Title, Text } = Typography;

const ICON_SIZE = 18;
const dividerStyle: React.CSSProperties = { margin: '12px 0' };
const rowStyle: React.CSSProperties = { marginBottom: 16 };
const iconPrimaryStyle: React.CSSProperties = { fontSize: ICON_SIZE, color: 'inherit' };
const controlWidthClass = 'w-full sm:w-40 md:w-44';
const halfWidthClass = 'w-full sm:w-44 md:w-52';

interface SettingRowProps {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

const SettingRow: React.FC<SettingRowProps> = ({ icon, title, subtitle, children }) => (
  <div style={rowStyle}>
    <Space align="center" style={{ width: '100%', justifyContent: 'space-between' }} size="middle">
      <Space>
        {icon}
        <div>
          <Text strong style={{ fontSize: 14 }}>{title}</Text>
          {subtitle ? (
            <>
              <br />
              <Text type="secondary" style={{ fontSize: 12 }}>{subtitle}</Text>
            </>
          ) : null}
        </div>
      </Space>
      <div style={{ flexShrink: 0 }}>{children}</div>
    </Space>
    <Divider style={dividerStyle} />
  </div>
);

const Ajustes: React.FC = () => {
  const { t } = useTranslation();
  const { appSettings, updateAppSettings, user, proyectos, notificacionesNoLeidas, marcarTodasLeidas } = useErp();
  const safeProyectos = Array.isArray(proyectos) ? proyectos : [];
  const [resetModal, setResetModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => { setLoading(false); }, []);
  const { token } = antTheme.useToken();

  const compactModeLabel = appSettings.compactMode ? 'compacto' : 'expandido';

  const exportBackup = () => {
    try {
      const data: Record<string, string> = {};
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith('wm_')) data[k] = localStorage.getItem(k) || '';
      }
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `construsmart_backup_${new Date().toISOString().slice(0,10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success(t('ajustes.respaldo_exportado'));
    } catch (e) {
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
        const wmKeys = Object.keys(data).filter(k => k.startsWith('wm_'));
        if (wmKeys.length === 0) {
          toast.warning(t('ajustes.sin_datos_validos'));
          return;
        }
        for (const k of wmKeys) {
          localStorage.setItem(k, data[k]);
        }
        toast.success(t('ajustes.importados_exito', { count: wmKeys.length, archivo: file.name }));
        window.location.reload();
      } catch (err) {
        toast.error(t('ajustes.error_leer_respaldo'));
      }
    };
    input.click();
  };

  const sectionCard: React.CSSProperties = {
    borderRadius: token.borderRadiusLG,
    boxShadow: token.boxShadow,
  };

  const tabItems = [
    {
      key: 'apariencia',
      label: <span><BgColorsOutlined /> {t('ajustes.apariencia')}</span>,
      children: (
        <Row gutter={[24, 24]}>
          <Col xs={24} lg={12}>
            <Card style={sectionCard} size="small">
              <SettingRow
                icon={<ExperimentOutlined style={{ fontSize: ICON_SIZE, color: token.colorPrimary }} />}
                title={t("ajustes.framework_ui")}
                subtitle={t("ajustes.framework_ui_sub")}
              >
                <Radio.Group
                  value={appSettings.uiMode}
                  onChange={e => updateAppSettings({ uiMode: e.target.value as UIMode })}
                  optionType="button"
                  buttonStyle="solid"
                  size="middle"
                >
                  <Tooltip title="Estilo actual con Tailwind + Shadcn">
                    <Radio.Button value="shadcn">
                      <Space><BgColorsOutlined /> Clásico</Space>
                    </Radio.Button>
                  </Tooltip>
                  <Tooltip title="Ant Design - Diseño moderno profesional">
                    <Radio.Button value="antd">
                      <Space><ExperimentOutlined /> Moderno</Space>
                    </Radio.Button>
                  </Tooltip>
                </Radio.Group>
              </SettingRow>

              <div style={rowStyle}>
                <Space style={{ width: '100%' }} direction="vertical" size={0}>
                  <Space style={{ width: '100%' }} align="center">
                    <BgColorsOutlined style={{ fontSize: ICON_SIZE, color: token.colorPrimary }} />
                    <div>
                      <Text strong>{t("ajustes.tema_visual")}</Text>
                      <br /><Text type="secondary">{t("ajustes.tema_visual_sub")}</Text>
                    </div>
                  </Space>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
                    {(Object.entries(THEMES) as [ThemeName, typeof THEMES[ThemeName]][]).map(([key, t]) => (
                      <Tooltip key={key} title={t.description}>
                        <div
                          onClick={() => updateAppSettings({ appTheme: key as AppThemeMode })}
                          style={{
                            cursor: 'pointer',
                            padding: '6px 14px',
                            borderRadius: 8,
                            border: `2px solid ${appSettings.appTheme === key ? t.colors.primary : token.colorBorder}`,
                            background: t.colors.background,
                            color: t.colors.foreground,
                            fontWeight: appSettings.appTheme === key ? 700 : 400,
                            fontSize: 13,
                            transition: 'all 0.2s',
                            boxShadow: appSettings.appTheme === key ? `0 0 0 3px ${t.colors.primary}33` : 'none',
                            display: 'flex', alignItems: 'center', gap: 6,
                          }}
                        >
                          <span style={{ width: 12, height: 12, borderRadius: '50%', background: t.colors.primary, display: 'inline-block', flexShrink: 0 }} />
                          {t.label}
                        </div>
                      </Tooltip>
                    ))}
                  </div>
                </Space>
              </div>
              <Divider style={dividerStyle} />

              <SettingRow
                icon={<BgColorsOutlined style={{ fontSize: ICON_SIZE, color: appSettings.primaryColor }} />}
                title={t('ajustes.color_principal') || 'Color Principal'}
                subtitle={t('ajustes.color_principal_sub') || 'Personaliza el color primario de la marca'}
              >
                <Radio.Group
                  value={appSettings.primaryColor}
                  onChange={e => updateAppSettings({ primaryColor: e.target.value })}
                  optionType="button"
                  buttonStyle="solid"
                  size="small"
                >
                  {PRIMARY_COLORS.map(c => (
                    <Tooltip title={c.label} key={c.value}>
                      <Radio.Button
                        value={c.value}
                        aria-label={c.label}
                        style={{
                          backgroundColor: c.value,
                          width: 28,
                          height: 28,
                          border: appSettings.primaryColor === c.value ? '2px solid #000' : 'none',
                        }}
                      />
                    </Tooltip>
                  ))}
                </Radio.Group>
              </SettingRow>

              <SettingRow
                icon={<FontSizeOutlined style={{ fontSize: ICON_SIZE }} />}
                title={t("ajustes.tamano_fuente")}
                subtitle={t("ajustes.tamano_fuente_sub")}
              >
                <Radio.Group
                  value={appSettings.fontSize}
                  onChange={e => updateAppSettings({ fontSize: e.target.value as 'small' | 'medium' | 'large' })}
                  optionType="button"
                  buttonStyle="solid"
                >
                  <Radio.Button value="small">{t("ajustes.pequeno")}</Radio.Button>
                  <Radio.Button value="medium">{t("ajustes.mediano")}</Radio.Button>
                  <Radio.Button value="large">{t("ajustes.grande")}</Radio.Button>
                </Radio.Group>
              </SettingRow>

              <SettingRow
                icon={<FontSizeOutlined style={{ fontSize: ICON_SIZE }} />}
                title={t("ajustes.tipografia")}
                subtitle={t("ajustes.tipografia_sub")}
              >
                <Select value={appSettings.fontFamily} onChange={v => updateAppSettings({ fontFamily: v as string })} className={controlWidthClass} options={[
                  { value: 'system-ui', label: 'System UI' },
                  { value: 'inter', label: 'Inter' },
                  { value: 'roboto', label: 'Roboto' },
                  { value: 'open-sans', label: 'Open Sans' },
                  { value: 'poppins', label: 'Poppins' },
                ]} />
              </SettingRow>

              <SettingRow
                icon={<BgColorsOutlined style={{ fontSize: ICON_SIZE }} />}
                title={t("ajustes.radio_bordes")}
                subtitle={t("ajustes.radio_bordes_sub")}
              >
                <Radio.Group
                  value={appSettings.borderRadius}
                  onChange={e => updateAppSettings({ borderRadius: e.target.value as string })}
                  optionType="button"
                  buttonStyle="solid"
                >
                  <Radio.Button value="none">{t("ajustes.ninguno")}</Radio.Button>
                  <Radio.Button value="small">{t("ajustes.pequeno")}</Radio.Button>
                  <Radio.Button value="medium">{t("ajustes.mediano")}</Radio.Button>
                  <Radio.Button value="large">{t("ajustes.grande")}</Radio.Button>
                  <Radio.Button value="full">{t("ajustes.pill")}</Radio.Button>
                </Radio.Group>
              </SettingRow>

              <SettingRow
                icon={<BgColorsOutlined style={{ fontSize: ICON_SIZE }} />}
                title={t("ajustes.espaciado_global")}
                subtitle={t("ajustes.espaciado_global_sub")}
              >
                <Radio.Group
                  value={appSettings.spacingScale}
                  onChange={e => updateAppSettings({ spacingScale: e.target.value as string })}
                  optionType="button"
                  buttonStyle="solid"
                >
                  <Radio.Button value="compact">{t("ajustes.compacto")}</Radio.Button>
                  <Radio.Button value="normal">{t("ajustes.normal")}</Radio.Button>
                  <Radio.Button value="spacious">{t("ajustes.amplio")}</Radio.Button>
                </Radio.Group>
              </SettingRow>

              <SettingRow
                icon={<BgColorsOutlined style={{ fontSize: ICON_SIZE }} />}
                title={t("ajustes.densidad_tablas")}
                subtitle={t("ajustes.densidad_tablas_sub")}
              >
                <Radio.Group
                  value={appSettings.densityTable}
                  onChange={e => updateAppSettings({ densityTable: e.target.value as string })}
                  optionType="button"
                  buttonStyle="solid"
                >
                  <Radio.Button value="compact">{t("ajustes.compacta")}</Radio.Button>
                  <Radio.Button value="normal">{t("ajustes.normal")}</Radio.Button>
                  <Radio.Button value="comfortable">{t("ajustes.comoda")}</Radio.Button>
                </Radio.Group>
              </SettingRow>

              <SettingRow
                icon={<PlayCircleOutlined style={{ fontSize: ICON_SIZE }} />}
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
                icon={<PlayCircleOutlined style={{ fontSize: ICON_SIZE }} />}
                title={t("ajustes.tipo_animacion")}
                subtitle={t("ajustes.tipo_animacion_sub")}
              >
                <Radio.Group
                  value={appSettings.animationType || 'fade'}
                  onChange={e => updateAppSettings({ animationType: e.target.value as string })}
                  optionType="button"
                  buttonStyle="solid"
                >
                  <Radio.Button value="fade">{t("ajustes.fundido")}</Radio.Button>
                  <Radio.Button value="slide">{t("ajustes.deslizar")}</Radio.Button>
                  <Radio.Button value="scale">{t("ajustes.escalar")}</Radio.Button>
                  <Radio.Button value="none">{t("ajustes.ninguna")}</Radio.Button>
                </Radio.Group>
              </SettingRow>

              <SettingRow
                icon={<EyeOutlined style={{ fontSize: ICON_SIZE }} />}
                title={t("ajustes.modo_compacto")}
                subtitle={t("ajustes.modo_compacto_sub")}
              >
                <Switch
                  checked={appSettings.compactMode}
                  onChange={v => updateAppSettings({ compactMode: v })}
                />
              </SettingRow>

              <SettingRow
                icon={<span style={{ fontSize: ICON_SIZE }}>🔗</span>}
                title={t("ajustes.migas_pan")}
                subtitle={t("ajustes.migas_pan_sub")}
              >
                <Switch
                  checked={appSettings.breadcrumbsEnabled !== false}
                  onChange={v => updateAppSettings({ breadcrumbsEnabled: v })}
                />
              </SettingRow>

              <SettingRow
                icon={<span style={{ fontSize: ICON_SIZE }}>📄</span>}
                title={t("ajustes.pie_pagina")}
                subtitle={t("ajustes.pie_pagina_sub")}
              >
                <Switch
                  checked={appSettings.footerEnabled !== false}
                  onChange={v => updateAppSettings({ footerEnabled: v })}
                />
              </SettingRow>

              <SettingRow
                icon={<span style={{ fontSize: ICON_SIZE }}>👆</span>}
                title={t("ajustes.modo_tactil")}
                subtitle={t("ajustes.modo_tactil_sub")}
              >
                <Switch
                  checked={appSettings.touchMode || false}
                  onChange={v => updateAppSettings({ touchMode: v })}
                />
              </SettingRow>

              <SettingRow
                icon={<SettingOutlined style={{ fontSize: ICON_SIZE }} />}
                title={t("ajustes.posicion_sidebar")}
                subtitle={t("ajustes.posicion_sidebar_sub")}
              >
                <Radio.Group
                  value={appSettings.sidebarPosition}
                  onChange={e => updateAppSettings({ sidebarPosition: e.target.value as string })}
                  optionType="button"
                  buttonStyle="solid"
                  size="small"
                >
                  <Radio.Button value="left">{t("ajustes.izquierda")}</Radio.Button>
                  <Radio.Button value="right">{t("ajustes.derecha")}</Radio.Button>
                  <Radio.Button value="overlay">Overlay</Radio.Button>
                </Radio.Group>
              </SettingRow>

              <SettingRow
                icon={<SettingOutlined style={{ fontSize: ICON_SIZE }} />}
                title={t("ajustes.modo_sidebar")}
                subtitle={t("ajustes.modo_sidebar_sub")}
              >
                <Radio.Group
                  value={appSettings.sidebarMode}
                  onChange={e => updateAppSettings({ sidebarMode: e.target.value as string })}
                  optionType="button"
                  buttonStyle="solid"
                  size="small"
                >
                  <Radio.Button value="expanded">{t("ajustes.expandido")}</Radio.Button>
                  <Radio.Button value="collapsed">{t("ajustes.colapsado")}</Radio.Button>
                  <Radio.Button value="hover-expand">Hover Expand</Radio.Button>
                  <Radio.Button value="mini">{t("ajustes.mini")}</Radio.Button>
                </Radio.Group>
              </SettingRow>

              <SettingRow
                icon={<SettingOutlined style={{ fontSize: ICON_SIZE }} />}
                title={t("ajustes.ancho_sidebar")}
                subtitle={t("ajustes.ancho_sidebar_sub")}
              >
                <Radio.Group
                  value={appSettings.sidebarWidth}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateAppSettings({ sidebarWidth: e.target.value })}
                  optionType="button"
                  buttonStyle="solid"
                  size="small"
                >
                  <Radio.Button value={240}>240px</Radio.Button>
                  <Radio.Button value={280}>280px</Radio.Button>
                  <Radio.Button value={320}>320px</Radio.Button>
                </Radio.Group>
              </SettingRow>
            </Card>
          </Col>

          <Col xs={24} lg={12}>
            <Card title="Previsualización en Vivo" style={sectionCard} size="small">
              <Alert
                message="Vista previa del tema activo"
                description="Los cambios se aplican en tiempo real. El color primario y tema se reflejan en todos los componentes de Ant Design."
                type="info"
                showIcon
                style={{ marginBottom: 16 }}
              />
              <Space direction="vertical" style={{ width: '100%' }} size={12}>
                <Tag color={appSettings.primaryColor}>Color Primario: {appSettings.primaryColor}</Tag>
                <Space>
                  <Button type="primary">Botón Primario</Button>
                  <Button>Botón Secundario</Button>
                  <Button type="primary" danger>Peligro</Button>
                </Space>
                <Space>
                  <Badge count={5}><Avatar shape="square" icon={<SettingOutlined />} /></Badge>
                  <Badge status="success" text={appSettings.appTheme === 'dark' ? t('ajustes.oscuro') : t('ajustes.claro')} />
                </Space>
                <Select
                  value={compactModeLabel}
                  onChange={v => updateAppSettings({ compactMode: v === 'compacto' })}
                  className={controlWidthClass}
                  options={[
                    { value: 'compacto', label: t('ajustes.compacto') },
                    { value: 'expandido', label: t('ajustes.modo_expandido') },
                  ]}
                />
              </Space>
            </Card>
          </Col>
        </Row>
      ),
    },
    {
      key: 'generales',
      label: <span><GlobalOutlined /> {t('ajustes.generales_tab')}</span>,
      children: (
        <Row gutter={[24, 24]}>
          <Col xs={24} lg={12}>
            <Card style={sectionCard} size="small">
              <SettingRow
                icon={<GlobalOutlined style={{ fontSize: ICON_SIZE }} />}
                title={t('ajustes.idioma') || 'Idioma'}
                subtitle={t("ajustes.idioma_sub")}
              >
                <Select value={appSettings.language} onChange={v => updateAppSettings({ language: v })} className={controlWidthClass} options={[
                  { value: 'es', label: '🇬🇹 Español' },
                  { value: 'en', label: '🇺🇸 English' },
                ]} />
              </SettingRow>

              <SettingRow
                icon={<CalendarOutlined style={{ fontSize: ICON_SIZE }} />}
                title={t("ajustes.formato_fecha")}
                subtitle={t("ajustes.formato_fecha_sub")}
              >
                <Select value={appSettings.dateFormat} onChange={v => updateAppSettings({ dateFormat: v as 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD' })} className="w-full sm:w-40 md:w-44" options={[
                  { value: 'DD/MM/YYYY', label: '31/12/2026' },
                  { value: 'MM/DD/YYYY', label: '12/31/2026' },
                  { value: 'YYYY-MM-DD', label: '2026-12-31' },
                ]} />
              </SettingRow>

              <SettingRow
                icon={<DollarOutlined style={{ fontSize: ICON_SIZE }} />}
                title={t("ajustes.moneda")}
                subtitle={t("ajustes.moneda_sub")}
              >
                <Select value={appSettings.currency} onChange={v => updateAppSettings({ currency: v as 'GTQ' | 'USD' })} className={controlWidthClass} options={[
                  { value: 'GTQ', label: 'Q (Quetzal GT)' },
                  { value: 'USD', label: '$ (Dólar US)' },
                ]} />
              </SettingRow>
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card title={t("ajustes.informacion_sistema")} style={sectionCard} size="small">
              <Descriptions column={1} size="small" bordered>
                 <Descriptions.Item label={t("ajustes.proyectos_activos")}>{safeProyectos.filter(p => p.estado === 'ejecucion').length}</Descriptions.Item>
                 <Descriptions.Item label={t("ajustes.total_proyectos")}>{safeProyectos.length}</Descriptions.Item>
                <Descriptions.Item label={t("ajustes.notificaciones_pendientes")}>
                  <Badge count={notificacionesNoLeidas} showZero>
                    <BellOutlined style={{ fontSize: 16 }} />
                  </Badge>
                </Descriptions.Item>
                <Descriptions.Item label={t("ajustes.framework_ui_actual")}>
                  <Tag icon={<ExperimentOutlined />} color={appSettings.uiMode === 'antd' ? 'blue' : 'default'}>
                    {appSettings.uiMode === 'antd' ? 'Ant Design' : 'Shadcn UI'}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label={t("ajustes.tema_label")}>{appSettings.appTheme === 'dark' ? 'Oscuro' : appSettings.appTheme === 'high-contrast' ? 'Alto Contraste' : 'Claro'}</Descriptions.Item>
                <Descriptions.Item label={t("ajustes.version_label")}>v2.0.0</Descriptions.Item>
              </Descriptions>
            </Card>
          </Col>
        </Row>
      ),
    },
    {
      key: 'notificaciones',
      label: <span><BellOutlined /> {t('ajustes.notificaciones_tab')}</span>,
      children: (
        <Row gutter={[24, 24]}>
          <Col xs={24} lg={12}>
            <Card style={sectionCard} size="small">
              <SettingRow
                icon={<BellOutlined style={{ fontSize: ICON_SIZE }} />}
                title={t("ajustes.sonidos_notificacion")}
                subtitle={t("ajustes.sonidos_notificacion_sub")}
              >
                <Switch
                  checked={appSettings.notificationSounds !== false}
                  onChange={v => updateAppSettings({ notificationSounds: v })}
                />
              </SettingRow>

              <SettingRow
                icon={<BellOutlined style={{ fontSize: ICON_SIZE }} />}
                title={t("ajustes.posicion_notificaciones")}
                subtitle={t("ajustes.posicion_notificaciones_sub")}
              >
                <Radio.Group
                  value={appSettings.toastPosition ?? 'bottom-right'}
                  onChange={e => updateAppSettings({ toastPosition: e.target.value as AppSettings['toastPosition'] })}
                  optionType="button"
                  buttonStyle="solid"
                  size="small"
                >
                  <Radio.Button value="top-left">↖ Arr. Izq</Radio.Button>
                  <Radio.Button value="top-center">↑ Arr. Centro</Radio.Button>
                  <Radio.Button value="top-right">↗ Arr. Der</Radio.Button>
                  <Radio.Button value="bottom-left">↙ Abj. Izq</Radio.Button>
                  <Radio.Button value="bottom-center">↓ Abj. Centro</Radio.Button>
                  <Radio.Button value="bottom-right">↘ Abj. Der</Radio.Button>
                </Radio.Group>
              </SettingRow>

              <SettingRow
                icon={<BellOutlined style={{ fontSize: ICON_SIZE }} />}
                title={t("ajustes.stock_critico")}
                subtitle={t("ajustes.stock_critico_sub")}
              >
                <Switch checked={appSettings.notificaciones?.stockCritico} onChange={v => updateAppSettings({ notificaciones: { ...appSettings.notificaciones, stockCritico: v } })} />
              </SettingRow>

              <SettingRow
                icon={<FileTextOutlined style={{ fontSize: ICON_SIZE }} />}
                title={t('ajustes.ordenes_cambio') || 'Órdenes de Cambio'}
                subtitle={t('ajustes.ordenes_cambio_sub') || 'Notificar OC pendientes de revisión'}
              >
                <Switch checked={appSettings.notificaciones?.ordenesCambio} onChange={v => updateAppSettings({ notificaciones: { ...appSettings.notificaciones, ordenesCambio: v } })} />
              </SettingRow>

              <SettingRow
                icon={<RiseOutlined style={{ fontSize: ICON_SIZE }} />}
                title={t('ajustes.avances_obra') || 'Avances de Obra'}
                subtitle={t('ajustes.avances_obra_sub') || 'Registro de avances físicos'}
              >
                <Switch checked={appSettings.notificaciones?.avancesObra} onChange={v => updateAppSettings({ notificaciones: { ...appSettings.notificaciones, avancesObra: v } })} />
              </SettingRow>

              <SettingRow
                icon={<WarningOutlined style={{ fontSize: ICON_SIZE }} />}
                title={t("ajustes.desviaciones")}
                subtitle={t("ajustes.desviaciones_sub")}
              >
                <Switch checked={appSettings.notificaciones?.desviaciones} onChange={v => updateAppSettings({ notificaciones: { ...appSettings.notificaciones, desviaciones: v } })} />
              </SettingRow>
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card title={t("ajustes.estado_notificaciones")} style={sectionCard} size="small">
              <Space direction="vertical" style={{ width: '100%' }} size={16}>
                <Statistic title={t("ajustes.no_leidas")} value={notificacionesNoLeidas} prefix={<BellOutlined />} />
                <Button type="primary" onClick={marcarTodasLeidas} icon={<CheckCircleOutlined />}>
                  Marcar todas como leídas
                </Button>
              </Space>
            </Card>
          </Col>
        </Row>
      ),
    },
    {
      key: 'datos',
      label: <span><DatabaseOutlined /> {t('ajustes.datos_tab')}</span>,
      children: (
        <Row gutter={[24, 24]}>
          <Col xs={24} lg={12}>
            <Card style={sectionCard} size="small">
              <Space direction="vertical" style={{ width: '100%' }} size={16}>
                <Button icon={<DownloadOutlined />} block size="large" onClick={exportBackup}>
                  Exportar copia de seguridad
                </Button>
                <Button icon={<ImportOutlined />} block size="large" onClick={importBackup}>
                  Importar datos
                </Button>
                <Button icon={<DeleteOutlined />} danger block size="large" onClick={() => setResetModal(true)}>
                  Restablecer datos de fábrica
                </Button>
              </Space>
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card title={t("ajustes.almacenamiento")} style={sectionCard} size="small">
              <Statistic title={t("ajustes.datos_localstorage")} value="~2.4 MB" prefix={<DatabaseOutlined />} />
              <Divider />
              <Text type="secondary">{t("ajustes.datos_sincronizacion")}</Text>
            </Card>
          </Col>
        </Row>
      ),
    },
    {
      key: 'cuenta',
      label: <span><SafetyOutlined /> {t('ajustes.cuenta_tab')}</span>,
      children: (
        <Row gutter={[24, 24]}>
          <Col xs={24} lg={12}>
            <Card style={sectionCard} size="small">
              <Space align="center" style={{ marginBottom: 24 }}>
                <Avatar size={64} icon={<UserOutlined />} style={{ backgroundColor: token.colorPrimary }} />
                <div>
                  <Title level={5} style={{ margin: 0 }}>{user?.nombre || t('ajustes.usuario')}</Title>
                  <Text type="secondary">{user?.rol}</Text>
                </div>
              </Space>
              <Descriptions column={1} size="small">
                <Descriptions.Item label="Rol">
                  <Tag color="blue">{user?.rol}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="ID de Usuario">
                  <Text copyable style={{ fontSize: 12 }}>{user?.id}</Text>
                </Descriptions.Item>
              </Descriptions>
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card title={t("ajustes.seguridad")} style={sectionCard} size="small">
              <Space direction="vertical" style={{ width: '100%' }} size={16}>
                <Card title={t("ajustes.autenticacion_2fa")} size="small" type="inner">
                  <Space direction="vertical" style={{ width: '100%' }} size={12}>
                    <Text>{t("ajustes.protege_cuenta")}</Text>
                    <Button
                      type="primary"
                      icon={<SafetyOutlined />}
                      block
                      href="https://supabase.com/dashboard/project/_/auth/mfa"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Configurar 2FA en Supabase
                    </Button>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {t("ajustes.redirigido_supabase")}
                    </Text>
                  </Space>
                </Card>
                <Divider />
                <Button icon={<KeyOutlined />} block>{t("ajustes.cambiar_contrasena")}</Button>
                <Divider />
                <Alert
                  message={t("ajustes.sesion_segura")}
                  description={t("ajustes.sesion_segura_desc")}
                  type="success"
                  showIcon
                />
              </Space>
            </Card>
          </Col>
        </Row>
      ),
    },
    {
      key: 'acerca',
      label: <span><InfoCircleOutlined /> {t('ajustes.acerca_tab')}</span>,
      children: (
        <Card style={sectionCard}>
          <Space direction="vertical" style={{ width: '100%', textAlign: 'center' }} size={16}>
            <Avatar size={80} icon={<InfoCircleOutlined />} style={{ backgroundColor: token.colorPrimary }} />
            <Title level={3}>{t("ajustes.erp_nombre")}</Title>
            <Text type="secondary">Sistema Integral de Gestión para Proyectos de Construcción</Text>
            <Tag color="orange" style={{ fontSize: 14, padding: '4px 12px' }}>{t("ajustes.version_tag")}</Tag>
            <Divider />
            <Descriptions column={2} bordered size="small" style={{ maxWidth: 600, margin: '0 auto' }}>
              <Descriptions.Item label="Framework Frontend">React 18 + TypeScript</Descriptions.Item>
              <Descriptions.Item label="UI Principal">Shadcn UI + Ant Design</Descriptions.Item>
              <Descriptions.Item label="Backend">Supabase (PostgreSQL)</Descriptions.Item>
              <Descriptions.Item label="Visualización">recharts + D3.js</Descriptions.Item>
              <Descriptions.Item label="BIM">Three.js + web-ifc</Descriptions.Item>
              <Descriptions.Item label="Estilos">Tailwind CSS + antd tokens</Descriptions.Item>
              <Descriptions.Item label="Desarrollado por" span={2}>CONSTRUCTORA WM · © 2026</Descriptions.Item>
            </Descriptions>
            <Divider />
            <Text type="secondary" style={{ fontSize: 12 }}>
              {t("ajustes.edificando_futuro")}
            </Text>
          </Space>
        </Card>
      ),
    },
  ];

  const visualTab = (
    <Space style={{ paddingRight: 24, paddingBottom: 16 }} className="hidden sm:inline-flex">
      <Tag icon={<ExperimentOutlined />} color={appSettings.uiMode === 'antd' ? 'processing' : 'default'}>
        UI: {appSettings.uiMode === 'antd' ? 'Ant Design' : 'Shadcn'}
      </Tag>
      <Tag icon={appSettings.appTheme === 'dark' ? <MoonOutlined /> : <SunOutlined />}>
        {appSettings.appTheme === 'dark' ? 'Oscuro' : 'Claro'}
      </Tag>
      <Tag icon={<BgColorsOutlined />}>
        Sidebar: {appSettings.sidebarPosition === 'right' ? t('ajustes.sidebar_der') : appSettings.sidebarPosition === 'overlay' ? t('ajustes.overlay') : t('ajustes.sidebar_izq')}
      </Tag>
    </Space>
  );

  if (loading) {
    return (
      <Layout style={{ padding: 24, minHeight: '100%', background: 'transparent' }}>
        <Skeleton active paragraph={{ rows: 10 }} />
      </Layout>
    );
  }

  return (
    <Layout style={{ padding: 24, minHeight: '100%', background: 'transparent' }}>
      <div style={{ marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0, color: token.colorText, fontSize: 22, fontWeight: 700 }}>
          <SettingOutlined style={{ marginRight: 8, color: token.colorPrimary }} />
          {t('ajustes.titulo')}
        </Title>
        <Text type="secondary" style={{ color: token.colorTextSecondary, fontSize: 13 }}>
          {t("ajustes.subtitulo_desc")}
        </Text>
      </div>

      <Card
        style={{ ...sectionCard, borderRadius: token.borderRadiusLG, overflow: 'hidden', background: token.colorBgContainer }}
        styles={{ body: { padding: 0 } }}
      >
        <Tabs
          defaultActiveKey="apariencia"
          items={tabItems}
          size="large"
          tabBarStyle={{ paddingLeft: 24, paddingTop: 16, marginBottom: 0 }}
          tabBarExtraContent={visualTab}
          className="settings-tabs"
        />
      </Card>

      <Modal
        title={t('ajustes.restablecer_titulo', 'Restablecer datos de fábrica')}
        open={resetModal}
        onOk={() => {
          clearAllData();
          setResetModal(false);
        }}
        onCancel={() => setResetModal(false)}
        okText={t('ajustes.restablecer')}
        cancelText={t('common.cancelar')}
        okButtonProps={{ danger: true, style: { minHeight: 44 } }}
        style={{ width: '95vw', maxWidth: 520 }}
      >
        <Alert
          message={t('ajustes.restablecer_alerta_titulo', '¿Estás seguro?')}
          description={t('ajustes.restablecer_alerta_desc', 'Esta acción eliminará todos los datos locales y restaurará la configuración predeterminada. Los datos en la nube no se verán afectados.')}
          type="warning"
          showIcon
        />
      </Modal>
    </Layout>
  );
};

export default Ajustes;







