import React, { useMemo, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { CARD, INPUT, BUTTON_DARK } from '../ui';

import { useErp } from '../store';
import { Tipologia, RenglonPresupuesto, SubRenglon, Presupuesto } from '../types';
import { generarRenglones } from '../data';
import { fmtQ, TIPOLOGIA_LABEL, costoDirectoUnitario, precioUnitarioVenta, precioUnitarioVentaConFactores, duracionPorRendimiento, HERRAMIENTA_MENOR, COSTOS_INDIRECTOS, ADMINISTRACION, IMPREVISTOS, UTILIDAD } from '../utils';
import { exportCSV, exportPDF, exportXLSX } from '../export';
import { Plus, ChevronDown, ChevronRight, Trash2, FileText, FileSpreadsheet, Calculator, Save, X } from 'lucide-react';
import PresupuestosList from '../components/PresupuestosList';
import HistorialPresupuestosModal from '../components/HistorialPresupuestosModal';
import CriticalRenglonAlert from '../components/CriticalRenglonAlert';

// Catálogo de materiales comunes por actividad de construcción
const MATERIALES_POR_ACTIVIDAD: Record<string, { nombre: string; unidad: string; precioRef: number }[]> = {
  humedad: [
    { nombre: 'Cemento Portland', unidad: 'bulto (50kg)', precioRef: 95 },
    { nombre: 'Arena de río', unidad: 'm³', precioRef: 180 },
    { nombre: 'Piedrín', unidad: 'm³', precioRef: 200 },
    { nombre: 'Agua', unidad: 'lt', precioRef: 0.15 },
    { nombre: 'Alambre recocido #16', unidad: 'kg', precioRef: 18 },
    { nombre: 'Madera (formaletas)', unidad: 'ml', precioRef: 35 },
    { nombre: 'Clavo de formaleta', unidad: 'kg', precioRef: 15 },
  ],
  acero: [
    { nombre: 'Acero corrugado #4', unidad: 'barra 12m', precioRef: 85 },
    { nombre: 'Alambre recocido #16', unidad: 'kg', precioRef: 18 },
    { nombre: 'Alambre recocido #18', unidad: 'kg', precioRef: 15 },
  ],
  encofrado: [
    { nombre: 'Madera (formaletas)', unidad: 'ml', precioRef: 35 },
    { nombre: 'Clavo de formaleta', unidad: 'kg', precioRef: 15 },
    { nombre: 'Alambre recocido #18', unidad: 'kg', precioRef: 15 },
    { nombre: 'Aceite de desencofrar', unidad: 'lt', precioRef: 25 },
  ],
  mamposteria: [
    { nombre: 'Block 14x19x39', unidad: 'pza', precioRef: 4.20 },
    { nombre: 'Arena de río', unidad: 'm³', precioRef: 180 },
    { nombre: 'Cemento Portland', unidad: 'bulto (50kg)', precioRef: 95 },
    { nombre: 'Albañil', unidad: 'jornal', precioRef: 350 },
  ],
  acabados: [
    { nombre: 'Pintura látex', unidad: 'galón', precioRef: 180 },
    { nombre: 'Cemento Póleo', unidad: 'bulto (25kg)', precioRef: 55 },
    { nombre: 'Placa de yeso', unidad: 'pza', precioRef: 45 },
    { nombre: 'Azulejo', unidad: 'm²', precioRef: 85 },
    { nombre: 'Pegazulejo', unidad: 'bulto', precioRef: 55 },
  ],
  plomeria: [
    { nombre: 'Tub PVC 4"', unidad: 'ml', precioRef: 35 },
    { nombre: 'Codo PVC 4"', unidad: 'pza', precioRef: 25 },
    { nombre: 'Té PVC 4"', unidad: 'pza', precioRef: 20 },
    { nombre: 'Válvula compuerta', unidad: 'pza', precioRef: 120 },
    { nombre: 'Teflón', unidad: 'rollo', precioRef: 12 },
    { nombre: 'Pegatina PVC', unidad: 'tubo', precioRef: 28 },
  ],
  electricidad: [
    { nombre: 'Cable THW #12', unidad: 'rollo (100m)', precioRef: 450 },
    { nombre: 'Cable THW #14', unidad: 'rollo (100m)', precioRef: 320 },
    { nombre: 'Conduit conduit 1/2"', unidad: 'ml', precioRef: 22 },
    { nombre: 'Caja de paso', unidad: 'pza', precioRef: 45 },
    { nombre: 'Tomacorriente', unidad: 'pza', precioRef: 35 },
    { nombre: 'Interruptor', unidad: 'pza', precioRef: 30 },
    { nombre: 'Conector PVC', unidad: 'pza', precioRef: 15 },
  ],
};

// Personal promedio por actividad
const PERSONAL_POR_ACTIVIDAD: Record<string, number> = {
  humedad: 6,
  acero: 4,
  encofrado: 8,
  mamposteria: 6,
  acabados: 4,
  plomeria: 3,
  electricidad: 3,
  general: 5,
};

const ACTIVIDADES_TIPICAS = Object.keys(MATERIALES_POR_ACTIVIDAD);

// Mapeo automático: código de renglón → actividad sugerida
const ACTIVIDAD_POR_RENGLON: Record<string, string> = {
  '05': 'humedad', '06': 'humedad', '07': 'humedad', '08': 'humedad', '09': 'humedad',
  '10': 'mamposteria', '11': 'mamposteria', '12': 'acabados', '13': 'acabados',
  '14': 'acero', '15': 'acero', '16': 'acero',
  '17': 'plomeria', '18': 'plomeria', '19': 'electricidad', '20': 'electricidad',
  '21': 'electricidad', '22': 'acabados', '23': 'acabados', '24': 'acabados',
  '25': 'acabados', '26': 'acabados', '27': 'acabados', '28': 'acabados',
  '29': 'acabados', '30': 'plomeria', '31': 'plomeria',
  '32': 'encofrado', '33': 'acero', '34': 'encofrado',
};

const Presupuestos: React.FC = () => {
  const { t } = useTranslation();
  const { proyectos, addPresupuesto, updatePresupuesto, deletePresupuesto, presupuestos, selectedProyectoId, movimientos, addMovimiento, addNotificacion, addOrden, addProveedor, proveedores, updateProyecto } = useErp();
  const [tab, setTab] = useState<'crear' | 'guardados'>('crear');
  const [tipologia, setTipologia] = useState<Tipologia>('residencial');
  const [proyecto, setProyecto] = useState('Nuevo Presupuesto');
  const [projectId, setProjectId] = useState('');
  const [items, setItems] = useState<RenglonPresupuesto[]>([]);
  const [actividadSeleccionada, setActividadSeleccionada] = useState<string | null>(null);
  const [sel, setSel] = useState('');
  const [selectedProveedorId, setSelectedProveedorId] = useState('');
  const [nuevoProveedorNombre, setNuevoProveedorNombre] = useState('');
  const [nuevoProveedorContacto, setNuevoProveedorContacto] = useState('');
  const [saved, setSaved] = useState(false);
  const [editingPresupuesto, setEditingPresupuesto] = useState<Presupuesto | null>(null);

  useEffect(() => {
    if (selectedProyectoId) {
      setProjectId(selectedProyectoId);
      const proyectoSeleccionado = proyectos.find(p => p.id === selectedProyectoId);
      if (proyectoSeleccionado) {
        setTipologia(proyectoSeleccionado.tipologia);
        setProyecto(`Presupuesto ${proyectoSeleccionado.nombre}`);
      }
      return;
    }

    if (!projectId && proyectos.length > 0) {
      setProjectId(proyectos[0].id);
    }
  }, [proyectos, projectId, selectedProyectoId]);

  useEffect(() => {
    if (proveedores.length > 0 && !selectedProveedorId) {
      setSelectedProveedorId(proveedores[0].id);
    }
  }, [proveedores, selectedProveedorId]);

  useEffect(() => {
    if (!selectedProyectoId) return;

    const presupuestoExistente = presupuestos
      .filter(p => p.proyectoId === selectedProyectoId)
      .sort((a, b) => new Date(b.fechaActualizacion).getTime() - new Date(a.fechaActualizacion).getTime())[0];

    if (presupuestoExistente) {
      setItems((presupuestoExistente.renglones || []) as RenglonPresupuesto[]);
      setTipologia(presupuestoExistente.tipologia);
      setProyecto(presupuestoExistente.notas || `Presupuesto ${proyectos.find(p => p.id === selectedProyectoId)?.nombre || ''}`);
      setEditingPresupuesto(presupuestoExistente);
    } else {
      setItems([]);
      setEditingPresupuesto(null);
    }
  }, [selectedProyectoId, presupuestos, proyectos]);

  const openHistorial = () => { /* historial UI manejado inline */ };

  const handleApprovePresupuesto = async (p: Presupuesto) => {
    await updatePresupuesto(p.id, { estado: 'aprobado' });
    addNotificacion('general', 'Presupuesto aprobado', `El presupuesto "${p.notas || 'sin nombre'}" fue aprobado.`, p.proyectoId, p.id);
    if (editingPresupuesto?.id === p.id) {
      setEditingPresupuesto({ ...editingPresupuesto, estado: 'aprobado' });
    }
  };

  const handleRejectPresupuesto = async (p: Presupuesto) => {
    await updatePresupuesto(p.id, { estado: 'rechazado' });
    addNotificacion('general', 'Presupuesto rechazado', `El presupuesto "${p.notas || 'sin nombre'}" fue rechazado.`, p.proyectoId, p.id);
    if (editingPresupuesto?.id === p.id) {
      setEditingPresupuesto({ ...editingPresupuesto, estado: 'rechazado' });
    }
  };

  const catalogo = useMemo(() => generarRenglones(tipologia), [tipologia]);
  const disponibles = catalogo.filter(c => !items.some(i => i.codigo === c.codigo));

  const addRenglon = (codigo: string) => {
    const base = catalogo.find(c => c.codigo === codigo);
    if (!base) return;
    setItems(s => [...s, { ...base, id: codigo, cantidad: 1, expanded: false, subRenglones: [] }]);
    setSel('');
  };
  const addTodos = () => {
    setItems(catalogo.map(c => ({ ...c, id: c.codigo, cantidad: 1, expanded: false, subRenglones: [] })));
  };

  const upd = (id: string, patch: Partial<RenglonPresupuesto>) =>
    setItems(s => s.map(i => i.id === id ? { ...i, ...patch } : i));

  // Auto-sugerir actividad al expandir un renglón sin sub-renglones
  const toggleExpand = (id: string) => {
    const renglon = items.find(r => r.id === id);
    if (renglon && (!renglon.subRenglones || renglon.subRenglones.length === 0)) {
      const sugerida = ACTIVIDAD_POR_RENGLON[renglon.codigo];
      if (sugerida) {
        setActividadSeleccionada(sugerida);
      }
    }
    upd(id, { expanded: !renglon?.expanded });
  };
  const del = (id: string) => setItems(s => s.filter(i => i.id !== id));

  // Desglose de mano de obra por renglón
  const getManoObraRenglon = (r: RenglonPresupuesto) => {
    const jornalBase = r.costoManoObra;
    const rend = r.rendimientoCuadrilla;
    const horasJornal = 8; // jornada estándar 8 horas
    const diasTrabajo = rend > 0 ? Math.ceil(1 / rend) : 1;
    return {
      jornalDiario: jornalBase,
      rendimientoDiario: rend,
      costoPorUnidad: jornalBase,
      horasJornal,
      diasEstimados: diasTrabajo,
      trabajadores: Math.max(1, Math.round(rend * jornalBase / 150)),
    };
  };

  // Resumen de explosion de materiales por tipo
  const explosionPorTipo = useMemo(() => {
    const tipos: Record<string, { cantidad: number; total: number; unidad: string }> = {};
    items.forEach(r => {
      if (r.subRenglones) {
        r.subRenglones.forEach(sub => {
          const cant = sub.cantidadUnitaria * r.cantidad;
          const tot = cant * sub.precioUnitario;
          const tipo = sub.nombreMaterial.includes('Cemento') ? 'Cemento' :
            sub.nombreMaterial.includes('Hierro') ? 'Acero' :
            sub.nombreMaterial.includes('Block') ? 'Mampostería' :
            sub.nombreMaterial.includes('Arena') || sub.nombreMaterial.includes('Piedrín') ? 'Concreto' :
            sub.nombreMaterial.includes('Lámina') || sub.nombreMaterial.includes('Pintura') ? 'Acabados' :
            sub.nombreMaterial.includes('Alambre') || sub.nombreMaterial.includes('Tubo') ? 'Instalaciones' :
            'Otros';
          if (!tipos[tipo]) {
            tipos[tipo] = { cantidad: 0, total: 0, unidad: sub.unidad };
          }
          tipos[tipo].cantidad += cant;
          tipos[tipo].total += tot;
        });
      }
    });
    return Object.entries(tipos).map(([tipo, data]) => ({ tipo, ...data }));
  }, [items]);

  // Funciones para sub-renglones
  // Agregar materiales de catálogo por tipo de actividad
  const addMaterialesActividad = (renglonId: string, actividad: string) => {
    const materiales = MATERIALES_POR_ACTIVIDAD[actividad] || [];
    const personal = PERSONAL_POR_ACTIVIDAD[actividad] || PERSONAL_POR_ACTIVIDAD.general;
    const existentes = items.find(r => r.id === renglonId)?.subRenglones || [];
    const nuevosSubs: SubRenglon[] = materiales.map(m => ({
      id: 'sub-' + crypto.randomUUID().slice(0, 9),
      nombreMaterial: m.nombre,
      unidad: m.unidad,
      cantidadUnitaria: 1,
      precioUnitario: m.precioRef,
    }));
    const todasLasSubs = [...existentes, ...nuevosSubs];
    const costoMat = todasLasSubs.reduce((a, s) => a + (s.cantidadUnitaria * s.precioUnitario), 0);

    upd(renglonId, {
      subRenglones: todasLasSubs,
      costoManoObra: personal * 350,
      costoMateriales: costoMat,
    });
  };

  const addSubRenglon = (renglonId: string) => {
    const existentes = items.find(r => r.id === renglonId)?.subRenglones || [];
    const nuevasSubs: SubRenglon[] = [
      ...existentes,
      {
        id: 'sub-' + crypto.randomUUID().slice(0, 9),
        nombreMaterial: '',
        unidad: 'kg',
        cantidadUnitaria: 0,
        precioUnitario: 0,
      }
    ];
    const costoMat = nuevasSubs.reduce((sum, s) => sum + (s.cantidadUnitaria * s.precioUnitario), 0);
    upd(renglonId, { subRenglones: nuevasSubs, costoMateriales: costoMat });
  };

  const handleRegistrarGastoRenglon = async (r: RenglonPresupuesto) => {
    if (!projectId) return;
    try {
      const c = calc(r);
      await addMovimiento({
        tipo: 'gasto',
        proyectoId: projectId,
        descripcion: `Gasto desde presupuesto - ${r.nombre}`,
        cantidad: 1,
        unidad: r.unidad || 'u',
        categoria: 'materiales',
        costoUnitario: c.total,
        fecha: new Date().toISOString().slice(0, 10),
      });
      addNotificacion('general', 'Gasto registrado', `Se registró gasto Q${c.total.toFixed(2)} para renglón ${r.nombre}`, projectId);
    } catch (err) {
      console.error('Error registrando gasto por renglón:', err);
    }
  };

  const handleCrearOCDesdeRenglon = async (r: RenglonPresupuesto) => {
    if (!projectId) return;
    if (!selectedProveedorId) {
      addNotificacion('general', 'Proveedor faltante', 'Selecciona un proveedor antes de crear la OC.', projectId);
      return;
    }

    try {
      const c = calc(r);
      await addOrden({
        proyectoId: projectId,
        proveedorId: selectedProveedorId,
        fecha: new Date().toISOString().slice(0, 10),
        estado: 'pendiente',
        total: c.total,
        items: [{ materialId: r.id, cantidad: r.cantidad, precioUnitario: c.pv }],
      });
      addNotificacion('general', 'Orden de Compra creada', `OC por Q${c.total.toFixed(2)} creada desde renglón ${r.nombre}`, projectId);
    } catch (err) {
      console.error('Error creando OC desde renglón:', err);
    }
  };

  const updSubRenglon = (renglonId: string, subId: string, patch: Partial<SubRenglon>) => {
    const renglon = items.find(r => r.id === renglonId);
    if (!renglon?.subRenglones) return;
    const subs = renglon.subRenglones.map(s => s.id === subId ? { ...s, ...patch } : s);
    const costoMat = subs.reduce((sum, s) => sum + (s.cantidadUnitaria * s.precioUnitario), 0);
    upd(renglonId, { subRenglones: subs, costoMateriales: costoMat });
  };

  const delSubRenglon = (renglonId: string, subId: string) => {
    const renglon = items.find(r => r.id === renglonId);
    if (!renglon?.subRenglones) return;
    const subs = renglon.subRenglones.filter(s => s.id !== subId);
    const costoMat = subs.length > 0
      ? subs.reduce((sum, s) => sum + (s.cantidadUnitaria * s.precioUnitario), 0)
      : renglon.costoMateriales;
    upd(renglonId, { subRenglones: subs, costoMateriales: costoMat });
  };

  const proyectoActual = projectId ? proyectos.find(p => p.id === projectId) : null;
  const calc = (r: RenglonPresupuesto) => {
    const cd = costoDirectoUnitario(r.costoMateriales, r.costoManoObra, r.costoEquipo);
    const pv = proyectoActual?.factorSobrecosto
      ? precioUnitarioVentaConFactores(cd, proyectoActual.factorSobrecosto)
      : precioUnitarioVenta(cd);
    return { cd, pv, total: pv * r.cantidad, dur: duracionPorRendimiento(r.cantidad, r.rendimientoCuadrilla) };
  };
  const granTotal = items.reduce((a, r) => a + calc(r).total, 0);
  const granDir = items.reduce((a, r) => a + costoDirectoUnitario(r.costoMateriales, r.costoManoObra, r.costoEquipo) * r.cantidad, 0);

  // Resumen de materiales
  const resumenMateriales = useMemo(() => {
    const materiales: Record<string, { unidad: string; cantidad: number; total: number }> = {};
    items.forEach(r => {
      if (r.subRenglones) {
        r.subRenglones.forEach(sub => {
          const key = `${sub.nombreMaterial}-${sub.unidad}`;
          const cant = sub.cantidadUnitaria * r.cantidad;
          const tot = cant * sub.precioUnitario;
          if (!materiales[key]) {
            materiales[key] = { unidad: sub.unidad, cantidad: 0, total: 0 };
          }
          materiales[key].cantidad += cant;
          materiales[key].total += tot;
        });
      }
    });
    return Object.entries(materiales).map(([nombre, data]) => ({ nombre, ...data }));
  }, [items]);

  const save = async () => {
    // Safety: ensure costoMateriales is synced from subRenglones before saving
    const itemsSeguros = items.map(r => {
      if (!r.subRenglones || r.subRenglones.length === 0) return r;
      const costoMat = r.subRenglones.reduce((sum, s) => sum + (s.cantidadUnitaria * s.precioUnitario), 0);
      return { ...r, costoMateriales: costoMat };
    });
    const totalCalc = itemsSeguros.reduce((a, r) => a + calc(r).total, 0);
    const costoDir = itemsSeguros.reduce((a, r) => a + costoDirectoUnitario(r.costoMateriales, r.costoManoObra, r.costoEquipo) * r.cantidad, 0);

    if (editingPresupuesto) {
      await updatePresupuesto(editingPresupuesto.id, {
        renglones: itemsSeguros,
        totalCalculado: totalCalc,
        costoDirectoTotal: costoDir,
        fechaActualizacion: new Date().toISOString(),
        notas: proyecto,
        versionPresupuesto: (editingPresupuesto.versionPresupuesto || 1) + 1,
      });
      setEditingPresupuesto(null);
    } else if (projectId) {
      await addPresupuesto({
        proyectoId: projectId,
        tipologia,
        renglones: itemsSeguros,
        totalCalculado: totalCalc,
        costoDirectoTotal: costoDir,
        estado: 'borrador',
        fechaCreacion: new Date().toISOString(),
        fechaActualizacion: new Date().toISOString(),
        notas: proyecto,
        versionPresupuesto: 1,
      });
    } else {
      try { localStorage.setItem('wm_presupuesto_' + proyecto, JSON.stringify(itemsSeguros)); } catch { /* ignore */ }
    }

    // Auto-fill project fields from budget totals
    if (projectId && totalCalc > 0) {
      const proyectoActual = proyectos.find(p => p.id === projectId);
      if (proyectoActual) {
        const patch: Record<string, any> = {};
        // Only update if project's presupuestoTotal is 0 or less (first budget)
        if (!proyectoActual.presupuestoTotal || proyectoActual.presupuestoTotal <= 0) {
          patch.presupuestoTotal = Math.round(totalCalc * 100) / 100;
        }
        // Auto-fill montoContrato if empty
        if (!proyectoActual.montoContrato || proyectoActual.montoContrato <= 0) {
          patch.montoContrato = Math.round(totalCalc * 100) / 100;
        }
        // Auto-fill margenUtilidadObjetivo if empty
        if (!proyectoActual.margenUtilidadObjetivo) {
          patch.margenUtilidadObjetivo = Math.round(UTILIDAD * 100);
        }
        if (Object.keys(patch).length > 0) {
          updateProyecto(projectId, patch);
        }
      }
    }

    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  const handleRegistrarGastoTotal = async () => {
    if (!projectId) return;
    try {
      await addMovimiento({
        tipo: 'gasto',
        proyectoId: projectId,
        descripcion: `Gasto registrado desde presupuesto: ${proyecto}`,
        cantidad: 1,
        unidad: 'global',
        categoria: 'materiales',
        costoUnitario: granTotal,
        fecha: new Date().toISOString().slice(0, 10),
      });
      addNotificacion('general', 'Gasto registrado', `Se registró un gasto Q${granTotal.toFixed(2)} para el proyecto.`, projectId);
    } catch (err) {
      console.error('Error registrando gasto desde presupuesto:', err);
    }
  };

  const handleEditPresupuesto = (p: Presupuesto) => {
    setEditingPresupuesto(p);
    setTab('crear');
    setProyecto(p.notas || 'Presupuesto');
    setProjectId(p.proyectoId);
    setTipologia(p.tipologia);
    setItems((p.renglones || []) as RenglonPresupuesto[]);
  };

  const handleDuplicatePresupuesto = (p: Presupuesto) => {
    setEditingPresupuesto(null);
    setTab('crear');
    setProyecto(p.notas + ' (Copia)' || 'Presupuesto (Copia)');
    setProjectId(p.proyectoId);
    setTipologia(p.tipologia);
    setItems((p.renglones || []) as RenglonPresupuesto[]);
  };

  const handleExportPresupuesto = (p: Presupuesto) => {
    exportPDF(p.renglones || [], p.notas || 'Presupuesto', p.tipologia);
  };

  const presupuestosDelProyecto = projectId ? presupuestos
    .filter(p => p.proyectoId === projectId)
    .sort((a, b) => new Date(b.fechaActualizacion).getTime() - new Date(a.fechaActualizacion).getTime())
    : presupuestos;

  const presupuestoActual = presupuestosDelProyecto[0];
  const gastoReal = projectId ? movimientos.filter(m => m.proyectoId === projectId && (m.tipo === 'gasto' || m.tipo === 'egreso')).reduce((sum, m) => sum + (m.costoTotal ?? m.monto), 0) : 0;
  const variacionReal = presupuestoActual ? gastoReal - presupuestoActual.totalCalculado : 0;

  const ninp = "w-full px-2 py-1 text-xs rounded border border-slate-200 outline-none focus:border-orange-400 text-right";
  const SkeletonRow = (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-3 animate-pulse space-y-2">
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 rounded-full bg-slate-200" />
        <div className="h-3 w-32 bg-slate-200 rounded" />
        <div className="h-3 w-24 bg-slate-200 rounded ml-auto" />
      </div>
      <div className="h-2 w-full bg-slate-100 rounded" />
    </div>
  );

  return (
    <div className="p-3 sm:p-4 lg:p-6 max-w-[1600px] mx-auto">
      <div className="flex flex-wrap items-end justify-between gap-2 sm:gap-3 mb-3 sm:mb-4">
        <div>
          <h1 className="text-lg sm:text-xl lg:text-2xl font-black text-foreground flex items-center gap-2"><Calculator className="w-5 h-5 sm:w-6 sm:h-6 text-primary" /> {t('presupuestos.titulo_calculadora')}</h1>
          <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">{t('presupuestos.motor_calculo', { 
            h_menor: HERRAMIENTA_MENOR*100, 
            indirectos: COSTOS_INDIRECTOS*100, 
            admin: ADMINISTRACION*100, 
            imprevistos: IMPREVISTOS*100, 
            utilidad: UTILIDAD*100 
          })}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={openHistorial} className="bg-muted px-3 py-1 rounded-xl text-sm text-foreground hover:bg-muted/80">{t('presupuestos.historial')}</button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4 border-b border-border">
          <button 
            onClick={() => { setTab('crear'); setEditingPresupuesto(null); }}
            className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors ${
              tab === 'crear' 
                ? 'text-primary border-primary' 
                : 'text-muted-foreground border-transparent hover:text-foreground'
            }`}
          >
            ➕ {editingPresupuesto ? t('presupuestos.editar') : t('presupuestos.nuevo')}
          </button>
          <button 
            onClick={() => setTab('guardados')}
            className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors ${
              tab === 'guardados' 
                ? 'text-primary border-primary' 
                : 'text-muted-foreground border-transparent hover:text-foreground'
            }`}
          >
            📋 {t('presupuestos.guardados_con_count', { count: presupuestosDelProyecto.length })}
          </button>
      </div>

      {tab === 'guardados' ? (
        <div className="space-y-4">
          <PresupuestosList 
            presupuestos={presupuestosDelProyecto}
            onEdit={handleEditPresupuesto}
            onDelete={deletePresupuesto}
            onDuplicate={handleDuplicatePresupuesto}
            onExport={handleExportPresupuesto}
            onApprove={handleApprovePresupuesto}
            onReject={handleRejectPresupuesto}
          />
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
            <div>
              {editingPresupuesto && <p className="text-xs text-orange-600 font-semibold">{editingPresupuesto && t('presupuestos.editando_version', { version: editingPresupuesto.versionPresupuesto })}</p>}
            </div>
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <button onClick={save} className={`${BUTTON_DARK} text-xs sm:text-sm px-2 sm:px-3`} disabled={!items.length || !projectId}><Save className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> <span className="hidden sm:inline">{saved ? t('presupuestos.guardado') : editingPresupuesto ? t('presupuestos.guardar_cambios') : t('presupuestos.guardar')}</span><span className="sm:hidden">{saved ? '✓' : '💾'}</span></button>
              <button onClick={handleRegistrarGastoTotal} disabled={!projectId || !granTotal} className="bg-indigo-600 disabled:opacity-40 text-white px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-xs sm:text-sm flex items-center gap-1"><span className="hidden sm:inline">{t('presupuestos.registrar_gasto')}</span><span className="sm:hidden">Gasto</span></button>
              <button disabled={!items.length} onClick={() => exportPDF(items, proyecto, tipologia)} className="bg-red-500 disabled:opacity-40 text-white px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-xs sm:text-sm flex items-center gap-1"><FileText className="w-3.5 h-3.5" /> PDF</button>
              <button disabled={!items.length} onClick={() => exportCSV(items, proyecto, tipologia)} className="bg-emerald-600 disabled:opacity-40 text-white px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-xs sm:text-sm flex items-center gap-1"><FileSpreadsheet className="w-3.5 h-3.5" /> CSV</button>
              <button disabled={!items.length} onClick={() => exportXLSX(items, proyecto, tipologia)} className="bg-green-700 disabled:opacity-40 text-white px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-xs sm:text-sm flex items-center gap-1"><FileSpreadsheet className="w-3.5 h-3.5" /> XLSX</button>
              {editingPresupuesto && <button onClick={() => { setEditingPresupuesto(null); setItems([]); }} className="bg-slate-400 text-white px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-xs"><X className="w-3.5 h-3.5" /></button>}
            </div>
          </div>

          <div className={`${CARD}`}>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div>
            <label className="text-xs font-semibold text-slate-500">{t('presupuestos.nombre')}</label>
            <input value={proyecto} onChange={e => setProyecto(e.target.value)} placeholder={t('presupuestos.nombre_placeholder')} className={INPUT} />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500">{t('presupuestos.proyecto_asociado')}</label>
            <select value={projectId} onChange={e => setProjectId(e.target.value)} className={INPUT}>
              <option value="">{t('presupuestos.seleccionar_proyecto')}</option>
              {proyectos.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500">{t('presupuestos.tipologia_filtros')}</label>
            <select value={tipologia} onChange={e => { setTipologia(e.target.value as Tipologia); setItems([]); }} className={INPUT}>
              {(Object.keys(TIPOLOGIA_LABEL) as Tipologia[]).map(t => <option key={t} value={t}>{TIPOLOGIA_LABEL[t]} ({generarRenglones(t).length} renglones)</option>)}
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="text-xs font-semibold text-slate-500">{t('presupuestos.agregar_renglon_filtro')}</label>
            <div className="flex gap-2 mt-1">
              <select value={sel} onChange={e => addRenglon(e.target.value)} className={`${INPUT} flex-1`}>
                <option value="">— {t('presupuestos.seleccionar_renglon_disponibles', { count: disponibles.length })} —</option>
                {disponibles.map(c => <option key={c.codigo} value={c.codigo}>{c.codigo} · {c.nombre}</option>)}
              </select>
              <button onClick={addTodos} className="bg-orange-500 text-white px-3 py-2 rounded-lg text-sm font-semibold whitespace-nowrap flex items-center gap-1"><Plus className="w-4 h-4" /> {t('presupuestos.todos')}</button>
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500">{t('presupuestos.proveedor_oc')}</label>
            <select value={selectedProveedorId} onChange={e => setSelectedProveedorId(e.target.value)} className={INPUT}>
              <option value="">{t('presupuestos.selecciona_proveedor_oc')}</option>
              {proveedores.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
            </select>
            <div className="mt-2 grid gap-2">
              <input value={nuevoProveedorNombre} onChange={e => setNuevoProveedorNombre(e.target.value)} placeholder={t('presupuestos.nombre_provider')} className={`${INPUT} text-xs`} />
              <input value={nuevoProveedorContacto} onChange={e => setNuevoProveedorContacto(e.target.value)} placeholder={t('presupuestos.contacto_provider')} className={`${INPUT} text-xs`} />
              <button onClick={async () => {
                if (!nuevoProveedorNombre) return;
                await addProveedor({ nombre: nuevoProveedorNombre, contacto: nuevoProveedorContacto, telefono: '', email: '', categoria: 'materiales' });
                setNuevoProveedorNombre('');
                setNuevoProveedorContacto('');
              }} className="bg-slate-900 text-white px-3 py-2 rounded-xl text-xs">+ {t('presupuestos.agregar_proveedor_btn')}</button>
            </div>
            {proveedores.length === 0 && (
              <p className="text-[10px] text-amber-600 mt-1">{t('presupuestos.agregar_proveedores_aviso')}</p>
            )}
          </div>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => <div key={i}>{SkeletonRow}</div>)}
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((r, idx) => {
            const c = calc(r);
            return (
               <div key={r.id} className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
                <div className="flex items-center gap-2 p-3">
                  <button onClick={() => toggleExpand(r.id)} className="text-muted-foreground" aria-label="Expandir">
                    {r.expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </button>
                  <span className="text-[10px] font-mono bg-muted px-1.5 py-0.5 rounded text-foreground/70">{r.codigo}</span>
                  <span className="flex-1 text-sm font-semibold text-foreground truncate">{idx + 1}. {r.nombre}</span>
                  <div className="hidden sm:flex items-center gap-1 text-xs">
                    <span className="text-muted-foreground">{t('presupuestos.cantidad_abrev')}</span>
                    <input type="number" value={r.cantidad} onChange={e => upd(r.id, { cantidad: +e.target.value })} placeholder={t('presupuestos.cantidad')} className="w-16 px-2 py-1 rounded border border-input text-right text-xs bg-background" />
                    <span className="text-muted-foreground">{r.unidad}</span>
                  </div>
                  <span className="text-sm font-bold text-primary w-24 text-right">{fmtQ(c.total)}</span>
                  <button onClick={() => del(r.id)} aria-label={t('presupuestos.eliminar_renglon')} className="text-muted-foreground/50 hover:text-destructive transition-colors"><Trash2 className="w-4 h-4" /></button>
                </div>
                {r.expanded && (
                  <div className="bg-muted/60 px-3 pb-3 pt-1 border-t border-border">
                    <div className="grid grid-cols-2 sm:hidden gap-2 mb-2 text-xs">
                      <div><label className="text-slate-400">Cantidad ({r.unidad})</label><input type="number" value={r.cantidad} onChange={e => upd(r.id, { cantidad: +e.target.value })} placeholder="Cantidad" className={ninp} /></div>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-2 text-xs">
                      <div><label className="text-slate-400 block mb-0.5">Rendimiento/día</label><input type="number" value={r.rendimientoCuadrilla} onChange={e => upd(r.id, { rendimientoCuadrilla: +e.target.value })} placeholder="Rendimiento/día" className={ninp} /></div>
                      <div><label className="text-slate-400 block mb-0.5">Materiales Q {(r.subRenglones?.length ?? 0) > 0 && <span className="text-orange-400 text-[9px]">(auto)</span>}</label><input type="number" value={r.costoMateriales} onChange={e => upd(r.id, { costoMateriales: +e.target.value })} placeholder="Materiales Q" className={ninp} readOnly={(r.subRenglones?.length ?? 0) > 0} /></div>
                      <div><label className="text-slate-400 block mb-0.5">Mano Obra Q</label><input type="number" value={r.costoManoObra} onChange={e => upd(r.id, { costoManoObra: +e.target.value })} placeholder="Mano Obra Q" className={ninp} /></div>
                      <div><label className="text-slate-400 block mb-0.5">Equipo Q</label><input type="number" value={r.costoEquipo} onChange={e => upd(r.id, { costoEquipo: +e.target.value })} placeholder="Equipo Q" className={ninp} /></div>
                      <div><label className="text-slate-400 block mb-0.5">Duración (días)</label><div className={ninp + ' bg-white text-slate-600'}>{c.dur}</div></div>
                    </div>
<div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-2 text-xs">
                       <div className="bg-white rounded-lg p-2 text-center"><div className="text-slate-400 text-[10px]">{t('presupuestos.costo_directo_unit')}</div><b className="text-slate-700">{fmtQ(c.cd)}</b></div>
                       <div className="bg-white rounded-lg p-2 text-center"><div className="text-slate-400 text-[10px]">{t('presupuestos.precio_unit_venta')}</div><b className="text-orange-600">{fmtQ(c.pv)}</b></div>
                       <div className="bg-white rounded-lg p-2 text-center"><div className="text-slate-400 text-[10px]">{t('presupuestos.total_renglon')}</div><b className="text-emerald-600">{fmtQ(c.total)}</b></div>
                     </div>

                    {/* Sub-renglones de materiales */}
                    <div className="mt-3 border-t pt-3">
                      <div className="flex justify-between items-center mb-2">
                      <div className="text-[10px] font-semibold text-slate-500">
                        📦 Desglose de Materiales por Renglón
                        {ACTIVIDAD_POR_RENGLON[r.codigo] && (
                          <span className="text-orange-500 ml-1">({ACTIVIDAD_POR_RENGLON[r.codigo]} sugerido)</span>
                        )}
                      </div>
                      <div className="flex gap-1 items-center">
                        <select
                          value={actividadSeleccionada || ''}
                          onChange={e => {
                            if (e.target.value) {
                              addMaterialesActividad(r.id, e.target.value);
                              setActividadSeleccionada(null);
                            }
                          }}
                          className="text-[10px] px-2 py-1 rounded border border-orange-200 outline-none focus:border-orange-400 bg-white"
                        >
                           <option value="">{t('presupuestos.tipo_actividad')}</option>
                             {ACTIVIDADES_TIPICAS.map(act => (
                               <option key={act} value={act}>{act.charAt(0).toUpperCase() + act.slice(1)} ({MATERIALES_POR_ACTIVIDAD[act].length} materiales)</option>
                             ))}
                           </select>
                           <button onClick={() => addSubRenglon(r.id)} className="text-[10px] bg-orange-100 text-orange-600 px-2 py-1 rounded flex items-center gap-1 hover:bg-orange-200">
                             <Plus className="w-3 h-3" /> {t('presupuestos.manual')}
                           </button>
                         </div>
                       </div>
                       {r.subRenglones && r.subRenglones.length > 0 ? (
                         <div className="space-y-1.5">
                           {r.subRenglones.map((sub, subIdx) => {
                             const subTotal = (sub.cantidadUnitaria * r.cantidad * sub.precioUnitario);
                             return (
                               <div key={sub.id} className="bg-white rounded p-2 border border-slate-150 flex items-center gap-1.5 text-xs">
                                 <span className="text-slate-400 w-6">{subIdx + 1}.</span>
                                 <input 
                                   type="text" 
                                   value={sub.nombreMaterial} 
                                   onChange={e => updSubRenglon(r.id, sub.id, { nombreMaterial: e.target.value })}
                                   placeholder={t('presupuestos.material')}
                                   className="flex-1 px-1.5 py-0.5 rounded border border-slate-200 text-xs"
                                 />
                                 <input 
                                   type="number" 
                                   value={sub.cantidadUnitaria} 
                                   onChange={e => updSubRenglon(r.id, sub.id, { cantidadUnitaria: +e.target.value })}
                                   placeholder={t('presupuestos.cant_u')}
                                   className="w-12 px-1 py-0.5 rounded border border-slate-200 text-right text-xs"
                                 />
                                 <span className="text-slate-500 text-[10px] w-14 text-right">{(sub.cantidadUnitaria * r.cantidad).toFixed(2)}</span>
                                 <select 
                                   value={sub.unidad} 
                                   onChange={e => updSubRenglon(r.id, sub.id, { unidad: e.target.value })}
                                   className="w-14 px-1 py-0.5 rounded border border-slate-200 text-xs"
                                 >
                                   <option>kg</option>
                                   <option>l</option>
                                   <option>m²</option>
                                   <option>m³</option>
                                   <option>u</option>
                                   <option>ml</option>
                                 </select>
                                 <input 
                                   type="number" 
                                   value={sub.precioUnitario} 
                                   onChange={e => updSubRenglon(r.id, sub.id, { precioUnitario: +e.target.value })}
                                   placeholder={t('presupuestos.precio')}
                                   className="w-16 px-1 py-0.5 rounded border border-slate-200 text-right text-xs"
                                 />
                                 <span className="text-slate-600 font-semibold w-20 text-right">{fmtQ(subTotal)}</span>
                                 <button onClick={() => delSubRenglon(r.id, sub.id)} className="text-slate-300 hover:text-red-500">
                                   <X className="w-3 h-3" />
                                 </button>
                               </div>
                             );
                           })}
                         </div>
                       ) : (
                         <div className="text-[10px] text-slate-400 italic py-2">{t('presupuestos.sin_desglose')}</div>
                       )}
                       <div className="mt-3 flex gap-2">
                         <button onClick={() => handleRegistrarGastoRenglon(r)} className="text-[11px] bg-indigo-600 text-white px-3 py-1.5 rounded-lg">{t('presupuestos.gasto_renglon_btn')}</button>
                         <button onClick={() => handleCrearOCDesdeRenglon(r)} className="text-[11px] bg-amber-500 text-white px-3 py-1.5 rounded-lg">{t('presupuestos.crear_oc_btn')}</button>
                         <button onClick={() => { navigator.clipboard?.writeText(`${r.codigo} · ${r.nombre}`); }} className="text-[11px] bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg">{t('common.copiar')}</button>
                       </div>
                    </div>

<div className="mt-2">
                       <div className="text-[10px] font-semibold text-slate-500 mb-1">{t('presupuestos.desglose_apu')}</div>
                       <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                         {r.insumos.map(ins => (
                           <div key={ins.id} className="flex justify-between bg-white rounded px-2 py-1 text-[11px]">
                             <span className="text-slate-600 truncate">{ins.nombre}</span>
                             <span className="text-slate-400">{ins.tipo} · {fmtQ(ins.precio)}</span>
                           </div>
                         ))}
                       </div>
                     </div>

                    {/* Cuadrilla de Mano de Obra */}
                    <div className="mt-3 border-t pt-3">
                      <div className="text-[10px] font-semibold text-slate-500 mb-2">👷 Cuadrilla de Mano de Obra</div>
                      <div className="bg-white rounded-lg p-2 border border-slate-100">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                          <div>
                            <label className="text-slate-400 text-[9px]">Jornal Unitario</label>
                            <input type="number" value={r.costoManoObra} onChange={e => upd(r.id, { costoManoObra: +e.target.value })} className="w-full px-1 py-0.5 rounded border border-slate-200 text-right text-[11px]" />
                          </div>
                          <div>
                            <label className="text-slate-400 text-[9px]">Rendimiento/día</label>
                            <input type="number" value={r.rendimientoCuadrilla} onChange={e => upd(r.id, { rendimientoCuadrilla: +e.target.value })} className="w-full px-1 py-0.5 rounded border border-slate-200 text-right text-[11px]" />
                          </div>
                          <div>
                            <label className="text-slate-400 text-[9px]">Días Estimados</label>
                            <div className="px-1 py-0.5 rounded bg-slate-50 text-right text-[11px] text-slate-600">{getManoObraRenglon(r).diasEstimados}</div>
                          </div>
                          <div>
                            <label className="text-slate-400 text-[9px]">Trabajadores</label>
                            <div className="px-1 py-0.5 rounded bg-slate-50 text-right text-[11px] text-slate-600">{getManoObraRenglon(r).trabajadores}</div>
                          </div>
                        </div>
                        <div className="mt-2 flex justify-between text-[10px] text-slate-500">
                          <span>Total Mano Obra: <b className="text-blue-600">{fmtQ(r.costoManoObra * r.cantidad)}</b></span>
                          <span>Costo Directo Unit.: <b className="text-slate-700">{fmtQ(c.cd)}</b></span>
                        </div>
                      </div>
                    </div>

                    {/* Resumen de Explosión de Materiales por Tipo */}
                    {explosionPorTipo.length > 0 && (
                      <div className="mt-3 border-t pt-3">
                        <div className="text-[10px] font-semibold text-slate-500 mb-2">📊 Explosión de Materiales por Tipo</div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-1">
                          {explosionPorTipo.map((t, i) => (
                            <div key={i} className="bg-white rounded p-1.5 border border-slate-100 text-[10px]">
                              <div className="font-semibold text-slate-700">{t.tipo}</div>
                              <div className="text-slate-500">{t.cantidad.toFixed(2)} {t.unidad}</div>
                              <div className="font-bold text-emerald-600">{fmtQ(t.total)}</div>
                            </div>
                          ))}
                        </div>
                        <div className="mt-1 text-[10px] text-slate-600">
                          Total materiales: <b>{fmtQ(resumenMateriales.reduce((a, m) => a + m.total, 0))}</b> · {resumenMateriales.length} tipos
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {/* Resumen de Materiales */}
          {resumenMateriales.length > 0 && (
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl border-2 border-emerald-200 p-4">
              <div className="text-sm font-bold text-emerald-900 mb-3">📊 Resumen de Materiales a Utilizar</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-xs">
                {resumenMateriales.map((mat, idx) => (
                  <div key={idx} className="bg-white rounded-lg p-2.5 border border-emerald-100">
                    <div className="font-semibold text-slate-700 truncate">{mat.nombre}</div>
                    <div className="flex justify-between mt-1 text-slate-600">
                      <span>{mat.cantidad.toFixed(2)} {mat.unidad}</span>
                      <span className="font-bold text-emerald-600">{fmtQ(mat.total)}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-3 text-xs text-slate-600 text-center">
                <b className="text-emerald-700">{resumenMateriales.length} materiales diferentes</b> · Total materiales: <b className="text-emerald-700">{fmtQ(resumenMateriales.reduce((a, m) => a + m.total, 0))}</b>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mb-4">
            <div className="bg-card text-card-foreground rounded-xl border border-border p-4">
              <div className="text-[10px] uppercase text-muted-foreground mb-2">Gasto real del proyecto</div>
              <div className="text-2xl font-bold text-foreground">{fmtQ(gastoReal)}</div>
              <div className="text-xs text-muted-foreground mt-1">Solo egresos registrados</div>
            </div>
            <div className="bg-card text-card-foreground rounded-xl border border-border p-4">
              <div className="text-[10px] uppercase text-muted-foreground mb-2">Presupuesto vigente</div>
              <div className="text-2xl font-bold text-foreground">{presupuestoActual ? fmtQ(presupuestoActual.totalCalculado) : 'N/A'}</div>
              <div className="text-xs text-muted-foreground mt-1">Última versión disponible</div>
            </div>
            <div className={`rounded-xl border p-4 ${variacionReal > 0 ? 'border-destructive/30 bg-destructive/10' : 'border-success/30 bg-success/10'}`}>
              <div className="text-[10px] uppercase text-muted-foreground mb-2">Variación real vs presupuesto</div>
              <div className="text-2xl font-bold text-foreground">{fmtQ(variacionReal)}</div>
              <div className="text-xs text-muted-foreground mt-1">{variacionReal > 0 ? 'Sobre presupuesto' : 'Bajo presupuesto'}</div>
            </div>
          </div>
          <div className="bg-primary text-primary-foreground rounded-xl p-3 sm:p-4 flex flex-wrap items-center justify-between gap-2 sticky bottom-2">
            <div className="flex gap-3 sm:gap-6 text-xs sm:text-sm">
              <div><span className="text-primary-foreground/70 text-[10px] sm:text-xs block">Costo Directo</span><b>{fmtQ(granDir)}</b></div>
              <div><span className="text-primary-foreground/70 text-[10px] sm:text-xs block">Renglones</span><b>{items.length}</b></div>
            </div>
            <div className="text-right">
              <span className="text-primary-foreground/80 text-[10px] sm:text-xs block">TOTAL (c/ indirectos)</span>
              <b className="text-lg sm:text-2xl">{fmtQ(granTotal)}</b>
            </div>
          </div>
        </div>
      )}
        </>
      )}
    </div>
  );
};

export default Presupuestos;
