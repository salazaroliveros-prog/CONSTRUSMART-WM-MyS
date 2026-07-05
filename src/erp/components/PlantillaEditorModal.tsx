import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Package, Clock, AlertCircle, Settings } from 'lucide-react';
import type { Plantilla } from '../store/schemas/plantillas';

interface PlantillaEditorModalProps {
  plantilla: Plantilla;
  onSave: (data: Partial<Plantilla>) => void;
  onClose: () => void;
}

interface RenglonTemplate {
  nombre: string;
  descripcion: string;
  codigo: string;
  unidad: string;
  cantidad: number;
  costoMateriales: number;
  costoManoObra: number;
  costoEquipo: number;
  costoSubcontrato: number;
  tempId?: number;
}

interface HitoTemplate {
  nombre: string;
  descripcion: string;
  diasDesdeInicio: number;
  estado: 'pendiente' | 'en_proceso' | 'completado' | 'retrasado';
  tempId?: number;
}

interface RiesgoTemplate {
  categoria: string;
  descripcion: string;
  nivel: 'bajo' | 'medio' | 'alto';
  mitigation: string;
  tempId?: number;
}

interface ChecklistItem {
  categoria: string;
  item: string;
  requerido: boolean;
  tempId?: number;
}

const PlantillaEditorModal: React.FC<PlantillaEditorModalProps> = ({ plantilla, onSave, onClose }) => {
  const [activeTab, setActiveTab] = useState<'presupuesto' | 'hitos' | 'riesgos' | 'checklist'>('presupuesto');

  const [estructuraPresupuesto, setEstructuraPresupuesto] = useState<RenglonTemplate[]>(
    plantilla.estructuraPresupuesto?.map((r, i: number) => ({ ...r, tempId: i })) || []
  );
  const [hitosTemplate, setHitosTemplate] = useState<HitoTemplate[]>(
    plantilla.hitosTemplate?.map((h, i: number) => ({ ...h, tempId: i })) || []
  );
  const [riesgosTemplate, setRiesgosTemplate] = useState<RiesgoTemplate[]>(
    plantilla.riesgosTemplate?.map((r, i: number) => ({ ...r, tempId: i })) || []
  );
  const [checklistCalidad, setChecklistCalidad] = useState<ChecklistItem[]>(
    plantilla.checklistCalidad?.map((c, i: number) => ({ ...c, tempId: i })) || []
  );

  const [newRenglon, setNewRenglon] = useState({ nombre: '', descripcion: '', codigo: '', unidad: '', cantidad: 0, costoMateriales: 0, costoManoObra: 0, costoEquipo: 0, costoSubcontrato: 0 });
  const [newHito, setNewHito] = useState({ nombre: '', descripcion: '', diasDesdeInicio: 0, estado: 'pendiente' as const });
  const [newRiesgo, setNewRiesgo] = useState({ categoria: '', descripcion: '', nivel: 'medio' as const, mitigation: '' });
  const [newChecklist, setNewChecklist] = useState({ categoria: '', item: '', requerido: true });

  const addRenglon = () => {
    if (newRenglon.nombre && newRenglon.unidad) {
      setEstructuraPresupuesto([...estructuraPresupuesto, { ...newRenglon, tempId: Date.now() }]);
      setNewRenglon({ nombre: '', descripcion: '', codigo: '', unidad: '', cantidad: 0, costoMateriales: 0, costoManoObra: 0, costoEquipo: 0, costoSubcontrato: 0 });
    }
  };

  const addHito = () => {
    if (newHito.nombre) {
      setHitosTemplate([...hitosTemplate, { ...newHito, tempId: Date.now() }]);
      setNewHito({ nombre: '', descripcion: '', diasDesdeInicio: 0, estado: 'pendiente' });
    }
  };

  const addRiesgo = () => {
    if (newRiesgo.categoria && newRiesgo.descripcion) {
      setRiesgosTemplate([...riesgosTemplate, { ...newRiesgo, tempId: Date.now() }]);
      setNewRiesgo({ categoria: '', descripcion: '', nivel: 'medio', mitigation: '' });
    }
  };

  const addChecklist = () => {
    if (newChecklist.categoria && newChecklist.item) {
      setChecklistCalidad([...checklistCalidad, { ...newChecklist, tempId: Date.now() }]);
      setNewChecklist({ categoria: '', item: '', requerido: true });
    }
  };

  const handleSave = () => {
    onSave({
      estructuraPresupuesto: estructuraPresupuesto.map(({ tempId, ...rest }) => rest),
      hitosTemplate: hitosTemplate.map(({ tempId, ...rest }) => rest),
      riesgosTemplate: riesgosTemplate.map(({ tempId, ...rest }) => rest),
      checklistCalidad: checklistCalidad.map(({ tempId, ...rest }) => rest),
    });
  };

  const tabs = [
    { key: 'presupuesto' as const, label: 'Presupuesto', icon: Package },
    { key: 'hitos' as const, label: 'Hitos', icon: Clock },
    { key: 'riesgos' as const, label: 'Riesgos', icon: AlertCircle },
    { key: 'checklist' as const, label: 'Checklist', icon: Settings },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-in fade-in duration-200">
      <div className="bg-background rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in duration-200">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-bold">Editar Estructura: {plantilla.nombre}</h2>
          <button onClick={onClose} className="p-1 hover:bg-muted rounded" aria-label="Cerrar modal">
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <div className="flex border-b">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? 'border-b-2 border-primary text-primary bg-primary/5'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {activeTab === 'presupuesto' && (
            <div className="space-y-4">
              <div className="border rounded-lg p-4 bg-muted/30">
                <h3 className="font-semibold mb-3 text-sm">Agregar Renglón</h3>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <input
                    placeholder="Nombre"
                    value={newRenglon.nombre}
                    onChange={(e) => setNewRenglon({ ...newRenglon, nombre: e.target.value })}
                    className="px-3.5 py-2.5 border rounded text-sm"
                  />
                  <input
                    placeholder="Unidad"
                    value={newRenglon.unidad}
                    onChange={(e) => setNewRenglon({ ...newRenglon, unidad: e.target.value })}
                    className="px-3.5 py-2.5 border rounded text-sm"
                  />
                  <input
                    type="number"
                    placeholder="Cantidad"
                    value={newRenglon.cantidad}
                    onChange={(e) => setNewRenglon({ ...newRenglon, cantidad: Number(e.target.value) })}
                    className="px-3.5 py-2.5 border rounded text-sm"
                  />
                  <button onClick={addRenglon} className="flex items-center justify-center gap-1 px-3 py-1 bg-primary text-primary-foreground rounded text-sm">
                    <Plus className="h-3 w-3" /> Agregar
                  </button>
                </div>
                <textarea
                  placeholder="Descripción (opcional)"
                  value={newRenglon.descripcion}
                  onChange={(e) => setNewRenglon({ ...newRenglon, descripcion: e.target.value })}
                  className="w-full px-3.5 py-2.5 border rounded text-sm resize-none"
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                {estructuraPresupuesto.map((renglon, idx) => (
                  <div key={renglon.tempId} className="flex items-center gap-2 p-3 border rounded hover:bg-muted/50">
                    <div className="flex-1 grid grid-cols-3 gap-2 text-sm">
                      <div className="font-medium">{renglon.nombre}</div>
                      <div>{renglon.unidad}</div>
                      <div>{renglon.cantidad}</div>
                    </div>
                    <button
                      onClick={() => setEstructuraPresupuesto(estructuraPresupuesto.filter((_, i) => i !== idx))}
                      className="p-1 hover:bg-destructive hover:text-destructive-foreground rounded text-destructive"
                      aria-label="Eliminar renglón"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'hitos' && (
            <div className="space-y-4">
              <div className="border rounded-lg p-4 bg-muted/30">
                <h3 className="font-semibold mb-3 text-sm">Agregar Hito</h3>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <input
                    placeholder="Nombre del hito"
                    value={newHito.nombre}
                    onChange={(e) => setNewHito({ ...newHito, nombre: e.target.value })}
                    className="px-3.5 py-2.5 border rounded text-sm"
                  />
                  <input
                    type="number"
                    placeholder="Días desde inicio"
                    value={newHito.diasDesdeInicio}
                    onChange={(e) => setNewHito({ ...newHito, diasDesdeInicio: Number(e.target.value) })}
                    className="px-3.5 py-2.5 border rounded text-sm"
                  />
                </div>
                <textarea
                  placeholder="Descripción (opcional)"
                  value={newHito.descripcion}
                  onChange={(e) => setNewHito({ ...newHito, descripcion: e.target.value })}
                  className="w-full px-3.5 py-2.5 border rounded text-sm resize-none mb-2"
                  rows={2}
                />
                <select
                  value={newHito.estado}
                  onChange={(e) => setNewHito({ ...newHito, estado: e.target.value as any })}
                  className="w-full px-3.5 py-2.5 border rounded text-sm mb-2"
                >
                  <option value="pendiente">Pendiente</option>
                  <option value="en_proceso">En Proceso</option>
                  <option value="completado">Completado</option>
                  <option value="retrasado">Retrasado</option>
                </select>
                <button onClick={addHito} className="flex items-center justify-center gap-1 w-full px-3 py-1 bg-primary text-primary-foreground rounded text-sm">
                  <Plus className="h-3 w-3" /> Agregar Hito
                </button>
              </div>

              <div className="space-y-2">
                {hitosTemplate.map((hito, idx) => (
                  <div key={hito.tempId} className="flex items-center gap-2 p-3 border rounded hover:bg-muted/50">
                    <div className="flex-1 text-sm">
                      <div className="font-medium">{hito.nombre}</div>
                      <div className="text-muted-foreground">Día {hito.diasDesdeInicio} • {hito.estado}</div>
                    </div>
                    <button
                      onClick={() => setHitosTemplate(hitosTemplate.filter((_, i) => i !== idx))}
                      className="p-1 hover:bg-destructive hover:text-destructive-foreground rounded text-destructive"
                      aria-label="Eliminar hito"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'riesgos' && (
            <div className="space-y-4">
              <div className="border rounded-lg p-4 bg-muted/30">
                <h3 className="font-semibold mb-3 text-sm">Agregar Riesgo</h3>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <input
                    placeholder="Categoría"
                    value={newRiesgo.categoria}
                    onChange={(e) => setNewRiesgo({ ...newRiesgo, categoria: e.target.value })}
                    className="px-3.5 py-2.5 border rounded text-sm"
                  />
                  <select
                    value={newRiesgo.nivel}
                    onChange={(e) => setNewRiesgo({ ...newRiesgo, nivel: e.target.value as any })}
                    className="px-3.5 py-2.5 border rounded text-sm"
                  >
                    <option value="bajo">Bajo</option>
                    <option value="medio">Medio</option>
                    <option value="alto">Alto</option>
                  </select>
                </div>
                <textarea
                  placeholder="Descripción del riesgo"
                  value={newRiesgo.descripcion}
                  onChange={(e) => setNewRiesgo({ ...newRiesgo, descripcion: e.target.value })}
                  className="w-full px-3.5 py-2.5 border rounded text-sm resize-none mb-2"
                  rows={2}
                />
                <textarea
                  placeholder="Mitigación (opcional)"
                  value={newRiesgo.mitigation}
                  onChange={(e) => setNewRiesgo({ ...newRiesgo, mitigation: e.target.value })}
                  className="w-full px-3.5 py-2.5 border rounded text-sm resize-none mb-2"
                  rows={2}
                />
                <button onClick={addRiesgo} className="flex items-center justify-center gap-1 w-full px-3 py-1 bg-primary text-primary-foreground rounded text-sm">
                  <Plus className="h-3 w-3" /> Agregar Riesgo
                </button>
              </div>

              <div className="space-y-2">
                {riesgosTemplate.map((riesgo, idx) => (
                  <div key={riesgo.tempId} className="flex items-center gap-2 p-3 border rounded hover:bg-muted/50">
                    <div className="flex-1 text-sm">
                      <div className="font-medium">{riesgo.descripcion}</div>
                      <div className="text-muted-foreground">{riesgo.categoria} • Nivel: {riesgo.nivel}</div>
                    </div>
                    <button
                      onClick={() => setRiesgosTemplate(riesgosTemplate.filter((_, i) => i !== idx))}
                      className="p-1 hover:bg-destructive hover:text-destructive-foreground rounded text-destructive"
                      aria-label="Eliminar riesgo"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'checklist' && (
            <div className="space-y-4">
              <div className="border rounded-lg p-4 bg-muted/30">
                <h3 className="font-semibold mb-3 text-sm">Agregar Item de Checklist</h3>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <input
                    placeholder="Categoría"
                    value={newChecklist.categoria}
                    onChange={(e) => setNewChecklist({ ...newChecklist, categoria: e.target.value })}
                    className="px-3.5 py-2.5 border rounded text-sm"
                  />
                  <div className="flex items-center gap-2 px-3.5 py-2.5 border rounded">
                    <input
                      type="checkbox"
                      checked={newChecklist.requerido}
                      onChange={(e) => setNewChecklist({ ...newChecklist, requerido: e.target.checked })}
                      className="rounded"
                    />
                    <span className="text-sm">Requerido</span>
                  </div>
                </div>
                <input
                  placeholder="Item de calidad"
                  value={newChecklist.item}
                  onChange={(e) => setNewChecklist({ ...newChecklist, item: e.target.value })}
                  className="w-full px-3.5 py-2.5 border rounded text-sm mb-2 resize-none"
                />
                <button onClick={addChecklist} className="flex items-center justify-center gap-1 w-full px-3 py-1 bg-primary text-primary-foreground rounded text-sm">
                  <Plus className="h-3 w-3" /> Agregar Item
                </button>
              </div>

              <div className="space-y-2">
                {checklistCalidad.map((item, idx) => (
                  <div key={item.tempId} className="flex items-center gap-2 p-3 border rounded hover:bg-muted/50">
                    <div className="flex-1 text-sm">
                      <div className="font-medium">{item.item}</div>
                      <div className="text-muted-foreground">{item.categoria} {item.requerido ? '• Requerido' : ''}</div>
                    </div>
                    <button
                      onClick={() => setChecklistCalidad(checklistCalidad.filter((_, i) => i !== idx))}
                      className="p-1 hover:bg-destructive hover:text-destructive-foreground rounded text-destructive"
                      aria-label="Eliminar ítem de checklist"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between p-4 border-t bg-muted/30">
          <div className="text-sm text-muted-foreground">
            {activeTab === 'presupuesto' && `${estructuraPresupuesto.length} renglones`}
            {activeTab === 'hitos' && `${hitosTemplate.length} hitos`}
            {activeTab === 'riesgos' && `${riesgosTemplate.length} riesgos`}
            {activeTab === 'checklist' && `${checklistCalidad.length} items`}
          </div>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 border rounded-md hover:bg-muted text-sm"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 text-sm"
            >
              Guardar Cambios
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlantillaEditorModal;
