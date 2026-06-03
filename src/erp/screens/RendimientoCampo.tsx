import React, { useState } from 'react';
import { useNuevosModulos } from '../hooks/useNuevosModulos';
import { useErp } from '../store';

const uid = () => Math.random().toString(36).substr(2, 9);

export const RendimientoCampo: React.FC = () => {
  const { proyectos, presupuestos } = useErp();
  const {
    destajos, addDestajo, getDestajosByProyecto,
    capturasRendimiento, addCapturaRendimiento, deleteCapturaRendimiento,
    plantillas, addPlantilla, getPlantillasByRenglon,
    valesRenglon, addValeRenglon, getValesByRenglon,
    validarPrecioSubrenglon
  } = useNuevosModulos();

  const [tab, setTab] = useState<'destajos' | 'capturas' | 'plantillas' | 'vales'>('destajos');
  const [proyectoFilter, setProyectoFilter] = useState('');

  const getEficienciaColor = (ef: number) => {
    if (ef >= 90) return 'text-green-600';
    if (ef >= 80) return 'text-yellow-600';
    return 'text-red-600';
  };

  // ---- DESTAJOS ----
  const renderDestajos = () => {
    const destajosFiltrados = proyectoFilter ? getDestajosByProyecto(proyectoFilter) : destajos;
    return (
      <div>
        <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
          <h2 className="text-lg font-bold">🏗️ Destajos — Rendimiento Real</h2>
          <div className="flex gap-2">
            <select value={proyectoFilter} onChange={e => setProyectoFilter(e.target.value)}
              className="text-xs px-2 py-1 border rounded">
              <option value="">Todos los proyectos</option>
              {proyectos.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
            </select>
            <button onClick={() => {
              const proy = proyectos[0];
              if (!proy) return;
              const rendTeorico = Math.round(Math.random() * 50 + 10);
              addDestajo({
                proyectoId: proy.id,
                renglonCodigo: 'EXC-001',
                cuadrilla: '1 Albañil + 1 Ayudante',
                fecha: new Date().toISOString().split('T')[0],
                cantidadEjecutada: Math.round(Math.random() * 20 + 5),
                unidad: 'm³',
                horasTrabajadas: 8,
                rendimientoTeorico: rendTeorico,
                observaciones: 'Destajo registrado desde campo'
              });
            }} className="bg-green-600 text-white px-3 py-1.5 rounded text-xs">+ Registrar Destajo</button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-100">
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
              {destajosFiltrados.map(d => {
                const proy = proyectos.find(p => p.id === d.proyectoId);
                const ef = d.rendimientoTeorico > 0 ? (d.rendimientoReal / d.rendimientoTeorico) * 100 : 0;
                return (
                  <tr key={d.id} className="border-t hover:bg-gray-50">
                    <td className="p-2 text-xs">{proy?.nombre || '—'}</td>
                    <td className="p-2 font-mono text-xs">{d.renglonCodigo}</td>
                    <td className="p-2 text-xs">{d.cuadrilla}</td>
                    <td className="p-2 text-right font-mono">{d.cantidadEjecutada} {d.unidad}</td>
                    <td className="p-2 text-right font-mono">{d.rendimientoReal.toFixed(1)}</td>
                    <td className="p-2 text-right font-mono">{d.rendimientoTeorico}</td>
                    <td className={`p-2 text-right font-bold ${getEficienciaColor(ef)}`}>
                      {ef.toFixed(0)}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {destajosFiltrados.length === 0 && <p className="text-gray-400 text-sm text-center py-8">No hay destajos registrados</p>}
      </div>
    );
  };

  // ---- CAPTURAS DE RENDIMIENTO ----
  const renderCapturas = () => {
    const capturasFiltradas = proyectoFilter ? capturasRendimiento.filter(c => c.proyectoId === proyectoFilter) : capturasRendimiento;
    const promedioEf = capturasFiltradas.length > 0
      ? capturasFiltradas.reduce((a, c) => a + c.eficiencia, 0) / capturasFiltradas.length
      : 0;

    return (
      <div>
        <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
          <h2 className="text-lg font-bold">📊 Captura de Rendimiento Diario</h2>
          <div className="flex gap-2">
            <select value={proyectoFilter} onChange={e => setProyectoFilter(e.target.value)}
              className="text-xs px-2 py-1 border rounded">
              <option value="">Todos</option>
              {proyectos.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
            </select>
            <button onClick={() => {
              const proy = proyectos[0];
              if (!proy) return;
              const teorico = Math.round(Math.random() * 40 + 10);
              const real = Math.round(Math.random() * teorico * 1.2);
              addCapturaRendimiento({
                proyectoId: proy.id,
                renglonCodigo: 'CON-001',
                actividad: 'Concreto en cimientos',
                cuadrilla: '2 Albañiles + 2 Ayudantes',
                fecha: new Date().toISOString().split('T')[0],
                cantidad: real,
                unidad: 'm³',
                horas: 8,
                rendimientoTeorico: teorico,
                observaciones: ''
              });
            }} className="bg-green-600 text-white px-3 py-1.5 rounded text-xs">+ Capturar</button>
          </div>
        </div>

        {capturasFiltradas.length > 0 && (
          <div className="mb-4 grid grid-cols-3 gap-3">
            <div className="p-3 bg-blue-50 rounded-lg text-center">
              <p className="text-xs text-blue-600">Capturas</p>
              <p className="text-xl font-bold text-blue-700">{capturasFiltradas.length}</p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg text-center">
              <p className="text-xs text-green-600">Eficiencia Promedio</p>
              <p className={`text-xl font-bold ${getEficienciaColor(promedioEf)}`}>{promedioEf.toFixed(0)}%</p>
            </div>
            <div className="p-3 bg-purple-50 rounded-lg text-center">
                <p className="text-xs text-purple-600">{'Bajo rendimiento (<80%)'}</p>
              <p className="text-xl font-bold text-purple-700">{capturasFiltradas.filter(c => c.eficiencia < 80).length}</p>
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-100">
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
              {capturasFiltradas.map(c => {
                const alerta = c.eficiencia < 80;
                return (
                  <tr key={c.id} className={`border-t ${alerta ? 'bg-red-50' : 'hover:bg-gray-50'}`}>
                    <td className="p-2 text-xs font-medium">{c.actividad}</td>
                    <td className="p-2 text-xs">{c.cuadrilla}</td>
                    <td className="p-2 text-right font-mono">{c.cantidad} {c.unidad}</td>
                    <td className="p-2 text-right font-mono">{c.rendimientoTeorico}</td>
                    <td className="p-2 text-right font-mono">{c.rendimientoReal.toFixed(1)}</td>
                    <td className={`p-2 text-right font-bold ${getEficienciaColor(c.eficiencia)}`}>
                      {c.eficiencia.toFixed(0)}%
                      {alerta && <span className="ml-1 text-red-500">⚠️</span>}
                    </td>
                    <td className="p-2">
                      <button onClick={() => deleteCapturaRendimiento(c.id)} className="text-red-400 hover:text-red-600 text-xs">🗑</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {capturasFiltradas.length === 0 && <p className="text-gray-400 text-sm text-center py-8">No hay capturas de rendimiento</p>}
      </div>
    );
  };

  // ---- PLANTILLAS SUB-RENGLONES ----
  const renderPlantillas = () => {
    // Pre-built plantillas
    const renglonesMap: Record<string, { nombre: string; materiales: { nombre: string; cant: number; unidad: string; precio: number }[] }> = {
      'CON-001': {
        nombre: 'Concreto en cimientos',
        materiales: [
          { nombre: 'Cemento UGC 42.5 kg', cant: 0.35, unidad: 'bolsa', precio: 92 },
          { nombre: 'Arena de río', cant: 0.6, unidad: 'm³', precio: 145 },
          { nombre: 'Piedrín 3/4"', cant: 0.8, unidad: 'm³', precio: 195 },
        ]
      },
      'ACERO-001': {
        nombre: 'Acero de refuerzo',
        materiales: [
          { nombre: 'Hierro 3/8" grado 40', cant: 1, unidad: 'qq', precio: 285 },
          { nombre: 'Alambre de amarre', cant: 0.05, unidad: 'qq', precio: 320 },
        ]
      },
      'MAMP-001': {
        nombre: 'Muro de block 0.15',
        materiales: [
          { nombre: 'Block 0.15x0.20x0.40', cant: 57, unidad: 'u', precio: 5.5 },
          { nombre: 'Mortero (arena + cemento)', cant: 0.015, unidad: 'm³', precio: 350 },
        ]
      },
      'ENCOF-001': {
        nombre: 'Encofrado de losa',
        materiales: [
          { nombre: 'Madera pino formaleta', cant: 2.5, unidad: 'pt', precio: 8.5 },
          { nombre: 'Clavos de 2.5"', cant: 0.1, unidad: 'kg', precio: 12 },
        ]
      },
    };

    return (
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold">📋 Plantillas de Sub-Renglones</h2>
          <p className="text-xs text-gray-500">Plantillas predefinidas para carga rápida de materiales</p>
        </div>
        <div className="grid gap-3">
          {Object.entries(renglonesMap).map(([codigo, data]) => (
            <div key={codigo} className="border rounded-lg p-3 bg-white">
              <div className="flex justify-between items-center mb-2">
                <span className="font-semibold text-sm">{codigo} — {data.nombre}</span>
                <button onClick={() => {
                  data.materiales.forEach(m => {
                    addPlantilla({
                      renglonCodigo: codigo,
                      renglonNombre: data.nombre,
                      nombreMaterial: m.nombre,
                      unidad: m.unidad,
                      cantidadUnitaria: m.cant,
                      precioReferencia: m.precio
                    });
                  });
                }} className="bg-emerald-500 text-white px-2 py-1 rounded text-xs">➕ Cargar plantilla</button>
              </div>
              <div className="grid gap-1 text-xs">
                {data.materiales.map((m, i) => (
                  <div key={i} className="flex items-center justify-between p-1.5 bg-gray-50 rounded">
                    <span className="flex-1">{m.nombre}</span>
                    <span className="w-16 text-right font-mono">{m.cant} {m.unidad}</span>
                    <span className="w-20 text-right font-mono">Q{m.precio.toFixed(2)}/u</span>
                    <span className="w-20 text-right font-mono text-emerald-600">
                      Q{(m.cant * m.precio).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        {plantillas.length > 0 && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm font-medium text-blue-700">✅ {plantillas.length} material(es) cargados como plantilla</p>
          </div>
        )}
      </div>
    );
  };

  // ---- VALES POR RENGLÓN ----
  const renderVales = () => (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold">📦 Vales de Salida por Renglón</h2>
        <button onClick={() => {
          addValeRenglon({
            valeSalidaId: uid(),
            renglonId: 'r1',
            renglonCodigo: 'CON-001',
            materialId: uid(),
            materialNombre: 'Cemento UGC',
            cantidad: 5,
            unidad: 'bolsa'
          });
        }} className="bg-blue-600 text-white px-3 py-1.5 rounded text-xs">+ Simular Vale</button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2 text-left">Renglón</th>
              <th className="p-2 text-left">Material</th>
              <th className="p-2 text-right">Cantidad</th>
              <th className="p-2 text-left">Unidad</th>
              <th className="p-2"></th>
            </tr>
          </thead>
          <tbody>
            {valesRenglon.map(v => (
              <tr key={v.id} className="border-t hover:bg-gray-50">
                <td className="p-2 text-xs font-mono">{v.renglonCodigo}</td>
                <td className="p-2">{v.materialNombre}</td>
                <td className="p-2 text-right font-mono">{v.cantidad}</td>
                <td className="p-2 text-xs">{v.unidad}</td>
                <td className="p-2"></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {valesRenglon.length === 0 && <p className="text-gray-400 text-sm text-center py-8">No hay vales por renglón</p>}
    </div>
  );

  return (
    <div className="p-4 sm:p-6 max-w-[1600px] mx-auto">
      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b pb-2">
        {[
          { key: 'destajos', label: '🏗️ Destajos' },
          { key: 'capturas', label: '📊 Rendimiento' },
          { key: 'plantillas', label: '📋 Plantillas' },
          { key: 'vales', label: '📦 Vales x Renglón' },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key as any)}
            className={`px-4 py-2 rounded-t text-sm font-medium ${
              tab === t.key ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-500' : 'text-gray-500 hover:text-gray-700'
            }`}>{t.label}</button>
        ))}
      </div>

      {tab === 'destajos' && renderDestajos()}
      {tab === 'capturas' && renderCapturas()}
      {tab === 'plantillas' && renderPlantillas()}
      {tab === 'vales' && renderVales()}
    </div>
  );
};

export default RendimientoCampo;