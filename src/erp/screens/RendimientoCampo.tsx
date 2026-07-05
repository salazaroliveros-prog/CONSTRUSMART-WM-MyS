import { Skeleton } from '@/components/ui/skeleton';
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useErp } from '../store';
import ProyectoFilter from '../components/ProyectoFilter';
import { HardHat, BarChart3, AlertTriangle, Pickaxe, Trash2, ClipboardList, Package } from 'lucide-react';
import type { Destajo, CapturaRendimiento, PlantillaSubrenglon, ValeSalidaRenglon } from '../types';

const uid = () => Date.now().toString(36).substr(2, 9);

const getEficienciaColor = (ef: number) => {
  if (ef >= 90) return 'text-success';
  if (ef >= 80) return 'text-warning';
  return 'text-destructive';
};

export const RendimientoCampo: React.FC = () => {
  const { t } = useTranslation();
  const { proyectos } = useErp();

  const [tab, setTab] = useState<'destajos' | 'capturas' | 'plantillas' | 'vales'>('destajos');
  const [proyectoFilter, setProyectoFilter] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => { setLoading(false); }, []);

  const [destajos, setDestajos] = useState<Destajo[]>([]);
  const [capturas, setCapturas] = useState<CapturaRendimiento[]>([]);
  const [plantillas, setPlantillas] = useState<PlantillaSubrenglon[]>([]);
  const [vales, setVales] = useState<ValeSalidaRenglon[]>([]);

  const saveDestajos = (data: Destajo[]) => setDestajos(data);
  const saveCapturas = (data: CapturaRendimiento[]) => setCapturas(data);
  const savePlantillas = (data: PlantillaSubrenglon[]) => setPlantillas(data);
  const saveVales = (data: ValeSalidaRenglon[]) => setVales(data);

  const addDestajo = (data: Omit<Destajo, 'id' | 'rendimientoReal'>) => {
    const rendimientoReal = data.horasTrabajadas > 0 ? data.cantidadEjecutada / data.horasTrabajadas : 0;
    saveDestajos([{ ...data, id: uid(), rendimientoReal }, ...destajos]);
  };
  const addCaptura = (data: Omit<CapturaRendimiento, 'id' | 'rendimientoReal' | 'eficiencia'>) => {
    const rendimientoReal = data.horas > 0 ? data.cantidad / data.horas : 0;
    const eficiencia = data.rendimientoTeorico > 0 ? (rendimientoReal / data.rendimientoTeorico) * 100 : 0;
    saveCapturas([{ ...data, id: uid(), rendimientoReal, eficiencia }, ...capturas]);
  };
  const deleteCaptura = (id: string) => saveCapturas(capturas.filter(c => c.id !== id));
  const addPlantilla = (data: Omit<PlantillaSubrenglon, 'id'>) => savePlantillas([{ ...data, id: uid() }, ...plantillas]);

  const SELECT = 'text-xs px-2 py-1.5 border border-input rounded-lg outline-none focus:border-ring bg-background text-foreground';
  const BTN = 'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors';

  const renderDestajos = () => {
    const filtrados = proyectoFilter ? destajos.filter(d => d.proyectoId === proyectoFilter) : destajos;
    return (
      <div>
        <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
          <div>
            <h2 className="text-lg font-bold text-foreground flex items-center gap-1.5"><HardHat className="w-5 h-5 text-amber-500" aria-hidden="true" /> {t('rendimiento_campo.destajos')}</h2>
            <p className="text-[11px] text-muted-foreground mt-0.5">Registro diario de producción y horas por cuadrilla</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <ProyectoFilter value={proyectoFilter} onChange={setProyectoFilter} proyectos={proyectos} />
            <button onClick={() => {
              const proy = proyectos[0]; if (!proy) return;
              addDestajo({ proyectoId: proy.id, renglonCodigo: '', cuadrilla: '', fecha: new Date().toISOString().split('T')[0], cantidadEjecutada: 0, unidad: '', horasTrabajadas: 0, rendimientoTeorico: 0 });
            }} className="bg-success text-success-foreground px-3 py-1.5 rounded-lg text-xs hover:bg-success/90 font-medium">+ Registrar Destajo</button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted">
                <th className="p-2 text-left">Proyecto</th>
                <th className="p-2 text-left">Renglón</th>
                <th className="p-2 text-left">Cuadrilla</th>
                <th className="p-2 text-right">Ejecutado</th>
                <th className="p-2 text-right">Real</th>
                <th className="p-2 text-right">Teórico</th>
                <th className="p-2 text-right">Eficiencia</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map(d => {
                const proy = proyectos.find(p => p.id === d.proyectoId);
                const ef = d.rendimientoTeorico > 0 ? (d.rendimientoReal / d.rendimientoTeorico) * 100 : 0;
                return (
                  <tr key={d.id} className="border-t hover:bg-muted/50">
                    <td className="p-2 text-xs">{proy?.nombre || '—'}</td>
                    <td className="p-2 font-mono text-xs">{d.renglonCodigo}</td>
                    <td className="p-2 text-xs">{d.cuadrilla}</td>
                    <td className="p-2 text-right font-mono">{d.cantidadEjecutada} {d.unidad}</td>
                    <td className="p-2 text-right font-mono">{d.rendimientoReal.toFixed(1)}</td>
                    <td className="p-2 text-right font-mono">{d.rendimientoTeorico}</td>
                    <td className={`p-2 text-right font-bold ${getEficienciaColor(ef)}`}>{ef.toFixed(0)}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filtrados.length === 0 && <p className="text-muted-foreground text-sm text-center py-8">No hay destajos registrados</p>}
      </div>
    );
  };

  const renderCapturas = () => {
    const filtradas = proyectoFilter ? capturas.filter(c => c.proyectoId === proyectoFilter) : capturas;
    const promedioEf = filtradas.length > 0 ? filtradas.reduce((a, c) => a + c.eficiencia, 0) / filtradas.length : 0;
    return (
      <div>
        <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
          <div>
            <h2 className="text-lg font-bold text-foreground flex items-center gap-1.5"><BarChart3 className="w-5 h-5 text-blue-500" aria-hidden="true" /> {t('rendimiento_campo.capturas')}</h2>
            <p className="text-[11px] text-muted-foreground mt-0.5">Medición de rendimiento real vs teórico</p>
          </div>
          <div className="flex gap-2">
            <select value={proyectoFilter} onChange={e => setProyectoFilter(e.target.value)} className={SELECT}>
              <option value="">Todos</option>
              {proyectos.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
            </select>
            <button onClick={() => {
              const proy = proyectos[0]; if (!proy) return;
              addCaptura({ proyectoId: proy.id, renglonCodigo: '', actividad: '', cuadrilla: '', fecha: new Date().toISOString().split('T')[0], cantidad: 0, unidad: '', horas: 0, rendimientoTeorico: 0 });
            }} className="bg-success text-success-foreground px-3 py-1.5 rounded-lg text-xs hover:bg-success/90 font-medium">+ Capturar</button>
          </div>
        </div>

        {filtradas.length > 0 && (
          <div className="mb-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3 bg-info/10 rounded-lg text-center"><p className="text-xs text-info font-medium">Capturas</p><p className="text-xl font-bold text-info">{filtradas.length}</p></div>
            <div className="p-3 bg-muted rounded-lg text-center"><p className="text-xs text-muted-foreground font-medium">Eficiencia Promedio</p><p className={`text-xl font-bold ${getEficienciaColor(promedioEf)}`}>{promedioEf.toFixed(0)}%</p></div>
            <div className="p-3 bg-destructive/10 rounded-lg text-center"><p className="text-xs text-destructive font-medium">Bajo rendimiento (&lt;80%)</p><p className="text-xl font-bold text-destructive">{filtradas.filter(c => c.eficiencia < 80).length}</p></div>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted">
                <th className="p-2 text-left">Actividad</th>
                <th className="p-2 text-left">Cuadrilla</th>
                <th className="p-2 text-right">Cantidad</th>
                <th className="p-2 text-right">Teórico</th>
                <th className="p-2 text-right">Real</th>
                <th className="p-2 text-right">Eficiencia</th>
                <th className="p-2"></th>
              </tr>
            </thead>
            <tbody>
              {filtradas.map(c => (
                <tr key={c.id} className={`border-t ${c.eficiencia < 80 ? 'bg-destructive/5' : 'hover:bg-muted/50'}`}>
                  <td className="p-2 text-xs font-medium">{c.actividad}</td>
                  <td className="p-2 text-xs">{c.cuadrilla}</td>
                  <td className="p-2 text-right font-mono">{c.cantidad} {c.unidad}</td>
                  <td className="p-2 text-right font-mono">{c.rendimientoTeorico}</td>
                  <td className="p-2 text-right font-mono">{c.rendimientoReal.toFixed(1)}</td>
                  <td className={`p-2 text-right font-bold ${getEficienciaColor(c.eficiencia)}`}>
                    {c.eficiencia.toFixed(0)}%{c.eficiencia < 80 && <AlertTriangle className="w-3.5 h-3.5 ml-1 inline text-warning" aria-hidden="true" />}
                  </td>
                  <td className="p-2">
                    <button onClick={() => deleteCaptura(c.id)} className="text-destructive hover:text-destructive/80 text-xs" aria-label="Eliminar"><Trash2 className="w-3.5 h-3.5 inline" aria-hidden="true" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtradas.length === 0 && <p className="text-muted-foreground text-sm text-center py-8">No hay capturas de rendimiento</p>}
      </div>
    );
  };

  const renderPlantillas = () => (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-lg font-bold text-foreground flex items-center gap-1.5"><ClipboardList className="w-5 h-5 text-purple-500" aria-hidden="true" /> {t('rendimiento_campo.plantillas')}</h2>
          <p className="text-[11px] text-muted-foreground mt-0.5">Estandariza metas por renglón para control homogéneo</p>
        </div>
        <p className="text-xs text-muted-foreground">Sin plantillas predefinidas — crea nuevas plantillas desde cero</p>
      </div>
      {plantillas.length > 0 ? (
        <div className="mt-4 p-3 bg-info/10 rounded-lg">
          <p className="text-sm font-medium text-info">{plantillas.length} material(es) cargados como plantilla</p>
        </div>
      ) : (
        <p className="text-muted-foreground text-sm text-center py-8">No hay plantillas. Usa los formularios de captura para crear registros.</p>
      )}
    </div>
  );

  const renderVales = () => (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-lg font-bold text-foreground flex items-center gap-1.5"><Package className="w-5 h-5 text-orange-500" aria-hidden="true" /> {t('rendimiento_campo.vales')}</h2>
          <p className="text-[11px] text-muted-foreground mt-0.5">Salidas de almacén asociadas a rendimiento de campo</p>
        </div>
        <button disabled className="bg-primary/50 text-primary-foreground px-3 py-1.5 rounded-lg text-xs font-medium cursor-not-allowed">+ Nuevo Vale (formulario próximamente)</button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted">
              <th className="p-2 text-left">Renglón</th>
              <th className="p-2 text-left">Material</th>
              <th className="p-2 text-right">Cantidad</th>
              <th className="p-2 text-left">Unidad</th>
            </tr>
          </thead>
          <tbody>
            {vales.map(v => (
              <tr key={v.id} className="border-t hover:bg-muted/50">
                <td className="p-2 text-xs font-mono">{v.renglonCodigo}</td>
                <td className="p-2">{v.materialNombre}</td>
                <td className="p-2 text-right font-mono">{v.cantidad}</td>
                <td className="p-2 text-xs">{v.unidad}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {vales.length === 0 && <p className="text-muted-foreground text-sm text-center py-8">No hay vales por renglón</p>}
    </div>
  );


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
    <div className="p-4 sm:p-6 max-w-[1600px] mx-auto">
      <h1 className="text-2xl font-black text-foreground mb-4 flex items-center gap-2"><Pickaxe className="w-6 h-6 text-amber-500" aria-hidden="true" /> {t('rendimiento_campo.titulo')}</h1>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-muted p-1 rounded-lg overflow-x-auto">
        {[
          { key: 'destajos',   label: 'Destajos', icon: HardHat },
          { key: 'capturas',   label: 'Rendimiento', icon: BarChart3 },
          { key: 'plantillas', label: 'Plantillas', icon: ClipboardList },
          { key: 'vales',      label: 'Vales x Renglón', icon: Package },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key as typeof tab)}
            className={`shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
              tab === t.key ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-card/50'
            }`}><t.icon className="w-4 h-4" aria-hidden="true" />{t.label}</button>
        ))}
      </div>

      {tab === 'destajos'   && renderDestajos()}
      {tab === 'capturas'   && renderCapturas()}
      {tab === 'plantillas' && renderPlantillas()}
      {tab === 'vales'      && renderVales()}
    </div>
  );
};

export default RendimientoCampo;
