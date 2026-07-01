import React, { useState, useMemo } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Bar, Pie, Column } from '@ant-design/plots';
import { obtenerHistorialCalculos } from '../services/motorCalculo';
import { listarNormativas } from '../services/normativaDepartamental';
import { listarEscalasProduccion } from '../services/escalasProduccion';
import { listarEstacionalidad } from '../services/estacionalidad';
import { useErpStore } from '@/erp/zustandStore';
import { safeLogger } from '@/lib/safeLogger';

interface CalculoRegistro {
  tipoCalculo: string;
  fechaCalculo?: string;
  versionCalculo?: number;
  resultados?: { costo_total?: number };
}

interface NormativaRegistro {
  departamentoCodigo: string;
}

interface EscalaRegistro {
  rangoTamano: string;
  tipoProyecto: string;
  factorEconomia: number;
}

interface EstacionalidadRegistro {
  mes: string;
  factor: number;
}

interface EscalaFolded {
  tipoProyecto: string;
  rango: string;
  valor: number;
}

const AnalisisCostosDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<'30d' | '90d' | '180d'>('30d');

  const [calculos, setCalculos] = useState<CalculoRegistro[]>([]);
  const [normativas, setNormativas] = useState<NormativaRegistro[]>([]);
  const [escalas, setEscalas] = useState<EscalaRegistro[]>([]);
  const [estacionalidad, setEstacionalidad] = useState<EstacionalidadRegistro[]>([]);

  const costosPorTipo = useMemo(() => {
    const tipos: Record<string, number> = {};
    calculos.forEach(c => {
      const key = c.tipoCalculo || 'desconocido';
      tipos[key] = (tipos[key] || 0) + (c.resultados?.costo_total || 0);
    });
    return Object.entries(tipos).map(([name, value]) => ({ tipo: name, costo: value }));
  }, [calculos]);

  const normativasPorDepartamento = useMemo(() => {
    const deptos: Record<string, number> = {};
    normativas.forEach(n => {
      deptos[n.departamentoCodigo] = (deptos[n.departamentoCodigo] || 0) + 1;
    });
    return Object.entries(deptos).map(([name, value]) => ({ departamento: name, total: value }));
  }, [normativas]);

  const escalasData = useMemo(() => {
    const escalasFolded: EscalaFolded[] = [];
    escalas.forEach(e => {
      if (e.rangoTamano === 'pequeno') escalasFolded.push({ tipoProyecto: e.tipoProyecto, rango: 'Pequeño', valor: e.factorEconomia });
      if (e.rangoTamano === 'mediano') escalasFolded.push({ tipoProyecto: e.tipoProyecto, rango: 'Mediano', valor: e.factorEconomia });
      if (e.rangoTamano === 'grande') escalasFolded.push({ tipoProyecto: e.tipoProyecto, rango: 'Grande', valor: e.factorEconomia });
    });
    return escalasFolded;
  }, [escalas]);

  const proyectos = useErpStore(s => s.proyectos);

  React.useEffect(() => {
    async function cargarDatos() {
      try {
        setLoading(true);

        const proyectoId = proyectos.length > 0 ? proyectos[0].id : 'default';

        const [calcData, normData, escData, estData] = await Promise.allSettled([
          obtenerHistorialCalculos(proyectoId),
          listarNormativas(),
          listarEscalasProduccion(),
          listarEstacionalidad()
        ]);

        if (calcData.status === 'fulfilled') setCalculos(calcData.value);
        if (normData.status === 'fulfilled') setNormativas(normData.value);
        if (escData.status === 'fulfilled') setEscalas(escData.value);
        if (estData.status === 'fulfilled') setEstacionalidad(estData.value);
      } catch (error) {
        safeLogger.error(new Error('Error al cargar datos del dashboard: ' + (error as Error).message));
      } finally {
        setLoading(false);
      }
    }

    cargarDatos();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 rounded-xl" />)}
        </div>
        <Skeleton className="h-80 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard de Análisis de Costos</h1>
          <p className="text-sm text-muted-foreground">Análisis detallado del Motor de Cálculo Avanzado APU</p>
        </div>
        <select
          value={selectedPeriod}
          onChange={e => setSelectedPeriod(e.target.value as '30d' | '90d' | '180d')}
          className="px-3 py-2 rounded-lg border border-input bg-background text-sm"
        >
          <option value="30d">Últimos 30 días</option>
          <option value="90d">Últimos 90 días</option>
          <option value="180d">Últimos 180 días</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-xl border border-blue-200 dark:border-blue-800">
          <div className="text-xs font-medium text-blue-600 dark:text-blue-400 mb-1">Total Cálculos</div>
          <div className="text-2xl font-bold text-foreground">{calculos.length}</div>
          <div className="text-xs text-muted-foreground mt-1">Motores de cálculo ejecutados</div>
        </div>

        <div className="bg-emerald-50 dark:bg-emerald-950 p-4 rounded-xl border border-emerald-200 dark:border-emerald-800">
          <div className="text-xs font-medium text-emerald-600 dark:text-emerald-400 mb-1">Normativas Disponibles</div>
          <div className="text-2xl font-bold text-foreground">{normativas.length}</div>
          <div className="text-xs text-muted-foreground mt-1">Normas departamentales cargadas</div>
        </div>

        <div className="bg-purple-50 dark:bg-purple-950 p-4 rounded-xl border border-purple-200 dark:border-purple-800">
          <div className="text-xs font-medium text-purple-600 dark:text-purple-400 mb-1">Escalas de Producción</div>
          <div className="text-2xl font-bold text-foreground">{escalas.length}</div>
          <div className="text-xs text-muted-foreground mt-1">Rangos de tamaño configurados</div>
        </div>

        <div className="bg-amber-50 dark:bg-amber-950 p-4 rounded-xl border border-amber-200 dark:border-amber-800">
          <div className="text-xs font-medium text-amber-600 dark:text-amber-400 mb-1">Factores Estacionales</div>
          <div className="text-2xl font-bold text-foreground">{estacionalidad.length}</div>
          <div className="text-xs text-muted-foreground mt-1">Meses × Departamentos</div>
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-border">
        <h3 className="text-sm font-semibold text-foreground mb-4">Distribución de Costos por Tipo de Cálculo</h3>
        <div style={{ height: 320 }}>
          <Column
            data={costosPorTipo}
            xField="tipo"
            yField="costo"
            color="#8884d8"
            label={{
              position: 'middle',
              style: {
                fill: '#FFFFFF',
                opacity: 0.6,
              },
            }}
            xAxis={{
              label: {
                autoHide: true,
                autoRotate: false,
              },
            }}
            meta={{
              tipo: { alias: 'Tipo de Cálculo' },
              costo: { alias: 'Costo (Q)', formatter: (v) => `Q${v?.toLocaleString()}` },
            }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-border">
          <h3 className="text-sm font-semibold text-foreground mb-4">Normativas por Departamento</h3>
          <div style={{ height: 260 }}>
            <Pie
              data={normativasPorDepartamento}
              angleField="total"
              colorField="departamento"
              radius={0.8}
              label={{
                type: 'outer',
                content: '{name} {percentage}',
              }}
              interactions={[
                {
                  type: 'element-active',
                },
              ]}
            />
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-border">
          <h3 className="text-sm font-semibold text-foreground mb-4">Factores de Escala por Tipo de Proyecto</h3>
          <div style={{ height: 260 }}>
            <Bar
              data={escalasData}
              xField="tipoProyecto"
              yField="valor"
              seriesField="rango"
              isStack
              legend={{ position: 'top' }}
              meta={{
                tipoProyecto: { alias: 'Tipo de Proyecto' },
                valor: { alias: 'Factor' },
              }}
            />
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-border">
        <h3 className="text-sm font-semibold text-foreground mb-4">Resumen de Cálculos Recientes</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 px-3 font-medium text-muted-foreground">Tipo</th>
                <th className="text-left py-2 px-3 font-medium text-muted-foreground">Fecha</th>
                <th className="text-right py-2 px-3 font-medium text-muted-foreground">Versión</th>
                <th className="text-right py-2 px-3 font-medium text-muted-foreground">Costo Total</th>
                <th className="text-center py-2 px-3 font-medium text-muted-foreground">Estado</th>
              </tr>
            </thead>
            <tbody>
              {calculos.slice(0, 10).map((calc, index) => (
                <tr key={index} className="border-b border-border hover:bg-muted/50">
                  <td className="py-2 px-3 text-foreground">{calc.tipoCalculo}</td>
                  <td className="py-2 px-3 text-muted-foreground">{calc.fechaCalculo ? new Date(calc.fechaCalculo).toLocaleDateString() : '-'}</td>
                  <td className="py-2 px-3 text-right text-muted-foreground">{calc.versionCalculo ?? '-'}</td>
                  <td className="py-2 px-3 text-right font-medium text-foreground">
                    Q{((calc.resultados?.costo_total || 0)).toLocaleString()}
                  </td>
                  <td className="py-2 px-3 text-center">
                    {calc.validado ? (
                      <span className="px-2 py-1 bg-emerald-50 text-emerald-600 text-xs rounded-full">Validado</span>
                    ) : (
                      <span className="px-2 py-1 bg-slate-50 text-slate-600 text-xs rounded-full">Pendiente</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AnalisisCostosDashboard;