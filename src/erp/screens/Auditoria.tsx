import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useErp } from '../store';
import type { LogAuditoria } from '../store';
import { Search, Download, Eye, History } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

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

function getAccionBadgeClass(acc: string): string {
  if (acc === 'crear' || acc === 'clonar' || acc === 'importar' || acc === 'crear_proyecto_desde_plantilla')
    return 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300';
  if (acc === 'eliminar' || acc === 'eliminar_todo')
    return 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300';
  return 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300';
}

export default function Auditoria() {
  const [loading, setLoading] = useState(true);
  useEffect(() => { const t = setTimeout(() => setLoading(false), 400); return () => clearTimeout(t); }, []);
  const { t } = useTranslation();
  const { auditLog, proyectos } = useErp();

  const [search, setSearch] = React.useState('');
  const [filterEntidad, setFilterEntidad] = React.useState<string | null>(null);
  const [filterAccion, setFilterAccion] = React.useState<string | null>(null);
  const [filterUsuario, setFilterUsuario] = React.useState<string | null>(null);
  const [currentProjectId, setCurrentProjectId] = React.useState('');
  const [dateFrom, setDateFrom] = React.useState('');
  const [dateTo, setDateTo] = React.useState('');
  const [detailModalOpen, setDetailModalOpen] = React.useState(false);
  const [selectedEntry, setSelectedEntry] = React.useState<LogAuditoria | null>(null);
  const [sortKey, setSortKey] = React.useState<string>('createdAt');
  const [sortOrder, setSortOrder] = React.useState<'asc' | 'desc'>('desc');
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(20);

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

  const filtradas = React.useMemo(() => auditLog
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
      if (!dateFrom && !dateTo) return true;
      const d = new Date(e.createdAt).getTime();
      const from = dateFrom ? new Date(dateFrom).getTime() : 0;
      const to = dateTo ? new Date(dateTo + 'T23:59:59').getTime() : Infinity;
      return d >= from && d <= to;
    }), [auditLog, filterEntidad, filterAccion, filterUsuario, currentProjectId, search, dateFrom, dateTo]);

  const sorted = React.useMemo(() => {
    const arr = [...filtradas];
    arr.sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'createdAt') cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      else if (sortKey === 'usuarioNombre') cmp = a.usuarioNombre.localeCompare(b.usuarioNombre);
      else if (sortKey === 'entidad') cmp = a.entidad.localeCompare(b.entidad);
      else if (sortKey === 'accion') cmp = a.accion.localeCompare(b.accion);
      else if (sortKey === 'entidadId') cmp = (a.entidadId || '').localeCompare(b.entidadId || '');
      return sortOrder === 'asc' ? cmp : -cmp;
    });
    return arr;
  }, [filtradas, sortKey, sortOrder]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paginated = sorted.slice((safePage - 1) * pageSize, safePage * pageSize);

  const stats = React.useMemo(() => ({
    total: auditLog.length,
    creaciones: auditLog.filter(e => e.accion === 'crear' || e.accion === 'clonar' || e.accion === 'importar' || e.accion === 'crear_proyecto_desde_plantilla').length,
    actualizaciones: auditLog.filter(e => e.accion === 'actualizar' || e.accion === 'actualizar_presupuesto' || e.accion.startsWith('cambio_estado')).length,
    eliminaciones: auditLog.filter(e => e.accion === 'eliminar' || e.accion === 'eliminar_todo').length,
  }), [auditLog]);

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

  const toggleSort = (key: string) => {
    if (sortKey === key) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('asc');
    }
    setPage(1);
  };

  const sortArrow = (key: string) => {
    if (sortKey !== key) return <span className="ml-1 text-muted-foreground/40">&#8597;</span>;
    return <span className="ml-1">{sortOrder === 'asc' ? '▲' : '▼'}</span>;
  };

  const columnHeaders = [
    { key: 'createdAt', label: t('auditoria.columna_fecha'), sortable: true, className: 'w-[170px]' },
    { key: 'usuarioNombre', label: t('auditoria.columna_usuario'), sortable: true, className: 'w-[140px]' },
    { key: 'entidad', label: t('auditoria.columna_tabla'), sortable: true, className: 'w-[130px]' },
    { key: 'accion', label: t('auditoria.columna_operacion'), sortable: true, className: 'w-[160px]' },
    { key: 'entidadId', label: t('auditoria.columna_id'), sortable: true, className: 'w-[120px]' },
    { key: 'actions', label: t('auditoria.columna_detalles'), sortable: false, className: 'w-[100px]' },
  ];

  if (loading) {
    return (
      <div className="p-4 sm:p-6 max-w-[1600px] mx-auto space-y-4">
        <Skeleton className="h-8 w-64 rounded-lg" />
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="p-4 max-w-[1600px] mx-auto space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-lg sm:text-xl font-black text-foreground flex items-center gap-2">
            <History className="h-6 w-6 text-purple-500" aria-hidden="true" />
            {t('auditoria.titulo')}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t('auditoria.total', { total: stats.total })} · {t('auditoria.creaciones', { count: stats.creaciones })} · {t('auditoria.actualizaciones', { count: stats.actualizaciones })} · {t('auditoria.eliminaciones', { count: stats.eliminaciones })}
          </p>
        </div>
        <button
          onClick={handleExportCSV}
          disabled={filtradas.length === 0}
          className="inline-flex items-center justify-center rounded-lg px-3 py-1.5 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm disabled:opacity-50 disabled:pointer-events-none"
          aria-label={t('auditoria.exportar_csv')}
        >
          <Download className="h-4 w-4 mr-1.5" aria-hidden="true" />
          {t('auditoria.exportar_csv')}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-500 mb-1">{t('auditoria.total')}</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.total}</div>
        </div>
        <div className="bg-card dark:bg-gray-900 p-4 rounded-lg border border-emerald-200 dark:border-emerald-800">
          <div className="text-sm text-emerald-600 dark:text-emerald-400 mb-1">{t('auditoria.creaciones')}</div>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{stats.creaciones}</div>
        </div>
        <div className="bg-card dark:bg-gray-900 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="text-sm text-blue-600 dark:text-blue-400 mb-1">{t('auditoria.actualizaciones')}</div>
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.actualizaciones}</div>
        </div>
        <div className="bg-card dark:bg-gray-900 p-4 rounded-lg border border-red-200 dark:border-red-800">
          <div className="text-sm text-red-600 dark:text-red-400 mb-1">{t('auditoria.eliminaciones')}</div>
          <div className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.eliminaciones}</div>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        <select
          className="flex h-9 w-40 rounded-lg border border-input bg-background px-3 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          value={filterEntidad || ''}
          onChange={e => { setFilterEntidad(e.target.value || null); setPage(1); }}
          aria-label={t('auditoria.filtro_tabla')}
        >
          <option value="">{t('auditoria.filtro_tabla')}</option>
          {entidadesUnicas.map(e => (
            <option key={e} value={e}>{normalizeEntidad(e)}</option>
          ))}
        </select>
        <select
          className="flex h-9 w-40 rounded-lg border border-input bg-background px-3 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          value={filterAccion || ''}
          onChange={e => { setFilterAccion(e.target.value || null); setPage(1); }}
          aria-label={t('auditoria.filtro_operacion')}
        >
          <option value="">{t('auditoria.filtro_operacion')}</option>
          {accionesUnicas.map(a => (
            <option key={a} value={a}>{getLabelKey(a, t)}</option>
          ))}
        </select>
        <select
          className="flex h-9 w-40 rounded-lg border border-input bg-background px-3 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          value={filterUsuario || ''}
          onChange={e => { setFilterUsuario(e.target.value || null); setPage(1); }}
          aria-label={t('auditoria.filtro_usuario')}
        >
          <option value="">{t('auditoria.filtro_usuario')}</option>
          {usuariosUnicos.map(u => (
            <option key={u} value={u}>{u}</option>
          ))}
        </select>
        <div className="flex items-center gap-1">
          <input
            type="date"
            className="flex h-9 rounded-lg border border-input bg-background px-2 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            value={dateFrom}
            onChange={e => { setDateFrom(e.target.value); setPage(1); }}
            aria-label={t('auditoria.filtro_fecha_desde')}
          />
          <span className="text-muted-foreground text-sm">–</span>
          <input
            type="date"
            className="flex h-9 rounded-lg border border-input bg-background px-2 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            value={dateTo}
            onChange={e => { setDateTo(e.target.value); setPage(1); }}
            aria-label={t('auditoria.filtro_fecha_hasta')}
          />
        </div>
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
          <input
            className="flex h-9 w-full rounded-lg border border-input bg-background pl-8 pr-8 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            placeholder={t('auditoria.buscar_placeholder')}
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            aria-label={t('auditoria.buscar_placeholder')}
          />
          {search && (
            <button
              onClick={() => { setSearch(''); setPage(1); }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-sm leading-none"
              aria-label="Clear search"
            >
              X
            </button>
          )}
        </div>
      </div>

      {paginated.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          {t('auditoria.sin_resultados')}
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table role="table" className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  {columnHeaders.map(col => (
                    <th
                      key={col.key}
                      className={`text-left p-3 text-sm font-semibold ${col.className} ${col.sortable ? 'cursor-pointer select-none hover:bg-muted/70' : ''}`}
                      onClick={() => col.sortable && toggleSort(col.key)}
                      scope="col"
                    >
                      <div className="flex items-center">
                        {col.label}
                        {col.sortable && sortArrow(col.key)}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginated.map(row => (
                  <tr key={row.id} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="p-3 text-sm whitespace-nowrap">{fmtDate(row.createdAt)}</td>
                    <td className="p-3 text-sm whitespace-nowrap">{row.usuarioNombre}</td>
                    <td className="p-3 text-sm whitespace-nowrap">{normalizeEntidad(row.entidad)}</td>
                    <td className="p-3 text-sm whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium inline-block ${getAccionBadgeClass(row.accion)}`}>
                        {getLabelKey(row.accion, t)}
                      </span>
                    </td>
                    <td className="p-3 text-sm whitespace-nowrap">
                      {row.entidadId ? <code className="text-xs">{row.entidadId.slice(0, 8)}</code> : null}
                    </td>
                    <td className="p-3 text-sm whitespace-nowrap">
                      <button
                        onClick={() => showDetail(row)}
                        className="inline-flex items-center justify-center rounded-lg p-1.5 text-sm font-medium text-primary hover:bg-primary/10"
                        title={t('auditoria.ver')}
                        aria-label={t('auditoria.ver')}
                      >
                        <Eye className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">{t('auditoria.total_paginacion', { total: sorted.length })}</span>
              <select
                className="flex h-8 rounded-lg border border-input bg-background px-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={pageSize}
                onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }}
                aria-label="Page size"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={safePage <= 1}
                className="inline-flex items-center justify-center rounded-lg px-3 py-1.5 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm disabled:opacity-50 disabled:pointer-events-none"
              >
                &lt;
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const start = Math.max(1, safePage - 2);
                const pageNum = start + i;
                if (pageNum > totalPages) return null;
                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={`inline-flex items-center justify-center rounded-lg px-3 py-1.5 text-sm font-medium ${
                      pageNum === safePage
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={safePage >= totalPages}
                className="inline-flex items-center justify-center rounded-lg px-3 py-1.5 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm disabled:opacity-50 disabled:pointer-events-none"
              >
                &gt;
              </button>
            </div>
          </div>
        </>
      )}

      {detailModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => { setDetailModalOpen(false); setSelectedEntry(null); }}>
          <div className="bg-card border border-border rounded-xl shadow-2xl p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold truncate" title={t('auditoria.detalle_titulo', { id: selectedEntry?.id.slice(0, 8) || '' })}>{t('auditoria.detalle_titulo', { id: selectedEntry?.id.slice(0, 8) || '' })}</h3>
              <button onClick={() => { setDetailModalOpen(false); setSelectedEntry(null); }} className="text-muted-foreground hover:text-foreground p-1" aria-label={t('auditoria.cerrar')}>X</button>
            </div>
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
            <div className="flex justify-end mt-4">
              <button
                onClick={() => { setDetailModalOpen(false); setSelectedEntry(null); }}
                className="inline-flex items-center justify-center rounded-lg px-3 py-1.5 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
              >
                {t('auditoria.cerrar')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
