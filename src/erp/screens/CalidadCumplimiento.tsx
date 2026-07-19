import React from 'react';

const CalidadCumplimiento: React.FC = () => {

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2 truncate" title="Cumplimiento de Calidad">Cumplimiento de Calidad</h1>
      <p className="text-muted-foreground mb-6">
        Monitoreo de cumplimiento normativo y estándares de calidad por proyecto.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
          <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Cumplimiento Global</p>
          <p className="text-3xl font-bold text-emerald-500 mt-1">87%</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
          <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">NC Pendientes</p>
          <p className="text-3xl font-bold text-amber-500 mt-1">12</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
          <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Liberaciones OK</p>
          <p className="text-3xl font-bold text-blue-500 mt-1">45</p>
        </div>
      </div>
      <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
        <p className="text-muted-foreground text-sm">
          Selecciona un proyecto para ver su detalle de cumplimiento normativo y calidad.
        </p>
      </div>
    </div>
  );
};

export default CalidadCumplimiento;