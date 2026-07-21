import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useErp } from '../store';
import type { Proyecto } from '../types';
import { fmtQ, fmtPct, safePct } from '../utils';
import { Progress } from '../components/Charts';
import { toast } from 'sonner';
import { ClipboardCheck, Eye } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ProyectoSelector,
  type ProyectoSelectorProps,
} from '../components/shared';
import {
  SeguimientoStatusBar,
  SeguimientoAnalysisPanel,
  SeguimientoTabBar,
  SeguimientoBitacoraPanel,
  SeguimientoCronogramaPanel,
  SeguimientoRiesgosPanel,
} from '../components/seguimiento';
import { TableWithRowActions, type Column } from '../components/shared';

type TabType = 'analysis' | 'bitacora' | 'cronograma' | 'riesgos';

interface ProjectWithData extends Proyecto {
  ingresos: number;
  egresos: number;
  pendiente: number;
}

/**
 * Seguimiento Component - Pantalla unificada de seguimiento
 * 
 * Arquitectura nueva (1 pantalla narrativa):
 * 1. ProyectoSelector (sticky top)
 * 2. StatusBar (resumen ejecutivo)
 * 3. TabBar (seleccionar vista)
 * 4. Contenido dinámico (según tab)
 * 
 * ANTES: 5 tabs desarticulados (9+ clics)
 * DESPUÉS: 1 pantalla narrativa (2 clics)
 */
const Seguimiento: React.FC = () => {
  const { t } = useTranslation();
  const {
    proyectos,
    movimientos,
    bitacora,
    hitos,
    riesgos,
    currentProjectId,
    setCurrentProjectId,
    proyectoWeather,
    setBitacora,
    updateBitacora, deleteBitacora,
  } = useErp();

  const [activeTab, setActiveTab] = useState<TabType>('analysis');

  // Estado local para proyecto seleccionado
  const [selectedProyectoId, setSelectedProyectoId] = useState<string>(
    currentProjectId || proyectos[0]?.id || ''
  );

  // Datos del proyecto actual
  const selectedProyecto = proyectos.find((p) => p.id === selectedProyectoId);
  const selectedWeather = selectedProyecto ? proyectoWeather.find(w => w.proyectoId === selectedProyecto.id) : undefined;

  // Enriquecer proyectos con datos financieros
  const proyectosEnriquecidos: ProjectWithData[] = useMemo(() => {
    return proyectos.map((p) => {
      const ing = movimientos
        .filter((m) => m.proyectoId === p.id && m.tipo === 'ingreso')
        .reduce((a, b) => a + (b.monto || 0), 0);
      const gas = movimientos
        .filter(
          (m) =>
            m.proyectoId === p.id &&
            (m.tipo === 'gasto' || m.tipo === 'egreso')
        )
        .reduce((a, b) => a + (b.monto || 0), 0);
      const pendiente = Math.max(0, (p.montoContrato || 0) - ing);

      return {
        ...p,
        ingresos: ing,
        egresos: gas,
        pendiente,
      };
    });
  }, [proyectos, movimientos]);

  // Datos de tabla de proyectos
  const tableData = useMemo(() => {
    return proyectosEnriquecidos.map((p) => ({
      id: p.id,
      nombre: p.nombre,
      estado: p.estado || 'planeacion',
      avanceFisico: p.avanceFisico || 0,
      avanceFinanciero: p.avanceFinanciero || 0,
      ingresos: p.ingresos,
      egresos: p.egresos,
      presupuesto: p.presupuestoTotal || 0,
    }));
  }, [proyectosEnriquecidos]);

  const bitacoraEntries = useMemo(() => {
    if (!selectedProyecto) return [];
    return bitacora
      .filter((b) => b.proyectoId === selectedProyecto.id)
      .sort((a, b) => b.fecha.localeCompare(a.fecha))
      .map((b) => ({
        id: b.id,
        fecha: b.fecha,
        clima: b.clima,
        personal: b.personalPresente,
        maquinaria: b.maquinaria,
        tareas: b.tareasRealizadas,
        observaciones: b.observaciones,
      }));
  }, [bitacora, selectedProyecto]);

  const columns: Column<(typeof tableData)[0]>[] = [
    {
      key: 'nombre',
      header: 'Proyecto',
      width: '25%',
      sortable: true,
    },
    {
      key: 'estado',
      header: 'Estado',
      width: '15%',
      render: (val) => (
        <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">
          {val}
        </span>
      ),
    },
    {
      key: 'avanceFisico',
      header: 'Avance Físico',
      width: '15%',
      align: 'center',
      render: (val) => (
        <div className="flex items-center justify-center gap-2">
          <Progress value={val as number} color="hsl(var(--primary))" />
          <span className="text-xs font-semibold w-8">{val}%</span>
        </div>
      ),
    },
    {
      key: 'ingresos',
      header: 'Ingresos',
      width: '15%',
      align: 'right',
      render: (val) => <span className="text-xs font-medium">{fmtQ(val as number)}</span>,
    },
    {
      key: 'egresos',
      header: 'Gastos',
      width: '15%',
      align: 'right',
      render: (val) => <span className="text-xs font-medium">{fmtQ(val as number)}</span>,
    },
    {
      key: 'presupuesto',
      header: 'Presupuesto',
      width: '15%',
      align: 'right',
      render: (val) => <span className="text-xs font-medium">{fmtQ(val as number)}</span>,
    },
  ];

  // Renderizar contenido según tab activo
  const renderTabContent = () => {
    switch (activeTab) {
      case 'analysis':
        return (
          <div className="space-y-4">
            <SeguimientoAnalysisPanel proyecto={selectedProyecto} />

            {/* Tabla de todos los proyectos */}
            <div className="bg-card border border-border rounded-xl p-4">
              <h3 className="text-sm font-semibold text-foreground mb-3 truncate" title="Estado General de Proyectos">Estado General de Proyectos</h3>
              <TableWithRowActions
                data={tableData}
                columns={columns}
                actions={[
                  {
                    label: 'Ver',
                    icon: <Eye size={16} />,
                    onClick: (row) => setSelectedProyectoId(row.id),
                  },
                ]}
                emptyState={{
                  icon: <ClipboardCheck size={48} />,
                  title: 'Sin proyectos',
                  description: 'Crea el primero para empezar',
                }}
              />
            </div>
          </div>
        );

      case 'bitacora':
        return (
          <SeguimientoBitacoraPanel
            entries={bitacoraEntries}
            onAdd={() => {
              const entry = { id: crypto.randomUUID(), proyectoId: selectedProyecto.id, fecha: new Date().toISOString().split('T')[0], clima: 'soleado', personalPresente: 0, maquinaria: '', tareasRealizadas: '', observaciones: '', createdAt: new Date().toISOString() };
              setBitacora((prev: any[]) => [entry, ...prev]);
              toast.success(t('seguimiento.bitacora_agregada', 'Entrada agregada'));
            }}
            onEdit={(entry: any) => {
              const fecha = prompt('Fecha:', entry.fecha);
              if (!fecha) return;
              updateBitacora(entry.id, { fecha, clima: entry.clima, tareasRealizadas: entry.tareas });
              toast.success(t('seguimiento.bitacora_editada', 'Entrada actualizada'));
            }}
            onDelete={(id: string) => {
              deleteBitacora(id);
              toast.success(t('seguimiento.bitacora_eliminada', 'Entrada eliminada'));
            }}
          />
        );

      case 'cronograma':
        return (
          <SeguimientoCronogramaPanel proyecto={selectedProyectoId} />
        );

      case 'riesgos':
        return (
          <SeguimientoRiesgosPanel proyecto={selectedProyectoId} />
        );

      default:
        return null;
    }
  };

  if (!selectedProyecto && proyectos.length === 0) {
    return (
      <div className="p-4 sm:p-6 text-center">
        <ClipboardCheck className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
        <p className="text-muted-foreground">Sin proyectos para seguimiento</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background">
      {/* ============ HEADER ============ */}
      <div className="p-4 sm:p-6 border-b border-border/30">
        <div className="max-w-[1600px] mx-auto">
          <h1 className="text-2xl sm:text-3xl font-black text-foreground flex items-center gap-2 mb-1">
            <ClipboardCheck className="w-7 h-7 text-primary" />
            {t('seguimiento.titulo_completo')}
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            {t('seguimiento.descripcion')}
          </p>
        </div>
      </div>

      {/* ============ PROYECTO SELECTOR (STICKY) ============ */}
      <ProyectoSelector
        proyectos={proyectosEnriquecidos}
        currentProyectoId={selectedProyectoId}
        onProyectoChange={setSelectedProyectoId}
        onNavigate={(direction) => {
          const currentIndex = proyectosEnriquecidos.findIndex(
            (p) => p.id === selectedProyectoId
          );
          if (
            direction === 'prev' &&
            currentIndex > 0
          ) {
            setSelectedProyectoId(proyectosEnriquecidos[currentIndex - 1].id);
          } else if (
            direction === 'next' &&
            currentIndex < proyectosEnriquecidos.length - 1
          ) {
            setSelectedProyectoId(proyectosEnriquecidos[currentIndex + 1].id);
          }
        }}
      />

      {/* ============ STATUS BAR ============ */}
      <div className="px-4 sm:px-6 py-4 border-b border-border/30 bg-card/50">
        <div className="max-w-[1600px] mx-auto">
          <SeguimientoStatusBar proyecto={selectedProyecto} weatherImpact={selectedWeather?.impact} />
        </div>
      </div>

      {/* ============ TAB BAR ============ */}
      <SeguimientoTabBar
        activeTab={activeTab}
        onChange={setActiveTab}
        className="sticky top-0 z-30"
      />

      {/* ============ CONTENIDO DINÁMICO ============ */}
      <div className="flex-1 overflow-auto p-4 sm:p-6">
        <div className="max-w-[1600px] mx-auto">
          {selectedProyecto ? (
            renderTabContent()
          ) : (
            <div className="text-center py-12">
              <ClipboardCheck className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-muted-foreground">Selecciona un proyecto</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Seguimiento;
