import React, { useState, useMemo } from 'react';
import { useErp } from '../../store';
import { fmtQ, todayISO } from '../../utils';
import {
  Row, Col, Card, Statistic, Tag, Badge, Dropdown, Button,
  Modal, Form, Input, InputNumber, Space, Typography, Progress,
  Skeleton, theme,
} from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined,
  RocketOutlined,
  PieChartOutlined, MoreOutlined,
} from '@ant-design/icons';

const { Title, Text } = Typography;

const ESTADOS = [
  { key: 'identificado', label: 'Identificado', color: 'default' },
  { key: 'en_estudio', label: 'En Estudio', color: 'blue' },
  { key: 'presentado', label: 'Presentado', color: 'gold' },
  { key: 'ganado', label: 'Ganado', color: 'success' },
  { key: 'perdido', label: 'Perdido', color: 'error' },
];

const COLUMN_COLORS: Record<string, string> = {
  identificado: '#94a3b8', en_estudio: '#3b82f6',
  presentado: '#f59e0b', ganado: '#10b981', perdido: '#ef4444',
};

const AntCRM: React.FC = () => {
  const { licitaciones, addLicitacion, updateLicitacion, deleteLicitacion } = useErp();
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form] = Form.useForm();
  const { token: _token } = theme.useToken();

  React.useEffect(() => {
    const t = setTimeout(() => setLoading(false), 300);
    return () => clearTimeout(t);
  }, []);

  React.useEffect(() => {
    if (licitaciones.length > 0) return;
    const demoData = [
      { nombre: 'Edificio Comercial Plaza Norte', cliente: 'Inmobiliaria del Valle', monto: 2500000, estado: 'activa' as const, fechaLimite: '2026-03-15', documentos: [], notas: 'Cliente potencial' },
      { nombre: 'Residencial Los Pinos - Fase 2', cliente: 'Constructora Maya', monto: 1800000, estado: 'activa' as const, fechaLimite: '2026-02-20', documentos: [], notas: 'Presupuesto en elaboración' },
      { nombre: 'Centro Comercial San Cristóbal', cliente: 'Grupo Inmobiliario GT', monto: 950000, estado: 'activa' as const, fechaLimite: '2026-01-30', documentos: [], notas: 'Propuesta entregada' },
      { nombre: 'Puente Vehicular Ruta 5', cliente: 'Municipalidad de Guatemala', monto: 3200000, estado: 'ganada' as const, fechaLimite: '2025-12-01', documentos: [], notas: 'Contrato firmado' },
      { nombre: 'Oficinas Corporativas Torre Sur', cliente: 'Empresas ABC', monto: 750000, estado: 'perdida' as const, fechaLimite: '2025-11-15', documentos: [], notas: 'Cliente eligió otra' },
    ];
    demoData.forEach(d => addLicitacion(d));
  }, [addLicitacion, licitaciones.length]);

  const columns = useMemo(() => ESTADOS.map(est => ({
    ...est,
    items: licitaciones.filter(l => l.estado === est.key as any)
      .sort((a, b) => new Date(b.fechaLimite).getTime() - new Date(a.fechaLimite).getTime()),
  })), [licitaciones]);

  const totalMonto = licitaciones.reduce((a, l) => a + l.monto, 0);
  const ganadas = licitaciones.filter(l => l.estado === 'ganada');
  const tasaConversion = licitaciones.filter(l => l.estado === 'ganada' || l.estado === 'perdida').length > 0
    ? Math.round((ganadas.length / licitaciones.filter(l => l.estado === 'ganada' || l.estado === 'perdida').length) * 100) : 0;
  const pipelineActivo = licitaciones.filter(l => l.estado !== 'ganada' && l.estado !== 'perdida')
    .reduce((a, l) => a + l.monto * 0.5, 0);

  const openCreate = () => { setEditingId(null); form.resetFields(); setShowForm(true); };
  const openEdit = (l: any) => { setEditingId(l.id); form.setFieldsValue(l); setShowForm(true); };

  const handleOk = async () => {
    const values = await form.validateFields();
    if (editingId) {
      updateLicitacion(editingId, { ...values, documentos: values.documentos || [] });
    } else {
      addLicitacion({ ...values, estado: 'activa', documentos: values.documentos || [] });
    }
    setShowForm(false);
    setEditingId(null);
  };

  const moveLicitacion = (id: string, nuevoEstado: string) => {
    updateLicitacion(id, { estado: nuevoEstado as any });
  };

  if (loading) {
    return (
      <div style={{ padding: 8 }}>
        <Skeleton active paragraph={{ rows: 1 }} />
        <Row gutter={16}><Col span={6}><Card><Skeleton active /></Card></Col></Row>
      </div>
    );
  }

  return (
    <div style={{ padding: 8 }}>
      <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
        <Col>
          <Title level={4} style={{ margin: 0 }}>
            <RocketOutlined style={{ marginRight: 8, color: 'hsl(var(--primary))' }} />
            CRM / Licitaciones
          </Title>
          <Text type="secondary">Pipeline comercial y seguimiento de oportunidades</Text>
        </Col>
        <Col>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}
            style={{ background: 'hsl(var(--primary))', borderColor: 'hsl(var(--primary))' }}>
            Nueva Licitación
          </Button>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={12} lg={6}><Card size="small">
          <Statistic title="Total Oportunidades" value={licitaciones.length}
            prefix={<RocketOutlined style={{ color: 'hsl(var(--primary))' }} />}
            suffix={<Text type="secondary" style={{ fontSize: 12 }}>{ganadas.length} ganadas · {licitaciones.filter(l => l.estado === 'perdido').length} perdidas</Text>} />
        </Card></Col>
        <Col xs={12} lg={6}><Card size="small">
          <Statistic title="Monto Total Pipeline" value={totalMonto} prefix="Q" precision={0}
            valueStyle={{ color: 'hsl(var(--success))' }} />
        </Card></Col>
        <Col xs={12} lg={6}><Card size="small">
          <Statistic title="Pipeline Ponderado" value={pipelineActivo} prefix="Q" precision={0}
            valueStyle={{ color: 'hsl(var(--info))' }}
            suffix={<Text type="secondary" style={{ fontSize: 11 }}>basado en %</Text>} />
        </Card></Col>
        <Col xs={12} lg={6}><Card size="small">
          <Statistic title="Tasa de Conversión" value={tasaConversion} suffix="%"
            valueStyle={{ color: 'hsl(var(--warning))' }} prefix={<PieChartOutlined />} />
        </Card></Col>
      </Row>

      <div style={{ overflowX: 'auto', paddingBottom: 8 }}>
        <Row gutter={[12, 12]} style={{ flexWrap: 'nowrap', minWidth: 900 }}>
          {columns.map(col => (
            <Col key={col.key} style={{ minWidth: 260, maxWidth: 300 }}>
              <Card
                title={
                  <Row justify="space-between" align="middle">
                    <Space>
                      <Badge color={COLUMN_COLORS[col.key]} />
                      <Text strong>{col.label}</Text>
                    </Space>
                    <Tag>{col.items.length}</Tag>
                  </Row>
                }
                size="small"
                styles={{
                  header: {
                    background: col.key === 'identificado' ? '#f8fafc' :
                      col.key === 'en_estudio' ? '#eff6ff' :
                      col.key === 'presentado' ? '#fffbeb' :
                      col.key === 'ganado' ? '#ecfdf5' : '#fef2f5',
                    borderBottom: `2px solid ${COLUMN_COLORS[col.key]}`,
                  },
                  body: {
                    minHeight: 400,
                    background: col.key === 'identificado' ? '#f8fafc' :
                      col.key === 'en_estudio' ? '#f0f7ff' :
                      col.key === 'presentado' ? '#fff7ed' :
                      col.key === 'ganado' ? '#f0fdf4' : '#fef2f2',
                  },
                }}
              >
                {col.items.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: 32, color: 'hsl(var(--muted-foreground))' }}>
                    <Text type="secondary">Sin oportunidades</Text>
                  </div>
                ) : col.items.map(l => (
                  <Card
                    key={l.id}
                    size="small"
                    style={{ marginBottom: 8 }}
                    hoverable
                    actions={[
                      <Dropdown key="move" menu={{
                        items: ESTADOS.filter(e => e.key !== l.estado).map(e => ({
                          key: e.key, label: `→ ${e.label}`,
                          onClick: () => moveLicitacion(l.id, e.key),
                        })),
                      }} trigger={['click']}>
                        <Button type="link" size="small" icon={<MoreOutlined />}>Mover</Button>
                      </Dropdown>,
                      <EditOutlined key="edit" onClick={() => openEdit(l)} style={{ color: 'hsl(var(--muted-foreground))' }} />,
                      <DeleteOutlined key="delete" onClick={() => deleteLicitacion(l.id)} style={{ color: 'hsl(var(--destructive))' }} />,
                    ]}
                  >
                    <Text strong style={{ fontSize: 13 }}>{l.nombre}</Text>
                    <Text type="secondary" style={{ display: 'block', fontSize: 11 }}>{l.cliente}</Text>
                    <Row justify="space-between" align="middle" style={{ marginTop: 4 }}>
                      <Text strong style={{ fontSize: 13 }}>{fmtQ(l.monto)}</Text>
                      <Tag color="default">
                        {l.estado}
                      </Tag>
                    </Row>
                    <Progress percent={50} size="small"
                      strokeColor={COLUMN_COLORS[col.key]} showInfo={false} />
                    {l.notas && <Text type="secondary" style={{ fontSize: 10, display: 'block', marginTop: 4, fontStyle: 'italic' }}>{l.notas}</Text>}
                  </Card>
                ))}
              </Card>
            </Col>
          ))}
        </Row>
      </div>

      <Modal
        title={editingId ? 'Editar Oportunidad' : 'Nueva Licitación'}
        open={showForm}
        onOk={handleOk}
        onCancel={() => { setShowForm(false); setEditingId(null); }}
        okText={editingId ? 'Guardar' : 'Crear'}
        width={560}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="nombre" label="Nombre" rules={[{ required: true }]}>
            <Input placeholder="Ej. Edificio Comercial" />
          </Form.Item>
          <Space style={{ width: '100%' }}>
            <Form.Item name="cliente" label="Cliente" rules={[{ required: true }]} style={{ width: '100%' }}>
              <Input placeholder="Nombre del cliente" />
            </Form.Item>
            <Form.Item name="monto" label="Monto (Q)" style={{ width: '100%' }}>
              <InputNumber style={{ width: '100%' }} min={0} />
            </Form.Item>
          </Space>
          <Form.Item name="descripcion" label="Descripción">
            <Input.TextArea rows={2} placeholder="Detalles de la oportunidad..." />
          </Form.Item>
          <Space style={{ width: '100%' }}>
            <Form.Item name="fechaLimite" label="Fecha Límite" rules={[{ required: true }]} style={{ width: '100%' }}>
              <Input type="date" />
            </Form.Item>
          </Space>
          <Form.Item name="notas" label="Notas">
            <Input.TextArea rows={2} placeholder="Notas internas..." />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default AntCRM;
