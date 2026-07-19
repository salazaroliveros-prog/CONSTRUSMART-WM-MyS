import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useErp } from '../../store';
import { X, Building2, DollarSign, Calendar, TrendingUp, AlertTriangle, ChevronRight } from 'lucide-react';
import { fmtQ, fmtPct } from '../../utils';

interface ProyectoDetailModalProps {
  proyectoId: string;
  onClose: () => void;
}

type TabType = 'info' | 'avance' | 'riesgos' | 'financiero';

const ProyectoDetailModal: React.FC<ProyectoDetailModalProps> = ({ proyectoId, onClose }) => {
  const { t } = useTranslation();
  const { proyectos, avances, riesgos, movimientos, hitos } = useErp();
  const [activeTab, setActiveTab] = useState<TabType>('info');

  const proyecto = proyectos.find((p) => p.id === proyectoId);
  if (!proyecto) return null;

  const proyectoAvances = avances.filter((a) => a.proyectoId === proyectoId);
  const proyectoRiesgos = riesgos.filter((r) => r.proyectoId === proyectoId);
  const proyectoMovimientos = movimientos.filter((m) => m.proyectoId === proyectoId);
  const proyectoHitos = hitos.filter((h) => h.proyectoId === proyectoId);

  const ingresos = proyectoMovimientos.filter((m) => m.tipo === 'ingreso').reduce((s, m) => s + (m.monto || 0), 0);
  const egresos = proyectoMovimientos.filter((m) => m.tipo !== 'ingreso').reduce((s, m) => s + (m.monto || 0), 0);
  const utilidad = ingresos - egresos;

  const tabs: { key: TabType; label: string; icon: React.ReactNode }[] = [
    { key: 'info', label: t('proyectos.info', 'Información'), icon: <Building2 size={16} /> },
    { key: 'avance', label: t('proyectos.avance', 'Avance'), icon: <TrendingUp size={16} /> },
    { key: 'riesgos', label: t('proyectos.riesgos', 'Riesgos'), icon: <AlertTriangle size={16} /> },
    { key: 'financiero', label: t('proyectos.financiero', 'Financiero'), icon: <DollarSign size={16} /> },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'info':
        return (
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-muted/30 rounded-lg p-3">
                <p className="text-xs text-muted-foreground mb-1">{t('proyectos.estado', 'Estado')}</p>
                <p className="text-sm font-medium">{proyecto.estado}</p>
              </div>
              <div className="bg-muted/30 rounded-lg p-3">
                <p className="text-xs text-muted-foreground mb-1">{t('proyectos.etapa', 'Etapa')}</p>
                <p className="text-sm font-medium">{proyecto.etapa}</p>
              </div>
              <div className="bg-muted/30 rounded-lg p-3">
                <p className="text-xs text-muted-foreground mb-1">{t('proyectos.cliente', 'Cliente')}</p>
                <p className="text-sm font-medium">{proyecto.cliente}</p>
              </div>
              <div className="bg-muted/30 rounded-lg p-3">
                <p className="text-xs text-muted-foreground mb-1">{t('proyectos.ubicacion', 'Ubicación')}</p>
                <p className="text-sm font-medium">{proyecto.ubicacion}</p>
              </div>
            </div>
            {proyecto.descripcion && (
              <div className="bg-muted/30 rounded-lg p-3">
                <p className="text-xs text-muted-foreground mb-1">{t('proyectos.descripcion', 'Descripción')}</p>
                <p className="text-sm">{proyecto.descripcion}</p>
              </div>
            )}
          </div>
        );

      case 'avance':
        return (
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-muted/30 rounded-lg p-3">
                <p className="text-xs text-muted-foreground mb-1">{t('proyectos.avance_fisico', 'Avance Físico')}</p>
                <p className="text-lg font-bold">{fmtPct(proyecto.avanceFisico || 0)}</p>
              </div>
              <div className="bg-muted/30 rounded-lg p-3">
                <p className="text-xs text-muted-foreground mb-1">{t('proyectos.avance_financiero', 'Avance Financiero')}</p>
                <p className="text-lg font-bold">{fmtPct(proyecto.avanceFinanciero || 0)}</p>
              </div>
            </div>
            <div className="bg-muted/30 rounded-lg p-3">
              <p className="text-xs text-muted-foreground mb-2">{t('proyectos.hitos', 'Hitos')}</p>
              {proyectoHitos.length === 0 ? (
                <p className="text-xs text-muted-foreground">{t('proyectos.sin_hitos', 'Sin hitos')}</p>
              ) : (
                <div className="space-y-2">
                  {proyectoHitos.slice(0, 5).map((h) => (
                    <div key={h.id} className="flex items-center justify-between text-xs">
                      <span>{h.nombre}</span>
                      <span className={`px-2 py-0.5 rounded-full ${
                        h.estado === 'completado' ? 'bg-success/10 text-success' :
                        h.estado === 'en_progreso' ? 'bg-primary/10 text-primary' :
                        'bg-muted text-muted-foreground'
                      }`}>
                        {h.estado}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );

      case 'riesgos':
        return (
          <div className="space-y-3">
            {proyectoRiesgos.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">
                {t('riesgos.sin_riesgos', 'Sin riesgos activos')}
              </p>
            ) : (
              <div className="space-y-2">
                {proyectoRiesgos.map((r) => (
                  <div key={r.id} className="bg-muted/30 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">{r.descripcion}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        (r.probabilidad + r.impacto) >= 8 ? 'bg-red-100 text-red-700' :
                        (r.probabilidad + r.impacto) >= 6 ? 'bg-orange-100 text-orange-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {r.probabilidad + r.impacto}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {t('riesgos.probabilidad', 'Probabilidad')}: {r.probabilidad} / {t('riesgos.impacto', 'Impacto')}: {r.impacto}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 'financiero':
        return (
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-muted/30 rounded-lg p-3">
                <p className="text-xs text-muted-foreground mb-1">{t('financiero.ingresos', 'Ingresos')}</p>
                <p className="text-lg font-bold text-success">{fmtQ(ingresos)}</p>
              </div>
              <div className="bg-muted/30 rounded-lg p-3">
                <p className="text-xs text-muted-foreground mb-1">{t('financiero.egresos', 'Egresos')}</p>
                <p className="text-lg font-bold text-destructive">{fmtQ(egresos)}</p>
              </div>
              <div className="bg-muted/30 rounded-lg p-3">
                <p className="text-xs text-muted-foreground mb-1">{t('financiero.utilidad', 'Utilidad')}</p>
                <p className={`text-lg font-bold ${utilidad > 0 ? 'text-success' : 'text-destructive'}`}>
                  {fmtQ(utilidad)}
                </p>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-card border border-border rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold">{proyecto.nombre}</h2>
          <button onClick={onClose} className="p-1 hover:bg-muted rounded-lg">
            <X size={20} />
          </button>
        </div>

        <div className="flex border-b border-border">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 flex items-center justify-center gap-1 px-3 py-2 text-xs font-medium transition-colors ${
                activeTab === tab.key
                  ? 'text-primary border-b-2 border-primary bg-primary/5'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-4 overflow-auto max-h-[60vh]">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
};

export default ProyectoDetailModal;
