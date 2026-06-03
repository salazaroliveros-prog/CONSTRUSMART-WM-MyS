import React, { useState, useRef } from 'react';
import { useErp } from '../store';
import { toast } from 'sonner';
import { Camera, Save, X, MapPin, BarChart3, Upload } from 'lucide-react';
import { CARD, INPUT } from '../ui';
import { todayISO, fmtQ } from '../utils';
import { uploadBase64Image } from '@/lib/storage';
import { hasSupabase } from '@/lib/supabase';

const AvanceObraModal: React.FC = () => {
  const { proyectos, presupuestos, avances, addAvance, deleteAvance, notifyAvanceRegistrado, user } = useErp();
  const [proyectoId, setProyectoId] = useState('');
  const [presupuestoId, setPresupuestoId] = useState('');
  const [renglonCodigo, setRenglonCodigo] = useState('');
  const [avanceFisico, setAvanceFisico] = useState(0);
  const [cantidadEjecutada, setCantidadEjecutada] = useState(0);
  const [foto, setFoto] = useState('');
  const [subiendo, setSubiendo] = useState(false);
  const [lat, setLat] = useState<number>();
  const [lng, setLng] = useState<number>();
  const [notas, setNotas] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const presupuestosDelProyecto = presupuestos.filter(p => p.proyectoId === proyectoId);
  const renglonesDisponibles = presupuestosDelProyecto.find(p => p.id === presupuestoId)?.renglones || [];
  const avancesDelProyecto = avances.filter(a => a.proyectoId === proyectoId);
  const avanceFinanciero = presupuestosDelProyecto.filter(p => p.id === presupuestoId).reduce((sum, p) => sum + p.totalCalculado * (avanceFisico / 100), 0);

  const capturarGeo = () => {
    if (!navigator.geolocation) { toast.error('Geolocalización no soportada'); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => { setLat(pos.coords.latitude); setLng(pos.coords.longitude); toast.success('Ubicación capturada'); },
      () => toast.error('No se pudo obtener ubicación'),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const agregarFoto = () => fileRef.current?.click();
  const onFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!hasSupabase || !user?.id) {
      const reader = new FileReader();
      reader.onload = () => {
        const data = typeof reader.result === 'string' ? reader.result : null;
        if (data) { setFoto(data); toast.success('Foto agregada (local)'); }
      };
      reader.readAsDataURL(file);
      e.target.value = '';
      return;
    }
    setSubiendo(true);
    const reader = new FileReader();
    reader.onload = async () => {
      const data = typeof reader.result === 'string' ? reader.result : null;
      if (data) {
        const url = await uploadBase64Image('erp_fotos_avances', data, user.id);
        if (url) {
          setFoto(url);
          toast.success('Foto subida a la nube');
        } else {
          setFoto(data);
          toast.warning('No se pudo subir, guardando localmente');
        }
      }
      setSubiendo(false);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const guardarAvance = async () => {
    if (!proyectoId || !presupuestoId || !renglonCodigo) {
      toast.error('Selecciona proyecto, presupuesto y renglón');
      return;
    }
    if (avanceFisico <= 0) {
      toast.error('Ingresa un % de avance válido');
      return;
    }
    const renglon = renglonesDisponibles.find(r => r.codigo === renglonCodigo);
    await addAvance({
      proyectoId, presupuestoId, renglonCodigo,
      renglonNombre: renglon?.nombre || renglonCodigo,
      avanceFisico, cantidadEjecutada: cantidadEjecutada || 0,
      fecha: todayISO(),
      foto: foto || undefined, lat, lng, notas: notas || undefined,
    });
    if (renglon?.nombre) notifyAvanceRegistrado(proyectoId, renglon.nombre, avanceFisico);
    toast.success(`Avance registrado: ${avanceFisico}%`);
    setAvanceFisico(0); setCantidadEjecutada(0); setFoto(''); setNotas('');
  };

  return (
    <div className={`${CARD}`}>
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 className="w-5 h-5 text-blue-500" />
        <div>
          <h3 className="font-bold text-slate-700 text-sm">Registrar Avance de Obra</h3>
          <p className="text-xs text-slate-500">Reporte de avance por renglón/presupuesto</p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
        <select value={proyectoId} onChange={e => { setProyectoId(e.target.value); setPresupuestoId(''); setRenglonCodigo(''); }} className={INPUT}>
          <option value="">Selecciona proyecto</option>
          {proyectos.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
        </select>
        <select value={presupuestoId} onChange={e => { setPresupuestoId(e.target.value); setRenglonCodigo(''); }} className={INPUT} disabled={!proyectoId}>
          <option value="">Selecciona presupuesto</option>
          {presupuestosDelProyecto.map(p => <option key={p.id} value={p.id}>v{p.versionPresupuesto} - {fmtQ(p.totalCalculado)}</option>)}
        </select>
      </div>
      {renglonesDisponibles.length > 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
            <select value={renglonCodigo} onChange={e => setRenglonCodigo(e.target.value)} className={INPUT}>
              <option value="">Selecciona renglón</option>
              {renglonesDisponibles.map(r => <option key={r.codigo} value={r.codigo}>{r.codigo} - {r.nombre}</option>)}
            </select>
            <div><label className="text-[10px] text-slate-500">% Avance Físico</label><input type="number" min={0} max={100} value={avanceFisico || ''} onChange={e => setAvanceFisico(+e.target.value)} placeholder="0-100" className={INPUT} /></div>
            <div><label className="text-[10px] text-slate-500">Cantidad ejecutada</label><input type="number" value={cantidadEjecutada || ''} onChange={e => setCantidadEjecutada(+e.target.value)} placeholder="0" className={INPUT} /></div>
          </div>
          {avanceFisico > 0 && <div className="bg-blue-50 rounded-lg p-2 mb-3 text-xs text-blue-700">Avance Financiero Estimado: {fmtQ(avanceFinanciero)}</div>}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFileSelected} />
            <button onClick={agregarFoto} disabled={subiendo} className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-dashed border-slate-300 text-xs text-slate-600 hover:border-blue-400 disabled:opacity-50">
              {subiendo ? <Upload className="w-4 h-4 animate-pulse" /> : <Camera className="w-4 h-4" />}
              {subiendo ? 'Subiendo...' : foto ? (foto.startsWith('http') ? '📷 Foto en nube' : '📷 Foto local') : 'Foto del avance'}
            </button>
            <button onClick={capturarGeo} className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-dashed border-slate-300 text-xs text-slate-600 hover:border-blue-400"><MapPin className="w-4 h-4" /> {lat ? `📍 ${lat.toFixed(4)}, ${lng?.toFixed(4)}` : 'Geolocalizar'}</button>
            <input value={notas} onChange={e => setNotas(e.target.value)} placeholder="Notas del avance" className={INPUT} />
          </div>
          {foto && (
            <div className="mb-3">
              <img src={foto} alt="Preview" className="w-24 h-24 object-cover rounded-lg border" />
            </div>
          )}
          <button onClick={guardarAvance} className="w-full bg-blue-500 text-white px-3 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-blue-600"><Save className="w-4 h-4" /> Registrar Avance</button>
        </>
      )}
      {avancesDelProyecto.length > 0 && (
        <div className="mt-4 border-t pt-3">
          <h4 className="text-xs font-bold text-slate-600 mb-2">Últimos avances registrados</h4>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {avancesDelProyecto.slice(0, 5).map(a => (
              <div key={a.id} className="flex items-center gap-2 text-xs bg-slate-50 rounded p-1.5">
                <span className="font-semibold text-blue-600">{a.avanceFisico}%</span>
                <span className="text-slate-600 truncate flex-1">{a.renglonNombre}</span>
                <span className="text-slate-400">{a.fecha.slice(5, 10)}</span>
                {a.foto && <span className="text-emerald-500">📷</span>}
                {a.lat && <span className="text-blue-500">📍</span>}
                <button onClick={() => deleteAvance(a.id)} className="text-red-400 hover:text-red-600"><X className="w-3 h-3" /></button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AvanceObraModal;