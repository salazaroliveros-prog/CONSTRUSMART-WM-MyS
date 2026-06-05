import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useErp, type UIMode, type AppThemeMode } from '../store';
import {
  Layout, Card, Row, Col, Switch, Select, InputNumber, Button, Divider,
  Typography, Space, Tabs, Tag, Avatar, Descriptions, Modal, message,
  Radio, Tooltip, Badge, Alert, Statistic, theme as antTheme,
} from 'antd';
import {
  SettingOutlined, GlobalOutlined, BellOutlined,
  SafetyOutlined, InfoCircleOutlined, DatabaseOutlined,
  MoonOutlined, SunOutlined, BgColorsOutlined,
  FontSizeOutlined, EyeOutlined, KeyOutlined,
  DownloadOutlined, UploadOutlined, DeleteOutlined,
  CheckCircleOutlined, ExperimentOutlined,
} from '@ant-design/icons';

const { Title, Text } = Typography;

const PRIMARY_COLORS = [
  { label: 'Naranja (Marca)', value: '#E8752F' },
  { label: 'Azul', value: '#1677FF' },
  { label: 'Verde', value: '#10b981' },
  { label: 'Púrpura', value: '#7c3aed' },
  { label: 'Rojo', value: '#ef4444' },
  { label: 'Teal', value: '#14b8a6' },
];

const Ajustes: React.FC = () => {
  const { t } = useTranslation();
  const { appSettings, updateAppSettings, user, proyectos, notificacionesNoLeidas, marcarTodasLeidas } = useErp();
  const [resetModal, setResetModal] = useState(false);
  const [aboutModal, setAboutModal] = useState(false);
  const { token } = antTheme.useToken();

  const colStyle: React.CSSProperties = {
    marginBottom: 16,
  };

  const sectionCard: React.CSSProperties = {
    borderRadius: token.borderRadiusLG,
    boxShadow: '0 1px 2px 0 rgba(0,0,0,0.03), 0 1px 6px -1px rgba(0,0,0,0.02), 0 2px 4px 0 rgba(0,0,0,0.02)',
  };

  const tabItems = [
    {
      key: 'apariencia',
      label: <span><BgColorsOutlined /> {t('ajustes.apariencia')}</span>,
      children: (
        <Row gutter={[24, 24]}>
          <Col xs={24} lg={12}>
            <Card title={t('ajustes.apariencia')} style={sectionCard} size="small">
              <div style={colStyle}>
                <Space align="center" style={{ width: '100%', justifyContent: 'space-between' }}>
                  <Space>
                    <ExperimentOutlined style={{ fontSize: 18, color: token.colorPrimary }} />
                    <div>
                      <Text strong>Framework UI</Text>
                      <br /><Text type="secondary">Elige el motor visual del sistema</Text>
                    </div>
                  </Space>
                  <Radio.Group
                    value={appSettings.uiMode}
                    onChange={e => updateAppSettings({ uiMode: e.target.value as UIMode })}
                    optionType="button"
                    buttonStyle="solid"
                    size="middle"
                  >
                    <Tooltip title="Estilo actual con Tailwind + Shadcn">
                      <Radio.Button value="shadcn">
                        <Space><span>🎨</span> Clásico</Space>
                      </Radio.Button>
                    </Tooltip>
                    <Tooltip title="Ant Design - Diseño moderno profesional">
                      <Radio.Button value="antd">
                        <Space><span>✨</span> Moderno</Space>
                      </Radio.Button>
                    </Tooltip>
                  </Radio.Group>
                </Space>
              </div>

              <Divider style={{ margin: '12px 0' }} />

              <div style={colStyle}>
                <Space align="center" style={{ width: '100%', justifyContent: 'space-between' }}>
                  <Space>
                    {appSettings.appTheme === 'dark' ? <MoonOutlined style={{ fontSize: 18 }} /> : <SunOutlined style={{ fontSize: 18 }} />}
                    <div>
                      <Text strong>Tema Visual</Text>
                      <br /><Text type="secondary">Claro, Oscuro o Alto Contraste</Text>
                    </div>
                  </Space>
                  <Radio.Group
                    value={appSettings.appTheme}
                    onChange={e => updateAppSettings({ appTheme: e.target.value as AppThemeMode })}
                    optionType="button"
                    buttonStyle="solid"
                  >
                    <Radio.Button value="light"><SunOutlined /> Claro</Radio.Button>
                    <Radio.Button value="dark"><MoonOutlined /> Oscuro</Radio.Button>
                    <Radio.Button value="high-contrast"><EyeOutlined /> Alto Contraste</Radio.Button>
                  </Radio.Group>
                </Space>
              </div>

              <Divider style={{ margin: '12px 0' }} />

              <div style={colStyle}>
                <Space align="center" style={{ width: '100%', justifyContent: 'space-between' }}>
                  <Space>
                    <BgColorsOutlined style={{ fontSize: 18, color: appSettings.primaryColor }} />
                    <div>
                      <Text strong>Color Principal</Text>
                      <br /><Text type="secondary">Personaliza el color primario de la marca</Text>
                    </div>
                  </Space>
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
                </Space>
              </div>

              <Divider style={{ margin: '12px 0' }} />

              <div style={colStyle}>
                <Space align="center" style={{ width: '100%', justifyContent: 'space-between' }}>
                  <Space>
                    <FontSizeOutlined style={{ fontSize: 18 }} />
                    <div>
                      <Text strong>Tamaño de Fuente</Text>
                      <br /><Text type="secondary">Ajusta el tamaño del texto en toda la app</Text>
                    </div>
                  </Space>
                  <Radio.Group
                    value={appSettings.fontSize}
                    onChange={e => updateAppSettings({ fontSize: e.target.value as 'small' | 'medium' | 'large' })}
                    optionType="button"
                    buttonStyle="solid"
                  >
                    <Radio.Button value="small">Pequeño</Radio.Button>
                    <Radio.Button value="medium">Mediano</Radio.Button>
                    <Radio.Button value="large">Grande</Radio.Button>
                  </Radio.Group>
                </Space>
              </div>

              <Divider style={{ margin: '12px 0' }} />

              <div style={colStyle}>
                <Space align="center" style={{ width: '100%', justifyContent: 'space-between' }}>
                  <Space>
                    <SettingOutlined style={{ fontSize: 18 }} />
                    <div>
                      <Text strong>Animaciones</Text>
                      <br /><Text type="secondary">Transiciones suaves entre pantallas</Text>
                    </div>
                  </Space>
                  <Switch
                    checked={appSettings.animationsEnabled}
                    onChange={v => updateAppSettings({ animationsEnabled: v })}
                  />
                </Space>
              </div>

              <div style={colStyle}>
                <Space align="center" style={{ width: '100%', justifyContent: 'space-between' }}>
                  <Space>
                    <SettingOutlined style={{ fontSize: 18 }} />
                    <div>
                      <Text strong>Modo Compacto</Text>
                      <br /><Text type="secondary">Reduce espaciado para mostrar más información</Text>
                    </div>
                  </Space>
                  <Switch
                    checked={appSettings.compactMode}
                    onChange={v => updateAppSettings({ compactMode: v })}
                  />
                </Space>
              </div>
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
                  <Badge status="success" text={appSettings.appTheme === 'dark' ? 'Modo Oscuro' : 'Modo Claro'} />
                </Space>
                <Select
                  defaultValue="lucy"
                  style={{ width: 200 }}
                  options={[
                    { value: 'lucy', label: 'Opción demo' },
                    { value: 'jack', label: 'Otra opción' },
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
      label: <span><GlobalOutlined /> Generales</span>,
      children: (
        <Row gutter={[24, 24]}>
          <Col xs={24} lg={12}>
            <Card title="Configuración Regional" style={sectionCard} size="small">
              <div style={colStyle}>
                <Space align="center" style={{ width: '100%', justifyContent: 'space-between' }}>
                  <div><Text strong>{t('ajustes.idioma')}</Text><br /><Text type="secondary">Idioma de la interfaz</Text></div>
                  <Select value={appSettings.language} onChange={v => updateAppSettings({ language: v })}
                    style={{ width: 160 }}
                    options={[
                      { value: 'es', label: '🇬🇹 Español' },
                      { value: 'en', label: '🇺🇸 English' },
                    ]}
                  />
                </Space>
              </div>
              <Divider style={{ margin: '12px 0' }} />
              <div style={colStyle}>
                <Space align="center" style={{ width: '100%', justifyContent: 'space-between' }}>
                  <div><Text strong>Formato de Fecha</Text><br /><Text type="secondary">Cómo se muestran las fechas</Text></div>
                  <Select value={appSettings.dateFormat} onChange={v => updateAppSettings({ dateFormat: v as any })}
                    style={{ width: 180 }}
                    options={[
                      { value: 'DD/MM/YYYY', label: '31/12/2026' },
                      { value: 'MM/DD/YYYY', label: '12/31/2026' },
                      { value: 'YYYY-MM-DD', label: '2026-12-31' },
                    ]}
                  />
                </Space>
              </div>
              <Divider style={{ margin: '12px 0' }} />
              <div style={colStyle}>
                <Space align="center" style={{ width: '100%', justifyContent: 'space-between' }}>
                  <div><Text strong>Moneda</Text><br /><Text type="secondary">Símbolo monetario del sistema</Text></div>
                  <Select value={appSettings.currency} onChange={v => updateAppSettings({ currency: v as 'GTQ' | 'USD' })}
                    style={{ width: 160 }}
                    options={[
                      { value: 'GTQ', label: 'Q (Quetzal GT)' },
                      { value: 'USD', label: '$ (Dólar US)' },
                    ]}
                  />
                </Space>
              </div>
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card title="Información del Sistema" style={sectionCard} size="small">
              <Descriptions column={1} size="small" bordered>
                <Descriptions.Item label="Proyectos Activos">{proyectos.filter(p => p.estado === 'ejecucion').length}</Descriptions.Item>
                <Descriptions.Item label="Total Proyectos">{proyectos.length}</Descriptions.Item>
                <Descriptions.Item label="Notificaciones Pendientes">
                  <Badge count={notificacionesNoLeidas} showZero>
                    <BellOutlined style={{ fontSize: 16 }} />
                  </Badge>
                </Descriptions.Item>
                <Descriptions.Item label="Framework UI Actual">
                  <Tag icon={<ExperimentOutlined />} color={appSettings.uiMode === 'antd' ? 'blue' : 'default'}>
                    {appSettings.uiMode === 'antd' ? 'Ant Design' : 'Shadcn UI'}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Tema">{appSettings.appTheme === 'dark' ? 'Oscuro' : appSettings.appTheme === 'high-contrast' ? 'Alto Contraste' : 'Claro'}</Descriptions.Item>
                <Descriptions.Item label="Versión">v2.0.0</Descriptions.Item>
              </Descriptions>
            </Card>
          </Col>
        </Row>
      ),
    },
    {
      key: 'notificaciones',
      label: <span><BellOutlined /> Notificaciones</span>,
      children: (
        <Row gutter={[24, 24]}>
          <Col xs={24} lg={12}>
            <Card title="Preferencias de Notificaciones" style={sectionCard} size="small">
              <div style={colStyle}>
                <Space align="center" style={{ width: '100%', justifyContent: 'space-between' }}>
                  <div><Text strong>Stock Crítico</Text><br /><Text type="secondary">Alertas cuando el inventario está bajo</Text></div>
                  <Switch defaultChecked />
                </Space>
              </div>
              <Divider style={{ margin: '12px 0' }} />
              <div style={colStyle}>
                <Space align="center" style={{ width: '100%', justifyContent: 'space-between' }}>
                  <div><Text strong>Órdenes de Cambio</Text><br /><Text type="secondary">Notificar OC pendientes de revisión</Text></div>
                  <Switch defaultChecked />
                </Space>
              </div>
              <Divider style={{ margin: '12px 0' }} />
              <div style={colStyle}>
                <Space align="center" style={{ width: '100%', justifyContent: 'space-between' }}>
                  <div><Text strong>Avances de Obra</Text><br /><Text type="secondary">Registro de avances físicos</Text></div>
                  <Switch defaultChecked />
                </Space>
              </div>
              <Divider style={{ margin: '12px 0' }} />
              <div style={colStyle}>
                <Space align="center" style={{ width: '100%', justifyContent: 'space-between' }}>
                  <div><Text strong>Desviaciones</Text><br /><Text type="secondary">Alertas de rendimiento y costo</Text></div>
                  <Switch defaultChecked />
                </Space>
              </div>
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card title="Estado de Notificaciones" style={sectionCard} size="small">
              <Space direction="vertical" style={{ width: '100%' }} size={16}>
                <Statistic title="No leídas" value={notificacionesNoLeidas} prefix={<BellOutlined />} />
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
      label: <span><DatabaseOutlined /> Datos</span>,
      children: (
        <Row gutter={[24, 24]}>
          <Col xs={24} lg={12}>
            <Card title="Gestión de Datos" style={sectionCard} size="small">
              <Space direction="vertical" style={{ width: '100%' }} size={16}>
                <Button icon={<DownloadOutlined />} block size="large">
                  Exportar copia de seguridad
                </Button>
                <Button icon={<UploadOutlined />} block size="large">
                  Importar datos
                </Button>
                <Button icon={<DeleteOutlined />} danger block size="large" onClick={() => setResetModal(true)}>
                  Restablecer datos de fábrica
                </Button>
              </Space>
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card title="Almacenamiento" style={sectionCard} size="small">
              <Statistic title="Datos en localStorage" value="~2.4 MB" prefix={<DatabaseOutlined />} />
              <Divider />
              <Text type="secondary">Los datos se almacenan localmente y se sincronizan con la nube cuando hay conexión.</Text>
            </Card>
          </Col>
        </Row>
      ),
    },
    {
      key: 'cuenta',
      label: <span><SafetyOutlined /> Cuenta</span>,
      children: (
        <Row gutter={[24, 24]}>
          <Col xs={24} lg={12}>
            <Card title="Perfil" style={sectionCard} size="small">
              <Space align="center" style={{ marginBottom: 24 }}>
                <Avatar size={64} icon={<SafetyOutlined />} style={{ backgroundColor: token.colorPrimary }} />
                <div>
                  <Title level={5} style={{ margin: 0 }}>{user?.nombre || 'Usuario'}</Title>
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
            <Card title="Seguridad" style={sectionCard} size="small">
              <Space direction="vertical" style={{ width: '100%' }} size={16}>
                <Button icon={<KeyOutlined />} block>Cambiar Contraseña</Button>
                <Divider />
                <Alert
                  message="Sesión Segura"
                  description="La autenticación se maneja mediante Supabase con políticas de RLS (Row Level Security)."
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
      label: <span><InfoCircleOutlined /> Acerca de</span>,
      children: (
        <Card style={sectionCard}>
          <Space direction="vertical" style={{ width: '100%', textAlign: 'center' }} size={16}>
            <Avatar size={80} icon={<SettingOutlined />} style={{ backgroundColor: token.colorPrimary }} />
            <Title level={3}>ERP CONSTRUSMART</Title>
            <Text type="secondary">Sistema Integral de Gestión para Proyectos de Construcción</Text>
            <Tag color="orange" style={{ fontSize: 14, padding: '4px 12px' }}>Versión 2.0.0</Tag>
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
              "Edificando el Futuro" — Todos los derechos reservados
            </Text>
          </Space>
        </Card>
      ),
    },
  ];

  return (
    <Layout style={{ padding: 24, minHeight: '100%', background: 'transparent' }}>
      <div style={{ marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0 }}>
          <SettingOutlined style={{ marginRight: 8, color: token.colorPrimary }} />
          {t('ajustes.titulo')}
        </Title>
        <Text type="secondary">Personaliza la apariencia, idioma, notificaciones y configuración general del ERP</Text>
      </div>

      <Card
        style={{ ...sectionCard, borderRadius: token.borderRadiusLG, overflow: 'hidden' }}
        bodyStyle={{ padding: 0 }}
      >
        <Tabs
          defaultActiveKey="apariencia"
          items={tabItems}
          size="large"
          tabBarStyle={{ paddingLeft: 24, paddingTop: 16, marginBottom: 0 }}
          tabBarExtraContent={
            <Space style={{ paddingRight: 24, paddingBottom: 16 }}>
              <Tag icon={<ExperimentOutlined />} color={appSettings.uiMode === 'antd' ? 'processing' : 'default'}>
                UI: {appSettings.uiMode === 'antd' ? 'Ant Design' : 'Shadcn'}
              </Tag>
              <Tag icon={appSettings.appTheme === 'dark' ? <MoonOutlined /> : <SunOutlined />}>
                {appSettings.appTheme === 'dark' ? 'Oscuro' : 'Claro'}
              </Tag>
            </Space>
          }
        />
      </Card>

      <Modal
        title="Restablecer datos de fábrica"
        open={resetModal}
        onOk={() => {
          message.success('Configuración restablecida');
          setResetModal(false);
        }}
        onCancel={() => setResetModal(false)}
        okText="Restablecer"
        cancelText="Cancelar"
        okButtonProps={{ danger: true }}
      >
        <Alert
          message="¿Estás seguro?"
          description="Esta acción eliminará todos los datos locales y restaurará la configuración predeterminada. Los datos en la nube no se verán afectados."
          type="warning"
          showIcon
        />
      </Modal>
    </Layout>
  );
};

export default Ajustes;
