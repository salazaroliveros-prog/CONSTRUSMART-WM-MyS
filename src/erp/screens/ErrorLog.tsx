import React from 'react';
import { useTranslation } from 'react-i18next';
import { useErp } from '../store';
import ProyectoFilter from '../components/ProyectoFilter';
import { Table, Tag, Badge, Button, Space, Modal, Descriptions, Alert, Input, Select, DatePicker, Tooltip, Skeleton } from 'antd';
import { SearchOutlined, CheckOutlined, DeleteOutlined, DownloadOutlined, ClearOutlined, EyeOutlined, ExclamationCircleOutlined, CheckCircleOutlined, WarningOutlined, DatabaseOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { ErrorLogEntry } from '../store/schemas/errorLog';

const { RangePicker } = DatePicker;

const SEVERITY_COLORS: Record<string, string> = {
  critical: 'red',
  error: 'red',
  warning: 'orange',
  info: 'blue',
  debug: 'default',
};

function severityLabel(t: (k: string) => string, sev: string): string {
  const map: Record<string, string> = {
    critical: t('error_log.severidad_critico'),
    error: t('error_log.severidad_error'),
    warning: t('error_log.severidad_advertencia'),
    info: t('error_log.severidad_info'),
    debug: t('error_log.severidad_debug'),
  };
  return map[sev] || sev;
}

function fmtDate(iso?: string): string {
  if (!iso) return '';
  return new Date(iso).toLocaleString('es-ES', {
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

export default function ErrorLog() {
  const { t } = useTranslation();
  const { errorLogs, resolveError, deleteError, cleanupOldErrors, proyectos, user } = useErp();
  const [search, setSearch] = React.useState('');
  const [filterSeverity, setFilterSeverity] = React.useState<string | null>(null);
  const [filterStatus, setFilterStatus] = React.useState<string | null>(null);
  const [filterProyecto, setFilterProyecto] = React.useState('');
  const [dateRange, setDateRange] = React.useState<[string | null, string | null] | null>(null);
  const [detailModalOpen, setDetailModalOpen] = React.useState(false);
  const [selectedError, setSelectedError] = React.useState<ErrorLogEntry | null>(null);
  const [resolveModalOpen, setResolveModalOpen] = React.useState(false);
  const [resolveNotes, setResolveNotes] = React.useState('');
  const [selectedRowKeys, setSelectedRowKeys] = React.useState<React.Key[]>([]);
  const [loading, setLoading] = React.useState(false);

  const errorTypeStats = React.useMemo(() => {
    const counts: Record<string, number> = {};
    errorLogs.forEach(e => {
      const t = e.errorType || 'unknown';
      counts[t] = (counts[t] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 10);
  }, [errorLogs]);

  const filtradas = errorLogs
    .filter(e => !filterSeverity || e.severity === filterSeverity)
    .filter(e => {
      if (filterStatus === 'open') return !e.resolved;
      if (filterStatus === 'resolved') return e.resolved;
      return true;
    })
    .filter(e => !filterProyecto || e.proyectoId === filterProyecto)
    .filter(e => !search ||
      e.errorMessage.toLowerCase().includes(search.toLowerCase()) ||
      e.errorCode?.toLowerCase().includes(search.toLowerCase()) ||
      e.component?.toLowerCase().includes(search.toLowerCase()) ||
      e.functionName?.toLowerCase().includes(search.toLowerCase())
    )
    .filter(e => {
      if (!dateRange || (!dateRange[0] && !dateRange[1])) return true;
      const d = new Date(e.createdAt).getTime();
      const from = dateRange[0] ? new Date(dateRange[0]).getTime() : 0;
      const to = dateRange[1] ? new Date(dateRange[1]).getTime() : Infinity;
      return d >= from && d <= to;
    });

  const stats = {
    total: errorLogs.length,
    open: errorLogs.filter(e => !e.resolved).length,
    resolved: errorLogs.filter(e => e.resolved).length,
    critical: errorLogs.filter(e => e.severity === 'critical' && !e.resolved).length,
  };

  const getProyectoNombre = (pid?: string | null) => {
    if (!pid) return '';
    const p = proyectos.find(pr => pr.id === pid);
    return p?.nombre || '';
  };

  const handleResolve = (id: string, notes?: string) => {
    resolveError(id, notes || undefined);
  };

  const openResolveModal = (id: string) => {
    setResolveNotes('');
    setSelectedError(errorLogs.find(e => e.id === id) || null);
    setResolveModalOpen(true);
  };

  const confirmResolve = () => {
    if (!selectedError) return;
    handleResolve(selectedError.id, resolveNotes);
    setResolveModalOpen(false);
    setSelectedError(null);
  };

  const handleBulkResolve = () => {
    selectedRowKeys.forEach(id => resolveError(id as string));
    setSelectedRowKeys([]);
  };

  const handleBulkDelete = () => {
    selectedRowKeys.forEach(id => deleteError(id as string));
    setSelectedRowKeys([]);
  };

  const handleCleanup = () => {
    const dias = prompt(t('error_log.eliminar_dias'), '30');
    if (dias) cleanupOldErrors(parseInt(dias, 10));
  };

  const handleExportCSV = () => {
    const headers = ['ID', t('error_log.columna_tipo'), t('error_log.columna_severidad'), t('error_log.columna_mensaje'), t('error_log.columna_componente'), t('error_log.columna_estado'), t('error_log.columna_fecha')];
    const rows = filtradas.map(e => [
      e.id.slice(0, 8),
      e.errorType || '',
      severityLabel(t, e.severity),
      `"${e.errorMessage.replace(/"/g, '""')}"`,
      e.component || '',
      e.resolved ? t('error_log.resuelto') : t('error_log.abierto'),
      e.createdAt,
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `error-log-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const showDetail = (record: ErrorLogEntry) => {
    setSelectedError(record);
    setDetailModalOpen(true);
  };

  if (loading) {
    return (
      <div className="p-4 max-w-6xl mx-auto space-y-4">
        <Skeleton active paragraph={{ rows: 1 }} />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} active paragraph={{ rows: 2 }} />)}
        </div>
        <Skeleton active paragraph={{ rows: 8 }} />
      </div>
    );
  }

  const columns: ColumnsType<ErrorLogEntry> = [
    {
      title: t('error_log.columna_id'),
      dataIndex: 'id',
      key: 'id',
      width: 100,
      render: (id: string) => <code className="text-xs">{id.slice(0, 8)}</code>,
      sorter: (a, b) => a.id.localeCompare(b.id),
    },
    {
      title: t('error_log.columna_tipo'),
      dataIndex: 'errorType',
      key: 'errorType',
      width: 110,
      render: (type: string | undefined) => type ? <Tag>{type}</Tag> : null,
      filters: [...new Set(errorLogs.map(e => e.errorType).filter(Boolean))].map(t => ({ text: t, value: t })),
      onFilter: (value, record) => record.errorType === value,
    },
    {
      title: t('error_log.columna_severidad'),
      dataIndex: 'severity',
      key: 'severity',
      width: 110,
      render: (sev: string) => (
        <Tag color={SEVERITY_COLORS[sev] || 'default'}>
          {severityLabel(t, sev)}
        </Tag>
      ),
      filters: [
        { text: t('error_log.severidad_critico'), value: 'critical' },
        { text: t('error_log.severidad_error'), value: 'error' },
        { text: t('error_log.severidad_advertencia'), value: 'warning' },
        { text: t('error_log.severidad_info'), value: 'info' },
      ],
      onFilter: (value, record) => record.severity === value,
    },
    {
      title: t('error_log.columna_estado'),
      dataIndex: 'resolved',
      key: 'resolved',
      width: 110,
      render: (resolved: boolean) => (
        <Badge status={resolved ? 'success' : 'error'} text={resolved ? t('error_log.resuelto') : t('error_log.abierto')} />
      ),
      filters: [
        { text: t('error_log.abierto'), value: false },
        { text: t('error_log.resuelto'), value: true },
      ],
      onFilter: (value, record) => record.resolved === value,
    },
    {
      title: t('error_log.columna_mensaje'),
      dataIndex: 'errorMessage',
      key: 'errorMessage',
      ellipsis: true,
      render: (msg: string) => (
        <Tooltip title={msg}><span>{msg}</span></Tooltip>
      ),
    },
    {
      title: t('error_log.columna_componente'),
      dataIndex: 'component',
      key: 'component',
      width: 130,
      render: (comp: string | undefined) => comp ? (
        <code className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">{comp}</code>
      ) : null,
    },
    {
      title: t('error_log.columna_proyecto'),
      dataIndex: 'proyectoId',
      key: 'proyectoId',
      width: 130,
      render: (pid: string | undefined | null) => getProyectoNombre(pid) || '-',
    },
    {
      title: t('error_log.columna_fecha'),
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: (date: string) => fmtDate(date),
      sorter: (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      defaultSortOrder: 'descend',
    },
    {
      title: t('error_log.columna_acciones'),
      key: 'actions',
      width: 140,
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => showDetail(record)}
            aria-label={t('error_log.ver') + ' ' + t('error_log.detalle_titulo', { id: '' })}
          >
            {t('error_log.ver')}
          </Button>
          {!record.resolved && (
              <Button
                type="link"
                size="small"
                icon={<CheckOutlined />}
                onClick={() => openResolveModal(record.id)}
                aria-label={t('error_log.marcar_resuelto')}
              >
                {t('error_log.resolver')}
              </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div className="p-4 max-w-6xl mx-auto space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">{t('error_log.titulo')}</h1>
          <p className="text-sm text-gray-500">
            {t('error_log.subtitulo', { total: stats.total, open: stats.open, resolved: stats.resolved, critical: stats.critical })}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-1">
            <DatabaseOutlined className="text-blue-500" />
            <span className="text-sm text-gray-500">{t('error_log.total_errores')}</span>
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.total}</div>
        </div>
        <div className="bg-white dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-1">
            <ExclamationCircleOutlined className="text-orange-500" />
            <span className="text-sm text-gray-500">{t('error_log.abiertos')}</span>
          </div>
          <div className="text-2xl font-bold text-orange-600">{stats.open}</div>
        </div>
        <div className="bg-white dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircleOutlined className="text-green-500" />
            <span className="text-sm text-gray-500">{t('error_log.resueltos')}</span>
          </div>
          <div className="text-2xl font-bold text-green-600">{stats.resolved}</div>
        </div>
        <div className="bg-white dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-1">
            <WarningOutlined className="text-red-500" />
            <span className="text-sm text-gray-500">{t('error_log.criticos')}</span>
          </div>
          <div className="text-2xl font-bold text-red-600">{stats.critical}</div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        <Input
          placeholder={t('error_log.buscar_placeholder')}
          prefix={<SearchOutlined />}
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full sm:w-48 md:w-60"
          aria-label="Buscar errores"
        />
        <Select
          placeholder={t('error_log.filtro_severidad')}
          value={filterSeverity}
          onChange={v => setFilterSeverity(v)}
          allowClear
          className="w-full sm:w-32 md:w-36"
          aria-label="Filtrar por severidad"
          options={['critical', 'error', 'warning', 'info', 'debug'].map(s => ({
            value: s,
            label: severityLabel(t, s),
          }))}
        />
        <Select
          placeholder={t('error_log.filtro_estado')}
          value={filterStatus}
          onChange={v => setFilterStatus(v)}
          allowClear
          className="w-full sm:w-32 md:w-36"
          aria-label="Filtrar por estado"
          options={[
            { value: 'open', label: t('error_log.abierto') },
            { value: 'resolved', label: t('error_log.resuelto') },
          ]}
        />
        <ProyectoFilter
          proyectos={proyectos}
          selectedProyectoId={filterProyecto}
          onChange={setFilterProyecto}
        />
        <RangePicker
          onChange={(_, dateStrings) => setDateRange(dateStrings as [string, string] || null)}
          aria-label="Filtrar por rango de fecha"
        />
      </div>

      <Table<ErrorLogEntry>
        rowKey="id"
        columns={columns}
        dataSource={filtradas}
        pagination={{
          showSizeChanger: true,
          showTotal: (total) => t('error_log.total_paginacion', { total }),
          pageSize: 20,
        }}
        loading={loading}
        scroll={{ x: 1000 }}
        rowSelection={{
          selectedRowKeys,
          onChange: (keys) => setSelectedRowKeys(keys),
        }}
        locale={{
          emptyText: t('error_log.sin_resultados'),
        }}
        rowClassName={(record) => record.resolved ? 'opacity-60' : ''}
      />

      {errorTypeStats.length > 0 && (
        <div className="bg-white dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-semibold mb-3">{t('error_log.grafico_errores_titulo')}</h3>
          <div className="space-y-2">
            {errorTypeStats.map(([type, count]) => {
              const maxCount = errorTypeStats[0]?.[1] || 1;
              const pct = (count / maxCount) * 100;
              return (
                <div key={type} className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 w-20 truncate text-right">{type}</span>
                  <div className="flex-1 h-5 bg-gray-100 dark:bg-gray-800 rounded overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded transition-all duration-500"
                      style={{ width: `${Math.max(pct, count > 0 ? 5 : 0)}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium w-8 text-right">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <Space className="mt-4">
        <Button
          icon={<CheckOutlined />}
          disabled={selectedRowKeys.length === 0}
          onClick={handleBulkResolve}
          aria-label={t('error_log.resolver_seleccionados', { count: selectedRowKeys.length })}
        >
          {t('error_log.resolver_seleccionados', { count: selectedRowKeys.length })}
        </Button>
        <Button
          icon={<DeleteOutlined />}
          danger
          disabled={selectedRowKeys.length === 0}
          onClick={handleBulkDelete}
          aria-label={t('error_log.eliminar_seleccionados', { count: selectedRowKeys.length })}
        >
          {t('error_log.eliminar_seleccionados', { count: selectedRowKeys.length })}
        </Button>
        <Button
          icon={<DownloadOutlined />}
          onClick={handleExportCSV}
          aria-label={t('error_log.exportar_csv')}
        >
          {t('error_log.exportar_csv')}
        </Button>
        <Button
          icon={<ClearOutlined />}
          onClick={handleCleanup}
          aria-label={t('error_log.limpiar_antiguos', { dias: '30' })}
        >
          {t('error_log.limpiar_antiguos', { dias: '30' })}
        </Button>
      </Space>

      <Modal
        title={t('error_log.resolver_modal_titulo')}
        open={resolveModalOpen}
        onCancel={() => setResolveModalOpen(false)}
        onOk={confirmResolve}
        okText={t('error_log.resolver_modal_confirmar')}
        cancelText={t('error_log.resolver_modal_cancelar')}
      >
        <div className="space-y-3">
          <p className="text-sm text-gray-500">
            {selectedError?.errorMessage}
          </p>
          <div>
            <label className="text-sm font-medium mb-1 block">
              {t('error_log.resolver_modal_notas_label')}
            </label>
            <Input.TextArea
              value={resolveNotes}
              onChange={e => setResolveNotes(e.target.value)}
              placeholder={t('error_log.resolver_modal_notas_placeholder')}
              rows={3}
            />
          </div>
        </div>
      </Modal>

      <Modal
        title={t('error_log.detalle_titulo', { id: selectedError?.id?.slice(0, 8) || '' })}
        open={detailModalOpen}
        onCancel={() => setDetailModalOpen(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModalOpen(false)}>
            {t('error_log.cerrar')}
          </Button>,
          !selectedError?.resolved && (
            <Button
              key="resolve"
              type="primary"
              icon={<CheckOutlined />}
              onClick={() => {
                if (selectedError) {
                  openResolveModal(selectedError.id);
                  setDetailModalOpen(false);
                }
              }}
            >
              {t('error_log.marcar_resuelto')}
            </Button>
          ),
        ]}
        width={800}
        style={{ width: '95vw', maxWidth: 800 }}
      >
        {selectedError && (
          <Descriptions bordered column={2} size="small">
            <Descriptions.Item label={t('error_log.detalle_id')} span={2}>
              <code>{selectedError.id}</code>
            </Descriptions.Item>
            <Descriptions.Item label={t('error_log.detalle_tipo')}>
              <Tag>{selectedError.errorType || 'N/A'}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label={t('error_log.detalle_severidad')}>
              <Tag color={SEVERITY_COLORS[selectedError.severity] || 'default'}>
                {severityLabel(t, selectedError.severity)}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label={t('error_log.detalle_estado')}>
              <Badge status={selectedError.resolved ? 'success' : 'error'} text={selectedError.resolved ? t('error_log.resuelto') : t('error_log.abierto')} />
            </Descriptions.Item>
            <Descriptions.Item label={t('error_log.detalle_fecha')}>
              {fmtDate(selectedError.createdAt)}
            </Descriptions.Item>
            <Descriptions.Item label={t('error_log.detalle_componente')} span={2}>
              <code>{selectedError.component || 'N/A'}</code>
            </Descriptions.Item>
            <Descriptions.Item label={t('error_log.detalle_funcion')} span={2}>
              <code>{selectedError.functionName || 'N/A'}</code>
            </Descriptions.Item>
            {selectedError.proyectoId && (
              <Descriptions.Item label={t('error_log.detalle_proyecto')} span={2}>
                {getProyectoNombre(selectedError.proyectoId) || selectedError.proyectoId}
              </Descriptions.Item>
            )}
            <Descriptions.Item label={t('error_log.detalle_mensaje')} span={2}>
              <Alert message={selectedError.errorMessage} type="error" showIcon />
            </Descriptions.Item>
            {selectedError.context && (
              <Descriptions.Item label={t('error_log.detalle_contexto')} span={2}>
                <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded text-xs overflow-auto max-h-32">
                  {JSON.stringify(selectedError.context, null, 2)}
                </pre>
              </Descriptions.Item>
            )}
            {selectedError.errorStack && (
              <Descriptions.Item label={t('error_log.detalle_stack')} span={2}>
                <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded text-xs overflow-auto max-h-64">
                  {selectedError.errorStack}
                </pre>
              </Descriptions.Item>
            )}
            {selectedError.resolved && (
              <>
                <Descriptions.Item label={t('error_log.detalle_resuelto_por')}>
                  {selectedError.resolvedBy || 'Sistema'}
                </Descriptions.Item>
                <Descriptions.Item label={t('error_log.detalle_fecha_resolucion')}>
                  {fmtDate(selectedError.resolvedAt)}
                </Descriptions.Item>
                {selectedError.resolutionNotes && (
                  <Descriptions.Item label={t('error_log.detalle_notas')} span={2}>
                    {selectedError.resolutionNotes}
                  </Descriptions.Item>
                )}
              </>
            )}
          </Descriptions>
        )}
      </Modal>
    </div>
  );
}