import React, { useState, useMemo } from 'react';
import { useErp } from '../store';
import { INPUT, BUTTON_PRIMARY, BUTTON_SECONDARY, BUTTON_DANGER, MODAL_OVERLAY, MODAL_PANEL, MODAL_HEADER, MODAL_TITLE, MODAL_CLOSE } from '../ui';
import { fmtQ, fmtPct, EMPRESA } from '../utils';
import { exportCotizacionPDF } from '../export';
import { Plus, X, Send, FileText, Trash2, Pencil, Eye, Copy, CheckCircle2, Clock, Archive } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';
import type { CotizacionCliente, CotizacionTipo } from '../types';

const cotizacionFormSchema = z.object({
  proyectoId: z.string().optional().default(''),
  tipo: z.enum(['construccion','planos_registro','estudio_planificacion','diseno_urbanistico','anteproyecto_residencial']),
  numero: z.string().optional().default(''),
  fecha: z.string().default(new Date().toISOString().slice(0, 10)),
  fechaVencimiento: z.string().optional().default(''),
  clienteNombre: z.string().min(1, 'Nombre requerido'),
  clienteNit: z.string().optional().default(''),
  clienteTelefono: z.string().optional().default(''),
  clienteEmail: z.string().optional().default(''),
  clienteDireccion: z.string().optional().default(''),
  descripcion: z.string().optional().default(''),
  alcance: z.string().optional().default(''),
  renglones: z.array(z.any()).default([]),
  costoDirectoTotal: z.number().default(0),
  precioVentaTotal: z.number().default(0),
  estado: z.enum(['borrador','enviada','aprobada','rechazada','vencida']).default('borrador'),
  notas: z.string().optional().default(''),
});

type CotizacionFormData = z.infer<typeof cotizacionFormSchema>;

const TIPOS_COTIZACION: { value: CotizacionTipo; label: string; icon: string }[] = [
  { value: 'construccion', label: 'Presupuesto de Construcción', icon: '🏗️' },
  { value: 'planos_registro', label: 'Planos de Registro', icon: '📐' },
  { value: 'estudio_planificacion', label: 'Estudio de Planificación (Entidades Públicas)', icon: '🏛️' },
  { value: 'diseno_urbanistico', label: 'Diseño Urbanístico', icon: '🏙️' },
  { value: 'anteproyecto_residencial', label: 'Anteproyecto Residencial', icon: '🏠' },
];

const ESTADOS_COTIZACION = [
  { key: 'borrador', label: 'Borrador', color: 'bg-slate-100 text-slate-600', icon: FileText },
  { key: 'enviada', label: 'Enviada', color: 'bg-blue-50 text-blue-600', icon: Send },
  { key: 'aprobada', label: 'Aprobada', color: 'bg-emerald-50 text-emerald-600', icon: CheckCircle2 },
  { key: 'rechazada', label: 'Rechazada', color: 'bg-red-50 text-red-600', icon: X },
  { key: 'vencida', label: 'Vencida', color: 'bg-amber-50 text-amber-600', icon: Clock },
] as const;

const Cotizaciones: React.FC = () => {
  const { proyectos, cotizacionesNegocio: cotizaciones, addCotizacion, updateCotizacion, deleteCotizacion, presupuestos } = useErp();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<CotizacionFormData>({
    proyectoId: '',
    tipo: 'construccion',
    numero: '',
    fecha: new Date().toISOString().slice(0, 10),
    fechaVencimiento: '',
    clienteNombre: '',
    clienteNit: '',
    clienteTelefono: '',
    clienteEmail: '',
    clienteDireccion: '',
    descripcion: '',
    alcance: '',
    renglones: [],
    costoDirectoTotal: 0,
    precioVentaTotal: 0,
    estado: 'borrador',
    notas: '',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const cotizacionesFiltradas = useMemo(() => {
    return [...cotizaciones].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [cotizaciones]);

  const cotizacionesPorTipo = useMemo(() => {
    const map: Record<string, number> = {};
    cotizaciones.forEach(c => {
      map[c.tipo] = (map[c.tipo] || 0) + 1;
    });
    return map;
  }, [cotizaciones]);

  const resetForm = () => {
    setFormData({
      proyectoId: '',
      tipo: 'construccion',
      numero: '',
      fecha: new Date().toISOString().slice(0, 10),
      fechaVencimiento: '',
      clienteNombre: '',
      clienteNit: '',
      clienteTelefono: '',
      clienteEmail: '',
      clienteDireccion: '',
      descripcion: '',
      alcance: '',
      renglones: [],
      costoDirectoTotal: 0,
      precioVentaTotal: 0,
      estado: 'borrador',
      notas: '',
    });
    setEditingId(null);
    setFormErrors({});
  };

  const openCreate = () => {
    resetForm();
    setShowForm(true);
  };

  const openEdit = (c: CotizacionCliente) => {
    setEditingId(c.id);
    setFormData({
      proyectoId: c.proyectoId || '',
      tipo: c.tipo,
      numero: c.numero,
      fecha: c.fecha,
      fechaVencimiento: c.fechaVencimiento || '',
      clienteNombre: c.clienteNombre,
      clienteNit: c.clienteNit || '',
      clienteTelefono: c.clienteTelefono || '',
      clienteEmail: c.clienteEmail || '',
      clienteDireccion: c.clienteDireccion || '',
      descripcion: c.descripcion,
      alcance: c.alcance,
      renglones: c.renglones,
      costoDirectoTotal: c.costoDirectoTotal,
      precioVentaTotal: c.precioVentaTotal,
      estado: c.estado,
      notas: c.notas || '',
    });
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const schema = cotizacionFormSchema.safeParse(formData);
    if (!schema.success) {
      const fieldErrors: Record<string, string> = {};
      schema.error.errors.forEach(err => {
        fieldErrors[err.path[0] as string] = err.message;
      });
      setFormErrors(fieldErrors);
      toast.error('Corrige los errores del formulario');
      return;
    }
    setFormErrors({});

    if (editingId) {
      updateCotizacion(editingId, schema.data);
      toast.success('Cotización actualizada');
    } else {
      const now = new Date().toISOString();
      addCotizacion({
        ...schema.data,
        createdAt: now,
        updatedAt: now,
      });
      toast.success('Cotización creada');
    }
    resetForm();
    setShowForm(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('¿Eliminar esta cotización?')) {
      deleteCotizacion(id);
      toast.success('Cotización eliminada');
    }
  };

  const handleEnviar = (c: CotizacionCliente) => {
    updateCotizacion(c.id, { estado: 'enviada' });
    toast.success('Cotización enviada al cliente');
  };

  const duplicarCotizacion = (c: CotizacionCliente) => {
    const now = new Date().toISOString();
    const nueva = {
      ...c,
      id: undefined,
      numero: `COT-${cotizaciones.length + 1}-${new Date().getFullYear()}`,
      fecha: new Date().toISOString().slice(0, 10),
      estado: 'borrador' as const,
      createdAt: now,
      updatedAt: now,
    };
    addCotizacion(nueva as any);
    toast.success('Cotización duplicada como borrador');
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copiado al portapapeles');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Cotizaciones</h1>
          <p className="text-sm text-muted-foreground">Gestione cotizaciones para clientes nuevos y proyectos</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-semibold hover:bg-primary/90">
          <Plus className="w-4 h-4" /> Nueva Cotización
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Cotizaciones', value: cotizaciones.length, color: 'bg-blue-50 text-blue-600' },
          { label: 'Enviadas', value: cotizaciones.filter(c => c.estado === 'enviada').length, color: 'bg-amber-50 text-amber-600' },
          { label: 'Aprobadas', value: cotizaciones.filter(c => c.estado === 'aprobada').length, color: 'bg-emerald-50 text-emerald-600' },
          { label: 'Monto Aprobado', value: fmtQ(cotizaciones.filter(c => c.estado === 'aprobada').reduce((a, c) => a + c.precioVentaTotal, 0)), color: 'bg-purple-50 text-purple-600' },
        ].map((kpi, i) => (
          <div key={i} className={`${kpi.color} rounded-xl p-3 border`}>
            <div className="text-xs font-medium opacity-70 mb-1">{kpi.label}</div>
            <div className="text-lg font-bold">{kpi.value}</div>
          </div>
        ))}
      </div>

      {/* Tabla */}
      <div className="space-y-2">
        {cotizacionesFiltradas.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No hay cotizaciones registradas</p>
            <button onClick={openCreate} className="mt-3 text-primary text-sm font-medium hover:underline">Crear primera cotización</button>
          </div>
        ) : (
          <div className="space-y-2">
            {cotizacionesFiltradas.map(c => {
              const estadoInfo = ESTADOS_COTIZACION.find(e => e.key === c.estado);
              const EstadoIcon = estadoInfo?.icon || FileText;
              return (
                <div key={c.id} className="bg-card rounded-xl shadow-sm border border-border p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded text-foreground/70">{c.numero}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-slate-100 text-slate-600">
                          {TIPOS_COTIZACION.find(t => t.value === c.tipo)?.icon} {TIPOS_COTIZACION.find(t => t.value === c.tipo)?.label}
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium flex items-center gap-1 ${estadoInfo?.color}`}>
                          <EstadoIcon className="w-3 h-3" /> {estadoInfo?.label}
                        </span>
                      </div>
                      <h3 className="text-sm font-semibold text-foreground truncate">{c.clienteNombre}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{c.descripcion || c.alcance}</p>
                      <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-muted-foreground">
                        <span>📅 {c.fecha}</span>
                        {c.fechaVencimiento && <span>⏳ Vence: {c.fechaVencimiento}</span>}
                        {c.clienteNit && <span>📄 NIT: {c.clienteNit}</span>}
                        <span className="font-semibold text-emerald-600">{fmtQ(c.precioVentaTotal)}</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      {c.estado === 'borrador' && (
                        <button onClick={() => handleEnviar(c)} className="text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600 flex items-center gap-1">
                          <Send className="w-3 h-3" /> Enviar
                        </button>
                      )}
                      <button onClick={() => { exportCotizacionPDF(c); }} className="text-xs bg-emerald-500 text-white px-2 py-1 rounded hover:bg-emerald-600 flex items-center gap-1">
                        <FileText className="w-3 h-3" /> PDF
                      </button>
                      <button onClick={() => openEdit(c)} className="text-xs bg-muted text-foreground px-2 py-1 rounded hover:bg-muted/80 flex items-center gap-1">
                        <Pencil className="w-3 h-3" /> Editar
                      </button>
                      <button onClick={() => duplicarCotizacion(c)} className="text-xs bg-muted text-foreground px-2 py-1 rounded hover:bg-muted/80 flex items-center gap-1">
                        <Copy className="w-3 h-3" /> Copiar
                      </button>
                      <button onClick={() => handleDelete(c.id)} className="text-xs bg-red-50 text-red-600 px-2 py-1 rounded hover:bg-red-100 flex items-center gap-1">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal */}
      {showForm && (
        <div className={MODAL_OVERLAY} role="dialog" aria-modal="true">
          <form onSubmit={handleSubmit} className={`${MODAL_PANEL} max-w-2xl`}>
            <div className={MODAL_HEADER}>
              <h2 className={MODAL_TITLE}>{editingId ? 'Editar Cotización' : 'Nueva Cotización'}</h2>
              <button type="button" onClick={() => { setShowForm(false); resetForm(); }} className={MODAL_CLOSE} aria-label="Cerrar">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 sm:p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Tipo de Cotización</label>
                  <select value={formData.tipo} onChange={e => setFormData(p => ({ ...p, tipo: e.target.value as CotizacionTipo }))} className={INPUT}>
                    {TIPOS_COTIZACION.map(t => <option key={t.value} value={t.value}>{t.icon} {t.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Número</label>
                  <input value={formData.numero} onChange={e => setFormData(p => ({ ...p, numero: e.target.value }))} placeholder="COT-001-2026" className={INPUT} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Fecha</label>
                  <input type="date" value={formData.fecha} onChange={e => setFormData(p => ({ ...p, fecha: e.target.value }))} className={INPUT} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Vencimiento</label>
                  <input type="date" value={formData.fechaVencimiento} onChange={e => setFormData(p => ({ ...p, fechaVencimiento: e.target.value }))} className={INPUT} />
                </div>
              </div>

              <div className="border-t pt-3">
                <h3 className="text-xs font-bold text-foreground uppercase tracking-wider mb-2">Datos del Cliente</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="sm:col-span-2">
                    <label className="text-xs text-muted-foreground mb-1 block">Nombre / Razón Social *</label>
                    <input value={formData.clienteNombre} onChange={e => setFormData(p => ({ ...p, clienteNombre: e.target.value }))} placeholder="Nombre del cliente" className={INPUT} />
                    {formErrors.clienteNombre && <p className="text-xs text-red-500 mt-0.5">{formErrors.clienteNombre}</p>}
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">NIT</label>
                    <input value={formData.clienteNit} onChange={e => setFormData(p => ({ ...p, clienteNit: e.target.value }))} placeholder="NIT" className={INPUT} />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Teléfono</label>
                    <input value={formData.clienteTelefono} onChange={e => setFormData(p => ({ ...p, clienteTelefono: e.target.value }))} placeholder="Teléfono" className={INPUT} />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Email</label>
                    <input value={formData.clienteEmail} onChange={e => setFormData(p => ({ ...p, clienteEmail: e.target.value }))} placeholder="correo@ejemplo.com" className={INPUT} />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Dirección</label>
                    <input value={formData.clienteDireccion} onChange={e => setFormData(p => ({ ...p, clienteDireccion: e.target.value }))} placeholder="Dirección" className={INPUT} />
                  </div>
                </div>
              </div>

              <div className="border-t pt-3">
                <h3 className="text-xs font-bold text-foreground uppercase tracking-wider mb-2">Descripción y Alcance</h3>
                <div className="grid grid-cols-1 gap-3">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Descripción Corta</label>
                    <input value={formData.descripcion} onChange={e => setFormData(p => ({ ...p, descripcion: e.target.value }))} placeholder="Ej. Diseño de planos para casa unifamiliar" className={INPUT} />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Alcance del Servicio</label>
                    <textarea value={formData.alcance} onChange={e => setFormData(p => ({ ...p, alcance: e.target.value }))} placeholder="Describe detalladamente qué incluye esta cotización..." className={`${INPUT} min-h-[80px] resize-none`} rows={3} />
                  </div>
                </div>
              </div>

              <div className="border-t pt-3">
                <h3 className="text-xs font-bold text-foreground uppercase tracking-wider mb-2">Montos</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Costo Directo (Q)</label>
                    <input type="number" value={formData.costoDirectoTotal} onChange={e => setFormData(p => ({ ...p, costoDirectoTotal: +e.target.value }))} className={INPUT} />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Precio de Venta (Q)</label>
                    <input type="number" value={formData.precioVentaTotal} onChange={e => setFormData(p => ({ ...p, precioVentaTotal: +e.target.value }))} className={INPUT} />
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 sm:p-6 border-t border-border flex justify-end gap-2">
              <button type="button" onClick={() => { setShowForm(false); resetForm(); }} className={BUTTON_SECONDARY}>Cancelar</button>
              <button type="submit" className={BUTTON_PRIMARY}>{editingId ? 'Actualizar' : 'Crear Cotización'}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default Cotizaciones;
