import React, { useMemo, useState, useEffect } from 'react';
import { useErp } from '../store';
import { useTranslation } from 'react-i18next';
import {
  Receipt, Search, DollarSign, Users, Wrench, Save, Edit3,
  BarChart3, Table as TableIcon, Settings, RefreshCw, Calculator,
} from 'lucide-react';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';

import { safeLogger } from '@/lib/safeLogger';
import { FactorSobrecosto, DosificacionConcreto, MovimientoTierra, Pavimento, RedInfraestructura, MuroContencion } from '../types';
import { ServicioMotorCalculo } from '../services/motorCalculo';
import { registrarCalculo } from '../services/motorCalculo';
import { ServicioValidacionCalculos, mostrarValidaciones } from '../services/validacionCalculos';
import { useDepartamentos } from '../hooks/useGeographicData';

interface HistoricoPrecio {
  fecha: string;
  cemento: number;
  hierro: number;
  arena: number;
  block: number;
}

interface ResultadoDosificacion {
  cementoSacos: number;
  arenaM3: number;
  piedraM3: number;
  aguaLt: number;
  costoTotal: number;
}

interface AceroParams {
  elemento: 'columna' | 'viga' | 'losa' | 'muro';
  grado: number;
  estribos: 'estribos' | 'espiral' | 'malla';
  volumenM3: number;
}

interface ResultadoAcero {
  desglose: Array<{
    diametro: number;
    cantidadKg: number;
    costoTotal: number;
    precioUnitarioKg: number;
  }>;
  costoTotal: number;
}

interface ParametrosClimaticos {
  departamentoCodigo: string;
  departamento: string;
  zona: string;
  mes: string;
}

interface ResultadoClimaticos {
  factorCurado: number;
  factorRendimiento: number;
  factorProteccion: number;
  factorAjusteEstacional: number;
  observaciones: string;
}

interface ResultadoPavimento {
  costoUnitarioM2: number;
  costoTotal: number;
  factorAjuste: number;
}

interface ResultadoRedInfraestructura {
  costoUnitarioMl: number;
  costoTotal: number;
  factorAjusteMaterial: number;
  referenciaNorma: string;
}

interface ResultadoMuroContencion {
  costoUnitarioM2: number;
  costoTotal: number;
  factorAjusteTotal: number;
  volumenConcretoM3: number;
  referenciaNorma: string;
}

interface ResultadoMovimientoTierra {
  costoUnitarioM3: number;
  costoTotal: number;
  factorAjuste: number;
  tiempoHoras: number;
}

type Tab = 'insumos' | 'rendimientos' | 'sobrecosto' | 'calculo' | 'historico' | 'dosificacion' | 'acero' | 'movimientoTierra' | 'parametrosClimaticos' | 'pavimentos' | 'redesInfraestructura' | 'murosContencion';

const FACTOR_DEFAULT: FactorSobrecosto = {
  indirectos: 12,
  administracion: 5,
  imprevistos: 5,
  utilidad: 10,
};

const APUAvanzado: React.FC = () => {
  const [loading, setLoading] = useState(true);
  useEffect(() => { const t = setTimeout(() => setLoading(false), 400); return () => clearTimeout(t); }, []);
  const { t } = useTranslation();
  const { proyectos, updateProyecto, insumosBase } = useErp();

  const [tab, setTab] = useState<Tab>('insumos');
  const [searchInsumo, setSearchInsumo] = useState('');
  const [searchRend, setSearchRend] = useState('');
  const [proyectoId, setProyectoId] = useState('');
  const [factor, setFactor] = useState<FactorSobrecosto>(FACTOR_DEFAULT);
  const [editFactor, setEditFactor] = useState(false);

  const [dosificacion, setDosificacion] = useState<DosificacionConcreto>({
    resistencia: '3000psi',
    tipo: 'estructura',
    tamañoAgregado: '3/4"',
    aditivos: 'ninguno',
    curado: 'normal',
    cementoSacosM3: 0,
    arenaM3M3: 0,
    piedraM3M3: 0,
    aguaLtM3: 0,
  });
  const [volumen, setVolumen] = useState(1);
  const [departamento, setDepartamento] = useState('');
  const [calculando, setCalculando] = useState(false);
  const [resultadoDosificacion, setResultadoDosificacion] = useState<ResultadoDosificacion | null>(null);
  const departamentos = useDepartamentos();

  const [acero, setAcero] = useState<AceroParams>({ elemento: 'columna', grado: 40, estribos: 'estribos', volumenM3: 1 });
  const [resultadoAcero, setResultadoAcero] = useState<ResultadoAcero | null>(null);
  const [calculandoAcero, setCalculandoAcero] = useState(false);

  const [movimientoTierra, setMovimientoTierra] = useState<MovimientoTierra>({ tipo: 'excavacion', suelo: 'relleno', profundidad: 'menos_1m', acceso: 'retroexcavadora', drenaje: 'seco', volumen: 1 });
  const [resultadoMovimientoTierra, setResultadoMovimientoTierra] = useState<ResultadoMovimientoTierra | null>(null);
  const [calculandoMovimientoTierra, setCalculandoMovimientoTierra] = useState(false);

  const [parametrosClimaticos, setParametrosClimaticos] = useState<ParametrosClimaticos>({ departamentoCodigo: '', departamento: '', zona: '', mes: '' });
  const [resultadoClimaticos, setResultadoClimaticos] = useState<ResultadoClimaticos | null>(null);
  const [calculandoClimaticos, setCalculandoClimaticos] = useState(false);

  const [pavimento, setPavimento] = useState<Pavimento>({ uso: 'peatonal', tipo: 'adoquinado', tipoBase: 'c4', tipoSello: 'arena', areaM2: 100 });
  const [resultadoPavimento, setResultadoPavimento] = useState<ResultadoPavimento | null>(null);
  const [calculandoPavimento, setCalculandoPavimento] = useState(false);

  const [redInfraestructura, setRedInfraestructura] = useState<RedInfraestructura>({ tipo: 'agua_potable', diametroPulgadas: 1.0, material: 'pvc', presion: 'media', longitudMl: 100 });
  const [resultadoRedInfraestructura, setResultadoRedInfraestructura] = useState<ResultadoRedInfraestructura | null>(null);
  const [calculandoRedInfraestructura, setCalculandoRedInfraestructura] = useState(false);

  const [muroContencion, setMuroContencion] = useState<MuroContencion>({ alturaM: 2.0, tipo: 'gravedad', tipoCimentacion: 'zapata_corrida', tipoSuelo: 'arena', tipoDrenaje: 'sin_drenaje', longitudM: 10 });
  const [resultadoMuroContencion, setResultadoMuroContencion] = useState<ResultadoMuroContencion | null>(null);
  const [calculandoMuroContencion, setCalculandoMuroContencion] = useState(false);

  const rubros = useMemo(() => {
    const insumos = insumosBase || [];
    return [...new Set(insumos.map(i => i.rubro))];
  }, [insumosBase]);
  const [rubroFilter, setRubroFilter] = useState('');

  const filteredInsumos = useMemo(() => {
    const insumos = insumosBase || [];
    let f = insumos;
    if (searchInsumo) {
      const q = searchInsumo.toLowerCase();
      f = f.filter(i => i.nombre.toLowerCase().includes(q));
    }
    if (rubroFilter) f = f.filter(i => i.rubro === rubroFilter);
    return f;
  }, [insumosBase, searchInsumo, rubroFilter]);

  const filteredRendimientos = useMemo(() => {
    const q = (searchRend || '').toLowerCase();
    if (!q) return [];
    return [];
  }, [searchRend]);

  const proyecto = proyectos.find(p => p.id === proyectoId);

  const calculos = useMemo(() => {
    const cd = { materiales: 950, manoObra: 280, equipo: 60 };
    const costoDirecto = cd.materiales + cd.manoObra + cd.equipo;
    const f = proyecto?.factorSobrecosto || factor;
    const pctTotal = f.indirectos + f.administracion + f.imprevistos + f.utilidad;
    const factorMultiplicador = 1 + (pctTotal / 100);
    const precioVenta = costoDirecto * factorMultiplicador;
    return { cd, costoDirecto, f, pctTotal, factorMultiplicador, precioVenta };
  }, [proyecto, factor]);

  const handleSaveFactor = () => {
    if (proyectoId) {
      updateProyecto(proyectoId, { factorSobrecosto: factor });
      toast.success(t('apu.factor_actualizado_proyecto'));
    } else {
      toast.success(t('apu.factor_guardado_sin_proyecto'));
    }
    setEditFactor(false);
  };

  const handleCalcularDosificacion = async () => {
    setCalculando(true);
    try {
      const resultado = await ServicioMotorCalculo.calcularDosificacion(dosificacion, volumen, departamento || undefined);
      setResultadoDosificacion(resultado);
      toast.success(t('apu.dosificacion_exito'));
    } catch (error) {
      toast.error(t('apu.error_calculo_dosificacion'));
      safeLogger.error(error);
    } finally {
      setCalculando(false);
    }
  };

  const handleCalcularAcero = async () => {
    setCalculandoAcero(true);
    try {
      const resultado = await ServicioMotorCalculo.calcularDesgloseAcero?.(acero) || { error: 'Función no implementada' };
      setResultadoAcero(resultado);
      toast.success(t('apu.acero_exito'));
    } catch (error) {
      toast.error(t('apu.error_calculo_acero'));
      safeLogger.error(error);
    } finally {
      setCalculandoAcero(false);
    }
  };

  const handleCalcularMovimientoTierra = async () => {
    setCalculandoMovimientoTierra(true);
    try {
      const resultado = await ServicioMotorCalculo.calcularMovimientoTierra(movimientoTierra);
      setResultadoMovimientoTierra(resultado);
      toast.success(t('apu.movimiento_tierra_exito'));
    } catch (error) {
      toast.error(t('apu.error_calculo_movimiento_tierra'));
      safeLogger.error(error);
    } finally {
      setCalculandoMovimientoTierra(false);
    }
  };

  const handleCalcularParametrosClimaticos = async () => {
    setCalculandoClimaticos(true);
    try {
      const resultado = await ServicioMotorCalculo.obtenerFactorClimatico(parametrosClimaticos.departamentoCodigo || undefined);
      setResultadoClimaticos(resultado);
      toast.success(t('apu.climaticos_exito'));
    } catch (error) {
      toast.error(t('apu.error_calculo_climaticos'));
      safeLogger.error(error);
    } finally {
      setCalculandoClimaticos(false);
    }
  };

  const handleCalcularPavimento = async () => {
    setCalculandoPavimento(true);
    try {
      const resultado = await ServicioMotorCalculo.calcularPavimento(pavimento);
      const validaciones = await ServicioValidacionCalculos.validarPavimento(pavimento, resultado);
      const esValido = await mostrarValidaciones(validaciones);
      if (!esValido) toast.warning(t('apu.error_validacion_calculo'));
      setResultadoPavimento(resultado);
      toast.success(t('apu.pavimento_exito'));
      try {
        await registrarCalculo(proyectoId || proyectos[0]?.id || '', 'pavimento', pavimento, resultado, 'Cálculo manual de pavimento');
      } catch (err) { /* ignore */ }
    } catch (error) {
      toast.error(t('apu.error_calculo_pavimento'));
      safeLogger.error(error);
    } finally {
      setCalculandoPavimento(false);
    }
  };

  const handleCalcularRedInfraestructura = async () => {
    setCalculandoRedInfraestructura(true);
    try {
      const resultado = await ServicioMotorCalculo.calcularRedInfraestructura(redInfraestructura);
      const validaciones = await ServicioValidacionCalculos.validarRedInfraestructura(redInfraestructura, resultado);
      const esValido = mostrarValidaciones(validaciones);
      if (!esValido) toast.warning(t('apu.error_validacion_calculo'));
      setResultadoRedInfraestructura(resultado);
      toast.success(t('apu.red_infraestructura_exito'));
      try {
        await registrarCalculo(proyectoId || proyectos[0]?.id || '', 'red_infraestructura', redInfraestructura, resultado, 'Cálculo manual de red de infraestructura');
      } catch (err) { /* ignore */ }
    } catch (error) {
      toast.error(t('apu.error_calculo_red_infraestructura'));
      safeLogger.error(error);
    } finally {
      setCalculandoRedInfraestructura(false);
    }
  };

  const handleCalcularMuroContencion = async () => {
    setCalculandoMuroContencion(true);
    try {
      const resultado = await ServicioMotorCalculo.calcularMuroContencion(muroContencion);
      const validaciones = await ServicioValidacionCalculos.validarMuroContencion(muroContencion, resultado);
      const esValido = mostrarValidaciones(validaciones);
      if (!esValido) toast.warning(t('apu.error_validacion_calculo'));
      setResultadoMuroContencion(resultado);
      toast.success(t('apu.muro_contencion_exito'));
      try {
        await registrarCalculo(proyectoId || proyectos[0]?.id || '', 'muro_contencion', muroContencion, resultado, 'Cálculo manual de muro de contención');
      } catch (err) { /* ignore */ }
    } catch (error) {
      toast.error(t('apu.error_calculo_muro_contencion'));
      safeLogger.error(error);
    } finally {
      setCalculandoMuroContencion(false);
    }
  };

  const historial = useMemo((): HistoricoPrecio[] => {
    const base = insumosBase || [];
    if (base.length === 0) return [];
    const fechasUnicas = [...new Set(base.map(i => i.fechaActualizacion).filter(Boolean))] as string[];
    if (fechasUnicas.length === 0) return [];
    return fechasUnicas.slice(-5).map(fecha => {
      const insumosFecha = base.filter(i => i.fechaActualizacion === fecha);
      const cemento = insumosFecha.find(i => i.nombre.toLowerCase().includes('cemento'))?.precioReferencia || 0;
      const hierro = insumosFecha.find(i => i.nombre.toLowerCase().includes('hierro') || i.nombre.toLowerCase().includes('varilla'))?.precioReferencia || 0;
      const arena = insumosFecha.find(i => i.nombre.toLowerCase().includes('arena'))?.precioReferencia || 0;
      const block = insumosFecha.find(i => i.nombre.toLowerCase().includes('block'))?.precioReferencia || 0;
      return { fecha: fecha.slice(0, 7), cemento: cemento || 0, hierro: hierro || 0, arena: arena || 0, block: block || 0 };
    });
  }, [insumosBase]);

  const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'insumos', label: t('apu.insumos_base'), icon: TableIcon },
    { id: 'rendimientos', label: t('apu.rendimientos'), icon: Users },
    { id: 'sobrecosto', label: t('apu.sobrecosto'), icon: Settings },
    { id: 'dosificacion', label: t('apu.dosificacion_concreto'), icon: Calculator },
    { id: 'acero', label: t('apu.desglose_acero'), icon: Wrench },
    { id: 'movimientoTierra', label: t('apu.movimiento_tierra'), icon: Wrench },
    { id: 'parametrosClimaticos', label: t('apu.parametros_climaticos'), icon: Calculator },
    { id: 'pavimentos', label: t('apu.pavimentos'), icon: Calculator },
    { id: 'redesInfraestructura', label: t('apu.redes_infraestructura'), icon: Calculator },
    { id: 'murosContencion', label: t('apu.muros_contencion'), icon: Calculator },
    { id: 'calculo', label: t('apu.calculo_apu'), icon: DollarSign },
    { id: 'historico', label: t('apu.historico_precios'), icon: BarChart3 },
  ];

  if (loading) {
    return (
      <div className="p-4 sm:p-6 max-w-[1600px] mx-auto space-y-4">
        <Skeleton className="h-8 w-64 rounded-lg" />
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-[1600px] mx-auto">
      <>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <h1 className="text-2xl font-black text-foreground flex items-center gap-2">
          <Receipt className="w-6 h-6 text-primary" /> {t('apu.apu_avanzado')}
        </h1>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <RefreshCw className="w-3 h-3" /> {t('apu.precios_referencia')}
        </div>
      </div>

      <div className="flex flex-wrap gap-1 mb-4 bg-muted rounded-xl p-1 shadow-sm border border-border">
        {TABS.map(tab => {
          const Icon = tab.icon;
          return (
            <button key={tab.id} onClick={() => setTab(tab.id)} aria-label={t('apu.ver_pestana', { tab: tab.label })} className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${tab === tab.id ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-background'}`}>
              <Icon className="w-3.5 h-3.5" /> {tab.label}
            </button>
          );
        })}
      </div>

      <div className="bg-card text-card-foreground rounded-2xl shadow-sm border border-border p-4 sm:p-5">
        {tab === 'insumos' && (
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
              <h2 className="font-bold text-foreground text-sm truncate" title={t('apu.catalogo_insumos_base')}>{t('apu.catalogo_insumos_base')}</h2>
              <div className="flex flex-wrap gap-2">
                <select value={rubroFilter} onChange={e => setRubroFilter(e.target.value)} className="text-xs px-2 py-1.5 rounded-lg border border-input outline-none bg-background text-foreground">
                  <option value="">{t('apu.todos_rubros')}</option>
                  {rubros.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
                <div className="relative">
                  <Search className="absolute left-2 top-1.5 w-3.5 h-3.5 text-muted-foreground" />
                  <input value={searchInsumo} onChange={e => setSearchInsumo(e.target.value)} placeholder={t('apu.buscar_insumo')} className="pl-7 pr-3 py-1.5 text-xs rounded-lg border border-input outline-none focus:border-ring bg-background text-foreground w-full sm:w-44" />
                </div>
              </div>
            </div>
            {filteredInsumos.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground"><p>{t('apu.sin_insumos')}</p></div>
            ) : (
            <><div className="text-xs text-muted-foreground mb-2">{t('apu.insumos_count', { count: filteredInsumos.length })}</div>
            <div className="overflow-x-auto">
              <table role="table" className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th scope="col" className="text-left py-2 px-2 font-medium text-muted-foreground">{t('apu.insumo')}</th>
                    <th scope="col" className="text-left py-2 px-2 font-medium text-muted-foreground">{t('apu.categoria')}</th>
                    <th scope="col" className="text-left py-2 px-2 font-medium text-muted-foreground">{t('apu.unidad')}</th>
                    <th scope="col" className="text-right py-2 px-2 font-medium text-muted-foreground">{t('apu.precio_ref')}</th>
                    <th scope="col" className="text-left py-2 px-2 font-medium text-muted-foreground">{t('apu.rubro')}</th>
                    <th scope="col" className="text-left py-2 px-2 font-medium text-muted-foreground">{t('apu.ult_actualizacion')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInsumos.map(ins => (
                    <tr key={ins.id} className="border-b border-border hover:bg-muted">
                      <td className="py-2 px-2 font-medium text-foreground">{ins.nombre}</td>
                      <td className="py-2 px-2">
                        <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${ins.categoria === 'material' ? 'bg-info/10 text-info' : ins.categoria === 'mano_obra' ? 'bg-success/10 text-success' : ins.categoria === 'equipo' ? 'bg-accent/10 text-accent' : 'bg-warning/10 text-warning'}`}>
                          {ins.categoria}
                        </span>
                      </td>
                      <td className="py-2 px-2 text-muted-foreground">{ins.unidad}</td>
                      <td className="py-2 px-2 text-right font-semibold text-foreground">Q{ins.precioReferencia.toFixed(2)}</td>
                      <td className="py-2 px-2 text-muted-foreground">{ins.rubro}</td>
                      <td className="py-2 px-2 text-muted-foreground">{ins.fechaActualizacion}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div></>
            )}
          </div>
        )}

        {tab === 'rendimientos' && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold text-muted-foreground text-sm truncate" title={t('apu.rendimientos_cuadrilla')}>{t('apu.rendimientos_cuadrilla')}</h2>
              <div className="relative">
                <Search className="absolute left-2 top-1.5 w-3.5 h-3.5 text-muted-foreground" />
                <input value={searchRend} onChange={e => setSearchRend(e.target.value)} placeholder={t('apu.buscar_actividad')} className="pl-7 pr-3 py-1.5 text-xs rounded-lg border border-border outline-none focus:border-orange-400 w-full sm:w-44" />
              </div>
            </div>
            {filteredRendimientos.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground"><p>{t('apu.sin_rendimientos')}</p></div>
            ) : (
            <div className="overflow-x-auto">
              <table role="table" className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th scope="col" className="text-left py-2 px-2 font-medium text-muted-foreground">{t('apu.actividad')}</th>
                    <th scope="col" className="text-left py-2 px-2 font-medium text-muted-foreground">{t('apu.cuadrilla')}</th>
                    <th scope="col" className="text-right py-2 px-2 font-medium text-muted-foreground">{t('apu.rendimiento')}</th>
                    <th scope="col" className="text-left py-2 px-2 font-medium text-muted-foreground">{t('apu.unidad')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRendimientos.map(r => (
                    <tr key={r.id} className="border-b border-border hover:bg-accent">
                      <td className="py-2 px-2 font-medium text-muted-foreground">{r.actividad}</td>
                      <td className="py-2 px-2 text-muted-foreground">{r.cuadrilla}</td>
                      <td className="py-2 px-2 text-right font-semibold text-muted-foreground">{r.rendimientoDiario}</td>
                      <td className="py-2 px-2 text-muted-foreground">{r.unidad}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            )}
          </div>
        )}

        {tab === 'sobrecosto' && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold text-muted-foreground text-sm">{t('apu.factor_sobrecosto')}</h2>
              <button onClick={() => setEditFactor(!editFactor)} aria-label={editFactor ? t('apu.cancelar_edicion_factor') : t('apu.editar_factor_sobrecosto')} className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-muted text-muted-foreground hover:bg-muted transition-colors">
                <Edit3 className="w-3 h-3" /> {editFactor ? t('apu.cancelar') : t('apu.editar')}
              </button>
            </div>
            <div className="mb-4">
              <label className="text-xs text-muted-foreground mb-1 block font-medium">{t('apu.aplicar_proyecto')}</label>
              <select value={proyectoId} onChange={e => { setProyectoId(e.target.value); const p = proyectos.find(pr => pr.id === e.target.value); if (p?.factorSobrecosto) setFactor(p.factorSobrecosto); }} className="w-full max-w-xs px-3 py-2 text-sm rounded-lg border border-border outline-none focus:border-orange-400">
<option value="">{t('apu.sin_proyecto')}</option>
                {proyectos.map(p => (<option key={p.id} value={p.id}>{p.nombre}{p.factorSobrecosto ? ' ✓' : ''}</option>))}
              </select>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
              {([{ key: 'indirectos' as const, label: t('apu.indirectos'), desc: t('apu.indirectos_desc') }, { key: 'administracion' as const, label: t('apu.administracion'), desc: t('apu.administracion_desc') }, { key: 'imprevistos' as const, label: t('apu.imprevistos'), desc: t('apu.imprevistos_desc') }, { key: 'utilidad' as const, label: t('apu.utilidad'), desc: t('apu.utilidad_desc') }]).map(item => (
                <div key={item.key} className="bg-muted/30 rounded-xl p-3 border border-border">
                  <div className="text-xs text-muted-foreground mb-1">{item.label}</div>
                  <div className="text-xs text-slate-300 dark:text-slate-400 mb-1">{item.desc}</div>
                  {editFactor ? (
                    <input type="number" inputMode="decimal" value={factor[item.key]} onChange={e => setFactor(f => ({ ...f, [item.key]: Math.max(0, +e.target.value) }))} min={0} max={100} className="w-full px-2 py-1 text-sm font-bold text-right rounded border border-border outline-none focus:border-orange-400" />
                  ) : (<div className="text-lg font-bold text-foreground">{factor[item.key]}%</div>)}
                </div>
              ))}
            </div>
            <div className="bg-orange-50 dark:bg-orange-950/20 border border-orange-100 dark:border-orange-900/50 rounded-xl p-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div><span className="text-xs text-orange-600 font-medium">{t('apu.total_sobrecosto')}:</span><span className="text-xl font-bold text-orange-700 ml-2">{factor.indirectos + factor.administracion + factor.imprevistos + factor.utilidad}%</span></div>
                <div><span className="text-xs text-orange-600 font-medium">{t('apu.factor_multiplicador')}:</span><span className="text-xl font-bold text-orange-700 ml-2">{((factor.indirectos + factor.administracion + factor.imprevistos + factor.utilidad) / 100 + 1).toFixed(2)}</span></div>
                {editFactor && (<button onClick={handleSaveFactor} aria-label={t('apu.guardar_factor_sobrecosto')} className="flex items-center gap-1 text-xs px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-medium"><Save className="w-3 h-3" /> {t('apu.guardar')}</button>)}
              </div>
            </div>
          </div>
        )}

        {tab === 'dosificacion' && (
          <div>
<h2 className="font-bold text-muted-foreground text-sm mb-3 truncate" title={t('apu.dosificacion_titulo')}>{t('apu.dosificacion_titulo')}</h2>
<p className="text-xs text-muted-foreground mb-4 truncate" title={t('apu.dosificacion_descripcion')}>{t('apu.dosificacion_descripcion')}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mb-4">
              <div><label className="text-xs text-muted-foreground mb-1 block">{t('apu.resistencia')}</label><select value={dosificacion.resistencia} onChange={e => setDosificacion(d => ({ ...d, resistencia: e.target.value }))} className="w-full text-xs px-3 py-2 rounded-lg border border-border outline-none focus:border-orange-400 bg-card"><option value="2000psi">2000 psi</option><option value="2500psi">2500 psi</option><option value="3000psi">3000 psi</option><option value="3500psi">3500 psi</option><option value="4000psi">4000 psi</option><option value="4500psi">4500 psi</option><option value="5000psi">5000 psi</option></select></div>
              <div><label className="text-xs text-muted-foreground mb-1 block">{t('apu.tipo_elemento')}</label><select value={dosificacion.tipo} onChange={e => setDosificacion(d => ({ ...d, tipo: e.target.value }))} className="w-full text-xs px-3 py-2 rounded-lg border border-border outline-none focus:border-orange-400 bg-card"><option value="cimentacion">{t('apu.dosif_cimentacion')}</option><option value="estructura">{t('apu.dosif_estructura')}</option><option value="losa">{t('apu.dosif_losa')}</option><option value="pavimento">{t('apu.dosif_pavimento')}</option><option value="muro">{t('apu.dosif_muro')}</option></select></div>
              <div><label className="text-xs text-muted-foreground mb-1 block">{t('apu.tamano_agregado')}</label><select value={dosificacion.tamañoAgregado} onChange={e => setDosificacion(d => ({ ...d, tamañoAgregado: e.target.value }))} className="w-full text-xs px-3 py-2 rounded-lg border border-border outline-none focus:border-orange-400 bg-card"><option value="3/4">3/4&quot;</option><option value="1">1&quot;</option><option value="1.5">1.5&quot;</option><option value="2">2&quot;</option></select></div>
              <div><label className="text-xs text-muted-foreground mb-1 block">{t('apu.aditivos')}</label><select value={dosificacion.aditivos} onChange={e => setDosificacion(d => ({ ...d, aditivos: e.target.value }))} className="w-full text-xs px-3 py-2 rounded-lg border border-border outline-none focus:border-orange-400 bg-card"><option value="ninguno">{t('apu.aditivo_ninguno')}</option><option value="acelerador">{t('apu.aditivo_acelerador')}</option><option value="retardador">{t('apu.aditivo_retardador')}</option><option value="plastificante">{t('apu.aditivo_plastificante')}</option><option value="impermeabilizante">{t('apu.aditivo_impermeabilizante')}</option></select></div>
              <div><label className="text-xs text-muted-foreground mb-1 block">{t('apu.tipo_curado')}</label><select value={dosificacion.curado} onChange={e => setDosificacion(d => ({ ...d, curado: e.target.value }))} className="w-full text-xs px-3 py-2 rounded-lg border border-border outline-none focus:border-orange-400 bg-card"><option value="normal">{t('apu.curado_normal')}</option><option value="acelerado">{t('apu.curado_acelerado')}</option><option value="prolongado">{t('apu.curado_prolongado')}</option></select></div>
              <div><label className="text-xs text-muted-foreground mb-1 block">{t('apu.volumen_m3')}</label><input type="number" inputMode="decimal" value={volumen} onChange={e => setVolumen(Math.max(0.1, parseFloat(e.target.value) || 1))} min={0.1} step={0.1} className="w-full text-xs px-3 py-2 rounded-lg border border-border outline-none focus:border-orange-400 bg-card" /></div>
              <div><label className="text-xs text-muted-foreground mb-1 block">{t('apu.departamento_opcional')}</label><select value={departamento} onChange={e => setDepartamento(e.target.value)} className="w-full text-xs px-3 py-2 rounded-lg border border-border outline-none focus:border-orange-400 bg-card"><option value="">{t('apu.sin_ajuste_regional')}</option>{departamentos.map(dep => (<option key={dep.codigo} value={dep.codigo}>{dep.nombre}</option>))}</select></div>
              <div className="sm:col-span-2 md:col-span-3">
                <button onClick={handleCalcularDosificacion} disabled={calculando} aria-label={calculando ? t('apu.calculando_dosificacion') : t('apu.calcular_dosificacion')} className="w-full flex items-center justify-center gap-2 text-xs px-4 py-3 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed">
                  <Calculator className="w-4 h-4" />{calculando ? t('apu.calculando') : t('apu.calcular_dosificacion')}
                </button>
              </div>
            </div>
            {resultadoDosificacion && resultadoDosificacion.cementoSacos !== undefined && (
              <div className="mt-4 space-y-3">
                <div className="bg-muted/30 rounded-xl p-4 border border-border">
                  <h3 className="font-bold text-muted-foreground text-xs mb-3 truncate" title={t('apu.cantidades_calculadas')}>{t('apu.cantidades_calculadas')}</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-3 border border-blue-100 dark:border-blue-900/50"><div className="text-xs text-blue-600 mb-1">{t('apu.cemento')}</div><div className="text-lg font-bold text-blue-700">{resultadoDosificacion.cementoSacos.toFixed(1)} sacos</div></div>
                    <div className="bg-amber-50 dark:bg-amber-950/20 rounded-lg p-3 border border-amber-100 dark:border-amber-900/50"><div className="text-xs text-amber-600 mb-1">{t('apu.arena')}</div><div className="text-lg font-bold text-amber-700">{resultadoDosificacion.arenaM3.toFixed(2)} m³</div></div>
                    <div className="bg-stone-50 dark:bg-stone-800/50 rounded-lg p-3 border border-stone-100 dark:border-stone-700"><div className="text-xs text-stone-600 dark:text-stone-400 mb-1">{t('apu.piedra')}</div><div className="text-lg font-bold text-stone-700 dark:text-stone-300">{resultadoDosificacion.piedraM3.toFixed(2)} m³</div></div>
                    <div className="bg-cyan-50 dark:bg-cyan-950/20 rounded-lg p-3 border border-cyan-100 dark:border-cyan-900/50"><div className="text-xs text-cyan-600 mb-1">{t('apu.agua')}</div><div className="text-lg font-bold text-cyan-700">{resultadoDosificacion.aguaLt.toFixed(0)} lt</div></div>
                  </div>
                </div>
                <div className="bg-gradient-to-r from-primary to-warning rounded-xl p-4 shadow-sm">
                  <div className="flex items-center justify-between"><div><span className="text-xs text-white/80">{t('apu.costo_total')}</span><div className="text-2xl font-bold text-white">Q{resultadoDosificacion.costoTotal.toFixed(2)}</div></div><div className="text-right"><span className="text-xs text-white/80">{t('apu.factor_ajuste')}</span><div className="text-lg font-bold text-white">{resultadoDosificacion.factorAjuste.toFixed(2)}</div></div></div>
                </div>
                <div className="bg-muted/30 rounded-xl p-3 border border-border">
                  <h3 className="font-bold text-muted-foreground text-xs mb-2">{t('apu.desglose_costos')}</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                    <div className="flex justify-between"><span className="text-muted-foreground">{t('apu.cemento_label')}</span><span className="font-medium text-muted-foreground">Q{resultadoDosificacion.desgloseCostos.cemento.toFixed(2)}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">{t('apu.arena_label')}</span><span className="font-medium text-muted-foreground">Q{resultadoDosificacion.desgloseCostos.arena.toFixed(2)}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">{t('apu.piedra_label')}</span><span className="font-medium text-muted-foreground">Q{resultadoDosificacion.desgloseCostos.piedra.toFixed(2)}</span></div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {tab === 'calculo' && (
          <div>
<h2 className="font-bold text-muted-foreground text-sm mb-3 truncate" title={t('apu.calculo_automatico')}>{t('apu.calculo_automatico')}</h2>
<p className="text-xs text-muted-foreground mb-4 truncate" title={t('apu.ejemplo_renglon')}>{t('apu.ejemplo_renglon')}</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
              <div className="bg-blue-50 dark:bg-blue-950/20 rounded-xl p-4 border border-blue-100 dark:border-blue-900/50"><div className="flex items-center gap-1.5 mb-1"><Wrench className="w-3.5 h-3.5 text-blue-500" /><span className="text-xs font-medium text-blue-600">{t('apu.materiales_label')}</span></div><div className="text-xl font-bold text-blue-700">Q{calculos.cd.materiales.toFixed(2)}</div></div>
              <div className="bg-emerald-50 dark:bg-emerald-950/20 rounded-xl p-4 border border-emerald-100 dark:border-emerald-900/50"><div className="flex items-center gap-1.5 mb-1"><Users className="w-3.5 h-3.5 text-emerald-500" /><span className="text-xs font-medium text-emerald-600">{t('apu.mano_obra_label')}</span></div><div className="text-xl font-bold text-emerald-700">Q{calculos.cd.manoObra.toFixed(2)}</div></div>
              <div className="bg-purple-50 dark:bg-purple-950/20 rounded-xl p-4 border border-purple-100 dark:border-purple-900/50"><div className="flex items-center gap-1.5 mb-1"><Settings className="w-3.5 h-3.5 text-purple-500" /><span className="text-xs font-medium text-blue-600">{t('apu.equipo_label')}</span></div><div className="text-xl font-bold text-purple-700">Q{calculos.cd.equipo.toFixed(2)}</div></div>
            </div>
            <div className="bg-slate-900 rounded-xl p-4 mb-4">
              <div className="flex items-center justify-between">
                <div><span className="text-xs text-muted-foreground">{t('apu.costo_directo')}</span><div className="text-xl font-bold text-white">Q{calculos.costoDirecto.toFixed(2)}</div></div>
                <div className="text-right"><span className="text-xs text-muted-foreground">{t('apu.sobrecosto')}</span><div className="text-lg font-bold text-orange-400">{calculos.pctTotal}%</div></div>
              </div>
            </div>
            <div className="bg-gradient-to-r from-primary to-warning rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div><span className="text-xs text-white/80">{t('apu.precio_venta')}</span><div className="text-2xl font-bold text-white">Q{calculos.precioVenta.toFixed(2)}</div><span className="text-xs text-white/60">{t('apu.por_unidad_obra')}</span></div>
                <div className="text-right"><span className="text-xs text-white/80">{t('apu.factor_multiplicador_label')}</span><div className="text-lg font-bold text-white">{calculos.factorMultiplicador.toFixed(2)}</div></div>
              </div>
            </div>
            <div className="mt-4 bg-muted/30 rounded-xl p-3 text-xs text-muted-foreground font-mono">
              <div className="font-semibold text-muted-foreground mb-1">{t('apu.formula')}</div>
              <div>CD = Materiales + MO + Equipo = Q{calculos.cd.materiales.toFixed(2)} + Q{calculos.cd.manoObra.toFixed(2)} + Q{calculos.cd.equipo.toFixed(2)} = Q{calculos.costoDirecto.toFixed(2)}</div>
              <div>PV = CD × (1 + (Indirectos + Admin + Imprevistos + Utilidad) / 100)</div>
              <div>PV = Q{calculos.costoDirecto.toFixed(2)} × (1 + {calculos.pctTotal} / 100) = Q{calculos.precioVenta.toFixed(2)}</div>
            </div>
          </div>
        )}

        {tab === 'historico' && (
          <div>
<h2 className="font-bold text-muted-foreground text-sm mb-3 truncate" title={t('apu.historico_titulo')}>{t('apu.historico_titulo')}</h2>
<p className="text-xs text-muted-foreground mb-4 truncate" title={t('apu.historico_descripcion')}>{t('apu.historico_descripcion')}</p>
            {historial.length > 0 ? (<>
              <div className="relative h-40 mb-4 bg-muted/30 rounded-xl p-3 border border-border">
                <div className="flex items-end gap-1 h-full">{historial.map((h: HistoricoPrecio, i: number) => { const maxVal = Math.max(...historial.map(x => x.cemento)); const hPct = (h.cemento / (maxVal || 1)) * 100; return (<div key={i} className="flex-1 flex flex-col items-center gap-1"><span className="text-[10px] text-muted-foreground font-medium">{h.cemento}</span><div className="w-full bg-orange-400 dark:bg-orange-500 rounded-t transition-all" style={{ height: `${Math.max(0, hPct)}%`, minHeight: 8 }} /><span className="text-[8px] text-muted-foreground">{h.fecha.slice(2)}</span></div>); })}</div>
                <div className="absolute top-2 left-3 text-xs text-muted-foreground">{t('apu.cemento_ugc_label')}</div>
              </div>
              <div className="overflow-x-auto">
                <table role="table" className="w-full text-xs">
                  <thead><tr className="border-b border-border text-muted-foreground"><th scope="col" className="text-left py-2 px-2 font-medium text-muted-foreground">{t('apu.fecha_header')}</th><th scope="col" className="text-right py-2 px-2 font-medium text-muted-foreground">{t('apu.cemento_header')}</th><th scope="col" className="text-right py-2 px-2 font-medium text-muted-foreground">{t('apu.hierro_header')}</th><th scope="col" className="text-right py-2 px-2 font-medium text-muted-foreground">{t('apu.arena_header')}</th><th scope="col" className="text-right py-2 px-2 font-medium text-muted-foreground">{t('apu.block_header')}</th></tr></thead>
                  <tbody>{historial.map((h: HistoricoPrecio, i: number) => (<tr key={i} className="border-b border-slate-50 dark:border-slate-800 hover:bg-accent"><td className="py-2 px-2 font-medium text-muted-foreground">{h.fecha}</td><td className="py-2 px-2 text-right">Q{h.cemento}</td><td className="py-2 px-2 text-right">Q{h.hierro}</td><td className="py-2 px-2 text-right">Q{h.arena}</td><td className="py-2 px-2 text-right">Q{h.block}</td></tr>))}</tbody>
                </table>
              </div>
              <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div className="bg-muted/30 rounded-xl p-3 border border-border"><div className="text-xs text-muted-foreground">{t('apu.cemento_resumen')}</div><div className="text-sm font-bold text-orange-600">Q{historial[historial.length - 1].cemento.toFixed(0)}<span className="text-xs ml-1 text-red-500">↑ {(((historial[historial.length - 1].cemento - historial[0].cemento) / (historial[0].cemento || 1)) * 100).toFixed(1)}%</span></div></div>
                <div className="bg-muted/30 rounded-xl p-3 border border-border"><div className="text-xs text-muted-foreground">{t('apu.hierro_resumen')}</div><div className="text-sm font-bold text-blue-600">Q{historial[historial.length - 1].hierro.toFixed(0)}<span className="text-xs ml-1 text-red-500">↑ {(((historial[historial.length - 1].hierro - historial[0].hierro) / (historial[0].hierro || 1)) * 100).toFixed(1)}%</span></div></div>
                <div className="bg-muted/30 rounded-xl p-3 border border-border"><div className="text-xs text-muted-foreground">{t('apu.arena_resumen')}</div><div className="text-sm font-bold text-emerald-600">Q{historial[historial.length - 1].arena.toFixed(0)}<span className="text-xs ml-1 text-red-500">↑ {(((historial[historial.length - 1].arena - historial[0].arena) / (historial[0].arena || 1)) * 100).toFixed(1)}%</span></div></div>
                <div className="bg-muted/30 rounded-xl p-3 border border-border"><div className="text-xs text-muted-foreground">{t('apu.block_resumen')}</div><div className="text-sm font-bold text-blue-600">Q{historial[historial.length - 1].block.toFixed(0)}<span className="text-xs ml-1 text-red-500">↑ {(((historial[historial.length - 1].block - historial[0].block) / (historial[0].block || 1)) * 100).toFixed(1)}%</span></div></div>
              </div>
            </>) : (<div className="text-center py-8 text-muted-foreground text-sm">{t('apu.sin_historico')}</div>)}
          </div>
        )}

        {tab === 'acero' && (
          <div>
            <h2 className="font-bold text-muted-foreground text-sm mb-3 truncate" title={t('apu.acero_titulo')}>{t('apu.acero_titulo')}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mb-4">
              <div><label className="text-xs text-muted-foreground mb-1 block">{t('apu.elemento_acero')}</label><select value={acero.elemento} onChange={e => setAcero((d: AceroParams) => ({ ...d, elemento: e.target.value as AceroParams['elemento'] }))} className="w-full text-xs px-3 py-2 rounded-lg border border-border outline-none focus:border-orange-400 bg-card"><option value="columna">{t('apu.acero_elem_columna')}</option><option value="viga">{t('apu.acero_elem_viga')}</option><option value="losa">{t('apu.acero_elem_losa')}</option><option value="muro">{t('apu.acero_elem_muro')}</option></select></div>
              <div><label className="text-xs text-muted-foreground mb-1 block">{t('apu.grado_acero')}</label><select value={acero.grado} onChange={e => setAcero((d: AceroParams) => ({ ...d, grado: parseInt(e.target.value) }))} className="w-full text-xs px-3 py-2 rounded-lg border border-border outline-none focus:border-orange-400 bg-card"><option value="40">{t('apu.grado_40')}</option><option value="60">{t('apu.grado_60')}</option></select></div>
              <div><label className="text-xs text-muted-foreground mb-1 block">{t('apu.estribos')}</label><select value={acero.estribos} onChange={e => setAcero((d: AceroParams) => ({ ...d, estribos: e.target.value as AceroParams['estribos'] }))} className="w-full text-xs px-3 py-2 rounded-lg border border-border outline-none focus:border-orange-400 bg-card"><option value="estribos">{t('apu.estribo_estribos')}</option><option value="espiral">{t('apu.estribo_espiral')}</option><option value="malla">{t('apu.estribo_malla')}</option></select></div>
              <div><label className="text-xs text-muted-foreground mb-1 block">{t('apu.volumen_m3_acero')}</label><input type="number" inputMode="decimal" value={acero.volumenM3} onChange={e => setAcero((d: AceroParams) => ({ ...d, volumenM3: Math.max(0.1, parseFloat(e.target.value) || 1) }))} min={0.1} step={0.1} className="w-full text-xs px-3 py-2 rounded-lg border border-border outline-none focus:border-orange-400 bg-card" /></div>
              <div className="sm:col-span-2 md:col-span-3">
                <button onClick={handleCalcularAcero} disabled={calculandoAcero} aria-label={calculandoAcero ? t('apu.calculando_acero') : t('apu.calcular_acero_aria')} className="w-full flex items-center justify-center gap-2 text-xs px-4 py-3 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"><Calculator className="w-4 h-4" />{calculandoAcero ? t('apu.calculando') : t('apu.calcular_acero')}</button>
              </div>
            </div>
            {resultadoAcero && (
              <div className="mt-4 space-y-3">
                <div className="bg-muted/30 rounded-xl p-4 border border-border"><h3 className="font-bold text-muted-foreground text-xs mb-3">{t('apu.desglose_diametro')}</h3><div className="space-y-2">{(resultadoAcero?.desglose || []).map((item, index: number) => (<div key={index} className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-3 border border-blue-100 dark:border-blue-900/50"><div className="flex items-center justify-between"><span className="text-xs text-blue-600">Diámetro {item.diametro}</span><span className="text-lg font-bold text-blue-700">{item.cantidadKg.toFixed(2)} kg</span></div><div className="text-xs text-muted-foreground mt-1">{t('apu.costo_precio_kg', { costo: item.costoTotal.toFixed(2), precio: item.precioUnitarioKg.toFixed(2) })}</div></div>))}</div></div>
                <div className="bg-gradient-to-r from-primary to-warning rounded-xl p-4 shadow-sm"><div className="flex items-center justify-between"><div><span className="text-xs text-white/80">Costo Total</span><div className="text-2xl font-bold text-white">Q{resultadoAcero.costoTotal?.toFixed(2) || '0.00'}</div></div></div></div>
              </div>
            )}
          </div>
        )}

        {tab === 'movimientoTierra' && (
          <div>
            <h2 className="font-bold text-muted-foreground text-sm mb-3 truncate" title={t('apu.mov_tierra_titulo')}>{t('apu.mov_tierra_titulo')}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mb-4">
              <div><label className="text-xs text-muted-foreground mb-1 block">{t('apu.mov_tipo')}</label><select value={movimientoTierra.tipo} onChange={e => setMovimientoTierra(d => ({ ...d, tipo: e.target.value }))} className="w-full text-xs px-3 py-2 rounded-lg border border-border outline-none focus:border-orange-400 bg-card"><option value="excavacion">{t('apu.mov_excavacion')}</option><option value="relleno">{t('apu.mov_relleno')}</option><option value="compactacion">{t('apu.mov_compactacion')}</option></select></div>
              <div><label className="text-xs text-muted-foreground mb-1 block">{t('apu.mov_suelo')}</label><select value={movimientoTierra.suelo} onChange={e => setMovimientoTierra(d => ({ ...d, suelo: e.target.value }))} className="w-full text-xs px-3 py-2 rounded-lg border border-border outline-none focus:border-orange-400 bg-card"><option value="relleno">{t('apu.mov_relleno_suelo')}</option><option value="arcilla">{t('apu.mov_arcilla')}</option><option value="arena">{t('apu.mov_arena_suelo')}</option><option value="roca_blanda">{t('apu.mov_roca_blanda')}</option><option value="roca_dura">{t('apu.mov_roca_dura')}</option></select></div>
              <div><label className="text-xs text-muted-foreground mb-1 block">{t('apu.mov_profundidad')}</label><select value={movimientoTierra.profundidad} onChange={e => setMovimientoTierra(d => ({ ...d, profundidad: e.target.value }))} className="w-full text-xs px-3 py-2 rounded-lg border border-border outline-none focus:border-orange-400 bg-card"><option value="menos_1m">{t('apu.mov_menos_1m')}</option><option value="1_2m">{t('apu.mov_1_2m')}</option><option value="2_3m">{t('apu.mov_2_3m')}</option><option value="mas_3m">{t('apu.mov_mas_3m')}</option></select></div>
              <div><label className="text-xs text-muted-foreground mb-1 block">{t('apu.mov_acceso')}</label><select value={movimientoTierra.acceso} onChange={e => setMovimientoTierra(d => ({ ...d, acceso: e.target.value }))} className="w-full text-xs px-3 py-2 rounded-lg border border-border outline-none focus:border-orange-400 bg-card"><option value="retroexcavadora">{t('apu.mov_retroexcavadora')}</option><option value="cargador">{t('apu.mov_cargador_frontal')}</option><option value="manual">{t('apu.mov_manual')}</option></select></div>
              <div><label className="text-xs text-muted-foreground mb-1 block">{t('apu.mov_drenaje')}</label><select value={movimientoTierra.drenaje} onChange={e => setMovimientoTierra(d => ({ ...d, drenaje: e.target.value }))} className="w-full text-xs px-3 py-2 rounded-lg border border-border outline-none focus:border-orange-400 bg-card"><option value="seco">{t('apu.mov_seco')}</option><option value="agua">{t('apu.mov_con_agua')}</option><option value="lodos">{t('apu.mov_con_lodos')}</option></select></div>
              <div><label className="text-xs text-muted-foreground mb-1 block">{t('apu.volumen_m3')}</label><input type="number" inputMode="decimal" value={movimientoTierra.volumen} onChange={e => setMovimientoTierra(d => ({ ...d, volumen: Math.max(0.1, parseFloat(e.target.value) || 1) }))} min={0.1} step={0.1} className="w-full text-xs px-3 py-2 rounded-lg border border-border outline-none focus:border-orange-400 bg-card" /></div>
              <div className="sm:col-span-2 md:col-span-3"><button onClick={handleCalcularMovimientoTierra} disabled={calculandoMovimientoTierra} aria-label={calculandoMovimientoTierra ? t('apu.calculando_mov_tierra') : t('apu.calcular_mov_tierra')} className="w-full flex items-center justify-center gap-2 text-xs px-4 py-3 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"><Calculator className="w-4 h-4" />{calculandoMovimientoTierra ? t('apu.calculando') : t('apu.calcular_movimiento_tierra')}</button></div>
            </div>
            {resultadoMovimientoTierra && (
              <div className="mt-4 space-y-3">
                <div className="bg-muted/30 rounded-xl p-4 border border-border"><h3 className="font-bold text-muted-foreground text-xs mb-3">{t('apu.mov_resultados')}</h3><div className="grid grid-cols-2 sm:grid-cols-4 gap-3"><div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-3 border border-blue-100 dark:border-blue-900/50"><div className="text-xs text-blue-600 mb-1">{t('apu.mov_costo_unitario')}</div><div className="text-lg font-bold text-blue-700">Q{resultadoMovimientoTierra.costoUnitario?.toFixed(2) || '0.00'}/m³</div></div><div className="bg-amber-50 dark:bg-amber-950/20 rounded-lg p-3 border border-amber-100 dark:border-amber-900/50"><div className="text-xs text-amber-600 mb-1">{t('apu.mov_costo_total')}</div><div className="text-lg font-bold text-amber-700">Q{resultadoMovimientoTierra.costoTotal?.toFixed(2) || '0.00'}</div></div><div className="bg-stone-50 dark:bg-stone-800/50 rounded-lg p-3 border border-stone-100 dark:border-stone-700"><div className="text-xs text-stone-600 dark:text-stone-400 mb-1">{t('apu.mov_tiempo_estimado')}</div><div className="text-lg font-bold text-stone-700 dark:text-stone-300">{resultadoMovimientoTierra.tiempoEstimadoDias?.toFixed(1) || '0'} días</div></div><div className="bg-cyan-50 dark:bg-cyan-950/20 rounded-lg p-3 border border-cyan-100 dark:border-cyan-900/50"><div className="text-xs text-cyan-600 mb-1">{t('apu.mov_factor_ajuste')}</div><div className="text-lg font-bold text-cyan-700">{resultadoMovimientoTierra.factorAjusteTotal?.toFixed(2) || '1.00'}</div></div></div></div>
                <div className="bg-muted/30 rounded-xl p-3 border border-border"><h3 className="font-bold text-muted-foreground text-xs mb-2">{t('apu.mov_equipo_titulo')}</h3><div className="flex flex-wrap gap-2">{(resultadoMovimientoTierra.equipoRequerido || []).map((eq: string, idx: number) => (<span key={idx} className="text-xs px-2 py-1 bg-muted rounded-full">{eq}</span>))}</div></div>
              </div>
            )}
          </div>
        )}

        {tab === 'parametrosClimaticos' && (
          <div>
<h2 className="font-bold text-muted-foreground text-sm mb-3 truncate" title={t('apu.climaticos_titulo')}>{t('apu.climaticos_titulo')}</h2>
<p className="text-xs text-muted-foreground mb-4 truncate" title={t('apu.climaticos_descripcion')}>{t('apu.climaticos_descripcion')}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              <div><label className="text-xs text-muted-foreground mb-1 block">{t('apu.departamento_label')}</label><select value={parametrosClimaticos.departamentoCodigo} onChange={e => setParametrosClimaticos((d: ParametrosClimaticos) => ({ ...d, departamentoCodigo: e.target.value }))} className="w-full text-xs px-3 py-2 rounded-lg border border-border outline-none focus:border-orange-400 bg-card"><option value="">{t('apu.seleccione_departamento')}</option>{departamentos.map(dep => (<option key={dep.codigo} value={dep.codigo}>{dep.nombre}</option>))}</select></div>
              <div><label className="text-xs text-muted-foreground mb-1 block">{t('apu.mes_opcional')}</label><select value={parametrosClimaticos.mes || ''} onChange={e => setParametrosClimaticos((d: ParametrosClimaticos) => ({ ...d, mes: e.target.value }))} className="w-full text-xs px-3 py-2 rounded-lg border border-border outline-none focus:border-orange-400 bg-card"><option value="">{t('apu.sin_estacionalidad')}</option><option value="enero">{t('apu.mes_enero')}</option><option value="febrero">{t('apu.mes_febrero')}</option><option value="marzo">{t('apu.mes_marzo')}</option><option value="abril">{t('apu.mes_abril')}</option><option value="mayo">{t('apu.mes_mayo')}</option><option value="junio">{t('apu.mes_junio')}</option><option value="julio">{t('apu.mes_julio')}</option><option value="agosto">{t('apu.mes_agosto')}</option><option value="septiembre">{t('apu.mes_septiembre')}</option><option value="octubre">{t('apu.mes_octubre')}</option><option value="noviembre">{t('apu.mes_noviembre')}</option><option value="diciembre">{t('apu.mes_diciembre')}</option></select></div>
              <div className="sm:col-span-2"><button onClick={handleCalcularParametrosClimaticos} disabled={calculandoClimaticos} aria-label={calculandoClimaticos ? t('apu.calculando_climaticos') : t('apu.calcular_climaticos')} className="w-full flex items-center justify-center gap-2 text-xs px-4 py-3 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"><Calculator className="w-4 h-4" />{calculandoClimaticos ? t('apu.calculando') : t('apu.calcular_climaticos')}</button></div>
            </div>
            {resultadoClimaticos && (
              <div className="mt-4 space-y-3">
                 <div className="bg-muted/30 rounded-xl p-4 border border-border"><h3 className="font-bold text-muted-foreground text-xs mb-3 truncate" title={t('apu.climaticos_factores_titulo')}>{t('apu.climaticos_factores_titulo')}</h3><div className="grid grid-cols-1 sm:grid-cols-3 gap-3"><div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-3 border border-blue-100 dark:border-blue-900/50"><div className="text-xs text-blue-600 mb-1">{t('apu.climaticos_factor_curado')}</div><div className="text-lg font-bold text-blue-700">{resultadoClimaticos.factorCurado?.toFixed(2) || '1.00'}</div></div><div className="bg-amber-50 dark:bg-amber-950/20 rounded-lg p-3 border border-amber-100 dark:border-amber-900/50"><div className="text-xs text-amber-600 mb-1">{t('apu.climaticos_factor_rendimiento')}</div><div className="text-lg font-bold text-amber-700">{resultadoClimaticos.factorRendimiento?.toFixed(2) || '1.00'}</div></div><div className="bg-stone-50 dark:bg-stone-800/50 rounded-lg p-3 border border-stone-100 dark:border-stone-700"><div className="text-xs text-stone-600 dark:text-stone-400 mb-1">{t('apu.climaticos_factor_proteccion')}</div><div className="text-lg font-bold text-stone-700 dark:text-stone-300">{resultadoClimaticos.factorProteccion?.toFixed(2) || '1.00'}</div></div></div></div>
                <div className="bg-gradient-to-r from-primary to-warning rounded-xl p-4 shadow-sm"><div className="flex items-center justify-between"><div><span className="text-xs text-white/80">{t('apu.climaticos_ajuste_estacional')}</span><div className="text-2xl font-bold text-white">{resultadoClimaticos.factorAjusteEstacional?.toFixed(2) || '1.00'}</div></div><div className="text-right"><span className="text-xs text-white/80">{t('apu.climaticos_observaciones')}</span><div className="text-sm font-bold text-white">{resultadoClimaticos.observaciones || ''}</div></div></div></div>
              </div>
            )}
          </div>
        )}

        {tab === 'pavimentos' && (
          <div>
            <h2 className="font-bold text-muted-foreground text-sm mb-3 truncate" title={t('apu.pavimentos_titulo')}>{t('apu.pavimentos_titulo')}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mb-4">
              <div><label className="text-xs text-muted-foreground mb-1 block">{t('apu.pav_uso')}</label><select value={pavimento.uso} onChange={e => setPavimento(d => ({ ...d, uso: e.target.value }))} className="w-full text-xs px-3 py-2 rounded-lg border border-border outline-none focus:border-orange-400 bg-card"><option value="peatonal">{t('apu.pav_peatonal')}</option><option value="vehicular_liviano">{t('apu.pav_vehicular_liviano')}</option><option value="vehicular_medio">{t('apu.pav_vehicular_medio')}</option><option value="vehicular_pesado">{t('apu.pav_vehicular_pesado')}</option></select></div>
              <div><label className="text-xs text-muted-foreground mb-1 block">{t('apu.pav_tipo')}</label><select value={pavimento.tipo} onChange={e => setPavimento(d => ({ ...d, tipo: e.target.value }))} className="w-full text-xs px-3 py-2 rounded-lg border border-border outline-none focus:border-orange-400 bg-card"><option value="adoquinado">{t('apu.pav_adoquinado')}</option><option value="concreto">{t('apu.pav_concreto')}</option><option value="asfaltico">{t('apu.pav_asfaltico')}</option><option value="interlock">{t('apu.pav_interlock')}</option><option value="ceramico">{t('apu.pav_ceramico')}</option></select></div>
              <div><label className="text-xs text-muted-foreground mb-1 block">{t('apu.pav_tipo_base')}</label><select value={pavimento.tipoBase} onChange={e => setPavimento(d => ({ ...d, tipoBase: e.target.value }))} className="w-full text-xs px-3 py-2 rounded-lg border border-border outline-none focus:border-orange-400 bg-card"><option value="c4">C4</option><option value="piedra_picada">{t('apu.pav_piedra_picada')}</option><option value="grava">{t('apu.pav_grava')}</option><option value="arena">{t('apu.pav_arena_base')}</option></select></div>
              <div><label className="text-xs text-muted-foreground mb-1 block">{t('apu.pav_tipo_sello')}</label><select value={pavimento.tipoSello} onChange={e => setPavimento(d => ({ ...d, tipoSello: e.target.value }))} className="w-full text-xs px-3 py-2 rounded-lg border border-border outline-none focus:border-orange-400 bg-card"><option value="arena">{t('apu.pav_arena_sello')}</option><option value="cemento">{t('apu.pav_cemento_sello')}</option><option value="ninguno">{t('apu.pav_ninguno')}</option><option value="asfalto">{t('apu.pav_asfalto')}</option></select></div>
              <div><label className="text-xs text-muted-foreground mb-1 block">{t('apu.area_m2')}</label><input type="number" inputMode="decimal" value={pavimento.areaM2} onChange={e => setPavimento(d => ({ ...d, areaM2: Math.max(1, parseFloat(e.target.value) || 1) }))} min={1} step={1} className="w-full text-xs px-3 py-2 rounded-lg border border-border outline-none focus:border-orange-400 bg-card" /></div>
              <div className="sm:col-span-2 md:col-span-3"><button onClick={handleCalcularPavimento} disabled={calculandoPavimento} aria-label={calculandoPavimento ? t('apu.calculando_pavimento') : t('apu.calcular_pavimento')} className="w-full flex items-center justify-center gap-2 text-xs px-4 py-3 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"><Calculator className="w-4 h-4" />{calculandoPavimento ? t('apu.calculando') : t('apu.calcular_pavimento')}</button></div>
            </div>
            {resultadoPavimento && (
              <div className="mt-4 space-y-3">
                <div className="bg-muted/30 rounded-xl p-4 border border-border"><h3 className="font-bold text-muted-foreground text-xs mb-3">{t('apu.pav_resultados')}</h3><div className="grid grid-cols-2 sm:grid-cols-4 gap-3"><div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-3 border border-blue-100 dark:border-blue-900/50"><div className="text-xs text-blue-600 mb-1">{t('apu.pav_espesor')}</div><div className="text-lg font-bold text-blue-700">{resultadoPavimento.espesorCm?.toFixed(1) || '0'} cm</div></div><div className="bg-amber-50 dark:bg-amber-950/20 rounded-lg p-3 border border-amber-100 dark:border-amber-900/50"><div className="text-xs text-amber-600 mb-1">{t('apu.pav_costo_total_m2')}</div><div className="text-lg font-bold text-amber-700">Q{resultadoPavimento.costoTotalM2?.toFixed(2) || '0.00'}</div></div><div className="bg-stone-50 dark:bg-stone-800/50 rounded-lg p-3 border border-stone-100 dark:border-stone-700"><div className="text-xs text-stone-600 dark:text-stone-400 mb-1">{t('apu.pav_costo_total')}</div><div className="text-lg font-bold text-stone-700 dark:text-stone-300">Q{resultadoPavimento.costoTotal?.toFixed(2) || '0.00'}</div></div><div className="bg-cyan-50 dark:bg-cyan-950/20 rounded-lg p-3 border border-cyan-100 dark:border-cyan-900/50"><div className="text-xs text-cyan-600 mb-1">{t('apu.pav_volumen_base')}</div><div className="text-lg font-bold text-cyan-700">{resultadoPavimento.volumenBaseM3?.toFixed(2) || '0'} m³</div></div></div></div>
                <div className="bg-muted/30 rounded-xl p-3 border border-border"><h3 className="font-bold text-muted-foreground text-xs mb-2">{t('apu.desglose_costos')}</h3><div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs"><div className="flex justify-between"><span className="text-muted-foreground">{t('apu.pav_superficie')}:</span><span className="font-medium text-muted-foreground">Q{resultadoPavimento.costoSuperficieM2?.toFixed(2) || '0.00'}/m²</span></div><div className="flex justify-between"><span className="text-muted-foreground">{t('apu.pav_base')}:</span><span className="font-medium text-muted-foreground">Q{resultadoPavimento.costoBaseM3?.toFixed(2) || '0.00'}/m³</span></div><div className="flex justify-between"><span className="text-muted-foreground">{t('apu.pav_sello')}:</span><span className="font-medium text-muted-foreground">Q{resultadoPavimento.costoSelloM2?.toFixed(2) || '0.00'}/m²</span></div></div></div>
                <div className="bg-gradient-to-r from-primary to-warning rounded-xl p-4 shadow-sm"><div className="flex items-center justify-between"><div><span className="text-xs text-white/80">{t('apu.referencia_normativa')}</span><div className="text-lg font-bold text-white">{resultadoPavimento.referenciaNorma || ''}</div></div></div></div>
              </div>
            )}
          </div>
        )}

        {tab === 'redesInfraestructura' && (
          <div>
            <h2 className="font-bold text-muted-foreground text-sm mb-3 truncate" title={t('apu.redes_titulo')}>{t('apu.redes_titulo')}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mb-4">
              <div><label className="text-xs text-muted-foreground mb-1 block">{t('apu.redes_tipo')}</label><select value={redInfraestructura.tipo} onChange={e => setRedInfraestructura(d => ({ ...d, tipo: e.target.value }))} className="w-full text-xs px-3 py-2 rounded-lg border border-border outline-none focus:border-orange-400 bg-card"><option value="agua_potable">{t('apu.redes_agua_potable')}</option><option value="alcantarillado_sanitario">{t('apu.redes_alcantarillado_sanitario')}</option><option value="alcantarillado_pluvial">{t('apu.redes_alcantarillado_pluvial')}</option></select></div>
              <div><label className="text-xs text-muted-foreground mb-1 block">{t('apu.redes_diametro')}</label><select value={redInfraestructura.diametroPulgadas} onChange={e => setRedInfraestructura(d => ({ ...d, diametroPulgadas: parseFloat(e.target.value) }))} className="w-full text-xs px-3 py-2 rounded-lg border border-border outline-none focus:border-orange-400 bg-card"><option value="0.5">0.5&quot;</option><option value="1.0">1.0&quot;</option><option value="2.0">2.0&quot;</option><option value="3.0">3.0&quot;</option><option value="4.0">4.0&quot;</option><option value="6.0">6.0&quot;</option><option value="8.0">8.0&quot;</option></select></div>
              <div><label className="text-xs text-muted-foreground mb-1 block">{t('apu.redes_material')}</label><select value={redInfraestructura.material} onChange={e => setRedInfraestructura(d => ({ ...d, material: e.target.value }))} className="w-full text-xs px-3 py-2 rounded-lg border border-border outline-none focus:border-orange-400 bg-card"><option value="pvc">PVC</option><option value="cpvc">CPVC</option><option value="cobre">{t('apu.redes_cobre')}</option><option value="hdpe">HDPE</option><option value="concreto">{t('apu.redes_concreto')}</option><option value="fierro_fundido">{t('apu.redes_fierro_fundido')}</option></select></div>
              <div><label className="text-xs text-muted-foreground mb-1 block">{t('apu.redes_presion')}</label><select value={redInfraestructura.presion} onChange={e => setRedInfraestructura(d => ({ ...d, presion: e.target.value }))} className="w-full text-xs px-3 py-2 rounded-lg border border-border outline-none focus:border-orange-400 bg-card"><option value="baja">{t('apu.redes_baja')}</option><option value="media">{t('apu.redes_media')}</option><option value="alta">{t('apu.redes_alta')}</option></select></div>
              <div><label className="text-xs text-muted-foreground mb-1 block">{t('apu.redes_longitud')}</label><input type="number" inputMode="decimal" value={redInfraestructura.longitudMl} onChange={e => setRedInfraestructura(d => ({ ...d, longitudMl: Math.max(1, parseFloat(e.target.value) || 1) }))} min={1} step={1} className="w-full text-xs px-3 py-2 rounded-lg border border-border outline-none focus:border-orange-400 bg-card" /></div>
              <div className="sm:col-span-2 md:col-span-3"><button onClick={handleCalcularRedInfraestructura} disabled={calculandoRedInfraestructura} aria-label={calculandoRedInfraestructura ? t('apu.calculando_redes') : t('apu.calcular_redes')} className="w-full flex items-center justify-center gap-2 text-xs px-4 py-3 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"><Calculator className="w-4 h-4" />{calculandoRedInfraestructura ? t('apu.calculando') : t('apu.calcular_red_infraestructura')}</button></div>
            </div>
            {resultadoRedInfraestructura && (
              <div className="mt-4 space-y-3">
                <div className="bg-muted/30 rounded-xl p-4 border border-border"><h3 className="font-bold text-muted-foreground text-xs mb-3">{t('apu.redes_resultados')}</h3><div className="grid grid-cols-2 sm:grid-cols-4 gap-3"><div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-3 border border-blue-100 dark:border-blue-900/50"><div className="text-xs text-blue-600 mb-1">{t('apu.redes_costo_unitario')}</div><div className="text-lg font-bold text-blue-700">Q{resultadoRedInfraestructura.costoUnitarioMl?.toFixed(2) || '0.00'}/ml</div></div><div className="bg-amber-50 dark:bg-amber-950/20 rounded-lg p-3 border border-amber-100 dark:border-amber-900/50"><div className="text-xs text-amber-600 mb-1">{t('apu.redes_costo_total')}</div><div className="text-lg font-bold text-amber-700">Q{resultadoRedInfraestructura.costoTotal?.toFixed(2) || '0.00'}</div></div><div className="bg-stone-50 dark:bg-stone-800/50 rounded-lg p-3 border border-stone-100 dark:border-stone-700"><div className="text-xs text-stone-600 dark:text-stone-400 mb-1">{t('apu.redes_factor_material')}</div><div className="text-lg font-bold text-stone-700 dark:text-stone-300">{resultadoRedInfraestructura.factorAjusteMaterial?.toFixed(2) || '1.00'}</div></div><div className="bg-cyan-50 dark:bg-cyan-950/20 rounded-lg p-3 border border-cyan-100 dark:border-cyan-900/50"><div className="text-xs text-cyan-600 mb-1">{t('apu.redes_normativa')}</div><div className="text-sm font-bold text-cyan-700">{resultadoRedInfraestructura.referenciaNorma || ''}</div></div></div></div>
                <div className="bg-gradient-to-r from-primary to-warning rounded-xl p-4 shadow-sm"><div className="flex items-center justify-between"><div><span className="text-xs text-white/80">{t('apu.redes_costo_total_instalado')}</span><div className="text-2xl font-bold text-white">Q{resultadoRedInfraestructura.costoTotal?.toFixed(2) || '0.00'}</div></div><div className="text-right"><span className="text-xs text-white/80">{t('apu.redes_incluye_factor_material')}</span><div className="text-lg font-bold text-white">{resultadoRedInfraestructura.factorAjusteMaterial?.toFixed(2) || '1.00'}</div></div></div></div>
              </div>
            )}
          </div>
        )}

        {tab === 'murosContencion' && (
          <div>
            <h2 className="font-bold text-muted-foreground text-sm mb-3 truncate" title={t('apu.muros_titulo')}>{t('apu.muros_titulo')}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mb-4">
              <div><label className="text-xs text-muted-foreground mb-1 block">{t('apu.altura_m')}</label><input type="number" inputMode="decimal" value={muroContencion.alturaM} onChange={e => setMuroContencion(d => ({ ...d, alturaM: Math.max(1, parseFloat(e.target.value) || 1) }))} min={1} max={10} step={0.5} className="w-full text-xs px-3 py-2 rounded-lg border border-border outline-none focus:border-orange-400 bg-card" /></div>
              <div><label className="text-xs text-muted-foreground mb-1 block">{t('apu.muros_tipo_muro')}</label><select value={muroContencion.tipo} onChange={e => setMuroContencion(d => ({ ...d, tipo: e.target.value }))} className="w-full text-xs px-3 py-2 rounded-lg border border-border outline-none focus:border-orange-400 bg-card"><option value="gravedad">{t('apu.muros_gravedad')}</option><option value="cantiliver">Cantilever</option><option value="atirantado">{t('apu.muros_atirantado')}</option><option value="tipo celular">{t('apu.muros_tipo_celular')}</option><option value="pantalla">{t('apu.muros_pantalla')}</option></select></div>
              <div><label className="text-xs text-muted-foreground mb-1 block">{t('apu.muros_cimentacion')}</label><select value={muroContencion.tipoCimentacion} onChange={e => setMuroContencion(d => ({ ...d, tipoCimentacion: e.target.value }))} className="w-full text-xs px-3 py-2 rounded-lg border border-border outline-none focus:border-orange-400 bg-card"><option value="zapata_corrida">{t('apu.muros_zapata_corrida')}</option><option value="pilotes">{t('apu.muros_pilotes')}</option><option value="losa">{t('apu.muros_losa')}</option></select></div>
              <div><label className="text-xs text-muted-foreground mb-1 block">{t('apu.muros_tipo_suelo')}</label><select value={muroContencion.tipoSuelo} onChange={e => setMuroContencion(d => ({ ...d, tipoSuelo: e.target.value }))} className="w-full text-xs px-3 py-2 rounded-lg border border-border outline-none focus:border-orange-400 bg-card"><option value="arcilla">{t('apu.muros_arcilla')}</option><option value="arena">{t('apu.muros_arena')}</option><option value="roca">{t('apu.muros_roca')}</option><option value="relleno_compactado">{t('apu.muros_relleno_compactado')}</option><option value="granular">{t('apu.muros_granular')}</option></select></div>
              <div><label className="text-xs text-muted-foreground mb-1 block">{t('apu.muros_drenaje')}</label><select value={muroContencion.tipoDrenaje} onChange={e => setMuroContencion(d => ({ ...d, tipoDrenaje: e.target.value }))} className="w-full text-xs px-3 py-2 rounded-lg border border-border outline-none focus:border-orange-400 bg-card"><option value="sin_drenaje">{t('apu.muros_sin_drenaje')}</option><option value="drenaje_superficial">{t('apu.muros_drenaje_superficial')}</option><option value="drenaje_interno">{t('apu.muros_drenaje_interno')}</option><option value="drenaje_completo">{t('apu.muros_drenaje_completo')}</option></select></div>
              <div><label className="text-xs text-muted-foreground mb-1 block">{t('apu.muros_longitud')}</label><input type="number" inputMode="decimal" value={muroContencion.longitudM} onChange={e => setMuroContencion(d => ({ ...d, longitudM: Math.max(1, parseFloat(e.target.value) || 1) }))} min={1} step={1} className="w-full text-xs px-3 py-2 rounded-lg border border-border outline-none focus:border-orange-400 bg-card" /></div>
              <div className="sm:col-span-2 md:col-span-3"><button onClick={handleCalcularMuroContencion} disabled={calculandoMuroContencion} aria-label={calculandoMuroContencion ? t('apu.calculando_muros') : t('apu.calcular_muros')} className="w-full flex items-center justify-center gap-2 text-xs px-4 py-3 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"><Calculator className="w-4 h-4" />{calculandoMuroContencion ? t('apu.calculando') : t('apu.calcular_muro_contencion')}</button></div>
            </div>
            {resultadoMuroContencion && (
              <div className="mt-4 space-y-3">
                <div className="bg-muted/30 rounded-xl p-4 border border-border"><h3 className="font-bold text-muted-foreground text-xs mb-3">{t('apu.muros_resultados')}</h3><div className="grid grid-cols-2 sm:grid-cols-4 gap-3"><div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-3 border border-blue-100 dark:border-blue-900/50"><div className="text-xs text-blue-600 mb-1">{t('apu.muros_costo_unitario')}</div><div className="text-lg font-bold text-blue-700">Q{resultadoMuroContencion.costoUnitarioM2?.toFixed(2) || '0.00'}/m²</div></div><div className="bg-amber-50 dark:bg-amber-950/20 rounded-lg p-3 border border-amber-100 dark:border-amber-900/50"><div className="text-xs text-amber-600 mb-1">{t('apu.muros_costo_total')}</div><div className="text-lg font-bold text-amber-700">Q{resultadoMuroContencion.costoTotal?.toFixed(2) || '0.00'}</div></div><div className="bg-stone-50 dark:bg-stone-800/50 rounded-lg p-3 border border-stone-100 dark:border-stone-700"><div className="text-xs text-stone-600 dark:text-stone-400 mb-1">{t('apu.muros_factor_ajuste')}</div><div className="text-lg font-bold text-stone-700 dark:text-stone-300">{resultadoMuroContencion.factorAjusteTotal?.toFixed(2) || '1.00'}</div></div><div className="bg-cyan-50 dark:bg-cyan-950/20 rounded-lg p-3 border border-cyan-100 dark:border-cyan-900/50"><div className="text-xs text-cyan-600 mb-1">{t('apu.muros_volumen_concreto')}</div><div className="text-lg font-bold text-cyan-700">{resultadoMuroContencion.volumenConcretoM3?.toFixed(2) || '0'} m³</div></div></div></div>
                <div className="bg-gradient-to-r from-primary to-warning rounded-xl p-4 shadow-sm"><div className="flex items-center justify-between"><div><span className="text-xs text-white/80">{t('apu.muros_costo_total_instalado')}</span><div className="text-2xl font-bold text-white">Q{resultadoMuroContencion.costoTotal?.toFixed(2) || '0.00'}</div></div><div className="text-right"><span className="text-xs text-white/80">{t('apu.referencia_normativa')}</span><div className="text-sm font-bold text-white">{resultadoMuroContencion.referenciaNorma || ''}</div></div></div></div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
    </div>
  );
};

export default APUAvanzado;