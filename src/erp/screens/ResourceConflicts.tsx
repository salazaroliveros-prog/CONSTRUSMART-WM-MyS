import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useErp } from '../store';
import { conflictDetectionService } from '../services/conflictDetection';
import { conflictResolutionService } from '../services/conflictResolution';
import type { ResourceConflict, ConflictType, ConflictSeverity, ConflictStatus, ResolutionSuggestion } from '../types/conflicts';
import { fmtQ, fmtPct } from '../utils';
import {
  AlertTriangle, Users, Package, Wrench, Calendar,
  Filter, CheckCircle, Clock, Zap, TrendingUp,
  DollarSign, ArrowRight, X, RefreshCw, Eye, EyeOff, Lightbulb
} from 'lucide-react';
import { CARD, SECTION_TITLE, BUTTON_PRIMARY, BUTTON_SECONDARY, BUTTON_ICON, COLOR_PRIMARY } from '../ui';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

const SEVERITY_COLORS: Record<ConflictSeverity, string> = {
  bajo: 'bg-emerald-500',
  medio: 'bg-amber-500',
  alto: 'bg-orange-500',
  critico: 'bg-red-500'
};

const SEVERITY_TEXT_COLORS: Record<ConflictSeverity, string> = {
  bajo: 'text-emerald-600',
  medio: 'text-amber-600',
  alto: 'text-orange-600',
  critico: 'text-red-600'
};

const TYPE_ICONS: Record<ConflictType, React.ReactNode> = {
  empleado: <Users className="w-4 h-4" />,
  material: <Package className="w-4 h-4" />,
  activo: <Wrench className="w-4 h-4" />,
  equipo: <Wrench className="w-4 h-4" />,
  timeline: <Calendar className="w-4 h-4" />
};

const ResourceConflicts: React.FC = () => {
  const { t } = useTranslation();
  const { empleados, materiales, activos, proyectos, hitos, ordenes } = useErp();
  
  const [loading, setLoading] = useState(true);
  const [conflicts, setConflicts] = useState<ResourceConflict[]>([]);
  const [filteredConflicts, setFilteredConflicts] = useState<ResourceConflict[]>([]);
  const [selectedConflict, setSelectedConflict] = useState<ResourceConflict | null>(null);
  const [suggestions, setSuggestions] = useState<ResolutionSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showDetails, setShowDetails] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const [filterSeverity, setFilterSeverity] = useState<ConflictSeverity | 'todos'>('todos');
  const [filterType, setFilterType] = useState<ConflictType | 'todos'>('todos');
  const [filterStatus, setFilterStatus] = useState<ConflictStatus | 'todos'>('todos');

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  const detectConflicts = useCallback(() => {
    const detected = conflictDetectionService.detectAllConflicts(
      empleados || [],
      materiales || [],
      activos || [],
      proyectos || [],
      hitos || [],
      ordenes || []
    );
    setConflicts(detected);
    setFilteredConflicts(detected);
  }, [empleados, materiales, activos, proyectos, hitos, ordenes]);

  useEffect(() => {
    detectConflicts();
  }, [detectConflicts]);

  useEffect(() => {
    let filtered = conflicts;
    
    if (filterSeverity !== 'todos') {
      filtered = filtered.filter(c => c.severidad === filterSeverity);
    }
    if (filterType !== 'todos') {
      filtered = filtered.filter(c => c.tipo === filterType);
    }
    if (filterStatus !== 'todos') {
      filtered = filtered.filter(c => c.estado === filterStatus);
    }
    
    setFilteredConflicts(filtered);
  }, [conflicts, filterSeverity, filterType, filterStatus]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    detectConflicts();
    setRefreshing(false);
    toast.success(t('conflicts.conflicts_updated'));
  };

  const handleViewSuggestions = (conflict: ResourceConflict) => {
    const conflictSuggestions = conflictResolutionService.generateSuggestions(conflict);
    setSuggestions(conflictSuggestions);
    setSelectedConflict(conflict);
    setShowSuggestions(true);
  };

  const handleApplyResolution = (suggestion: ResolutionSuggestion) => {
    if (!selectedConflict) return;
    
    const resolution = conflictResolutionService.applyResolution(
      selectedConflict,
      suggestion,
      'Usuario actual'
    );
    
    const impact = conflictResolutionService.calculateResolutionImpact(
      selectedConflict,
      resolution
    );
    
    toast.success(t('conflicts.resolution_applied', {
      savings: fmtQ(impact.costoSavings),
      timeReduction: fmtPct(impact.plazoReduction)
    }));
    
    setShowSuggestions(false);
    setSelectedConflict(null);
  };

  const stats = useMemo(() => {
    const total = conflicts.length;
    const porSeveridad: Record<ConflictSeverity, number> = {
      bajo: conflicts.filter(c => c.severidad === 'bajo').length,
      medio: conflicts.filter(c => c.severidad === 'medio').length,
      alto: conflicts.filter(c => c.severidad === 'alto').length,
      critico: conflicts.filter(c => c.severidad === 'critico').length
    };
    const porTipo: Record<ConflictType, number> = {
      empleado: conflicts.filter(c => c.tipo === 'empleado').length,
      material: conflicts.filter(c => c.tipo === 'material').length,
      activo: conflicts.filter(c => c.tipo === 'activo').length,
      equipo: conflicts.filter(c => c.tipo === 'equipo').length,
      timeline: conflicts.filter(c => c.tipo === 'timeline').length
    };
    const impactoCostoTotal = conflicts.reduce((sum, c) => sum + c.impactoCosto, 0);
    const impactoPlazoTotal = conflicts.reduce((sum, c) => sum + c.impactoPlazo, 0);
    
    return { total, porSeveridad, porTipo, impactoCostoTotal, impactoPlazoTotal };
  }, [conflicts]);

  if (loading) {
    return (
      <div className="p-4 sm:p-6 max-w-[1600px] mx-auto space-y-4">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-24 rounded-2xl" />
        </div>
        <Skeleton className="h-64 rounded-2xl" />
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="p-2 sm:p-3 lg:p-4 max-w-[1600px] mx-auto space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-2">
        <div>
          <h1 className="text-lg sm:text-xl font-black text-foreground flex items-center gap-2">
            <AlertTriangle className={`w-5 h-5 sm:w-6 sm:h-6 ${COLOR_PRIMARY}`} aria-hidden="true" />
            {t('conflicts.title')}
          </h1>
          <p className="text-xs text-muted-foreground mt-1">{t('conflicts.description')}</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={handleRefresh}
            disabled={refreshing}
            className={`${BUTTON_SECONDARY} text-xs`}
            aria-label={t('conflicts.refresh')}
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} aria-hidden="true" />
            {refreshing ? t('conflicts.refreshing') : t('conflicts.refresh')}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
        <div className={`${CARD} bg-gradient-to-br from-red-500 to-red-600 text-white`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] text-white/80 uppercase tracking-wide">{t('conflicts.total_conflicts')}</p>
              <p className="text-xl sm:text-2xl font-bold mt-1">{stats.total}</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-white/20" aria-hidden="true" />
          </div>
          <div className="flex items-center gap-1 mt-2 text-[10px] text-white/80">
            <TrendingUp className="w-3 h-3" aria-hidden="true" />
            <span>{t('conflicts.require_attention')}</span>
          </div>
        </div>

        <div className={`${CARD} bg-gradient-to-br from-orange-500 to-orange-600 text-white`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] text-white/80 uppercase tracking-wide">{t('conflicts.critical_conflicts')}</p>
              <p className="text-xl sm:text-2xl font-bold mt-1">{stats.porSeveridad.critico}</p>
            </div>
            <Zap className="w-8 h-8 text-white/20" aria-hidden="true" />
          </div>
          <div className="flex items-center gap-1 mt-2 text-[10px] text-white/80">
            <Clock className="w-3 h-3" aria-hidden="true" />
            <span>{t('conflicts.immediate_action')}</span>
          </div>
        </div>

        <div className={`${CARD} bg-gradient-to-br from-blue-500 to-blue-600 text-white`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] text-white/80 uppercase tracking-wide">{t('conflicts.cost_impact')}</p>
              <p className="text-xl sm:text-2xl font-bold mt-1">{fmtQ(stats.impactoCostoTotal)}</p>
            </div>
            <DollarSign className="w-8 h-8 text-white/20" aria-hidden="true" />
          </div>
          <div className="flex items-center gap-1 mt-2 text-[10px] text-white/80">
            <TrendingUp className="w-3 h-3" aria-hidden="true" />
            <span>{t('conflicts.total_impact')}</span>
          </div>
        </div>

        <div className={`${CARD} bg-gradient-to-br from-purple-500 to-purple-600 text-white`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] text-white/80 uppercase tracking-wide">{t('conflicts.schedule_impact')}</p>
              <p className="text-xl sm:text-2xl font-bold mt-1">{stats.impactoPlazoTotal} días</p>
            </div>
            <Calendar className="w-8 h-8 text-white/20" aria-hidden="true" />
          </div>
          <div className="flex items-center gap-1 mt-2 text-[10px] text-white/80">
            <Clock className="w-3 h-3" aria-hidden="true" />
            <span>{t('conflicts.delay_risk')}</span>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        <Filter className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
        <span className="text-xs text-muted-foreground">{t('conflicts.filter_by')}:</span>
        
        <select
          value={filterSeverity}
          onChange={(e) => setFilterSeverity(e.target.value as ConflictSeverity | 'todos')}
          className="text-xs px-2 py-1 rounded-lg border border-border bg-card"
          aria-label={t('conflicts.filter_severity')}
        >
          <option value="todos">{t('conflicts.all_severities')}</option>
          <option value="critico">{t('conflicts.critical')}</option>
          <option value="alto">{t('conflicts.high')}</option>
          <option value="medio">{t('conflicts.medium')}</option>
          <option value="bajo">{t('conflicts.low')}</option>
        </select>

        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value as ConflictType | 'todos')}
          className="text-xs px-2 py-1 rounded-lg border border-border bg-card"
          aria-label={t('conflicts.filter_type')}
        >
          <option value="todos">{t('conflicts.all_types')}</option>
          <option value="empleado">{t('conflicts.employee')}</option>
          <option value="material">{t('conflicts.material')}</option>
          <option value="activo">{t('conflicts.asset')}</option>
          <option value="timeline">{t('conflicts.timeline')}</option>
        </select>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as ConflictStatus | 'todos')}
          className="text-xs px-2 py-1 rounded-lg border border-border bg-card"
          aria-label={t('conflicts.filter_status')}
        >
          <option value="todos">{t('conflicts.all_statuses')}</option>
          <option value="detectado">{t('conflicts.detected')}</option>
          <option value="en_revision">{t('conflicts.in_review')}</option>
          <option value="resuelto">{t('conflicts.resolved')}</option>
        </select>

        <button
          onClick={() => setShowDetails(!showDetails)}
          className={`${BUTTON_ICON} text-xs`}
          aria-label={showDetails ? t('conflicts.hide_details') : t('conflicts.show_details')}
        >
          {showDetails ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>

      {filteredConflicts.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <CheckCircle className="w-10 h-10 mx-auto mb-2 text-slate-300" />
          <p className="text-sm">{t('conflicts.no_conflicts')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredConflicts.map((conflict) => (
            <div key={conflict.id} className={`${CARD} rounded-xl overflow-hidden`}>
              <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className={`p-2 rounded-lg ${SEVERITY_COLORS[conflict.severidad]} text-white shrink-0`}>
                      {TYPE_ICONS[conflict.tipo]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-foreground text-sm">{conflict.titulo}</h3>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium text-white ${SEVERITY_COLORS[conflict.severidad]}`}>
                          {conflict.severidad.charAt(0).toUpperCase() + conflict.severidad.slice(1)}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">{conflict.descripcion}</p>
                      
                      <div className="flex flex-wrap gap-2 text-xs">
                        <span className="text-muted-foreground">
                          <strong className="text-foreground">{conflict.recursoNombre}</strong>
                        </span>
                        <span className="text-muted-foreground">·</span>
                        <span className={SEVERITY_TEXT_COLORS[conflict.severidad]}>
                          {t('conflicts.cost')}: {fmtQ(conflict.impactoCosto)}
                        </span>
                        <span className="text-muted-foreground">·</span>
                        <span className={SEVERITY_TEXT_COLORS[conflict.severidad]}>
                          {t('conflicts.delay')}: {conflict.impactoPlazo} días
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-1 shrink-0">
                    <button
                      onClick={() => handleViewSuggestions(conflict)}
                      className={`${BUTTON_SECONDARY} text-xs`}
                      aria-label={t('conflicts.view_solutions')}
                    >
                      <Lightbulb className="w-4 h-4" aria-hidden="true" />
                    </button>
                  </div>
                </div>

                {showDetails && (
                  <div className="mt-3 pt-3 border-t border-border">
                    <h4 className="text-xs font-semibold text-muted-foreground mb-2">
                      {t('conflicts.affected_projects')}
                    </h4>
                    <div className="space-y-2">
                      {conflict.proyectos.map((proyecto) => (
                        <div key={proyecto.proyectoId} className="flex items-center justify-between text-xs p-2 bg-muted/30 rounded-lg">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="font-medium text-foreground truncate">{proyecto.proyectoNombre}</span>
                            <span className="text-muted-foreground">·</span>
                            <span className="text-muted-foreground">{fmtPct(proyecto.porcentajeUso)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-muted-foreground">{t('conflicts.priority')}:</span>
                            <span className="font-semibold text-foreground">{proyecto.prioridad}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showSuggestions && selectedConflict && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className={`${CARD} rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto`}>
              <div className="p-4 border-b border-border flex items-center justify-between">
              <h2 className={`${SECTION_TITLE} truncate`} title={t('conflicts.resolution_suggestions')}>{t('conflicts.resolution_suggestions')}</h2>
              <button
                onClick={() => { setShowSuggestions(false); setSelectedConflict(null); }}
                className={`${BUTTON_ICON} text-xs`}
                aria-label={t('conflicts.close')}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="p-4 space-y-3">
              <div className="bg-muted/30 p-3 rounded-lg">
                <h3 className="font-semibold text-foreground text-sm mb-1">{selectedConflict.titulo}</h3>
                <p className="text-xs text-muted-foreground">{selectedConflict.descripcion}</p>
              </div>

              {suggestions.map((suggestion) => (
                <div key={suggestion.id} className="border border-border rounded-lg p-3 hover:bg-muted/30 transition-colors">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h4 className="font-semibold text-foreground text-sm">{suggestion.titulo}</h4>
                    <div className="flex items-center gap-1 text-xs">
                      <span className="text-muted-foreground">{t('conflicts.success_probability')}:</span>
                      <span className="font-semibold text-emerald-600">{fmtPct(suggestion.probabilidadExito)}</span>
                    </div>
                  </div>
                  
                  <p className="text-xs text-muted-foreground mb-2">{suggestion.descripcion}</p>
                  
                  <div className="grid grid-cols-2 gap-2 mb-2 text-xs">
                    <div>
                      <span className="text-muted-foreground">{t('conflicts.estimated_cost')}:</span>
                      <span className="font-semibold text-foreground ml-1">{fmtQ(suggestion.costoEstimado)}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">{t('conflicts.schedule_impact')}:</span>
                      <span className="font-semibold text-foreground ml-1">{suggestion.impactoPlazo} días</span>
                    </div>
                  </div>

                  <div className="mb-2">
                    <div className="text-xs font-medium text-foreground mb-1">{t('conflicts.advantages')}:</div>
                    <ul className="text-xs text-muted-foreground space-y-0.5">
                      {suggestion.ventajas.map((ventaja, i) => (
                        <li key={i} className="flex items-start gap-1">
                          <CheckCircle className="w-3 h-3 text-emerald-500 shrink-0 mt-0.5" aria-hidden="true" />
                          <span>{ventaja}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mb-3">
                    <div className="text-xs font-medium text-foreground mb-1">{t('conflicts.disadvantages')}:</div>
                    <ul className="text-xs text-muted-foreground space-y-0.5">
                      {suggestion.desventajas.map((desventaja, i) => (
                        <li key={i} className="flex items-start gap-1">
                          <X className="w-3 h-3 text-red-500 shrink-0 mt-0.5" aria-hidden="true" />
                          <span>{desventaja}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <button
                    onClick={() => handleApplyResolution(suggestion)}
                    className={`${BUTTON_PRIMARY} w-full text-xs`}
                  >
                    <ArrowRight className="w-4 h-4 inline mr-1" aria-hidden="true" />
                    {t('conflicts.apply_solution')}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResourceConflicts;