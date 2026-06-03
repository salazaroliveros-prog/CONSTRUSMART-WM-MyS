import { useState, useCallback, useEffect } from 'react';
import {
  ActivoHerramienta, CuadroComparativo, CotizacionItem, Destajo,
  VentaPaquete, Anticipo, AmortizacionItem, CajaChica,
  PagoProveedor, CentroCosto, LogAuditoria, CapturaRendimiento,
  PlantillaSubrenglon, ValeSalidaRenglon, VinculacionOCExplosion
} from '../types';
import { supabase } from '../../lib/supabase';
import { useErp } from '../store';

const STORAGE_KEY_PREFIX = 'wm_erp_';
const uid = () => Math.random().toString(36).substr(2, 9);

// Helper: mapFromSnakeCase for new tables
const mapFromSnakeCase = (obj: any) => {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return obj;
  const mapped: any = {};
  for (const key of Object.keys(obj)) {
    const camelKey = key.replace(/_([a-z])/g, (_, l) => l.toUpperCase());
    mapped[camelKey] = obj[key];
  }
  return mapped;
};

const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

export function useNuevosModulos() {
  const { proyectos, materiales } = useErp();

  // ============================================================
  // 1. ACTIVOS Y HERRAMIENTAS
  // ============================================================
  const [activos, setActivos] = useState<ActivoHerramienta[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_PREFIX + 'activos');
    return saved ? JSON.parse(saved) : [];
  });

  const addActivo = useCallback(async (a: Omit<ActivoHerramienta, 'id'>) => {
    const nuevo: ActivoHerramienta = { ...a, id: uid() };
    if (isOnline) {
      await supabase.from('activos_herramientas').insert([nuevo]).maybeSingle();
    }
    const updated = [...activos, nuevo];
    setActivos(updated);
    localStorage.setItem(STORAGE_KEY_PREFIX + 'activos', JSON.stringify(updated));
  }, [activos]);

  const updateActivo = useCallback(async (id: string, patch: Partial<ActivoHerramienta>) => {
    const updated = activos.map(a => a.id === id ? { ...a, ...patch } : a);
    setActivos(updated);
    localStorage.setItem(STORAGE_KEY_PREFIX + 'activos', JSON.stringify(updated));
    if (isOnline) await supabase.from('activos_herramientas').update(patch).eq('id', id);
  }, [activos]);

  const deleteActivo = useCallback(async (id: string) => {
    const updated = activos.filter(a => a.id !== id);
    setActivos(updated);
    localStorage.setItem(STORAGE_KEY_PREFIX + 'activos', JSON.stringify(updated));
    if (isOnline) await supabase.from('activos_herramientas').delete().eq('id', id);
  }, [activos]);

  // ============================================================
  // 2. CUADRO COMPARATIVO DE PROVEEDORES
  // ============================================================
  const [cuadros, setCuadros] = useState<CuadroComparativo[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_PREFIX + 'cuadros');
    return saved ? JSON.parse(saved) : [];
  });

  const addCuadro = useCallback(async (c: Omit<CuadroComparativo, 'id' | 'cotizaciones'>) => {
    const nuevo: CuadroComparativo = { ...c, id: uid(), cotizaciones: [] };
    if (isOnline) {
      await supabase.from('cuadro_comparativo_proveedores').insert([nuevo]).maybeSingle();
    }
    const updated = [...cuadros, nuevo];
    setCuadros(updated);
    localStorage.setItem(STORAGE_KEY_PREFIX + 'cuadros', JSON.stringify(updated));
  }, [cuadros]);

  const addCotizacion = useCallback(async (cuadroId: string, cot: Omit<CotizacionItem, 'id'>) => {
    const cotizacion: CotizacionItem = { ...cot, id: uid() };
    const updated = cuadros.map(c => {
      if (c.id === cuadroId) {
        return { ...c, cotizaciones: [...c.cotizaciones, cotizacion] };
      }
      return c;
    });
    setCuadros(updated);
    localStorage.setItem(STORAGE_KEY_PREFIX + 'cuadros', JSON.stringify(updated));
    if (isOnline) {
      await supabase.from('cotizaciones').insert([{ ...cotizacion, cuadro_id: cuadroId }]).maybeSingle();
    }
  }, [cuadros]);

  const selectCotizacion = useCallback(async (cuadroId: string, cotId: string) => {
    const updated = cuadros.map(c => {
      if (c.id === cuadroId) {
        return {
          ...c,
          estado: 'adjudicado' as const,
          adjudicadoA: cotId,
          cotizaciones: c.cotizaciones.map(ct => ({ ...ct, seleccionada: ct.id === cotId }))
        };
      }
      return c;
    });
    setCuadros(updated);
    localStorage.setItem(STORAGE_KEY_PREFIX + 'cuadros', JSON.stringify(updated));
    if (isOnline) {
      await supabase.from('cuadro_comparativo_proveedores').update({ estado: 'adjudicado', adjudicado_a: cotId }).eq('id', cuadroId);
    }
  }, [cuadros]);

  // ============================================================
  // 3. VALES DE SALIDA POR RENGLÓN (Vinculación)
  // ============================================================
  const [valesRenglon, setValesRenglon] = useState<ValeSalidaRenglon[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_PREFIX + 'vales_renglon');
    return saved ? JSON.parse(saved) : [];
  });

  const addValeRenglon = useCallback(async (v: Omit<ValeSalidaRenglon, 'id'>) => {
    const nuevo: ValeSalidaRenglon = { ...v, id: uid() };
    const updated = [...valesRenglon, nuevo];
    setValesRenglon(updated);
    localStorage.setItem(STORAGE_KEY_PREFIX + 'vales_renglon', JSON.stringify(updated));
  }, [valesRenglon]);

  const getValesByRenglon = useCallback((renglonId: string) => {
    return valesRenglon.filter(v => v.renglonId === renglonId);
  }, [valesRenglon]);

  // ============================================================
  // 4. DESTAJOS / RENDIMIENTO REAL
  // ============================================================
  const [destajos, setDestajos] = useState<Destajo[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_PREFIX + 'destajos');
    return saved ? JSON.parse(saved) : [];
  });

  const addDestajo = useCallback(async (d: Omit<Destajo, 'id' | 'rendimientoReal'>) => {
    const rendReal = d.cantidadEjecutada / (d.horasTrabajadas / 8);
    const nuevo: Destajo = { ...d, id: uid(), rendimientoReal: +rendReal.toFixed(2) };
    const updated = [...destajos, nuevo];
    setDestajos(updated);
    localStorage.setItem(STORAGE_KEY_PREFIX + 'destajos', JSON.stringify(updated));
    if (isOnline) {
      await supabase.from('destajos').insert([nuevo]).maybeSingle();
    }
  }, [destajos]);

  const getDestajosByProyecto = useCallback((proyectoId: string) => {
    return destajos.filter(d => d.proyectoId === proyectoId);
  }, [destajos]);

  // ============================================================
  // 5. RENDIMIENTO REAL (Captura por cuadrilla)
  // ============================================================
  const [capturasRendimiento, setCapturasRendimiento] = useState<CapturaRendimiento[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_PREFIX + 'capturas_rend');
    return saved ? JSON.parse(saved) : [];
  });

  const addCapturaRendimiento = useCallback(async (c: Omit<CapturaRendimiento, 'id' | 'rendimientoReal' | 'eficiencia'>) => {
    const rendReal = c.cantidad / (c.horas / 8);
    const eficiencia = c.rendimientoTeorico > 0 ? (rendReal / c.rendimientoTeorico) * 100 : 0;
    const nuevo: CapturaRendimiento = {
      ...c, id: uid(),
      rendimientoReal: +rendReal.toFixed(2),
      eficiencia: +eficiencia.toFixed(1)
    };
    const updated = [...capturasRendimiento, nuevo];
    setCapturasRendimiento(updated);
    localStorage.setItem(STORAGE_KEY_PREFIX + 'capturas_rend', JSON.stringify(updated));
  }, [capturasRendimiento]);

  const deleteCapturaRendimiento = useCallback(async (id: string) => {
    const updated = capturasRendimiento.filter(c => c.id !== id);
    setCapturasRendimiento(updated);
    localStorage.setItem(STORAGE_KEY_PREFIX + 'capturas_rend', JSON.stringify(updated));
  }, [capturasRendimiento]);

  // ============================================================
  // 6. PLANTILLAS DE SUB-RENGLONES
  // ============================================================
  const [plantillas, setPlantillas] = useState<PlantillaSubrenglon[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_PREFIX + 'plantillas_sub');
    return saved ? JSON.parse(saved) : [];
  });

  const addPlantilla = useCallback(async (p: Omit<PlantillaSubrenglon, 'id'>) => {
    const nuevo: PlantillaSubrenglon = { ...p, id: uid() };
    const updated = [...plantillas, nuevo];
    setPlantillas(updated);
    localStorage.setItem(STORAGE_KEY_PREFIX + 'plantillas_sub', JSON.stringify(updated));
  }, [plantillas]);

  const getPlantillasByRenglon = useCallback((codigo: string) => {
    return plantillas.filter(p => p.renglonCodigo === codigo);
  }, [plantillas]);

  // ============================================================
  // 7. VENTAS Y PAQUETES
  // ============================================================
  const [ventas, setVentas] = useState<VentaPaquete[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_PREFIX + 'ventas');
    return saved ? JSON.parse(saved) : [];
  });

  const addVenta = useCallback(async (v: Omit<VentaPaquete, 'id'>) => {
    const nuevo: VentaPaquete = { ...v, id: uid() };
    const updated = [...ventas, nuevo];
    setVentas(updated);
    localStorage.setItem(STORAGE_KEY_PREFIX + 'ventas', JSON.stringify(updated));
    if (isOnline) await supabase.from('ventas_paquetes').insert([nuevo]).maybeSingle();
  }, [ventas]);

  const updateVenta = useCallback(async (id: string, patch: Partial<VentaPaquete>) => {
    const updated = ventas.map(v => v.id === id ? { ...v, ...patch } : v);
    setVentas(updated);
    localStorage.setItem(STORAGE_KEY_PREFIX + 'ventas', JSON.stringify(updated));
    if (isOnline) await supabase.from('ventas_paquetes').update(patch).eq('id', id);
  }, [ventas]);

  // ============================================================
  // 8. ANTICIPOS Y AMORTIZACIONES
  // ============================================================
  const [anticipos, setAnticipos] = useState<Anticipo[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_PREFIX + 'anticipos');
    return saved ? JSON.parse(saved) : [];
  });

  const addAnticipo = useCallback(async (a: Omit<Anticipo, 'id' | 'amortizaciones'>) => {
    const nuevo: Anticipo = { ...a, id: uid(), amortizaciones: [] };
    const updated = [...anticipos, nuevo];
    setAnticipos(updated);
    localStorage.setItem(STORAGE_KEY_PREFIX + 'anticipos', JSON.stringify(updated));
    if (isOnline) await supabase.from('anticipos').insert([nuevo]).maybeSingle();
  }, [anticipos]);

  const addAmortizacion = useCallback(async (anticipoId: string, am: Omit<AmortizacionItem, 'id'>) => {
    const amort: AmortizacionItem = { ...am, id: uid() };
    const updated = anticipos.map(a => {
      if (a.id === anticipoId) {
        const newSaldo = a.saldoPendiente - am.monto;
        return {
          ...a,
          saldoPendiente: Math.max(0, newSaldo),
          fechaUltimaAmortizacion: am.fecha,
          estado: newSaldo <= 0 ? 'amortizado' as const : a.estado,
          amortizaciones: [...a.amortizaciones, amort]
        };
      }
      return a;
    });
    setAnticipos(updated);
    localStorage.setItem(STORAGE_KEY_PREFIX + 'anticipos', JSON.stringify(updated));
    if (isOnline) {
      await supabase.from('amortizaciones').insert([{ ...amort, anticipo_id: anticipoId }]).maybeSingle();
    }
  }, [anticipos]);

  const updateAnticipo = useCallback(async (id: string, patch: Partial<Anticipo>) => {
    const updated = anticipos.map(a => a.id === id ? { ...a, ...patch } : a);
    setAnticipos(updated);
    localStorage.setItem(STORAGE_KEY_PREFIX + 'anticipos', JSON.stringify(updated));
    if (isOnline) await supabase.from('anticipos').update(patch).eq('id', id);
  }, [anticipos]);

  // ============================================================
  // 9. CAJAS CHICAS
  // ============================================================
  const [cajasChicas, setCajasChicas] = useState<CajaChica[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_PREFIX + 'cajas_chicas');
    return saved ? JSON.parse(saved) : [];
  });

  const addCajaChica = useCallback(async (c: Omit<CajaChica, 'id'>) => {
    const nuevo: CajaChica = { ...c, id: uid() };
    const updated = [...cajasChicas, nuevo];
    setCajasChicas(updated);
    localStorage.setItem(STORAGE_KEY_PREFIX + 'cajas_chicas', JSON.stringify(updated));
    if (isOnline) await supabase.from('cajas_chicas').insert([nuevo]).maybeSingle();
  }, [cajasChicas]);

  const updateCajaChica = useCallback(async (id: string, patch: Partial<CajaChica>) => {
    const updated = cajasChicas.map(c => c.id === id ? { ...c, ...patch } : c);
    setCajasChicas(updated);
    localStorage.setItem(STORAGE_KEY_PREFIX + 'cajas_chicas', JSON.stringify(updated));
    if (isOnline) await supabase.from('cajas_chicas').update(patch).eq('id', id);
  }, [cajasChicas]);

  // ============================================================
  // 10. PAGOS A PROVEEDORES
  // ============================================================
  const [pagos, setPagos] = useState<PagoProveedor[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_PREFIX + 'pagos');
    return saved ? JSON.parse(saved) : [];
  });

  const addPago = useCallback(async (p: Omit<PagoProveedor, 'id'>) => {
    const nuevo: PagoProveedor = { ...p, id: uid() };
    const updated = [...pagos, nuevo];
    setPagos(updated);
    localStorage.setItem(STORAGE_KEY_PREFIX + 'pagos', JSON.stringify(updated));
    if (isOnline) await supabase.from('pagos_proveedores').insert([nuevo]).maybeSingle();
  }, [pagos]);

  const updatePago = useCallback(async (id: string, patch: Partial<PagoProveedor>) => {
    const updated = pagos.map(p => p.id === id ? { ...p, ...patch } : p);
    setPagos(updated);
    localStorage.setItem(STORAGE_KEY_PREFIX + 'pagos', JSON.stringify(updated));
    if (isOnline) await supabase.from('pagos_proveedores').update(patch).eq('id', id);
  }, [pagos]);

  const pagosVencidos = pagos.filter(p => p.estado === 'pendiente' && new Date(p.fechaVencimiento) < new Date());
  const pagosProximos = pagos.filter(p => p.estado === 'pendiente' && new Date(p.fechaVencimiento) >= new Date());

  // ============================================================
  // 11. CENTROS DE COSTO
  // ============================================================
  const [centrosCosto, setCentrosCosto] = useState<CentroCosto[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_PREFIX + 'centros_costo');
    return saved ? JSON.parse(saved) : [];
  });

  const addCentroCosto = useCallback(async (c: Omit<CentroCosto, 'id'>) => {
    const nuevo: CentroCosto = { ...c, id: uid() };
    const updated = [...centrosCosto, nuevo];
    setCentrosCosto(updated);
    localStorage.setItem(STORAGE_KEY_PREFIX + 'centros_costo', JSON.stringify(updated));
    if (isOnline) await supabase.from('centros_costo').insert([nuevo]).maybeSingle();
  }, [centrosCosto]);

  const updateCentroCosto = useCallback(async (id: string, patch: Partial<CentroCosto>) => {
    const updated = centrosCosto.map(c => c.id === id ? { ...c, ...patch } : c);
    setCentrosCosto(updated);
    localStorage.setItem(STORAGE_KEY_PREFIX + 'centros_costo', JSON.stringify(updated));
    if (isOnline) await supabase.from('centros_costo').update(patch).eq('id', id);
  }, [centrosCosto]);

  // ============================================================
  // 12. LOGS DE AUDITORÍA
  // ============================================================
  const [logs, setLogs] = useState<LogAuditoria[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_PREFIX + 'logs');
    return saved ? JSON.parse(saved) : [];
  });

  const addLog = useCallback(async (l: Omit<LogAuditoria, 'id'>) => {
    const nuevo: LogAuditoria = { ...l, id: uid(), createdAt: new Date().toISOString() };
    const updated = [nuevo, ...logs].slice(0, 500); // Keep max 500 logs
    setLogs(updated);
    localStorage.setItem(STORAGE_KEY_PREFIX + 'logs', JSON.stringify(updated));
    if (isOnline) await supabase.from('logs_sistema').insert([nuevo]).maybeSingle();
  }, [logs]);

  // ============================================================
  // 13. VALIDACIÓN DE PRECIOS EN SUB-RENGLONES
  // ============================================================
  const validarPrecioSubrenglon = useCallback((precio: number, nombre: string): string | null => {
    if (precio < 0) return `⚠️ Precio negativo en ${nombre}`;
    if (precio === 0) return `⚠️ Precio en cero en ${nombre}`;
    if (precio > 10000) return `⚠️ Precio muy alto (Q${precio.toFixed(2)}) en ${nombre}`;
    return null;
  }, []);

  // ============================================================
  // 14. VINCULACIÓN OC CON EXPLOSIÓN DE MATERIALES
  // ============================================================
  const verificarExplosionMateriales = useCallback((
    renglonCodigo: string,
    materialId: string,
    cantidadOC: number,
    cantidadRequerida: number
  ): VinculacionOCExplosion => {
    const excedente = cantidadOC - cantidadRequerida;
    return {
      renglonCodigo,
      materialId,
      cantidadRequerida,
      cantidadOC,
      excedente,
      alerta: excedente > 0
    };
  }, []);

  return {
    // Activos
    activos, addActivo, updateActivo, deleteActivo,
    // Cuadros comparativos
    cuadros, addCuadro, addCotizacion, selectCotizacion,
    // Vales por renglón
    valesRenglon, addValeRenglon, getValesByRenglon,
    // Destajos
    destajos, addDestajo, getDestajosByProyecto,
    // Capturas de rendimiento
    capturasRendimiento, addCapturaRendimiento, deleteCapturaRendimiento,
    // Plantillas de sub-renglones
    plantillas, addPlantilla, getPlantillasByRenglon,
    // Ventas
    ventas, addVenta, updateVenta,
    // Anticipos
    anticipos, addAnticipo, addAmortizacion, updateAnticipo,
    // Cajas chicas
    cajasChicas, addCajaChica, updateCajaChica,
    // Pagos proveedores
    pagos, addPago, updatePago, pagosVencidos, pagosProximos,
    // Centros de costo
    centrosCosto, addCentroCosto, updateCentroCosto,
    // Logs auditoría
    logs, addLog,
    // Validaciones
    validarPrecioSubrenglon,
    // Vinculación OC
    verificarExplosionMateriales
  };
}