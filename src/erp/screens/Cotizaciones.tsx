import React, { useState, useMemo, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useTranslation } from 'react-i18next';
import { useErp } from '../store';
import { INPUT, BUTTON_PRIMARY, BUTTON_SECONDARY, MODAL_OVERLAY, MODAL_PANEL, MODAL_HEADER, MODAL_TITLE, MODAL_CLOSE, COLOR_DANGER } from '../ui';
import { fmtQ } from '../utils';
import { sanitizarObjeto, canUserDelete } from '@/lib/security';
import { confirmAction } from '@/lib/confirm-action';
import { exportCotizacionPDF } from '../export';
import { Plus, X, Send, FileText, Trash2, Pencil, Copy, CheckCircle2, Clock, Calculator, HardHat, Landmark, Building, Ruler, Home, CalendarDays, Droplets, Box } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';
import type { CotizacionCliente, CotizacionTipo } from '../types';
import { Skeleton } from '@/components/ui/skeleton';

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

const TIPOS_COTIZACION: { value: CotizacionTipo; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { value: 'construccion', label: 'Presupuesto de Construcción', icon: HardHat },
  { value: 'planos_registro', label: 'Planos de Registro', icon: Ruler },
  { value: 'estudio_planificacion', label: 'Estudio de Planificación (Entidades Públicas)', icon: Landmark },
  { value: 'diseno_urbanistico', label: 'Diseño Urbanístico', icon: Building },
  { value: 'anteproyecto_residencial', label: 'Anteproyecto Residencial', icon: Home },
];

const ESTADOS_COTIZACION = [
  { key: 'borrador', label: 'Borrador', color: 'bg-muted text-muted-foreground', icon: FileText },
  { key: 'enviada', label: 'Enviada', color: 'bg-blue-50 text-blue-600', icon: Send },
  { key: 'aprobada', label: 'Aprobada', color: 'bg-emerald-50 text-emerald-600', icon: CheckCircle2 },
  { key: 'rechazada', label: 'Rechazada', color: 'bg-red-50 text-red-600', icon: X },
  { key: 'vencida', label: 'Vencida', color: 'bg-amber-50 text-amber-600', icon: Clock },
] as const;

const Cotizaciones: React.FC = () => {
  const { t } = useTranslation();
  const { proyectos, cotizacionesNegocio: cotizaciones, addCotizacion, updateCotizacion, deleteCotizacion, user } = useErp();
  const [loading, setLoading] = useState(true);
  useEffect(() => { setLoading(false); }, []);
  const [showForm, setShowForm] = useState(false);
  const [showCalculadora, setShowCalculadora] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedCalculadora, setSelectedCalculadora] = useState<'pavimentos' | 'redesInfraestructura' | 'murosContencion' | null>(null);
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
      toast.error(t('cotizaciones.corrige_errores'));
      return;
    }
    setFormErrors({});

    if (editingId) {
      updateCotizacion(editingId, schema.data);
      toast.success(t('cotizaciones.actualizada'));
    } else {
      addCotizacion(schema.data);
      toast.success(t('cotizaciones.creada'));
    }
    resetForm();
    setShowForm(false);
  };

  const handleDelete = async (id: string) => {
    if (!canUserDelete(user?.rol)) {
      toast.error(t('common.sin_permisos', 'Sin permisos'));
      return;
    }
    try {
      await confirmAction({ title: t('cotizaciones.confirmar_eliminar'), content: t('cotizaciones.confirmar_eliminar_msg'), centered: true, okText: t('cotizaciones.si_eliminar'), cancelText: t('common.cancelar') });
    } catch { return; }
    deleteCotizacion(id);
    toast.success(t('cotizaciones.eliminada'));
  };

  const handleEnviar = (c: CotizacionCliente) => {
    updateCotizacion(c.id, { estado: 'enviada' });
    toast.success(t('cotizaciones.enviada_cliente'));
  };

  const duplicarCotizacion = (c: CotizacionCliente) => {
    const nueva = sanitizarObjeto({
      ...c,
      id: undefined,
      numero: `COT-${cotizaciones.length + 1}-${new Date().getFullYear()}`,
      fecha: new Date().toISOString().slice(0, 10),
      estado: 'borrador' as const,
    });
    addCotizacion(nueva);
    toast.success(t('cotizaciones.duplicada_borrador'));
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success(t('cotizaciones.copiado'));
  };

  if (loading) {
    return (
    <div className="p-3 sm:p-4 lg:p-5 max-w-[1600px] mx-auto space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t('cotizaciones.titulo')}</h1>
          <p className="text-sm text-muted-foreground">{t('cotizaciones.descripcion')}</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-semibold hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label={t('cotizaciones.nueva')}>
          <Plus className="w-4 h-4" /> {t('cotizaciones.nueva')}
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: t('cotizaciones.total'), value: cotizaciones.length, color: 'bg-blue-50 text-blue-600' },
          { label: t('cotizaciones.enviadas'), value: cotizaciones.filter(c => c.estado === 'enviada').length, color: 'bg-amber-50 text-amber-600' },
          { label: t('cotizaciones.aprobadas'), value: cotizaciones.filter(c => c.estado === 'aprobada').length, color: 'bg-emerald-50 text-emerald-600' },
          { label: t('cotizaciones.monto_aprobado'), value: fmtQ(cotizaciones.filter(c => c.estado === 'aprobada').reduce((a, c) => a + c.precioVentaTotal, 0)), color: 'bg-purple-50 text-blue-600' },
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
            <p className="text-sm">{t('cotizaciones.sin_cotizaciones')}</p>
            <button onClick={openCreate} className="mt-3 text-primary text-sm font-medium hover:underline">{t('cotizaciones.crear_primera')}</button>
          </div>
        ) : (
          <div className="space-y-2">
            {cotizacionesFiltradas.map(c => {
              const estadoInfo = ESTADOS_COTIZACION.find(e => e.key === c.estado);
              const EstadoIcon = estadoInfo?.icon || FileText;
              const tipoInfo = TIPOS_COTIZACION.find(t => t.value === c.tipo);
              const TipoIcon = tipoInfo?.icon;
              return (
                <div key={c.id} className="bg-card rounded-xl shadow-sm border border-border p-4 hover:shadow-sm transition-shadow">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded text-foreground/70">{c.numero}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-muted text-muted-foreground flex items-center gap-1">
                          {TipoIcon && <TipoIcon className="w-3 h-3" aria-hidden="true" />} {tipoInfo?.label}
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium flex items-center gap-1 ${estadoInfo?.color}`}>
                          <EstadoIcon className="w-3 h-3" /> {estadoInfo?.label}
                        </span>
                      </div>
                      <h3 className="text-sm font-semibold text-foreground truncate">{c.clienteNombre}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{c.descripcion || c.alcance}</p>
                      <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><CalendarDays className="w-3 h-3" aria-hidden="true" /> {c.fecha}</span>
                        {c.fechaVencimiento && <span className="flex items-center gap-1"><Clock className="w-3 h-3" aria-hidden="true" /> {t('cotizaciones.vence')} {c.fechaVencimiento}</span>}
                        {c.clienteNit && <span className="flex items-center gap-1"><FileText className="w-3 h-3" aria-hidden="true" /> NIT: {c.clienteNit}</span>}
                        <span className="font-semibold text-emerald-600">{fmtQ(c.precioVentaTotal)}</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      {c.estado === 'borrador' && (
                        <button onClick={() => handleEnviar(c)} className="text-xs bg-blue-500 text-white px-3 py-2 rounded hover:bg-blue-600 active:bg-blue-700 active:scale-95 flex items-center gap-1 min-h-[44px] transition-all">
                          <Send className="w-3 h-3" aria-hidden="true" /> {t('common.cancelar')}
                        </button>
                      )}
                      <button onClick={() => { exportCotizacionPDF(c); }} className="text-xs bg-emerald-500 text-white px-3 py-2 rounded hover:bg-emerald-600 active:bg-emerald-700 active:scale-95 flex items-center gap-1 min-h-[44px] transition-all">
                        <FileText className="w-3 h-3" aria-hidden="true" /> {t('cotizaciones.exportar_pdf')}
                      </button>
                      <button onClick={() => openEdit(c)} className="text-xs bg-muted text-foreground px-3 py-2 rounded hover:bg-muted/80 active:bg-muted/90 active:scale-95 flex items-center gap-1 min-h-[44px] transition-all">
                        <Pencil className="w-3 h-3" aria-hidden="true" /> {t('common.editar')}
                      </button>
                      <button onClick={() => duplicarCotizacion(c)} className="text-xs bg-muted text-foreground px-3 py-2 rounded hover:bg-muted/80 active:bg-muted/90 active:scale-95 flex items-center gap-1 min-h-[44px] transition-all">
                        <Copy className="w-3 h-3" aria-hidden="true" /> {t('cotizaciones.duplicar')}
                      </button>
                      <button onClick={() => handleDelete(c.id)} className="text-xs bg-red-50 text-red-600 px-3 py-2 rounded hover:bg-red-100 active:bg-red-200 active:scale-95 flex items-center gap-1 min-h-[44px] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400" aria-label={t('cotizaciones.eliminar')}>
                        <Trash2 className="w-3 h-3" aria-hidden="true" />
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
      <Dialog open={showForm} onOpenChange={(open) => {
        if (!open) {
          setShowForm(false);
          resetForm();
        }
      }}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? t('cotizaciones.editar') : t('cotizaciones.nueva')}</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">{t('cotizaciones.tipo_cotizacion')}</label>
                <select value={formData.tipo} onChange={e => setFormData(p => ({ ...p, tipo: e.target.value as CotizacionTipo }))} className={INPUT}>
                  {TIPOS_COTIZACION.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              {formData.tipo === 'construccion' && (
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">{t('cotizaciones.motor_calculo')}</label>
                  <button type="button" onClick={() => setShowCalculadora(true)} className={`${BUTTON_SECONDARY} flex items-center gap-2 w-full justify-center`}>
                    <Calculator className="w-4 h-4" aria-hidden="true" /> {t('cotizaciones.motor_calculo')}
                  </button>
                </div>
              )}
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">{t('cotizaciones.numero')}</label>
                <input value={formData.numero} onChange={e => setFormData(p => ({ ...p, numero: e.target.value }))} placeholder={t('cotizaciones.placeholder_numero')} className={INPUT} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">{t('cotizaciones.fecha')}</label>
                <input type="date" value={formData.fecha} onChange={e => setFormData(p => ({ ...p, fecha: e.target.value }))} className={INPUT} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">{t('cotizaciones.vencimiento')}</label>
                <input type="date" value={formData.fechaVencimiento} onChange={e => setFormData(p => ({ ...p, fechaVencimiento: e.target.value }))} className={INPUT} />
              </div>
            </div>

            <div className="border-t pt-3">
              <h3 className="text-xs font-bold text-foreground uppercase tracking-wider mb-2">{t('common.descripcion')}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="text-xs font-bold text-foreground uppercase tracking-wider mb-1 block">{t('cotizaciones.nombre_razon')}</label>
                  <input value={formData.clienteNombre} onChange={e => setFormData(p => ({ ...p, clienteNombre: e.target.value }))} placeholder={t('common.nombre')} className={INPUT} />
                  {formErrors.clienteNombre && <p className={`text-xs ${COLOR_DANGER} mt-0.5`}>{formErrors.clienteNombre}</p>}
                </div>
                <div>
                  <label className="text-xs font-bold text-foreground uppercase tracking-wider mb-1 block">{t('cotizaciones.nit')}</label>
                  <input value={formData.clienteNit} onChange={e => setFormData(p => ({ ...p, clienteNit: e.target.value }))} placeholder={t('cotizaciones.nit')} className={INPUT} />
                </div>
                <div>
                  <label className="text-xs font-bold text-foreground uppercase tracking-wider mb-1 block">{t('cotizaciones.telefono')}</label>
                  <input value={formData.clienteTelefono} onChange={e => setFormData(p => ({ ...p, clienteTelefono: e.target.value }))} placeholder={t('cotizaciones.telefono')} className={INPUT} />
                </div>
                <div>
                  <label className="text-xs font-bold text-foreground uppercase tracking-wider mb-1 block">{t('cotizaciones.email')}</label>
                  <input value={formData.clienteEmail} onChange={e => setFormData(p => ({ ...p, clienteEmail: e.target.value }))} placeholder={t('common.email_ejemplo')} className={INPUT} />
                </div>
                <div>
                  <label className="text-xs font-bold text-foreground uppercase tracking-wider mb-1 block">{t('cotizaciones.direccion')}</label>
                  <input value={formData.clienteDireccion} onChange={e => setFormData(p => ({ ...p, clienteDireccion: e.target.value }))} placeholder={t('cotizaciones.direccion')} className={INPUT} />
                </div>
              </div>
            </div>

            <div className="border-t pt-3">
              <h3 className="text-xs font-bold text-foreground uppercase tracking-wider mb-2">{t('common.descripcion')}</h3>
              <div className="grid grid-cols-1 gap-3">
                <div>
                  <label className="text-xs font-bold text-foreground uppercase tracking-wider mb-1 block">{t('cotizaciones.descripcion_corta')}</label>
                  <input value={formData.descripcion} onChange={e => setFormData(p => ({ ...p, descripcion: e.target.value }))} placeholder={t('cotizaciones.placeholder_descripcion')} className={INPUT} />
                </div>
                <div>
                  <label className="text-xs font-bold text-foreground uppercase tracking-wider mb-1 block">{t('cotizaciones.alcance')}</label>
                  <textarea value={formData.alcance} onChange={e => setFormData(p => ({ ...p, alcance: e.target.value }))} placeholder={t('cotizaciones.placeholder_alcance')} className={`${INPUT} min-h-[80px] resize-none`} rows={3} />
                </div>
              </div>
            </div>

            <div className="border-t pt-3">
              <h3 className="text-xs font-bold text-foreground uppercase tracking-wider mb-2">{t('common.precio')}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-foreground uppercase tracking-wider mb-1 block">{t('cotizaciones.costo_directo')}</label>
                  <input type="number" inputMode="decimal" value={formData.costoDirectoTotal} onChange={e => setFormData(p => ({ ...p, costoDirectoTotal: +e.target.value }))} className={INPUT} />
                </div>
                <div>
                  <label className="text-xs font-bold text-foreground uppercase tracking-wider mb-1 block">{t('cotizaciones.precio_venta')}</label>
                  <input type="number" inputMode="decimal" value={formData.precioVentaTotal} onChange={e => setFormData(p => ({ ...p, precioVentaTotal: +e.target.value }))} className={INPUT} />
                </div>
              </div>
            </div>

            <DialogFooter className="p-4 sm:p-6 border-t border-border">
              <button type="button" onClick={() => { setShowForm(false); resetForm(); }} className={BUTTON_SECONDARY}>{t('common.cancelar')}</button>
              <button type="submit" className={BUTTON_PRIMARY}>{editingId ? t('common.editar') : t('cotizaciones.crear')}</button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      {showCalculadora && (
        <div className={MODAL_OVERLAY} role="dialog" aria-modal="true">
          <div className={`${MODAL_PANEL} max-w-4xl`}>
            <div className={MODAL_HEADER}>
              <h2 className={MODAL_TITLE}>{t('cotizaciones.calculadora')}</h2>
              <button type="button" onClick={() => setShowCalculadora(false)} className={MODAL_CLOSE} aria-label={t('common.cerrar')}>
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 sm:p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="text-sm text-muted-foreground mb-4">
                {t('cotizaciones.calculadora')}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <button
                  type="button"
                  onClick={() => setSelectedCalculadora('pavimentos')}
                  className={`p-6 rounded-xl border-2 transition-all ${selectedCalculadora === 'pavimentos' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}
                >
                  <div className="text-2xl mb-2"><HardHat className="w-8 h-8 mx-auto" aria-hidden="true" /></div>
                  <div className="font-semibold text-sm">{t('cotizaciones.pavimentos')}</div>
                  <div className="text-xs text-muted-foreground">{t('cotizaciones.pavimentos')}</div>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedCalculadora('redesInfraestructura')}
                  className={`p-6 rounded-xl border-2 transition-all ${selectedCalculadora === 'redesInfraestructura' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}
                >
                  <div className="text-2xl mb-2"><Droplets className="w-8 h-8 mx-auto" aria-hidden="true" /></div>
                  <div className="font-semibold text-sm">{t('cotizaciones.redes_infraestructura')}</div>
                  <div className="text-xs text-muted-foreground">{t('cotizaciones.redes_infraestructura')}</div>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedCalculadora('murosContencion')}
                  className={`p-6 rounded-xl border-2 transition-all ${selectedCalculadora === 'murosContencion' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}
                >
                  <div className="text-2xl mb-2"><Box className="w-8 h-8 mx-auto" aria-hidden="true" /></div>
                  <div className="font-semibold text-sm">{t('cotizaciones.muros_contencion')}</div>
                  <div className="text-xs text-muted-foreground">{t('cotizaciones.muros_contencion')}</div>
                </button>
              </div>

              {selectedCalculadora === 'pavimentos' && (
                <div className="bg-muted/30 p-4 rounded-xl border">
                  <h3 className="font-semibold mb-3 text-sm">{t('cotizaciones.pavimentos')}</h3>
                  <p className="text-xs text-muted-foreground mb-4">
                    {t('cotizaciones.pavimentos')}
                  </p>
                  <button type="button" onClick={() => {
                    toast.success(t('cotizaciones.calcular_agregar'));
                    setShowCalculadora(false);
                    setSelectedCalculadora(null);
                  }} className={`${BUTTON_PRIMARY} w-full`}>
                    {t('cotizaciones.calcular_agregar')}
                  </button>
                </div>
              )}

              {selectedCalculadora === 'redesInfraestructura' && (
                <div className="bg-muted/30 p-4 rounded-xl border">
                  <h3 className="font-semibold mb-3 text-sm">{t('cotizaciones.redes_infraestructura')}</h3>
                  <p className="text-xs text-muted-foreground mb-4">
                    {t('cotizaciones.redes_infraestructura')}
                  </p>
                  <button type="button" onClick={() => {
                    toast.success(t('cotizaciones.calcular_agregar'));
                    setShowCalculadora(false);
                    setSelectedCalculadora(null);
                  }} className={`${BUTTON_PRIMARY} w-full`}>
                    {t('cotizaciones.calcular_agregar')}
                  </button>
                </div>
              )}

              {selectedCalculadora === 'murosContencion' && (
                <div className="bg-muted/30 p-4 rounded-xl border">
                  <h3 className="font-semibold mb-3 text-sm">{t('cotizaciones.muros_contencion')}</h3>
                  <p className="text-xs text-muted-foreground mb-4">
                    {t('cotizaciones.muros_contencion')}
                  </p>
                  <button type="button" onClick={() => {
                    toast.success(t('cotizaciones.calcular_agregar'));
                    setShowCalculadora(false);
                    setSelectedCalculadora(null);
                  }} className={`${BUTTON_PRIMARY} w-full`}>
                    {t('cotizaciones.calcular_agregar')}
                  </button>
                </div>
              )}
            </div>

            <div className="p-4 sm:p-6 border-t border-border flex justify-end gap-2">
              <button type="button" onClick={() => { setShowCalculadora(false); setSelectedCalculadora(null); }} className={BUTTON_SECONDARY}>{t('common.cerrar')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cotizaciones;

