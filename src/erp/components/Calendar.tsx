import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useErp } from '../store';
import { ChevronLeft, ChevronRight, Plus, Check, Users } from 'lucide-react';

const Calendar: React.FC = () => {
  const { t } = useTranslation();
  const { eventos, addEvento, updateEvento, deleteEvento, proyectos, empleados } = useErp();
  const [cursor, setCursor] = useState(new Date());
  const [sel, setSel] = useState<string | null>(null);
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [hora, setHora] = useState('09:00');
  const [tipo, setTipo] = useState<'Recordatorio' | 'Actividad' | 'Reunión' | 'Visita'>('Recordatorio');
  const [proyectoSel, setProyectoSel] = useState<string | null>(null);

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const first = new Date(year, month, 1).getDay();
  const days = new Date(year, month + 1, 0).getDate();
  const monthName = cursor.toLocaleDateString('es-GT', { month: 'long', year: 'numeric' });

  const iso = (d: number) => `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  const todayIsoVal = new Date().toISOString().slice(0, 10);
  const selEventos = eventos.filter(e => e.fecha === sel).sort((a, b) => (a.hora || '00:00').localeCompare(b.hora || '00:00'));

  const upcoming = useMemo(() => {
    const now = new Date();
    return eventos
      .filter(e => new Date(`${e.fecha}T${e.hora || '09:00'}:00`) >= now)
      .sort((a, b) => new Date(`${a.fecha}T${a.hora || '09:00'}:00`).getTime() - new Date(`${b.fecha}T${b.hora || '09:00'}:00`).getTime())
      .slice(0, 3);
  }, [eventos]);

  const handleAddEvento = () => {
    if (!titulo.trim() || !sel) return;
    addEvento({
      fecha: sel,
      hora,
      titulo: titulo.trim(),
      descripcion: descripcion.trim() || undefined,
      tipo,
      proyectoId: proyectoSel,
      completado: false,
    });
    setTitulo('');
    setDescripcion('');
    setHora('09:00');
    setTipo('Recordatorio');
    setProyectoSel(null);
  };

  const handleToggleCompleted = (id: string, completed?: boolean) => {
    updateEvento(id, { completado: !completed });
  };

  return (
    <div className="bg-card rounded-2xl p-3 shadow-sm border border-border h-full flex flex-col overflow-hidden">
      <div className="flex items-center justify-between mb-2 flex-shrink-0">
        <span className="font-bold text-foreground text-sm capitalize">{monthName}</span>
        <div className="flex gap-1">
          <button onClick={() => setCursor(new Date(year, month - 1, 1))} className="p-1 hover:bg-muted rounded">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button onClick={() => setCursor(new Date(year, month + 1, 1))} className="p-1 hover:bg-muted rounded">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center">
        {['D', 'L', 'M', 'M', 'J', 'V', 'S'].map((d, i) => (
          <div key={i} className="text-[10px] font-semibold text-muted-foreground">{d}</div>
        ))}
        {Array.from({ length: first }).map((_, i) => <div key={'e' + i} />)}
        {Array.from({ length: days }).map((_, i) => {
          const d = i + 1;
          const di = iso(d);
          const hasEv = eventos.some(e => e.fecha === di);
          const isToday = di === todayIsoVal;
          return (
            <button key={d} onClick={() => setSel(di)} className={`aspect-square text-xs rounded-lg flex flex-col items-center justify-center relative transition-colors ${sel === di ? 'bg-primary text-primary-foreground' : isToday ? 'bg-primary/10 text-primary font-bold' : 'hover:bg-muted text-foreground/70'}`}>
              {d}
              {hasEv && <span className={`w-1 h-1 rounded-full absolute bottom-1 ${sel === di ? 'bg-primary-foreground' : 'bg-primary'}`} />}
            </button>
          );
        })}
      </div>

      <div className="mt-2 overflow-y-auto flex-1 min-h-0 space-y-2">
        <div className="space-y-3">
          <div className="rounded-2xl border border-border p-4 bg-muted">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-foreground/80">{t('common.proximas_actividades')}</span>
              <span className="text-[10px] text-muted-foreground">{upcoming.length} {t('common.agenda')}</span>
            </div>
            {upcoming.length === 0 ? (
              <p className="text-xs text-muted-foreground">{t('common.no_recordatorios')}</p>
            ) : (
              <div className="space-y-2">
                {upcoming.map(evento => (
                  <div key={evento.id} className="rounded-2xl bg-card border border-border p-3">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <p className="text-[11px] font-semibold text-foreground">{evento.titulo}</p>
                        <p className="text-[10px] text-muted-foreground">{evento.fecha} • {evento.hora || '09:00'}</p>
                      </div>
                      <span className="text-[10px] text-muted-foreground">{evento.tipo || 'Actividad'}</span>
                    </div>
                    <div className="flex flex-wrap gap-2 text-[10px] text-muted-foreground">
                      {evento.proyectoId && <span className="rounded-full bg-muted px-2 py-1">{proyectos.find(p => p.id === evento.proyectoId)?.nombre.split(' ')[0]}</span>}
                      {evento.descripcion && <span className="rounded-full bg-primary/10 px-2 py-1 text-primary">{t('common.con_notas')}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-border p-4 bg-muted">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-foreground/80">{t('common.crear_recordatorio')}</span>
              <span className="text-[10px] text-muted-foreground">{t('common.fecha')}: {sel || t('common.ninguno')}</span>
            </div>
            <div className="space-y-2">
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <input
                  value={titulo}
                  onChange={e => setTitulo(e.target.value)}
                  placeholder={t('common.titulo')}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-border outline-none focus:border-ring"
                />
                <input
                  type="time"
                  value={hora}
                  onChange={e => setHora(e.target.value)}
                  placeholder="00:00"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-border outline-none focus:border-ring"
                />
              </div>
              <textarea
                value={descripcion}
                onChange={e => setDescripcion(e.target.value)}
                placeholder={t('common.descripcion')}
                className="w-full px-3 py-2 text-xs rounded-xl border border-border outline-none focus:border-ring min-h-[80px] resize-none"
              />
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <select
                  value={tipo}
                  onChange={e => setTipo(e.target.value as 'Recordatorio' | 'Actividad' | 'Reunión' | 'Visita')}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-border outline-none focus:border-ring bg-card"
                >
                  <option value="Recordatorio">Recordatorio</option>
                  <option value="Actividad">Actividad</option>
                  <option value="Reunión">Reunión</option>
                  <option value="Visita">Visita</option>
                </select>
                <select
                  value={proyectoSel || ''}
                  onChange={e => setProyectoSel(e.target.value || null)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-border outline-none focus:border-ring bg-card"
                >
                  <option value="">{t('common.sin_proyecto')}</option>
                  {proyectos.map(p => (
                    <option key={p.id} value={p.id}>{p.nombre}</option>
                  ))}
                </select>
              </div>
              <button
                onClick={handleAddEvento}
                disabled={!titulo.trim() || !sel}
                className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-primary-foreground rounded-xl bg-primary hover:bg-primary/90 disabled:opacity-50"
              >
                <Plus className="w-4 h-4" /> {t('common.guardar')}
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="rounded-2xl border border-border p-4 bg-muted h-full">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-foreground/80">{t('common.proximas_actividades')}</span>
              <span className="text-[10px] text-muted-foreground">{sel || t('common.elige_dia')}</span>
            </div>
            {sel ? (
              selEventos.length === 0 ? (
                <p className="text-xs text-muted-foreground">{t('common.fecha_libre')}</p>
              ) : (
                <div className="space-y-2">
                  {selEventos.map(e => (
                    <div key={e.id} className="rounded-2xl border border-border bg-card p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[11px] font-semibold text-foreground">{e.titulo}</span>
                            <span className="text-[10px] text-muted-foreground">{e.hora || '09:00'}</span>
                          </div>
                          <p className="text-[10px] text-muted-foreground mb-1">{e.tipo || 'Actividad'}</p>
                          {e.descripcion && <p className="text-[10px] text-muted-foreground/70">{e.descripcion}</p>}
                          {e.proyectoId && (
                            <span className="inline-flex rounded-full bg-muted px-2 py-1 text-[10px] text-foreground/80 mt-2">
                              {proyectos.find(p => p.id === e.proyectoId)?.nombre || 'Proyecto'}
                            </span>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <button
                            onClick={() => handleToggleCompleted(e.id, e.completado)}
                            className={`text-[10px] px-2 py-1 rounded-full ${e.completado ? 'bg-success/10 text-success' : 'bg-muted text-foreground/70'}`}
                          >
                            <Check className="w-3 h-3 inline-block mr-1" />{e.completado ? t('common.completado') : t('common.marcar_hecho')}
                          </button>
                          <button onClick={() => deleteEvento(e.id)} className="text-[10px] text-destructive hover:text-destructive/80">{t('common.eliminar')}</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )
            ) : (
              <p className="text-xs text-muted-foreground">{t('common.selecciona_dia')}</p>
            )}
          </div>

          <div className="rounded-2xl border border-border p-4 bg-muted">
            <span className="text-xs font-semibold text-foreground/80 flex items-center gap-1"><Users className="w-3 h-3" /> {t('common.disponibilidad_proyecto')}</span>
            <div className="mt-2 space-y-2">
              {proyectos.length === 0 ? (
                <p className="text-[10px] text-muted-foreground">{t('common.sin_proyectos')}</p>
              ) : (
                proyectos.slice(0, 5).map(p => {
                  const count = empleados.filter(e => e.proyectoIds?.includes(p.id)).length;
                  return (
                    <div key={p.id} className="flex items-center justify-between">
                      <span className="text-[10px] text-foreground/80 truncate max-w-[120px]">{p.nombre}</span>
                      <span className={`text-[10px] font-semibold ${count > 0 ? 'text-success' : 'text-muted-foreground/40'}`}>
                        {count} {count === 1 ? t('common.persona') : t('common.personas')}
                      </span>
                    </div>
                  );
                })
              )}
              {proyectos.length > 5 && <p className="text-[10px] text-muted-foreground">{t('common.proyectos_mas', { n: proyectos.length - 5 })}</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Calendar;
