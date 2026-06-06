import React, { useState } from 'react';
import { useErp } from '../store';
import { Categoria } from '../types';
import { CATEGORIA_LABEL, todayISO } from '../utils';
import { Plus } from 'lucide-react';

const MovimientoForm: React.FC<{ compact?: boolean }> = ({ compact }) => {
  const { proyectos, addMovimiento } = useErp();
  const [tipo, setTipo] = useState<'ingreso' | 'gasto'>('gasto');
  const [proyectoId, setProyectoId] = useState<string>('');
  const [descripcion, setDescripcion] = useState('');
  const [cantidad, setCantidad] = useState('1');
  const [unidad, setUnidad] = useState('global');
  const [categoria, setCategoria] = useState<Categoria>('materiales');
  const [costoUnitario, setCostoUnitario] = useState('');
  const [fecha, setFecha] = useState(todayISO());

  const total = (parseFloat(cantidad) || 0) * (parseFloat(costoUnitario) || 0);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!descripcion || !costoUnitario) return;
    addMovimiento({
      tipo, proyectoId: proyectoId || null, descripcion,
      cantidad: parseFloat(cantidad) || 0, unidad, categoria,
      costoUnitario: parseFloat(costoUnitario) || 0, costoTotal: total, fecha,
    });
    setDescripcion(''); setCostoUnitario(''); setCantidad('1');
  };

  const inp = "w-full px-3 py-2 text-sm rounded-lg border border-slate-200 outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-300";

  return (
    <form onSubmit={submit} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
      <div className="flex items-center gap-2 mb-3">
        <button type="button" onClick={() => setTipo('ingreso')} className={`flex-1 py-2 rounded-lg text-sm font-semibold ${tipo === 'ingreso' ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-500'}`}>Ingreso</button>
        <button type="button" onClick={() => setTipo('gasto')} className={`flex-1 py-2 rounded-lg text-sm font-semibold ${tipo === 'gasto' ? 'bg-red-500 text-white' : 'bg-slate-100 text-slate-500'}`}>Gasto</button>
      </div>
      <div className={`grid ${compact ? 'grid-cols-2' : 'grid-cols-2 md:grid-cols-3'} gap-2`}>
        <select value={proyectoId} onChange={e => setProyectoId(e.target.value)} className={inp + ' col-span-2'}>
          <option value="">— Sin proyecto (operativo/personal) —</option>
          {proyectos.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
        </select>
        <input value={descripcion} onChange={e => setDescripcion(e.target.value)} placeholder="Descripción" className={inp + ' col-span-2'} />
        <input type="number" value={cantidad} onChange={e => setCantidad(e.target.value)} placeholder="Cantidad" className={inp} />
        <input value={unidad} onChange={e => setUnidad(e.target.value)} placeholder="Unidad" className={inp} />
        <select value={categoria} onChange={e => setCategoria(e.target.value as Categoria)} className={inp}>
          {(Object.keys(CATEGORIA_LABEL) as Categoria[]).map(c => <option key={c} value={c}>{CATEGORIA_LABEL[c]}</option>)}
        </select>
        <input type="number" value={costoUnitario} onChange={e => setCostoUnitario(e.target.value)} placeholder="Costo unit." className={inp} />
        <input type="date" value={fecha} onChange={e => setFecha(e.target.value)} className={inp} />
        <div className={inp + ' bg-slate-50 flex items-center font-semibold text-slate-700'}>Q {total.toFixed(2)}</div>
      </div>
      <button type="submit" className="mt-3 w-full bg-slate-900 hover:bg-slate-800 text-white py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-1.5">
        <Plus className="w-4 h-4" /> Registrar {tipo}
      </button>
    </form>
  );
};

export default MovimientoForm;
