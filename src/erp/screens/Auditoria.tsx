import React from 'react';
import { useTranslation } from 'react-i18next';
import { useErp } from '../store';
import { Table, Button, Space, Modal, Descriptions, Input, Select, DatePicker, Tag, Skeleton } from 'antd';
import { SearchOutlined, DownloadOutlined, EyeOutlined, PlusCircleOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { LogAuditoria } from '../store';

const { RangePicker } = DatePicker;

const OPERATION_COLORS: Record<string, string> = {
  creación: 'green',
  actualización: 'orange',
  eliminación: 'red',
  creacion: 'green',
  actualizacion: 'orange',
  eliminacion: 'red',
  creación_proyecto: 'green',
  actualización_proyecto: 'orange',
  eliminación_proyecto: 'red',
  cambio_estado: 'blue',
};

function opLabel(op: string): string {
  if (op.startsWith('creación') || op.startsWith('creacion')) return 'Creación';
  if (op.startsWith('actualización') || op.startsWith('actualizacion') || op.startsWith('actualiz')) return 'Actualización';
  if (op.startsWith('eliminación') || op.startsWith('eliminacion') || op.startsWith('elimin')) return 'Eliminación';
  if (op.startsWith('cambio')) return 'Actualización';
  return op;
}

function opColor(op: string): string {
  const base = opLabel(op);
  return OPERATION_COLORS[base] || OPERATION_COLORS[op] || 'default';
}

function fmtDate(iso?: string): string {
  if (!iso) return '';
  return new Date(iso).toLocaleString('es-ES', {
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

export default function Auditoria() {
  const { t } = useTranslation();
  const { auditLog } = useErp();
  const [search, setSearch] = React.useState('');
  const [filterTabla, setFilterTabla] = React.useState<string | null>(null);
  const [filterOperacion, setFilterOperacion] = React.useState<string | null>(null);
  const [filterUsuario, setFilterUsuario] = React.useState<string | null>(null);
  const [dateRange, setDateRange] = React.useState<[string | null, string | null] | null>(null);
  const [detailModalOpen, setDetailModalOpen] = React.useState(false);
  const [selectedEntry, setSelectedEntry] = React.useState<LogAuditoria | null>(null);
  const [loading, setLoading] = React.useState(false);

  const filtradas = auditLog
    .filter(e => !filterTabla || e.entidad === filterTabla)
    .filter(e => !filterOperacion || opLabel(e.accion) === filterOperacion)
    .filter(e => !filterUsuario || e.usuarioNombre === filterUsuario)
    .filter(e => !search ||
      e.entidad.toLowerCase().includes(search.toLowerCase()) ||
      e.entidadId?.toLowerCase().includes(search.toLowerCase()) ||
      e.usuarioNombre.toLowerCase().includes(search.toLowerCase()) ||
      e.accion.toLowerCase().includes(search.toLowerCase())
    )
    .filter(e => {
      if (!dateRange || (!dateRange[0] && !dateRange[1])) return true;
      const d = new Date(e.createdAt).getTime();
      const from = dateRange[0] ? new Date(dateRange[0]).getTime() : 0;
      const to = dateRange[1] ? new Date(dateRange[1]).getTime() : Infinity;
      return d >= from && d <= to;
    });

  const stats = {
    total: auditLog.length,
    creations: auditLog.filter(e => e.accion.startsWith('creación') || e.accion.startsWith('creacion')).length,
    updates: auditLog.filter(e => e.accion.startsWith('actualización') || e.accion.startsWith('actualizacion') || e.accion.startsWith('actualiz') || e.accion.startsWith('cambio')).length,
    deletes: auditLog.filter(e => e.accion.startsWith('eliminación') || e.accion.startsWith('eliminacion') || e.accion.startsWith('elimin')).length,
  };

  const tablas = [...new Set(auditLog.map(e => e.entidad))].sort();
  const usuarios = [...new Set(auditLog.map(e => e.usuarioNombre))].sort();

  const showDetail = (entry: LogAuditoria) => {
    setSelectedEntry(entry);
    setDetailModalOpen(true);
  };

  const handleExportCSV = () => {
    const headers = [t('auditoria.columna_fecha'), t('auditoria.columna_usuario'), t('auditoria.columna_tabla'), t('auditoria.columna_operacion'), t('auditoria.columna_id'), 'Detalles'];
    const rows = filtradas.map(e => [
      e.createdAt,
      e.usuarioNombre,
      e.entidad,
      e.accion,
      e.entidadId || '',
      JSON.stringify({ old: e.valoresAnteriores, new: e.valoresNuevos }).replace(/"/g, '""'),
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `auditoria-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="p-4 max-w-6xl mx-auto space-y-4">
        <Skeleton active paragraph={{ rows: 1 }} />
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} active paragraph={{ rows: 2 }} />)}
        </div>
        <Skeleton active paragraph={{ rows: 8 }} />
      </div>
    );
  }

  const columns: ColumnsType<LogAuditoria> = [
    {
      title: t('auditoria.columna_fecha'),
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: (date: string) => fmtDate(date),
      sorter: (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      defaultSortOrder: 'descend',
    },
    {
      title: t('auditoria.columna_usuario'),
      dataIndex: 'usuarioNombre',
      key: 'usuarioNombre',
      width: 150,
    },
    {
      title: t('auditoria.columna_tabla'),
      dataIndex: 'entidad',
      key: 'entidad',
      width: 150,
    },
    {
      title: t('auditoria.columna_operacion'),
      dataIndex: 'accion',
      key: 'accion',
      width: 130,
      render: (accion: string) => (
        <Tag color={opColor(accion)}>{opLabel(accion)}</Tag>
      ),
    },
    {
      title: t('auditoria.columna_id'),
      dataIndex: 'entidadId',
      key: 'entidadId',
      width: 100,
      render: (id: string | undefined) => id ? <code className="text-xs">{id.slice(0, 8)}</code> : '-',
    },
    {
      title: t('auditoria.columna_detalles'),
      key: 'details',
      width: 80,
      render: (_, record) => (
        <Button
          type="link"
          size="small"
          icon={<EyeOutlined />}
          onClick={() => showDetail(record)}
          aria-label={t('auditoria.ver')}
        >
          {t('auditoria.ver')}
        </Button>
      ),
    },
  ];

  return (
    <div className="p-4 max-w-6xl mx-auto space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">{t('auditoria.titulo')}</h1>
          <p className="text-sm text-gray-500">
            {t('auditoria.subtitulo', { total: stats.total, creations: stats.creations, updates: stats.updates, deletes: stats.deletes })}
          </p>
        </div>
        <Button
          icon={<DownloadOutlined />}
          onClick={handleExportCSV}
          aria-label={t('auditoria.exportar_csv')}
        >
          {t('auditoria.exportar_csv')}
        </Button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm text-gray-500">{t('auditoria.total')}</span>
          </div>
          <div className="text-2xl font-bold">{stats.total}</div>
        </div>
        <div className="bg-white dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-1">
            <PlusCircleOutlined className="text-green-500" />
            <span className="text-sm text-gray-500">{t('auditoria.creaciones')}</span>
          </div>
          <div className="text-2xl font-bold text-green-600">{stats.creations}</div>
        </div>
        <div className="bg-white dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-1">
            <EditOutlined className="text-orange-500" />
            <span className="text-sm text-gray-500">{t('auditoria.actualizaciones')}</span>
          </div>
          <div className="text-2xl font-bold text-orange-600">{stats.updates}</div>
        </div>
        <div className="bg-white dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-1">
            <DeleteOutlined className="text-red-500" />
            <span className="text-sm text-gray-500">{t('auditoria.eliminaciones')}</span>
          </div>
          <div className="text-2xl font-bold text-red-600">{stats.deletes}</div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        <Input
          placeholder={t('auditoria.buscar_placeholder')}
          prefix={<SearchOutlined />}
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ width: 240 }}
          aria-label="Buscar en auditoría"
        />
        <Select
          placeholder={t('auditoria.filtro_tabla')}
          value={filterTabla}
          onChange={v => setFilterTabla(v)}
          allowClear
          style={{ width: 160 }}
          aria-label="Filtrar por tabla"
          options={tablas.map(t => ({ value: t, label: t }))}
        />
        <Select
          placeholder={t('auditoria.filtro_operacion')}
          value={filterOperacion}
          onChange={v => setFilterOperacion(v)}
          allowClear
          style={{ width: 160 }}
          aria-label="Filtrar por operación"
          options={[
            { value: 'Creación', label: t('auditoria.operacion_creacion') },
            { value: 'Actualización', label: t('auditoria.operacion_actualizacion') },
            { value: 'Eliminación', label: t('auditoria.operacion_eliminacion') },
          ]}
        />
        <Select
          placeholder={t('auditoria.filtro_usuario')}
          value={filterUsuario}
          onChange={v => setFilterUsuario(v)}
          allowClear
          style={{ width: 160 }}
          aria-label="Filtrar por usuario"
          options={usuarios.map(u => ({ value: u, label: u }))}
        />
        <RangePicker
          onChange={(_, dateStrings) => setDateRange(dateStrings as [string, string] || null)}
          aria-label="Filtrar por rango de fecha"
        />
      </div>

      <Table<LogAuditoria>
        rowKey="id"
        columns={columns}
        dataSource={filtradas}
        pagination={{
          showSizeChanger: true,
          showTotal: (total) => t('auditoria.total_paginacion', { total }),
          pageSize: 20,
        }}
        loading={loading}
        scroll={{ x: 900 }}
        locale={{
          emptyText: t('auditoria.sin_resultados'),
        }}
      />

      <Modal
        title={t('auditoria.detalle_titulo', { id: selectedEntry?.id?.slice(0, 8) || '' })}
        open={detailModalOpen}
        onCancel={() => setDetailModalOpen(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModalOpen(false)}>
            {t('auditoria.cerrar')}
          </Button>,
        ]}
        width={800}
      >
        {selectedEntry && (
          <Descriptions bordered column={2} size="small">
            <Descriptions.Item label={t('auditoria.columna_fecha')} span={2}>
              {fmtDate(selectedEntry.createdAt)}
            </Descriptions.Item>
            <Descriptions.Item label={t('auditoria.columna_usuario')}>
              {selectedEntry.usuarioNombre}
            </Descriptions.Item>
            <Descriptions.Item label={t('auditoria.columna_operacion')}>
              <Tag color={opColor(selectedEntry.accion)}>{opLabel(selectedEntry.accion)}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label={t('auditoria.columna_tabla')} span={2}>
              {selectedEntry.entidad}
            </Descriptions.Item>
            <Descriptions.Item label={t('auditoria.columna_id')} span={2}>
              <code>{selectedEntry.entidadId || 'N/A'}</code>
            </Descriptions.Item>
            {selectedEntry.valoresAnteriores && Object.keys(selectedEntry.valoresAnteriores).length > 0 && (
              <Descriptions.Item label={t('auditoria.datos_anteriores')} span={2}>
                <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded text-xs overflow-auto max-h-48">
                  {JSON.stringify(selectedEntry.valoresAnteriores, null, 2)}
                </pre>
              </Descriptions.Item>
            )}
            {selectedEntry.valoresNuevos && Object.keys(selectedEntry.valoresNuevos).length > 0 && (
              <Descriptions.Item label={t('auditoria.datos_nuevos')} span={2}>
                <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded text-xs overflow-auto max-h-48">
                  {JSON.stringify(selectedEntry.valoresNuevos, null, 2)}
                </pre>
              </Descriptions.Item>
            )}
          </Descriptions>
        )}
      </Modal>
    </div>
  );
}
