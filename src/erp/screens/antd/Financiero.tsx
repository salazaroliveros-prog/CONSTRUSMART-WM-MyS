import React, { useMemo, useState, useEffect } from 'react';
import { useErp } from '../../store';
import { fmtQ } from '../../utils';
import {
  Row, Col, Card, Statistic, Table, Tag, Select, Space, Typography,
  Skeleton, Progress, Tabs, Timeline, Divider, Button, theme,
} from 'antd';
import {
  ArrowUpOutlined, ArrowDownOutlined, WalletOutlined,
  DollarOutlined, AlertOutlined,
} from '@ant-design/icons';

const { Title, Text } = Typography;

const COLORS = ['#f97316', '#3b82f6', '#10b981', '#8b5cf6', '#ef4444', '#06b6d4', '#fbbf24', '#ec4899'];

const AntFinanciero: React.FC = () => {
  const { movimientos, deleteMovimiento, proyectos } = useErp();
  const [filtro, setFiltro] = useState<'todos' | 'ingreso' | 'gasto'>('todos');
  const [loading, setLoading] = useState(true);
  const { token } = theme.useToken();

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 300);
    return () => clearTimeout(t);
  }, []);

  const ingresos = movimientos.filter(m => m.tipo === 'ingreso').reduce((a, b) => a + b.costoTotal, 0);
  const gastos = movimientos.filter(m => m.tipo === 'gasto').reduce((a, b) => a + b.costoTotal, 0);
  const utilidad = ingresos - gastos;

  const cashFlowMensual = useMemo(() => {
    const hoy = new Date();
    const meses: { mes: string; ingresos: number; egresos: number; saldo: number }[] = [];
    for (let i = 11; i >= 0; i--) {
      const fecha = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1);
      const label = fecha.toLocaleDateString('es-GT', { month: 'short', year: '2-digit' });
      meses.push({ mes: label, ingresos: 0, egresos: 0, saldo: 0 });
    }
    movimientos.forEach(m => {
      const fechaMov = new Date(m.fecha);
      const diffMonths = (hoy.getFullYear() - fechaMov.getFullYear()) * 12 + (hoy.getMonth() - fechaMov.getMonth());
      const idx = 11 - diffMonths;
      if (idx >= 0 && idx < 12) {
        if (m.tipo === 'ingreso') meses[idx].ingresos += m.costoTotal;
        else meses[idx].egresos += m.costoTotal;
      }
    });
    let saldoAcum = 0;
    meses.forEach(m => { saldoAcum += m.ingresos - m.egresos; m.saldo = saldoAcum; });
    return meses;
  }, [movimientos]);

  const movFiltrados = useMemo(() => {
    return filtro === 'todos' ? movimientos : movimientos.filter(m => m.tipo === filtro);
  }, [movimientos, filtro]);

  const movColumns = [
    {
      title: 'Fecha', dataIndex: 'fecha', key: 'fecha', width: 100,
      render: (f: string) => f?.slice(0, 10),
      sorter: (a: any, b: any) => a.fecha.localeCompare(b.fecha),
    },
    {
      title: 'Descripción', dataIndex: 'descripcion', key: 'descripcion',
      ellipsis: true,
    },
    {
      title: 'Categoría', dataIndex: 'categoria', key: 'categoria', width: 120,
      render: (c: string) => <Tag>{c || 'general'}</Tag>,
    },
    {
      title: 'Proyecto', dataIndex: 'proyectoId', key: 'proyectoId', width: 140,
      render: (id: string) => {
        const proy = proyectos.find(p => p.id === id);
        return proy?.nombre || <Text type="secondary">General</Text>;
      },
    },
    {
      title: 'Monto', dataIndex: 'costoTotal', key: 'costoTotal', width: 130,
      render: (v: number, r: any) => (
        <Text strong style={{ color: r.tipo === 'ingreso' ? 'hsl(var(--success))' : 'hsl(var(--destructive))' }}>
          {r.tipo === 'ingreso' ? '+' : '-'} {fmtQ(v || 0)}
        </Text>
      ),
      sorter: (a: any, b: any) => (a.costoTotal || 0) - (b.costoTotal || 0),
    },
    {
      title: 'Acción', key: 'action', width: 60,
      render: (_: any, r: any) => (
        <Button type="link" danger size="small"
          onClick={() => deleteMovimiento(r.id)}>
          Eliminar
        </Button>
      ),
    },
  ];

  if (loading) {
    return (
      <div style={{ padding: 8 }}>
        <Skeleton active paragraph={{ rows: 2 }} />
      </div>
    );
  }

  return (
    <div style={{ padding: 8 }}>
      <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
        <Col>
          <Title level={4} style={{ margin: 0 }}>
            <WalletOutlined style={{ marginRight: 8, color: token.colorPrimary }} />
            Financiero
          </Title>
          <Text type="secondary">Flujo de caja real y proyectado</Text>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={12} lg={6}>
          <Card size="small" hoverable>
            <Statistic title="Ingresos Totales" value={ingresos} precision={0}
              valueStyle={{ color: 'hsl(var(--success))' }}
              prefix={<><ArrowUpOutlined /> Q</>} />
          </Card>
        </Col>
        <Col xs={12} lg={6}>
          <Card size="small" hoverable>
            <Statistic title="Gastos Totales" value={gastos} precision={0}
              valueStyle={{ color: 'hsl(var(--destructive))' }}
              prefix={<><ArrowDownOutlined /> Q</>} />
          </Card>
        </Col>
        <Col xs={12} lg={6}>
          <Card size="small" hoverable>
            <Statistic title="Utilidad Neta" value={utilidad} prefix="Q" precision={0}
              valueStyle={{ color: utilidad > 0 ? 'hsl(var(--success))' : 'hsl(var(--destructive))' }} />
          </Card>
        </Col>
        <Col xs={12} lg={6}>
          <Card size="small" hoverable>
            <Statistic title="Saldo de Caja" value={cashFlowMensual[cashFlowMensual.length - 1]?.saldo || 0}
              prefix="Q" precision={0}
              valueStyle={{ color: 'hsl(var(--info))' }} />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} lg={16}>
          <Card title={<Space><DollarOutlined /> Flujo de Caja (12 meses)</Space>} size="small">
            <div style={{ height: 240, padding: '8px 0', position: 'relative' }}>
              <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'flex-end', gap: 3, height: 200 }}>
                {cashFlowMensual.map((m, i) => {
                  const maxVal = Math.max(...cashFlowMensual.map(x => Math.max(x.ingresos, x.egresos, 1)));
                  const ingH = (m.ingresos / maxVal) * 180;
                  const egrH = (m.egresos / maxVal) * 180;
                  return (
                    <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                      <div style={{ width: '100%', background: 'hsl(var(--success))', borderRadius: '4px 4px 0 0', height: Math.max(ingH, 2), opacity: 0.8 }} />
                      <div style={{ width: '100%', background: 'hsl(var(--destructive))', borderRadius: '4px 4px 0 0', height: Math.max(egrH, 2), opacity: 0.8 }} />
                      <Text style={{ fontSize: 8, color: 'hsl(var(--muted-foreground))', marginTop: 4 }}>{m.mes}</Text>
                    </div>
                  );
                })}
              </div>
              <Space style={{ position: 'absolute', top: 0, right: 0 }}>
                <Tag color="green">Ingresos</Tag>
                <Tag color="red">Egresos</Tag>
              </Space>
            </div>
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="Resumen por Categoría" size="small">
            <div style={{ maxHeight: 240, overflow: 'auto' }}>
              {Object.entries(
                movimientos.filter(m => m.tipo === 'gasto').reduce((acc: Record<string, number>, m) => {
                  acc[m.categoria] = (acc[m.categoria] || 0) + m.costoTotal;
                  return acc;
                }, {})
              ).sort((a, b) => b[1] - a[1]).map(([cat, val], i) => (
                <div key={cat} style={{ marginBottom: 8 }}>
                  <Row justify="space-between" style={{ marginBottom: 2 }}>
                    <Text style={{ fontSize: 12 }}>{cat || 'general'}</Text>
                    <Text strong style={{ fontSize: 12 }}>{fmtQ(val)}</Text>
                  </Row>
                  <Progress
                    percent={gastos > 0 ? (val / gastos) * 100 : 0}
                    size="small"
                    strokeColor={COLORS[i % COLORS.length]}
                    showInfo={false}
                  />
                </div>
              ))}
            </div>
          </Card>
        </Col>
      </Row>

      <Card
        size="small"
        title={
          <Space>
            <WalletOutlined />
            Movimientos
            <Select
              value={filtro}
              onChange={setFiltro}
              size="small"
              style={{ width: 130 }}
              options={[
                { value: 'todos', label: 'Todos' },
                { value: 'ingreso', label: 'Solo Ingresos' },
                { value: 'gasto', label: 'Solo Gastos' },
              ]}
            />
          </Space>
        }
      >
        <Table
          dataSource={movFiltrados}
          columns={movColumns}
          rowKey="id"
          size="small"
          pagination={{ pageSize: 10, showSizeChanger: true, pageSizeOptions: ['10', '20', '50'] }}
          scroll={{ x: 700 }}
        />
      </Card>
    </div>
  );
};

export default AntFinanciero;
