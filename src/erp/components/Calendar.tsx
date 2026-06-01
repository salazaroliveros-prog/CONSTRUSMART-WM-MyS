import React, { useMemo, useState } from 'react';
import { useErp } from '../store';
import { ChevronLeft, ChevronRight, Plus, Check } from 'lucide-react';

const Calendar: React.FC = () => {
  const { eventos, addEvento, updateEvento, deleteEvento, proyectos } = useErp();
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
    <div className="bg-white rounded-2xl p-3 shadow-sm border border-slate-100 h-full flex flex-col overflow-hidden">
      <div className="flex items-center justify-between mb-2 flex-shrink-0">
        <span className="font-bold text-slate-700 text-sm capitalize">{monthName}</span>
        <div className="flex gap-1">
          <button onClick={() => setCursor(new Date(year, month - 1, 1))} className="p-1 hover:bg-slate-100 rounded">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button onClick={() => setCursor(new Date(year, month + 1, 1))} className="p-1 hover:bg-slate-100 rounded">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center">
        {['D', 'L', 'M', 'M', 'J', 'V', 'S'].map((d, i) => (
          <div key={i} className="text-[10px] font-semibold text-slate-400">{d}</div>
        ))}
        {Array.from({ length: first }).map((_, i) => <div key={'e' + i} />)}
        {Array.from({ length: days }).map((_, i) => {
          const d = i + 1;
          const di = iso(d);
          const hasEv = eventos.some(e => e.fecha === di);
          const isToday = di === todayIsoVal;
          return (
            <button key={d} onClick={() => setSel(di)} className={`aspect-square text-xs rounded-lg flex flex-col items-center justify-center relative transition-colors ${sel === di ? 'bg-orange-500 text-white' : isToday ? 'bg-orange-100 text-orange-700 font-bold' : 'hover:bg-slate-100 text-slate-600'}`}>
              {d}
              {hasEv && <span className={`w-1 h-1 rounded-full absolute bottom-1 ${sel === di ? 'bg-white' : 'bg-orange-500'}`} />}
            </button>
          );
        })}
      </div>

      <div className="mt-2 overflow-y-auto flex-1 min-h-0 space-y-2">
        <div className="space-y-3">
          <div className="rounded-2xl border border-slate-100 p-4 bg-slate-50">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-600">Próximas actividades</span>
              <span className="text-[10px] text-slate-400">{upcoming.length} agenda</span>
            </div>
            {upcoming.length === 0 ? (
              <p className="text-xs text-slate-400">No hay recordatorios próximos. Crea uno seleccionando un día.</p>
            ) : (
              <div className="space-y-2">
                {upcoming.map(evento => (
                  <div key={evento.id} className="rounded-2xl bg-white border border-slate-200 p-3">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <p className="text-[11px] font-semibold text-slate-800">{evento.titulo}</p>
                        <p className="text-[10px] text-slate-500">{evento.fecha} • {evento.hora || '09:00'}</p>
                      </div>
                      <span className="text-[10px] text-slate-500">{evento.tipo || 'Actividad'}</span>
                    </div>
                    <div className="flex flex-wrap gap-2 text-[10px] text-slate-500">
                      {evento.proyectoId && <span className="rounded-full bg-slate-100 px-2 py-1">{proyectos.find(p => p.id === evento.proyectoId)?.nombre.split(' ')[0]}</span>}
                      {evento.descripcion && <span className="rounded-full bg-orange-100 px-2 py-1 text-orange-600">Con notas</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-slate-100 p-4 bg-slate-50">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-600">Crear recordatorio</span>
              <span className="text-[10px] text-slate-400">Fecha: {sel || 'Sin seleccionar'}</span>
            </div>
            <div className="space-y-2">
              <div className="grid gap-2 sm:grid-cols-2">
                <input
                  value={titulo}
                  onChange={e => setTitulo(e.target.value)}
                  placeholder="Título"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 outline-none focus:border-orange-400"
                />
                <input
                  type="time"
                  value={hora}
                  onChange={e => setHora(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 outline-none focus:border-orange-400"
                />
              </div>
              <textarea
                value={descripcion}
                onChange={e => setDescripcion(e.target.value)}
                placeholder="Descripción opcional"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 outline-none focus:border-orange-400 min-h-[80px] resize-none"
              />
              <div className="grid gap-2 sm:grid-cols-2">
                <select
                  value={tipo}
                  onChange={e => setTipo(e.target.value as 'Recordatorio' | 'Actividad' | 'Reunión' | 'Visita')}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 outline-none focus:border-orange-400"
                >
                  <option value="Recordatorio">Recordatorio</option>
                  <option value="Actividad">Actividad</option>
                  <option value="Reunión">Reunión</option>
                  <option value="Visita">Visita</option>
                </select>
                <select
                  value={proyectoSel || ''}
                  onChange={e => setProyectoSel(e.target.value || null)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 outline-none focus:border-orange-400"
                >
                  <option value="">Sin proyecto</option>
                  {proyectos.map(p => (
                    <option key={p.id} value={p.id}>{p.nombre}</option>
                  ))}
                </select>
              </div>
              <button
                onClick={handleAddEvento}
                disabled={!titulo.trim() || !sel}
                className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-white rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-50"
              >
                <Plus className="w-4 h-4" /> Guardar actividad
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="rounded-2xl border border-slate-100 p-4 bg-slate-50 h-full">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-600">Detalles del día</span>
              <span className="text-[10px] text-slate-400">{sel || 'Elige un día'}</span>
            </div>
            {sel ? (
              selEventos.length === 0 ? (
                <p className="text-xs text-slate-400">Esta fecha está libre. Crea una actividad para que te la recuerde.</p>
              ) : (
                <div className="space-y-2">
                  {selEventos.map(e => (
                    <div key={e.id} className="rounded-2xl border border-slate-200 bg-white p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[11px] font-semibold text-slate-800">{e.titulo}</span>
                            <span className="text-[10px] text-slate-500">{e.hora || '09:00'}</span>
                          </div>
                          <p className="text-[10px] text-slate-500 mb-1">{e.tipo || 'Actividad'}</p>
                          {e.descripcion && <p className="text-[10px] text-slate-400">{e.descripcion}</p>}
                          {e.proyectoId && (
                            <span className="inline-flex rounded-full bg-slate-100 px-2 py-1 text-[10px] text-slate-600 mt-2">
                              {proyectos.find(p => p.id === e.proyectoId)?.nombre || 'Proyecto'}
                            </span>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <button
                            onClick={() => handleToggleCompleted(e.id, e.completado)}
                            className={`text-[10px] px-2 py-1 rounded-full ${e.completado ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}
                          >
                            <Check className="w-3 h-3 inline-block mr-1" />{e.completado ? 'Completado' : 'Marcar hecho'}
                          </button>
                          <button onClick={() => deleteEvento(e.id)} className="text-[10px] text-red-500 hover:text-red-600">Eliminar</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )
            ) : (
              <p className="text-xs text-slate-400">Selecciona un día para ver sus actividades y detalles de recordatorio.</p>
            )}
          </div>

          <div className="rounded-2xl border border-slate-100 p-4 bg-slate-50">
            <span className="text-xs font-semibold text-slate-600">Consejo de recordatorios</span>
            <p className="text-[10px] text-slate-500 mt-2">El navegador te solicitará permiso de notificaciones. Acepta para recibir alertas automáticas de tus actividades programadas.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Calendar;