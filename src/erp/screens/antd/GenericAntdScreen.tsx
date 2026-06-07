import React from 'react';
import { useErp } from '../../store';

import { fmtQ } from '../../utils';
import {
  Row, Col, Card, Table, Tag, Button, Modal, Form, Input, InputNumber,
  Select, Space, Typography, Statistic, Progress, Badge, Tabs, Timeline,
  Divider, Tooltip, Alert, Empty, Steps, Descriptions,
  theme, List,
} from 'antd';
import {
  TeamOutlined, ShoppingCartOutlined, SafetyOutlined, FolderOpenOutlined,
  FileTextOutlined, TruckOutlined, FieldTimeOutlined, DollarOutlined,
  SettingOutlined, FileProtectOutlined, PercentageOutlined,
  AlertOutlined, FlagOutlined, CreditCardOutlined, ReconciliationOutlined,
  UnorderedListOutlined, ThunderboltOutlined, RiseOutlined,
  CheckCircleOutlined,
  DeleteOutlined, EditOutlined, PlusOutlined,
  DownloadOutlined, EyeOutlined, SendOutlined,
  PlayCircleOutlined, BarChartOutlined, LineChartOutlined,
  ProjectOutlined, DatabaseOutlined, MessageOutlined, SwapOutlined,
  BellOutlined,
} from '@ant-design/icons';

const { Title, Text } = Typography;

const ColDef = (title: string, dataIndex: string, render?: any, width?: number, sorter?: any) => ({ title, dataIndex, key: dataIndex, render, width, sorter });

const PageHeader: React.FC<{ icon: React.ReactNode; title: string; subtitle?: string; extra?: React.ReactNode }> =
  ({ icon, title, subtitle, extra }) => (
    <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
      <Col>
        <Title level={4} style={{ margin: 0 }}>{icon} {title}</Title>
        {subtitle && <Text type="secondary">{subtitle}</Text>}
      </Col>
      {extra && <Col>{extra}</Col>}
    </Row>
  );

const KpiCard: React.FC<{ title: string; value: any; prefix?: string; suffix?: string; color?: string; precision?: number; icon?: React.ReactNode }> =
  ({ title, value, prefix, suffix, color, precision, icon }) => (
    <Card size="small" hoverable>
      <Statistic title={title} value={value} prefix={icon || prefix} suffix={suffix} precision={precision}
        valueStyle={color ? { color } : undefined} />
    </Card>
  );

// ─── View Router ───
const GenericAntdScreen: React.FC<{ view: string }> = ({ view }) => {
  const { token } = theme.useToken();
  const store = useErp();
  const sp = 16;

  // All hooks must be unconditional — used by specific cases below
  const [rrhhShow, setRrhhShow] = React.useState(false);
  const [rrhhEditId, setRrhhEditId] = React.useState<string | null>(null);
  const [rrhhForm] = Form.useForm();
  const [bodegaTab, setBodegaTab] = React.useState('stock');
  const [notifFilter, setNotifFilter] = React.useState<string>('todas');
  const [entradaShow, setEntradaShow] = React.useState(false);
  const [entradaSelOC, setEntradaSelOC] = React.useState<any>(null);

  switch (view) {

    // ── 1. SEGUIMIENTO ──
    case 'seguimiento': {
      const { proyectos, bitacora, presupuestos } = store;
      return (
        <div style={{ padding: 8 }}>
          <PageHeader icon={<RiseOutlined style={{ color: token.colorPrimary }} />} title="Seguimiento de Obra" subtitle="EVM, Gantt y bitácora" />
          <Row gutter={[sp, sp]} style={{ marginBottom: 16 }}>
            <Col xs={12} md={8} lg={6}><KpiCard title="Proyectos" value={proyectos.length} icon={<ProjectOutlined />} color={token.colorPrimary} /></Col>
            <Col xs={12} md={8} lg={6}><KpiCard title="Avance Físico Prom." value={proyectos.length ? +(proyectos.reduce((a, p) => a + p.avanceFisico, 0) / proyectos.length).toFixed(1) : 0} suffix="%" color="hsl(var(--info))" /></Col>
            <Col xs={12} md={8} lg={6}><KpiCard title="Bitácoras" value={bitacora.length} icon={<FileTextOutlined />} /></Col>
            <Col xs={12} md={8} lg={6}><KpiCard title="Presupuestos" value={presupuestos.length} icon={<FileProtectOutlined />} /></Col>
          </Row>
          <Row gutter={[sp, sp]}>
            <Col xs={24} md={12} lg={12}>
              <Card title="Avance por Proyecto" size="small">
                {proyectos.slice(0, 8).map(p => (
                  <div key={p.id} style={{ marginBottom: 12 }}>
                    <Row justify="space-between"><Text style={{ fontSize: 12 }}>{p.nombre}</Text><Text strong style={{ fontSize: 12 }}>{p.avanceFisico}%</Text></Row>
                    <Progress percent={p.avanceFisico} size="small" strokeColor={p.avanceFisico > 70 ? 'hsl(var(--success))' : p.avanceFisico > 40 ? token.colorPrimary : 'hsl(var(--destructive))'} />
                  </div>
                ))}
              </Card>
            </Col>
            <Col xs={24} md={12} lg={12}>
              <Card title="Bitácora Reciente" size="small">
                <Timeline items={bitacora.slice(0, 6).map(b => ({
                  color: b.clima === 'lluvia' ? 'blue' : 'green',
                  children: <><Text strong style={{ fontSize: 12 }}>{b.fecha}</Text><br /><Text style={{ fontSize: 11 }}>{b.tareasRealizadas?.slice(0, 60)}</Text></>,
                }))} />
              </Card>
            </Col>
          </Row>
        </div>
      );
    }

    // ── 2. RRHH ──
    case 'rrhh': {
      const { empleados, addEmpleado, updateEmpleado, deleteEmpleado } = store;
      const totalPlanilla = empleados.reduce((s, e) => s + (e.salarioDiario || 0), 0);
      return (
        <div style={{ padding: 8 }}>
          <PageHeader icon={<TeamOutlined style={{ color: token.colorPrimary }} />} title="RRHH" subtitle={`${empleados.length} empleados`}
            extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => { setRrhhEditId(null); rrhhForm.resetFields(); setRrhhShow(true); }}>Nuevo Empleado</Button>} />
          <Row gutter={[sp, sp]} style={{ marginBottom: 16 }}>
            <Col xs={12} md={8}><KpiCard title="Total Empleados" value={empleados.length} icon={<TeamOutlined />} color={token.colorPrimary} /></Col>
            <Col xs={12} md={8}><KpiCard title="Planilla Diaria" value={totalPlanilla} prefix="Q" color="hsl(var(--success))" /></Col>
            <Col xs={12} md={8}><KpiCard title="Promedio Salario" value={empleados.length ? totalPlanilla / empleados.length : 0} prefix="Q" /></Col>
          </Row>
          <Table dataSource={empleados} rowKey="id" size="small" pagination={{ pageSize: 10 }}
            columns={[
              ColDef('Nombre', 'nombre', (t: string) => <Text strong>{t}</Text>),
              ColDef('Puesto', 'puesto', (t: string) => <Tag>{t || '—'}</Tag>),
              ColDef('Salario Diario', 'salarioDiario', (v: number) => <Text strong>Q{v?.toFixed(2)}</Text>),
              ColDef('Tipo', 'tipo', (t: string) => <Tag color={t === 'planilla' ? 'blue' : 'orange'}>{t}</Tag>),
              ColDef('Días Trab.', 'diasTrabajados'),
              ColDef('Acción', 'id', (_id: string, r: any) => <Space>
                <Button size="small" icon={<EditOutlined />} onClick={() => { setRrhhEditId(r.id); rrhhForm.setFieldsValue(r); setRrhhShow(true); }} />
                <Button size="small" danger icon={<DeleteOutlined />} onClick={() => deleteEmpleado(r.id)} />
              </Space>),
            ]} />
          <Modal title={rrhhEditId ? 'Editar Empleado' : 'Nuevo Empleado'} open={rrhhShow} onOk={async () => { const v = await rrhhForm.validateFields(); if (rrhhEditId) { updateEmpleado(rrhhEditId, v); } else { addEmpleado(v); } setRrhhShow(false); setRrhhEditId(null); }} onCancel={() => { setRrhhShow(false); setRrhhEditId(null); }}>
            <Form form={rrhhForm} layout="vertical">
              <Form.Item name="nombre" label="Nombre" rules={[{ required: true }]}><Input /></Form.Item>
              <Form.Item name="puesto" label="Puesto"><Input /></Form.Item>
              <Space style={{ width: '100%' }}>
                <Form.Item name="salarioDiario" label="Salario Diario Q"><InputNumber style={{ width: '100%' }} /></Form.Item>
                <Form.Item name="diasTrabajados" label="Días Trabajados"><InputNumber style={{ width: '100%' }} /></Form.Item>
              </Space>
              <Form.Item name="tipo" label="Tipo" initialValue="planilla">
                <Select options={[{ value: 'planilla', label: 'Planilla' }, { value: 'destajo', label: 'Destajo' }]} />
              </Form.Item>
            </Form>
          </Modal>
        </div>
      );
    }

    // ── 3. BODEGA ──
    case 'bodega': {
      const { materiales, ordenes, proveedores, deleteProveedor } = store;
      const bodegaItems = [
        { key: 'stock', label: 'Inventario' }, { key: 'proveedores', label: 'Proveedores' }, { key: 'oc', label: 'Órdenes' },
      ];
      return (
        <div style={{ padding: 8 }}>
          <PageHeader icon={<ShoppingCartOutlined style={{ color: token.colorPrimary }} />} title="Bodega" subtitle="Inventario, proveedores y OC" />
          <Row gutter={[sp, sp]} style={{ marginBottom: 16 }}>
            <Col xs={12} md={8}><KpiCard title="Materiales" value={materiales.length} icon={<ShoppingCartOutlined />} /></Col>
            <Col xs={12} md={8}><KpiCard title="Stock Crítico" value={materiales.filter(m => m.stock <= m.stockMinimo).length} color="hsl(var(--destructive))" /></Col>
            <Col xs={12} md={8}><KpiCard title="Proveedores" value={proveedores.length} icon={<TeamOutlined />} /></Col>
          </Row>
          <Tabs activeKey={bodegaTab} onChange={setBodegaTab} items={bodegaItems} />
          {bodegaTab === 'stock' && (
            <Table dataSource={materiales} rowKey="id" size="small" pagination={{ pageSize: 10 }}
              columns={[
                ColDef('Material', 'nombre', (t: string) => <Text strong>{t}</Text>),
                ColDef('Stock', 'stock', (v: number, r: any) => <Badge count={v} color={v <= r.stockMinimo ? 'red' : v <= r.stockMinimo * 2 ? 'orange' : 'green'} />),
                ColDef('Mínimo', 'stockMinimo'),
                ColDef('Precio', 'precio', (v: number) => <Text>Q{v?.toFixed(2)}</Text>),
                ColDef('Unidad', 'unidad', (t: string) => <Tag>{t}</Tag>),
              ]} />
          )}
          {bodegaTab === 'proveedores' && (
            <Table dataSource={proveedores} rowKey="id" size="small" pagination={{ pageSize: 10 }}
              columns={[
                ColDef('Nombre', 'nombre', (t: string) => <Text strong>{t}</Text>),
                ColDef('Contacto', 'contacto'),
                ColDef('Rubro', 'rubro', (t: string) => <Tag>{t}</Tag>),
                ColDef('Calificación', 'calificacion', (v: number) => <Progress type="circle" percent={v * 20} size={24} />),
                ColDef('Acción', 'id', (_: string, r: any) => <Button size="small" danger icon={<DeleteOutlined />} onClick={() => deleteProveedor(r.id)} />),
              ]} />
          )}
          {bodegaTab === 'oc' && (
            <Table dataSource={ordenes} rowKey="id" size="small" pagination={{ pageSize: 10 }}
              columns={[
                ColDef('Material', 'material', (t: string) => <Text strong>{t}</Text>),
                ColDef('Proveedor', 'proveedor'),
                ColDef('Cantidad', 'cantidad'),
                ColDef('Monto', 'monto', (v: number) => <Text strong>Q{v?.toFixed(2)}</Text>),
                ColDef('Estado', 'estado', (e: string) => <Tag color={e === 'aprobado' ? 'green' : e === 'pendiente' ? 'gold' : 'red'}>{e}</Tag>),
              ]} />
          )}
        </div>
      );
    }

    // ── 4. PRESUPUESTOS (simplified antd) ──
    case 'presupuestos': {
      const { presupuestos, proyectos } = store;
      const pColumns = [
        ColDef('Proyecto', 'proyectoId', (id: string) => proyectos.find(p => p.id === id)?.nombre || id),
        ColDef('Estado', 'estado', (e: string) => <Tag color={e === 'aprobado' ? 'green' : e === 'borrador' ? 'default' : 'red'}>{e}</Tag>),
        ColDef('Total', 'totalCalculado', (v: number) => <Text strong>{fmtQ(v || 0)}</Text>, undefined, (a: any, b: any) => a.totalCalculado - b.totalCalculado),
        ColDef('Versión', 'versionPresupuesto'),
        ColDef('Creado', 'fechaCreacion', (f: string) => f?.slice(0, 10)),
      ];
      return (
        <div style={{ padding: 8 }}>
          <PageHeader icon={<FileProtectOutlined style={{ color: token.colorPrimary }} />} title="Presupuestos" subtitle="APU Engine" />
          <Row gutter={[sp, sp]} style={{ marginBottom: 16 }}>
            <Col xs={12} md={8}><KpiCard title="Presupuestos" value={presupuestos.length} /></Col>
            <Col xs={12} md={8}><KpiCard title="Aprobados" value={presupuestos.filter(p => p.estado === 'aprobado').length} color="hsl(var(--success))" /></Col>
            <Col xs={12} md={8}><KpiCard title="Total Calculado" value={presupuestos.reduce((s, p) => s + (p.totalCalculado || 0), 0)} prefix="Q" /></Col>
          </Row>
          <Table dataSource={presupuestos} rowKey="id" size="small" columns={pColumns} pagination={{ pageSize: 10 }} />
        </div>
      );
    }

    // ── 5. APU Avanzado ──
    case 'apu': {
      return (
        <div style={{ padding: 8 }}>
          <PageHeader icon={<BarChartOutlined style={{ color: token.colorPrimary }} />} title="APU Avanzado" subtitle="Análisis de precios unitarios" />
          <Row gutter={[sp, sp]}>
            <Col xs={24} md={12} lg={12}>
              <Card title="Factores de Sobrecosto" size="small">
                <Descriptions column={2} size="small" bordered>
                  <Descriptions.Item label="Costos Indirectos">12%</Descriptions.Item>
                  <Descriptions.Item label="Administración">8%</Descriptions.Item>
                  <Descriptions.Item label="Imprevistos">3%</Descriptions.Item>
                  <Descriptions.Item label="Utilidad">10%</Descriptions.Item>
                </Descriptions>
              </Card>
            </Col>
            <Col xs={24} md={12} lg={12}>
              <Card title="Resumen" size="small">
                <Progress type="dashboard" percent={75} strokeColor={token.colorPrimary} />
                <Text type="secondary" style={{ display: 'block', textAlign: 'center', marginTop: 8 }}>Eficiencia general</Text>
              </Card>
            </Col>
          </Row>
        </div>
      );
    }

    // ── 6. Curvas S ──
    case 'curvas': {
      const { proyectos } = store;
      return (
        <div style={{ padding: 8 }}>
          <PageHeader icon={<LineChartOutlined style={{ color: token.colorPrimary }} />} title="Curvas S" subtitle="Programado vs Real" />
          <Row gutter={[sp, sp]} style={{ marginBottom: 16 }}>
            {proyectos.slice(0, 4).map((p, _i) => (
              <Col xs={12} md={8} lg={6} key={p.id}>
                <Card size="small" title={<Text style={{ fontSize: 12 }}>{p.nombre}</Text>}>
                  <div style={{ height: 100, display: 'flex', alignItems: 'flex-end', gap: 2 }}>
                    {[20, 35, 50, 65, 78, 88].map((v, j) => (
                      <Tooltip key={j} title={`Programado: ${v}%`}>
                        <div style={{ flex: 1, background: '#3b82f6', height: `${v * 1.2}px`, borderRadius: '2px 2px 0 0', minHeight: 4 }} />
                      </Tooltip>
                    ))}
                  </div>
                  <Progress percent={p.avanceFisico} size="small" strokeColor={token.colorPrimary} />
                </Card>
              </Col>
            ))}
          </Row>
        </div>
      );
    }

    // ── 7. Rendimientos ──
    case 'rendimientos': {
      return (
        <div style={{ padding: 8 }}>
          <PageHeader icon={<RiseOutlined style={{ color: token.colorPrimary }} />} title="Rendimientos" subtitle="Rendimiento de mano de obra" />
          <Card size="small">
            <Alert message="Captura de rendimientos diarios" description="Registra el rendimiento de cada actividad y compáralo con el estándar." type="info" showIcon />
            <Divider />
            <Row gutter={[sp, sp]}>
              <Col xs={24} sm={12} lg={6}>
                <Card size="small" hoverable><Statistic title="Actividad" value="Colocación de Block" /><Progress percent={85} size="small" strokeColor="hsl(var(--success))" /></Card>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Card size="small" hoverable><Statistic title="Actividad" value="Encofrado" /><Progress percent={62} size="small" strokeColor={token.colorPrimary} /></Card>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Card size="small" hoverable><Statistic title="Actividad" value="Acero Estructural" /><Progress percent={78} size="small" strokeColor="hsl(var(--info))" /></Card>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Card size="small" hoverable><Statistic title="Actividad" value="Acabados" /><Progress percent={45} size="small" strokeColor="hsl(var(--warning))" /></Card>
              </Col>
            </Row>
          </Card>
        </div>
      );
    }

    // ── 8. Base Precios ──
    case 'baseprecios': {
      return (
        <div style={{ padding: 8 }}>
          <PageHeader icon={<DatabaseOutlined style={{ color: token.colorPrimary }} />} title="Base de Precios" subtitle="Catálogo de referencia" />
          <Card size="small">
            <Input.Search placeholder="Buscar insumo..." style={{ marginBottom: 16 }} />
            <Table dataSource={[]} rowKey="id" size="small" columns={[
              ColDef('Código', 'codigo', (t: string) => <Text code>{t}</Text>),
              ColDef('Insumo', 'nombre', (t: string) => <Text strong>{t}</Text>),
              ColDef('Unidad', 'unidad'),
              ColDef('Precio Ref.', 'precioReferencia', (v: number) => <Text strong>Q{v?.toFixed(2)}</Text>),
              ColDef('Rubro', 'rubro', (t: string) => <Tag>{t}</Tag>),
            ]} locale={{ emptyText: <Empty description="Carga datos en APU → Insumos" /> }} />
          </Card>
        </div>
      );
    }

    // ── 9. Reportes Técnicos ──
    case 'reportes': {
      const { proyectos, movimientos, presupuestos } = store;
      return (
        <div style={{ padding: 8 }}>
          <PageHeader icon={<FileTextOutlined style={{ color: token.colorPrimary }} />} title="Reportes Técnicos" subtitle="Generación de informes" />
          <Row gutter={[sp, sp]}>
            <Col xs={24} md={12} lg={8}>
              <Card hoverable size="small"><Statistic title="Proyectos" value={proyectos.length} prefix={<ProjectOutlined />} /></Card>
            </Col>
            <Col xs={24} md={12} lg={8}>
              <Card hoverable size="small"><Statistic title="Movimientos" value={movimientos.length} prefix={<DollarOutlined />} /></Card>
            </Col>
            <Col xs={24} md={12} lg={8}>
              <Card hoverable size="small"><Statistic title="Presupuestos" value={presupuestos.length} prefix={<FileProtectOutlined />} /></Card>
            </Col>
          </Row>
        </div>
      );
    }

    // ── 10. Muro Obra ──
    case 'muro': {
      return (
        <div style={{ padding: 8 }}>
          <PageHeader icon={<MessageOutlined style={{ color: token.colorPrimary }} />} title="Muro de Obra" subtitle="Red social de construcción" />
          <Row gutter={[sp, sp]}>
            <Col xs={24} md={12} lg={16}>
              <Card size="small"><List dataSource={[]} locale={{ emptyText: <Empty description="Sin publicaciones aún" /> }} renderItem={() => null} /></Card>
            </Col>
            <Col xs={24} md={12} lg={8}>
              <Card title="Filtros" size="small">
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Tag color="blue">Avance</Tag>
                  <Tag color="green">Calidad</Tag>
                  <Tag color="orange">Seguridad</Tag>
                  <Tag color="default">General</Tag>
                </Space>
              </Card>
            </Col>
          </Row>
        </div>
      );
    }

    // ── 11. Órdenes Cambio ──
    case 'ordenes-cambio': {
      return (
        <div style={{ padding: 8 }}>
          <PageHeader icon={<SwapOutlined style={{ color: token.colorPrimary }} />} title="Órdenes de Cambio" subtitle="Flujo de aprobación" />
          <Steps current={1} style={{ marginBottom: 24 }} items={[
            { title: 'Solicitud', key: '1', icon: <SendOutlined /> },
            { title: 'Revisión', key: '2', icon: <EyeOutlined /> },
            { title: 'Aprobado', key: '3', icon: <CheckCircleOutlined /> },
            { title: 'Ejecutado', key: '4', icon: <PlayCircleOutlined /> },
          ]} />
          <Table dataSource={[]} rowKey="id" size="small" locale={{ emptyText: <Empty description="Sin órdenes de cambio" /> }}
            columns={[ColDef('Título', 'titulo', (t: string) => <Text strong>{t}</Text>),
              ColDef('Estado', 'estado', (e: string) => <Tag>{e}</Tag>),
              ColDef('Impacto Q', 'impactoCosto', (v: number) => <Text>Q{v}</Text>),
              ColDef('Solicitante', 'solicitante')]} />
        </div>
      );
    }

    // ── 12. Notificaciones ──
    case 'notificaciones': {
      const { notificaciones, markNotificacionLeida, marcarTodasLeidas } = store;
      const filtered = notifFilter === 'todas' ? notificaciones : notificaciones.filter(n => n.tipo === notifFilter);
      const tipos = ['todas', 'stock_critico', 'orden_cambio_pendiente', 'desviacion_rendimiento', 'avance_registrado', 'checklist_rechazado'];
      return (
        <div style={{ padding: 8 }}>
          <PageHeader icon={<BellOutlined style={{ color: token.colorPrimary }} />} title="Notificaciones"
            extra={<Button size="small" onClick={marcarTodasLeidas}>Marcar todas leídas</Button>} />
          <Row gutter={[sp, sp]}>
            <Col xs={24} md={12} lg={6}>
              <Card size="small" title="Filtros">
                <Space direction="vertical">
                  {tipos.map(t => <Button key={t} type={notifFilter === t ? 'primary' : 'text'} size="small" onClick={() => setNotifFilter(t)}>{t === 'todas' ? 'Todas' : t}</Button>)}
                </Space>
              </Card>
            </Col>
            <Col xs={24} md={18} lg={18}>
              <List dataSource={filtered} renderItem={n => (
                <Card size="small" style={{ marginBottom: 8, opacity: n.leido ? 0.5 : 1 }}
                  onClick={() => markNotificacionLeida(n.id)} hoverable>
                  <Text strong>{n.titulo}</Text><br /><Text type="secondary">{n.mensaje}</Text>
                </Card>
              )} locale={{ emptyText: <Empty description="Sin notificaciones" /> }} />
            </Col>
          </Row>
        </div>
      );
    }

    // ── 13. SSO & Calidad ──
    case 'sso-calidad': {
      const { incidentes, pruebas, noConformidades, liberaciones } = store;
      const diasSinAccidentes = incidentes.length > 0
        ? Math.floor((Date.now() - new Date(incidentes.sort((a: any, b: any) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())[0].fecha).getTime()) / 86400000)
        : 999;
      const checklistsOk = liberaciones.filter((l: any) => l.checklistAprobado === true).length;
      const pruebasRealizadas = pruebas.length;
      const ncAbiertas = noConformidades.filter((nc: any) => nc.estado !== 'cerrado').length;
      const tabs = [
        { key: 'incidentes', label: 'Incidentes' }, { key: 'checklist', label: 'Checklists' },
        { key: 'estadisticas', label: 'Estadísticas' }, { key: 'pruebas', label: 'Pruebas Lab' },
        { key: 'nc', label: 'No Conformidades' },
      ];
      return (
        <div style={{ padding: 8 }}>
          <PageHeader icon={<SafetyOutlined style={{ color: token.colorPrimary }} />} title="SSO & Calidad" subtitle="Seguridad y control de calidad" />
          <Row gutter={[sp, sp]} style={{ marginBottom: 16 }}>
            <Col xs={12} md={8} lg={6}><KpiCard title="Días sin Accidentes" value={diasSinAccidentes} suffix="días" color="hsl(var(--success))" /></Col>
            <Col xs={12} md={8} lg={6}><KpiCard title="Checklists OK" value={checklistsOk} color="hsl(var(--info))" /></Col>
            <Col xs={12} md={8} lg={6}><KpiCard title="Pruebas Realizadas" value={pruebasRealizadas} /></Col>
            <Col xs={12} md={8} lg={6}><KpiCard title="NC Abiertas" value={ncAbiertas} color="hsl(var(--destructive))" /></Col>
          </Row>
          <Tabs items={tabs} />
        </div>
      );
    }

    // ── 14. Gestión Documental ──
    case 'documentos': {
      const tabs = [
        { key: 'planos', label: 'Planos' }, { key: 'rfis', label: 'RFI' }, { key: 'submittals', label: 'Submittals' },
      ];
      return (
        <div style={{ padding: 8 }}>
          <PageHeader icon={<FolderOpenOutlined style={{ color: token.colorPrimary }} />} title="Gestión Documental" subtitle="Planos, RFI, Submittals" />
          <Tabs items={tabs} />
          <Table dataSource={[]} rowKey="id" size="small" locale={{ emptyText: <Empty description="Sin documentos registrados" /> }}
            columns={[ColDef('Código', 'codigo', (t: string) => <Text code>{t}</Text>),
              ColDef('Nombre', 'nombre', (t: string) => <Text strong>{t}</Text>),
              ColDef('Versión', 'version', (v: number) => <Tag>v{v}</Tag>),
              ColDef('Estado', 'estado', (e: string) => <Tag>{e}</Tag>)]} />
        </div>
      );
    }

    // ── 15. Exportación Inteligente ──
    case 'exportacion': {
      const { proyectos, movimientos, materiales } = store;
      return (
        <div style={{ padding: 8 }}>
          <PageHeader icon={<DownloadOutlined style={{ color: token.colorPrimary }} />} title="Exportación Inteligente" subtitle="Exporta datos en JSON, CSV, PDF" />
          <Row gutter={[sp, sp]}>
            <Col xs={24} md={12} lg={8}><Card size="small" hoverable><Statistic title="Proyectos" value={proyectos.length} prefix={<ProjectOutlined />} /></Card></Col>
            <Col xs={24} md={12} lg={8}><Card size="small" hoverable><Statistic title="Movimientos" value={movimientos.length} prefix={<DollarOutlined />} /></Card></Col>
            <Col xs={24} md={12} lg={8}><Card size="small" hoverable><Statistic title="Materiales" value={materiales.length} prefix={<ShoppingCartOutlined />} /></Card></Col>
          </Row>
          <Card size="small" style={{ marginTop: 16 }}>
            <Space>
              <Button icon={<DownloadOutlined />} type="primary">Exportar JSON</Button>
              <Button icon={<DownloadOutlined />}>Exportar CSV</Button>
              <Button icon={<FileTextOutlined />}>Exportar PDF</Button>
            </Space>
          </Card>
        </div>
      );
    }

    // ── 16. Logística/Compras ──
    case 'logistica': {
      const logTabs = [{ key: 'activos', label: 'Activos' }, { key: 'cuadros', label: 'Cuadros Comparativos' }, { key: 'pagos', label: 'Pagos' }];
      return (
        <div style={{ padding: 8 }}>
          <PageHeader icon={<TruckOutlined style={{ color: token.colorPrimary }} />} title="Logística y Compras" subtitle="Activos, cotizaciones, pagos" />
          <Row gutter={[sp, sp]} style={{ marginBottom: 16 }}>
            <Col xs={12} md={8}><KpiCard title="Activos" value={0} /></Col>
            <Col xs={12} md={8}><KpiCard title="Pagos Vencidos" value={0} color="hsl(var(--destructive))" /></Col>
            <Col xs={12} md={8}><KpiCard title="Pagos Próximos" value={0} color="hsl(var(--warning))" /></Col>
          </Row>
          <Tabs items={logTabs} />
        </div>
      );
    }

    // ── 17. Rendimiento Campo ──
    case 'rendimiento-campo': {
      const rcTabs = [{ key: 'destajos', label: 'Destajos' }, { key: 'capturas', label: 'Capturas' }, { key: 'plantillas', label: 'Plantillas' }];
      return (
        <div style={{ padding: 8 }}>
          <PageHeader icon={<FieldTimeOutlined style={{ color: token.colorPrimary }} />} title="Rendimiento de Campo" subtitle="Destajos, capturas, plantillas" />
          <Tabs items={rcTabs} />
        </div>
      );
    }

    // ── 18. Comercial/Finanzas ──
    case 'comercial-fin': {
      const cfTabs = [{ key: 'ventas', label: 'Ventas' }, { key: 'anticipos', label: 'Anticipos' }, { key: 'cajas', label: 'Cajas Chicas' }];
      return (
        <div style={{ padding: 8 }}>
          <PageHeader icon={<DollarOutlined style={{ color: token.colorPrimary }} />} title="Comercial / Finanzas" subtitle="Ventas, anticipos, cajas chicas" />
          <Row gutter={[sp, sp]} style={{ marginBottom: 16 }}>
            <Col xs={12} md={8} lg={6}><KpiCard title="Ventas" value={0} icon={<DollarOutlined />} /></Col>
            <Col xs={12} md={8} lg={6}><KpiCard title="Anticipos" value={0} /></Col>
            <Col xs={12} md={8} lg={6}><KpiCard title="Cajas Chicas" value={0} /></Col>
            <Col xs={12} md={8} lg={6}><KpiCard title="Total Cajas" value={0} prefix="Q" /></Col>
          </Row>
          <Tabs items={cfTabs} />
        </div>
      );
    }

    // ── 19. Administración ──
    case 'admin-sistema': {
      const asTabs = [{ key: 'centros', label: 'Centros Costo' }, { key: 'logs', label: 'Bitácora' }];
      return (
        <div style={{ padding: 8 }}>
          <PageHeader icon={<SettingOutlined style={{ color: token.colorPrimary }} />} title="Administración del Sistema" subtitle="Centros de costo y auditoría" />
          <Row gutter={[sp, sp]} style={{ marginBottom: 16 }}>
            <Col xs={12} md={8} lg={6}><KpiCard title="Centros Costo" value={0} /></Col>
            <Col xs={12} md={8} lg={6}><KpiCard title="Total Presupuestado" value={0} prefix="Q" /></Col>
          </Row>
          <Tabs items={asTabs} />
        </div>
      );
    }

    // ── 20. Planilla Destajos ──
    case 'planilla-destajos': {
      return (
        <div style={{ padding: 8 }}>
          <PageHeader icon={<FileProtectOutlined style={{ color: token.colorPrimary }} />} title="Planilla de Destajos" subtitle="Pago por obra ejecutada" />
          <Card size="small">
            <Alert message="Planilla de destajos" description="Gestiona el pago por tarea completada para empleados a destajo." type="info" showIcon />
            <Divider />
            <Space>
              <Select placeholder="Seleccionar proyecto" style={{ width: 250 }} />
              <Button type="primary" icon={<FileTextOutlined />}>Generar Planilla</Button>
            </Space>
          </Card>
        </div>
      );
    }

    // ── 21. Impuestos ──
    case 'impuestos': {
      const { movimientos } = store;
      const ingresos = movimientos.filter(m => m.tipo === 'ingreso').reduce((a, b) => a + b.costoTotal, 0);
      const gastos = movimientos.filter(m => m.tipo === 'gasto').reduce((a, b) => a + b.costoTotal, 0);
      const utilidad = ingresos - gastos;
      const isr = utilidad > 0 ? utilidad * 0.25 : 0;
      const iva = (ingresos + gastos) * 0.12;
      return (
        <div style={{ padding: 8 }}>
          <PageHeader icon={<PercentageOutlined style={{ color: token.colorPrimary }} />} title="Impuestos" subtitle="ISR 25% · IVA 12%" />
          <Row gutter={[sp, sp]} style={{ marginBottom: 16 }}>
            <Col xs={12} md={8} lg={6}><KpiCard title="Ingresos" value={ingresos} prefix="Q" color="hsl(var(--success))" /></Col>
            <Col xs={12} md={8} lg={6}><KpiCard title="Gastos" value={gastos} prefix="Q" color="hsl(var(--destructive))" /></Col>
            <Col xs={12} md={8} lg={6}><KpiCard title="Utilidad" value={utilidad} prefix="Q" color={utilidad > 0 ? 'hsl(var(--success))' : 'hsl(var(--destructive))'} /></Col>
            <Col xs={12} md={8} lg={6}><KpiCard title="ISR Estimado" value={isr} prefix="Q" color="hsl(var(--warning))" /></Col>
          </Row>
          <Card size="small">
            <Descriptions column={3} bordered size="small">
              <Descriptions.Item label="Ingresos Brutos"><Text strong>{fmtQ(ingresos)}</Text></Descriptions.Item>
              <Descriptions.Item label="Egresos">{fmtQ(gastos)}</Descriptions.Item>
              <Descriptions.Item label="Utilidad antes ISR"><Text strong style={{ color: utilidad > 0 ? 'hsl(var(--success))' : 'hsl(var(--destructive))' }}>{fmtQ(utilidad)}</Text></Descriptions.Item>
              <Descriptions.Item label="ISR (25%)">{fmtQ(isr)}</Descriptions.Item>
              <Descriptions.Item label="IVA (12%)">{fmtQ(iva)}</Descriptions.Item>
              <Descriptions.Item label="Total Impuestos"><Text strong>{fmtQ(isr + iva)}</Text></Descriptions.Item>
            </Descriptions>
          </Card>
        </div>
      );
    }

    // ── 22. Riesgos ──
    case 'riesgos': {
      const { riesgos } = store;
      const riesgosAltos = riesgos.filter((r: any) => r.nivel === 'critico' || r.nivel === 'alto').length;
      const riesgosMedios = riesgos.filter((r: any) => r.nivel === 'medio').length;
      const riesgosBajos = riesgos.filter((r: any) => r.nivel === 'bajo').length;
      return (
        <div style={{ padding: 8 }}>
          <PageHeader icon={<AlertOutlined style={{ color: token.colorPrimary }} />} title="Gestión de Riesgos" subtitle="Matriz de probabilidad e impacto" />
          <Row gutter={[sp, sp]} style={{ marginBottom: 16 }}>
            <Col xs={12} md={8} lg={6}><KpiCard title="Riesgos Altos" value={riesgosAltos} color="hsl(var(--destructive))" /></Col>
            <Col xs={12} md={8} lg={6}><KpiCard title="Riesgos Medios" value={riesgosMedios} color="hsl(var(--warning))" /></Col>
            <Col xs={12} md={8} lg={6}><KpiCard title="Riesgos Bajos" value={riesgosBajos} color="hsl(var(--success))" /></Col>
            <Col xs={12} md={8} lg={6}><KpiCard title="Total" value={riesgos.length} /></Col>
          </Row>
          <Table dataSource={[]} rowKey="id" size="small" locale={{ emptyText: <Empty description="Registra riesgos desde el módulo" /> }}
            columns={[ColDef('Riesgo', 'nombre', (t: string) => <Text strong>{t}</Text>),
              ColDef('Tipo', 'tipo', (t: string) => <Tag>{t}</Tag>),
              ColDef('Probabilidad', 'probabilidad'),
              ColDef('Impacto', 'impacto'),
              ColDef('Nivel', 'nivel', (n: string) => <Tag color={n === 'critico' ? 'red' : n === 'alto' ? 'orange' : n === 'medio' ? 'gold' : 'green'}>{n}</Tag>)]} />
        </div>
      );
    }

    // ── 23. Hitos ──
    case 'hitos': {
      return (
        <div style={{ padding: 8 }}>
          <PageHeader icon={<FlagOutlined style={{ color: token.colorPrimary }} />} title="Hitos" subtitle="Hitos y entregables del proyecto" />
          <Table dataSource={[]} rowKey="id" size="small" locale={{ emptyText: <Empty description="No hay hitos registrados" /> }}
            columns={[ColDef('Hito', 'nombre', (t: string) => <Text strong>{t}</Text>),
              ColDef('Fecha', 'fecha'),
              ColDef('Tipo', 'tipo', (t: string) => <Tag color={t === 'hito' ? 'blue' : 'green'}>{t}</Tag>),
              ColDef('Estado', 'estado', (e: string) => <Badge status={e === 'completado' ? 'success' : e === 'atrasado' ? 'error' : 'processing'} text={e} />)]} />
        </div>
      );
    }

    // ── 24. CxC ──
    case 'cuentas-cobrar': {
      const { movimientos } = store;
      const ingresos = movimientos.filter((m: any) => m.tipo === 'ingreso');
      const totalCxC = ingresos.reduce((s: number, m: any) => s + (m.monto || 0), 0);
      return (
        <div style={{ padding: 8 }}>
          <PageHeader icon={<CreditCardOutlined style={{ color: token.colorPrimary }} />} title="Cuentas por Cobrar" subtitle="Gestión de cuentas pendientes" />
          <Row gutter={[sp, sp]} style={{ marginBottom: 16 }}>
            <Col xs={12} md={8}><KpiCard title="Pendientes" value={ingresos.length} color="hsl(var(--destructive))" /></Col>
            <Col xs={12} md={8}><KpiCard title="Cobradas" value={0} color="hsl(var(--success))" /></Col>
            <Col xs={12} md={8}><KpiCard title="Total" value={totalCxC} prefix="Q" /></Col>
          </Row>
          <Table dataSource={[]} rowKey="id" size="small" locale={{ emptyText: <Empty description="Sin cuentas por cobrar" /> }}
            columns={[ColDef('Cliente', 'cliente', (t: string) => <Text strong>{t}</Text>),
              ColDef('Concepto', 'concepto'),
              ColDef('Monto', 'monto', (v: number) => <Text strong>{fmtQ(v || 0)}</Text>),
              ColDef('Vencimiento', 'fechaVencimiento'),
              ColDef('Estado', 'estado', (e: string) => <Tag color={e === 'pendiente' ? 'red' : 'green'}>{e}</Tag>)]} />
        </div>
      );
    }

    // ── 25. CxP ──
    case 'cuentas-pagar': {
      const { movimientos } = store;
      const egresos = movimientos.filter((m: any) => m.tipo === 'gasto' || m.tipo === 'egreso');
      const totalCxP = egresos.reduce((s: number, m: any) => s + (m.monto || 0), 0);
      return (
        <div style={{ padding: 8 }}>
          <PageHeader icon={<ReconciliationOutlined style={{ color: token.colorPrimary }} />} title="Cuentas por Pagar" subtitle="Gestión de obligaciones" />
          <Row gutter={[sp, sp]} style={{ marginBottom: 16 }}>
            <Col xs={12} md={8}><KpiCard title="Pendientes" value={egresos.length} color="hsl(var(--destructive))" /></Col>
            <Col xs={12} md={8}><KpiCard title="Pagadas" value={0} color="hsl(var(--success))" /></Col>
            <Col xs={12} md={8}><KpiCard title="Total" value={totalCxP} prefix="Q" /></Col>
          </Row>
          <Table dataSource={[]} rowKey="id" size="small" locale={{ emptyText: <Empty description="Sin cuentas por pagar" /> }}
            columns={[ColDef('Proveedor', 'proveedor', (t: string) => <Text strong>{t}</Text>),
              ColDef('Concepto', 'concepto'),
              ColDef('Monto', 'monto', (v: number) => <Text strong>{fmtQ(v || 0)}</Text>),
              ColDef('Vencimiento', 'fechaVencimiento'),
              ColDef('Estado', 'estado', (e: string) => <Tag color={e === 'pendiente' ? 'red' : 'green'}>{e}</Tag>)]} />
        </div>
      );
    }

    // ── 26. Entradas Almacén OC ──
    case 'entradas-almacen': {
      const { ordenes, materiales, updateMaterial } = store;
      return (
        <div style={{ padding: 8 }}>
          <PageHeader icon={<UnorderedListOutlined style={{ color: token.colorPrimary }} />} title="Entradas Almacén por OC" subtitle="Recepción de materiales" />
          <Table dataSource={ordenes} rowKey="id" size="small" pagination={{ pageSize: 10 }}
            columns={[
              ColDef('Material', 'material', (t: string) => <Text strong>{t}</Text>),
              ColDef('Proveedor', 'proveedor'),
              ColDef('Cantidad', 'cantidad'),
              ColDef('Monto', 'monto', (v: number) => <Text>Q{v?.toFixed(2)}</Text>),
              ColDef('Estado', 'estado', (e: string) => <Tag color={e === 'aprobado' ? 'green' : e === 'pendiente' ? 'gold' : 'red'}>{e}</Tag>),
              ColDef('Acción', 'id', (_id: string, r: any) => (
                <Button size="small" type="primary" disabled={r.estado !== 'aprobado'}
                  onClick={() => { setEntradaSelOC(r); setEntradaShow(true); }}>
                  Recibir
                </Button>
              )),
            ]} />
          <Modal title="Recibir Material" open={entradaShow} onOk={() => { if (entradaSelOC) { updateMaterial(entradaSelOC.materialId || '', { stock: (materiales.find(m => m.id === entradaSelOC.materialId)?.stock || 0) + (entradaSelOC.cantidad || 0) }); } setEntradaShow(false); }} onCancel={() => setEntradaShow(false)}>
            {entradaSelOC && <Descriptions column={1} size="small" bordered>
              <Descriptions.Item label="Material">{entradaSelOC.material}</Descriptions.Item>
              <Descriptions.Item label="Cantidad a recibir">{entradaSelOC.cantidad}</Descriptions.Item>
              <Descriptions.Item label="Proveedor">{entradaSelOC.proveedor}</Descriptions.Item>
            </Descriptions>}
          </Modal>
        </div>
      );
    }

    // ── 27. Dashboard Predictivo ──
    case 'predictivo': {
      const { movimientos, presupuestos } = store;
      const totalPresupuesto = presupuestos.reduce((s, p) => s + (p.totalCalculado || 0), 0);
      const totalGastos = movimientos.filter(m => m.tipo === 'gasto').reduce((a, b) => a + b.costoTotal, 0);
      const eac = totalPresupuesto > 0 ? (totalGastos / Math.max(totalPresupuesto * 0.01, 1)) * 100 : 0;
      return (
        <div style={{ padding: 8 }}>
          <PageHeader icon={<ThunderboltOutlined style={{ color: token.colorPrimary }} />} title="Dashboard Predictivo" subtitle="EVM, EAC, pronósticos" />
          <Row gutter={[sp, sp]} style={{ marginBottom: 16 }}>
            <Col xs={12} md={8} lg={6}><KpiCard title="BAC" value={totalPresupuesto} prefix="Q" color="hsl(var(--info))" /></Col>
            <Col xs={12} md={8} lg={6}><KpiCard title="EAC" value={eac} prefix="Q" color={eac > totalPresupuesto ? 'hsl(var(--destructive))' : 'hsl(var(--success))'} /></Col>
            <Col xs={12} md={8} lg={6}><KpiCard title="CPI" value={totalGastos > 0 ? +(totalPresupuesto / totalGastos).toFixed(2) : 1} color="hsl(var(--warning))" /></Col>
            <Col xs={12} md={8} lg={6}><KpiCard title="Sobrecosto" value={Math.max(0, totalGastos - totalPresupuesto)} prefix="Q" color="hsl(var(--destructive))" /></Col>
          </Row>
          <div style={{ textAlign: 'center', padding: 40 }}>
            <Progress type="dashboard" percent={Math.min(100, (totalGastos / Math.max(totalPresupuesto, 1)) * 100)} strokeColor={token.colorPrimary} size={200} />
            <Text type="secondary" style={{ display: 'block', marginTop: 8 }}>% Presupuesto Ejecutado</Text>
          </div>
        </div>
      );
    }

    default:
      return null;
  }
};

export default GenericAntdScreen;
