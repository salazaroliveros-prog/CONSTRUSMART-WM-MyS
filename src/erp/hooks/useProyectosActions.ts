import { useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal, message } from 'antd';
import { useTranslation } from 'react-i18next';
import { useErp } from '../store';
import type { Proyecto } from '../types';
import { todayISO } from '../utils';
import { obtenerSubtipologias } from '../services/motorCalculo';
import { proyectoSchemaObject as proyectoSchemaCanonico } from '../store/schemas/proyectos';

const proyectoSchema = proyectoSchemaCanonico.pick({
  nombre: true,
  descripcion: true,
  tipologia: true,
  subtipo: true,
  tipoObra: true,
  cliente: true,
  clienteNit: true,
  clienteTelefono: true,
  clienteEmail: true,
  ubicacion: true,
  direccion: true,
  ciudad: true,
  departamento: true,
  codigoPostal: true,
  areaConstruccion: true,
  numPisos: true,
  plazoSemanas: true,
  ingenieroResidente: true,
  supervisor: true,
  arquitecto: true,
  numeroExpediente: true,
  numeroLicencia: true,
  presupuestoTotal: true,
  montoContrato: true,
  fechaInicio: true,
  fechaFin: true,
  margenUtilidadObjetivo: true,
  moneda: true,
  estado: true,
  etapa: true,
}).extend({
  nombre: z.string().min(1, 'Nombre requerido'),
  cliente: z.string().min(1, 'Cliente requerido'),
  ubicacion: z.string().min(1, 'Ubicación requerida'),
  presupuestoTotal: z.coerce.number().min(0, 'Presupuesto inválido'),
  montoContrato: z.coerce.number().min(0, 'Presupuesto inválido'),
  fechaInicio: z.string().min(1, 'Fecha requerida'),
  fechaFin: z.string().min(1, 'Fecha requerida'),
  clienteEmail: z.string().email('Email inválido').optional().or(z.literal('')),
  areaConstruccion: z.coerce.number().min(0).optional(),
  numPisos: z.coerce.number().int().min(0).optional(),
  plazoSemanas: z.coerce.number().int().min(0).optional(),
  margenUtilidadObjetivo: z.coerce.number().min(0).max(100).optional(),
});

export type ProyectoFormData = z.infer<typeof proyectoSchema>;

export const useProyectosActions = (options: { onCreated?: () => void } = {}) => {
  const onCreatedRef = React.useRef(options.onCreated);
  useEffect(() => { onCreatedRef.current = options.onCreated; }, [options.onCreated]);
  const { t } = useTranslation();
  const { proyectos, addProyecto, updateProyecto, deleteProyecto, clearProyectos, plantillas, crearProyectoDesdePlantilla, sugerirPlantillas, setCurrentProjectId, setView } = useErp();
  const [show, setShow] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [sugerencias, setSugerencias] = useState<any[]>([]);
  const [templateSearch, setTemplateSearch] = useState('');
  const [coords, setCoords] = useState<{ lat?: number; lng?: number }>({});
  const [subtipologias, setSubtipologias] = useState<any[]>([]);
  const [pauseModal, setPauseModal] = useState<{ proyectoId: string; nombre: string } | null>(null);
  const [pauseReason, setPauseReason] = useState('');
  const [pauseAutorizador, setPauseAutorizador] = useState('');
  const [pauseReanudacion, setPauseReanudacion] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<ProyectoFormData>({
    resolver: zodResolver(proyectoSchema),
    defaultValues: {
      nombre: '', descripcion: '', tipologia: 'residencial', tipoObra: 'nueva', cliente: '', clienteNit: '',
      clienteTelefono: '', clienteEmail: '', ubicacion: '', direccion: '', ciudad: '', departamento: '', codigoPostal: '',
      areaConstruccion: undefined, numPisos: undefined, plazoSemanas: undefined, ingenieroResidente: '', supervisor: '',
      arquitecto: '', numeroExpediente: '', numeroLicencia: '', presupuestoTotal: 0, montoContrato: 0,
      fechaInicio: todayISO(), fechaFin: todayISO(), margenUtilidadObjetivo: undefined, moneda: 'GTQ',
      estado: 'planeacion', etapa: 'planificacion',
    },
  });

  const openCreate = useCallback(() => {
    setEditingId(null);
    setCoords({});
    setSelectedTemplate('');
    setSugerencias([]);
    setTemplateSearch('');
    reset({
      nombre: '', descripcion: '', tipologia: 'residencial', tipoObra: 'nueva', cliente: '', clienteNit: '',
      clienteTelefono: '', clienteEmail: '', ubicacion: '', direccion: '', ciudad: '', departamento: '', codigoPostal: '',
      areaConstruccion: undefined, numPisos: undefined, plazoSemanas: undefined, ingenieroResidente: '', supervisor: '',
      arquitecto: '', numeroExpediente: '', numeroLicencia: '', presupuestoTotal: 0, montoContrato: 0,
      fechaInicio: todayISO(), fechaFin: todayISO(), margenUtilidadObjetivo: undefined, moneda: 'GTQ',
      estado: 'planeacion', etapa: 'planificacion',
    });
    setShow(true);
  }, [reset]);

  const openEdit = useCallback((p: Proyecto) => {
    setEditingId(p.id);
    setCoords({ lat: p.lat, lng: p.lng });
    reset({
      nombre: p.nombre,
      descripcion: p.descripcion || '',
      tipologia: p.tipologia,
      tipoObra: p.tipoObra || 'nueva',
      cliente: p.cliente || '',
      clienteNit: p.clienteNit || '',
      clienteTelefono: p.clienteTelefono || '',
      clienteEmail: p.clienteEmail || '',
      ubicacion: p.ubicacion,
      direccion: p.direccion || '',
      ciudad: p.ciudad || '',
      departamento: p.departamento || '',
      codigoPostal: p.codigoPostal || '',
      areaConstruccion: p.areaConstruccion || undefined,
      numPisos: p.numPisos || undefined,
      plazoSemanas: p.plazoSemanas || undefined,
      ingenieroResidente: p.ingenieroResidente || '',
      supervisor: p.supervisor || '',
      arquitecto: p.arquitecto || '',
      numeroExpediente: p.numeroExpediente || '',
      numeroLicencia: p.numeroLicencia || '',
      presupuestoTotal: p.presupuestoTotal,
      montoContrato: p.montoContrato || 0,
      fechaInicio: p.fechaInicio,
      fechaFin: p.fechaFin,
      margenUtilidadObjetivo: p.margenUtilidadObjetivo || undefined,
      moneda: p.moneda || 'GTQ',
      estado: p.estado,
      etapa: p.etapa || 'planificacion',
    });
    setShow(true);
  }, [reset]);

  const openDetail = useCallback((p: Proyecto) => {
    setCurrentProjectId(p.id);
    setView('presupuestos');
  }, [setCurrentProjectId, setView]);

  const onSubmit = useCallback((data: ProyectoFormData) => {
    setSubmitting(true);
    try {
      if (editingId) {
        updateProyecto(editingId, { ...data, lat: coords.lat, lng: coords.lng });
        message.success(t('proyectos.proyecto_actualizado', { nombre: data.nombre }));
      } else {
        if (selectedTemplate) {
          crearProyectoDesdePlantilla(selectedTemplate, { ...data, lat: coords.lat, lng: coords.lng });
          message.success(t('proyectos.proyecto_creado_plantilla', { nombre: data.nombre }));
        } else {
          addProyecto({ ...data, avanceFisico: 0, avanceFinanciero: 0, lat: coords.lat || 14.6349, lng: coords.lng || -90.5069, moneda: data.moneda || 'GTQ' });
          message.success(t('proyectos.proyecto_creado', { nombre: data.nombre }));
        }
      }
      reset();
      setEditingId(null);
      setCoords({});
      setSelectedTemplate('');
      setSugerencias([]);
      setTemplateSearch('');
      setShow(false);
      onCreatedRef.current?.();
    } catch {
      message.error(t('proyectos.error_guardar'));
    } finally {
      setSubmitting(false);
    }
  }, [editingId, selectedTemplate, coords, updateProyecto, addProyecto, crearProyectoDesdePlantilla, reset, t]);

  const accionRapida = useCallback((p: Proyecto, accion: string) => {
    switch (accion) {
      case 'iniciar':
        updateProyecto(p.id, { estado: 'ejecucion', etapa: 'preconstruccion', fechaInicioReal: todayISO() });
        message.success(t('proyectos.proyecto_iniciado', { nombre: p.nombre }));
        break;
      case 'pausar':
        setPauseModal({ proyectoId: p.id, nombre: p.nombre });
        setPauseReason(p.motivoPausa || '');
        setPauseAutorizador(p.pausadoPor || '');
        setPauseReanudacion(p.fechaReanudacionEstimada || '');
        break;
      case 'reanudar':
        updateProyecto(p.id, { estado: 'ejecucion' });
        message.success(t('proyectos.proyecto_reanudado', { nombre: p.nombre }));
        break;
      case 'finalizar':
        updateProyecto(p.id, { estado: 'finalizado', etapa: 'cierre', avanceFisico: 100, avanceFinanciero: 100, fechaFinEstimada: todayISO() });
        message.success(t('proyectos.proyecto_finalizado', { nombre: p.nombre }));
        break;
      case 'reabrir':
        updateProyecto(p.id, { estado: 'planeacion', etapa: 'planificacion', avanceFisico: 0, avanceFinanciero: 0 });
        message.info(t('proyectos.proyecto_reabierto', { nombre: p.nombre }));
        break;
    }
  }, [updateProyecto, t]);

  const confirmarPausa = useCallback(() => {
    if (!pauseModal) return;
    if (!pauseReason.trim()) { message.error(t('proyectos.motivo_pausa_requerido')); return; }
    if (!pauseAutorizador.trim()) { message.error(t('proyectos.autorizador_requerido')); return; }
    updateProyecto(pauseModal.proyectoId, {
      estado: 'pausado',
      motivoPausa: pauseReason.trim(),
      pausadoPor: pauseAutorizador.trim(),
      fechaPausa: todayISO(),
      fechaReanudacionEstimada: pauseReanudacion || undefined,
    });
    message.warning(t('proyectos.proyecto_pausado', { nombre: pauseModal.nombre }), { content: t('proyectos.proyecto_pausado_desc', { motivo: pauseReason }) });
    setPauseModal(null);
    setPauseReason('');
    setPauseAutorizador('');
    setPauseReanudacion('');
  }, [pauseModal, pauseReason, pauseAutorizador, pauseReanudacion, updateProyecto, t]);

  const handleDelete = useCallback(async (p: Proyecto) => {
    try {
      await Modal.confirm({
        title: t('proyectos.eliminar_proyecto'),
        content: t('proyectos.confirmar_eliminar', { nombre: p.nombre }),
        centered: true,
        okText: t('common.si'),
        cancelText: t('common.cancelar'),
        okType: 'danger',
      });
      deleteProyecto(p.id);
      message.success(t('proyectos.proyecto_eliminado', { nombre: p.nombre }));
    } catch (error) {
      if (error instanceof Error) return;
      message.error(t('common.error'));
    }
  }, [deleteProyecto, t]);

  const limpiarProyectos = useCallback(async () => {
    if (!proyectos.length) return;
    try {
      await Modal.confirm({
        title: t('proyectos.eliminar_todos'),
        content: t('proyectos.confirmar_eliminar_todos', { count: proyectos.length }),
        centered: true,
        okText: t('common.si'),
        cancelText: t('common.cancelar'),
        okType: 'danger',
        width: 520,
      });
      clearProyectos();
      message.success(t('proyectos.proyectos_eliminados'));
    } catch (error) {
      if (error instanceof Error) return;
      message.error(t('common.error'));
    }
  }, [proyectos.length, clearProyectos, t]);

  const proyectosFiltrados = useMemo(() => {
    const term = templateSearch.toLowerCase();
    const filtered = proyectos.filter(p =>
      !term ||
      p.nombre.toLowerCase().includes(term) ||
      (p.cliente && p.cliente.toLowerCase().includes(term)) ||
      (p.ubicacion && p.ubicacion.toLowerCase().includes(term))
    );
    return filtered;
  }, [proyectos, templateSearch]);

  const buscarSubtipologias = useCallback((tipologia: string) => {
    obtenerSubtipologias(tipologia).then(setSubtipologias).catch(() => setSubtipologias([]));
  }, []);

  return {
    proyectos,
    proyectosFiltrados,
    addProyecto,
    updateProyecto,
    deleteProyecto,
    clearProyectos,
    plantillas,
    crearProyectoDesdePlantilla,
    sugerirPlantillas,
    setCurrentProjectId,
    setView,
    show, setShow,
    editingId, setEditingId,
    selectedTemplate, setSelectedTemplate,
    sugerencias, setSugerencias,
    templateSearch, setTemplateSearch,
    coords, setCoords,
    subtipologias, setSubtipologias,
    pauseModal, setPauseModal,
    pauseReason, setPauseReason,
    pauseAutorizador, setPauseAutorizador,
    pauseReanudacion, setPauseReanudacion,
    submitting, setSubmitting,
    register, handleSubmit, reset, setValue, watch, errors,
    openCreate, openEdit, openDetail,
    onSubmit, accionRapida, confirmarPausa, handleDelete, limpiarProyectos,
    buscarSubtipologias,
  };
};