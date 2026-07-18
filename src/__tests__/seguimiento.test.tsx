import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}));

vi.mock('@/components/ui/skeleton', () => ({
  Skeleton: ({ className, children }: any) => (
    <div data-testid="skeleton" className={className}>{children}</div>
  ),
}));

vi.mock('../erp/components/shared', () => ({
  ProyectoSelector: ({ proyectos, currentProyectoId, onProyectoChange }: any) => (
    <div data-testid="proyecto-selector">
      <select
        data-testid="proyecto-select"
        value={currentProyectoId}
        onChange={(e) => onProyectoChange(e.target.value)}
      >
        {proyectos.map((p: any) => (
          <option key={p.id} value={p.id}>{p.nombre}</option>
        ))}
      </select>
      <button data-testid="proyecto-prev" onClick={() => {
        const idx = proyectos.findIndex((p: any) => p.id === currentProyectoId);
        if (idx > 0) onProyectoChange(proyectos[idx - 1].id);
      }}>Prev</button>
      <button data-testid="proyecto-next" onClick={() => {
        const idx = proyectos.findIndex((p: any) => p.id === currentProyectoId);
        if (idx < proyectos.length - 1) onProyectoChange(proyectos[idx + 1].id);
      }}>Next</button>
    </div>
  ),
  TableWithRowActions: ({ data, columns, actions, emptyState }: any) => (
    <div data-testid="table-with-actions">
      {data.length === 0 ? (
        <div data-testid="empty-table">
          {emptyState?.icon && <span>{emptyState.icon}</span>}
          <span>{emptyState?.title}</span>
        </div>
      ) : (
        <table data-testid="proyectos-table">
          <thead>
            <tr>
              {columns.map((col: any) => (
                <th key={col.key}>{col.header}</th>
              ))}
              {actions?.length > 0 && <th>Acciones</th>}
            </tr>
          </thead>
          <tbody>
            {data.map((row: any) => (
              <tr key={row.id} data-testid={`table-row-${row.id}`}>
                {columns.map((col: any) => (
                  <td key={col.key}>
                    {col.render ? col.render(row[col.key]) : row[col.key]}
                  </td>
                ))}
                {actions?.map((action: any, i: number) => (
                  <td key={i}>
                    <button onClick={() => action.onClick(row)}>
                      {action.icon}{action.label}
                    </button>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  ),
}));

vi.mock('../erp/components/seguimiento', () => ({
  SeguimientoStatusBar: ({ proyecto, weatherImpact }: any) => (
    <div data-testid="status-bar">
      <span data-testid="status-bar-proyecto">{proyecto?.nombre || 'null'}</span>
      <span data-testid="status-bar-weather">{weatherImpact?.level || 'none'}</span>
    </div>
  ),
  SeguimientoAnalysisPanel: ({ proyecto }: any) => (
    <div data-testid="analysis-panel">
      <span>{proyecto?.nombre || 'null'}</span>
    </div>
  ),
  SeguimientoTabBar: ({ activeTab, onChange }: any) => (
    <div data-testid="tab-bar">
      {['analysis', 'bitacora', 'cronograma', 'riesgos'].map((tab) => (
        <button
          key={tab}
          data-testid={`tab-${tab}`}
          onClick={() => onChange(tab)}
          className={activeTab === tab ? 'active' : ''}
        >
          {tab}
        </button>
      ))}
    </div>
  ),
  SeguimientoBitacoraPanel: ({ entries, onAdd, onEdit, onDelete }: any) => (
    <div data-testid="bitacora-panel">
      <span data-testid="bitacora-count">{entries.length}</span>
      {entries.map((e: any) => (
        <div key={e.id} data-testid={`bitacora-entry-${e.id}`}>{e.tareas}</div>
      ))}
    </div>
  ),
  default: undefined,
}));

vi.mock('../erp/utils', () => ({
  fmtQ: (v: number) => `Q${v.toLocaleString('es-GT', { minimumFractionDigits: 2 })}`,
  fmtPct: (v: number) => `${v.toFixed(1)}%`,
  safePct: (v: number) => v,
}));

// ─── Logica de enriquecimiento (extraida para testeo unitario) ─────────────
function enrichProjects(proyectos: any[], movimientos: any[]) {
  return proyectos.map((p: any) => {
    const ing = movimientos
      .filter((m: any) => m.proyectoId === p.id && m.tipo === 'ingreso')
      .reduce((a: number, b: any) => a + (b.monto || 0), 0);
    const gas = movimientos
      .filter((m: any) => m.proyectoId === p.id && (m.tipo === 'gasto' || m.tipo === 'egreso'))
      .reduce((a: number, b: any) => a + (b.monto || 0), 0);
    const pendiente = Math.max(0, (p.montoContrato || 0) - ing);
    return { ...p, ingresos: ing, egresos: gas, pendiente };
  });
}

function buildTableData(proyectosEnriquecidos: any[]) {
  return proyectosEnriquecidos.map((p: any) => ({
    id: p.id,
    nombre: p.nombre,
    estado: p.estado || 'planeacion',
    avanceFisico: p.avanceFisico || 0,
    avanceFinanciero: p.avanceFinanciero || 0,
    ingresos: p.ingresos,
    egresos: p.egresos,
    presupuesto: p.presupuestoTotal || 0,
  }));
}

// ─── Mock data ────────────────────────────────────────────────────────────
const PROY_1 = {
  id: 'proj-1', nombre: 'Edificio Torre Centro', cliente: 'Inmobiliaria GT',
  ubicacion: 'Zona 10', tipologia: 'residencial', estado: 'ejecucion',
  presupuestoTotal: 5_000_000, montoContrato: 5_500_000,
  avanceFisico: 45, avanceFinanciero: 42,
  fechaInicio: '2025-01-01', fechaFin: '2025-12-31',
};
const PROY_2 = {
  id: 'proj-2', nombre: 'Parque Industrial Este', cliente: 'Logistica SA',
  ubicacion: 'Zona 15', tipologia: 'industrial', estado: 'planeacion',
  presupuestoTotal: 12_000_000, montoContrato: 13_000_000,
  avanceFisico: 10, avanceFinanciero: 8,
  fechaInicio: '2025-03-01', fechaFin: '2026-06-30',
};

const MOVS = [
  { id: 'm1', proyectoId: 'proj-1', tipo: 'ingreso', monto: 2_000_000 },
  { id: 'm2', proyectoId: 'proj-1', tipo: 'gasto', monto: 800_000 },
  { id: 'm3', proyectoId: 'proj-1', tipo: 'egreso', monto: 200_000 },
  { id: 'm4', proyectoId: 'proj-2', tipo: 'ingreso', monto: 1_000_000 },
  { id: 'm5', proyectoId: 'proj-2', tipo: 'gasto', monto: 300_000 },
];

const BITACORA = [
  { id: 'b1', proyectoId: 'proj-1', fecha: '2025-06-15', clima: 'soleado',
    personalPresente: 12, maquinaria: 'Mezcladora 1',
    tareasRealizadas: 'Colado losa', observaciones: 'Sin novedad' },
  { id: 'b2', proyectoId: 'proj-1', fecha: '2025-06-14', clima: 'nublado',
    personalPresente: 10, maquinaria: 'Mezcladora 1',
    tareasRealizadas: 'Armado acero', observaciones: 'Lluvia ligera' },
];

const HITOS = [
  { id: 'h1', proyectoId: 'proj-1', nombre: 'Cimentacion', fecha: '2025-03-01',
    tipo: 'hito', estado: 'completado' },
  { id: 'h2', proyectoId: 'proj-1', nombre: 'Estructura', fecha: '2025-07-01',
    tipo: 'hito', estado: 'pendiente' },
];

const RIESGOS = [
  { id: 'r1', proyectoId: 'proj-1', nombre: 'Retraso materiales', tipo: 'logistica',
    probabilidad: 3, impacto: 4, estado: 'identificado',
    fechaIdentificacion: '2025-01-15' },
];

const WEATHER = [
  { proyectoId: 'proj-1', impact: { level: 'medium', score: 65 } },
];

// ─── Helper to render Seguimiento ────────────────────────────────────────
let mockErpData: any;

vi.mock('../erp/store', () => ({
  useErp: () => mockErpData,
}));

async function renderSeguimiento() {
  const Seguimiento = (await import('../erp/screens/Seguimiento')).default;
  return render(React.createElement(Seguimiento));
}

afterEach(cleanup);

// =========================================================================
// TESTS
// =========================================================================
describe('Seguimiento - enrichment logic', () => {
  it('calcula ingresos sumando movimientos tipo ingreso', () => {
    const enriched = enrichProjects([PROY_1], MOVS);
    expect(enriched[0].ingresos).toBe(2_000_000);
  });

  it('calcula egresos sumando gasto + egreso', () => {
    const enriched = enrichProjects([PROY_1], MOVS);
    expect(enriched[0].egresos).toBe(1_000_000); // 800k + 200k
  });

  it('calcula pendiente como montoContrato - ingresos (min 0)', () => {
    const enriched = enrichProjects([PROY_1], MOVS);
    expect(enriched[0].pendiente).toBe(3_500_000); // 5.5M - 2M
  });

  it('pendiente nunca es negativo', () => {
    const overpaid = { ...PROY_1, montoContrato: 1_000_000 };
    const enriched = enrichProjects([overpaid], [{ id: 'x', proyectoId: 'proj-1', tipo: 'ingreso', monto: 5_000_000 }]);
    expect(enriched[0].pendiente).toBe(0);
  });

  it('pendiente es 0 si no hay montoContrato', () => {
    const noContract = { ...PROY_1, montoContrato: undefined };
    const enriched = enrichProjects([noContract], MOVS);
    expect(enriched[0].pendiente).toBe(0);
  });

  it('enriquece multiples proyectos correctamente', () => {
    const enriched = enrichProjects([PROY_1, PROY_2], MOVS);
    expect(enriched).toHaveLength(2);
    expect(enriched[0].ingresos).toBe(2_000_000);
    expect(enriched[1].ingresos).toBe(1_000_000);
    expect(enriched[1].egresos).toBe(300_000);
  });
});

describe('Seguimiento - table data logic', () => {
  it('construye filas con campos correctos', () => {
    const enriched = enrichProjects([PROY_1, PROY_2], MOVS);
    const table = buildTableData(enriched);
    expect(table).toHaveLength(2);
    expect(table[0]).toMatchObject({
      id: 'proj-1', nombre: 'Edificio Torre Centro',
      estado: 'ejecucion', avanceFisico: 45,
      presupuesto: 5_000_000,
    });
  });

  it('usa estado por defecto si falta', () => {
    const sinEstado = { ...PROY_1, estado: undefined };
    const table = buildTableData(enrichProjects([sinEstado], []));
    expect(table[0].estado).toBe('planeacion');
  });
});

describe('Seguimiento - rendering', () => {
  beforeEach(() => {
    mockErpData = {
      proyectos: [PROY_1, PROY_2],
      movimientos: MOVS,
      bitacora: BITACORA,
      hitos: HITOS,
      riesgos: RIESGOS,
      currentProjectId: 'proj-1',
      setCurrentProjectId: vi.fn(),
      proyectoWeather: WEATHER,
    };
  });

  it('renderiza titulo y descripcion', async () => {
    await renderSeguimiento();
    expect(screen.getByText('seguimiento.titulo_completo')).toBeDefined();
    expect(screen.getByText('seguimiento.descripcion')).toBeDefined();
  });

  it('renderiza proyecto selector', async () => {
    await renderSeguimiento();
    expect(screen.getByTestId('proyecto-selector')).toBeDefined();
  });

  it('renderiza status bar con proyecto seleccionado', async () => {
    await renderSeguimiento();
    expect(screen.getByTestId('status-bar')).toBeDefined();
    expect(screen.getByTestId('status-bar-proyecto').textContent).toBe('Edificio Torre Centro');
  });

  it('renderiza analysis panel por defecto', async () => {
    await renderSeguimiento();
    expect(screen.getByTestId('analysis-panel')).toBeDefined();
    expect(screen.getByTestId('tab-bar')).toBeDefined();
  });

  it('cambia de tab al hacer clic', async () => {
    await renderSeguimiento();
    fireEvent.click(screen.getByTestId('tab-bitacora'));
    expect(screen.getByTestId('bitacora-panel')).toBeDefined();
    const count = screen.getByTestId('bitacora-count');
    expect(count.textContent).toBe('2');
  });

  it('renderiza tabla de proyectos con acciones', async () => {
    await renderSeguimiento();
    expect(screen.getByTestId('proyectos-table')).toBeDefined();
    expect(screen.getByTestId('table-row-proj-1')).toBeDefined();
    expect(screen.getByTestId('table-row-proj-2')).toBeDefined();
  });

  it('muestra estado vacio cuando no hay proyectos', async () => {
    mockErpData = {
      proyectos: [], movimientos: [], bitacora: [], hitos: [],
      riesgos: [], currentProjectId: null, setCurrentProjectId: vi.fn(),
      proyectoWeather: [],
    };
    await renderSeguimiento();
    expect(screen.getByText('Sin proyectos para seguimiento')).toBeDefined();
  });

  it('selecciona primer proyecto por defecto si no hay currentProjectId', async () => {
    mockErpData = {
      proyectos: [PROY_1, PROY_2], movimientos: [], bitacora: [], hitos: [],
      riesgos: [], currentProjectId: null, setCurrentProjectId: vi.fn(),
      proyectoWeather: [],
    };
    await renderSeguimiento();
    expect(screen.getByTestId('status-bar-proyecto').textContent).toBe('Edificio Torre Centro');
    expect(screen.getByTestId('analysis-panel')).toBeDefined();
  });

  it('navega entre proyectos con botones prev/next', async () => {
    await renderSeguimiento();
    const nextBtn = screen.getByTestId('proyecto-next');
    fireEvent.click(nextBtn);
    expect(screen.getByTestId('status-bar-proyecto').textContent).toBe('Parque Industrial Este');
    const prevBtn = screen.getByTestId('proyecto-prev');
    fireEvent.click(prevBtn);
    expect(screen.getByTestId('status-bar-proyecto').textContent).toBe('Edificio Torre Centro');
  });

  it('filtra bitacora por proyecto seleccionado', async () => {
    await renderSeguimiento();
    fireEvent.click(screen.getByTestId('tab-bitacora'));
    const entries = screen.getAllByTestId(/^bitacora-entry-/);
    expect(entries).toHaveLength(2);
    expect(entries[0].textContent).toBe('Colado losa');
    expect(entries[1].textContent).toBe('Armado acero');
  });

  it('pasa weather impact a status bar', async () => {
    await renderSeguimiento();
    expect(screen.getByTestId('status-bar-weather').textContent).toBe('medium');
  });

  it('no pasa weather impact si no hay datos', async () => {
    mockErpData.proyectoWeather = [];
    await renderSeguimiento();
    expect(screen.getByTestId('status-bar-weather').textContent).toBe('none');
  });

  it('cambia proyecto via selector dropdown', async () => {
    await renderSeguimiento();
    const select = screen.getByTestId('proyecto-select') as HTMLSelectElement;
    fireEvent.change(select, { target: { value: 'proj-2' } });
    expect(screen.getByTestId('status-bar-proyecto').textContent).toBe('Parque Industrial Este');
  });
});
