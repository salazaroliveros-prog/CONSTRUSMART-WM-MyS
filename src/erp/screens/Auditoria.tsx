import React from 'react';
import { useTranslation } from 'react-i18next';
import { useErp } from '../store';
import type { LogAuditoria } from '../store';
import { Table, Button, Modal, Input, Space, Select, DatePicker, Skeleton, Tooltip } from 'antd';
import { SearchOutlined, DownloadOutlined, EyeOutlined, HistoryOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

const { RangePicker } = DatePicker;

function fmtDate(iso?: string): string {
  if (!iso) return '';
  return new Date(iso).toLocaleString('es-ES', {
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

function getLabelKey(accion: string, t: (k: string) => string): string {
  const map: Record<string, string> = {
    crear: t('auditoria.operacion_creacion'),
    'cambio_estado': t('auditoria.operacion_actualizacion'),
    eliminar: t('auditoria.operacion_eliminacion'),
    eliminar_todo: t('auditoria.operacion_eliminacion'),
    clonar: t('auditoria.operacion_creacion'),
    importar: t('auditoria.operacion_creacion'),
    actualizar_presupuesto: t('auditoria.operacion_actualizacion'),
    'crear_proyecto_desde_plantilla': t('auditoria.operacion_creacion'),
    actualizar: t('auditoria.operacion_actualizacion'),
  };
  return map[accion] || accion;
}

function normalizeEntidad(entidad: string): string {
  const map: Record<string, string> = {
    proyecto: 'Proyectos',
    presupuesto: 'Presupuestos',
    plantilla: 'Plantillas',
  };
  return map[entidad] || entidad.charAt(0).toUpperCase() + entidad.slice(1);
}

export default function Auditoria() {
  const { t } = useTranslation();
  const { auditLog, proyectos } = useErp();

  const [search, setSearch] = React.useState('');
  const [filterEntidad, setFilterEntidad] = React.useState<string | null>(null);
  const [filterAccion, setFilterAccion] = React.useState<string | null>(null);
  const [filterUsuario, setFilterUsuario] = React.useState<string | null>(null);
  const [currentProjectId, setCurrentProjectId] = React.useState('');
  const [dateRange, setDateRange] = React.useState<[string | null, string | null] | null>(null);
  const [detailModalOpen, setDetailModalOpen] = React.useState(false);
  const [selectedEntry, setSelectedEntry] = React.useState<LogAuditoria | null>(null);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => { setLoading(false); }, []);

  const entidadesUnicas = React.useMemo(() => {
    const set = new Set(auditLog.map(e => e.entidad));
    return Array.from(set).sort();
  }, [auditLog]);

  const accionesUnicas = React.useMemo(() => {
    const set = new Set(auditLog.map(e => e.accion));
    return Array.from(set).sort();
  }, [auditLog]);

  const usuariosUnicos = React.useMemo(() => {
    const set = new Set(auditLog.map(e => e.usuarioNombre));
    return Array.from(set).sort();
  }, [auditLog]);

  const filtradas = auditLog
    .filter(e => !filterEntidad || e.entidad === filterEntidad)
    .filter(e => !filterAccion || e.accion === filterAccion)
    .filter(e => !filterUsuario || e.usuarioNombre === filterUsuario)
    .filter(e => !currentProjectId || e.entidadId === currentProjectId)
    .filter(e => !search ||
      e.usuarioNombre.toLowerCase().includes(search.toLowerCase()) ||
      e.accion.toLowerCase().includes(search.toLowerCase()) ||
      e.entidad.toLowerCase().includes(search.toLowerCase()) ||
      e.entidadId?.toLowerCase().includes(search.toLowerCase())
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
    creaciones: auditLog.filter(e => e.accion === 'crear' || e.accion === 'clonar' || e.accion === 'importar' || e.accion === 'crear_proyecto_desde_plantilla').length,
    actualizaciones: auditLog.filter(e => e.accion === 'actualizar' || e.accion === 'actualizar_presupuesto' || e.accion.startsWith('cambio_estado')).length,
    eliminaciones: auditLog.filter(e => e.accion === 'eliminar' || e.accion === 'eliminar_todo').length,
  };

  const showDetail = (record: LogAuditoria) => {
    setSelectedEntry(record);
    setDetailModalOpen(true);
  };

  const handleExportCSV = () => {
    const headers = ['ID', t('auditoria.columna_fecha'), t('auditoria.columna_usuario'), t('auditoria.columna_tabla'), t('auditoria.columna_operacion'), t('auditoria.columna_id')];
    const rows = filtradas.map(e => [
      e.id.slice(0, 8),
      e.createdAt,
      `"${e.usuarioNombre.replace(/"/g, '""')}"`,
      normalizeEntidad(e.entidad),
      getLabelKey(e.accion, t),
      e.entidadId || '',
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

  const columns: ColumnsType<LogAuditoria> = [
    {
      title: t('auditoria.columna_fecha'),
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 170,
      render: (date: string) => fmtDate(date),
      sorter: (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      defaultSortOrder: 'descend',
    },
    {
      title: t('auditoria.columna_usuario'),
      dataIndex: 'usuarioNombre',
      key: 'usuarioNombre',
      width: 140,
      sorter: (a, b) => a.usuarioNombre.localeCompare(b.usuarioNombre),
    },
    {
      title: t('auditoria.columna_tabla'),
      dataIndex: 'entidad',
      key: 'entidad',
      width: 130,
      render: (ent: string) => normalizeEntidad(ent),
    },
    {
      title: t('auditoria.columna_operacion'),
      dataIndex: 'accion',
      key: 'accion',
      width: 160,
      render: (acc: string) => (
        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
          acc === 'crear' || acc === 'clonar' || acc === 'importar' || acc === 'crear_proyecto_desde_plantilla'
            ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300'
            : acc === 'eliminar' || acc === 'eliminar_todo'
              ? 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300'
              : 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300'
        }`}>
          {getLabelKey(acc, t)}
        </span>
      ),
    },
    {
      title: t('auditoria.columna_id'),
      dataIndex: 'entidadId',
      key: 'entidadId',
      width: 120,
      render: (id?: string) => id ? <code className="text-xs">{id.slice(0, 8)}</code> : null,
    },
    {
      title: t('auditoria.columna_detalles'),
      key: 'actions',
      width: 100,
      render: (_, record) => (
        <Tooltip title={t('auditoria.ver')}>
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => showDetail(record)}
            aria-label={t('auditoria.ver')}
          />
        </Tooltip>
      ),
    },
  ];

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

  return (
    <div className="p-4 max-w-6xl mx-auto space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <HistoryOutlined className="text-purple-500" aria-hidden="true" />
            {t('auditoria.titulo')}
          </h1>
          <p className="text-sm text-gray-500">
            {t('auditoria.total', { total: stats.total })} · {t('auditoria.creaciones', { count: stats.creaciones })} · {t('auditoria.actualizaciones', { count: stats.actualizaciones })} · {t('auditoria.eliminaciones', { count: stats.eliminaciones })}
          </p>
        </div>
        <Button
          icon={<DownloadOutlined />}
          onClick={handleExportCSV}
          disabled={filtradas.length === 0}
          aria-label={t('auditoria.exportar_csv')}
        >
          {t('auditoria.exportar_csv')}
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-500 mb-1">{t('auditoria.total')}</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.total}</div>
        </div>
        <div className="bg-card dark:bg-gray-900 p-4 rounded-lg border border-emerald-200 dark:border-emerald-800">
          <div className="text-sm text-emerald-600 dark:text-emerald-400 mb-1">{t('auditoria.creaciones')}</div>
          <div className="text-2xl font-bold text-emerald-600">{stats.creaciones}</div>
        </div>
        <div className="bg-card dark:bg-gray-900 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="text-sm text-blue-600 dark:text-blue-400 mb-1">{t('auditoria.actualizaciones')}</div>
          <div className="text-2xl font-bold text-blue-600">{stats.actualizaciones}</div>
        </div>
        <div className="bg-card dark:bg-gray-900 p-4 rounded-lg border border-red-200 dark:border-red-800">
          <div className="text-sm text-red-600 dark:text-red-400 mb-1">{t('auditoria.eliminaciones')}</div>
          <div className="text-2xl font-bold text-red-600">{stats.eliminaciones}</div>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        <Select
          allowClear
          placeholder={t('auditoria.filtro_tabla')}
          style={{ width: 160 }}
          value={filterEntidad}
          onChange={setFilterEntidad}
          options={entidadesUnicas.map(e => ({ label: normalizeEntidad(e), value: e }))}
          aria-label={t('auditoria.filtro_tabla')}
        />
        <Select
          allowClear
          placeholder={t('auditoria.filtro_operacion')}
          style={{ width: 160 }}
          value={filterAccion}
          onChange={setFilterAccion}
          options={accionesUnicas.map(a => ({ label: getLabelKey(a, t), value: a }))}
          aria-label={t('auditoria.filtro_operacion')}
        />
        <Select
          allowClear
          placeholder={t('auditoria.filtro_usuario')}
          style={{ width: 160 }}
          value={filterUsuario}
          onChange={setFilterUsuario}
          options={usuariosUnicos.map(u => ({ label: u, value: u }))}
          aria-label={t('auditoria.filtro_usuario')}
        />
        <RangePicker
          onChange={(dates) => {
            if (dates && dates[0] && dates[1]) {
              setDateRange([dates[0].toISOString(), dates[1].toISOString()]);
            } else {
              setDateRange(null);
            }
          }}
          aria-label={t('auditoria.filtro_fecha')}
        />
        <div className="flex-1 min-w-[200px]">
          <Input.Search
            placeholder={t('auditoria.buscar_placeholder')}
            value={search}
            onChange={e => setSearch(e.target.value)}
            prefix={<SearchOutlined />}
            allowClear
            aria-label={t('auditoria.buscar_placeholder')}
          />
        </div>
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
        scroll={{ x: 900 }}
        locale={{ emptyText: t('auditoria.sin_resultados') }}
        rowClassName="text-sm"
      />

      <Modal
        title={t('auditoria.detalle_titulo', { id: selectedEntry?.id.slice(0, 8) || '' })}
        open={detailModalOpen}
        onCancel={() => { setDetailModalOpen(false); setSelectedEntry(null); }}
        footer={<Button onClick={() => { setDetailModalOpen(false); setSelectedEntry(null); }}>{t('auditoria.cerrar')}</Button>}
        width={640}
      >
        {selectedEntry && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-gray-500">{t('auditoria.columna_fecha')}:</span> <span className="font-medium">{fmtDate(selectedEntry.createdAt)}</span></div>
              <div><span className="text-gray-500">{t('auditoria.columna_usuario')}:</span> <span className="font-medium">{selectedEntry.usuarioNombre}</span></div>
              <div><span className="text-gray-500">{t('auditoria.columna_tabla')}:</span> <span className="font-medium">{normalizeEntidad(selectedEntry.entidad)}</span></div>
              <div><span className="text-gray-500">{t('auditoria.columna_operacion')}:</span> <span className="font-medium">{getLabelKey(selectedEntry.accion, t)}</span></div>
              {selectedEntry.entidadId && (
                <div><span className="text-gray-500">{t('auditoria.columna_id')}:</span> <code className="font-medium text-xs">{selectedEntry.entidadId}</code></div>
              )}
            </div>
            {selectedEntry.valoresAnteriores && Object.keys(selectedEntry.valoresAnteriores).length > 0 && (
              <div>
                <h4 className="font-semibold text-sm mb-1">{t('auditoria.datos_anteriores')}</h4>
                <pre className="text-xs bg-gray-100 dark:bg-gray-800 p-3 rounded max-h-48 overflow-auto">{JSON.stringify(selectedEntry.valoresAnteriores, null, 2)}</pre>
              </div>
            )}
            {selectedEntry.valoresNuevos && Object.keys(selectedEntry.valoresNuevos).length > 0 && (
              <div>
                <h4 className="font-semibold text-sm mb-1">{t('auditoria.datos_nuevos')}</h4>
                <pre className="text-xs bg-gray-100 dark:bg-gray-800 p-3 rounded max-h-48 overflow-auto">{JSON.stringify(selectedEntry.valoresNuevos, null, 2)}</pre>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
