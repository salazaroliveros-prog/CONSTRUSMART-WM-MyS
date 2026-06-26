import React from 'react';
import { supabase } from '@/lib/supabase';
import { AlertTriangle, CheckCircle, XCircle, Info, Bug, Database, Network, Shield, Filter, Download, Search } from 'lucide-react';

interface ErrorLogEntry {
  id: string;
  error_code?: string;
  error_message: string;
  error_stack?: string;
  error_type: 'client' | 'server' | 'database' | 'network' | 'validation' | 'auth' | 'permission' | 'other';
  severity: 'debug' | 'info' | 'warning' | 'error' | 'critical';
  component?: string;
  function_name?: string;
  line_number?: number;
  proyecto_id?: string;
  proyecto_nombre?: string;
  user_id?: string;
  user_email?: string;
  request_path?: string;
  resolved: boolean;
  resolved_at?: string;
  resolution_notes?: string;
  created_at: string;
}

const SEVERITY_ICONS: Record<string, React.ReactNode> = {
  debug: <Bug className="w-5 h-5 text-gray-500" />,
  info: <Info className="w-5 h-5 text-blue-500" />,
  warning: <AlertTriangle className="w-5 h-5 text-amber-500" />,
  error: <XCircle className="w-5 h-5 text-red-500" />,
  critical: <AlertTriangle className="w-5 h-5 text-red-600" />,
};

const SEVERITY_COLORS: Record<string, string> = {
  debug: 'bg-gray-50 border-gray-200',
  info: 'bg-blue-50 border-blue-200',
  warning: 'bg-amber-50 border-amber-200',
  error: 'bg-red-50 border-red-200',
  critical: 'bg-red-100 border-red-300',
};

const ERROR_TYPE_ICONS: Record<string, React.ReactNode> = {
  client: <Bug className="w-4 h-4 text-purple-500" />,
  server: <Database className="w-4 h-4 text-indigo-500" />,
  database: <Database className="w-4 h-4 text-blue-500" />,
  network: <Network className="w-4 h-4 text-green-500" />,
  validation: <Shield className="w-4 h-4 text-amber-500" />,
  auth: <Shield className="w-4 h-4 text-red-500" />,
  permission: <Shield className="w-4 h-4 text-orange-500" />,
  other: <AlertTriangle className="w-4 h-4 text-gray-500" />,
};

export default function ErrorLog() {
  const [errors, setErrors] = React.useState<ErrorLogEntry[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [filtroSeveridad, setFiltroSeveridad] = React.useState<string | null>(null);
  const [filtroTipo, setFiltroTipo] = React.useState<string | null>(null);
  const [filtroResuelto, setFiltroResuelto] = React.useState<boolean | null>(null);
  const [busqueda, setBusqueda] = React.useState('');
  const [errorSeleccionado, setErrorSeleccionado] = React.useState<ErrorLogEntry | null>(null);
  const [showModal, setShowModal] = React.useState(false);

  const fetchErrors = React.useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('erp_error_log_recent')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setErrors(data || []);
    } catch (err) {
      console.error('Error fetching error logs:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchErrors();
  }, [fetchErrors]);

  const handleResolve = async (errorId: string, notes?: string) => {
    try {
      const { error } = await supabase.rpc('resolve_error', {
        p_error_id: errorId,
        p_resolution_notes: notes || null
      });

      if (error) throw error;
      await fetchErrors();
      setShowModal(false);
      setErrorSeleccionado(null);
    } catch (err) {
      console.error('Error resolving error:', err);
    }
  };

  const errorsFiltrados = errors
    .filter(e => !filtroSeveridad || e.severity === filtroSeveridad)
    .filter(e => !filtroTipo || e.error_type === filtroTipo)
    .filter(e => filtroResuelto === null || e.resolved === filtroResuelto)
    .filter(e => !busqueda || 
      e.error_message.toLowerCase().includes(busqueda.toLowerCase()) ||
      e.component?.toLowerCase().includes(busqueda.toLowerCase()) ||
      e.function_name?.toLowerCase().includes(busqueda.toLowerCase()) ||
      e.error_code?.toLowerCase().includes(busqueda.toLowerCase())
    );

  const severidades = [...new Set(errors.map(e => e.severity))];
  const tipos = [...new Set(errors.map(e => e.error_type))];
  const noResueltos = errors.filter(e => !e.resolved).length;

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('es-GT', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const exportToCSV = () => {
    const headers = ['ID', 'Error Code', 'Message', 'Type', 'Severity', 'Component', 'Function', 'Project', 'User', 'Resolved', 'Created At'];
    const rows = errorsFiltrados.map(e => [
      e.id,
      e.error_code || '',
      `"${e.error_message.replace(/"/g, '""')}"`,
      e.error_type,
      e.severity,
      e.component || '',
      e.function_name || '',
      e.proyecto_nombre || '',
      e.user_email || '',
      e.resolved ? 'Yes' : 'No',
      e.created_at
    ]);

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `error-log-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="p-4 max-w-6xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3" />
          <div className="h-64 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-6xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-red-500" />
            Error Log
          </h1>
          <p className="text-sm text-gray-500">
            {noResueltos} sin resolver · {errors.length} total
          </p>
        </div>
        <button
          onClick={exportToCSV}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-colors"
        >
          <Download className="w-4 h-4" />
          Exportar CSV
        </button>
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por mensaje, componente, función..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            className="pl-9 pr-4 py-2 border rounded-lg text-sm w-64 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <select
          value={filtroSeveridad || ''}
          onChange={e => setFiltroSeveridad(e.target.value || null)}
          className="px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">Todas las severidades</option>
          {severidades.map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        <select
          value={filtroTipo || ''}
          onChange={e => setFiltroTipo(e.target.value || null)}
          className="px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">Todos los tipos</option>
          {tipos.map(t => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>

        <select
          value={filtroResuelto === null ? '' : filtroResuelto ? 'true' : 'false'}
          onChange={e => setFiltroResuelto(e.target.value === '' ? null : e.target.value === 'true')}
          className="px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">Todos los estados</option>
          <option value="false">Sin resolver</option>
          <option value="true">Resueltos</option>
        </select>

        <button
          onClick={() => { setFiltroSeveridad(null); setFiltroTipo(null); setFiltroResuelto(null); setBusqueda(''); }}
          className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
        >
          Limpiar filtros
        </button>
      </div>

      <div className="space-y-2">
        {errorsFiltrados.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <AlertTriangle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>No se encontraron errores</p>
          </div>
        ) : (
          errorsFiltrados.map(error => (
            <div
              key={error.id}
              className={`p-4 rounded-lg border cursor-pointer hover:shadow-md transition-shadow ${SEVERITY_COLORS[error.severity]}`}
              onClick={() => { setErrorSeleccionado(error); setShowModal(true); }}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1">
                  <div className="mt-0.5">
                    {SEVERITY_ICONS[error.severity]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium px-2 py-0.5 rounded bg-white/50 capitalize">
                        {error.severity}
                      </span>
                      {ERROR_TYPE_ICONS[error.error_type]}
                      <span className="text-xs text-gray-600 capitalize">{error.error_type}</span>
                      {error.resolved && (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      )}
                    </div>
                    <p className="font-medium text-sm truncate">{error.error_message}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-600">
                      {error.component && <span>{error.component}</span>}
                      {error.function_name && <span>· {error.function_name}</span>}
                      {error.proyecto_nombre && <span>· {error.proyecto_nombre}</span>}
                      <span>· {formatDate(error.created_at)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {showModal && errorSeleccionado && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            <div className="p-4 border-b flex items-center justify-between">
              <h2 className="text-lg font-bold">Detalle del Error</h2>
              <button
                onClick={() => { setShowModal(false); setErrorSeleccionado(null); }}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto flex-1 space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">ID:</span>
                  <p className="text-gray-600 font-mono text-xs">{errorSeleccionado.id}</p>
                </div>
                <div>
                  <span className="font-medium">Severidad:</span>
                  <p className="capitalize">{errorSeleccionado.severity}</p>
                </div>
                <div>
                  <span className="font-medium">Tipo:</span>
                  <p className="capitalize">{errorSeleccionado.error_type}</p>
                </div>
                <div>
                  <span className="font-medium">Estado:</span>
                  <p className={errorSeleccionado.resolved ? 'text-green-600' : 'text-red-600'}>
                    {errorSeleccionado.resolved ? 'Resuelto' : 'Sin resolver'}
                  </p>
                </div>
                {errorSeleccionado.error_code && (
                  <div>
                    <span className="font-medium">Código:</span>
                    <p className="font-mono text-xs">{errorSeleccionado.error_code}</p>
                  </div>
                )}
                {errorSeleccionado.component && (
                  <div>
                    <span className="font-medium">Componente:</span>
                    <p>{errorSeleccionado.component}</p>
                  </div>
                )}
                {errorSeleccionado.function_name && (
                  <div>
                    <span className="font-medium">Función:</span>
                    <p>{errorSeleccionado.function_name}</p>
                  </div>
                )}
                {errorSeleccionado.line_number && (
                  <div>
                    <span className="font-medium">Línea:</span>
                    <p>{errorSeleccionado.line_number}</p>
                  </div>
                )}
                {errorSeleccionado.proyecto_nombre && (
                  <div>
                    <span className="font-medium">Proyecto:</span>
                    <p>{errorSeleccionado.proyecto_nombre}</p>
                  </div>
                )}
                {errorSeleccionado.user_email && (
                  <div>
                    <span className="font-medium">Usuario:</span>
                    <p>{errorSeleccionado.user_email}</p>
                  </div>
                )}
                <div>
                  <span className="font-medium">Creado:</span>
                  <p>{formatDate(errorSeleccionado.created_at)}</p>
                </div>
                {errorSeleccionado.resolved_at && (
                  <div>
                    <span className="font-medium">Resuelto:</span>
                    <p>{formatDate(errorSeleccionado.resolved_at)}</p>
                  </div>
                )}
              </div>

              <div>
                <span className="font-medium text-sm">Mensaje:</span>
                <p className="text-sm text-gray-700 mt-1">{errorSeleccionado.error_message}</p>
              </div>

              {errorSeleccionado.error_stack && (
                <div>
                  <span className="font-medium text-sm">Stack Trace:</span>
                  <pre className="text-xs bg-gray-100 p-3 rounded mt-1 overflow-x-auto">
                    {errorSeleccionado.error_stack}
                  </pre>
                </div>
              )}

              {errorSeleccionado.resolution_notes && (
                <div>
                  <span className="font-medium text-sm">Notas de Resolución:</span>
                  <p className="text-sm text-gray-700 mt-1">{errorSeleccionado.resolution_notes}</p>
                </div>
              )}
            </div>
            {!errorSeleccionado.resolved && (
              <div className="p-4 border-t flex gap-2">
                <input
                  type="text"
                  placeholder="Notas de resolución (opcional)"
                  className="flex-1 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  id="resolution-notes"
                />
                <button
                  onClick={() => {
                    const notes = (document.getElementById('resolution-notes') as HTMLInputElement)?.value;
                    handleResolve(errorSeleccionado.id, notes);
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                >
                  Marcar como Resuelto
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
