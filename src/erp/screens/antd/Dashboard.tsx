import React, { useMemo, useState } from 'react';
import { useErp, type View } from '../../store';
import { fmtQ, todayISO } from '../../utils';
import {
  Row, Col, Card, Statistic, Progress, Table, Tag, Timeline,
  Select, Typography, Space, Alert, Badge, Divider,
  Button, Tooltip, Grid, theme, Calendar,
} from 'antd';
import {
  ArrowUpOutlined, ArrowDownOutlined, WarningOutlined,
  ClockCircleOutlined, ProjectOutlined,
  RiseOutlined, FallOutlined, RightOutlined,
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { useBreakpoint } = Grid;

const _COLORS = ['#f97316', '#3b82f6', '#10b981', '#8b5cf6', '#ef4444', '#06b6d4', '#fbbf24', '#ec4899'];

const AntDashboard: React.FC = () => {
  const { proyectos, movimientos, avances, setView, notificacionesNoLeidas, notificaciones, marcarTodasLeidas } = useErp();
  const [filtroProy, setFiltroProy] = useState('');
  const { token } = theme.useToken();
  const screens = useBreakpoint();
  const sp = screens.lg ? 16 : 8;

  const proyFiltrados = filtroProy
    ? proyectos.filter(p => p.id === filtroProy)
    : proyectos;
  const activos = proyFiltrados.filter(p => p.estado === 'ejecucion');
  const ingresos = movimientos.filter(m => m.tipo === 'ingreso').reduce((a, b) => a + (b.monto ?? b.costoTotal ?? 0), 0);
  const gastos = movimientos.filter(m => m.tipo === 'gasto').reduce((a, b) => a + (b.monto ?? b.costoTotal ?? 0), 0);
  const presupuestoTotal = activos.reduce((a, b) => a + b.presupuestoTotal, 0);
  const margenProm = activos.length
    ? activos.reduce((a, b) => {
        const m = b.montoContrato > 0 ? ((b.montoContrato - b.presupuestoTotal) / b.montoContrato) * 100 : 0;
        return a + m;
      }, 0) / activos.length : 0;
  const desviacion = activos.length
    ? activos.reduce((a, b) => a + (b.avanceFinanciero - b.avanceFisico), 0) / activos.length : 0;

  const avanceData = useMemo(() => {
    const steps = 8;
    const data = avances;
    if (data.length === 0) {
      return { prog: Array(steps).fill(0), real: Array(steps).fill(0) };
    }
    const sorted = [...data].sort((a, b) => a.fecha.localeCompare(b.fecha));
    const prog = Array.from({ length: steps }, (_, i) => {
      if (i === 0) return 0;
      if (i === steps - 1) return 100;
      const t = i / (steps - 1);
      return Math.round(100 / (1 + Math.exp(-8 * (t - 0.5))));
    });
    const real = Array.from({ length: steps }, (_, i) => {
      if (i === 0) return 0;
      const count = Math.round((i / (steps - 1)) * sorted.length);
      const slice = sorted.slice(0, count);
      const avg = slice.reduce((s, a) => s + a.avanceFisico, 0) / slice.length;
      return Math.round(avg);
    });
    return { prog, real };
  }, [avances]);

  const alertasRetraso = useMemo(() => {
    const hoy = todayISO();
    return proyectos
      .filter(p => p.estado === 'ejecucion' && p.fechaFin && p.fechaFin < hoy && p.avanceFisico < 100)
      .map(p => ({
        id: p.id, nombre: p.nombre, avance: p.avanceFisico,
        diasRetraso: Math.round((new Date(hoy).getTime() - new Date(p.fechaFin).getTime()) / 86400000),
      }));
  }, [proyectos]);

  const movPorCategoria = useMemo(() => {
    const map: Record<string, number> = {};
    movimientos.filter(m => m.tipo === 'gasto').forEach(m => { map[m.categoria] = (map[m.categoria] || 0) + (m.monto ?? m.costoTotal ?? 0); });
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 6)
      .map(([k, v], i) => ({ key: k, label: k.slice(0, 12), value: v, color: COLORS[i % COLORS.length] })) || [];
  }, [movimientos]);

  const kpiCards = [
    {
      title: 'Margen de Utilidad Prom.',
      value: margenProm,
      suffix: '%',
      precision: 1,
      prefix: margenProm > 0 ? <RiseOutlined /> : <FallOutlined />,
      valueStyle: { color: margenProm > 0 ? 'hsl(var(--success))' : 'hsl(var(--destructive))' },
      progress: Math.abs(margenProm),
      progressColor: margenProm > 0 ? '#10b981' : '#ef4444',
    },
    {
      title: 'Proyectos Activos',
      value: activos.length,
      suffix: `/ ${proyectos.length} total`,
      prefix: <ProjectOutlined />,
      valueStyle: { color: 'hsl(var(--info))' },
      progress: proyectos.length > 0 ? (activos.length / proyectos.length) * 100 : 0,
      progressColor: '#3b82f6',
    },
    {
      title: 'Presupuesto en Ejecución',
      value: presupuestoTotal,
      prefix: 'Q',
      precision: 0,
      valueStyle: { color: token.colorPrimary },
    },
    {
      title: 'Desviación Global',
      value: desviacion,
      suffix: '%',
      precision: 1,
      prefix: desviacion > 0 ? <ArrowDownOutlined /> : <ArrowUpOutlined />,
      valueStyle: { color: desviacion > 0 ? 'hsl(var(--destructive))' : 'hsl(var(--success))' },
    },
  ];

  const movColumns = [
    { title: 'Categoría', dataIndex: 'label', key: 'label', render: (t: string) => <Tag>{t}</Tag> },
    { title: 'Monto', dataIndex: 'value', key: 'value', render: (v: number) => <Text strong>{fmtQ(v)}</Text>,
      sorter: (a: any, b: any) => a.value - b.value,
    },
  ];

  const modulos = [
    { key: 'proyectos', label: 'Proyectos', color: '#3b82f6', icon: '🏗️' },
    { key: 'presupuestos', label: 'Presupuestos', color: token.colorPrimary, icon: '📊' },
    { key: 'seguimiento', label: 'Seguimiento', color: '#10b981', icon: '📋' },
    { key: 'financiero', label: 'Financiero', color: '#8b5cf6', icon: '💰' },
    { key: 'crm', label: 'CRM', color: '#ec4899', icon: '🎯' },
    { key: 'bodega', label: 'Bodega', color: '#06b6d4', icon: '📦' },
  ];

  return (
    <div style={{ padding: 8 }}>
      <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
        <Col>
          <Title level={4} style={{ margin: 0 }}>
            Tablero Principal
          </Title>
          <Text type="secondary">Centro de comando — métricas en tiempo real</Text>
        </Col>
        <Col>
          <Select
            value={filtroProy}
            onChange={setFiltroProy}
            style={{ width: 200 }}
            placeholder="Todos los proyectos"
            options={[
              { value: '', label: 'Todos los proyectos' },
              ...proyectos.map(p => ({ value: p.id, label: p.nombre })),
            ]}
          />
        </Col>
      </Row>

      {alertasRetraso.length > 0 && (
        <Alert
          type="error"
          showIcon
          icon={<WarningOutlined />}
              message={<Text strong style={{ color: 'hsl(var(--destructive))' }}>Alertas de Retraso</Text>}
          description={
            <Timeline
              items={alertasRetraso.map(a => ({
                color: 'red',
                children: <Text style={{ fontSize: 13 }}>
                  <Text strong>{a.nombre}</Text> — {a.diasRetraso} días de retraso · {a.avance}% avance
                </Text>,
              }))}
            />
          }
          style={{ marginBottom: 16 }}
        />
      )}

      <Row gutter={[sp, sp]} style={{ marginBottom: 16 }}>
        {kpiCards.map((kpi, i) => (
          <Col xs={12} lg={6} key={i}>
            <Card hoverable size="small" styles={{ body: { padding: 16 } }}>
              <Statistic {...kpi} />
              {kpi.progress !== undefined && (
                <Progress
                  percent={Number(kpi.progress.toFixed(0))}
                  strokeColor={kpi.progressColor}
                  size="small"
                  style={{ marginTop: 8 }}
                  showInfo={false}
                />
              )}
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={[sp, sp]} style={{ marginBottom: 16 }}>
        <Col xs={24} lg={16}>
          <Card
            title={<Space><RiseOutlined style={{ color: token.colorPrimary }} /> Curva S Consolidada</Space>}
            size="small"
            extra={
              <Space size={4}>
                <Tag color="blue">Programado</Tag>
                <Tag color="orange">Real</Tag>
              </Space>
            }
          >
            <div style={{ height: 220, display: 'flex', alignItems: 'flex-end', gap: 4, padding: '8px 0' }}>
              {avanceData.prog.map((v, i) => (
                <Tooltip title={`Programado: ${v}%`} key={`p${i}`}>
                  <div style={{
                    flex: 1, background: '#3b82f6', borderRadius: '4px 4px 0 0',
                    height: `${v * 1.8}px`, opacity: 0.8, transition: 'height 0.3s',
                    minHeight: 4,
                  }} />
                </Tooltip>
              ))}
              {avanceData.real.map((v, i) => (
                <Tooltip title={`Real: ${v}%`} key={`r${i}`}>
                  <div style={{
                    flex: 1, background: '#f97316', borderRadius: '4px 4px 0 0',
                    height: `${v * 1.8}px`, opacity: 0.9, transition: 'height 0.3s',
                    minHeight: 4, marginLeft: -4,
                  }} />
                </Tooltip>
              ))}
            </div>
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="Calendario" size="small">
            <Calendar fullscreen={false} />
          </Card>
        </Col>
      </Row>

      <Row gutter={[sp, sp]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card title="Gastos por Categoría" size="small">
<Table
               dataSource={Array.isArray(movPorCategoria) ? movPorCategoria : []}
               columns={movColumns}
               pagination={false}
               size="small"
               showHeader={false}
             />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card title="Ingresos vs Gastos" size="small">
            <Row gutter={[8, 8]}>
              <Col span={12}>
                <Statistic title="Ingresos" value={ingresos} prefix="Q"
                  valueStyle={{ color: 'hsl(var(--success))', fontSize: 20 }} />
              </Col>
              <Col span={12}>
                <Statistic title="Gastos" value={gastos} prefix="Q"
                  valueStyle={{ color: 'hsl(var(--destructive))', fontSize: 20 }} />
              </Col>
            </Row>
            <Divider style={{ margin: '12px 0' }} />
            <Statistic title="Utilidad Neta" value={ingresos - gastos} prefix="Q"
              valueStyle={{ color: ingresos - gastos > 0 ? 'hsl(var(--success))' : 'hsl(var(--destructive))' }} />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card
            title={<Space><ClockCircleOutlined style={{ color: 'hsl(var(--warning))' }} /> Pronóstico de Finalización</Space>}
            size="small"
          >
            <Timeline
              items={proyectos.filter(p => p.estado === 'ejecucion').slice(0, 5).map(p => ({
                color: p.avanceFisico > 70 ? 'green' : p.avanceFisico > 40 ? 'orange' : 'red',
                children: <Space>
                  <Text strong>{p.nombre}</Text>
                  <Tag>{p.avanceFisico}%</Tag>
                  <Text type="secondary">{p.fechaFin || 'Sin fecha'}</Text>
                </Space>,
              }))}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[sp, sp]}>
        <Col xs={24} sm={12} lg={8}>
          <Card title="Registro Rápido" size="small">
            <Alert
              message="Movimiento rápido"
              description="Acceso directo para registrar ingresos y gastos."
              type="info"
              showIcon
              style={{ marginBottom: 12 }}
            />
            <Button type="primary" block>Nuevo Ingreso</Button>
            <Button block style={{ marginTop: 8 }}>Nuevo Gasto</Button>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card title="Módulos Rápidos" size="small">
            <Row gutter={[8, 8]}>
              {modulos.map(m => (
                <Col span={12} key={m.key}>
                  <Button
                    block
                    onClick={() => setView(m.key as View)}
                    style={{
                      textAlign: 'left',
                      height: 'auto',
                      padding: '8px 12px',
                      border: `1px solid ${m.color}30`,
                      background: `${m.color}08`,
                    }}
                  >
                    <Space>
                      <Text style={{ fontSize: 16 }}>{m.icon}</Text>
                      <Text strong style={{ fontSize: 12 }}>{m.label}</Text>
                      <RightOutlined style={{ fontSize: 10, color: 'hsl(var(--muted-foreground))' }} />
                    </Space>
                  </Button>
                </Col>
              ))}
            </Row>
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="Notificaciones" size="small"
            extra={
              <Button size="small" onClick={marcarTodasLeidas} type="link">
                Marcar todas
              </Button>
            }
          >
            <Badge count={notificacionesNoLeidas} style={{ marginBottom: 12 }}>
              <Text strong>Pendientes</Text>
            </Badge>
            <div style={{ maxHeight: 200, overflow: 'auto' }}>
              {notificaciones.slice(0, 5).map(n => (
                <div key={n.id} style={{
                  padding: '6px 0',
                    borderBottom: '1px solid hsl(var(--border))',
                  opacity: n.leido ? 0.5 : 1,
                }}>
                  <Text strong style={{ fontSize: 12 }}>{n.titulo}</Text>
                  <br />
                  <Text type="secondary" style={{ fontSize: 11 }}>{n.mensaje}</Text>
                </div>
              ))}
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default AntDashboard;
