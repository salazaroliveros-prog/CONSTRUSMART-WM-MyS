import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useErp } from '../store';
import { AlertTriangle, Package, FileX, ShoppingCart, CalendarClock, ArrowRight } from 'lucide-react';
import { CARD, CARD_TITLE } from '../ui';

interface AlertaItem {
  id: string;
  tipo: 'stock' | 'nc' | 'oc' | 'hito';
  label: string;
  proyecto: string;
  gravedad: 'alta' | 'media' | 'baja';
}

const AlertasPanel: React.FC = () => {
  const { t } = useTranslation();
  const { materiales, ncs, ordenes, hitos, proyectos, setView } = useErp();

  const alertas = useMemo(() => {
    const items: AlertaItem[] = [];

    const projMap = new Map(proyectos.map(p => [p.id, p.nombre]));

    materiales.filter(m => m.stock <= (m.stockMinimo || 0)).forEach(m => {
      items.push({
        id: m.id, tipo: 'stock', gravedad: m.stock === 0 ? 'alta' : 'media',
        label: `${m.nombre} (${m.unidad}): ${m.stock}/${m.stockMinimo}`,
        proyecto: projMap.get(m.proyectoId) || '',
      });
    });

    ncs.filter(n => n.estado !== 'cerrado' && n.estado !== 'resuelto').forEach(n => {
      items.push({
        id: n.id, tipo: 'nc', gravedad: 'alta',
        label: n.descripcion?.slice(0, 60) || 'NC sin descripción',
        proyecto: projMap.get(n.proyectoId) || '',
      });
    });

    ordenes.filter(o => o.estado === 'pendiente' || o.estado === 'borrador').forEach(o => {
      items.push({
        id: o.id, tipo: 'oc', gravedad: 'media',
        label: `${o.proveedor} — ${o.material} x${o.cantidad}`,
        proyecto: projMap.get(o.proyectoId || '') || '',
      });
    });

    const hoy = new Date();
    hitos.filter(h => {
      if (!h.fecha || h.completado) return false;
      return new Date(h.fecha) < hoy;
    }).forEach(h => {
      items.push({
        id: h.id, tipo: 'hito', gravedad: 'alta',
        label: `${h.nombre} (${new Date(h.fecha).toLocaleDateString()})`,
        proyecto: projMap.get(h.proyectoId) || '',
      });
    });

    return items.slice(0, 10);
  }, [materiales, ncs, ordenes, hitos, proyectos]);

  if (alertas.length === 0) return null;

  const iconMap: Record<string, React.ReactNode> = {
    stock: <Package className="w-3 h-3 text-destructive" />,
    nc: <FileX className="w-3 h-3 text-destructive" />,
    oc: <ShoppingCart className="w-3 h-3 text-warning" />,
    hito: <CalendarClock className="w-3 h-3 text-destructive" />,
  };

  const bgMap: Record<string, string> = {
    stock: 'bg-red-500/10 border-red-500/20',
    nc: 'bg-red-500/10 border-red-500/20',
    oc: 'bg-yellow-500/10 border-yellow-500/20',
    hito: 'bg-red-500/10 border-red-500/20',
  };

  const countByType = (tipo: string) => alertas.filter(a => a.tipo === tipo).length;

  return (
    <div className={`${CARD} p-2 sm:p-3`}>
      <div className="flex items-center justify-between mb-1.5">
        <h3 className={`${CARD_TITLE} text-xs sm:text-sm mb-0 flex items-center gap-1`}>
          <AlertTriangle className="w-3 h-3 sm:w-4 sm:h-4 text-destructive" aria-hidden="true" />
          {t('dashboard.panel_alertas')}
        </h3>
        <div className="flex gap-1.5 text-[9px] text-muted-foreground">
          {countByType('stock') > 0 && <span className="px-1 py-0.5 rounded bg-red-500/10 text-destructive">{countByType('stock')} {t('dashboard.stock_critico')}</span>}
          {countByType('nc') > 0 && <span className="px-1 py-0.5 rounded bg-red-500/10 text-destructive">{countByType('nc')} {t('dashboard.nc_pendientes')}</span>}
        </div>
      </div>
      <div className="space-y-1 max-h-[180px] overflow-y-auto">
        {alertas.map((a, i) => (
          <div key={`${a.tipo}-${a.id}-${i}`} className={`flex items-start gap-1.5 p-1.5 rounded-lg border ${bgMap[a.tipo]} text-[10px]`}>
            {iconMap[a.tipo]}
            <div className="min-w-0 flex-1">
              <div className="truncate font-medium text-foreground">{a.label}</div>
              {a.proyecto && <div className="truncate text-muted-foreground">{a.proyecto}</div>}
            </div>
          </div>
        ))}
      </div>
      <button onClick={() => setView('proyectos')} className="mt-1.5 text-[9px] text-primary hover:text-primary/80 font-medium flex items-center gap-0.5">
        {t('dashboard.ver_todos')} <ArrowRight className="w-2.5 h-2.5" />
      </button>
    </div>
  );
};

export default AlertasPanel;
