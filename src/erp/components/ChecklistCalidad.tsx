import React, { useState, useRef } from 'react';
import { useErp } from '../store';
import { toast } from 'sonner';
import { CheckCircle, XCircle, Clock, Camera, Save, AlertTriangle, ClipboardCheck } from 'lucide-react';
import SignaturePad from './SignaturePad';
import { INPUT, BUTTON_PRIMARY } from '../ui';
import { CARD, CARD_TITLE } from '../ui';
import { todayISO } from '../utils';

interface ChecklistItem {
  id: string;
  descripcion: string;
  estado: 'aprobado' | 'rechazado' | 'pendiente';
  observacion?: string;
}

interface ChecklistRecord {
  id: string;
  proyectoId: string;
  fecha: string;
  items: ChecklistItem[];
  firmaSupervisor?: string;
  firmaResidente?: string;
  fotos?: string[];
  estado: 'aprobado' | 'rechazado' | 'pendiente';
  observaciones?: string;
}

const DEFAULT_CHECKLIST_ITEMS: ChecklistItem[] = [
  { id: 'seg-1', descripcion: 'Uso correcto de EPP (cascos, chalecos, guantes)', estado: 'pendiente' },
  { id: 'seg-2', descripcion: 'Señalización de áreas de trabajo', estado: 'pendiente' },
  { id: 'seg-3', descripcion: 'Herramientas en buen estado', estado: 'pendiente' },
  { id: 'seg-4', descripcion: 'Limpieza y orden del área', estado: 'pendiente' },
  { id: 'seg-5', descripcion: 'Materiales almacenados correctamente', estado: 'pendiente' },
  { id: 'seg-6', descripcion: 'Paso peatonal despejado', estado: 'pendiente' },
  { id: 'cal-1', descripcion: 'Concreto cumple especificación de resistencia', estado: 'pendiente' },
  { id: 'cal-2', descripcion: 'Acero de refuerzo según planos', estado: 'pendiente' },
  { id: 'cal-3', descripcion: 'Dimensiones verificadas con planos', estado: 'pendiente' },
  { id: 'cal-4', descripcion: 'Acabados según especificación', estado: 'pendiente' },
  { id: 'cal-5', descripcion: 'Instalaciones según planos eléctricos/ sanitarios', estado: 'pendiente' },
];

const ChecklistCalidad: React.FC = () => {
  const { proyectos } = useErp();
  const [proyectoId, setProyectoId] = useState('');
  const [items, setItems] = useState<ChecklistItem[]>(DEFAULT_CHECKLIST_ITEMS);
  const [firmaSupervisor, setFirmaSupervisor] = useState('');
  const [firmaResidente, setFirmaResidente] = useState('');
  const [fotos, setFotos] = useState<string[]>([]);
  const [observaciones, setObservaciones] = useState('');
  const [guardando, setGuardando] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const toggleEstado = (itemId: string, nuevoEstado: 'aprobado' | 'rechazado') => {
    setItems(prev => prev.map(item =>
      item.id === itemId ? { ...item, estado: nuevoEstado } : item
    ));
  };

  const updateObservacion = (itemId: string, obs: string) => {
    setItems(prev => prev.map(item =>
      item.id === itemId ? { ...item, observacion: obs } : item
    ));
  };

  const agregarFoto = () => fileRef.current?.click();
  
  const onFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const data = typeof reader.result === 'string' ? reader.result : null;
      if (data) {
        setFotos(prev => [...prev, data]);
        toast.success('Foto agregada como evidencia');
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const quitarFoto = (idx: number) => {
    setFotos(prev => prev.filter((_, i) => i !== idx));
  };

  const aprobados = items.filter(i => i.estado === 'aprobado').length;
  const rechazados = items.filter(i => i.estado === 'rechazado').length;
  const pendientes = items.filter(i => i.estado === 'pendiente').length;
  const totalItems = items.length;

  const getEstadoGeneral = (): 'aprobado' | 'rechazado' | 'pendiente' => {
    if (rechazados > 0) return 'rechazado';
    if (pendientes === 0 && aprobados > 0) return 'aprobado';
    return 'pendiente';
  };

  const guardarChecklist = async () => {
    if (!proyectoId) {
      toast.error('Selecciona un proyecto');
      return;
    }
    
    const estadoGeneral = getEstadoGeneral();
    if (estadoGeneral === 'pendiente') {
      toast.error('Completa todos los items antes de guardar');
      return;
    }

    if (rechazados > 0 && fotos.length === 0) {
      toast.error('Si hay items rechazados, adjunta evidencia fotográfica');
      return;
    }

    setGuardando(true);
    try {
      const checklist: ChecklistRecord = {
        id: crypto.randomUUID(),
        proyectoId,
        fecha: todayISO(),
        items,
        firmaSupervisor: firmaSupervisor || undefined,
        firmaResidente: firmaResidente || undefined,
        fotos: fotos.length > 0 ? fotos : undefined,
        estado: estadoGeneral,
        observaciones: observaciones || undefined,
      };

      localStorage.setItem(`wm_checklist_${proyectoId}_${todayISO()}`, JSON.stringify(checklist));
      
      toast.success(
        estadoGeneral === 'aprobado' 
          ? 'Checklist APROBADO ✅' 
          : `Checklist RECHAZADO ❌ - ${rechazados} items no conformes`
      );

      // Reset form
      setItems(DEFAULT_CHECKLIST_ITEMS);
      setFirmaSupervisor('');
      setFirmaResidente('');
      setFotos([]);
      setObservaciones('');
    } catch {
      toast.error('Error al guardar checklist');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className={`${CARD}`}>
      <div className="flex items-center justify-between gap-3 mb-4">
        <div>
          <h3 className={`${CARD_TITLE}`}>
            <ClipboardCheck className="w-5 h-5 text-emerald-500" /> Checkpoint de Calidad y Seguridad
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Verificación diaria de calidad (SSO) - Firma del supervisor y residente requerida
          </p>
        </div>
        <div className="flex gap-2 text-xs">
          <span className="flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-50 text-emerald-600">
            <CheckCircle className="w-3.5 h-3.5" /> {aprobados}
          </span>
          <span className="flex items-center gap-1 px-2 py-1 rounded-lg bg-red-50 text-red-600">
            <XCircle className="w-3.5 h-3.5" /> {rechazados}
          </span>
          <span className="flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-50 text-amber-600">
            <Clock className="w-3.5 h-3.5" /> {pendientes}
          </span>
        </div>
      </div>

      {/* Proyecto */}
      <div className="mb-4">
        <label className="text-xs font-semibold text-slate-500 block mb-1">Proyecto *</label>
        <select value={proyectoId} onChange={e => setProyectoId(e.target.value)} className={INPUT}>
          <option value="">Selecciona proyecto</option>
          {proyectos.map(p => (
            <option key={p.id} value={p.id}>{p.nombre} — {p.ubicacion}</option>
          ))}
        </select>
      </div>

      {/* Items del checklist */}
      <div className="space-y-2 mb-4">
        {items.map((item, idx) => (
          <div key={item.id} className="bg-white rounded-lg border border-slate-100 p-3">
            <div className="flex items-start gap-3">
              <span className="text-xs font-mono text-slate-400 mt-0.5">{idx + 1}.</span>
              <div className="flex-1">
                <div className="text-sm text-slate-700 font-medium">{item.descripcion}</div>
                {item.estado !== 'pendiente' && (
                  <input
                    type="text"
                    value={item.observacion || ''}
                    onChange={e => updateObservacion(item.id, e.target.value)}
                    placeholder="Observación (opcional)"
                    className="mt-1 w-full text-xs border border-slate-200 rounded px-2 py-1"
                  />
                )}
              </div>
              <div className="flex gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => toggleEstado(item.id, 'aprobado')}
                  className={`p-1.5 rounded-lg transition-colors ${
                    item.estado === 'aprobado'
                      ? 'bg-emerald-500 text-white'
                      : 'bg-emerald-50 text-emerald-500 hover:bg-emerald-100'
                  }`}
                  title="Aprobado"
                >
                  <CheckCircle className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => toggleEstado(item.id, 'rechazado')}
                  className={`p-1.5 rounded-lg transition-colors ${
                    item.estado === 'rechazado'
                      ? 'bg-red-500 text-white'
                      : 'bg-red-50 text-red-500 hover:bg-red-100'
                  }`}
                  title="Rechazado"
                >
                  <XCircle className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Progreso */}
      <div className="mb-4">
        <div className="flex justify-between text-xs text-slate-500 mb-1">
          <span>Progreso del checklist</span>
          <span>{aprobados + rechazados}/{totalItems} completados</span>
        </div>
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full flex">
            <div className="bg-emerald-500 transition-all" style={{ width: `${(aprobados / totalItems) * 100}%` }} />
            <div className="bg-red-500 transition-all" style={{ width: `${(rechazados / totalItems) * 100}%` }} />
          </div>
        </div>
      </div>

      {/* Observaciones */}
      <div className="mb-4">
        <label className="text-xs font-semibold text-slate-500 block mb-1">Observaciones generales</label>
        <textarea
          value={observaciones}
          onChange={e => setObservaciones(e.target.value)}
          placeholder="Notas adicionales sobre la inspección..."
          rows={2}
          className="w-full text-xs border border-slate-200 rounded-lg p-2 resize-none"
        />
      </div>

      {/* Evidencia fotográfica */}
      <div className="mb-4">
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFileSelected} />
        <button
          type="button"
          onClick={agregarFoto}
          className="flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-slate-300 text-xs text-slate-600 hover:border-orange-400 hover:text-orange-600 transition-colors"
        >
          <Camera className="w-4 h-4" />
          {fotos.length > 0 ? `${fotos.length} evidencia(s) fotográfica(s)` : 'Agregar evidencia fotográfica'}
          {rechazados > 0 && <span className="text-red-500 font-semibold">(requerido si hay rechazos)</span>}
        </button>
        {fotos.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {fotos.map((foto, idx) => (
              <div key={idx} className="relative group">
                <img src={foto} alt={`Evidencia ${idx + 1}`} className="w-16 h-16 rounded-lg object-cover border border-slate-200" />
                <button
                  type="button"
                  onClick={() => quitarFoto(idx)}
                  className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full text-[8px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Firmas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="text-xs font-semibold text-slate-500 block mb-1">Firma del Supervisor</label>
          <SignaturePad value={firmaSupervisor} onChange={setFirmaSupervisor} width={350} height={100} />
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-500 block mb-1">Firma del Residente</label>
          <SignaturePad value={firmaResidente} onChange={setFirmaResidente} width={350} height={100} />
        </div>
      </div>

      {/* Estado general */}
      <div className={`p-3 rounded-lg mb-4 flex items-center gap-2 text-sm font-semibold ${
        getEstadoGeneral() === 'aprobado' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
        : getEstadoGeneral() === 'rechazado' ? 'bg-red-50 text-red-700 border border-red-200'
        : 'bg-amber-50 text-amber-700 border border-amber-200'
      }`}>
        {getEstadoGeneral() === 'aprobado' && <CheckCircle className="w-5 h-5" />}
        {getEstadoGeneral() === 'rechazado' && <AlertTriangle className="w-5 h-5" />}
        {getEstadoGeneral() === 'pendiente' && <Clock className="w-5 h-5" />}
        Estado: {getEstadoGeneral() === 'aprobado' ? 'APROBADO ✅' : getEstadoGeneral() === 'rechazado' ? 'RECHAZADO ❌' : 'PENDIENTE ⏳'}
      </div>

      {/* Botón guardar */}
      <button
        type="button"
        onClick={guardarChecklist}
        disabled={guardando || getEstadoGeneral() === 'pendiente'}
        className={`${BUTTON_PRIMARY} w-full flex items-center justify-center gap-2 disabled:opacity-50`}
      >
        <Save className="w-4 h-4" />
        {guardando ? 'Guardando...' : 'Guardar Checkpoint de Calidad'}
      </button>
    </div>
  );
};

export default ChecklistCalidad;