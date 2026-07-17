import React from 'react';
import { useTranslation } from 'react-i18next';
import { useErp } from '../store';
import ProyectoFilter from '../components/ProyectoFilter';
import { Search, Check, Trash2, Download, Eraser, Eye, AlertCircle, CheckCircle, AlertTriangle, Database } from 'lucide-react';
import type { ErrorLogEntry } from '../store/schemas/errorLog';

const SEVERITY_COLORS: Record<string, string> = {
  critical: 'text-red-600 bg-red-100 dark:bg-red-900/30 border-red-200 dark:border-red-800',
  error: 'text-red-600 bg-red-100 dark:bg-red-900/30 border-red-200 dark:border-red-800',
  warning: 'text-orange-600 bg-orange-100 dark:bg-orange-900/30 border-orange-200 dark:border-orange-800',
  info: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800',
  debug: 'text-gray-600 bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700',
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

type SortDir = 'ascend' | 'descend' | null;

export default function ErrorLog() {
  const { t } = useTranslation();
  const { errorLogs, resolveError, deleteError, cleanupOldErrors, proyectos, user } = useErp();
  const [search, setSearch] = React.useState('');
  const [filterSeverity, setFilterSeverity] = React.useState<string | null>(null);
  const [filterStatus, setFilterStatus] = React.useState<string | null>(null);
  const [currentProjectId, setcurrentProjectId] = React.useState('');
  const [dateFrom, setDateFrom] = React.useState('');
  const [dateTo, setDateTo] = React.useState('');
  const [detailModalOpen, setDetailModalOpen] = React.useState(false);
  const [selectedError, setSelectedError] = React.useState<ErrorLogEntry | null>(null);
  const [resolveModalOpen, setResolveModalOpen] = React.useState(false);
  const [resolveNotes, setResolveNotes] = React.useState('');
  const [selectedRowKeys, setSelectedRowKeys] = React.useState<string[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [sortKey, setSortKey] = React.useState<string>('createdAt');
  const [sortDir, setSortDir] = React.useState<SortDir>('descend');
  const [page, setPage] = React.useState(1);
  const pageSize = 20;

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
    .filter(e => !currentProjectId || e.proyectoId === currentProjectId)
    .filter(e => !search ||
      e.errorMessage.toLowerCase().includes(search.toLowerCase()) ||
      e.errorCode?.toLowerCase().includes(search.toLowerCase()) ||
      e.component?.toLowerCase().includes(search.toLowerCase()) ||
      e.functionName?.toLowerCase().includes(search.toLowerCase())
    )
    .filter(e => {
      if (!dateFrom && !dateTo) return true;
      const d = new Date(e.createdAt).getTime();
      const from = dateFrom ? new Date(dateFrom).getTime() : 0;
      const to = dateTo ? new Date(dateTo).getTime() : Infinity;
      return d >= from && d <= to;
    })
    .slice()
    .sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'id') cmp = a.id.localeCompare(b.id);
      else if (sortKey === 'createdAt') cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      else if (sortKey === 'severity') cmp = (a.severity || '').localeCompare(b.severity || '');
      else if (sortKey === 'errorType') cmp = (a.errorType || '').localeCompare(b.errorType || '');
      else if (sortKey === 'errorMessage') cmp = a.errorMessage.localeCompare(b.errorMessage);
      return sortDir === 'descend' ? -cmp : cmp;
    });

  const totalPages = Math.ceil(filtradas.length / pageSize);
  const pageData = filtradas.slice((page - 1) * pageSize, page * pageSize);

  const stats = React.useMemo(() => ({
    total: errorLogs.length,
    open: errorLogs.filter(e => !e.resolved).length,
    resolved: errorLogs.filter(e => e.resolved).length,
    critical: errorLogs.filter(e => e.severity === 'critical' && !e.resolved).length,
  }), [errorLogs]);

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

  const toggleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir(prev => prev === 'ascend' ? 'descend' : prev === 'descend' ? null : 'ascend');
    } else {
      setSortKey(key);
      setSortDir('ascend');
    }
    setPage(1);
  };

  const toggleSelectAll = () => {
    if (selectedRowKeys.length === pageData.length) {
      setSelectedRowKeys([]);
    } else {
      setSelectedRowKeys(pageData.map(r => r.id));
    }
  };

  const toggleRow = (id: string) => {
    setSelectedRowKeys(prev =>
      prev.includes(id) ? prev.filter(k => k !== id) : [...prev, id]
    );
  };

  if (loading) {
    return (
      <div className="p-4 max-w-6xl mx-auto space-y-4">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          ))}
        </div>
        <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
      </div>
    );
  }

  const sortIndicator = (key: string) => {
    if (sortKey !== key) return null;
    return sortDir === 'ascend' ? ' ▲' : sortDir === 'descend' ? ' ▼' : null;
  };

  const thClass = (key: string) =>
    `px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground cursor-pointer select-none hover:text-foreground transition-colors`;

  return (
    <div className="p-4 max-w-6xl mx-auto space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">{t('error_log.titulo')}</h1>
          <p className="text-sm text-muted-foreground">
            {t('error_log.subtitulo', { total: stats.total, open: stats.open, resolved: stats.resolved, critical: stats.critical })}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card p-4 rounded-lg border border-border">
          <div className="flex items-center gap-2 mb-1">
            <Database className="w-4 h-4 text-blue-500" />
            <span className="text-sm text-muted-foreground">{t('error_log.total_errores')}</span>
          </div>
          <div className="text-2xl font-bold text-foreground">{stats.total}</div>
        </div>
        <div className="bg-card p-4 rounded-lg border border-border">
          <div className="flex items-center gap-2 mb-1">
            <AlertCircle className="w-4 h-4 text-amber-500" />
            <span className="text-sm text-muted-foreground">{t('error_log.abiertos')}</span>
          </div>
          <div className="text-2xl font-bold text-orange-600">{stats.open}</div>
        </div>
        <div className="bg-card p-4 rounded-lg border border-border">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span className="text-sm text-muted-foreground">{t('error_log.resueltos')}</span>
          </div>
          <div className="text-2xl font-bold text-green-600">{stats.resolved}</div>
        </div>
        <div className="bg-card p-4 rounded-lg border border-border">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="w-4 h-4 text-red-500" />
            <span className="text-sm text-muted-foreground">{t('error_log.criticos')}</span>
          </div>
          <div className="text-2xl font-bold text-red-600">{stats.critical}</div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder={t('error_log.buscar_placeholder')}
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full sm:w-48 md:w-60 h-9 pl-9 pr-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            aria-label="Buscar errores"
          />
        </div>
        <select
          value={filterSeverity || ''}
          onChange={e => setFilterSeverity(e.target.value || null)}
          className="h-9 rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          aria-label="Filtrar por severidad"
        >
          <option value="">{t('error_log.filtro_severidad')}</option>
          {['critical', 'error', 'warning', 'info', 'debug'].map(s => (
            <option key={s} value={s}>{severityLabel(t, s)}</option>
          ))}
        </select>
        <select
          value={filterStatus || ''}
          onChange={e => setFilterStatus(e.target.value || null)}
          className="h-9 rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          aria-label="Filtrar por estado"
        >
          <option value="">{t('error_log.filtro_estado')}</option>
          <option value="open">{t('error_log.abierto')}</option>
          <option value="resolved">{t('error_log.resuelto')}</option>
        </select>
        <ProyectoFilter
          proyectos={proyectos}
          selectedProyectoId={currentProjectId}
          onChange={setcurrentProjectId}
        />
        <input
          type="date"
          value={dateFrom}
          onChange={e => setDateFrom(e.target.value)}
          className="h-9 rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          aria-label="Fecha desde"
        />
        <input
          type="date"
          value={dateTo}
          onChange={e => setDateTo(e.target.value)}
          className="h-9 rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          aria-label="Fecha hasta"
        />
      </div>

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm" role="table">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="px-3 py-2 text-left w-10">
                  <input
                    type="checkbox"
                    checked={pageData.length > 0 && selectedRowKeys.length === pageData.length}
                    onChange={toggleSelectAll}
                    className="rounded border-border"
                    aria-label="Seleccionar todos"
                  />
                </th>
                <th className={thClass('id')} onClick={() => toggleSort('id')}>
                  {t('error_log.columna_id')}{sortIndicator('id')}
                </th>
                <th className={thClass('errorType')} onClick={() => toggleSort('errorType')}>
                  {t('error_log.columna_tipo')}{sortIndicator('errorType')}
                </th>
                <th className={thClass('severity')} onClick={() => toggleSort('severity')}>
                  {t('error_log.columna_severidad')}{sortIndicator('severity')}
                </th>
                <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {t('error_log.columna_estado')}
                </th>
                <th className={thClass('errorMessage')} onClick={() => toggleSort('errorMessage')}>
                  {t('error_log.columna_mensaje')}{sortIndicator('errorMessage')}
                </th>
                <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {t('error_log.columna_componente')}
                </th>
                <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {t('error_log.columna_proyecto')}
                </th>
                <th className={thClass('createdAt')} onClick={() => toggleSort('createdAt')}>
                  {t('error_log.columna_fecha')}{sortIndicator('createdAt')}
                </th>
                <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {t('error_log.columna_acciones')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {pageData.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-3 py-12 text-center text-muted-foreground">
                    {t('error_log.sin_resultados')}
                  </td>
                </tr>
              ) : (
                pageData.map(record => (
                  <tr
                    key={record.id}
                    className={`hover:bg-muted/30 transition-colors ${record.resolved ? 'opacity-60' : ''}`}
                  >
                    <td className="px-3 py-2">
                      <input
                        type="checkbox"
                        checked={selectedRowKeys.includes(record.id)}
                        onChange={() => toggleRow(record.id)}
                        className="rounded border-border"
                        aria-label={`Seleccionar ${record.id.slice(0, 8)}`}
                      />
                    </td>
                    <td className="px-3 py-2 font-mono text-xs text-muted-foreground">
                      {record.id.slice(0, 8)}
                    </td>
                    <td className="px-3 py-2">
                      {record.errorType && (
                        <span className="inline-flex px-2 py-0.5 rounded text-xs font-medium border border-border bg-muted text-muted-foreground">
                          {record.errorType}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium border ${SEVERITY_COLORS[record.severity] || 'text-gray-600 bg-gray-100 border-gray-200'}`}>
                        {severityLabel(t, record.severity)}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <span className="inline-flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${record.resolved ? 'bg-green-500' : 'bg-red-500'}`} />
                        <span className="text-xs">{record.resolved ? t('error_log.resuelto') : t('error_log.abierto')}</span>
                      </span>
                    </td>
                    <td className="px-3 py-2 max-w-[200px] truncate" title={record.errorMessage}>
                      <span className="text-xs">{record.errorMessage}</span>
                    </td>
                    <td className="px-3 py-2">
                      {record.component ? (
                        <code className="text-xs bg-muted px-2 py-1 rounded">{record.component}</code>
                      ) : null}
                    </td>
                    <td className="px-3 py-2 text-xs text-muted-foreground">
                      {getProyectoNombre(record.proyectoId) || '-'}
                    </td>
                    <td className="px-3 py-2 text-xs text-muted-foreground whitespace-nowrap">
                      {fmtDate(record.createdAt)}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex gap-1">
                        <button
                          onClick={() => showDetail(record)}
                          className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                          aria-label={t('error_log.ver')}
                          title={t('error_log.ver')}
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {!record.resolved && (
                          <button
                            onClick={() => openResolveModal(record.id)}
                            className="p-1.5 rounded text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
                            aria-label={t('error_log.marcar_resuelto')}
                            title={t('error_log.marcar_resuelto')}
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-3 py-2 border-t border-border">
            <span className="text-xs text-muted-foreground">
              {t('error_log.total_paginacion', { total: filtradas.length })}
            </span>
            <div className="flex gap-1">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-3 py-1 text-xs rounded border border-border hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Anterior
              </button>
              <span className="px-3 py-1 text-xs text-muted-foreground">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="px-3 py-1 text-xs rounded border border-border hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>

      {errorTypeStats.length > 0 && (
        <div className="bg-card p-4 rounded-lg border border-border">
          <h3 className="text-sm font-semibold mb-3">{t('error_log.grafico_errores_titulo')}</h3>
          <div className="space-y-2">
            {errorTypeStats.map(([type, count]) => {
              const maxCount = errorTypeStats[0]?.[1] || 1;
              const pct = (count / maxCount) * 100;
              return (
                <div key={type} className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground w-20 truncate text-right">{type}</span>
                  <div className="flex-1 h-5 bg-muted rounded overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded transition-all duration-500"
                      style={{ width: `${Math.max(pct, count > 0 ? 5 : 0)}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium w-8 text-right text-foreground">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex gap-2 mt-4">
        <button
          onClick={handleBulkResolve}
          disabled={selectedRowKeys.length === 0}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          aria-label={t('error_log.resolver_seleccionados', { count: selectedRowKeys.length })}
        >
          <Check className="w-4 h-4" />
          {t('error_log.resolver_seleccionados', { count: selectedRowKeys.length })}
        </button>
        <button
          onClick={handleBulkDelete}
          disabled={selectedRowKeys.length === 0}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          aria-label={t('error_log.eliminar_seleccionados', { count: selectedRowKeys.length })}
        >
          <Trash2 className="w-4 h-4" />
          {t('error_log.eliminar_seleccionados', { count: selectedRowKeys.length })}
        </button>
        <button
          onClick={handleExportCSV}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-border bg-background hover:bg-muted transition-colors"
          aria-label={t('error_log.exportar_csv')}
        >
          <Download className="w-4 h-4" />
          {t('error_log.exportar_csv')}
        </button>
        <button
          onClick={handleCleanup}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-border bg-background hover:bg-muted transition-colors"
          aria-label={t('error_log.limpiar_antiguos', { dias: '30' })}
        >
          <Eraser className="w-4 h-4" />
          {t('error_log.limpiar_antiguos', { dias: '30' })}
        </button>
      </div>

      {resolveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setResolveModalOpen(false)}>
          <div className="bg-card border border-border rounded-xl shadow-lg p-6 w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-semibold mb-4">{t('error_log.resolver_modal_titulo')}</h2>
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                {selectedError?.errorMessage}
              </p>
              <div>
                <label className="text-sm font-medium mb-1 block text-foreground">
                  {t('error_log.resolver_modal_notas_label')}
                </label>
                <textarea
                  value={resolveNotes}
                  onChange={e => setResolveNotes(e.target.value)}
                  placeholder={t('error_log.resolver_modal_notas_placeholder')}
                  rows={3}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setResolveModalOpen(false)}
                className="px-4 py-2 text-sm rounded-lg border border-border hover:bg-muted transition-colors"
              >
                {t('error_log.resolver_modal_cancelar')}
              </button>
              <button
                onClick={confirmResolve}
                className="px-4 py-2 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                {t('error_log.resolver_modal_confirmar')}
              </button>
            </div>
          </div>
        </div>
      )}

      {detailModalOpen && selectedError && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setDetailModalOpen(false)}>
          <div className="bg-card border border-border rounded-xl shadow-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">
                {t('error_log.detalle_titulo', { id: selectedError.id.slice(0, 8) })}
              </h2>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="col-span-2">
                <span className="text-muted-foreground text-xs">{t('error_log.detalle_id')}</span>
                <p className="font-mono text-xs">{selectedError.id}</p>
              </div>
              <div>
                <span className="text-muted-foreground text-xs">{t('error_log.detalle_tipo')}</span>
                <p><span className="inline-flex px-2 py-0.5 rounded text-xs font-medium border border-border bg-muted text-muted-foreground">{selectedError.errorType || 'N/A'}</span></p>
              </div>
              <div>
                <span className="text-muted-foreground text-xs">{t('error_log.detalle_severidad')}</span>
                <p><span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium border ${SEVERITY_COLORS[selectedError.severity] || ''}`}>{severityLabel(t, selectedError.severity)}</span></p>
              </div>
              <div>
                <span className="text-muted-foreground text-xs">{t('error_log.detalle_estado')}</span>
                <p className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${selectedError.resolved ? 'bg-green-500' : 'bg-red-500'}`} />
                  <span className="text-xs">{selectedError.resolved ? t('error_log.resuelto') : t('error_log.abierto')}</span>
                </p>
              </div>
              <div>
                <span className="text-muted-foreground text-xs">{t('error_log.detalle_fecha')}</span>
                <p className="text-xs">{fmtDate(selectedError.createdAt)}</p>
              </div>
              <div className="col-span-2">
                <span className="text-muted-foreground text-xs">{t('error_log.detalle_componente')}</span>
                <p><code className="text-xs bg-muted px-2 py-0.5 rounded">{selectedError.component || 'N/A'}</code></p>
              </div>
              <div className="col-span-2">
                <span className="text-muted-foreground text-xs">{t('error_log.detalle_funcion')}</span>
                <p><code className="text-xs bg-muted px-2 py-0.5 rounded">{selectedError.functionName || 'N/A'}</code></p>
              </div>
              {selectedError.proyectoId && (
                <div className="col-span-2">
                  <span className="text-muted-foreground text-xs">{t('error_log.detalle_proyecto')}</span>
                  <p className="text-xs">{getProyectoNombre(selectedError.proyectoId) || selectedError.proyectoId}</p>
                </div>
              )}
              <div className="col-span-2">
                <span className="text-muted-foreground text-xs">{t('error_log.detalle_mensaje')}</span>
                <div className="mt-1 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                  <p className="text-xs text-red-700 dark:text-red-300">{selectedError.errorMessage}</p>
                </div>
              </div>
              {selectedError.context && (
                <div className="col-span-2">
                  <span className="text-muted-foreground text-xs">{t('error_log.detalle_contexto')}</span>
                  <pre className="mt-1 bg-muted p-3 rounded text-xs overflow-auto max-h-32 font-mono">
                    {JSON.stringify(selectedError.context, null, 2)}
                  </pre>
                </div>
              )}
              {selectedError.errorStack && (
                <div className="col-span-2">
                  <span className="text-muted-foreground text-xs">{t('error_log.detalle_stack')}</span>
                  <pre className="mt-1 bg-muted p-3 rounded text-xs overflow-auto max-h-64 font-mono">
                    {selectedError.errorStack}
                  </pre>
                </div>
              )}
              {selectedError.resolved && (
                <>
                  <div>
                    <span className="text-muted-foreground text-xs">{t('error_log.detalle_resuelto_por')}</span>
                    <p className="text-xs">{selectedError.resolvedBy || 'Sistema'}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-xs">{t('error_log.detalle_fecha_resolucion')}</span>
                    <p className="text-xs">{fmtDate(selectedError.resolvedAt)}</p>
                  </div>
                  {selectedError.resolutionNotes && (
                    <div className="col-span-2">
                      <span className="text-muted-foreground text-xs">{t('error_log.detalle_notas')}</span>
                      <p className="text-xs mt-1">{selectedError.resolutionNotes}</p>
                    </div>
                  )}
                </>
              )}
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setDetailModalOpen(false)}
                className="px-4 py-2 text-sm rounded-lg border border-border hover:bg-muted transition-colors"
              >
                {t('error_log.cerrar')}
              </button>
              {!selectedError.resolved && (
                <button
                  onClick={() => {
                    openResolveModal(selectedError.id);
                    setDetailModalOpen(false);
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  <Check className="w-4 h-4" />
                  {t('error_log.marcar_resuelto')}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
