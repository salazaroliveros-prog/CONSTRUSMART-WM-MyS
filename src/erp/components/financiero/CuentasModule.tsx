import React from 'react';
import { useTranslation } from 'react-i18next';
import { useErp } from '../../store';
import { fmtQ } from '../../utils';

interface CuentasModuleProps {
  cuentasCobrar: any[];
  cuentasPagar: any[];
}

const CuentasModule: React.FC<CuentasModuleProps> = ({ cuentasCobrar, cuentasPagar }) => {
  const { t } = useTranslation();

  const cobrarStats = React.useMemo(() => {
    const total = cuentasCobrar.length;
    const montoTotal = cuentasCobrar.reduce((s, c) => s + (c.monto || 0), 0);
    const pendientes = cuentasCobrar.filter(c => c.estado === 'pendiente').length;
    const vencidas = cuentasCobrar.filter(c => c.estado === 'vencida' || (c.estado === 'pendiente' && c.fechaVencimiento && new Date(c.fechaVencimiento) < new Date())).length;
    return { total, montoTotal, pendientes, vencidas };
  }, [cuentasCobrar]);

  const pagarStats = React.useMemo(() => {
    const total = cuentasPagar.length;
    const montoTotal = cuentasPagar.reduce((s, c) => s + (c.monto || 0), 0);
    const pendientes = cuentasPagar.filter(c => c.estado === 'pendiente').length;
    const vencidas = cuentasPagar.filter(c => c.estado === 'vencida' || (c.estado === 'pendiente' && c.fechaVencimiento && new Date(c.fechaVencimiento) < new Date())).length;
    return { total, montoTotal, pendientes, vencidas };
  }, [cuentasPagar]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="bg-card border border-border rounded-xl p-4">
        <h3 className="text-sm font-semibold text-foreground mb-3">
          {t('cuentas.cobrar', 'Cuentas por Cobrar')}
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-muted/30 rounded-lg p-2 text-center">
            <p className="text-xs text-muted-foreground mb-1">{t('cuentas.total', 'Total')}</p>
            <p className="text-sm font-bold">{cobrarStats.total}</p>
          </div>
          <div className="bg-muted/30 rounded-lg p-2 text-center">
            <p className="text-xs text-muted-foreground mb-1">{t('cuentas.monto', 'Monto')}</p>
            <p className="text-sm font-bold">{fmtQ(cobrarStats.montoTotal)}</p>
          </div>
          <div className="bg-muted/30 rounded-lg p-2 text-center">
            <p className="text-xs text-muted-foreground mb-1">{t('cuentas.pendientes', 'Pendientes')}</p>
            <p className="text-sm font-bold text-orange-500">{cobrarStats.pendientes}</p>
          </div>
          <div className="bg-muted/30 rounded-lg p-2 text-center">
            <p className="text-xs text-muted-foreground mb-1">{t('cuentas.vencidas', 'Vencidas')}</p>
            <p className="text-sm font-bold text-red-500">{cobrarStats.vencidas}</p>
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-4">
        <h3 className="text-sm font-semibold text-foreground mb-3">
          {t('cuentas.pagar', 'Cuentas por Pagar')}
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-muted/30 rounded-lg p-2 text-center">
            <p className="text-xs text-muted-foreground mb-1">{t('cuentas.total', 'Total')}</p>
            <p className="text-sm font-bold">{pagarStats.total}</p>
          </div>
          <div className="bg-muted/30 rounded-lg p-2 text-center">
            <p className="text-xs text-muted-foreground mb-1">{t('cuentas.monto', 'Monto')}</p>
            <p className="text-sm font-bold">{fmtQ(pagarStats.montoTotal)}</p>
          </div>
          <div className="bg-muted/30 rounded-lg p-2 text-center">
            <p className="text-xs text-muted-foreground mb-1">{t('cuentas.pendientes', 'Pendientes')}</p>
            <p className="text-sm font-bold text-orange-500">{pagarStats.pendientes}</p>
          </div>
          <div className="bg-muted/30 rounded-lg p-2 text-center">
            <p className="text-xs text-muted-foreground mb-1">{t('cuentas.vencidas', 'Vencidas')}</p>
            <p className="text-sm font-bold text-red-500">{pagarStats.vencidas}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CuentasModule;
