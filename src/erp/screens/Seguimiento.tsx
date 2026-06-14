import React, { useMemo, useState } from 'react';
import { useErp } from '../store';
import type { AvanceObra, BitacoraEntry, Hito } from '../types';
import { fmtPct, fmtQ, todayISO } from '../utils';
import { Progress, Gauge, BarChart, LineChart } from '../components/Charts';
import ChartToolbar from '../components/ChartToolbar';
import { useChartConfig } from '../hooks/useChartConfig';
import { CARD, CARD_TITLE, INPUT } from '../ui';
import { ClipboardCheck, Plus, CloudRain, Camera, Pencil, Trash2, Save, X, CalendarClock } from 'lucide-react';
import GanttChart from '../components/GanttChart';

type SeguimientoTab = 'resumen' | 'evm' | 'bitacora' | 'avances' | 'cronograma';

const safeNum = (value: unknown, fallback = 0) => {
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : fallback;
};

const safePct = (value: unknown) => fmtPct(safeNum(value));

const Seguimiento: React.FC = () => {
  const { proyectos, movimientos, bitacora, avances, hitos, seguimientoEVM, addBitacora, updateProyecto, updateBitacora, deleteBitacora } = useErp();
  const barConfig = useChartConfig('line', 'default');
  const [selProy, setSelProy] = useState(proyectos[0]?.id || '');
  const [activeTab, setActiveTab] = useState<SeguimientoTab>('resumen');
  const [bit, setBit] = useState({ clima: 'soleado', personal: '12', maquinaria: 'Retroexcavadora', tareas: '', observaciones: '' });
  const [editingProject, setEditingProject] = useState<string | null>(null);
  const [pendingProgress, setPendingProgress] = useState<Record<string, string>>({});
  const [editingBit, setEditingBit] = useState<BitacoraEntry | null>(null);

  const proyData = useMemo(() => proyectos.map(p => {
    const ing = movimientos.filter(m => m.proyectoId === p.id && m.tipo === 'ingreso').reduce((a, b) => a + safeNum(b.monto ?? b.costoTotal), 0);
    const gas = movimientos.filter(m => m.proyectoId === p.id && (m.tipo === 'gasto' || m.tipo === 'egreso')).reduce((a, b) => a + safeNum(b.monto ?? b.costoTotal), 0);
    const pendiente = Math.max(0, safeNum(p.montoContrato) - ing);
    return { ...p, ing, gas, pendiente };
  }), [proyectos, movimientos]);

  const proy = proyectos.find(p => p.id === selProy);
  const selectedProyData = proyData.find(p => p.id === selProy);
  const avanceProyecto = avances.filter(a => a.proyectoId === selProy).sort((a, b) => a.fecha.localeCompare(b.fecha));
  const bitacoraProyecto = bitacora.filter(b => b.proyectoId === selProy).sort((a, b) => b.fecha.localeCompare(a.fecha));
  const evmProyecto = seguimientoEVM.filter(s => s.proyectoId === selProy).sort((a, b) => b.fecha.localeCompare(a.fecha));

  const PV = safeNum(proy?.presupuestoTotal) * (safeNum(proy?.avanceFinanciero) / 100);
  const EV = safeNum(proy?.presupuestoTotal) * (safeNum(proy?.avanceFisico) / 100);
  const AC = selectedProyData?.gas || 0;
  const CV = EV - AC;
  const SV = EV - PV;
  const spi = PV > 0 ? EV / PV : 0;
  const cpi = AC > 0 ? EV / AC : 0;

  const tabs: { id: SeguimientoTab; label: string; description: string }[] = [
    { id: 'resumen', label: 'Resumen', description: 'Avance físico-financiero por proyecto' },
    { id: 'evm', label: 'EVM', description: 'Valor ganado, desviaciones e índices' },
    { id: 'bitacora', label: 'Bitácora', description: 'Reportes diarios de campo' },
    { id: 'avances', label: 'Avances', description: 'Avances por fecha y proyecto' },
    { id: 'cronograma', label: 'Cronograma', description: 'Hitos y ruta de ejecución' },
  ];

  const saveProjectProgress = (id: string) => {
    const raw = pendingProgress[id] ?? '';
    const value = Math.min(100, Math.max(0, Number(raw)));
    if (!Number.isNaN(value)) updateProyecto(id, { avanceFisico: value });
    setEditingProject(null);
  };

  const startEditProjectProgress = (id: string, current: number) => {
    setEditingProject(id);
    setPendingProgress(prev => ({ ...prev, [id]: String(current) }));
  };

  const startEditBitacora = (entry: BitacoraEntry) => {
    setEditingBit(entry);
    setSelProy(entry.proyectoId);
    setBit({
      clima: entry.clima,
      personal: String(entry.personalPresente),
      maquinaria: entry.maquinaria,
      tareas: entry.tareasRealizadas,
      observaciones: entry.observaciones,
    });
  };

  const cancelEditBitacora = () => {
    setEditingBit(null);
    setBit({ clima: 'soleado', personal: '12', maquinaria: 'Retroexcavadora', tareas: '', observaciones: '' });
  };

  const guardarBit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selProy) return;
    const payload = {
      proyectoId: selProy,
      fecha: editingBit?.fecha || todayISO(),
      clima: bit.clima as 'soleado' | 'nublado' | 'lluvia',
      personalPresente: safeNum(bit.personal),
      maquinaria: bit.maquinaria,
      tareasRealizadas: bit.tareas,
      observaciones: bit.observaciones,
      fotos: editingBit?.fotos ?? [],
    };

    if (editingBit) {
      updateBitacora(editingBit.id, payload);
      setEditingBit(null);
    } else {
      addBitacora(payload);
    }
    setBit({ clima: 'soleado', personal: '12', maquinaria: 'Retroexcavadora', tareas: '', observaciones: '' });
  };

  const ganttItems = useMemo(() => {
    const hitoItems = hitos.map((h: Hito) => ({
      id: h.id,
      nombre: h.nombre,
      proyecto: proyectos.find(p => p.id === h.proyectoId)?.nombre || 'Sin proyecto',
      fechaInicio: h.fecha,
      fechaFin: h.fecha,
      estado: h.estado === 'completado' ? 'completado' : h.estado === 'retrasado' ? 'vencido' : 'pendiente',
      avance: h.estado === 'completado' ? 100 : h.estado === 'retrasado' ? 0 : Math.max(1, safeNum(proyectos.find(p => p.id === h.proyectoId)?.avanceFisico)),
    }));
    const projectItems = proyectos.map(p => ({
      id: `${p.id}-proyecto`,
      nombre: p.nombre,
      proyecto: p.estado,
      fechaInicio: p.fechaInicio || p.fechaInicioReal || todayISO(),
      fechaFin: p.fechaFin || p.fechaFinEstimada || todayISO(),
      estado: p.estado === 'finalizado' ? 'completado' : p.estado === 'pausado' ? 'pendiente' : 'en_curso',
      avance: safeNum(p.avanceFisico),
    }));
    return [...hitoItems, ...projectItems].filter(i => i.fechaInicio && i.fechaFin);
  }, [proyectos, hitos]);

  const renderResumen = () => (
    <div className={`${CARD} overflow-hidden mb-3 sm:mb-4 p-0`}>
      <div className="overflow-x-auto">
        <table className="w-full text-xs sm:text-sm min-w-[620px]">
          <thead className="bg-muted text-muted-foreground text-xs">
            <tr>
              <th className="text-left p-3">Proyecto</th>
              <th className="p-3 w-28 sm:w-40">Avance Físico</th>
              <th className="p-3 w-28 sm:w-40">Avance Financiero</th>
              <th className="p-3 text-right">Ingresos</th>
              <th className="p-3 text-right">Gastos</th>
              <th className="p-3 text-right">Pendiente de Aportar</th>
            </tr>
          </thead>
          <tbody>
            {proyData.length === 0 ? (
              <tr><td colSpan={6} className="p-6 text-center text-xs text-muted-foreground">Sin proyectos cargados desde Supabase.</td></tr>
            ) : proyData.map(p => (
              <tr key={p.id} className="border-t border-border/50 hover:bg-muted/40 transition-colors">
                <td className="p-3">
                  <div className="font-semibold text-foreground">{p.nombre}</div>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                    p.estado === 'ejecucion'
                      ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300'
                      : 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300'
                  }`}>{p.estado}</span>
                </td>
                <td className="p-3">
                  {editingProject === p.id ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="number" min={0} max={100}
                        value={pendingProgress[p.id] ?? String(safeNum(p.avanceFisico))}
                        onChange={e => setPendingProgress(prev => ({ ...prev, [p.id]: e.target.value }))}
                        aria-label={`Avance físico de ${p.nombre}`}
                        className="w-20 px-2 py-1 border border-input bg-background text-foreground rounded text-xs focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                      <button type="button" onClick={() => saveProjectProgress(p.id)}
                        aria-label="Guardar avance"
                        className="p-1 rounded bg-emerald-500 text-white text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400">
                        <Save className="w-3.5 h-3.5" aria-hidden="true" />
                      </button>
                      <button type="button" onClick={() => setEditingProject(null)}
                        aria-label="Cancelar edición"
                        className="p-1 rounded bg-muted text-foreground text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                        <X className="w-3.5 h-3.5" aria-hidden="true" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Progress value={safeNum(p.avanceFisico)} color="#3b82f6" />
                      <span className="text-xs font-semibold w-10 text-foreground">{safePct(p.avanceFisico)}</span>
                      <button type="button" onClick={() => startEditProjectProgress(p.id, safeNum(p.avanceFisico))}
                        aria-label={`Editar avance físico de ${p.nombre}`}
                        className="p-1 rounded bg-muted hover:bg-accent text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                        <Pencil className="w-3.5 h-3.5" aria-hidden="true" />
                      </button>
                    </div>
                  )}
                </td>
                <td className="p-3"><div className="flex items-center gap-2"><Progress value={safeNum(p.avanceFinanciero)} color="#f97316" /><span className="text-xs font-semibold w-10 text-foreground">{safePct(p.avanceFinanciero)}</span></div></td>
                <td className="p-3 text-right text-emerald-600 dark:text-emerald-400 font-semibold">{fmtQ(safeNum(p.ing))}</td>
                <td className="p-3 text-right text-red-500 dark:text-red-400 font-semibold">{fmtQ(safeNum(p.gas))}</td>
                <td className="p-3 text-right text-foreground font-bold">{fmtQ(safeNum(p.pendiente))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderEVM = () => (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-3 sm:gap-4">
      <div className={`${CARD} xl:col-span-2`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h3 className={CARD_TITLE}>Valor Ganado (EVM)</h3>
            <p className="text-xs text-muted-foreground">Cálculo con presupuesto, avance y movimientos reales de Supabase.</p>
          </div>
          <select value={selProy} onChange={e => setSelProy(e.target.value)}
            aria-label="Seleccionar proyecto para EVM"
            className="text-xs px-2 py-1 rounded border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring">
            <option value="">Selecciona proyecto</option>
            {proyectos.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
          </select>
        </div>
        {proy ? (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mb-4">
              <div><Gauge value={CV} max={safeNum(proy.presupuestoTotal) || 1} label="CV (Costo)" color={CV >= 0 ? '#10b981' : '#ef4444'} /><div className={`text-center text-xs font-bold ${CV >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>{fmtQ(CV)}</div></div>
              <div><Gauge value={SV} max={safeNum(proy.presupuestoTotal) || 1} label="SV (Tiempo)" color={SV >= 0 ? '#10b981' : '#ef4444'} /><div className={`text-center text-xs font-bold ${SV >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>{fmtQ(SV)}</div></div>
              <div><Gauge value={spi} max={1.5} label="SPI" color={spi >= 1 ? '#10b981' : '#f59e0b'} /><div className="text-center text-xs font-bold">{spi.toFixed(2)}</div></div>
              <div><Gauge value={cpi} max={1.5} label="CPI" color={cpi >= 1 ? '#10b981' : '#f59e0b'} /><div className="text-center text-xs font-bold">{cpi.toFixed(2)}</div></div>
            </div>
            <div className="flex items-center justify-between">
              <h3 className={CARD_TITLE}>Físico vs Financiero</h3>
              <ChartToolbar
                types={['line']}
                currentType={barConfig.type}
                onTypeChange={barConfig.setType}
                palette={barConfig.palette}
                onPaletteChange={barConfig.setPalette}
                series={[
                  { id: 'Físico', label: 'Físico', color: '#3b82f6', visible: barConfig.isVisible('Físico') },
                  { id: 'Financ.', label: 'Financ.', color: '#f97316', visible: barConfig.isVisible('Financ.') },
                ]}
                onToggleSeries={barConfig.toggleSeries}
                onReset={barConfig.reset}
              />
            </div>
            <BarChart height={180} data={[
              { label: 'Físico', value: safeNum(proy.avanceFisico), color: '#3b82f6' },
              { label: 'Financ.', value: safeNum(proy.avanceFinanciero), color: '#f97316' },
            ]} palette={barConfig.palette} />
          </>
        ) : (
          <div className="p-6 text-center text-xs text-muted-foreground">Selecciona un proyecto para ver EVM.</div>
        )}
      </div>

      <div className={`${CARD} xl:col-span-1`}>
        <h3 className={CARD_TITLE}>Registros EVM</h3>
        <div className="space-y-2 mt-3 max-h-[460px] overflow-y-auto pr-1">
          {evmProyecto.length === 0 ? (
            <p className="text-xs text-muted-foreground">Sin registros en erp_seguimiento. Se muestra el cálculo en vivo desde proyecto y movimientos.</p>
          ) : evmProyecto.map(s => (
            <div key={s.id} className="rounded-lg bg-muted p-2 text-xs">
              <div className="flex items-center justify-between font-semibold">
                <span>{s.fecha}</span>
                <span>{fmtQ(safeNum(s.valorGanado))}</span>
              </div>
              <div className="mt-2 grid grid-cols-3 gap-1 text-muted-foreground">
                <span>PV {fmtQ(safeNum(s.valorPlaneado))}</span>
                <span>AC {fmtQ(safeNum(s.costoReal))}</span>
                <span>CV {fmtQ(safeNum(s.cv))}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderBitacora = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">
      <div className={`${CARD} lg:col-span-2`}>
        <h3 className={`${CARD_TITLE} flex items-center gap-1`}><Camera className="w-4 h-4 text-emerald-500" aria-hidden="true" /> Bitácora reciente</h3>
        <div className="space-y-2 mt-3 max-h-[520px] overflow-y-auto pr-1">
          {bitacora.length === 0 && <p className="text-xs text-muted-foreground">Sin entradas. Registre el reporte diario abajo.</p>}
          {bitacora.slice(0, 20).map(b => (
            <div key={b.id} className="bg-muted rounded-lg p-2 text-xs">
              <div className="flex justify-between items-start gap-2">
                <div>
                  <div className="font-semibold text-foreground">{proyectos.find(p => p.id === b.proyectoId)?.nombre}</div>
                  <div className="text-muted-foreground text-[10px]">{b.fecha}</div>
                </div>
                <div className="flex items-center gap-1">
                  <button type="button" onClick={() => startEditBitacora(b)}
                    aria-label="Editar entrada de bitácora"
                    className="p-1 rounded bg-muted hover:bg-accent text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                    <Pencil className="w-3.5 h-3.5" aria-hidden="true" />
                  </button>
                  <button type="button" onClick={() => deleteBitacora(b.id)}
                    aria-label="Eliminar entrada de bitácora"
                    className="p-1 rounded bg-red-100 dark:bg-red-900/40 hover:bg-red-200 dark:hover:bg-red-900/60 text-red-600 dark:text-red-400 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400">
                    <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground mt-0.5">
                <CloudRain className="w-3 h-3" aria-hidden="true" /> {b.clima} · {safeNum(b.personalPresente)} pers.
              </div>
              {b.tareasRealizadas && <p className="text-foreground/80 mt-0.5">{b.tareasRealizadas}</p>}
              {b.observaciones && <p className="text-muted-foreground mt-0.5 italic">{b.observaciones}</p>}
            </div>
          ))}
        </div>
      </div>

      <form onSubmit={guardarBit} className={`${CARD}`}>
        <div className="flex items-start sm:items-center justify-between gap-2 mb-3 sm:mb-4">
          <div className="min-w-0">
            <h3 className={`${CARD_TITLE} text-sm sm:text-base`}>{editingBit ? 'Editar Bitácora' : 'Reporte Diario de Campo'}</h3>
            {editingBit && <p className="text-xs text-muted-foreground truncate">Editando: {proyectos.find(p => p.id === editingBit.proyectoId)?.nombre}</p>}
          </div>
          {editingBit && (
            <button type="button" onClick={cancelEditBitacora} className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
              <X className="w-3.5 h-3.5" /> Cancelar
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
          <select value={selProy} onChange={e => setSelProy(e.target.value)} className={`${INPUT} sm:col-span-2`}>
            <option value="">Selecciona proyecto</option>
            {proyectos.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
          </select>
          <select value={bit.clima} onChange={e => setBit({ ...bit, clima: e.target.value })} className={INPUT}>
            <option value="soleado">Soleado</option>
            <option value="nublado">Nublado</option>
            <option value="lluvia">Lluvia</option>
          </select>
          <input type="number" value={bit.personal} onChange={e => setBit({ ...bit, personal: e.target.value })} placeholder="Personal activo" className={INPUT} />
          <input value={bit.maquinaria} onChange={e => setBit({ ...bit, maquinaria: e.target.value })} placeholder="Maquinaria" className={`${INPUT} md:col-span-2`} />
          <input value={bit.tareas} onChange={e => setBit({ ...bit, tareas: e.target.value })} placeholder="Tareas ejecutadas" className={`${INPUT} md:col-span-2`} />
          <textarea value={bit.observaciones} onChange={e => setBit({ ...bit, observaciones: e.target.value })} placeholder="Observaciones" className={`${INPUT} md:col-span-4 min-h-20`} />
        </div>
        <button type="submit"
          className="mt-3 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400">
          <Plus className="w-4 h-4" aria-hidden="true" /> {editingBit ? 'Guardar cambios' : 'Registrar Reporte'}
        </button>
      </form>
    </div>
  );

  const renderAvances = () => {
    const avanceData = selProy ? avanceProyecto : avances.slice().sort((a, b) => b.fecha.localeCompare(a.fecha));
    return (
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-3 sm:gap-4">
        <div className={`${CARD} xl:col-span-2 overflow-hidden`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
            <h3 className={CARD_TITLE}>Avances de obra</h3>
            <select value={selProy} onChange={e => setSelProy(e.target.value)} className={`${INPUT} sm:w-72`}>
              <option value="">Todos los proyectos</option>
              {proyectos.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
            </select>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs sm:text-sm min-w-[620px]">
              <thead className="bg-muted text-muted-foreground">
                <tr>
                  <th className="text-left p-3">Fecha</th>
                  <th className="text-left p-3">Proyecto</th>
                  <th className="text-left p-3">Renglón</th>
                  <th className="p-3 text-right">Avance Físico</th>
                  <th className="p-3 text-right">Cantidad Ejecutada</th>
                  <th className="p-3">Notas</th>
                </tr>
              </thead>
              <tbody>
                {avanceData.length === 0 ? (
                  <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">Sin avances cargados.</td></tr>
                ) : avanceData.map((a: AvanceObra) => (
                  <tr key={a.id} className="border-t border-border/50">
                    <td className="p-3">{a.fecha}</td>
                    <td className="p-3 font-medium">{proyectos.find(p => p.id === a.proyectoId)?.nombre}</td>
                    <td className="p-3">{a.renglonNombre || a.renglonCodigo || a.renglonId || 'Global'}</td>
                    <td className="p-3 text-right"><Progress value={safeNum(a.avanceFisico)} color="#10b981" /><span className="ml-2 font-semibold">{safePct(a.avanceFisico)}</span></td>
                    <td className="p-3 text-right font-semibold">{safeNum(a.cantidadEjecutada).toLocaleString('es-GT')}</td>
                    <td className="p-3 text-muted-foreground">{a.notas || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className={`${CARD}`}>
          <h3 className={CARD_TITLE}>Curva de avance</h3>
          {avanceData.length > 0 ? (
            <LineChart height={220}
              labels={avanceData.map(a => a.fecha.slice(5))}
              series={[{ label: 'Avance físico', data: avanceData.map(a => safeNum(a.avanceFisico)), color: '#10b981' }]}
            />
          ) : (
            <div className="p-6 text-center text-xs text-muted-foreground">Selecciona un proyecto con avances para ver la curva.</div>
          )}
        </div>
      </div>
    );
  };

  const renderCronograma = () => (
    <div className={`${CARD}`}>
      <div className="flex items-center justify-between gap-2 mb-3">
        <div>
          <h3 className={`${CARD_TITLE} flex items-center gap-1`}><CalendarClock className="w-4 h-4 text-primary" aria-hidden="true" /> Cronograma integrado</h3>
          <p className="text-xs text-muted-foreground">Combina hitos de erp_hitos con fechas base de proyectos.</p>
        </div>
      </div>
      {ganttItems.length > 0 ? <GanttChart items={ganttItems} /> : (
        <div className="p-6 text-center text-xs text-muted-foreground">Sin hitos ni fechas de proyecto cargadas.</div>
      )}
    </div>
  );

  return (
    <div className="p-2 sm:p-3 lg:p-4 max-w-[1600px] mx-auto">
      <div className="mb-3 sm:mb-4">
        <h1 className="text-lg sm:text-xl lg:text-2xl font-black text-foreground flex items-center gap-2">
          <ClipboardCheck className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-500" aria-hidden="true" /> Seguimiento y Control
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">Avance físico-financiero, bitácora, EVM y cronograma con datos reales de Supabase.</p>
      </div>

      <div className={`${CARD} p-1 mb-3 sm:mb-4`}>
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-1">
          {tabs.map(tab => {
            const active = activeTab === tab.id;
            return (
              <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)}
                className={`rounded-lg px-3 py-2 text-left transition-colors ${active ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}>
                <span className="block text-xs sm:text-sm font-bold">{tab.label}</span>
                <span className={`hidden sm:block text-[10px] ${active ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>{tab.description}</span>
              </button>
            );
          })}
        </div>
      </div>

      {activeTab === 'resumen' && renderResumen()}
      {activeTab === 'evm' && renderEVM()}
      {activeTab === 'bitacora' && renderBitacora()}
      {activeTab === 'avances' && renderAvances()}
      {activeTab === 'cronograma' && renderCronograma()}
    </div>
  );
};

export default Seguimiento;
