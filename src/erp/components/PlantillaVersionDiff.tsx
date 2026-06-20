import React, { useMemo } from 'react';
import { ArrowRight, Plus, Minus, Edit3 } from 'lucide-react';

interface PlantillaVersionDiffProps {
  versionAnterior: any;
  versionActual: any;
}

interface DiffChange {
  tipo: 'agregado' | 'eliminado' | 'modificado' | 'sin_cambio';
  campo: string;
  valorAnterior?: any;
  valorNuevo?: any;
}

const PlantillaVersionDiff: React.FC<PlantillaVersionDiffProps> = ({ versionAnterior, versionActual }) => {
  const cambios = useMemo(() => {
    const diffs: DiffChange[] = [];

    const camposNumericos = ['version', 'usosCount'];
    const camposTexto = ['nombre', 'descripcion', 'categoria', 'clienteId', 'clienteNombre', 'estado'];
    const camposArray = ['estructuraPresupuesto', 'hitosTemplate', 'riesgosTemplate', 'checklistCalidad'];
    const camposObjeto = ['configuracion', 'metricas'];

    const esIgual = (a: any, b: any) => JSON.stringify(a) === JSON.stringify(b);

    camposNumericos.forEach(campo => {
      const valA = versionAnterior[campo];
      const valB = versionActual[campo];
      if (valA !== valB) {
        diffs.push({
          tipo: valA === undefined ? 'agregado' : 'modificado',
          campo,
          valorAnterior: valA,
          valorNuevo: valB,
        });
      }
    });

    camposTexto.forEach(campo => {
      const valA = versionAnterior[campo];
      const valB = versionActual[campo];
      if (!esIgual(valA, valB)) {
        diffs.push({
          tipo: valA === undefined ? 'agregado' : valB === undefined ? 'eliminado' : 'modificado',
          campo,
          valorAnterior: valA,
          valorNuevo: valB,
        });
      }
    });

    camposArray.forEach(campo => {
      const arrA = versionAnterior[campo] || [];
      const arrB = versionActual[campo] || [];
      
      if (arrA.length !== arrB.length) {
        diffs.push({
          tipo: 'modificado',
          campo,
          valorAnterior: `${arrA.length} items`,
          valorNuevo: `${arrB.length} items`,
        });
      } else {
        for (let i = 0; i < arrA.length; i++) {
          if (!esIgual(arrA[i], arrB[i])) {
            diffs.push({
              tipo: 'modificado',
              campo: `${campo}[${i}]`,
              valorAnterior: arrA[i],
              valorNuevo: arrB[i],
            });
          }
        }
      }
    });

    camposObjeto.forEach(campo => {
      const valA = versionAnterior[campo];
      const valB = versionActual[campo];
      if (!esIgual(valA, valB)) {
        diffs.push({
          tipo: valA === undefined ? 'agregado' : valB === undefined ? 'eliminado' : 'modificado',
          campo,
          valorAnterior: valA,
          valorNuevo: valB,
        });
      }
    });

    return diffs.sort((a, b) => {
      const orden = { agregado: 0, modificado: 1, eliminado: 2 };
      return orden[a.tipo] - orden[b.tipo];
    });
  }, [versionAnterior, versionActual]);

  const getDiffColor = (tipo: string) => {
    switch (tipo) {
      case 'agregado': return 'bg-green-50 border-green-200 text-green-700';
      case 'eliminado': return 'bg-red-50 border-red-200 text-red-700';
      case 'modificado': return 'bg-amber-50 border-amber-200 text-amber-700';
      default: return 'bg-gray-50 border-gray-200 text-gray-700';
    }
  };

  const getDiffIcon = (tipo: string) => {
    switch (tipo) {
      case 'agregado': return <Plus className="h-3 w-3" />;
      case 'eliminado': return <Minus className="h-3 w-3" />;
      case 'modificado': return <Edit3 className="h-3 w-3" />;
      default: return null;
    }
  };

  return (
    <div className="space-y-4">
      {cambios.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          No hay cambios entre estas versiones
        </div>
      ) : (
        <div className="space-y-3">
          <div className="text-sm font-medium text-muted-foreground">
            {cambios.length} cambio{cambios.length > 1 ? 's' : ''} detectado{cambios.length > 1 ? 's' : ''}
          </div>
          {cambios.map((cambio, idx) => (
            <div
              key={idx}
              className={`border rounded-lg p-3 ${getDiffColor(cambio.tipo)}`}
            >
              <div className="flex items-center gap-2 mb-2">
                {getDiffIcon(cambio.tipo)}
                <span className="font-medium text-sm capitalize">{cambio.campo}</span>
                <span className="text-xs uppercase px-2 py-0.5 rounded bg-white/50">
                  {cambio.tipo}
                </span>
              </div>
              
              {(cambio.valorAnterior !== undefined || cambio.valorNuevo !== undefined) && (
                <div className="flex items-start gap-2 text-xs">
                  {cambio.valorAnterior !== undefined && (
                    <div className="flex-1">
                      <span className="text-muted-foreground">Anterior:</span>
                      <div className="bg-white/50 p-1.5 rounded mt-1 font-mono overflow-auto max-h-20">
                        {typeof cambio.valorAnterior === 'object'
                          ? JSON.stringify(cambio.valorAnterior, null, 2)
                          : String(cambio.valorAnterior)}
                      </div>
                    </div>
                  )}
                  {cambio.valorAnterior !== undefined && cambio.valorNuevo !== undefined && (
                    <ArrowRight className="h-4 w-4 flex-shrink-0 mt-3" />
                  )}
                  {cambio.valorNuevo !== undefined && (
                    <div className="flex-1">
                      <span className="text-muted-foreground">Nuevo:</span>
                      <div className="bg-white/50 p-1.5 rounded mt-1 font-mono overflow-auto max-h-20">
                        {typeof cambio.valorNuevo === 'object'
                          ? JSON.stringify(cambio.valorNuevo, null, 2)
                          : String(cambio.valorNuevo)}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PlantillaVersionDiff;
