import React, { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { useErp, uid } from '../store';
import ProyectoFilter from '../components/ProyectoFilter';
import { ClipboardList, Users, Clock, Plus, Trash2, Timer } from 'lucide-react';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { INPUT, BUTTON_PRIMARY, BUTTON_SECONDARY } from '../ui';

interface RendimientoRegistro {
  id: string;
  proyectoId: string;
  cuadrilla: string;
  actividad: string;
  unidad: string;
  cantidad: number;
  horasHombre: number;
  fecha: string;
}

const rendimientoSchema = z.object({
  id: z.string(),
  proyectoId: z.string(),
  cuadrilla: z.string(),
  actividad: z.string(),
  unidad: z.string(),
  cantidad: z.number(),
  horasHombre: z.number(),
  fecha: z.string(),
});

const RendimientoCampo: React.FC = () => {
  const { t } = useTranslation();
  const { proyectos, currentProjectId, setCurrentProjectId } = useErp();
  const BASE = 'rendimiento_campo';

  const [rendimientos, setRendimientos] = useState<z.infer<typeof rendimientoSchema>[]>(() => {
    try {
      const raw = JSON.parse(localStorage.getItem('wm_erp_rendimiento_campo') || '[]');
      const parsed = z.array(rendimientoSchema).safeParse(raw);
      return parsed.success ? parsed.data : [];
    } catch { return []; }
  });
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Record<string, any>>({});

  const saveRendimientos = (data: z.infer<typeof rendimientoSchema>[]) => {
    const parsed = z.array(rendimientoSchema).safeParse(data);
    if (parsed.success) {
      setRendimientos(parsed.data);
      localStorage.setItem('wm_erp_rendimiento_campo', JSON.stringify(parsed.data));
    }
  };

  const addRendimiento = (data: Omit<RendimientoRegistro, 'id'>) => {
    saveRendimientos([{ ...data, id: uid() }, ...rendimientos]);
  };

  const deleteRendimiento = (id: string) => {
    saveRendimientos(rendimientos.filter(r => r.id !== id));
    toast.success(t(`${BASE}.eliminado`, 'Registro eliminado'));
  };

  const filtered = useMemo(() => {
    let items = rendimientos;
    if (currentProjectId && currentProjectId !== 'none') {
      items = items.filter(r => r.proyectoId === currentProjectId);
    }
    return items.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
  }, [rendimientos, currentProjectId]);

  const kpis = useMemo(() => {
    const cuadrillas = new Set(filtered.map(r => r.cuadrilla)).size;
    const totalHH = filtered.reduce((a, r) => a + r.horasHombre, 0);
    const rendimientoPromedio = totalHH > 0
      ? (filtered.reduce((a, r) => a + r.cantidad, 0) / totalHH).toFixed(2)
      : '0';
    return { cuadrillasActivas: cuadrillas, totalHoras: totalHH, rendimientoProm: rendimientoPromedio };
  }, [filtered]);

  const FOCUS_VISIBLE = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

  const [loading, setLoading] = useState(true);
  useEffect(() => { const t = setTimeout(() => setLoading(false), 400); return () => clearTimeout(t); }, []);
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <h1 className="text-lg sm:text-xl font-black text-foreground truncate" title={t(`${BASE}.titulo`, 'Rendimiento de Campo')}>
          {t(`${BASE}.titulo`, 'Rendimiento de Campo')}
        </h1>
        <div className="flex items-center gap-2">
          <ProyectoFilter value={currentProjectId || ''} onChange={(v) => setCurrentProjectId(v || null)} proyectos={proyectos} />
          <button onClick={() => { setShowForm(true); setForm({}); }}
            className={`${BUTTON_PRIMARY} text-xs flex items-center gap-1 ${FOCUS_VISIBLE}`}><Plus className="w-3 h-3" aria-hidden="true" /> {t(`${BASE}.nuevo`, 'Nuevo')}</button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <Users className="w-4 h-4 text-blue-500" aria-hidden="true" />
            <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">{t(`${BASE}.cuadrillas`, 'Cuadrillas')}</p>
          </div>
          <p className="text-2xl font-bold text-foreground">{kpis.cuadrillasActivas}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <Timer className="w-4 h-4 text-amber-500" aria-hidden="true" />
            <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">{t(`${BASE}.hh`, 'Horas Hombre')}</p>
          </div>
          <p className="text-2xl font-bold text-foreground">{kpis.totalHoras}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <ClipboardList className="w-4 h-4 text-emerald-500" aria-hidden="true" />
            <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">{t(`${BASE}.rendimiento_prom`, 'Rend. Prom.')}</p>
          </div>
          <p className="text-2xl font-bold text-foreground">{kpis.rendimientoProm} unid/hh</p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm" role="table" aria-label={t(`${BASE}.titulo`, 'Rendimiento de Campo')}>
            <thead>
              <tr className="bg-muted">
                <th className="p-2 text-left" scope="col">{t(`${BASE}.fecha`, 'Fecha')}</th>
                <th className="p-2 text-left" scope="col">{t(`${BASE}.cuadrilla`, 'Cuadrilla')}</th>
                <th className="p-2 text-left" scope="col">{t(`${BASE}.actividad`, 'Actividad')}</th>
                <th className="p-2 text-right" scope="col">{t(`${BASE}.cantidad`, 'Cantidad')}</th>
                <th className="p-2 text-right" scope="col">{t(`${BASE}.horas`, 'Horas')}</th>
                <th className="p-2 text-right" scope="col">{t(`${BASE}.rendimiento`, 'Rend.')}</th>
                <th className="p-2 text-right" scope="col">{t('common.acciones')}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">
                  <ClipboardList className="w-8 h-8 mx-auto mb-2 opacity-30" aria-hidden="true" />
                  <p className="text-sm">{t(`${BASE}.sin_datos`, 'Sin capturas registradas')}</p>
                  <p className="text-xs mt-1">{t(`${BASE}.subtitle`, 'Registra producción y horas por cuadrilla')}</p>
                </td></tr>
              ) : (
                filtered.map(r => {
                  const rend = r.horasHombre > 0 ? (r.cantidad / r.horasHombre).toFixed(2) : '—';
                  return (
                    <tr key={r.id} className="border-t hover:bg-muted/50" tabIndex={0}>
                      <td className="p-2 text-xs text-muted-foreground">{new Date(r.fecha).toLocaleDateString()}</td>
                      <td className="p-2 font-medium">{r.cuadrilla}</td>
                      <td className="p-2 text-xs truncate max-w-xs" title={r.actividad}>{r.actividad}</td>
                      <td className="p-2 text-right font-mono">{r.cantidad} {r.unidad}</td>
                      <td className="p-2 text-right font-mono">{r.horasHombre}</td>
                      <td className="p-2 text-right font-mono text-emerald-600 dark:text-emerald-400 font-medium">{rend}</td>
                      <td className="p-2 text-right">
                        <button onClick={() => deleteRendimiento(r.id)} aria-label={t('common.eliminar')}
                          className={`p-1.5 rounded hover:bg-accent text-red-500 ${FOCUS_VISIBLE}`}><Trash2 className="w-3 h-3" aria-hidden="true" /></button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center animate-in fade-in duration-200" role="dialog" aria-modal="true" aria-label={t(`${BASE}.nuevo`, 'Nuevo registro')}>
          <div className="bg-card rounded-lg p-6 w-full max-w-md shadow-sm" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold mb-4 text-foreground">{t(`${BASE}.nuevo`, 'Nuevo Registro de Rendimiento')}</h3>
            <div className="grid gap-3">
              <select className={INPUT} value={form.proyectoId || ''} onChange={e => setForm({ ...form, proyectoId: e.target.value })}>
                <option value="">{t(`${BASE}.seleccionar_proyecto`, 'Seleccionar proyecto')}</option>
                {proyectos.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
              </select>
              <input placeholder={t(`${BASE}.cuadrilla_ph`, 'Nombre de cuadrilla')} className={INPUT}
                value={form.cuadrilla || ''} onChange={e => setForm({ ...form, cuadrilla: e.target.value })} />
              <input placeholder={t(`${BASE}.actividad_ph`, 'Actividad realizada')} className={INPUT}
                value={form.actividad || ''} onChange={e => setForm({ ...form, actividad: e.target.value })} />
              <div className="grid grid-cols-2 gap-2">
                <input type="number" inputMode="decimal" placeholder={t(`${BASE}.cantidad_ph`, 'Cantidad')} className={INPUT}
                  value={form.cantidad || ''} onChange={e => setForm({ ...form, cantidad: +e.target.value })} />
                <input placeholder={t(`${BASE}.unidad_ph`, 'Unidad')} className={INPUT}
                  value={form.unidad || ''} onChange={e => setForm({ ...form, unidad: e.target.value })} />
              </div>
              <input type="number" inputMode="decimal" placeholder={t(`${BASE}.horas_ph`, 'Horas hombre')} className={INPUT}
                value={form.horasHombre || ''} onChange={e => setForm({ ...form, horasHombre: +e.target.value })} />
              <input type="date" className={INPUT}
                value={form.fecha || new Date().toISOString().split('T')[0]}
                onChange={e => setForm({ ...form, fecha: e.target.value })} />
              <button onClick={() => {
                if (!form.proyectoId || !form.cuadrilla || !form.actividad) {
                  toast.error(t(`${BASE}.error_campos`, 'Completa todos los campos requeridos'));
                  return;
                }
                addRendimiento({
                  proyectoId: form.proyectoId,
                  cuadrilla: form.cuadrilla,
                  actividad: form.actividad,
                  unidad: form.unidad || 'unid',
                  cantidad: form.cantidad || 0,
                  horasHombre: form.horasHombre || 0,
                  fecha: form.fecha || new Date().toISOString().split('T')[0],
                });
                setShowForm(false);
                toast.success(t(`${BASE}.guardado`, 'Rendimiento registrado'));
              }} className={`${BUTTON_PRIMARY} ${FOCUS_VISIBLE}`}>{t('common.guardar')}</button>
              <button onClick={() => setShowForm(false)} className={`${BUTTON_SECONDARY} ${FOCUS_VISIBLE}`}>{t('common.cancelar')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RendimientoCampo;
