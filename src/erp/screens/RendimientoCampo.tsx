import React, { useState } from 'react';
import { useErp } from '../store';
import type { Destajo, CapturaRendimiento, PlantillaSubrenglon, ValeSalidaRenglon } from '../types';

const uid = () => Date.now().toString(36).substr(2, 9);

const getEficienciaColor = (ef: number) => {
  if (ef >= 90) return 'text-success';
  if (ef >= 80) return 'text-warning';
  return 'text-destructive';
};

export const RendimientoCampo: React.FC = () => {
  const { proyectos } = useErp();

  const [tab, setTab] = useState<'destajos' | 'capturas' | 'plantillas' | 'vales'>('destajos');
  const [proyectoFilter, setProyectoFilter] = useState('');

  const [destajos, setDestajos] = useState<Destajo[]>(() => {
    try { return JSON.parse(localStorage.getItem('wm_destajos') || '[]'); } catch { return []; }
  });
  const [capturas, setCapturas] = useState<CapturaRendimiento[]>(() => {
    try { return JSON.parse(localStorage.getItem('wm_capturas') || '[]'); } catch { return []; }
  });
  const [plantillas, setPlantillas] = useState<PlantillaSubrenglon[]>(() => {
    try { return JSON.parse(localStorage.getItem('wm_plantillas') || '[]'); } catch { return []; }
  });
  const [vales, setVales] = useState<ValeSalidaRenglon[]>(() => {
    try { return JSON.parse(localStorage.getItem('wm_vales_renglon') || '[]'); } catch { return []; }
  });

  const saveDestajos = (data: Destajo[]) => { setDestajos(data); localStorage.setItem('wm_destajos', JSON.stringify(data)); };
  const saveCapturas = (data: CapturaRendimiento[]) => { setCapturas(data); localStorage.setItem('wm_capturas', JSON.stringify(data)); };
  const savePlantillas = (data: PlantillaSubrenglon[]) => { setPlantillas(data); localStorage.setItem('wm_plantillas', JSON.stringify(data)); };
  const saveVales = (data: ValeSalidaRenglon[]) => { setVales(data); localStorage.setItem('wm_vales_renglon', JSON.stringify(data)); };

  const addDestajo = (data: Omit<Destajo, 'id' | 'rendimientoReal'>) => {
    const rendimientoReal = data.horasTrabajadas > 0 ? data.cantidadEjecutada / data.horasTrabajadas : 0;
    saveDestajos([{ ...data, id: uid(), rendimientoReal }, ...destajos]);
  };
  const addCaptura = (data: Omit<CapturaRendimiento, 'id' | 'rendimientoReal' | 'eficiencia'>) => {
    const rendimientoReal = data.horas > 0 ? data.cantidad / data.horas : 0;
    const eficiencia = data.rendimientoTeorico > 0 ? (rendimientoReal / data.rendimientoTeorico) * 100 : 0;
    saveCapturas([{ ...data, id: uid(), rendimientoReal, eficiencia }, ...capturas]);
  };
  const deleteCaptura = (id: string) => saveCapturas(capturas.filter(c => c.id !== id));
  const addPlantilla = (data: Omit<PlantillaSubrenglon, 'id'>) => savePlantillas([{ ...data, id: uid() }, ...plantillas]);

  const SELECT = 'text-xs px-2 py-1.5 border border-input rounded-lg outline-none focus:border-ring bg-background text-foreground';

  const renderDestajos = () => {
    const filtrados = proyectoFilter ? destajos.filter(d => d.proyectoId === proyectoFilter) : destajos;
    return (
      <div>
        <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
          <h2 className="text-lg font-bold text-foreground">🏗️ Destajos — Rendimiento Real</h2>
          <div className="flex gap-2 flex-wrap">
            <select value={proyectoFilter} onChange={e => setProyectoFilter(e.target.value)} className={SELECT}>
              <option value="">Todos los proyectos</option>
              {proyectos.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
            </select>
            <button onClick={() => {
              const proy = proyectos[0]; if (!proy) return;
              addDestajo({ proyectoId: proy.id, renglonCodigo: 'EXC-001', cuadrilla: '1 Albañil + 1 Ayudante', fecha: new Date().toISOString().split('T')[0], cantidadEjecutada: Math.round(Math.random() * 20 + 5), unidad: 'm³', horasTrabajadas: 8, rendimientoTeorico: 10 });
            }} className="bg-success text-success-foreground px-3 py-1.5 rounded-lg text-xs hover:bg-success/90 font-medium">+ Registrar Destajo</button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted">
                <th className="p-2 text-left">Proyecto</th>
                <th className="p-2 text-left">Renglón</th>
                <th className="p-2 text-left">Cuadrilla</th>
                <th className="p-2 text-right">Ejecutado</th>
                <th className="p-2 text-right">Real</th>
                <th className="p-2 text-right">Teórico</th>
                <th className="p-2 text-right">Eficiencia</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map(d => {
                const proy = proyectos.find(p => p.id === d.proyectoId);
                const ef = d.rendimientoTeorico > 0 ? (d.rendimientoReal / d.rendimientoTeorico) * 100 : 0;
                return (
                  <tr key={d.id} className="border-t hover:bg-muted/50">
                    <td className="p-2 text-xs">{proy?.nombre || '—'}</td>
                    <td className="p-2 font-mono text-xs">{d.renglonCodigo}</td>
                    <td className="p-2 text-xs">{d.cuadrilla}</td>
                    <td className="p-2 text-right font-mono">{d.cantidadEjecutada} {d.unidad}</td>
                    <td className="p-2 text-right font-mono">{d.rendimientoReal.toFixed(1)}</td>
                    <td className="p-2 text-right font-mono">{d.rendimientoTeorico}</td>
                    <td className={`p-2 text-right font-bold ${getEficienciaColor(ef)}`}>{ef.toFixed(0)}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filtrados.length === 0 && <p className="text-muted-foreground text-sm text-center py-8">No hay destajos registrados</p>}
      </div>
    );
  };

  const renderCapturas = () => {
    const filtradas = proyectoFilter ? capturas.filter(c => c.proyectoId === proyectoFilter) : capturas;
    const promedioEf = filtradas.length > 0 ? filtradas.reduce((a, c) => a + c.eficiencia, 0) / filtradas.length : 0;
    return (
      <div>
        <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
          <h2 className="text-lg font-bold text-foreground">📊 Captura de Rendimiento Diario</h2>
          <div className="flex gap-2">
            <select value={proyectoFilter} onChange={e => setProyectoFilter(e.target.value)} className={SELECT}>
              <option value="">Todos</option>
              {proyectos.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
            </select>
            <button onClick={() => {
              const proy = proyectos[0]; if (!proy) return;
              const teorico = 20; const cantidad = Math.round(Math.random() * 25 + 5);
              addCaptura({ proyectoId: proy.id, renglonCodigo: 'CON-001', actividad: 'Concreto en cimientos', cuadrilla: '2 Albañiles', fecha: new Date().toISOString().split('T')[0], cantidad, unidad: 'm³', horas: 8, rendimientoTeorico: teorico });
            }} className="bg-success text-success-foreground px-3 py-1.5 rounded-lg text-xs hover:bg-success/90 font-medium">+ Capturar</button>
          </div>
        </div>

        {filtradas.length > 0 && (
          <div className="mb-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3 bg-info/10 rounded-lg text-center"><p className="text-xs text-info font-medium">Capturas</p><p className="text-xl font-bold text-info">{filtradas.length}</p></div>
            <div className="p-3 bg-muted rounded-lg text-center"><p className="text-xs text-muted-foreground font-medium">Eficiencia Promedio</p><p className={`text-xl font-bold ${getEficienciaColor(promedioEf)}`}>{promedioEf.toFixed(0)}%</p></div>
            <div className="p-3 bg-destructive/10 rounded-lg text-center"><p className="text-xs text-destructive font-medium">Bajo rendimiento (&lt;80%)</p><p className="text-xl font-bold text-destructive">{filtradas.filter(c => c.eficiencia < 80).length}</p></div>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted">
                <th className="p-2 text-left">Actividad</th>
                <th className="p-2 text-left">Cuadrilla</th>
                <th className="p-2 text-right">Cantidad</th>
                <th className="p-2 text-right">Teórico</th>
                <th className="p-2 text-right">Real</th>
                <th className="p-2 text-right">Eficiencia</th>
                <th className="p-2"></th>
              </tr>
            </thead>
            <tbody>
              {filtradas.map(c => (
                <tr key={c.id} className={`border-t ${c.eficiencia < 80 ? 'bg-destructive/5' : 'hover:bg-muted/50'}`}>
                  <td className="p-2 text-xs font-medium">{c.actividad}</td>
                  <td className="p-2 text-xs">{c.cuadrilla}</td>
                  <td className="p-2 text-right font-mono">{c.cantidad} {c.unidad}</td>
                  <td className="p-2 text-right font-mono">{c.rendimientoTeorico}</td>
                  <td className="p-2 text-right font-mono">{c.rendimientoReal.toFixed(1)}</td>
                  <td className={`p-2 text-right font-bold ${getEficienciaColor(c.eficiencia)}`}>
                    {c.eficiencia.toFixed(0)}%{c.eficiencia < 80 && <span className="ml-1">⚠️</span>}
                  </td>
                  <td className="p-2">
                    <button onClick={() => deleteCaptura(c.id)} className="text-destructive hover:text-destructive/80 text-xs" aria-label="Eliminar">🗑</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtradas.length === 0 && <p className="text-muted-foreground text-sm text-center py-8">No hay capturas de rendimiento</p>}
      </div>
    );
  };

  const PLANTILLAS_BASE = [
    { codigo: 'CON-001', nombre: 'Concreto en cimientos', materiales: [{ nombre: 'Cemento UGC 42.5 kg', cant: 0.35, unidad: 'bolsa', precio: 92 }, { nombre: 'Arena de río', cant: 0.6, unidad: 'm³', precio: 145 }, { nombre: 'Piedrín 3/4"', cant: 0.8, unidad: 'm³', precio: 195 }] },
    { codigo: 'ACERO-001', nombre: 'Acero de refuerzo', materiales: [{ nombre: 'Hierro 3/8" grado 40', cant: 1, unidad: 'qq', precio: 285 }, { nombre: 'Alambre de amarre', cant: 0.05, unidad: 'qq', precio: 320 }] },
    { codigo: 'MAMP-001', nombre: 'Muro de block 0.15', materiales: [{ nombre: 'Block 0.15x0.20x0.40', cant: 57, unidad: 'u', precio: 5.5 }, { nombre: 'Mortero', cant: 0.015, unidad: 'm³', precio: 350 }] },
    { codigo: 'ENCOF-001', nombre: 'Encofrado de losa', materiales: [{ nombre: 'Madera pino formaleta', cant: 2.5, unidad: 'pt', precio: 8.5 }, { nombre: 'Clavos de 2.5"', cant: 0.1, unidad: 'kg', precio: 12 }] },
  ];

  const renderPlantillas = () => (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold text-foreground">📋 Plantillas de Sub-Renglones</h2>
        <p className="text-xs text-muted-foreground">Plantillas predefinidas para carga rápida</p>
      </div>
      <div className="grid gap-3">
        {PLANTILLAS_BASE.map(({ codigo, nombre, materiales }) => (
          <div key={codigo} className="border border-border rounded-lg p-3 bg-card">
            <div className="flex justify-between items-center mb-2">
              <span className="font-semibold text-sm text-foreground">{codigo} — {nombre}</span>
              <button onClick={() => {
                materiales.forEach(m => addPlantilla({ renglonCodigo: codigo, renglonNombre: nombre, nombreMaterial: m.nombre, unidad: m.unidad, cantidadUnitaria: m.cant, precioReferencia: m.precio }));
              }} className="bg-success text-success-foreground px-2 py-1 rounded-lg text-xs hover:bg-success/90">➕ Cargar</button>
            </div>
            <div className="grid gap-1 text-xs">
              {materiales.map((m, i) => (
                <div key={i} className="flex items-center justify-between p-1.5 bg-muted rounded-lg">
                  <span className="flex-1">{m.nombre}</span>
                  <span className="w-20 text-right font-mono">{m.cant} {m.unidad}</span>
                  <span className="w-20 text-right font-mono text-muted-foreground">Q{m.precio}/u</span>
                  <span className="w-20 text-right font-mono text-success">Q{(m.cant * m.precio).toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      {plantillas.length > 0 && (
        <div className="mt-4 p-3 bg-info/10 rounded-lg">
          <p className="text-sm font-medium text-info">✅ {plantillas.length} material(es) cargados como plantilla</p>
        </div>
      )}
    </div>
  );

  const renderVales = () => (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold text-foreground">📦 Vales de Salida por Renglón</h2>
        <button onClick={() => {
          const nuevo: ValeSalidaRenglon = { id: uid(), valeSalidaId: uid(), renglonId: 'r1', renglonCodigo: 'CON-001', materialId: uid(), materialNombre: 'Cemento UGC', cantidad: 5, unidad: 'bolsa' };
          saveVales([nuevo, ...vales]);
        }} className="bg-primary text-primary-foreground px-3 py-1.5 rounded-lg text-xs hover:bg-primary/90 font-medium">+ Simular Vale</button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted">
              <th className="p-2 text-left">Renglón</th>
              <th className="p-2 text-left">Material</th>
              <th className="p-2 text-right">Cantidad</th>
              <th className="p-2 text-left">Unidad</th>
            </tr>
          </thead>
          <tbody>
            {vales.map(v => (
              <tr key={v.id} className="border-t hover:bg-muted/50">
                <td className="p-2 text-xs font-mono">{v.renglonCodigo}</td>
                <td className="p-2">{v.materialNombre}</td>
                <td className="p-2 text-right font-mono">{v.cantidad}</td>
                <td className="p-2 text-xs">{v.unidad}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {vales.length === 0 && <p className="text-muted-foreground text-sm text-center py-8">No hay vales por renglón</p>}
    </div>
  );

  return (
    <div className="p-4 sm:p-6 max-w-[1600px] mx-auto">
      <h1 className="text-2xl font-black text-foreground mb-4">⛏️ Rendimiento de Campo</h1>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-muted p-1 rounded-lg overflow-x-auto">
        {[
          { key: 'destajos',   label: '🏗️ Destajos' },
          { key: 'capturas',   label: '📊 Rendimiento' },
          { key: 'plantillas', label: '📋 Plantillas' },
          { key: 'vales',      label: '📦 Vales x Renglón' },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key as typeof tab)}
            className={`shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === t.key ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-card/50'
            }`}>{t.label}</button>
        ))}
      </div>

      {tab === 'destajos'   && renderDestajos()}
      {tab === 'capturas'   && renderCapturas()}
      {tab === 'plantillas' && renderPlantillas()}
      {tab === 'vales'      && renderVales()}
    </div>
  );
};

export default RendimientoCampo;
