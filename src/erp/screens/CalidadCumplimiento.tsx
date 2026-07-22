import React, { useMemo, useState, useEffect } from 'react';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { useErp } from '../store';
import ProyectoFilter from '../components/ProyectoFilter';
import {
  CheckCircle, AlertTriangle, FlaskConical, ClipboardCheck
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { noConformidadSchema, pruebaSchema, liberacionSchema } from '../store/schemas/calidad';
type NoConformidad = z.infer<typeof noConformidadSchema>;
type PruebaLaboratorio = z.infer<typeof pruebaSchema>;
type LiberacionPartida = z.infer<typeof liberacionSchema>;

type TabType = 'todas' | 'no_conformidades' | 'pruebas' | 'liberaciones';

const TABS: { key: TabType; label: string }[] = [
  { key: 'todas', label: 'calidad_cumplimiento.todas' },
  { key: 'no_conformidades', label: 'calidad_cumplimiento.nc' },
  { key: 'pruebas', label: 'calidad_cumplimiento.pruebas' },
  { key: 'liberaciones', label: 'calidad_cumplimiento.liberaciones' },
];

const NC_COLORS: Record<NoConformidad['estado'], string> = {
  detectado: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  plan_accion: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  cerrado: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
};

const PRUEBA_RESULT_COLORS: Record<PruebaLaboratorio['resultado'], string> = {
  pendiente: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  pasa: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  no_pasa: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

const LIBERACION_COLORS: Record<LiberacionPartida['estado'], string> = {
  pendiente: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  liberado: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  rechazado: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

const CalidadCumplimiento: React.FC = () => {
  const [loading, setLoading] = useState(true);
  useEffect(() => { const t = setTimeout(() => setLoading(false), 400); return () => clearTimeout(t); }, []);
  const { t } = useTranslation();
  const {
    ncs, pruebas, liberaciones, proyectos,
    currentProjectId, setCurrentProjectId,
  } = useErp();

  const [activeTab, setActiveTab] = useState<TabType>('todas');

  const filteredNcs = useMemo(() => {
    if (!currentProjectId) return ncs;
    return ncs.filter(nc => nc.proyectoId === currentProjectId);
  }, [ncs, currentProjectId]);

  const filteredPruebas = useMemo(() => {
    if (!currentProjectId) return pruebas;
    return pruebas.filter(p => p.proyectoId === currentProjectId);
  }, [pruebas, currentProjectId]);

  const filteredLiberaciones = useMemo(() => {
    if (!currentProjectId) return liberaciones;
    return liberaciones.filter(l => l.proyectoId === currentProjectId);
  }, [liberaciones, currentProjectId]);

  const ncsPendientes = useMemo(
    () => filteredNcs.filter(nc => nc.estado !== 'cerrado').length,
    [filteredNcs]
  );

  const liberacionesOk = useMemo(
    () => filteredLiberaciones.filter(l => l.estado === 'liberado' || l.estado === 'aprobada').length,
    [filteredLiberaciones]
  );

  const pruebasPasadas = useMemo(
    () => filteredPruebas.filter(p => p.resultado === 'pasa').length,
    [filteredPruebas]
  );

  const cumplimientoGlobal = useMemo(() => {
    const total = filteredPruebas.length + filteredLiberaciones.length;
    if (total === 0) return 0;
    const ok = pruebasPasadas + liberacionesOk;
    return Math.round((ok / total) * 100);
  }, [filteredPruebas, filteredLiberaciones, pruebasPasadas, liberacionesOk]);

  const proyectoLabel = currentProjectId
    ? proyectos.find(p => p.id === currentProjectId)?.nombre || t('calidad_cumplimiento.proyecto_seleccionado')
    : t('calidad_cumplimiento.todos_proyectos');

  const handleFilterChange = (val: string) => {
    setCurrentProjectId(val || null);
  };

  const renderNcTable = () => (
    <div className="overflow-x-auto">
      <table className="w-full text-xs" role="table" aria-label={t('calidad_cumplimiento.nc')}>
        <thead>
          <tr className="border-b border-border">
            <th className="text-left p-2 text-muted-foreground font-medium" scope="col">{t('calidad_cumplimiento.codigo')}</th>
            <th className="text-left p-2 text-muted-foreground font-medium" scope="col">{t('calidad_cumplimiento.tipo')}</th>
            <th className="text-left p-2 text-muted-foreground font-medium" scope="col">{t('calidad_cumplimiento.detectado_por')}</th>
            <th className="text-left p-2 text-muted-foreground font-medium" scope="col">{t('calidad_cumplimiento.estado')}</th>
          </tr>
        </thead>
        <tbody>
          {filteredNcs.length === 0 ? (
            <tr><td colSpan={4} className="p-6 text-center text-muted-foreground">{t('calidad_cumplimiento.sin_registros')}</td></tr>
          ) : (
            filteredNcs.map(nc => (
              <tr key={nc.id} className="border-t hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" tabIndex={0} role="row">
                <td className="p-2 font-mono text-muted-foreground truncate" title={nc.codigo}>{nc.codigo || '-'}</td>
                <td className="p-2 text-muted-foreground truncate">{t(`calidad_cumplimiento.categoria_${nc.categoria}`, nc.categoria)}</td>
                <td className="p-2 text-muted-foreground truncate">{nc.detectadoPor || '-'}</td>
                <td className="p-2">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${NC_COLORS[nc.estado]}`}>
                    {t(`calidad_cumplimiento.estado_${nc.estado}`)}
                  </span>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );

  const renderPruebasTable = () => (
    <div className="overflow-x-auto">
      <table className="w-full text-xs" role="table" aria-label={t('calidad_cumplimiento.pruebas')}>
        <thead>
          <tr className="border-b border-border">
            <th className="text-left p-2 text-muted-foreground font-medium" scope="col">{t('calidad_cumplimiento.tipo_prueba')}</th>
            <th className="text-left p-2 text-muted-foreground font-medium" scope="col">{t('calidad_cumplimiento.resultado')}</th>
            <th className="text-left p-2 text-muted-foreground font-medium" scope="col">{t('calidad_cumplimiento.fecha')}</th>
          </tr>
        </thead>
        <tbody>
          {filteredPruebas.length === 0 ? (
            <tr><td colSpan={3} className="p-6 text-center text-muted-foreground">{t('calidad_cumplimiento.sin_registros')}</td></tr>
          ) : (
            filteredPruebas.map(p => (
              <tr key={p.id} className="border-t hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" tabIndex={0} role="row">
                <td className="p-2 text-muted-foreground truncate">{t(`calidad_cumplimiento.prueba_${p.tipo}`, p.tipo)}</td>
                <td className="p-2">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${PRUEBA_RESULT_COLORS[p.resultado]}`}>
                    {t(`calidad_cumplimiento.resultado_${p.resultado}`)}
                  </span>
                </td>
                <td className="p-2 text-muted-foreground truncate">{p.fechaMuestra || '-'}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );

  const renderLiberacionesTable = () => (
    <div className="overflow-x-auto">
      <table className="w-full text-xs" role="table" aria-label={t('calidad_cumplimiento.liberaciones')}>
        <thead>
          <tr className="border-b border-border">
            <th className="text-left p-2 text-muted-foreground font-medium" scope="col">{t('calidad_cumplimiento.actividad')}</th>
            <th className="text-left p-2 text-muted-foreground font-medium" scope="col">{t('calidad_cumplimiento.estado')}</th>
            <th className="text-left p-2 text-muted-foreground font-medium" scope="col">{t('calidad_cumplimiento.solicitante')}</th>
          </tr>
        </thead>
        <tbody>
          {filteredLiberaciones.length === 0 ? (
            <tr><td colSpan={3} className="p-6 text-center text-muted-foreground">{t('calidad_cumplimiento.sin_registros')}</td></tr>
          ) : (
            filteredLiberaciones.map(l => (
              <tr key={l.id} className="border-t hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" tabIndex={0} role="row">
                <td className="p-2 text-muted-foreground truncate" title={l.renglonNombre}>{l.renglonNombre || '-'}</td>
                <td className="p-2">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${LIBERACION_COLORS[l.estado]}`}>
                    {t(`calidad_cumplimiento.liberacion_${l.estado}`)}
                  </span>
                </td>
                <td className="p-2 text-muted-foreground truncate">{l.solicitante || '-'}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );

  const renderTableContent = () => {
    if (activeTab === 'no_conformidades') return renderNcTable();
    if (activeTab === 'pruebas') return renderPruebasTable();
    if (activeTab === 'liberaciones') return renderLiberacionesTable();
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" aria-hidden="true" />
            {t('calidad_cumplimiento.nc')}
          </h3>
          {renderNcTable()}
        </div>
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
            <FlaskConical className="w-4 h-4 text-blue-500" aria-hidden="true" />
            {t('calidad_cumplimiento.pruebas')}
          </h3>
          {renderPruebasTable()}
        </div>
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
            <ClipboardCheck className="w-4 h-4 text-emerald-500" aria-hidden="true" />
            {t('calidad_cumplimiento.liberaciones')}
          </h3>
          {renderLiberacionesTable()}
        </div>
      </div>
    );
  };

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
    <div className="p-4 sm:p-6 max-w-[1600px] mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground truncate" title={proyectoLabel}>{proyectoLabel}</h1>
          <p className="text-muted-foreground text-sm mt-1">{t('calidad_cumplimiento.descripcion')}</p>
        </div>
        <ProyectoFilter
          value={currentProjectId || ''}
          onChange={handleFilterChange}
          proyectos={proyectos}
          labelAll={t('calidad_cumplimiento.todos_proyectos')}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-5 h-5 text-emerald-500" aria-hidden="true" />
            <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">{t('calidad_cumplimiento.cumplimiento_global')}</p>
          </div>
          <p className="text-3xl font-bold text-emerald-500">{cumplimientoGlobal}%</p>
          <p className="text-xs text-muted-foreground mt-1">
            {pruebasPasadas + liberacionesOk}/{filteredPruebas.length + filteredLiberaciones.length} {t('calidad_cumplimiento.ok')}
          </p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" aria-hidden="true" />
            <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">{t('calidad_cumplimiento.nc_pendientes')}</p>
          </div>
          <p className="text-3xl font-bold text-amber-500">{ncsPendientes}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {t('calidad_cumplimiento.de_total', { total: filteredNcs.length })}
          </p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <FlaskConical className="w-5 h-5 text-blue-500" aria-hidden="true" />
            <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">{t('calidad_cumplimiento.pruebas_realizadas')}</p>
          </div>
          <p className="text-3xl font-bold text-blue-500">{filteredPruebas.length}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {pruebasPasadas} {t('calidad_cumplimiento.pasaron')}
          </p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <ClipboardCheck className="w-5 h-5 text-emerald-500" aria-hidden="true" />
            <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">{t('calidad_cumplimiento.liberaciones_ok')}</p>
          </div>
          <p className="text-3xl font-bold text-emerald-500">{liberacionesOk}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {t('calidad_cumplimiento.de_total', { total: filteredLiberaciones.length })}
          </p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-sm">
        <div className="border-b border-border px-4 py-2 flex flex-wrap gap-1">
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                activeTab === tab.key
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent'
              }`}
            >
              {t(tab.label)}
            </button>
          ))}
        </div>
        <div className="p-4">
          {renderTableContent()}
        </div>
      </div>
    </div>
  );
};

export default CalidadCumplimiento;
