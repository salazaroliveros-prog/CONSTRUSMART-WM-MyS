import React, { useState, useMemo } from 'react';
import { useErp } from '../../store';
import { fmtQ, todayISO } from '../../utils';
import {
  Row, Col, Card, Statistic, Tag, Badge, Dropdown, Button,
  Modal, Form, Input, InputNumber, Space, Typography, Progress,
  Skeleton, theme, Divider,
} from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined,
  RocketOutlined, DollarOutlined, RiseOutlined,
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
  const { token } = theme.useToken();

  React.useEffect(() => {
    const t = setTimeout(() => setLoading(false), 300);
    return () => clearTimeout(t);
  }, []);

  React.useEffect(() => {
    if (licitaciones.length > 0) return;
    const demoData = [
      { titulo: 'Edificio Comercial Plaza Norte', cliente: 'Inmobiliaria del Valle', descripcion: 'Construcción de edificio de 5 niveles', monto: 2500000, estado: 'identificado' as const, fechaCreacion: '2026-01-02', probabilidad: 30, notas: 'Cliente potencial' },
      { titulo: 'Residencial Los Pinos - Fase 2', cliente: 'Constructora Maya', descripcion: '20 casas unifamiliares', monto: 1800000, estado: 'en_estudio' as const, fechaCreacion: '2025-12-15', probabilidad: 60, notas: 'Presupuesto en elaboración' },
      { titulo: 'Centro Comercial San Cristóbal', cliente: 'Grupo Inmobiliario GT', descripcion: 'Remodelación y ampliación', monto: 950000, estado: 'presentado' as const, fechaCreacion: '2025-11-20', probabilidad: 75, notas: 'Propuesta entregada' },
      { titulo: 'Puente Vehicular Ruta 5', cliente: 'Municipalidad de Guatemala', descripcion: 'Construcción de puente de 40m', monto: 3200000, estado: 'ganado' as const, fechaCreacion: '2025-10-01', probabilidad: 100, notas: 'Contrato firmado' },
      { titulo: 'Oficinas Corporativas Torre Sur', cliente: 'Empresas ABC', descripcion: 'Remodelación de 3 pisos', monto: 750000, estado: 'perdido' as const, fechaCreacion: '2025-09-15', probabilidad: 0, notas: 'Cliente eligió otra' },
    ];
    demoData.forEach(d => addLicitacion(d));
  }, [addLicitacion, licitaciones.length]);

  const columns = useMemo(() => ESTADOS.map(est => ({
    ...est,
    items: licitaciones.filter(l => l.estado === est.key)
      .sort((a, b) => new Date(b.fechaCreacion).getTime() - new Date(a.fechaCreacion).getTime()),
  })), [licitaciones]);

  const totalMonto = licitaciones.reduce((a, l) => a + l.monto, 0);
  const ganadas = licitaciones.filter(l => l.estado === 'ganado');
  const tasaConversion = licitaciones.filter(l => l.estado === 'ganado' || l.estado === 'perdido').length > 0
    ? Math.round((ganadas.length / licitaciones.filter(l => l.estado === 'ganado' || l.estado === 'perdido').length) * 100) : 0;
  const pipelineActivo = licitaciones.filter(l => l.estado !== 'ganado' && l.estado !== 'perdido')
    .reduce((a, l) => a + l.monto * (l.probabilidad / 100), 0);

  const openCreate = () => { setEditingId(null); form.resetFields(); setShowForm(true); };
  const openEdit = (l: any) => { setEditingId(l.id); form.setFieldsValue(l); setShowForm(true); };

  const handleOk = async () => {
    const values = await form.validateFields();
    if (editingId) {
      updateLicitacion(editingId, { ...values, fechaLimite: values.fechaLimite || undefined, notas: values.notas || undefined });
    } else {
      addLicitacion({ ...values, estado: 'identificado', fechaCreacion: todayISO(), notas: values.notas || undefined, fechaLimite: values.fechaLimite || undefined });
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
            <RocketOutlined style={{ marginRight: 8, color: '#7c3aed' }} />
            CRM / Licitaciones
          </Title>
          <Text type="secondary">Pipeline comercial y seguimiento de oportunidades</Text>
        </Col>
        <Col>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}
            style={{ background: '#7c3aed', borderColor: '#7c3aed' }}>
            Nueva Licitación
          </Button>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={12} lg={6}><Card size="small">
          <Statistic title="Total Oportunidades" value={licitaciones.length}
            prefix={<RocketOutlined style={{ color: '#7c3aed' }} />}
            suffix={<Text type="secondary" style={{ fontSize: 12 }}>{ganadas.length} ganadas · {licitaciones.filter(l => l.estado === 'perdido').length} perdidas</Text>} />
        </Card></Col>
        <Col xs={12} lg={6}><Card size="small">
          <Statistic title="Monto Total Pipeline" value={totalMonto} prefix="Q" precision={0}
            valueStyle={{ color: '#10b981' }} />
        </Card></Col>
        <Col xs={12} lg={6}><Card size="small">
          <Statistic title="Pipeline Ponderado" value={pipelineActivo} prefix="Q" precision={0}
            valueStyle={{ color: '#3b82f6' }}
            suffix={<Text type="secondary" style={{ fontSize: 11 }}>basado en %</Text>} />
        </Card></Col>
        <Col xs={12} lg={6}><Card size="small">
          <Statistic title="Tasa de Conversión" value={tasaConversion} suffix="%"
            valueStyle={{ color: '#f59e0b' }} prefix={<PieChartOutlined />} />
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
                  <div style={{ textAlign: 'center', padding: 32, color: '#94a3b8' }}>
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
                      <EditOutlined key="edit" onClick={() => openEdit(l)} style={{ color: '#64748b' }} />,
                      <DeleteOutlined key="delete" onClick={() => deleteLicitacion(l.id)} style={{ color: '#ef4444' }} />,
                    ]}
                  >
                    <Text strong style={{ fontSize: 13 }}>{l.titulo}</Text>
                    <Text type="secondary" style={{ display: 'block', fontSize: 11 }}>{l.cliente}</Text>
                    <Row justify="space-between" align="middle" style={{ marginTop: 4 }}>
                      <Text strong style={{ fontSize: 13 }}>{fmtQ(l.monto)}</Text>
                      <Tag color={l.probabilidad >= 70 ? 'success' : l.probabilidad >= 40 ? 'gold' : 'default'}>
                        {l.probabilidad}%
                      </Tag>
                    </Row>
                    <Progress percent={l.probabilidad} size="small"
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
          <Form.Item name="titulo" label="Título" rules={[{ required: true }]}>
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
            <Form.Item name="probabilidad" label="Probabilidad (%)" initialValue={50} style={{ width: '100%' }}>
              <InputNumber min={0} max={100} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="fechaLimite" label="Fecha Límite" style={{ width: '100%' }}>
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
