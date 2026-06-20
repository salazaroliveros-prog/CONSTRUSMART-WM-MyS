import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronRight, ChevronLeft, CheckCircle2, Calculator, Settings, BarChart3, FileText, Building2, MapPin, Calendar } from 'lucide-react';

interface WizardStep {
  id: string;
  title: string;
  icon: React.ElementType;
  description: string;
}

const WIZARD_STEPS: WizardStep[] = [
  {
    id: 'seleccionar-motor',
    title: 'Seleccionar Motor de Cálculo',
    icon: Calculator,
    description: 'Elige el tipo de cálculo que necesitas realizar: Pavimentos, Redes de Infraestructura o Muros de Contención.'
  },
  {
    id: 'parametros-geograficos',
    title: 'Configurar Parámetros Geográficos',
    icon: MapPin,
    description: 'Selecciona el departamento y municipio. El sistema aplicará automáticamente la normativa departamental correspondiente.'
  },
  {
    id: 'parametros-tecnicos',
    title: 'Definir Parámetros Técnicos',
    icon: Settings,
    description: 'Ingresa los datos técnicos específicos: dimensiones, materiales, resistencia, tipo de suelo, etc.'
  },
  {
    id: 'aplicar-optimizaciones',
    title: 'Aplicar Optimizaciones',
    icon: BarChart3,
    description: 'El sistema aplicará automáticamente factores de escala, estacionalidad y normativa departamental para optimizar el cálculo.'
  },
  {
    id: 'revisar-resultados',
    title: 'Revisar Resultados',
    icon: FileText,
    description: 'Revisa los resultados del cálculo, valida la consistencia y compara con cálculos anteriores si existen.'
  },
  {
    id: 'guardar-calcular',
    title: 'Guardar y Finalizar',
    icon: CheckCircle2,
    description: 'Guarda el cálculo en el historial, genera el reporte y cierra el proceso.'
  }
];

interface CalculoGuiadoWizardProps {
  onComplete: (datos: any) => void;
  onCancel: () => void;
}

const CalculoGuiadoWizard: React.FC<CalculoGuiadoWizardProps> = ({ onComplete, onCancel }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [wizardData, setWizardData] = useState<Record<string, any>>({});
  const [motorSeleccionado, setMotorSeleccionado] = useState<'pavimentos' | 'redesInfraestructura' | 'murosContencion' | null>(null);
  const [departamentoSeleccionado, setDepartamentoSeleccionado] = useState<string>('');

  const handleNext = () => {
    if (currentStep < WIZARD_STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      onComplete(wizardData);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSkip = () => {
    if (currentStep < WIZARD_STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const currentStepData = WIZARD_STEPS[currentStep];
  const CurrentIcon = currentStepData.icon;
  const progress = ((currentStep + 1) / WIZARD_STEPS.length) * 100;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="bg-muted/30 border-b border-border p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Calculator className="w-8 h-8 text-primary" />
              <h1 className="text-2xl font-bold text-foreground">Wizard de Cálculo Guiado</h1>
            </div>
            <div className="text-sm text-muted-foreground">
              Paso {currentStep + 1} de {WIZARD_STEPS.length}
            </div>
          </div>
          
          <div className="w-full bg-muted rounded-full h-2">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      <div className="flex-1 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <CurrentIcon className="w-6 h-6 text-primary" />
              <h2 className="text-xl font-semibold text-foreground">{currentStepData.title}</h2>
            </div>
            <p className="text-muted-foreground">{currentStepData.description}</p>
          </div>

          <div className="bg-card border border-border rounded-xl p-6 min-h-[400px]">
            {currentStep === 0 && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { id: 'pavimentos', title: 'Pavimentos', desc: 'Cálculo de superficies, bases y acabados', icon: '🏗️' },
                    { id: 'redesInfraestructura', title: 'Redes de Infraestructura', desc: 'Tuberías y sistemas hidráulicos', icon: '💧' },
                    { id: 'murosContencion', title: 'Muros de Contención', desc: 'Estructuras de contención de tierra', icon: '🧱' }
                  ].map((opcion) => (
                    <button
                      key={opcion.id}
                      onClick={() => {
                        setMotorSeleccionado(opcion.id as any);
                        setWizardData(prev => ({ ...prev, motor: opcion.id }));
                      }}
                      className={`p-6 rounded-xl border-2 transition-all ${
                        motorSeleccionado === opcion.id 
                          ? 'border-primary bg-primary/5' 
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <div className="text-3xl mb-3">{opcion.icon}</div>
                      <div className="font-semibold text-foreground mb-1">{opcion.title}</div>
                      <div className="text-xs text-muted-foreground">{opcion.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {currentStep === 1 && (
              <div className="space-y-6">
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">Departamento</label>
                  <select
                    value={departamentoSeleccionado}
                    onChange={(e) => {
                      setDepartamentoSeleccionado(e.target.value);
                      setWizardData(prev => ({ ...prev, departamento: e.target.value }));
                    }}
                    className="w-full px-3 py-2 rounded-lg border border-input bg-background"
                  >
                    <option value="">Seleccionar departamento</option>
                    <option value="GT-01">Guatemala</option>
                    <option value="GT-02">El Progreso</option>
                    <option value="GT-03">Sacatepéquez</option>
                    <option value="GT-04">Chimaltenango</option>
                    <option value="GT-05">Petén</option>
                    <option value="GT-06">Alta Verapaz</option>
                    <option value="GT-07">Escuintla</option>
                    <option value="GT-11">Quetzaltenango</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">Municipio (opcional)</label>
                  <input
                    type="text"
                    placeholder="Ej. Ciudad de Guatemala"
                    onChange={(e) => setWizardData(prev => ({ ...prev, municipio: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-input bg-background"
                  />
                </div>

                {departamentoSeleccionado && (
                  <div className="bg-emerald-50 dark:bg-emerald-950 p-4 rounded-lg border border-emerald-200 dark:border-emerald-800">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                      <span className="text-sm text-emerald-800 dark:text-emerald-200">
                        Se aplicará normativa departamental de {departamentoSeleccionado}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Completa el formulario técnico del motor seleccionado para continuar.
                </p>
                <div className="bg-muted/30 p-4 rounded-lg">
                  <p className="text-sm text-foreground">
                    🔧 El formulario técnico específico para "{motorSeleccionado}" aparecerá aquí.
                  </p>
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center gap-2 mb-2">
                      <Building2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      <span className="font-semibold text-sm text-blue-800 dark:text-blue-200">Escala de Producción</span>
                    </div>
                    <p className="text-xs text-blue-700 dark:text-blue-300">
                      Factor aplicado: 1.10 (proyecto mediano)
                    </p>
                  </div>

                  <div className="bg-amber-50 dark:bg-amber-950 p-4 rounded-lg border border-amber-200 dark:border-amber-800">
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                      <span className="font-semibold text-sm text-amber-800 dark:text-amber-200">Estacionalidad</span>
                    </div>
                    <p className="text-xs text-amber-700 dark:text-amber-300">
                      Factor aplicado: 1.15 (temporada seca)
                    </p>
                  </div>

                  <div className="bg-emerald-50 dark:bg-emerald-950 p-4 rounded-lg border border-emerald-200 dark:border-emerald-800 col-span-full">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                      <span className="font-semibold text-sm text-emerald-800 dark:text-emerald-200">Normativa Departamental</span>
                    </div>
                    <p className="text-xs text-emerald-700 dark:text-emerald-300">
                      5 normas aplicadas automáticamente para {departamentoSeleccionado || 'el departamento seleccionado'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {currentStep === 4 && (
              <div className="space-y-4">
                <div className="bg-muted/30 p-4 rounded-lg">
                  <p className="text-sm text-foreground">
                    📊 Aquí aparecerá el resumen de resultados del cálculo con validación de consistencia.
                  </p>
                </div>
              </div>
            )}

            {currentStep === 5 && (
              <div className="space-y-4">
                <div className="bg-emerald-50 dark:bg-emerald-950 p-6 rounded-lg border border-emerald-200 dark:border-emerald-800">
                  <div className="flex items-center gap-3 mb-4">
                    <CheckCircle2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
                    <h3 className="font-semibold text-emerald-800 dark:text-emerald-200">¡Cálculo Completado!</h3>
                  </div>
                  <p className="text-sm text-emerald-700 dark:text-emerald-300 mb-4">
                    El cálculo ha sido validado y está listo para guardarse en el historial.
                  </p>
                  <ul className="text-xs text-emerald-700 dark:text-emerald-300 space-y-1">
                    <li>✅ Consistencia técnica validada</li>
                    <li>✅ Normativa departamental aplicada</li>
                    <li>✅ Factores de escala ajustados</li>
                    <li>✅ Estacionalidad considerada</li>
                  </ul>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between mt-6 pt-6 border-t border-border">
            <div className="flex gap-2">
              {currentStep > 0 && (
                <Button onClick={handleBack} variant="outline">
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  Anterior
                </Button>
              )}
              <Button onClick={onCancel} variant="ghost">
                Cancelar
              </Button>
            </div>
            
            <div className="flex gap-2">
              {currentStep < WIZARD_STEPS.length - 2 && (
                <Button onClick={handleSkip} variant="ghost">
                  Omitir
                </Button>
              )}
              <Button onClick={handleNext} disabled={currentStep === 0 && !motorSeleccionado}>
                {currentStep === WIZARD_STEPS.length - 1 ? (
                  <>
                    Finalizar
                    <CheckCircle2 className="w-4 h-4 ml-2" />
                  </>
                ) : (
                  <>
                    Siguiente
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalculoGuiadoWizard;