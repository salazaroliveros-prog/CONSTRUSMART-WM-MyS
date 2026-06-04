import React from 'react';
import { useErp } from '../../store';
import { fmtQ, fmtPct, TIPOLOGIA_LABEL, todayISO } from '../../utils';
import {
  Row, Col, Card, Progress, Tag, Select, Button, Modal, Form,
  Input, InputNumber, Space, Typography, Avatar, Tooltip, Badge,
  Empty, Statistic, Divider, theme,
} from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined, BuildOutlined,
  EnvironmentOutlined, UserOutlined,
} from '@ant-design/icons';

const { Title, Text } = Typography;

const ESTADOS = ['planeacion', 'ejecucion', 'pausado', 'finalizado'] as const;
const estadoLabel: Record<string, string> = {
  planeacion: 'Planeación', ejecucion: 'Ejecución',
  pausado: 'Pausado', finalizado: 'Finalizado',
};

const AntProyectos: React.FC = () => {
  const { proyectos, addProyecto, updateProyecto, deleteProyecto, presupuestos, setView, setSelectedProyectoId } = useErp();
  const [show, setShow] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [form] = Form.useForm();
  const { token } = theme.useToken();

  const estadoColor = (p: { avanceFisico: number; avanceFinanciero: number; estado: string }) => {
    const dev = p.avanceFinanciero - p.avanceFisico;
    if (p.estado === 'planeacion') return '#94a3b8';
    if (p.estado === 'finalizado') return '#10b981';
    if (p.estado === 'pausado') return '#f59e0b';
    if (dev > 8) return '#ef4444';
    if (dev > 3) return '#fbbf24';
    return '#10b981';
  };

  const openCreate = () => {
    setEditingId(null);
    form.resetFields();
    setShow(true);
  };

  const openEdit = (p: any) => {
    setEditingId(p.id);
    form.setFieldsValue(p);
    setShow(true);
  };

  const handleOk = async () => {
    const values = await form.validateFields();
    if (editingId) {
      await updateProyecto(editingId, {
        nombre: values.nombre, cliente: values.cliente, ubicacion: values.ubicacion,
        tipologia: values.tipologia, presupuestoTotal: values.presupuestoTotal,
        montoContrato: values.montoContrato, estado: values.estado || 'planeacion',
      });
    } else {
      await addProyecto({
        nombre: values.nombre, cliente: values.cliente, ubicacion: values.ubicacion,
        tipologia: values.tipologia, estado: 'planeacion',
        presupuestoTotal: values.presupuestoTotal || 0, montoContrato: values.montoContrato || 0,
        avanceFisico: 0, avanceFinanciero: 0,
        fechaInicio: todayISO(), fechaFin: todayISO(),
      });
    }
    setShow(false);
    setEditingId(null);
  };

  return (
    <div style={{ padding: 8 }}>
      <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
        <Col>
          <Title level={4} style={{ margin: 0 }}>
            <BuildOutlined style={{ marginRight: 8, color: token.colorPrimary }} />
            Portafolio de Proyectos
          </Title>
          <Text type="secondary">{proyectos.length} proyectos registrados</Text>
        </Col>
        <Col>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            Nuevo Proyecto
          </Button>
        </Col>
      </Row>

      <Card size="small" style={{ marginBottom: 16, background: '#0f172a', border: 'none', borderRadius: 16, overflow: 'hidden' }}>
        <div style={{ position: 'relative', height: 180 }}>
          <div style={{ position: 'absolute', inset: 0, opacity: 0.15, background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)' }} />
          <div style={{ position: 'relative', zIndex: 1, padding: 8 }}>
            <Space style={{ marginBottom: 8 }}>
              <EnvironmentOutlined style={{ color: token.colorPrimary }} />
              <Text style={{ color: '#fff', fontWeight: 600 }}>Mapa de Calor — Geolocalización de Obras</Text>
            </Space>
            <Space size="middle" style={{ marginBottom: 12, display: 'flex' }}>
              <Badge status="success" text={<Text style={{ color: '#94a3b8', fontSize: 11 }}>En tiempo</Text>} />
              <Badge status="warning" text={<Text style={{ color: '#94a3b8', fontSize: 11 }}>Riesgo</Text>} />
              <Badge status="error" text={<Text style={{ color: '#94a3b8', fontSize: 11 }}>Desviado</Text>} />
            </Space>
            <div style={{ height: 100, position: 'relative' }}>
              {proyectos.slice(0, 12).map((p, i) => (
                <Tooltip title={`${p.nombre} — ${p.avanceFisico}%`} key={p.id}>
                  <div style={{
                    position: 'absolute',
                    left: `${10 + (i * 7) % 80}%`,
                    top: `${15 + (i * 11) % 70}%`,
                  }}>
                    <Badge
                      status={p.estado === 'ejecucion' ? 'success' : p.estado === 'pausado' ? 'warning' : 'default'}
                    />
                  </div>
                </Tooltip>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {proyectos.length === 0 ? (
        <Empty description="No hay proyectos registrados" />
      ) : (
        <Row gutter={[16, 16]}>
          {proyectos.map(p => (
            <Col xs={24} md={12} xl={8} key={p.id}>
              <Card
                hoverable
                actions={[
                  <Tooltip title="Editar" key="edit">
                    <EditOutlined onClick={() => openEdit(p)} />
                  </Tooltip>,
                  <Tooltip title="Eliminar" key="delete">
                    <DeleteOutlined onClick={() => deleteProyecto(p.id)} />
                  </Tooltip>,
                ]}
              >
                <Card.Meta
                  avatar={
                    <Avatar
                      icon={<BuildOutlined />}
                      style={{ backgroundColor: estadoColor(p) }}
                    />
                  }
                  title={<Text strong style={{ fontSize: 14 }}>{p.nombre}</Text>}
                  description={
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {p.cliente} · {p.ubicacion}
                    </Text>
                  }
                />

                <div style={{ marginTop: 16 }}>
                  <Space style={{ marginBottom: 12 }}>
                    <Tag>{TIPOLOGIA_LABEL[p.tipologia]}</Tag>
                    <Select
                      value={p.estado}
                      size="small"
                      style={{ width: 120 }}
                      onChange={v => updateProyecto(p.id, { estado: v as any })}
                      options={ESTADOS.map(e => ({ value: e, label: estadoLabel[e] }))}
                    />
                  </Space>

                  <div style={{ marginBottom: 8 }}>
                    <Row justify="space-between" style={{ marginBottom: 2 }}>
                      <Text style={{ fontSize: 11, color: '#64748b' }}>Avance Físico</Text>
                      <Text strong style={{ fontSize: 12 }}>{fmtPct(p.avanceFisico)}</Text>
                    </Row>
                    <Progress percent={p.avanceFisico} size="small" strokeColor="#3b82f6" showInfo={false} />
                  </div>

                  <div style={{ marginBottom: 12 }}>
                    <Row justify="space-between" style={{ marginBottom: 2 }}>
                      <Text style={{ fontSize: 11, color: '#64748b' }}>Avance Financiero</Text>
                      <Text strong style={{ fontSize: 12 }}>{fmtPct(p.avanceFinanciero)}</Text>
                    </Row>
                    <Progress percent={p.avanceFinanciero} size="small" strokeColor={token.colorPrimary} showInfo={false} />
                  </div>

                  <Divider style={{ margin: '8px 0' }} />

                  <Row gutter={8}>
                    <Col span={12}>
                      <Text style={{ fontSize: 10, color: '#94a3b8' }}>Presupuesto</Text>
                      <br />
                      <Text strong>{fmtQ(p.presupuestoTotal)}</Text>
                    </Col>
                    <Col span={12} style={{ textAlign: 'right' }}>
                      <Text style={{ fontSize: 10, color: '#94a3b8' }}>Contrato</Text>
                      <br />
                      <Text strong style={{ color: '#10b981' }}>{fmtQ(p.montoContrato)}</Text>
                    </Col>
                  </Row>

                  {presupuestos.find(pr => pr.id === p.presupuestoActualId) && (
                    <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #f0f0f0' }}>
                      <Button
                        type="link"
                        size="small"
                        onClick={() => { setSelectedProyectoId(p.id); setView('presupuestos'); }}
                      >
                        Ver presupuesto actual →
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      )}

      <Modal
        title={editingId ? 'Editar Proyecto' : 'Nuevo Proyecto'}
        open={show}
        onOk={handleOk}
        onCancel={() => { setShow(false); setEditingId(null); }}
        okText={editingId ? 'Guardar Cambios' : 'Crear Proyecto'}
        width={520}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="nombre" label="Nombre del Proyecto" rules={[{ required: true, message: 'Requerido' }]}>
            <Input placeholder="Ej. Edificio Comercial Plaza Norte" />
          </Form.Item>
          <Form.Item name="cliente" label="Cliente" rules={[{ required: true, message: 'Requerido' }]}>
            <Input placeholder="Nombre del cliente" />
          </Form.Item>
          <Form.Item name="ubicacion" label="Ubicación" rules={[{ required: true, message: 'Requerido' }]}>
            <Input placeholder="Ciudad, dirección" />
          </Form.Item>
          <Space style={{ width: '100%' }}>
            <Form.Item name="tipologia" label="Tipología" initialValue="residencial" style={{ width: 200 }}>
              <Select options={[
                { value: 'residencial', label: 'Residencial' },
                { value: 'comercial', label: 'Comercial' },
                { value: 'industrial', label: 'Industrial' },
                { value: 'civil', label: 'Civil' },
                { value: 'publica', label: 'Pública' },
              ]} />
            </Form.Item>
            <Form.Item name="estado" label="Estado" initialValue="planeacion" style={{ width: 200 }}>
              <Select options={ESTADOS.map(e => ({ value: e, label: estadoLabel[e] }))} />
            </Form.Item>
          </Space>
          <Space style={{ width: '100%' }}>
            <Form.Item name="presupuestoTotal" label="Presupuesto (Q)" style={{ width: '100%' }}>
              <InputNumber style={{ width: '100%' }} min={0} placeholder="0.00" />
            </Form.Item>
            <Form.Item name="montoContrato" label="Contrato (Q)" style={{ width: '100%' }}>
              <InputNumber style={{ width: '100%' }} min={0} placeholder="0.00" />
            </Form.Item>
          </Space>
        </Form>
      </Modal>
    </div>
  );
};

export default AntProyectos;
