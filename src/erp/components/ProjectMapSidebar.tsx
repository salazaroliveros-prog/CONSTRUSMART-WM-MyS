import React from 'react';

import { Building2, Calendar, DollarSign, MapPin, TrendingUp, User, Clock, AlertCircle } from 'lucide-react';
import type { Proyecto } from '../types';

interface ProjectMapSidebarProps {
  proyecto: Proyecto | null;
  onClose: () => void;
}

const ProjectMapSidebar: React.FC<ProjectMapSidebarProps> = ({ proyecto, onClose }) => {
  if (!proyecto) return null;

  const estadoColor = (estado: string) => {
    const colors: Record<string, string> = {
      planeacion: 'bg-slate-500',
      ejecucion: 'bg-blue-500',
      finalizado: 'bg-green-500',
      pausado: 'bg-yellow-500',
      cancelado: 'bg-red-500',
    };
    return colors[estado] || 'bg-gray-500';
  };

  return (
    <div className="w-80 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 overflow-y-auto">
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Detalles del Proyecto</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            aria-label="Cerrar"
          >
            <MapPin className="w-5 h-5" />
          </button>
        </div>

        <div className="bg-card border border-border rounded-xl p-4 shadow-sm mb-4">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <Building2 className="w-5 h-5 text-blue-500 mt-0.5" />
              <div>
                <p className="font-medium">{proyecto.nombre}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{proyecto.cliente || 'Sin cliente'}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <MapPin className="w-5 h-5 text-green-500" />
              <p className="text-sm">{proyecto.ubicacion}</p>
            </div>

            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-purple-500" />
              <div className="text-sm">
                <p>Inicio: {proyecto.fechaInicio ? new Date(proyecto.fechaInicio).toLocaleDateString() : '—'}</p>
                <p>Fin: {proyecto.fechaFin ? new Date(proyecto.fechaFin).toLocaleDateString() : '—'}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <DollarSign className="w-5 h-5 text-emerald-500" />
              <p className="text-sm font-medium">
                ${proyecto.presupuestoTotal?.toLocaleString() || '0'}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <User className="w-5 h-5 text-orange-500" />
              <p className="text-sm">{proyecto.residente || 'Sin residente'}</p>
            </div>

            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-cyan-500" />
              <div className="text-sm">
                <p>Avance Físico: {proyecto.avanceFisico}%</p>
                <p>Avance Financiero: {proyecto.avanceFinanciero}%</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${estadoColor(proyecto.estado)}`} />
              <p className="text-sm capitalize">{proyecto.estado}</p>
            </div>

            {proyecto.descripcion && (
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
                <p className="text-sm text-gray-600 dark:text-gray-300">{proyecto.descripcion}</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
          <h4 className="text-base font-semibold mb-3 text-foreground">Métricas de Progreso</h4>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Avance Físico</span>
                <span>{proyecto.avanceFisico}%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all"
                  style={{ width: `${proyecto.avanceFisico}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Avance Financiero</span>
                <span>{proyecto.avanceFinanciero}%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full transition-all"
                  style={{ width: `${proyecto.avanceFinanciero}%` }}
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <TrendingUp className="w-4 h-4 text-blue-500" />
              <span className="text-sm">
                Desviación: {(proyecto.avanceFinanciero - proyecto.avanceFisico).toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectMapSidebar;
