import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useErp } from '../store';
import type { Proyecto, Tipologia } from '../types';
import { fmtQ, fmtPct, TIPOLOGIA_LABEL, todayISO } from '../utils';
import { Progress } from '../components/Charts';
import MapPicker from '../components/MapPicker';
import { INPUT, BUTTON_PRIMARY, MODAL_OVERLAY, MODAL_PANEL, MODAL_HEADER, MODAL_TITLE, MODAL_CLOSE, BUTTON_ICON, BUTTON_DANGER } from '../ui';
import { Plus, MapPin, Trash2, X, Building2, Pencil } from 'lucide-react';

const proyectoSchema = z.object({
  nombre: z.string().min(1, 'Nombre requerido'),
  descripcion: z.string().optional(),
  tipologia: z.enum(['residencial', 'comercial', 'industrial', 'civil', 'publica'] as const),
  tipoObra: z.enum(['nueva', 'remodelacion', 'ampliacion'] as const).optional(),
  cliente: z.string().min(1, 'Cliente requerido'),
  clienteNit: z.string().optional(),
  clienteTelefono: z.string().optional(),
  clienteEmail: z.string().email('Email inválido').optional().or(z.literal('')),
  ubicacion: z.string().min(1, 'Ubicación requerida'),
  direccion: z.string().optional(),
  ciudad: z.string().optional(),
  departamento: z.string().optional(),
  codigoPostal: z.string().optional(),
  areaConstruccion: z.coerce.number().min(0, 'Debe ser positivo').optional(),
  numPisos: z.coerce.number().int().min(0).optional(),
  plazoSemanas: z.coerce.number().int().min(0).optional(),
  ingenieroResidente: z.string().optional(),
  supervisor: z.string().optional(),
  arquitecto: z.string().optional(),
  numeroExpediente: z.string().optional(),
  numeroLicencia: z.string().optional(),
  presupuestoTotal: z.coerce.number().min(0, 'Valor requerido'),
  montoContrato: z.coerce.number().min(0, 'Valor requerido'),
  fechaInicio: z.string().min(1, 'Fecha requerida'),
  fechaFin: z.string().min(1, 'Fecha requerida'),
  margenUtilidadObjetivo: z.coerce.number().min(0).max(100).optional(),
  moneda: z.enum(['GTQ', 'USD'] as const).optional(),
  estado: z.enum(['planeacion', 'ejecucion', 'pausado', 'finalizado'] as const),
  etapa: z.enum(['planificacion', 'diseno', 'preconstruccion', 'construccion', 'cierre'] as const).optional(),
});

type ProyectoFormData = z.infer<typeof proyectoSchema>;

const estadoColor = (p: { avanceFisico: number; avanceFinanciero: number; estado: string }) => {
  const dev = p.avanceFinanciero - p.avanceFisico;
  if (p.estado === 'planeacion') return '#94a3b8';
  if (dev > 8) return '#ef4444';
  if (dev > 3) return '#fbbf24';
  return '#10b981';
};

const Proyectos: React.FC = () => {
  const { proyectos, addProyecto, updateProyecto, deleteProyecto } = useErp();
  const [show, setShow] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [coords, setCoords] = useState<{ lat?: number; lng?: number }>({});

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ProyectoFormData>({
    resolver: zodResolver(proyectoSchema),
    defaultValues: {
      nombre: '',
      descripcion: '',
      tipologia: 'residencial',
      tipoObra: 'nueva',
      cliente: '',
      clienteNit: '',
      clienteTelefono: '',
      clienteEmail: '',
      ubicacion: '',
      direccion: '',
      ciudad: '',
      departamento: '',
      codigoPostal: '',
      areaConstruccion: undefined,
      numPisos: undefined,
      plazoSemanas: undefined,
      ingenieroResidente: '',
      supervisor: '',
      arquitecto: '',
      numeroExpediente: '',
      numeroLicencia: '',
      presupuestoTotal: 0,
      montoContrato: 0,
      fechaInicio: todayISO(),
      fechaFin: todayISO(),
      margenUtilidadObjetivo: undefined,
      moneda: 'GTQ',
      estado: 'planeacion',
      etapa: 'planificacion',
    },
  });

  const onSubmit = (data: ProyectoFormData) => {
    if (editingId) {
      updateProyecto(editingId, { ...data, lat: coords.lat, lng: coords.lng });
    } else {
      addProyecto({
        ...data,
        avanceFisico: 0,
        avanceFinanciero: 0,
        lat: coords.lat || 14.6349,
        lng: coords.lng || -90.5069,
        moneda: data.moneda || 'GTQ',
      });
    }
    reset();
    setEditingId(null);
    setShow(false);
    setCoords({});
  };

  const openCreate = () => {
    setEditingId(null);
    setCoords({});
    reset({
      nombre: '',
      descripcion: '',
      tipologia: 'residencial',
      tipoObra: 'nueva',
      cliente: '',
      clienteNit: '',
      clienteTelefono: '',
      clienteEmail: '',
      ubicacion: '',
      direccion: '',
      ciudad: '',
      departamento: '',
      codigoPostal: '',
      areaConstruccion: undefined,
      numPisos: undefined,
      plazoSemanas: undefined,
      ingenieroResidente: '',
      supervisor: '',
      arquitecto: '',
      numeroExpediente: '',
      numeroLicencia: '',
      presupuestoTotal: 0,
      montoContrato: 0,
      fechaInicio: todayISO(),
      fechaFin: todayISO(),
      margenUtilidadObjetivo: undefined,
      moneda: 'GTQ',
      estado: 'planeacion',
      etapa: 'planificacion',
    });
    setShow(true);
  };

  const openEdit = (p: Proyecto) => {
    setEditingId(p.id);
    setCoords({ lat: p.lat, lng: p.lng });
    reset({
      nombre: p.nombre,
      descripcion: p.descripcion || '',
      tipologia: p.tipologia,
      tipoObra: (p as any).tipoObra || 'nueva',
      cliente: p.cliente || '',
      clienteNit: (p as any).clienteNit || '',
      clienteTelefono: (p as any).clienteTelefono || '',
      clienteEmail: (p as any).clienteEmail || '',
      ubicacion: p.ubicacion,
      direccion: (p as any).direccion || '',
      ciudad: (p as any).ciudad || '',
      departamento: (p as any).departamento || '',
      codigoPostal: (p as any).codigoPostal || '',
      areaConstruccion: (p as any).areaConstruccion || undefined,
      numPisos: (p as any).numPisos || undefined,
      plazoSemanas: (p as any).plazoSemanas || undefined,
      ingenieroResidente: (p as any).ingenieroResidente || '',
      supervisor: (p as any).supervisor || '',
      arquitecto: (p as any).arquitecto || '',
      numeroExpediente: (p as any).numeroExpediente || '',
      numeroLicencia: (p as any).numeroLicencia || '',
      presupuestoTotal: p.presupuestoTotal,
      montoContrato: p.montoContrato || 0,
      fechaInicio: p.fechaInicio,
      fechaFin: p.fechaFin,
      margenUtilidadObjetivo: (p as any).margenUtilidadObjetivo || undefined,
      moneda: (p as any).moneda || 'GTQ',
      estado: p.estado,
      etapa: (p as any).etapa || 'planificacion',
    });
    setShow(true);
  };

  const wMoneda = watch('moneda');
  const wArea = watch('areaConstruccion');

  return (
    <div className="p-3 sm:p-4 lg:p-6 max-w-[1600px] mx-auto">
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <div>
          <h1 className="text-lg sm:text-xl lg:text-2xl font-black text-foreground">Portafolio de Proyectos</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">{proyectos.length} proyectos registrados</p>
        </div>
        <button onClick={openCreate} className={BUTTON_PRIMARY}>
          <Plus className="w-4 h-4" aria-hidden="true" /> Nuevo Proyecto
        </button>
      </div>

      <div className="bg-slate-900 rounded-2xl p-4 mb-4 relative overflow-hidden" style={{ height: 220 }}>
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1524661135-423995f22d0b?w=1200)', backgroundSize: 'cover' }} />
        <div className="relative z-10 flex items-center gap-2 text-white mb-1">
          <MapPin className="w-4 h-4 text-orange-400" /><span className="text-sm font-bold">Mapa de Calor - Geolocalización de Obras</span>
        </div>
        <div className="relative z-10 flex gap-3 text-[10px] text-slate-300 mb-2">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" />En tiempo</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400" />Riesgo</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" />Desviado</span>
        </div>
        <div className="relative z-10 h-[130px]">
          {proyectos.map((p) => (
            <div key={p.id} className="absolute group" style={{ left: `${Math.round(((p.lng + 90.7) / 0.4) * 100)}%`, top: `${Math.round(((14.7 - p.lat) / 0.3) * 100)}%` }}>
              <div className="w-4 h-4 rounded-full ring-2 ring-white animate-pulse cursor-pointer" style={{ background: estadoColor(p) }} />
              <div className="hidden group-hover:block absolute left-5 -top-1 bg-card text-foreground text-[10px] px-2 py-1 rounded shadow-lg whitespace-nowrap z-20 border border-border">{p.nombre}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
        {proyectos.map(p => (
          <div key={p.id} className="bg-card text-card-foreground rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 border border-border">
            <div className="p-5">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white shrink-0" style={{ background: estadoColor(p) }} aria-hidden="true">
                  <Building2 className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-foreground text-sm truncate">{p.nombre}</h3>
                  <p className="text-[11px] text-muted-foreground truncate">{p.cliente}</p>
                  {p.areaConstruccion && <p className="text-[10px] text-muted-foreground">{p.areaConstruccion.toLocaleString()} m² · {p.numPisos ? `${p.numPisos} niveles` : ''}</p>}
                </div>
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => openEdit(p)} className={BUTTON_ICON} aria-label={`Editar proyecto ${p.nombre}`}>
                    <Pencil className="w-4 h-4" aria-hidden="true" />
                  </button>
                  <button onClick={() => deleteProyecto(p.id)} className={BUTTON_DANGER} aria-label={`Eliminar proyecto ${p.nombre}`}>
                    <Trash2 className="w-4 h-4" aria-hidden="true" />
                  </button>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5 mb-3">
                <span className="text-[10px] px-2.5 py-1 rounded-full bg-muted text-foreground font-medium">{TIPOLOGIA_LABEL[p.tipologia]}</span>
                <span className={`text-[10px] px-2.5 py-1 rounded-full font-medium ${p.estado === 'ejecucion' ? 'bg-emerald-500/10 text-emerald-600' : p.estado === 'planeacion' ? 'bg-amber-500/10 text-amber-600' : 'bg-muted text-foreground/70'}`}>{p.estado}</span>
                {p.moneda && <span className="text-[10px] px-2 py-1 rounded-full bg-muted text-muted-foreground">{p.moneda}</span>}
              </div>
              <div className="space-y-2.5 mb-4">
                <div>
                  <div className="flex justify-between text-[11px] mb-1.5">
                    <span className="text-muted-foreground">Avance Físico</span>
                    <span className="font-semibold text-foreground">{fmtPct(p.avanceFisico)}</span>
                  </div>
                  <Progress value={p.avanceFisico} color="#3b82f6" />
                </div>
                <div>
                  <div className="flex justify-between text-[11px] mb-1.5">
                    <span className="text-muted-foreground">Avance Financiero</span>
                    <span className="font-semibold text-foreground">{fmtPct(p.avanceFinanciero)}</span>
                  </div>
                  <Progress value={p.avanceFinanciero} color="#f97316" />
                </div>
              </div>
              <div className="pt-3.5 flex justify-between text-xs border-t border-border">
                <div>
                  <span className="text-muted-foreground block text-[10px] mb-0.5">Presupuesto</span>
                  <b className="text-foreground font-semibold">{fmtQ(p.presupuestoTotal)}</b>
                </div>
                <div className="text-right">
                  <span className="text-muted-foreground block text-[10px] mb-0.5">Contrato</span>
                  <b className="text-emerald-600 dark:text-emerald-400 font-semibold">{fmtQ(p.montoContrato || 0)}</b>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {show && (
        <div className={MODAL_OVERLAY} onClick={() => setShow(false)} role="dialog" aria-modal="true" aria-labelledby="modal-proyecto-title">
          <form onClick={e => e.stopPropagation()} onSubmit={handleSubmit(onSubmit)} className={`${MODAL_PANEL} max-w-2xl max-h-[90vh] overflow-y-auto`}>
            <div className={MODAL_HEADER}>
              <h2 id="modal-proyecto-title" className={MODAL_TITLE}>{editingId ? 'Editar Proyecto' : 'Nuevo Proyecto'}</h2>
              <button type="button" onClick={() => { setShow(false); setEditingId(null); }} className={MODAL_CLOSE} aria-label="Cerrar">
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Informacion General */}
              <div>
                <h3 className="text-xs font-bold text-foreground uppercase tracking-wider mb-2">Información General</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="sm:col-span-2">
                    <input {...register('nombre')} placeholder="Nombre del proyecto *" className={INPUT} />
                    {errors.nombre && <p className="text-xs text-red-500 mt-0.5">{errors.nombre.message}</p>}
                  </div>
                  <div className="sm:col-span-2">
                    <textarea {...register('descripcion')} placeholder="Descripción del proyecto" className={`${INPUT} min-h-[60px] resize-none`} rows={2} />
                  </div>
                  <select {...register('tipologia')} className={INPUT}>
                    {(Object.keys(TIPOLOGIA_LABEL) as Tipologia[]).map(t => <option key={t} value={t}>{TIPOLOGIA_LABEL[t]}</option>)}
                  </select>
                  <select {...register('tipoObra')} className={INPUT}>
                    <option value="nueva">Obra Nueva</option>
                    <option value="remodelacion">Remodelación</option>
                    <option value="ampliacion">Ampliación</option>
                  </select>
                  <select {...register('moneda')} className={INPUT}>
                    <option value="GTQ">GTQ - Quetzal</option>
                    <option value="USD">USD - Dólar</option>
                  </select>
                  <div className="flex gap-2">
                    <input type="number" {...register('areaConstruccion')} placeholder="Área (m²)" className={INPUT} />
                    <input type="number" {...register('numPisos')} placeholder="Niveles" className={INPUT} />
                  </div>
                  <input type="number" {...register('plazoSemanas')} placeholder="Plazo estimado (semanas)" className={INPUT} />
                </div>
              </div>

              {/* Cliente */}
              <div>
                <h3 className="text-xs font-bold text-foreground uppercase tracking-wider mb-2">Cliente</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input {...register('cliente')} placeholder="Nombre del cliente *" className={INPUT} />
                  {errors.cliente && <p className="text-xs text-red-500 mt-0.5">{errors.cliente.message}</p>}
                  <input {...register('clienteNit')} placeholder="NIT" className={INPUT} />
                  <input {...register('clienteTelefono')} placeholder="Teléfono" className={INPUT} />
                  <input {...register('clienteEmail')} placeholder="Email" className={INPUT} />
                  {errors.clienteEmail && <p className="text-xs text-red-500 mt-0.5">{errors.clienteEmail.message}</p>}
                </div>
              </div>

              {/* Ubicacion y Mapa */}
              <div>
                <h3 className="text-xs font-bold text-foreground uppercase tracking-wider mb-2">Ubicación</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2">
                  <input {...register('ubicacion')} placeholder="Ubicación (texto) *" className={INPUT} />
                  {errors.ubicacion && <p className="text-xs text-red-500 mt-0.5">{errors.ubicacion.message}</p>}
                  <input {...register('direccion')} placeholder="Dirección" className={INPUT} />
                  <input {...register('ciudad')} placeholder="Ciudad" className={INPUT} />
                  <input {...register('departamento')} placeholder="Departamento" className={INPUT} />
                  <input {...register('codigoPostal')} placeholder="Código Postal" className={INPUT + ' sm:col-span-2'} />
                </div>
                <MapPicker
                  lat={coords.lat}
                  lng={coords.lng}
                  onChange={(lat, lng) => {
                    setCoords({ lat, lng });
                    setValue('ubicacion', `${lat.toFixed(5)}, ${lng.toFixed(5)}`);
                  }}
                />
              </div>

              {/* Responsables */}
              <div>
                <h3 className="text-xs font-bold text-foreground uppercase tracking-wider mb-2">Responsables</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input {...register('ingenieroResidente')} placeholder="Ingeniero Residente" className={INPUT} />
                  <input {...register('supervisor')} placeholder="Supervisor" className={INPUT} />
                  <input {...register('arquitecto')} placeholder="Arquitecto" className={INPUT + ' sm:col-span-2'} />
                </div>
              </div>

              {/* Documentacion */}
              <div>
                <h3 className="text-xs font-bold text-foreground uppercase tracking-wider mb-2">Documentación</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input {...register('numeroExpediente')} placeholder="N° Expediente" className={INPUT} />
                  <input {...register('numeroLicencia')} placeholder="N° Licencia Municipal" className={INPUT} />
                </div>
              </div>

              {/* Estado y Etapa */}
              <div>
                <h3 className="text-xs font-bold text-foreground uppercase tracking-wider mb-2">Estado del Proyecto</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-muted-foreground mb-0.5 block">Estado</label>
                    <select {...register('estado')} className={INPUT}>
                      <option value="planeacion">Planeación</option>
                      <option value="ejecucion">Ejecución</option>
                      <option value="pausado">Pausado</option>
                      <option value="finalizado">Finalizado</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground mb-0.5 block">Etapa</label>
                    <select {...register('etapa')} className={INPUT}>
                      <option value="planificacion">Planificación</option>
                      <option value="diseno">Diseño</option>
                      <option value="preconstruccion">Pre-construcción</option>
                      <option value="construccion">Construcción</option>
                      <option value="cierre">Cierre</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Presupuesto y Fechas */}
              <div>
                <h3 className="text-xs font-bold text-foreground uppercase tracking-wider mb-2">Presupuesto y Plazos</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-muted-foreground mb-0.5 block">Presupuesto Total</label>
                    <input type="number" {...register('presupuestoTotal')} placeholder="Presupuesto" className={INPUT} />
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground mb-0.5 block">Monto Contrato</label>
                    <input type="number" {...register('montoContrato')} placeholder="Contrato" className={INPUT} />
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground mb-0.5 block">Margen Utilidad Objetivo (%)</label>
                    <input type="number" {...register('margenUtilidadObjetivo')} placeholder="Ej: 15" className={INPUT} />
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground mb-0.5 block">Fecha Inicio</label>
                    <input type="date" {...register('fechaInicio')} className={INPUT} />
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground mb-0.5 block">Fecha Fin Estimada</label>
                    <input type="date" {...register('fechaFin')} className={INPUT} />
                  </div>
                </div>
                {(errors.presupuestoTotal || errors.montoContrato || errors.fechaInicio || errors.fechaFin) && (
                  <p className="text-xs text-red-500 mt-1">Complete los campos requeridos</p>
                )}
              </div>
            </div>

            <button type="submit" className={`${BUTTON_PRIMARY} mt-4`}>
              {editingId ? 'Guardar Cambios' : 'Crear Proyecto'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default Proyectos;
