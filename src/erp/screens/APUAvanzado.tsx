import React, { useMemo, useState, useEffect } from 'react';
import { useErp } from '../store';
import {
  Receipt, Search, DollarSign, Users, Wrench, Save, Edit3,
  BarChart3, Table as TableIcon, Settings, RefreshCw, Calculator,
} from 'lucide-react';
import { toast } from 'sonner';
import { safeLogger } from '@/lib/safeLogger';
import { FactorSobrecosto, DosificacionConcreto, MovimientoTierra, Pavimento, RedInfraestructura, MuroContencion } from '../types';
import { ServicioMotorCalculo } from '../services/motorCalculo';
import { registrarCalculo } from '../services/motorCalculo';
import { ServicioValidacionCalculos, mostrarValidaciones } from '../services/validacionCalculos';

type Tab = 'insumos' | 'rendimientos' | 'sobrecosto' | 'calculo' | 'historico' | 'dosificacion' | 'acero' | 'movimientoTierra' | 'parametrosClimaticos' | 'pavimentos' | 'redesInfraestructura' | 'murosContencion';

const FACTOR_DEFAULT: FactorSobrecosto = {
  indirectos: 12,
  administracion: 5,
  imprevistos: 5,
  utilidad: 10,
};

const APUAvanzado: React.FC = () => {
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
  const [resultadoDosificacion, setResultadoDosificacion] = useState<any>(null);
  const [departamentos, setDepartamentos] = useState<any[]>([]);

  const [acero, setAcero] = useState<any>({ elemento: 'columna', grado: 40, estribos: 'estribos', volumenM3: 1 });
  const [resultadoAcero, setResultadoAcero] = useState<any>(null);
  const [calculandoAcero, setCalculandoAcero] = useState(false);

  const [movimientoTierra, setMovimientoTierra] = useState<MovimientoTierra>({ tipo: 'excavacion', suelo: 'relleno', profundidad: 'menos_1m', acceso: 'retroexcavadora', drenaje: 'seco', volumen: 1 });
  const [resultadoMovimientoTierra, setResultadoMovimientoTierra] = useState<any>(null);
  const [calculandoMovimientoTierra, setCalculandoMovimientoTierra] = useState(false);

  const [parametrosClimaticos, setParametrosClimaticos] = useState<any>({ departamentoCodigo: '', departamento: '', zona: '', mes: '' });
  const [resultadoClimaticos, setResultadoClimaticos] = useState<any>(null);
  const [calculandoClimaticos, setCalculandoClimaticos] = useState(false);

  const [pavimento, setPavimento] = useState<Pavimento>({ uso: 'peatonal', tipo: 'adoquinado', tipoBase: 'c4', tipoSello: 'arena', areaM2: 100 });
  const [resultadoPavimento, setResultadoPavimento] = useState<any>(null);
  const [calculandoPavimento, setCalculandoPavimento] = useState(false);

  const [redInfraestructura, setRedInfraestructura] = useState<RedInfraestructura>({ tipo: 'agua_potable', diametroPulgadas: 1.0, material: 'pvc', presion: 'media', longitudMl: 100 });
  const [resultadoRedInfraestructura, setResultadoRedInfraestructura] = useState<any>(null);
  const [calculandoRedInfraestructura, setCalculandoRedInfraestructura] = useState(false);

  const [muroContencion, setMuroContencion] = useState<MuroContencion>({ alturaM: 2.0, tipo: 'gravedad', tipoCimentacion: 'zapata_corrida', tipoSuelo: 'arena', tipoDrenaje: 'sin_drenaje', longitudM: 10 });
  const [resultadoMuroContencion, setResultadoMuroContencion] = useState<any>(null);
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
    if (!q) return [] as any[];
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
      toast.success('Factor de sobrecosto actualizado para el proyecto');
    } else {
      toast.success('Factor guardado (sin proyecto)');
    }
    setEditFactor(false);
  };

  useEffect(() => {
    let cancelled = false;
    ServicioMotorCalculo.obtenerDepartamentos().then(data => {
      if (!cancelled) setDepartamentos(data);
    });
    return () => { cancelled = true; };
  }, []);

  const handleCalcularDosificacion = async () => {
    setCalculando(true);
    try {
      const resultado = await ServicioMotorCalculo.calcularDosificacion(dosificacion, volumen, departamento || undefined);
      setResultadoDosificacion(resultado);
      toast.success('Dosificación calculada exitosamente');
    } catch (error) {
      toast.error('Error al calcular dosificación');
      safeLogger.error(error);
    } finally {
      setCalculando(false);
    }
  };

  const handleCalcularAcero = async () => {
    setCalculandoAcero(true);
    try {
      const resultado = await (ServicioMotorCalculo as any).calcularDesgloseAcero?.(acero) || { error: 'Función no implementada' };
      setResultadoAcero(resultado);
      toast.success('Desglose de acero calculado exitosamente');
    } catch (error) {
      toast.error('Error al calcular desglose de acero');
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
      toast.success('Movimiento de tierra calculado exitosamente');
    } catch (error) {
      toast.error('Error al calcular movimiento de tierra');
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
      toast.success('Parámetros climáticos calculados exitosamente');
    } catch (error) {
      toast.error('Error al calcular parámetros climáticos');
      safeLogger.error(error);
    } finally {
      setCalculandoClimaticos(false);
    }
  };

  const handleCalcularPavimento = async () => {
    setCalculandoPavimento(true);
    try {
      const resultado = await ServicioMotorCalculo.calcularPavimento(pavimento);
      const validaciones = await ServicioValidacionCalculos.validarPavimento(pavimento as any, resultado as any);
      const esValido = await mostrarValidaciones(validaciones);
      if (!esValido) toast.warning('Cálculo tiene errores de validación');
      setResultadoPavimento(resultado);
      toast.success('Pavimento calculado exitosamente');
      try {
        await (registrarCalculo as any)(proyectoId || proyectos[0]?.id || '', 'pavimento', pavimento as any, resultado as any, 'Cálculo manual de pavimento');
      } catch (err) { /* ignore */ }
    } catch (error) {
      toast.error('Error al calcular pavimento');
      safeLogger.error(error);
    } finally {
      setCalculandoPavimento(false);
    }
  };

  const handleCalcularRedInfraestructura = async () => {
    setCalculandoRedInfraestructura(true);
    try {
      const resultado = await ServicioMotorCalculo.calcularRedInfraestructura(redInfraestructura);
      const validaciones = await ServicioValidacionCalculos.validarRedInfraestructura(redInfraestructura as any, resultado as any);
      const esValido = mostrarValidaciones(validaciones);
      if (!esValido) toast.warning('Cálculo tiene errores de validación');
      setResultadoRedInfraestructura(resultado);
      toast.success('Red de infraestructura calculada exitosamente');
      try {
        await (registrarCalculo as any)(proyectoId || proyectos[0]?.id || '', 'red_infraestructura', redInfraestructura as any, resultado as any, 'Cálculo manual de red de infraestructura');
      } catch (err) { /* ignore */ }
    } catch (error) {
      toast.error('Error al calcular red de infraestructura');
      safeLogger.error(error);
    } finally {
      setCalculandoRedInfraestructura(false);
    }
  };

  const handleCalcularMuroContencion = async () => {
    setCalculandoMuroContencion(true);
    try {
      const resultado = await ServicioMotorCalculo.calcularMuroContencion(muroContencion);
      const validaciones = await ServicioValidacionCalculos.validarMuroContencion(muroContencion as any, resultado as any);
      const esValido = mostrarValidaciones(validaciones);
      if (!esValido) toast.warning('Cálculo tiene errores de validación');
      setResultadoMuroContencion(resultado);
      toast.success('Muro de contención calculado exitosamente');
      try {
        await (registrarCalculo as any)(proyectoId || proyectos[0]?.id || '', 'muro_contencion', muroContencion as any, resultado as any, 'Cálculo manual de muro de contención');
      } catch (err) { /* ignore */ }
    } catch (error) {
      toast.error('Error al calcular muro de contención');
      safeLogger.error(error);
    } finally {
      setCalculandoMuroContencion(false);
    }
  };

  const historial = useMemo(() => {
    const base = insumosBase || [];
    if (base.length === 0) return [];
    const fechasUnicas = [...new Set((base as any[]).map(i => i.fechaActualizacion).filter(Boolean))] as string[];
    if (fechasUnicas.length === 0) return [];
    return fechasUnicas.slice(-5).map(fecha => {
      const insumosFecha = (base as any[]).filter(i => i.fechaActualizacion === fecha);
      const cemento = insumosFecha.find((i: any) => i.nombre.toLowerCase().includes('cemento'))?.precioReferencia || 0;
      const hierro = insumosFecha.find((i: any) => i.nombre.toLowerCase().includes('hierro') || i.nombre.toLowerCase().includes('varilla'))?.precioReferencia || 0;
      const arena = insumosFecha.find((i: any) => i.nombre.toLowerCase().includes('arena'))?.precioReferencia || 0;
      const block = insumosFecha.find((i: any) => i.nombre.toLowerCase().includes('block'))?.precioReferencia || 0;
      return { fecha: fecha.slice(0, 7), cemento: cemento || 0, hierro: hierro || 0, arena: arena || 0, block: block || 0 };
    });
  }, [insumosBase]);

  const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'insumos', label: 'Insumos Base', icon: TableIcon },
    { id: 'rendimientos', label: 'Rendimientos', icon: Users },
    { id: 'sobrecosto', label: 'Sobrecosto', icon: Settings },
    { id: 'dosificacion', label: 'Dosificación Concreto', icon: Calculator },
    { id: 'acero', label: 'Desglose Acero', icon: Wrench },
    { id: 'movimientoTierra', label: 'Movimiento Tierra', icon: Wrench },
    { id: 'parametrosClimaticos', label: 'Parámetros Climáticos', icon: Calculator },
    { id: 'pavimentos', label: 'Pavimentos', icon: Calculator },
    { id: 'redesInfraestructura', label: 'Redes Infraestructura', icon: Calculator },
    { id: 'murosContencion', label: 'Muros Contención', icon: Calculator },
    { id: 'calculo', label: 'Cálculo APU', icon: DollarSign },
    { id: 'historico', label: 'Histórico Precios', icon: BarChart3 },
  ];

  return (
    <div className="p-4 sm:p-6 max-w-[1600px] mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <h1 className="text-2xl font-black text-foreground flex items-center gap-2">
          <Receipt className="w-6 h-6 text-primary" /> APU Avanzado
        </h1>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <RefreshCw className="w-3 h-3" /> Precios referencia Guatemala 2026
        </div>
      </div>

      <div className="flex flex-wrap gap-1 mb-4 bg-muted rounded-xl p-1 shadow-sm border border-border">
        {TABS.map(t => {
          const Icon = t.icon;
          return (
            <button key={t.id} onClick={() => setTab(t.id)} className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${tab === t.id ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-background'}`}>
              <Icon className="w-3.5 h-3.5" /> {t.label}
            </button>
          );
        })}
      </div>

      <div className="bg-card text-card-foreground rounded-2xl shadow-sm border border-border p-4 sm:p-5">
        {tab === 'insumos' && (
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
              <h2 className="font-bold text-foreground text-sm">Catálogo de Insumos Base</h2>
              <div className="flex flex-wrap gap-2">
                <select value={rubroFilter} onChange={e => setRubroFilter(e.target.value)} className="text-xs px-2 py-1.5 rounded-lg border border-input outline-none bg-background text-foreground">
                  <option value="">Todos los rubros</option>
                  {rubros.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
                <div className="relative">
                  <Search className="absolute left-2 top-1.5 w-3.5 h-3.5 text-muted-foreground" />
                  <input value={searchInsumo} onChange={e => setSearchInsumo(e.target.value)} placeholder="Buscar insumo..." className="pl-7 pr-3 py-1.5 text-xs rounded-lg border border-input outline-none focus:border-ring bg-background text-foreground w-full sm:w-44" />
                </div>
              </div>
            </div>
            <div className="text-xs text-muted-foreground mb-2">{(filteredInsumos as any[]).length} insumos · Precios de referencia INSIVUMEH / MOP</div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th className="text-left py-2 px-2 font-medium">Insumo</th>
                    <th className="text-left py-2 px-2 font-medium">Categoría</th>
                    <th className="text-left py-2 px-2 font-medium">Unidad</th>
                    <th className="text-right py-2 px-2 font-medium">Precio Ref.</th>
                    <th className="text-left py-2 px-2 font-medium">Rubro</th>
                    <th className="text-left py-2 px-2 font-medium">Últ. Actualización</th>
                  </tr>
                </thead>
                <tbody>
                  {(filteredInsumos as any[]).map((ins: any) => (
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
            </div>
          </div>
        )}

        {tab === 'rendimientos' && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold text-muted-foreground text-sm">Rendimientos por Cuadrilla</h2>
              <div className="relative">
                <Search className="absolute left-2 top-1.5 w-3.5 h-3.5 text-muted-foreground" />
                <input value={searchRend} onChange={e => setSearchRend(e.target.value)} placeholder="Buscar actividad..." className="pl-7 pr-3 py-1.5 text-xs rounded-lg border border-border outline-none focus:border-orange-400 w-full sm:w-44" />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th className="text-left py-2 px-2 font-medium">Actividad</th>
                    <th className="text-left py-2 px-2 font-medium">Cuadrilla</th>
                    <th className="text-right py-2 px-2 font-medium">Rendimiento</th>
                    <th className="text-left py-2 px-2 font-medium">Unidad</th>
                  </tr>
                </thead>
                <tbody>
                  {(filteredRendimientos as any[]).map((r: any) => (
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
          </div>
        )}

        {tab === 'sobrecosto' && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold text-muted-foreground text-sm">Factor de Sobrecosto</h2>
              <button onClick={() => setEditFactor(!editFactor)} className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-muted text-muted-foreground hover:bg-muted transition-colors">
                <Edit3 className="w-3 h-3" /> {editFactor ? 'Cancelar' : 'Editar'}
              </button>
            </div>
            <div className="mb-4">
              <label className="text-xs text-muted-foreground mb-1 block font-medium">Aplicar a proyecto</label>
              <select value={proyectoId} onChange={e => { setProyectoId(e.target.value); const p = proyectos.find(pr => pr.id === e.target.value); if (p?.factorSobrecosto) setFactor(p.factorSobrecosto); }} className="w-full max-w-xs px-3 py-2 text-sm rounded-lg border border-border outline-none focus:border-orange-400">
<option value="">- Sin proyecto (referencia general) -</option>
                {proyectos.map(p => (<option key={p.id} value={p.id}>{p.nombre}{p.factorSobrecosto ? ' ✓' : ''}</option>))}
              </select>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
              {([{ key: 'indirectos', label: 'Indirectos', desc: 'Gastos generales de obra' }, { key: 'administracion', label: 'Administración', desc: 'Gastos administrativos' }, { key: 'imprevistos', label: 'Imprevistos', desc: 'Contingencias' }, { key: 'utilidad', label: 'Utilidad', desc: 'Margen de ganancia' }] as const).map(item => (
                <div key={item.key} className="bg-muted/30 rounded-xl p-3 border border-border">
                  <div className="text-xs text-muted-foreground mb-1">{item.label}</div>
                  <div className="text-xs text-slate-300 mb-1">{item.desc}</div>
                  {editFactor ? (
                    <input type="number" inputMode="decimal" value={factor[item.key]} onChange={e => setFactor(f => ({ ...f, [item.key]: Math.max(0, +e.target.value) }))} min={0} max={100} className="w-full px-2 py-1 text-sm font-bold text-right rounded border border-border outline-none focus:border-orange-400" />
                  ) : (<div className="text-lg font-bold text-foreground">{factor[item.key]}%</div>)}
                </div>
              ))}
            </div>
            <div className="bg-orange-50 border border-orange-100 rounded-xl p-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div><span className="text-xs text-orange-600 font-medium">Total sobrecosto:</span><span className="text-xl font-bold text-orange-700 ml-2">{factor.indirectos + factor.administracion + factor.imprevistos + factor.utilidad}%</span></div>
                <div><span className="text-xs text-orange-600 font-medium">Factor multiplicador:</span><span className="text-xl font-bold text-orange-700 ml-2">x{((factor.indirectos + factor.administracion + factor.imprevistos + factor.utilidad) / 100 + 1).toFixed(2)}</span></div>
                {editFactor && (<button onClick={handleSaveFactor} className="flex items-center gap-1 text-xs px-4 py-2 rounded-lg bg-orange-500 text-white hover:bg-orange-600 transition-colors font-medium"><Save className="w-3 h-3" /> Guardar</button>)}
              </div>
            </div>
          </div>
        )}

        {tab === 'dosificacion' && (
          <div>
            <h2 className="font-bold text-muted-foreground text-sm mb-3">Motor de Dosificación de Concreto</h2>
            <p className="text-xs text-muted-foreground mb-4">Cálculo paramétrico de materiales basado en resistencia, tipo y condiciones ambientales</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mb-4">
              <div><label className="text-xs text-muted-foreground mb-1 block">Resistencia</label><select value={dosificacion.resistencia} onChange={e => setDosificacion(d => ({ ...d, resistencia: e.target.value as any }))} className="w-full text-xs px-3 py-2 rounded-lg border border-border outline-none focus:border-orange-400 bg-card"><option value="2000psi">2000 psi</option><option value="2500psi">2500 psi</option><option value="3000psi">3000 psi</option><option value="3500psi">3500 psi</option><option value="4000psi">4000 psi</option><option value="4500psi">4500 psi</option><option value="5000psi">5000 psi</option></select></div>
              <div><label className="text-xs text-muted-foreground mb-1 block">Tipo de Elemento</label><select value={dosificacion.tipo} onChange={e => setDosificacion(d => ({ ...d, tipo: e.target.value as any }))} className="w-full text-xs px-3 py-2 rounded-lg border border-border outline-none focus:border-orange-400 bg-card"><option value="cimentacion">Cimentación</option><option value="estructura">Estructura</option><option value="losa">Losa</option><option value="pavimento">Pavimento</option><option value="muro">Muro</option></select></div>
              <div><label className="text-xs text-muted-foreground mb-1 block">Tamaño de Agregado</label><select value={dosificacion.tamañoAgregado} onChange={e => setDosificacion(d => ({ ...d, tamañoAgregado: e.target.value as any }))} className="w-full text-xs px-3 py-2 rounded-lg border border-border outline-none focus:border-orange-400 bg-card"><option value="3/4">3/4&quot;</option><option value="1">1&quot;</option><option value="1.5">1.5&quot;</option><option value="2">2&quot;</option></select></div>
              <div><label className="text-xs text-muted-foreground mb-1 block">Aditivos</label><select value={dosificacion.aditivos} onChange={e => setDosificacion(d => ({ ...d, aditivos: e.target.value as any }))} className="w-full text-xs px-3 py-2 rounded-lg border border-border outline-none focus:border-orange-400 bg-card"><option value="ninguno">Ninguno</option><option value="acelerador">Acelerador</option><option value="retardador">Retardador</option><option value="plastificante">Plastificante</option><option value="impermeabilizante">Impermeabilizante</option></select></div>
              <div><label className="text-xs text-muted-foreground mb-1 block">Tipo de Curado</label><select value={dosificacion.curado} onChange={e => setDosificacion(d => ({ ...d, curado: e.target.value as any }))} className="w-full text-xs px-3 py-2 rounded-lg border border-border outline-none focus:border-orange-400 bg-card"><option value="normal">Normal</option><option value="acelerado">Acelerado</option><option value="prolongado">Prolongado</option></select></div>
              <div><label className="text-xs text-muted-foreground mb-1 block">Volumen (m³)</label><input type="number" inputMode="decimal" value={volumen} onChange={e => setVolumen(Math.max(0.1, parseFloat(e.target.value) || 1))} min={0.1} step={0.1} className="w-full text-xs px-3 py-2 rounded-lg border border-border outline-none focus:border-orange-400 bg-card" /></div>
              <div><label className="text-xs text-muted-foreground mb-1 block">Departamento (opcional)</label><select value={departamento} onChange={e => setDepartamento(e.target.value)} className="w-full text-xs px-3 py-2 rounded-lg border border-border outline-none focus:border-orange-400 bg-card"><option value="">Sin ajuste regional</option>{departamentos.map((dep: any) => (<option key={dep.codigo} value={dep.codigo}>{dep.nombre}</option>))}</select></div>
              <div className="sm:col-span-2 md:col-span-3">
                <button onClick={handleCalcularDosificacion} disabled={calculando} className="w-full flex items-center justify-center gap-2 text-xs px-4 py-3 rounded-lg bg-orange-500 text-white hover:bg-orange-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed">
                  <Calculator className="w-4 h-4" />{calculando ? 'Calculando...' : 'Calcular Dosificación'}
                </button>
              </div>
            </div>
            {resultadoDosificacion && (
              <div className="mt-4 space-y-3">
                <div className="bg-muted/30 rounded-xl p-4 border border-border">
                  <h3 className="font-bold text-muted-foreground text-xs mb-3">Cantidades Calculadas</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-blue-50 rounded-lg p-3 border border-blue-100"><div className="text-xs text-blue-600 mb-1">Cemento</div><div className="text-lg font-bold text-blue-700">{resultadoDosificacion.cementoSacos.toFixed(1)} sacos</div></div>
                    <div className="bg-amber-50 rounded-lg p-3 border border-amber-100"><div className="text-xs text-amber-600 mb-1">Arena</div><div className="text-lg font-bold text-amber-700">{resultadoDosificacion.arenaM3.toFixed(2)} m³</div></div>
                    <div className="bg-stone-50 rounded-lg p-3 border border-stone-100"><div className="text-xs text-stone-600 mb-1">Piedra</div><div className="text-lg font-bold text-stone-700">{resultadoDosificacion.piedraM3.toFixed(2)} m³</div></div>
                    <div className="bg-cyan-50 rounded-lg p-3 border border-cyan-100"><div className="text-xs text-cyan-600 mb-1">Agua</div><div className="text-lg font-bold text-cyan-700">{resultadoDosificacion.aguaLt.toFixed(0)} lt</div></div>
                  </div>
                </div>
                <div className="bg-gradient-to-r from-primary to-warning rounded-xl p-4 shadow-sm">
                  <div className="flex items-center justify-between"><div><span className="text-xs text-white/80">Costo Total</span><div className="text-2xl font-bold text-white">Q{resultadoDosificacion.costoTotal.toFixed(2)}</div></div><div className="text-right"><span className="text-xs text-white/80">Factor Ajuste</span><div className="text-lg font-bold text-white">x{resultadoDosificacion.factorAjuste.toFixed(2)}</div></div></div>
                </div>
                <div className="bg-muted/30 rounded-xl p-3 border border-border">
                  <h3 className="font-bold text-muted-foreground text-xs mb-2">Desglose de Costos</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                    <div className="flex justify-between"><span className="text-muted-foreground">Cemento:</span><span className="font-medium text-muted-foreground">Q{resultadoDosificacion.desgloseCostos.cemento.toFixed(2)}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Arena:</span><span className="font-medium text-muted-foreground">Q{resultadoDosificacion.desgloseCostos.arena.toFixed(2)}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Piedra:</span><span className="font-medium text-muted-foreground">Q{resultadoDosificacion.desgloseCostos.piedra.toFixed(2)}</span></div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {tab === 'calculo' && (
          <div>
            <h2 className="font-bold text-muted-foreground text-sm mb-3">Cálculo Automático: CD → PV</h2>
            <p className="text-xs text-muted-foreground mb-4">Ejemplo con renglón: <strong>Concreto en cimientos</strong> (1 m³)</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
              <div className="bg-blue-50 rounded-xl p-4 border border-blue-100"><div className="flex items-center gap-1.5 mb-1"><Wrench className="w-3.5 h-3.5 text-blue-500" /><span className="text-xs font-medium text-blue-600">Materiales</span></div><div className="text-xl font-bold text-blue-700">Q{calculos.cd.materiales.toFixed(2)}</div></div>
              <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100"><div className="flex items-center gap-1.5 mb-1"><Users className="w-3.5 h-3.5 text-emerald-500" /><span className="text-xs font-medium text-emerald-600">Mano de Obra</span></div><div className="text-xl font-bold text-emerald-700">Q{calculos.cd.manoObra.toFixed(2)}</div></div>
              <div className="bg-purple-50 rounded-xl p-4 border border-purple-100"><div className="flex items-center gap-1.5 mb-1"><Settings className="w-3.5 h-3.5 text-purple-500" /><span className="text-xs font-medium text-blue-600">Equipo</span></div><div className="text-xl font-bold text-purple-700">Q{calculos.cd.equipo.toFixed(2)}</div></div>
            </div>
            <div className="bg-slate-900 rounded-xl p-4 mb-4">
              <div className="flex items-center justify-between">
                <div><span className="text-xs text-muted-foreground">Costo Directo (CD)</span><div className="text-xl font-bold text-white">Q{calculos.costoDirecto.toFixed(2)}</div></div>
                <div className="text-right"><span className="text-xs text-muted-foreground">Sobrecosto</span><div className="text-lg font-bold text-orange-400">{calculos.pctTotal}%</div></div>
              </div>
            </div>
            <div className="bg-gradient-to-r from-primary to-warning rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div><span className="text-xs text-white/80">Precio de Venta (PV)</span><div className="text-2xl font-bold text-white">Q{calculos.precioVenta.toFixed(2)}</div><span className="text-xs text-white/60">por unidad de obra</span></div>
                <div className="text-right"><span className="text-xs text-white/80">Factor</span><div className="text-lg font-bold text-white">x{calculos.factorMultiplicador.toFixed(2)}</div></div>
              </div>
            </div>
            <div className="mt-4 bg-muted/30 rounded-xl p-3 text-xs text-muted-foreground font-mono">
              <div className="font-semibold text-muted-foreground mb-1">Fórmula:</div>
              <div>CD = Materiales + MO + Equipo = Q{calculos.cd.materiales.toFixed(2)} + Q{calculos.cd.manoObra.toFixed(2)} + Q{calculos.cd.equipo.toFixed(2)} = Q{calculos.costoDirecto.toFixed(2)}</div>
              <div>PV = CD × (1 + (Indirectos + Admin + Imprevistos + Utilidad) / 100)</div>
              <div>PV = Q{calculos.costoDirecto.toFixed(2)} × (1 + {calculos.pctTotal} / 100) = Q{calculos.precioVenta.toFixed(2)}</div>
            </div>
          </div>
        )}

        {tab === 'historico' && (
          <div>
            <h2 className="font-bold text-muted-foreground text-sm mb-3">Histórico de Precios por Insumo</h2>
            <p className="text-xs text-muted-foreground mb-4">Evolución de precios de referencia — Guatemala 2025–2026</p>
            {historial.length > 0 ? (<>
              <div className="relative h-40 mb-4 bg-muted/30 rounded-xl p-3 border border-border">
                <div className="flex items-end gap-1 h-full">{(historial as any[]).map((h: any, i: number) => { const maxVal = Math.max(...(historial as any[]).map((x: any) => x.cemento)); const hPct = (h.cemento / maxVal) * 100; return (<div key={i} className="flex-1 flex flex-col items-center gap-1"><span className="text-[10px] text-muted-foreground font-medium">{h.cemento}</span><div className="w-full bg-orange-400 rounded-t transition-all" style={{ height: `${hPct}%`, minHeight: 8 }} /><span className="text-[8px] text-muted-foreground">{h.fecha.slice(2)}</span></div>); })}</div>
                <div className="absolute top-2 left-3 text-xs text-muted-foreground">Cemento UGC (Q/saco)</div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead><tr className="border-b border-border text-muted-foreground"><th className="text-left py-2 px-2 font-medium">Fecha</th><th className="text-right py-2 px-2 font-medium">Cemento</th><th className="text-right py-2 px-2 font-medium">Hierro 3/8&quot;</th><th className="text-right py-2 px-2 font-medium">Arena</th><th className="text-right py-2 px-2 font-medium">Block</th></tr></thead>
                  <tbody>{(historial as any[]).map((h: any, i: number) => (<tr key={i} className="border-b border-slate-50 hover:bg-accent"><td className="py-2 px-2 font-medium text-muted-foreground">{h.fecha}</td><td className="py-2 px-2 text-right">Q{h.cemento}</td><td className="py-2 px-2 text-right">Q{h.hierro}</td><td className="py-2 px-2 text-right">Q{h.arena}</td><td className="py-2 px-2 text-right">Q{h.block}</td></tr>))}</tbody>
                </table>
              </div>
              <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div className="bg-muted/30 rounded-xl p-3 border border-border"><div className="text-xs text-muted-foreground">Cemento</div><div className="text-sm font-bold text-orange-600">Q{(historial as any[])[(historial as any[]).length - 1].cemento.toFixed(0)}<span className="text-xs ml-1 text-red-500">↑ {(((historial as any[])[(historial as any[]).length - 1].cemento - (historial as any[])[0].cemento) / ((historial as any[])[0].cemento || 1) * 100).toFixed(1)}%</span></div></div>
                <div className="bg-muted/30 rounded-xl p-3 border border-border"><div className="text-xs text-muted-foreground">Hierro 3/8&quot;</div><div className="text-sm font-bold text-blue-600">Q{(historial as any[])[(historial as any[]).length - 1].hierro.toFixed(0)}<span className="text-xs ml-1 text-red-500">↑ {(((historial as any[])[(historial as any[]).length - 1].hierro - (historial as any[])[0].hierro) / ((historial as any[])[0].hierro || 1) * 100).toFixed(1)}%</span></div></div>
                <div className="bg-muted/30 rounded-xl p-3 border border-border"><div className="text-xs text-muted-foreground">Arena</div><div className="text-sm font-bold text-emerald-600">Q{(historial as any[])[(historial as any[]).length - 1].arena.toFixed(0)}<span className="text-xs ml-1 text-red-500">↑ {(((historial as any[])[(historial as any[]).length - 1].arena - (historial as any[])[0].arena) / ((historial as any[])[0].arena || 1) * 100).toFixed(1)}%</span></div></div>
                <div className="bg-muted/30 rounded-xl p-3 border border-border"><div className="text-xs text-muted-foreground">Block</div><div className="text-sm font-bold text-blue-600">Q{(historial as any[])[(historial as any[]).length - 1].block.toFixed(0)}<span className="text-xs ml-1 text-red-500">↑ {(((historial as any[])[(historial as any[]).length - 1].block - (historial as any[])[0].block) / ((historial as any[])[0].block || 1) * 100).toFixed(1)}%</span></div></div>
              </div>
            </>) : (<div className="text-center py-8 text-muted-foreground text-sm">No hay datos históricos disponibles.</div>)}
          </div>
        )}

        {tab === 'acero' && (
          <div>
            <h2 className="font-bold text-muted-foreground text-sm mb-3">Motor de Desglose de Acero</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mb-4">
              <div><label className="text-xs text-muted-foreground mb-1 block">Elemento</label><select value={acero.elemento} onChange={e => setAcero((d: any) => ({ ...d, elemento: e.target.value }))} className="w-full text-xs px-3 py-2 rounded-lg border border-border outline-none focus:border-orange-400 bg-card"><option value="columna">Columna</option><option value="viga">Viga</option><option value="losa">Losa</option><option value="muro">Muro</option></select></div>
              <div><label className="text-xs text-muted-foreground mb-1 block">Grado</label><select value={acero.grado} onChange={e => setAcero((d: any) => ({ ...d, grado: parseInt(e.target.value) }))} className="w-full text-xs px-3 py-2 rounded-lg border border-border outline-none focus:border-orange-400 bg-card"><option value="40">Grado 40</option><option value="60">Grado 60</option></select></div>
              <div><label className="text-xs text-muted-foreground mb-1 block">Estribos</label><select value={acero.estribos} onChange={e => setAcero((d: any) => ({ ...d, estribos: e.target.value }))} className="w-full text-xs px-3 py-2 rounded-lg border border-border outline-none focus:border-orange-400 bg-card"><option value="estribos">Estribos</option><option value="espiral">Espiral</option><option value="malla">Malla Electrosoldada</option></select></div>
              <div><label className="text-xs text-muted-foreground mb-1 block">Volumen (m³)</label><input type="number" inputMode="decimal" value={acero.volumenM3} onChange={e => setAcero((d: any) => ({ ...d, volumenM3: Math.max(0.1, parseFloat(e.target.value) || 1) }))} min={0.1} step={0.1} className="w-full text-xs px-3 py-2 rounded-lg border border-border outline-none focus:border-orange-400 bg-card" /></div>
              <div className="sm:col-span-2 md:col-span-3">
                <button onClick={handleCalcularAcero} disabled={calculandoAcero} className="w-full flex items-center justify-center gap-2 text-xs px-4 py-3 rounded-lg bg-orange-500 text-white hover:bg-orange-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"><Calculator className="w-4 h-4" />{calculandoAcero ? 'Calculando...' : 'Calcular Desglose de Acero'}</button>
              </div>
            </div>
            {resultadoAcero && (
              <div className="mt-4 space-y-3">
                <div className="bg-muted/30 rounded-xl p-4 border border-border"><h3 className="font-bold text-muted-foreground text-xs mb-3">Desglose por Diámetro</h3><div className="space-y-2">{(resultadoAcero.desglose || []).map((item: any, index: number) => (<div key={index} className="bg-blue-50 rounded-lg p-3 border border-blue-100"><div className="flex items-center justify-between"><span className="text-xs text-blue-600">Diámetro {item.diametro}</span><span className="text-lg font-bold text-blue-700">{item.cantidadKg.toFixed(2)} kg</span></div><div className="text-xs text-muted-foreground mt-1">Costo: Q{item.costoTotal.toFixed(2)} | Precio: Q{item.precioUnitarioKg.toFixed(2)}/kg</div></div>))}</div></div>
                <div className="bg-gradient-to-r from-primary to-warning rounded-xl p-4 shadow-sm"><div className="flex items-center justify-between"><div><span className="text-xs text-white/80">Costo Total</span><div className="text-2xl font-bold text-white">Q{resultadoAcero.costoTotal?.toFixed(2) || '0.00'}</div></div></div></div>
              </div>
            )}
          </div>
        )}

        {tab === 'movimientoTierra' && (
          <div>
            <h2 className="font-bold text-muted-foreground text-sm mb-3">Motor de Movimientos de Tierra</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mb-4">
              <div><label className="text-xs text-muted-foreground mb-1 block">Tipo</label><select value={movimientoTierra.tipo} onChange={e => setMovimientoTierra(d => ({ ...d, tipo: e.target.value as any }))} className="w-full text-xs px-3 py-2 rounded-lg border border-border outline-none focus:border-orange-400 bg-card"><option value="excavacion">Excavación</option><option value="relleno">Relleno</option><option value="compactacion">Compactación</option></select></div>
              <div><label className="text-xs text-muted-foreground mb-1 block">Suelo</label><select value={movimientoTierra.suelo} onChange={e => setMovimientoTierra(d => ({ ...d, suelo: e.target.value as any }))} className="w-full text-xs px-3 py-2 rounded-lg border border-border outline-none focus:border-orange-400 bg-card"><option value="relleno">Relleno</option><option value="arcilla">Arcilla</option><option value="arena">Arena</option><option value="roca_blanda">Roca Blanda</option><option value="roca_dura">Roca Dura</option></select></div>
              <div><label className="text-xs text-muted-foreground mb-1 block">Profundidad</label><select value={movimientoTierra.profundidad} onChange={e => setMovimientoTierra(d => ({ ...d, profundidad: e.target.value as any }))} className="w-full text-xs px-3 py-2 rounded-lg border border-border outline-none focus:border-orange-400 bg-card"><option value="menos_1m">Menos de 1m</option><option value="1_2m">1-2m</option><option value="2_3m">2-3m</option><option value="mas_3m">Más de 3m</option></select></div>
              <div><label className="text-xs text-muted-foreground mb-1 block">Acceso</label><select value={movimientoTierra.acceso} onChange={e => setMovimientoTierra(d => ({ ...d, acceso: e.target.value as any }))} className="w-full text-xs px-3 py-2 rounded-lg border border-border outline-none focus:border-orange-400 bg-card"><option value="retroexcavadora">Retroexcavadora</option><option value="cargador">Cargador Frontal</option><option value="manual">Manual</option></select></div>
              <div><label className="text-xs text-muted-foreground mb-1 block">Drenaje</label><select value={movimientoTierra.drenaje} onChange={e => setMovimientoTierra(d => ({ ...d, drenaje: e.target.value as any }))} className="w-full text-xs px-3 py-2 rounded-lg border border-border outline-none focus:border-orange-400 bg-card"><option value="seco">Seco</option><option value="agua">Con Agua</option><option value="lodos">Con Lodos</option></select></div>
              <div><label className="text-xs text-muted-foreground mb-1 block">Volumen (m³)</label><input type="number" inputMode="decimal" value={movimientoTierra.volumen} onChange={e => setMovimientoTierra(d => ({ ...d, volumen: Math.max(0.1, parseFloat(e.target.value) || 1) }))} min={0.1} step={0.1} className="w-full text-xs px-3 py-2 rounded-lg border border-border outline-none focus:border-orange-400 bg-card" /></div>
              <div className="sm:col-span-2 md:col-span-3"><button onClick={handleCalcularMovimientoTierra} disabled={calculandoMovimientoTierra} className="w-full flex items-center justify-center gap-2 text-xs px-4 py-3 rounded-lg bg-orange-500 text-white hover:bg-orange-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"><Calculator className="w-4 h-4" />{calculandoMovimientoTierra ? 'Calculando...' : 'Calcular Movimiento de Tierra'}</button></div>
            </div>
            {resultadoMovimientoTierra && (
              <div className="mt-4 space-y-3">
                <div className="bg-muted/30 rounded-xl p-4 border border-border"><h3 className="font-bold text-muted-foreground text-xs mb-3">Resultados Calculados</h3><div className="grid grid-cols-2 sm:grid-cols-4 gap-3"><div className="bg-blue-50 rounded-lg p-3 border border-blue-100"><div className="text-xs text-blue-600 mb-1">Costo Unitario</div><div className="text-lg font-bold text-blue-700">Q{resultadoMovimientoTierra.costoUnitario?.toFixed(2) || '0.00'}/m³</div></div><div className="bg-amber-50 rounded-lg p-3 border border-amber-100"><div className="text-xs text-amber-600 mb-1">Costo Total</div><div className="text-lg font-bold text-amber-700">Q{resultadoMovimientoTierra.costoTotal?.toFixed(2) || '0.00'}</div></div><div className="bg-stone-50 rounded-lg p-3 border border-stone-100"><div className="text-xs text-stone-600 mb-1">Tiempo Estimado</div><div className="text-lg font-bold text-stone-700">{resultadoMovimientoTierra.tiempoEstimadoDias?.toFixed(1) || '0'} días</div></div><div className="bg-cyan-50 rounded-lg p-3 border border-cyan-100"><div className="text-xs text-cyan-600 mb-1">Factor Ajuste</div><div className="text-lg font-bold text-cyan-700">x{resultadoMovimientoTierra.factorAjusteTotal?.toFixed(2) || '1.00'}</div></div></div></div>
                <div className="bg-muted/30 rounded-xl p-3 border border-border"><h3 className="font-bold text-muted-foreground text-xs mb-2">Equipo Requerido</h3><div className="flex flex-wrap gap-2">{(resultadoMovimientoTierra.equipoRequerido || []).map((eq: string, idx: number) => (<span key={idx} className="text-xs px-2 py-1 bg-muted rounded-full">{eq}</span>))}</div></div>
              </div>
            )}
          </div>
        )}

        {tab === 'parametrosClimaticos' && (
          <div>
            <h2 className="font-bold text-muted-foreground text-sm mb-3">Parámetros Climáticos por Departamento</h2>
            <p className="text-xs text-muted-foreground mb-4">Factores de ajuste por clima para curado de concreto y rendimiento de mano de obra</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              <div><label className="text-xs text-muted-foreground mb-1 block">Departamento</label><select value={parametrosClimaticos.departamentoCodigo} onChange={e => setParametrosClimaticos((d: any) => ({ ...d, departamentoCodigo: e.target.value }))} className="w-full text-xs px-3 py-2 rounded-lg border border-border outline-none focus:border-orange-400 bg-card"><option value="">Seleccione departamento</option>{departamentos.map(dep => (<option key={dep.codigo} value={dep.codigo}>{dep.nombre}</option>))}</select></div>
              <div><label className="text-xs text-muted-foreground mb-1 block">Mes (opcional)</label><select value={(parametrosClimaticos as any).mes || ''} onChange={e => setParametrosClimaticos((d: any) => ({ ...d, mes: e.target.value }))} className="w-full text-xs px-3 py-2 rounded-lg border border-border outline-none focus:border-orange-400 bg-card"><option value="">Sin estacionalidad</option><option value="enero">Enero</option><option value="febrero">Febrero</option><option value="marzo">Marzo</option><option value="abril">Abril</option><option value="mayo">Mayo</option><option value="junio">Junio</option><option value="julio">Julio</option><option value="agosto">Agosto</option><option value="septiembre">Septiembre</option><option value="octubre">Octubre</option><option value="noviembre">Noviembre</option><option value="diciembre">Diciembre</option></select></div>
              <div className="sm:col-span-2"><button onClick={handleCalcularParametrosClimaticos} disabled={calculandoClimaticos} className="w-full flex items-center justify-center gap-2 text-xs px-4 py-3 rounded-lg bg-orange-500 text-white hover:bg-orange-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"><Calculator className="w-4 h-4" />{calculandoClimaticos ? 'Calculando...' : 'Calcular Parámetros Climáticos'}</button></div>
            </div>
            {resultadoClimaticos && (
              <div className="mt-4 space-y-3">
                <div className="bg-muted/30 rounded-xl p-4 border border-border"><h3 className="font-bold text-muted-foreground text-xs mb-3">Factores Climáticos</h3><div className="grid grid-cols-1 sm:grid-cols-3 gap-3"><div className="bg-blue-50 rounded-lg p-3 border border-blue-100"><div className="text-xs text-blue-600 mb-1">Factor Curado</div><div className="text-lg font-bold text-blue-700">x{resultadoClimaticos.factorCurado?.toFixed(2) || '1.00'}</div></div><div className="bg-amber-50 rounded-lg p-3 border border-amber-100"><div className="text-xs text-amber-600 mb-1">Factor Rendimiento</div><div className="text-lg font-bold text-amber-700">x{resultadoClimaticos.factorRendimiento?.toFixed(2) || '1.00'}</div></div><div className="bg-stone-50 rounded-lg p-3 border border-stone-100"><div className="text-xs text-stone-600 mb-1">Factor Protección</div><div className="text-lg font-bold text-stone-700">x{resultadoClimaticos.factorProteccion?.toFixed(2) || '1.00'}</div></div></div></div>
                <div className="bg-gradient-to-r from-primary to-warning rounded-xl p-4 shadow-sm"><div className="flex items-center justify-between"><div><span className="text-xs text-white/80">Ajuste Estacional</span><div className="text-2xl font-bold text-white">x{resultadoClimaticos.factorAjusteEstacional?.toFixed(2) || '1.00'}</div></div><div className="text-right"><span className="text-xs text-white/80">Observaciones</span><div className="text-sm font-bold text-white">{resultadoClimaticos.observaciones || ''}</div></div></div></div>
              </div>
            )}
          </div>
        )}

        {tab === 'pavimentos' && (
          <div>
            <h2 className="font-bold text-muted-foreground text-sm mb-3">Motor de Pavimentos</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mb-4">
              <div><label className="text-xs text-muted-foreground mb-1 block">Uso</label><select value={pavimento.uso} onChange={e => setPavimento(d => ({ ...d, uso: e.target.value as any }))} className="w-full text-xs px-3 py-2 rounded-lg border border-border outline-none focus:border-orange-400 bg-card"><option value="peatonal">Peatonal</option><option value="vehicular_liviano">Vehicular Liviano</option><option value="vehicular_medio">Vehicular Medio</option><option value="vehicular_pesado">Vehicular Pesado</option></select></div>
              <div><label className="text-xs text-muted-foreground mb-1 block">Tipo</label><select value={pavimento.tipo} onChange={e => setPavimento(d => ({ ...d, tipo: e.target.value as any }))} className="w-full text-xs px-3 py-2 rounded-lg border border-border outline-none focus:border-orange-400 bg-card"><option value="adoquinado">Adoquinado</option><option value="concreto">Concreto</option><option value="asfaltico">Asfaltico</option><option value="interlock">Interlock</option><option value="ceramico">Cerámico</option></select></div>
              <div><label className="text-xs text-muted-foreground mb-1 block">Tipo Base</label><select value={pavimento.tipoBase} onChange={e => setPavimento(d => ({ ...d, tipoBase: e.target.value as any }))} className="w-full text-xs px-3 py-2 rounded-lg border border-border outline-none focus:border-orange-400 bg-card"><option value="c4">C4</option><option value="piedra_picada">Piedra Picada</option><option value="grava">Grava</option><option value="arena">Arena</option></select></div>
              <div><label className="text-xs text-muted-foreground mb-1 block">Tipo Sello</label><select value={pavimento.tipoSello} onChange={e => setPavimento(d => ({ ...d, tipoSello: e.target.value as any }))} className="w-full text-xs px-3 py-2 rounded-lg border border-border outline-none focus:border-orange-400 bg-card"><option value="arena">Arena</option><option value="cemento">Cemento</option><option value="ninguno">Ninguno</option><option value="asfalto">Asfalto</option></select></div>
              <div><label className="text-xs text-muted-foreground mb-1 block">Área (m²)</label><input type="number" inputMode="decimal" value={pavimento.areaM2} onChange={e => setPavimento(d => ({ ...d, areaM2: Math.max(1, parseFloat(e.target.value) || 1) }))} min={1} step={1} className="w-full text-xs px-3 py-2 rounded-lg border border-border outline-none focus:border-orange-400 bg-card" /></div>
              <div className="sm:col-span-2 md:col-span-3"><button onClick={handleCalcularPavimento} disabled={calculandoPavimento} className="w-full flex items-center justify-center gap-2 text-xs px-4 py-3 rounded-lg bg-orange-500 text-white hover:bg-orange-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"><Calculator className="w-4 h-4" />{calculandoPavimento ? 'Calculando...' : 'Calcular Pavimento'}</button></div>
            </div>
            {resultadoPavimento && (
              <div className="mt-4 space-y-3">
                <div className="bg-muted/30 rounded-xl p-4 border border-border"><h3 className="font-bold text-muted-foreground text-xs mb-3">Resultados Calculados</h3><div className="grid grid-cols-2 sm:grid-cols-4 gap-3"><div className="bg-blue-50 rounded-lg p-3 border border-blue-100"><div className="text-xs text-blue-600 mb-1">Espesor</div><div className="text-lg font-bold text-blue-700">{resultadoPavimento.espesorCm?.toFixed(1) || '0'} cm</div></div><div className="bg-amber-50 rounded-lg p-3 border border-amber-100"><div className="text-xs text-amber-600 mb-1">Costo Total/m²</div><div className="text-lg font-bold text-amber-700">Q{resultadoPavimento.costoTotalM2?.toFixed(2) || '0.00'}</div></div><div className="bg-stone-50 rounded-lg p-3 border border-stone-100"><div className="text-xs text-stone-600 mb-1">Costo Total</div><div className="text-lg font-bold text-stone-700">Q{resultadoPavimento.costoTotal?.toFixed(2) || '0.00'}</div></div><div className="bg-cyan-50 rounded-lg p-3 border border-cyan-100"><div className="text-xs text-cyan-600 mb-1">Volumen Base</div><div className="text-lg font-bold text-cyan-700">{resultadoPavimento.volumenBaseM3?.toFixed(2) || '0'} m³</div></div></div></div>
                <div className="bg-muted/30 rounded-xl p-3 border border-border"><h3 className="font-bold text-muted-foreground text-xs mb-2">Desglose de Costos</h3><div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs"><div className="flex justify-between"><span className="text-muted-foreground">Superficie:</span><span className="font-medium text-muted-foreground">Q{resultadoPavimento.costoSuperficieM2?.toFixed(2) || '0.00'}/m²</span></div><div className="flex justify-between"><span className="text-muted-foreground">Base:</span><span className="font-medium text-muted-foreground">Q{resultadoPavimento.costoBaseM3?.toFixed(2) || '0.00'}/m³</span></div><div className="flex justify-between"><span className="text-muted-foreground">Sello:</span><span className="font-medium text-muted-foreground">Q{resultadoPavimento.costoSelloM2?.toFixed(2) || '0.00'}/m²</span></div></div></div>
                <div className="bg-gradient-to-r from-primary to-warning rounded-xl p-4 shadow-sm"><div className="flex items-center justify-between"><div><span className="text-xs text-white/80">Referencia Normativa</span><div className="text-lg font-bold text-white">{resultadoPavimento.referenciaNorma || ''}</div></div></div></div>
              </div>
            )}
          </div>
        )}

        {tab === 'redesInfraestructura' && (
          <div>
            <h2 className="font-bold text-muted-foreground text-sm mb-3">Motor de Redes de Infraestructura</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mb-4">
              <div><label className="text-xs text-muted-foreground mb-1 block">Tipo</label><select value={redInfraestructura.tipo} onChange={e => setRedInfraestructura(d => ({ ...d, tipo: e.target.value as any }))} className="w-full text-xs px-3 py-2 rounded-lg border border-border outline-none focus:border-orange-400 bg-card"><option value="agua_potable">Agua Potable</option><option value="alcantarillado_sanitario">Alcantarillado Sanitario</option><option value="alcantarillado_pluvial">Alcantarillado Pluvial</option></select></div>
              <div><label className="text-xs text-muted-foreground mb-1 block">Diámetro (pulgadas)</label><select value={redInfraestructura.diametroPulgadas} onChange={e => setRedInfraestructura(d => ({ ...d, diametroPulgadas: parseFloat(e.target.value) }))} className="w-full text-xs px-3 py-2 rounded-lg border border-border outline-none focus:border-orange-400 bg-card"><option value="0.5">0.5&quot;</option><option value="1.0">1.0&quot;</option><option value="2.0">2.0&quot;</option><option value="3.0">3.0&quot;</option><option value="4.0">4.0&quot;</option><option value="6.0">6.0&quot;</option><option value="8.0">8.0&quot;</option></select></div>
              <div><label className="text-xs text-muted-foreground mb-1 block">Material</label><select value={redInfraestructura.material} onChange={e => setRedInfraestructura(d => ({ ...d, material: e.target.value as any }))} className="w-full text-xs px-3 py-2 rounded-lg border border-border outline-none focus:border-orange-400 bg-card"><option value="pvc">PVC</option><option value="cpvc">CPVC</option><option value="cobre">Cobre</option><option value="hdpe">HDPE</option><option value="concreto">Concreto</option><option value="fierro_fundido">Fierro Fundido</option></select></div>
              <div><label className="text-xs text-muted-foreground mb-1 block">Presión</label><select value={redInfraestructura.presion} onChange={e => setRedInfraestructura(d => ({ ...d, presion: e.target.value as any }))} className="w-full text-xs px-3 py-2 rounded-lg border border-border outline-none focus:border-orange-400 bg-card"><option value="baja">Baja</option><option value="media">Media</option><option value="alta">Alta</option></select></div>
              <div><label className="text-xs text-muted-foreground mb-1 block">Longitud (ml)</label><input type="number" inputMode="decimal" value={redInfraestructura.longitudMl} onChange={e => setRedInfraestructura(d => ({ ...d, longitudMl: Math.max(1, parseFloat(e.target.value) || 1) }))} min={1} step={1} className="w-full text-xs px-3 py-2 rounded-lg border border-border outline-none focus:border-orange-400 bg-card" /></div>
              <div className="sm:col-span-2 md:col-span-3"><button onClick={handleCalcularRedInfraestructura} disabled={calculandoRedInfraestructura} className="w-full flex items-center justify-center gap-2 text-xs px-4 py-3 rounded-lg bg-orange-500 text-white hover:bg-orange-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"><Calculator className="w-4 h-4" />{calculandoRedInfraestructura ? 'Calculando...' : 'Calcular Red de Infraestructura'}</button></div>
            </div>
            {resultadoRedInfraestructura && (
              <div className="mt-4 space-y-3">
                <div className="bg-muted/30 rounded-xl p-4 border border-border"><h3 className="font-bold text-muted-foreground text-xs mb-3">Resultados Calculados</h3><div className="grid grid-cols-2 sm:grid-cols-4 gap-3"><div className="bg-blue-50 rounded-lg p-3 border border-blue-100"><div className="text-xs text-blue-600 mb-1">Costo Unitario</div><div className="text-lg font-bold text-blue-700">Q{resultadoRedInfraestructura.costoUnitarioMl?.toFixed(2) || '0.00'}/ml</div></div><div className="bg-amber-50 rounded-lg p-3 border border-amber-100"><div className="text-xs text-amber-600 mb-1">Costo Total</div><div className="text-lg font-bold text-amber-700">Q{resultadoRedInfraestructura.costoTotal?.toFixed(2) || '0.00'}</div></div><div className="bg-stone-50 rounded-lg p-3 border border-stone-100"><div className="text-xs text-stone-600 mb-1">Factor Material</div><div className="text-lg font-bold text-stone-700">x{resultadoRedInfraestructura.factorAjusteMaterial?.toFixed(2) || '1.00'}</div></div><div className="bg-cyan-50 rounded-lg p-3 border border-cyan-100"><div className="text-xs text-cyan-600 mb-1">Normativa</div><div className="text-sm font-bold text-cyan-700">{resultadoRedInfraestructura.referenciaNorma || ''}</div></div></div></div>
                <div className="bg-gradient-to-r from-primary to-warning rounded-xl p-4 shadow-sm"><div className="flex items-center justify-between"><div><span className="text-xs text-white/80">Costo Total Instalado</span><div className="text-2xl font-bold text-white">Q{resultadoRedInfraestructura.costoTotal?.toFixed(2) || '0.00'}</div></div><div className="text-right"><span className="text-xs text-white/80">Incluye factor material</span><div className="text-lg font-bold text-white">x{resultadoRedInfraestructura.factorAjusteMaterial?.toFixed(2) || '1.00'}</div></div></div></div>
              </div>
            )}
          </div>
        )}

        {tab === 'murosContencion' && (
          <div>
            <h2 className="font-bold text-muted-foreground text-sm mb-3">Motor de Muros de Contención</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mb-4">
              <div><label className="text-xs text-muted-foreground mb-1 block">Altura (m)</label><input type="number" inputMode="decimal" value={muroContencion.alturaM} onChange={e => setMuroContencion(d => ({ ...d, alturaM: Math.max(1, parseFloat(e.target.value) || 1) }))} min={1} max={10} step={0.5} className="w-full text-xs px-3 py-2 rounded-lg border border-border outline-none focus:border-orange-400 bg-card" /></div>
              <div><label className="text-xs text-muted-foreground mb-1 block">Tipo de Muro</label><select value={muroContencion.tipo} onChange={e => setMuroContencion(d => ({ ...d, tipo: e.target.value as any }))} className="w-full text-xs px-3 py-2 rounded-lg border border-border outline-none focus:border-orange-400 bg-card"><option value="gravedad">Gravedad</option><option value="cantiliver">Cantilever</option><option value="atirantado">Atirantado</option><option value="tipo celular">Tipo Celular</option><option value="pantalla">Pantalla</option></select></div>
              <div><label className="text-xs text-muted-foreground mb-1 block">Cimentación</label><select value={muroContencion.tipoCimentacion} onChange={e => setMuroContencion(d => ({ ...d, tipoCimentacion: e.target.value as any }))} className="w-full text-xs px-3 py-2 rounded-lg border border-border outline-none focus:border-orange-400 bg-card"><option value="zapata_corrida">Zapata Corrida</option><option value="pilotes">Pilotes</option><option value="losa">Losa</option></select></div>
              <div><label className="text-xs text-muted-foreground mb-1 block">Tipo de Suelo</label><select value={muroContencion.tipoSuelo} onChange={e => setMuroContencion(d => ({ ...d, tipoSuelo: e.target.value as any }))} className="w-full text-xs px-3 py-2 rounded-lg border border-border outline-none focus:border-orange-400 bg-card"><option value="arcilla">Arcilla</option><option value="arena">Arena</option><option value="roca">Roca</option><option value="relleno_compactado">Relleno Compactado</option><option value="granular">Granular</option></select></div>
              <div><label className="text-xs text-muted-foreground mb-1 block">Drenaje</label><select value={muroContencion.tipoDrenaje} onChange={e => setMuroContencion(d => ({ ...d, tipoDrenaje: e.target.value as any }))} className="w-full text-xs px-3 py-2 rounded-lg border border-border outline-none focus:border-orange-400 bg-card"><option value="sin_drenaje">Sin Drenaje</option><option value="drenaje_superficial">Drenaje Superficial</option><option value="drenaje_interno">Drenaje Interno</option><option value="drenaje_completo">Drenaje Completo</option></select></div>
              <div><label className="text-xs text-muted-foreground mb-1 block">Longitud (m)</label><input type="number" inputMode="decimal" value={muroContencion.longitudM} onChange={e => setMuroContencion(d => ({ ...d, longitudM: Math.max(1, parseFloat(e.target.value) || 1) }))} min={1} step={1} className="w-full text-xs px-3 py-2 rounded-lg border border-border outline-none focus:border-orange-400 bg-card" /></div>
              <div className="sm:col-span-2 md:col-span-3"><button onClick={handleCalcularMuroContencion} disabled={calculandoMuroContencion} className="w-full flex items-center justify-center gap-2 text-xs px-4 py-3 rounded-lg bg-orange-500 text-white hover:bg-orange-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"><Calculator className="w-4 h-4" />{calculandoMuroContencion ? 'Calculando...' : 'Calcular Muro de Contención'}</button></div>
            </div>
            {resultadoMuroContencion && (
              <div className="mt-4 space-y-3">
                <div className="bg-muted/30 rounded-xl p-4 border border-border"><h3 className="font-bold text-muted-foreground text-xs mb-3">Resultados Calculados</h3><div className="grid grid-cols-2 sm:grid-cols-4 gap-3"><div className="bg-blue-50 rounded-lg p-3 border border-blue-100"><div className="text-xs text-blue-600 mb-1">Costo Unitario</div><div className="text-lg font-bold text-blue-700">Q{resultadoMuroContencion.costoUnitarioM2?.toFixed(2) || '0.00'}/m²</div></div><div className="bg-amber-50 rounded-lg p-3 border border-amber-100"><div className="text-xs text-amber-600 mb-1">Costo Total</div><div className="text-lg font-bold text-amber-700">Q{resultadoMuroContencion.costoTotal?.toFixed(2) || '0.00'}</div></div><div className="bg-stone-50 rounded-lg p-3 border border-stone-100"><div className="text-xs text-stone-600 mb-1">Factor Ajuste</div><div className="text-lg font-bold text-stone-700">x{resultadoMuroContencion.factorAjusteTotal?.toFixed(2) || '1.00'}</div></div><div className="bg-cyan-50 rounded-lg p-3 border border-cyan-100"><div className="text-xs text-cyan-600 mb-1">Volumen Concreto</div><div className="text-lg font-bold text-cyan-700">{resultadoMuroContencion.volumenConcretoM3?.toFixed(2) || '0'} m³</div></div></div></div>
                <div className="bg-gradient-to-r from-primary to-warning rounded-xl p-4 shadow-sm"><div className="flex items-center justify-between"><div><span className="text-xs text-white/80">Costo Total Instalado</span><div className="text-2xl font-bold text-white">Q{resultadoMuroContencion.costoTotal?.toFixed(2) || '0.00'}</div></div><div className="text-right"><span className="text-xs text-white/80">Referencia Normativa</span><div className="text-sm font-bold text-white">{resultadoMuroContencion.referenciaNorma || ''}</div></div></div></div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default APUAvanzado;