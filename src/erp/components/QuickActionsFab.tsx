import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useErp, View } from '../store';
import { Plus, Search, Settings, Bell, Building2, Calculator, Warehouse, Wallet, Target, FileText, HardHat, Users, Truck, Package, LayoutDashboard, ChevronUp, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface QuickAction {
  id: string;
  label: string;
  icon: React.ElementType;
  action: () => void;
  description?: string;
}

const QuickActionsFab: React.FC = () => {
  const { t } = useTranslation();
  const { view, setView } = useErp();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  const actions = useMemo<QuickAction[]>(() => {
    const commonActions: QuickAction[] = [
      {
        id: 'search',
        label: t('quick_actions.search') || 'Buscar',
        icon: Search,
        action: () => {
          setIsOpen(false);
        },
        description: t('quick_actions.search_desc') || 'Buscar en toda la aplicación',
      },
      {
        id: 'notifications',
        label: t('quick_actions.notifications') || 'Notificaciones',
        icon: Bell,
        action: () => {
          setView('notificaciones');
          setIsOpen(false);
        },
        description: t('quick_actions.notifications_desc') || 'Ver notificaciones',
      },
      {
        id: 'settings',
        label: t('quick_actions.settings') || 'Ajustes',
        icon: Settings,
        action: () => {
          setView('ajustes');
          setIsOpen(false);
        },
        description: t('quick_actions.settings_desc') || 'Configurar aplicación',
      },
    ];

    const viewActions: Record<View, QuickAction[]> = {
      dashboard: [
        {
          id: 'new-project',
          label: t('quick_actions.new_project') || 'Nuevo Proyecto',
          icon: Building2,
          action: () => {
            setView('proyectos');
            setIsOpen(false);
          },
          description: t('quick_actions.new_project_desc') || 'Crear nuevo proyecto',
        },
        {
          id: 'new-movement',
          label: t('quick_actions.new_movement') || 'Registrar Movimiento',
          icon: Wallet,
          action: () => {
            setView('financiero');
            setIsOpen(false);
          },
          description: t('quick_actions.new_movement_desc') || 'Agregar ingreso/gasto',
        },
        {
          id: 'dashboard-view',
          label: t('quick_actions.dashboard') || 'Tablero',
          icon: LayoutDashboard,
          action: () => {
            setView('dashboard');
            setIsOpen(false);
          },
          description: t('quick_actions.dashboard_desc') || 'Ir al tablero principal',
        },
      ],
      proyectos: [
        {
          id: 'create-project',
          label: t('quick_actions.create_project') || 'Crear Proyecto',
          icon: Plus,
          action: () => {
            setIsOpen(false);
          },
          description: t('quick_actions.create_project_desc') || 'Nuevo proyecto de construcción',
        },
        {
          id: 'add-milestone',
          label: t('quick_actions.add_milestone') || 'Agregar Hito',
          icon: Target,
          action: () => {
            setView('hitos');
            setIsOpen(false);
          },
          description: t('quick_actions.add_milestone_desc') || 'Crear hito de proyecto',
        },
      ],
      presupuestos: [
        {
          id: 'create-budget',
          label: t('quick_actions.create_budget') || 'Crear Presupuesto',
          icon: Plus,
          action: () => {
            setIsOpen(false);
          },
          description: t('quick_actions.create_budget_desc') || 'Nuevo presupuesto detallado',
        },
        {
          id: 'add-item',
          label: t('quick_actions.add_item') || 'Agregar Renglón',
          icon: Calculator,
          action: () => {
            setIsOpen(false);
          },
          description: t('quick_actions.add_item_desc') || 'Agregar renglón al presupuesto',
        },
      ],
      seguimiento: [
        {
          id: 'record-progress',
          label: t('quick_actions.record_progress') || 'Registrar Avance',
          icon: HardHat,
          action: () => {
            setView('rendimiento-campo');
            setIsOpen(false);
          },
          description: t('quick_actions.record_progress_desc') || 'Registrar avance físico',
        },
        {
          id: 'view-s-curves',
          label: t('quick_actions.view_s_curves') || 'Ver Curvas S',
          icon: Calculator,
          action: () => {
            setView('curvas');
            setIsOpen(false);
          },
          description: t('quick_actions.view_s_curves_desc') || 'Análisis de curvas S',
        },
      ],
      financiero: [
        {
          id: 'add-income',
          label: t('quick_actions.add_income') || 'Agregar Ingreso',
          icon: Wallet,
          action: () => {
            setIsOpen(false);
          },
          description: t('quick_actions.add_income_desc') || 'Registrar nuevo ingreso',
        },
        {
          id: 'add-expense',
          label: t('quick_actions.add_expense') || 'Agregar Gasto',
          icon: Wallet,
          action: () => {
            setIsOpen(false);
          },
          description: t('quick_actions.add_expense_desc') || 'Registrar nuevo gasto',
        },
        {
          id: 'view-accounts',
          label: t('quick_actions.view_accounts') || 'Ver Cuentas',
          icon: Wallet,
          action: () => {
            setView('cuentas-cobrar');
            setIsOpen(false);
          },
          description: t('quick_actions.view_accounts_desc') || 'Cuentas por cobrar/pagar',
        },
      ],
      rrhh: [
        {
          id: 'add-employee',
          label: t('quick_actions.add_employee') || 'Agregar Empleado',
          icon: Users,
          action: () => {
            setIsOpen(false);
          },
          description: t('quick_actions.add_employee_desc') || 'Nuevo registro de empleado',
        },
        {
          id: 'payroll',
          label: t('quick_actions.payroll') || 'Planilla',
          icon: Users,
          action: () => {
            setView('planilla-destajos');
            setIsOpen(false);
          },
          description: t('quick_actions.payroll_desc') || 'Gestión de planilla',
        },
      ],
      bodega: [
        {
          id: 'add-material',
          label: t('quick_actions.add_material') || 'Agregar Material',
          icon: Package,
          action: () => {
            setIsOpen(false);
          },
          description: t('quick_actions.add_material_desc') || 'Nuevo material al inventario',
        },
        {
          id: 'create-order',
          label: t('quick_actions.create_order') || 'Crear Orden Compra',
          icon: Truck,
          action: () => {
            setView('logistica');
            setIsOpen(false);
          },
          description: t('quick_actions.create_order_desc') || 'Nueva orden de compra',
        },
        {
          id: 'warehouse-entry',
          label: t('quick_actions.warehouse_entry') || 'Entrada Almacén',
          icon: Warehouse,
          action: () => {
            setView('entradas-almacen');
            setIsOpen(false);
          },
          description: t('quick_actions.warehouse_entry_desc') || 'Registrar entrada de materiales',
        },
      ],
      crm: [
        {
          id: 'new-opportunity',
          label: t('quick_actions.new_opportunity') || 'Nueva Oportunidad',
          icon: Target,
          action: () => {
            setIsOpen(false);
          },
          description: t('quick_actions.new_opportunity_desc') || 'Agregar oportunidad de venta',
        },
        {
          id: 'create-quotation',
          label: t('quick_actions.create_quotation') || 'Crear Cotización',
          icon: FileText,
          action: () => {
            setView('cotizaciones');
            setIsOpen(false);
          },
          description: t('quick_actions.create_quotation_desc') || 'Generar nueva cotización',
        },
      ],
      'comercial-fin': [
        {
          id: 'new-sale',
          label: t('quick_actions.new_sale') || 'Nueva Venta',
          icon: FileText,
          action: () => {
            setIsOpen(false);
          },
          description: t('quick_actions.new_sale_desc') || 'Registrar venta de paquete',
        },
        {
          id: 'view-commercial',
          label: t('quick_actions.view_commercial') || 'Ver Comercial',
          icon: FileText,
          action: () => {
            setView('comercial-fin');
            setIsOpen(false);
          },
          description: t('quick_actions.view_commercial_desc') || 'Análisis comercial',
        },
      ],
      cotizaciones: [
        {
          id: 'new-quotation',
          label: t('quick_actions.new_quotation') || 'Nueva Cotización',
          icon: FileText,
          action: () => {
            setIsOpen(false);
          },
          description: t('quick_actions.new_quotation_desc') || 'Crear cotización para cliente',
        },
      ],
      logistica: [
        {
          id: 'new-purchase-order',
          label: t('quick_actions.new_purchase_order') || 'Nueva Orden Compra',
          icon: Truck,
          action: () => {
            setIsOpen(false);
          },
          description: t('quick_actions.new_purchase_order_desc') || 'Crear orden de compra',
        },
        {
          id: 'view-suppliers',
          label: t('quick_actions.view_suppliers') || 'Ver Proveedores',
          icon: Truck,
          action: () => {
            setIsOpen(false);
          },
          description: t('quick_actions.view_suppliers_desc') || 'Gestión de proveedores',
        },
      ],
      'entradas-almacen': [
        {
          id: 'new-reception',
          label: t('quick_actions.new_reception') || 'Nueva Recepción',
          icon: Package,
          action: () => {
            setIsOpen(false);
          },
          description: t('quick_actions.new_reception_desc') || 'Registrar recepción de materiales',
        },
      ],
      hitos: [
        {
          id: 'add-milestone',
          label: t('quick_actions.add_milestone') || 'Agregar Hito',
          icon: Target,
          action: () => {
            setIsOpen(false);
          },
          description: t('quick_actions.add_milestone_desc') || 'Crear nuevo hito',
        },
      ],
      riesgos: [
        {
          id: 'add-risk',
          label: t('quick_actions.add_risk') || 'Agregar Riesgo',
          icon: Target,
          action: () => {
            setIsOpen(false);
          },
          description: t('quick_actions.add_risk_desc') || 'Registrar riesgo de proyecto',
        },
      ],
      'cuentas-cobrar': [
        {
          id: 'add-receivable',
          label: t('quick_actions.add_receivable') || 'Agregar Cuenta Cobrar',
          icon: Wallet,
          action: () => {
            setIsOpen(false);
          },
          description: t('quick_actions.add_receivable_desc') || 'Nueva cuenta por cobrar',
        },
      ],
      'cuentas-pagar': [
        {
          id: 'add-payable',
          label: t('quick_actions.add_payable') || 'Agregar Cuenta Pagar',
          icon: Wallet,
          action: () => {
            setIsOpen(false);
          },
          description: t('quick_actions.add_payable_desc') || 'Nueva cuenta por pagar',
        },
      ],
      'rendimiento-campo': [
        {
          id: 'record-performance',
          label: t('quick_actions.record_performance') || 'Registrar Rendimiento',
          icon: HardHat,
          action: () => {
            setIsOpen(false);
          },
          description: t('quick_actions.record_performance_desc') || 'Registrar rendimiento de cuadrilla',
        },
      ],
      'planilla-destajos': [
        {
          id: 'add-payroll-item',
          label: t('quick_actions.add_payroll_item') || 'Agregar Planilla',
          icon: Users,
          action: () => {
            setIsOpen(false);
          },
          description: t('quick_actions.add_payroll_item_desc') || 'Nuevo ítem de planilla',
        },
      ],
      'sso-calidad': [
        {
          id: 'add-nc',
          label: t('quick_actions.add_nc') || 'Agregar No Conformidad',
          icon: Target,
          action: () => {
            setIsOpen(false);
          },
          description: t('quick_actions.add_nc_desc') || 'Registrar no conformidad',
        },
      ],
      'ordenes-cambio': [
        {
          id: 'add-change-order',
          label: t('quick_actions.add_change_order') || 'Agregar Orden Cambio',
          icon: FileText,
          action: () => {
            setIsOpen(false);
          },
          description: t('quick_actions.add_change_order_desc') || 'Crear orden de cambio',
        },
      ],
      muro: [
        {
          id: 'add-post',
          label: t('quick_actions.add_post') || 'Publicar en Muro',
          icon: FileText,
          action: () => {
            setIsOpen(false);
          },
          description: t('quick_actions.add_post_desc') || 'Nueva publicación en el muro',
        },
      ],
      documentos: [
        {
          id: 'upload-document',
          label: t('quick_actions.upload_document') || 'Subir Documento',
          icon: FileText,
          action: () => {
            setIsOpen(false);
          },
          description: t('quick_actions.upload_document_desc') || 'Cargar nuevo documento',
        },
      ],
      'visor-bim': [
        {
          id: 'upload-model',
          label: t('quick_actions.upload_model') || 'Subir Modelo BIM',
          icon: FileText,
          action: () => {
            setIsOpen(false);
          },
          description: t('quick_actions.upload_model_desc') || 'Cargar modelo IFC',
        },
      ],
      apu: [
        {
          id: 'create-apu',
          label: t('quick_actions.create_apu') || 'Crear APU',
          icon: Calculator,
          action: () => {
            setIsOpen(false);
          },
          description: t('quick_actions.create_apu_desc') || 'Nuevo análisis de precios unitarios',
        },
      ],
      curvas: [
        {
          id: 'generate-curves',
          label: t('quick_actions.generate_curves') || 'Generar Curvas',
          icon: Calculator,
          action: () => {
            setIsOpen(false);
          },
          description: t('quick_actions.generate_curves_desc') || 'Generar curvas S del proyecto',
        },
      ],
      baseprecios: [
        {
          id: 'add-price-item',
          label: t('quick_actions.add_price_item') || 'Agregar Precio',
          icon: Calculator,
          action: () => {
            setIsOpen(false);
          },
          description: t('quick_actions.add_price_item_desc') || 'Agregar precio a base de precios',
        },
      ],
      reportes: [
        {
          id: 'generate-report',
          label: t('quick_actions.generate_report') || 'Generar Reporte',
          icon: FileText,
          action: () => {
            setIsOpen(false);
          },
          description: t('quick_actions.generate_report_desc') || 'Crear reporte técnico',
        },
      ],
      predictivo: [
        {
          id: 'run-analysis',
          label: t('quick_actions.run_analysis') || 'Ejecutar Análisis',
          icon: Calculator,
          action: () => {
            setIsOpen(false);
          },
          description: t('quick_actions.run_analysis_desc') || 'Ejecutar análisis predictivo',
        },
      ],
      exportacion: [
        {
          id: 'export-data',
          label: t('quick_actions.export_data') || 'Exportar Datos',
          icon: FileText,
          action: () => {
            setIsOpen(false);
          },
          description: t('quick_actions.export_data_desc') || 'Exportar datos a Excel/PDF',
        },
      ],
      notificaciones: [
        {
          id: 'mark-read',
          label: t('quick_actions.mark_read') || 'Marcar Leídas',
          icon: Bell,
          action: () => {
            setIsOpen(false);
          },
          description: t('quick_actions.mark_read_desc') || 'Marcar notificaciones como leídas',
        },
      ],
      'admin-sistema': [
        {
          id: 'add-user',
          label: t('quick_actions.add_user') || 'Agregar Usuario',
          icon: Users,
          action: () => {
            setIsOpen(false);
          },
          description: t('quick_actions.add_user_desc') || 'Crear nuevo usuario',
        },
      ],
      ajustes: [
        {
          id: 'reset-settings',
          label: t('quick_actions.reset_settings') || 'Restablecer Ajustes',
          icon: Settings,
          action: () => {
            setIsOpen(false);
          },
          description: t('quick_actions.reset_settings_desc') || 'Restablecer configuración por defecto',
        },
      ],
      impuestos: [
        {
          id: 'add-tax',
          label: t('quick_actions.add_tax') || 'Agregar Impuesto',
          icon: Calculator,
          action: () => {
            setIsOpen(false);
          },
          description: t('quick_actions.add_tax_desc') || 'Registrar nuevo impuesto',
        },
      ],
      login: [],
    };

    const contextActions = viewActions[view] || [];
    return [...contextActions, ...commonActions];
  }, [view, setView, t]);

  if (actions.length === 0) return null;

  const handleFabClick = () => {
    if (isMinimized) {
      setIsMinimized(false);
    } else {
      setIsOpen(!isOpen);
    }
  };

  const handleActionClick = (action: QuickAction) => {
    action.action();
  };

  const handleMinimizeToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMinimized(!isMinimized);
    setIsOpen(false);
  };

  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(false);
  };

  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-2">
      <AnimatePresence>
        {isOpen && !isMinimized && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col items-end gap-2 mb-2"
          >
            {actions.map((action, index) => {
              const Icon = action.icon;
              return (
                <motion.button
                  key={action.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.2, delay: index * 0.05 }}
                  onClick={() => handleActionClick(action)}
                  className="group flex items-center gap-3 px-4 py-2.5 bg-card hover:bg-muted border border-border rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 min-w-[200px] max-w-xs"
                >
                  <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="text-sm font-medium text-foreground">{action.label}</div>
                    {action.description && (
                      <div className="text-xs text-muted-foreground">{action.description}</div>
                    )}
                  </div>
                </motion.button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center gap-2">
        <AnimatePresence>
          {isOpen && !isMinimized && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.15 }}
              onClick={handleClose}
              className="p-2 bg-muted hover:bg-muted/80 rounded-lg text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Cerrar acciones rápidas"
            >
              <X className="w-5 h-5" />
            </motion.button>
          )}
        </AnimatePresence>

        <motion.button
          onClick={handleFabClick}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="relative group flex items-center justify-center w-14 h-14 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full shadow-lg hover:shadow-xl transition-all duration-200"
          aria-label={isOpen ? 'Cerrar acciones rápidas' : 'Abrir acciones rápidas'}
          aria-expanded={isOpen}
        >
          <motion.div
            animate={{ rotate: isMinimized ? 0 : isOpen ? 0 : 0 }}
            transition={{ duration: 0.2 }}
          >
            {isMinimized ? (
              <ChevronUp className="w-6 h-6" />
            ) : isOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <motion.div animate={{ rotate: isOpen ? 45 : 0 }} transition={{ duration: 0.2 }}>
                <Plus className="w-6 h-6" />
              </motion.div>
            )}
          </motion.div>

          <button
            onClick={handleMinimizeToggle}
            className="absolute -top-1 -right-1 w-5 h-5 bg-background border border-border rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shadow-sm"
            aria-label={isMinimized ? 'Expandir' : 'Minimizar'}
          >
            <div className="w-2 h-2 rounded-full bg-current" />
          </button>
        </motion.button>
      </div>
    </div>
  );
};

export default QuickActionsFab;
