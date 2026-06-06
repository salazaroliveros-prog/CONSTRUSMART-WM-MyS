import React, { useState } from 'react';
import { useErp } from '../store';
import { ChevronLeft, ChevronRight, Plus, X } from 'lucide-react';

const Calendar: React.FC = () => {
  const { eventos, addEvento, deleteEvento, proyectos } = useErp();
  const [cursor, setCursor] = useState(new Date());
  const [sel, setSel] = useState<string | null>(null);
  const [titulo, setTitulo] = useState('');

  const year = cursor.getFullYear(), month = cursor.getMonth();
  const first = new Date(year, month, 1).getDay();
  const days = new Date(year, month + 1, 0).getDate();
  const monthName = cursor.toLocaleDateString('es-GT', { month: 'long', year: 'numeric' });

  const iso = (d: number) => `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  const todayIso = new Date().toISOString().slice(0, 10);
  const selEventos = eventos.filter(e => e.fecha === sel);

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 h-full">
      <div className="flex items-center justify-between mb-3">
        <span className="font-bold text-slate-700 text-sm capitalize">{monthName}</span>
        <div className="flex gap-1">
          <button onClick={() => setCursor(new Date(year, month - 1, 1))} className="p-1 hover:bg-slate-100 rounded"><ChevronLeft className="w-4 h-4" /></button>
          <button onClick={() => setCursor(new Date(year, month + 1, 1))} className="p-1 hover:bg-slate-100 rounded"><ChevronRight className="w-4 h-4" /></button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center">
        {['D', 'L', 'M', 'M', 'J', 'V', 'S'].map((d, i) => <div key={i} className="text-[10px] font-semibold text-slate-400">{d}</div>)}
        {Array.from({ length: first }).map((_, i) => <div key={'e' + i} />)}
        {Array.from({ length: days }).map((_, i) => {
          const d = i + 1;
          const di = iso(d);
          const hasEv = eventos.some(e => e.fecha === di);
          const isToday = di === todayIso;
          return (
            <button key={d} onClick={() => setSel(di)}
              className={`aspect-square text-xs rounded-lg flex flex-col items-center justify-center relative transition-colors
                ${sel === di ? 'bg-orange-500 text-white' : isToday ? 'bg-orange-100 text-orange-700 font-bold' : 'hover:bg-slate-100 text-slate-600'}`}>
              {d}
              {hasEv && <span className={`w-1 h-1 rounded-full absolute bottom-1 ${sel === di ? 'bg-white' : 'bg-orange-500'}`} />}
            </button>
          );
        })}
      </div>

      {sel && (
        <div className="mt-3 border-t border-slate-100 pt-3">
          <div className="text-xs font-semibold text-slate-600 mb-2">Actividades {sel}</div>
          {selEventos.map(e => (
            <div key={e.id} className="flex items-center justify-between bg-slate-50 rounded-lg px-2 py-1.5 mb-1">
              <span className="text-xs text-slate-700">{e.titulo}</span>
              <button onClick={() => deleteEvento(e.id)}><X className="w-3.5 h-3.5 text-slate-400 hover:text-red-500" /></button>
            </div>
          ))}
          <div className="flex gap-1 mt-2">
            <input value={titulo} onChange={e => setTitulo(e.target.value)} placeholder="Nueva actividad..."
              className="flex-1 px-2 py-1.5 text-xs rounded-lg border border-slate-200 outline-none focus:border-orange-400" />
            <button onClick={() => { if (titulo) { addEvento({ fecha: sel, titulo, proyectoId: null }); setTitulo(''); } }}
              className="p-1.5 bg-orange-500 text-white rounded-lg"><Plus className="w-4 h-4" /></button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Calendar;
