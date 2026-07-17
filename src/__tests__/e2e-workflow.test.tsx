import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ErpProvider } from '@/erp/store';
import { useErpStore } from '@/erp/zustandStore';

// Mock de Supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => ({
            data: [],
            error: null,
          })),
        })),
      })),
    })),
    auth: {
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
    },
  },
  hasSupabase: true,
}));

describe('E2E Workflow Tests', () => {
  beforeEach(() => {
    // Limpiar estado antes de cada test
    useErpStore.getState().clearAllData();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Flujo de Proyectos', () => {
    it('debería crear un proyecto exitosamente', async () => {
      const user = userEvent.setup();
      
      const TestComponent = () => {
        const { addProyecto, proyectos } = useErpStore();
        
        return (
          <div>
            <button
              onClick={() => addProyecto({
                nombre: 'Proyecto Test',
                cliente: 'Cliente Test',
                tipologia: 'residencial',
                estado: 'planeacion',
                presupuestoTotal: 100000,
                montoContrato: 120000,
                avanceFisico: 0,
                avanceFinanciero: 0,
                moneda: 'GTQ',
              })}
            >
              Crear Proyecto
            </button>
            <div data-testid="proyecto-count">{proyectos.length}</div>
            <div data-testid="proyecto-nombre">{proyectos[0]?.nombre}</div>
          </div>
        );
      };

      render(
        <ErpProvider>
          <TestComponent />
        </ErpProvider>
      );

      expect(screen.getByTestId('proyecto-count')).toHaveTextContent('0');

      await user.click(screen.getByText('Crear Proyecto'));

      await waitFor(() => {
        expect(screen.getByTestId('proyecto-count')).toHaveTextContent('1');
        expect(screen.getByTestId('proyecto-nombre')).toHaveTextContent('Proyecto Test');
      });
    });

    it('debería actualizar un proyecto existente', async () => {
      const user = userEvent.setup();
      
      const TestComponent = () => {
        const { addProyecto, updateProyecto, proyectos } = useErpStore();
        
        return (
          <div>
            <button onClick={() => addProyecto({
              nombre: 'Proyecto Original',
              cliente: 'Cliente Test',
              tipologia: 'residencial',
              estado: 'planeacion',
              presupuestoTotal: 100000,
              montoContrato: 120000,
              avanceFisico: 0,
              avanceFinanciero: 0,
              moneda: 'GTQ',
            })}>
              Crear Proyecto
            </button>
            <button
              onClick={() => proyectos[0] && updateProyecto(proyectos[0].id, {
                nombre: 'Proyecto Actualizado',
                estado: 'ejecucion',
              })}
              disabled={!proyectos[0]}
            >
              Actualizar Proyecto
            </button>
            <div data-testid="proyecto-estado">{proyectos[0]?.estado}</div>
          </div>
        );
      };

      render(
        <ErpProvider>
          <TestComponent />
        </ErpProvider>
      );

      await user.click(screen.getByText('Crear Proyecto'));
      await waitFor(() => expect(screen.getByText('Actualizar Proyecto')).not.toBeDisabled());

      await user.click(screen.getByText('Actualizar Proyecto'));

      await waitFor(() => {
        expect(screen.getByTestId('proyecto-estado')).toHaveTextContent('ejecucion');
      });
    });

    it('debería eliminar un proyecto', async () => {
      const user = userEvent.setup();
      
      const TestComponent = () => {
        const { addProyecto, deleteProyecto, proyectos } = useErpStore();
        
        return (
          <div>
            <button onClick={() => addProyecto({
              nombre: 'Proyecto a Eliminar',
              cliente: 'Cliente Test',
              tipologia: 'residencial',
              estado: 'planeacion',
              presupuestoTotal: 100000,
              montoContrato: 120000,
              avanceFisico: 0,
              avanceFinanciero: 0,
              moneda: 'GTQ',
            })}>
              Crear Proyecto
            </button>
            <button
              onClick={() => proyectos[0] && deleteProyecto(proyectos[0].id)}
              disabled={!proyectos[0]}
            >
              Eliminar Proyecto
            </button>
            <div data-testid="proyecto-count">{proyectos.length}</div>
          </div>
        );
      };

      render(
        <ErpProvider>
          <TestComponent />
        </ErpProvider>
      );

      await user.click(screen.getByText('Crear Proyecto'));
      await waitFor(() => expect(screen.getByTestId('proyecto-count')).toHaveTextContent('1'));

      await user.click(screen.getByText('Eliminar Proyecto'));

      await waitFor(() => {
        expect(screen.getByTestId('proyecto-count')).toHaveTextContent('0');
      });
    });
  });

  describe('Flujo de Movimientos', () => {
    it('debería crear un movimiento de gasto', async () => {
      const user = userEvent.setup();
      
      const TestComponent = () => {
        const { addProyecto, addMovimiento, proyectos, movimientos } = useErpStore();
        
        const handleCrearProyecto = () => {
          addProyecto({
            nombre: 'Proyecto Test',
            cliente: 'Cliente Test',
            tipologia: 'residencial',
            estado: 'ejecucion',
            presupuestoTotal: 100000,
            montoContrato: 120000,
            avanceFisico: 0,
            avanceFinanciero: 0,
            moneda: 'GTQ',
          });
        };
        
        const handleCrearMovimiento = () => {
          if (proyectos[0]) {
            addMovimiento({
              proyectoId: proyectos[0].id,
              tipo: 'gasto',
              categoria: 'materiales',
              descripcion: 'Compra de materiales',
              monto: 5000,
              fecha: new Date().toISOString().slice(0, 10),
            });
          }
        };
        
        return (
          <div>
            <button onClick={handleCrearProyecto}>Crear Proyecto</button>
            <button onClick={handleCrearMovimiento} disabled={!proyectos[0]}>
              Crear Movimiento
            </button>
            <div data-testid="movimiento-count">{movimientos.length}</div>
            <div data-testid="movimiento-monto">{movimientos[0]?.monto}</div>
          </div>
        );
      };

      render(
        <ErpProvider>
          <TestComponent />
        </ErpProvider>
      );

      await user.click(screen.getByText('Crear Proyecto'));
      await waitFor(() => expect(screen.getByText('Crear Movimiento')).not.toBeDisabled());

      await user.click(screen.getByText('Crear Movimiento'));

      await waitFor(() => {
        expect(screen.getByTestId('movimiento-count')).toHaveTextContent('1');
        expect(screen.getByTestId('movimiento-monto')).toHaveTextContent('5000');
      });
    });
  });

  describe('Flujo de Validación', () => {
    it('debería rechazar proyecto sin nombre', async () => {
      const user = userEvent.setup();
      
      const TestComponent = () => {
        const { addProyecto, proyectos } = useErpStore();
        const [error, setError] = useState<string | null>(null);
        
        const handleCrearProyecto = () => {
          try {
            addProyecto({
              nombre: '', // Nombre vacío - debería fallar validación
              cliente: 'Cliente Test',
              tipologia: 'residencial',
              estado: 'planeacion',
              presupuestoTotal: 100000,
              montoContrato: 120000,
              avanceFisico: 0,
              avanceFinanciero: 0,
              moneda: 'GTQ',
            });
          } catch (e: any) {
            setError(e.message);
          }
        };
        
        return (
          <div>
            <button onClick={handleCrearProyecto}>Crear Proyecto Inválido</button>
            {error && <div data-testid="error-message">{error}</div>}
            <div data-testid="proyecto-count">{proyectos.length}</div>
          </div>
        );
      };

      render(
        <ErpProvider>
          <TestComponent />
        </ErpProvider>
      );

      await user.click(screen.getByText('Crear Proyecto Inválido'));

      // El proyecto no debería crearse debido a validación Zod
      await waitFor(() => {
        expect(screen.getByTestId('proyecto-count')).toHaveTextContent('0');
      });
    });
  });

  describe('Flujo de Sincronización', () => {
    it('debería encolar mutación cuando offline', async () => {
      const user = userEvent.setup();
      
      const TestComponent = () => {
        const { addProyecto, mutationQueue, setIsOnline } = useErpStore();
        
        return (
          <div>
            <button onClick={() => setIsOnline(false)}>Desconectar</button>
            <button onClick={() => addProyecto({
              nombre: 'Proyecto Offline',
              cliente: 'Cliente Test',
              tipologia: 'residencial',
              estado: 'planeacion',
              presupuestoTotal: 100000,
              montoContrato: 120000,
              avanceFisico: 0,
              avanceFinanciero: 0,
              moneda: 'GTQ',
            })}>
              Crear Proyecto Offline
            </button>
            <div data-testid="queue-count">{mutationQueue.length}</div>
          </div>
        );
      };

      render(
        <ErpProvider>
          <TestComponent />
        </ErpProvider>
      );

      await user.click(screen.getByText('Desconectar'));
      await user.click(screen.getByText('Crear Proyecto Offline'));

      await waitFor(() => {
        expect(screen.getByTestId('queue-count')).toHaveTextContent('1');
      });
    });
  });

  describe('Flujo de Cálculo', () => {
    it('debería calcular dosificación de concreto correctamente', async () => {
      const { ServicioMotorCalculo } = await import('@/erp/services/motorCalculo');
      
      const dosificacion = {
        resistencia: '3000psi',
        tipo: 'cimentacion',
        tamañoAgregado: '3/4"',
        aditivos: 'plastificante',
        curado: 'normal',
      };
      
      const resultado = await ServicioMotorCalculo.calcularDosificacion(
        dosificacion,
        10, // 10 m³
        'GT-01',
        1500
      );
      
      expect(resultado).toBeDefined();
      expect(resultado.cementoSacos).toBeGreaterThan(0);
      expect(resultado.arenaM3).toBeGreaterThan(0);
      expect(resultado.piedraM3).toBeGreaterThan(0);
      expect(resultado.aguaLt).toBeGreaterThan(0);
      expect(resultado.costoTotal).toBeGreaterThan(0);
    });
  });

  describe('Flujo de Notificaciones', () => {
    it('debería crear notificación de stock crítico', async () => {
      const user = userEvent.setup();
      
      const TestComponent = () => {
        const { addNotificacion, notificaciones } = useErpStore();
        
        return (
          <div>
            <button onClick={() => addNotificacion(
              'warning',
              'Stock Crítico',
              'Material XYZ tiene stock bajo',
              'proj-123',
              'mat-456'
            )}>
              Crear Notificación
            </button>
            <div data-testid="notification-count">{notificaciones.length}</div>
            <div data-testid="notification-titulo">{notificaciones[0]?.titulo}</div>
          </div>
        );
      };

      render(
        <ErpProvider>
          <TestComponent />
        </ErpProvider>
      );

      await user.click(screen.getByText('Crear Notificación'));

      await waitFor(() => {
        expect(screen.getByTestId('notification-count')).toHaveTextContent('1');
        expect(screen.getByTestId('notification-titulo')).toHaveTextContent('Stock Crítico');
      });
    });
  });
});
