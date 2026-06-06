import React, { useState } from 'react';
import { Calculator, Ruler, Weight, Square, Box, Trash2, Plus, Download } from 'lucide-react';
import { CARD, CARD_TITLE } from '../ui';
import { fmtNum } from '../utils';
import { toast } from 'sonner';

type TipoElemento = 'concreto' | 'acero' | 'mamposteria' | 'encofrado' | 'excavacion';

interface ResultadoCubicacion {
  id: string;
  tipo: TipoElemento;
  nombre: string;
  formula: string;
  cantidad: number;
  unidad: string;
  desperdicio: number;
  cantidadFinal: number;
}

interface Parametros {
  largo: number;
  ancho: number;
  alto: number;
  cantidad: number;
  desperdicio: number;
  // Acero
  diametro?: number;
  pesoUnitario?: number;
  longitudBarra?: number;
  // Mampostería
  factorPiezas?: number;
  // Excavación
  factorExpansion?: number;
}

const TIPOS: { id: TipoElemento; label: string; icon: React.ReactNode; unidad: string; formula: string }[] = [
  { id: 'concreto', label: 'Concreto', icon: <Box className="w-4 h-4" />, unidad: 'm³', formula: 'largo × ancho × alto × (1 + desperdicio/100)' },
  { id: 'acero', label: 'Acero', icon: <Weight className="w-4 h-4" />, unidad: 'kg', formula: '∅² × cantidad × longitud × peso unitario' },
  { id: 'mamposteria', label: 'Mampostería', icon: <Square className="w-4 h-4" />, unidad: 'm²', formula: 'largo × alto × factor piezas × (1 + desperdicio/100)' },
  { id: 'encofrado', label: 'Encofrado', icon: <Ruler className="w-4 h-4" />, unidad: 'm²', formula: 'largo × alto (área de contacto)' },
  { id: 'excavacion', label: 'Excavación', icon: <Calculator className="w-4 h-4" />, unidad: 'm³', formula: 'largo × ancho × alto × factor expansión' },
];

// Pesos unitarios de acero (kg/ml) por diámetro
const PESOS_ACERO: Record<number, number> = {
  8: 0.395, 10: 0.617, 12: 0.888, 16: 1.578, 20: 2.466, 25: 3.853, 32: 6.313,
};

const CubicacionAutomatica: React.FC = () => {
  const [tipo, setTipo] = useState<TipoElemento>('concreto');
  const [params, setParams] = useState<Parametros>({ largo: 0, ancho: 0, alto: 0, cantidad: 1, desperdicio: 5 });
  const [resultados, setResultados] = useState<ResultadoCubicacion[]>([]);
  const [nombre, setNombre] = useState('');

  const updateParam = (key: keyof Parametros, value: number) => {
    setParams(prev => ({ ...prev, [key]: value }));
  };

  const calcular = (): { cantidad: number; unidad: string; formula: string } => {
    const { largo, ancho, alto, cantidad, desperdicio, factorExpansion, factorPiezas, diametro, pesoUnitario, longitudBarra } = params;

    switch (tipo) {
      case 'concreto': {
        const vol = (largo || 0) * (ancho || 0) * (alto || 0) * (cantidad || 1);
        const conDesperdicio = vol * (1 + (desperdicio || 0) / 100);
        return { cantidad: conDesperdicio, unidad: 'm³', formula: `${largo} × ${ancho} × ${alto} × ${cantidad} × ${1 + desperdicio / 100}` };
      }
      case 'acero': {
        const diam = diametro || 12;
        const _peso = pesoUnitario || PESOS_ACERO[diam] || 0.888;
        const long = longitudBarra || 6;
        const _total = Math.PI * Math.pow(diam / 1000, 2) / 4 * long * (cantidad || 1) * 7850;
        // Usar fórmula simplificada: peso = diam² × cantidad × longitud × 0.006165
        const totalSimple = Math.pow(diam / 10, 2) * (cantidad || 1) * long * 0.6165 / 10;
        return { cantidad: totalSimple, unidad: 'kg', formula: `∅${diam}² × ${cantidad} × ${long}m × 0.006165` };
      }
      case 'mamposteria': {
        const area = (largo || 0) * (alto || 0);
        const piezas = area * (factorPiezas || 12.5); // 12.5 piezas/m² típico para block
        const conDesp = piezas * (1 + (desperdicio || 5) / 100);
        return { cantidad: conDesp, unidad: 'piezas', formula: `${largo} × ${alto} × ${factorPiezas || 12.5} piezas/m² × ${1 + desperdicio / 100}` };
      }
      case 'encofrado': {
        const areaContacto = (largo || 0) * (alto || 0) * 2 + (ancho || 0) * (alto || 0) * 2;
        return { cantidad: areaContacto * (cantidad || 1), unidad: 'm²', formula: `2(${largo}×${alto} + ${ancho}×${alto}) × ${cantidad}` };
      }
      case 'excavacion': {
        const vol = (largo || 0) * (ancho || 0) * (alto || 0) * (factorExpansion || 1.15);
        return { cantidad: vol * (cantidad || 1), unidad: 'm³', formula: `${largo} × ${ancho} × ${alto} × ${factorExpansion || 1.15} (expansión)` };
      }
      default:
        return { cantidad: 0, unidad: '', formula: '' };
    }
  };

  const agregarResultado = () => {
    const res = calcular();
    if (res.cantidad <= 0) {
      toast.error('Ingresa dimensiones válidas para calcular');
      return;
    }
    const nuevo: ResultadoCubicacion = {
      id: crypto.randomUUID(),
      tipo,
      nombre: nombre || `${TIPOS.find(t => t.id === tipo)?.label} #${resultados.length + 1}`,
      formula: res.formula,
      cantidad: res.cantidad,
      unidad: res.unidad,
      desperdicio: params.desperdicio || 0,
      cantidadFinal: res.cantidad,
    };
    setResultados(prev => [...prev, nuevo]);
    toast.success(`${nuevo.nombre}: ${fmtNum(nuevo.cantidad)} ${nuevo.unidad}`);
    setNombre('');
  };

  const eliminarResultado = (id: string) => {
    setResultados(prev => prev.filter(r => r.id !== id));
  };

  const limpiarTodo = () => {
    setResultados([]);
    setParams({ largo: 0, ancho: 0, alto: 0, cantidad: 1, desperdicio: 5 });
  };

  const exportarResultados = () => {
    if (resultados.length === 0) return;
    const csv = [
      'Tipo,Nombre,Cantidad,Unidad,Fórmula',
      ...resultados.map(r => `${r.tipo},${r.nombre},${r.cantidad.toFixed(2)},${r.unidad},"${r.formula}"`),
    ].join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `cubicacion_${new Date().toISOString().slice(0, 10)}.csv`; a.click();
    URL.revokeObjectURL(url);
    toast.success('Cubicación exportada a CSV');
  };

  const totalGeneral = resultados.reduce((sum, r) => sum + r.cantidad, 0);

  return (
    <div className={`${CARD}`}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className={`${CARD_TITLE}`}>
            <Calculator className="w-5 h-5 text-blue-500" /> Cubicación Automática
          </h3>
          <p className="text-xs text-slate-500 mt-1">Calcula cantidades de materiales desde las dimensiones de obra</p>
        </div>
        {resultados.length > 0 && (
          <div className="flex gap-2">
            <button onClick={exportarResultados} className="text-xs bg-emerald-100 text-emerald-600 px-2 py-1 rounded-lg hover:bg-emerald-200">
              <Download className="w-3 h-3 inline mr-1" /> Exportar CSV
            </button>
            <button onClick={limpiarTodo} className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-lg hover:bg-red-200">
              Limpiar todo
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Formulario de cálculo */}
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
          <div className="mb-3">
            <label className="text-xs font-semibold text-slate-500 block mb-1">Tipo de elemento</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {TIPOS.map(t => (
                <button
                  key={t.id}
                  onClick={() => setTipo(t.id)}
                  className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    tipo === t.id ? 'bg-blue-500 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:border-blue-300'
                  }`}
                >
                  {t.icon} {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-3">
            <label className="text-xs font-semibold text-slate-500 block mb-1">Nombre (opcional)</label>
            <input
              type="text"
              value={nombre}
              onChange={e => setNombre(e.target.value)}
              placeholder={`Ej. Zapata #1, Viga principal...`}
              className="w-full px-2 py-1.5 rounded-lg border border-slate-200 text-xs outline-none focus:border-blue-400"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-3">
            <div>
              <label className="text-[10px] text-slate-500 block">Largo (m)</label>
              <input type="number" value={params.largo || ''} onChange={e => updateParam('largo', +e.target.value)} placeholder="0" className="w-full px-2 py-1 rounded border border-slate-200 text-xs text-right" />
            </div>
            <div>
              <label className="text-[10px] text-slate-500 block">Ancho (m)</label>
              <input type="number" value={params.ancho || ''} onChange={e => updateParam('ancho', +e.target.value)} placeholder="0" className="w-full px-2 py-1 rounded border border-slate-200 text-xs text-right" />
            </div>
            <div>
              <label className="text-[10px] text-slate-500 block">Alto (m)</label>
              <input type="number" value={params.alto || ''} onChange={e => updateParam('alto', +e.target.value)} placeholder="0" className="w-full px-2 py-1 rounded border border-slate-200 text-xs text-right" />
            </div>
          </div>

          {/* Parámetros específicos por tipo */}
          {tipo === 'acero' && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-3">
              <div>
                <label className="text-[10px] text-slate-500 block">∅ (mm)</label>
                <select value={params.diametro || 12} onChange={e => updateParam('diametro', +e.target.value)} className="w-full px-2 py-1 rounded border border-slate-200 text-xs">
                  {Object.keys(PESOS_ACERO).map(d => <option key={d} value={d}>∅{d}mm</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] text-slate-500 block">Cant. barras</label>
                <input type="number" value={params.cantidad || 1} onChange={e => updateParam('cantidad', +e.target.value)} min={1} className="w-full px-2 py-1 rounded border border-slate-200 text-xs text-right" />
              </div>
              <div>
                <label className="text-[10px] text-slate-500 block">Long (m)</label>
                <input type="number" value={params.longitudBarra || 6} onChange={e => updateParam('longitudBarra', +e.target.value)} className="w-full px-2 py-1 rounded border border-slate-200 text-xs text-right" />
              </div>
            </div>
          )}

          {(tipo === 'concreto' || tipo === 'mamposteria') && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
              <div>
                <label className="text-[10px] text-slate-500 block">Cantidad</label>
                <input type="number" value={params.cantidad || 1} onChange={e => updateParam('cantidad', +e.target.value)} min={1} className="w-full px-2 py-1 rounded border border-slate-200 text-xs text-right" />
              </div>
              <div>
                <label className="text-[10px] text-slate-500 block">Desperdicio %</label>
                <input type="number" value={params.desperdicio || 5} onChange={e => updateParam('desperdicio', +e.target.value)} min={0} max={20} className="w-full px-2 py-1 rounded border border-slate-200 text-xs text-right" />
              </div>
            </div>
          )}

          {tipo === 'mamposteria' && (
            <div className="mb-3">
              <label className="text-[10px] text-slate-500 block">Factor piezas/m²</label>
              <input type="number" value={params.factorPiezas || 12.5} onChange={e => updateParam('factorPiezas', +e.target.value)} className="w-full px-2 py-1 rounded border border-slate-200 text-xs text-right" />
              <p className="text-[9px] text-slate-400 mt-0.5">Block: 12.5, Ladrillo: 60, Tabla yeso: 2.5</p>
            </div>
          )}

          {tipo === 'excavacion' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
              <div>
                <label className="text-[10px] text-slate-500 block">Factor expansión</label>
                <input type="number" value={params.factorExpansion || 1.15} onChange={e => updateParam('factorExpansion', +e.target.value)} step={0.05} min={1} className="w-full px-2 py-1 rounded border border-slate-200 text-xs text-right" />
              </div>
              <div>
                <label className="text-[10px] text-slate-500 block">Cantidad</label>
                <input type="number" value={params.cantidad || 1} onChange={e => updateParam('cantidad', +e.target.value)} min={1} className="w-full px-2 py-1 rounded border border-slate-200 text-xs text-right" />
              </div>
            </div>
          )}

          <button onClick={agregarResultado} className="w-full bg-blue-500 text-white px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 hover:bg-blue-600">
            <Plus className="w-3.5 h-3.5" /> Agregar a lista de cubicación
          </button>

          <div className="mt-2 p-2 bg-blue-50 rounded-lg border border-blue-200">
            <div className="text-[10px] text-slate-500">Fórmula: <span className="font-mono text-blue-700">{TIPOS.find(t => t.id === tipo)?.formula}</span></div>
            <div className="text-[9px] text-slate-400 mt-0.5">{TIPOS.find(t => t.id === tipo)?.label} — {TIPOS.find(t => t.id === tipo)?.unidad}</div>
          </div>
        </div>

        {/* Resultados */}
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex justify-between items-center mb-3">
            <h4 className="text-sm font-bold text-slate-700">Resultados ({resultados.length})</h4>
            {resultados.length > 0 && (
              <div className="text-xs font-bold text-blue-600">
                Total: {fmtNum(totalGeneral)} unidades
              </div>
            )}
          </div>

          {resultados.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-slate-300">
              <Calculator className="w-10 h-10 mb-2" />
              <p className="text-xs text-slate-400">Calcula elementos y agrégalos aquí</p>
              <p className="text-[10px] text-slate-300 mt-1">Usa el formulario de la izquierda</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {resultados.map((r, idx) => (
                <div key={r.id} className="flex items-start gap-2 p-2 bg-slate-50 rounded-lg border border-slate-100 group">
                  <div className="shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-[10px] font-bold">
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-slate-700 truncate">{r.nombre}</div>
                    <div className="text-[10px] text-slate-400">{r.tipo}</div>
                    <div className="text-[9px] text-slate-400 truncate font-mono">{r.formula}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-sm font-bold text-blue-600">{fmtNum(r.cantidad)}</div>
                    <div className="text-[10px] text-slate-400">{r.unidad}</div>
                  </div>
                  <button onClick={() => eliminarResultado(r.id)} className="p-1 rounded text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CubicacionAutomatica;