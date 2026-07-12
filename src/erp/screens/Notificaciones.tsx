import { Skeleton } from '@/components/ui/skeleton';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useErp } from '../store';
import ProyectoFilter from '../components/ProyectoFilter';
import { Bell, Check, CheckCheck, AlertTriangle, ClipboardList, Package, TrendingDown, Activity } from 'lucide-react';

const MAPA_ICONOS: Record<string, React.ReactNode> = {
  checklist_rechazado: <AlertTriangle className="w-5 h-5 text-red-500" aria-hidden="true" />,
  orden_cambio_pendiente: <ClipboardList className="w-5 h-5 text-amber-500" aria-hidden="true" />,
  stock_critico: <Package className="w-5 h-5 text-amber-500" aria-hidden="true" />,
  desviacion_rendimiento: <TrendingDown className="w-5 h-5 text-red-500" aria-hidden="true" />,
  avance_registrado: <Activity className="w-5 h-5 text-green-500" aria-hidden="true" />,
  general: <Bell className="w-5 h-5 text-blue-500" aria-hidden="true" />,
};

const MAPA_COLORES: Record<string, string> = {
  checklist_rechazado: 'bg-red-50 border-red-200',
  orden_cambio_pendiente: 'bg-amber-50 border-amber-200',
  stock_critico: 'bg-orange-50 border-orange-200',
  desviacion_rendimiento: 'bg-red-50 border-red-200',
  avance_registrado: 'bg-green-50 border-green-200',
  general: 'bg-blue-50 border-blue-200',
};

const MAPA_LABEL: Record<string, string> = {
  checklist_rechazado: 'Checklist Rechazado',
  orden_cambio_pendiente: 'Orden de Cambio Pendiente',
  stock_critico: 'Stock Crítico',
  desviacion_rendimiento: 'Desviación de Rendimiento',
  avance_registrado: 'Avance Registrado',
  general: 'General',
};

export default function Notificaciones() {
  const { t } = useTranslation();
  const { notificaciones, markNotificacionLeida, marcarTodasLeidas, proyectos } = useErp();
  const [filtroTipo, setFiltroTipo] = React.useState<string | null>(null);
  const [filtroProyecto, setFiltroProyecto] = React.useState('');
  const [tab, setTab] = React.useState<'alertas' | 'historial'>('alertas');
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => { setLoading(false); }, []);

  const noLeidas = notificaciones.filter(n => !n.leido);
  const leidas = notificaciones.filter(n => n.leido);

  const baseList = tab === 'alertas' ? noLeidas : notificaciones;
  const filtradas = baseList
    .filter(n => !filtroTipo || n.tipo === filtroTipo)
    .filter(n => !filtroProyecto || n.proyectoId === filtroProyecto);

  const tiposExistentes = [...new Set(notificaciones.map(n => n.tipo))];

  const getProyectoNombre = (proyectoId?: string) => {
    if (!proyectoId) return '';
    const p = proyectos.find(pr => pr.id === proyectoId);
    return p ? p.nombre : '';
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('es-GT', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-6 max-w-[1600px] mx-auto space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }
  return (
    <div className="p-4 max-w-4xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Bell className="w-6 h-6" />
            {t('notificaciones.titulo', 'Notificaciones')}
          </h1>
          <p className="text-sm text-gray-500">
            {noLeidas.length} {t('notificaciones.alertas', 'alertas')} · {leidas.length} {t('notificaciones.historial', 'en historial')}
          </p>
        </div>
        <button
          onClick={marcarTodasLeidas}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-colors"
        >
          <CheckCheck className="w-4 h-4" />
          {t('notificaciones.marcar_todas_leidas', 'Marcar todas leídas')}
        </button>
      </div>

      {/* Tabs: Alertas | Historial */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit" role="tablist">
        <button
          onClick={() => setTab('alertas')}
          role="tab"
          aria-selected={tab === 'alertas'}
          className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
            tab === 'alertas'
              ? 'bg-card text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          {t('notificaciones.tab_alertas', 'Alertas')} {noLeidas.length > 0 && `(${noLeidas.length})`}
        </button>
        <button
          onClick={() => setTab('historial')}
          role="tab"
          aria-selected={tab === 'historial'}
          className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
            tab === 'historial'
              ? 'bg-card text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          {t('notificaciones.tab_historial', 'Historial')}
        </button>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-2">
        <ProyectoFilter value={filtroProyecto} onChange={setFiltroProyecto} proyectos={proyectos} />
        <button
          onClick={() => setFiltroTipo(null)}
          className={`px-3 py-1 text-xs rounded-full transition-colors ${
            filtroTipo === null
              ? 'bg-gray-800 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          {t('notificaciones.tiltulas_todas', 'Todas')}
        </button>
        {tiposExistentes.map(tipo => (
          <button
            key={tipo}
            onClick={() => setFiltroTipo(tipo)}
            className={`px-3 py-1 text-xs rounded-full transition-colors ${
              filtroTipo === tipo
                ? 'bg-gray-800 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {MAPA_LABEL[tipo] || tipo}
          </button>
        ))}
      </div>

      {/* Lista de notificaciones */}
      {filtradas.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Bell className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-lg font-medium">
            {tab === 'alertas' ? t('notificaciones.sin_alertas', 'No hay alertas pendientes') : t('notificaciones.sin_historial', 'No hay historial')}
          </p>
          <p className="text-sm">
            {tab === 'alertas'
              ? t('notificaciones.sin_alertas_desc', 'Todas las notificaciones han sido revisadas. ¡Buen trabajo!')
              : t('notificaciones.sin_historial_desc', 'Las notificaciones leídas aparecerán aquí.')}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtradas.map(notif => (
            <div
              key={notif.id}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && !notif.leido) { e.preventDefault(); markNotificacionLeida(notif.id); } }}
              className={`flex items-start gap-3 p-3 rounded-lg border transition-all ${
                MAPA_COLORES[notif.tipo] || 'bg-gray-50 border-gray-200'
              } ${notif.leido ? 'opacity-60' : 'shadow-sm'}`}
              onClick={() => !notif.leido && markNotificacionLeida(notif.id)}
            >
              <div className="mt-0.5 shrink-0">
                {MAPA_ICONOS[notif.tipo] || <Bell className="w-5 h-5 text-gray-400" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    {MAPA_LABEL[notif.tipo] || notif.tipo}
                  </span>
                  {!notif.leido && (
                    <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0" />
                  )}
                </div>
                <p className="text-sm font-medium text-gray-900">{notif.titulo}</p>
                <p className="text-xs text-gray-600 mt-0.5">{notif.mensaje}</p>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-xs text-gray-400">{formatDate(notif.createdAt)}</span>
                  {notif.proyectoId && (
                    <span className="text-xs text-indigo-500 bg-indigo-50 px-1.5 py-0.5 rounded">
                      {getProyectoNombre(notif.proyectoId)}
                    </span>
                  )}
                </div>
              </div>
              {!notif.leido && (
                <button
                  onClick={(e) => { e.stopPropagation(); markNotificacionLeida(notif.id); }}
                  className="p-1.5 hover:bg-card/50 rounded-full transition-colors shrink-0"
                  aria-label={t('notificaciones.marcar_leida', 'Marcar como leída')}
                >
                  <Check className="w-4 h-4 text-gray-400" aria-hidden="true" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


