/**
 * Tests de Accesibilidad — axe-core via vitest-axe
 * Verifica que los componentes clave no tengan violaciones WCAG
 */
import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { axe } from 'vitest-axe';

import {
  ElevatedCard,
  ElevatedCardHeader,
  ElevatedCardTitle,
  ElevatedCardDescription,
  ElevatedCardContent,
  ElevatedCardFooter,
} from '@/components/ui/elevated-card';
import {
  FloatingLabelInput,
  FloatingLabelSelect,
  FloatingLabelTextarea,
} from '@/components/ui/floating-label-input';
import {
  PageTransition,
} from '@/components/Animations';

// ─── ElevatedCard ─────────────────────────────────────────────────────────────

describe('Accesibilidad — ElevatedCard', () => {
  it('card estática no tiene violaciones', async () => {
    const { container } = render(
      <ElevatedCard>
        <ElevatedCardHeader>
          <ElevatedCardTitle>Título del card</ElevatedCardTitle>
          <ElevatedCardDescription>Descripción del card</ElevatedCardDescription>
        </ElevatedCardHeader>
        <ElevatedCardContent>Contenido principal</ElevatedCardContent>
        <ElevatedCardFooter>
          <button type="button">Acción</button>
        </ElevatedCardFooter>
      </ElevatedCard>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('card interactiva (onClick) no tiene violaciones', async () => {
    const { container } = render(
      <ElevatedCard onClick={() => {}}>
        <ElevatedCardContent>Card clickable</ElevatedCardContent>
      </ElevatedCard>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('card con variant kpi no tiene violaciones', async () => {
    const { container } = render(
      <ElevatedCard variant="kpi">
        <ElevatedCardTitle>Q 125,000</ElevatedCardTitle>
        <ElevatedCardDescription>Presupuesto total</ElevatedCardDescription>
      </ElevatedCard>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});

// ─── FloatingLabelInput ───────────────────────────────────────────────────────

describe('Accesibilidad — FloatingLabelInput', () => {
  it('input básico no tiene violaciones', async () => {
    const { container } = render(
      <FloatingLabelInput label="Nombre completo" id="nombre" />
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('input con error no tiene violaciones', async () => {
    const { container } = render(
      <FloatingLabelInput
        label="Email"
        id="email"
        type="email"
        error="Formato de email inválido"
      />
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('input con helperText no tiene violaciones', async () => {
    const { container } = render(
      <FloatingLabelInput
        label="Contraseña"
        id="password"
        type="password"
        helperText="Mínimo 8 caracteres"
      />
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('input deshabilitado no tiene violaciones', async () => {
    const { container } = render(
      <FloatingLabelInput label="Campo bloqueado" id="bloqueado" disabled />
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});

// ─── FloatingLabelSelect ──────────────────────────────────────────────────────

describe('Accesibilidad — FloatingLabelSelect', () => {
  const options = [
    { value: 'gt', label: 'Guatemala' },
    { value: 'mx', label: 'México' },
    { value: 'sv', label: 'El Salvador' },
  ];

  it('select básico no tiene violaciones', async () => {
    const { container } = render(
      <FloatingLabelSelect label="País" id="pais" options={options} />
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('select con error no tiene violaciones', async () => {
    const { container } = render(
      <FloatingLabelSelect
        label="Departamento"
        id="depto"
        options={options}
        error="Selección requerida"
      />
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});

// ─── FloatingLabelTextarea ────────────────────────────────────────────────────

describe('Accesibilidad — FloatingLabelTextarea', () => {
  it('textarea básico no tiene violaciones', async () => {
    const { container } = render(
      <FloatingLabelTextarea label="Descripción del proyecto" id="descripcion" />
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('textarea con error no tiene violaciones', async () => {
    const { container } = render(
      <FloatingLabelTextarea
        label="Observaciones"
        id="obs"
        error="Campo requerido"
      />
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});

// ─── Animations ───────────────────────────────────────────────────────────────

describe('Accesibilidad — PageTransition', () => {
  it('PageTransition con contenido semántico no tiene violaciones', async () => {
    const { container } = render(
      <PageTransition animationType="fade">
        <main>
          <h1>Dashboard</h1>
          <p>Bienvenido al sistema</p>
        </main>
      </PageTransition>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});

// ─── Formularios compuestos ───────────────────────────────────────────────────

describe('Accesibilidad — Formulario compuesto', () => {
  it('formulario con múltiples campos no tiene violaciones', async () => {
    const { container } = render(
      <form aria-label="Formulario de proyecto">
        <FloatingLabelInput label="Nombre del proyecto" id="proj-nombre" />
        <FloatingLabelInput label="Cliente" id="proj-cliente" />
        <FloatingLabelSelect
          label="Estado"
          id="proj-estado"
          options={[
            { value: 'activo', label: 'Activo' },
            { value: 'pausado', label: 'Pausado' },
            { value: 'finalizado', label: 'Finalizado' },
          ]}
        />
        <FloatingLabelTextarea label="Descripción" id="proj-desc" />
        <button type="submit">Guardar proyecto</button>
      </form>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('formulario con errores de validación no tiene violaciones', async () => {
    const { container } = render(
      <form aria-label="Formulario con errores">
        <FloatingLabelInput
          label="Nombre"
          id="err-nombre"
          error="El nombre es requerido"
          aria-invalid="true"
          aria-describedby="err-nombre-error"
        />
        <FloatingLabelInput
          label="Presupuesto"
          id="err-presupuesto"
          type="number"
          error="Debe ser mayor a 0"
          aria-invalid="true"
        />
        <button type="submit" disabled>Guardar</button>
      </form>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});

// ─── KPI Cards (patrón común en Dashboard) ───────────────────────────────────

describe('Accesibilidad — KPI Cards', () => {
  it('grid de KPI cards no tiene violaciones', async () => {
    const kpis = [
      { label: 'Proyectos activos', value: '12', color: 'text-emerald-600' },
      { label: 'Presupuesto total', value: 'Q 2.4M', color: 'text-blue-600' },
      { label: 'Empleados', value: '48', color: 'text-purple-600' },
    ];

    const { container } = render(
      <section aria-label="Indicadores clave">
        <div role="list">
          {kpis.map((kpi) => (
            <div key={kpi.label} role="listitem">
              <ElevatedCard variant="kpi">
                <ElevatedCardContent>
                  <p className="text-xs text-muted-foreground">{kpi.label}</p>
                  <p className={`text-2xl font-bold ${kpi.color}`} aria-label={`${kpi.label}: ${kpi.value}`}>
                    {kpi.value}
                  </p>
                </ElevatedCardContent>
              </ElevatedCard>
            </div>
          ))}
        </div>
      </section>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});

// ─── Tabla accesible ─────────────────────────────────────────────────────────

describe('Accesibilidad — Tabla de datos', () => {
  it('tabla con headers y caption no tiene violaciones', async () => {
    const { container } = render(
      <table>
        <caption>Lista de insumos base</caption>
        <thead>
          <tr>
            <th scope="col">Insumo</th>
            <th scope="col">Unidad</th>
            <th scope="col">Precio base</th>
            <th scope="col">Rubro</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Cemento Portland</td>
            <td>saco</td>
            <td>Q 92.00</td>
            <td>Concreto</td>
          </tr>
          <tr>
            <td>Arena de río</td>
            <td>m³</td>
            <td>Q 145.00</td>
            <td>Concreto</td>
          </tr>
        </tbody>
      </table>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});

// ─── Navegación y botones ─────────────────────────────────────────────────────

describe('Accesibilidad — Botones y controles', () => {
  it('botones con texto descriptivo no tienen violaciones', async () => {
    const { container } = render(
      <div>
        <button type="button">Agregar proyecto</button>
        <button type="button" aria-label="Eliminar proyecto Alpha">
          <span aria-hidden="true">🗑</span>
        </button>
        <button type="button" disabled>Guardar (deshabilitado)</button>
      </div>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('nav con aria-label no tiene violaciones', async () => {
    const { container } = render(
      <nav aria-label="Navegación principal">
        <ul>
          <li><a href="/dashboard">Dashboard</a></li>
          <li><a href="/proyectos">Proyectos</a></li>
          <li><a href="/presupuestos" aria-current="page">Presupuestos</a></li>
        </ul>
      </nav>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
