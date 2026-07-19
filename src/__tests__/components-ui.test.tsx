import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act, cleanup } from '@testing-library/react';
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

afterEach(cleanup);

// ─── ElevatedCard ─────────────────────────────────────────────────────────────

describe('ElevatedCard', () => {
  it('renderiza children', () => {
    render(<ElevatedCard><span data-testid="child">Contenido</span></ElevatedCard>);
    expect(screen.getByTestId('child')).toBeDefined();
  });

  it('aplica variant default por defecto', () => {
    const { container } = render(<ElevatedCard>Card</ElevatedCard>);
    expect(container.firstChild).toBeDefined();
  });

  it.each(['default', 'interactive', 'kpi', 'modal', 'glass'] as const)(
    'renderiza variant "%s" sin errores',
    (variant) => {
      const { container } = render(<ElevatedCard variant={variant}>Card</ElevatedCard>);
      expect(container.firstChild).toBeDefined();
    }
  );

  it.each(['none', 'sm', 'md', 'lg'] as const)(
    'renderiza padding "%s" sin errores',
    (padding) => {
      const { container } = render(<ElevatedCard padding={padding}>Card</ElevatedCard>);
      expect(container.firstChild).toBeDefined();
    }
  );

  it.each(['top', 'left', 'none'] as const)(
    'renderiza accent "%s" sin errores',
    (accent) => {
      const { container } = render(<ElevatedCard accent={accent}>Card</ElevatedCard>);
      expect(container.firstChild).toBeDefined();
    }
  );

  it('asigna role="button" y tabIndex cuando es clickable', () => {
    const onClick = vi.fn();
    render(<ElevatedCard onClick={onClick}>Clickable</ElevatedCard>);
    const card = screen.getByRole('button');
    expect(card).toBeDefined();
    expect(card.getAttribute('tabindex')).toBe('0');
  });

  it('llama onClick al hacer click', () => {
    const onClick = vi.fn();
    render(<ElevatedCard onClick={onClick}>Click me</ElevatedCard>);
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('llama onClick al presionar Enter', () => {
    const onClick = vi.fn();
    render(<ElevatedCard onClick={onClick}>Enter</ElevatedCard>);
    fireEvent.keyDown(screen.getByRole('button'), { key: 'Enter' });
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('llama onClick al presionar Space', () => {
    const onClick = vi.fn();
    render(<ElevatedCard onClick={onClick}>Space</ElevatedCard>);
    fireEvent.keyDown(screen.getByRole('button'), { key: ' ' });
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('NO asigna role="button" sin onClick ni hoverable', () => {
    const { container } = render(<ElevatedCard>Static</ElevatedCard>);
    const div = container.firstChild as HTMLElement;
    expect(div.getAttribute('role')).toBeNull();
    expect(div.getAttribute('tabindex')).toBeNull();
  });

  it('aplica className adicional', () => {
    const { container } = render(<ElevatedCard className="custom-class">Card</ElevatedCard>);
    expect((container.firstChild as HTMLElement).className).toContain('custom-class');
  });

  it('renderiza sub-componentes correctamente', () => {
    render(
      <ElevatedCard>
        <ElevatedCardHeader>
          <ElevatedCardTitle>Título</ElevatedCardTitle>
          <ElevatedCardDescription>Descripción</ElevatedCardDescription>
        </ElevatedCardHeader>
        <ElevatedCardContent>Contenido</ElevatedCardContent>
        <ElevatedCardFooter>Footer</ElevatedCardFooter>
      </ElevatedCard>
    );
    expect(screen.getByText('Título')).toBeDefined();
    expect(screen.getByText('Descripción')).toBeDefined();
    expect(screen.getByText('Contenido')).toBeDefined();
    expect(screen.getByText('Footer')).toBeDefined();
  });

  it('ElevatedCardTitle renderiza como h3', () => {
    render(<ElevatedCardTitle>Mi Título</ElevatedCardTitle>);
    expect(screen.getByRole('heading', { level: 3 })).toBeDefined();
  });
});

// ─── FloatingLabelInput ───────────────────────────────────────────────────────

describe('FloatingLabelInput', () => {
  it('renderiza label y lo asocia al input via htmlFor', () => {
    render(<FloatingLabelInput label="Nombre" id="nombre" />);
    const label = screen.getByText('Nombre');
    expect(label.getAttribute('for')).toBe('nombre');
  });

  it('genera id automático desde label si no se provee id', () => {
    render(<FloatingLabelInput label="Mi Campo" />);
    const input = screen.getByPlaceholderText('Mi Campo');
    expect(input.getAttribute('id')).toBe('floating-mi-campo');
  });

  it('dispara onChange con el valor correcto', () => {
    const onChange = vi.fn();
    render(<FloatingLabelInput label="Test" id="test" onChange={onChange} />);
    fireEvent.change(screen.getByLabelText('Test'), { target: { value: 'hola' } });
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('muestra mensaje de error cuando se provee error', () => {
    render(<FloatingLabelInput label="Email" id="email" error="Email inválido" />);
    expect(screen.getByText('Email inválido')).toBeDefined();
  });

  it('muestra helperText cuando no hay error', () => {
    render(<FloatingLabelInput label="Pass" id="pass" helperText="Mínimo 8 caracteres" />);
    expect(screen.getByText('Mínimo 8 caracteres')).toBeDefined();
  });

  it('NO muestra helperText cuando hay error', () => {
    render(
      <FloatingLabelInput label="Pass" id="pass" error="Error" helperText="Helper" />
    );
    expect(screen.queryByText('Helper')).toBeNull();
    expect(screen.getByText('Error')).toBeDefined();
  });

  it('renderiza leftIcon cuando se provee', () => {
    render(
      <FloatingLabelInput
        label="Buscar"
        id="buscar"
        leftIcon={<span data-testid="left-icon">🔍</span>}
      />
    );
    expect(screen.getByTestId('left-icon')).toBeDefined();
  });

  it('renderiza rightIcon cuando se provee', () => {
    render(
      <FloatingLabelInput
        label="Pass"
        id="pass"
        rightIcon={<span data-testid="right-icon">👁</span>}
      />
    );
    expect(screen.getByTestId('right-icon')).toBeDefined();
  });

  it('respeta prop disabled', () => {
    render(<FloatingLabelInput label="Disabled" id="disabled" disabled />);
    expect((screen.getByLabelText('Disabled') as HTMLInputElement).disabled).toBe(true);
  });

  it('respeta prop type', () => {
    render(<FloatingLabelInput label="Pass" id="pass" type="password" />);
    expect((screen.getByLabelText('Pass') as HTMLInputElement).type).toBe('password');
  });
});

// ─── FloatingLabelSelect ──────────────────────────────────────────────────────

describe('FloatingLabelSelect', () => {
  const options = [
    { value: 'gt', label: 'Guatemala' },
    { value: 'mx', label: 'México' },
  ];

  it('renderiza label y opciones', () => {
    render(<FloatingLabelSelect label="País" id="pais" options={options} />);
    expect(screen.getByText('País')).toBeDefined();
    expect(screen.getByText('Guatemala')).toBeDefined();
    expect(screen.getByText('México')).toBeDefined();
  });

  it('muestra error cuando se provee', () => {
    render(
      <FloatingLabelSelect label="País" id="pais" options={options} error="Requerido" />
    );
    expect(screen.getByText('Requerido')).toBeDefined();
  });

  it('dispara onChange al seleccionar opción', () => {
    const onChange = vi.fn();
    render(
      <FloatingLabelSelect label="País" id="pais" options={options} onChange={onChange} />
    );
    fireEvent.change(screen.getByLabelText('País'), { target: { value: 'mx' } });
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('genera id automático desde label', () => {
    render(<FloatingLabelSelect label="Mi Select" options={options} />);
    const select = screen.getByLabelText('Mi Select');
    expect(select.getAttribute('id')).toBe('floating-select-mi-select');
  });
});

// ─── FloatingLabelTextarea ────────────────────────────────────────────────────

describe('FloatingLabelTextarea', () => {
  it('renderiza label asociado al textarea', () => {
    render(<FloatingLabelTextarea label="Descripción" id="desc" />);
    expect(screen.getByText('Descripción')).toBeDefined();
    expect(screen.getByLabelText('Descripción')).toBeDefined();
  });

  it('muestra error cuando se provee', () => {
    render(<FloatingLabelTextarea label="Notas" id="notas" error="Campo requerido" />);
    expect(screen.getByText('Campo requerido')).toBeDefined();
  });

  it('dispara onChange', () => {
    const onChange = vi.fn();
    render(<FloatingLabelTextarea label="Notas" id="notas" onChange={onChange} />);
    fireEvent.change(screen.getByLabelText('Notas'), { target: { value: 'texto' } });
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('genera id automático desde label', () => {
    render(<FloatingLabelTextarea label="Mi Área" />);
    const ta = screen.getByLabelText('Mi Área');
    expect(ta.getAttribute('id')).toBe('floating-textarea-mi-área');
  });
});

// ─── Animations — PageTransition ─────────────────────────────────────────────

describe('PageTransition', () => {
  it('renderiza children', () => {
    render(<PageTransition><span>Contenido</span></PageTransition>);
    expect(screen.getByText('Contenido')).toBeDefined();
  });

  it.each(['fade', 'slide', 'scale', 'none'] as const)(
    'acepta animationType="%s"',
    (type) => {
      const { container } = render(
        <PageTransition animationType={type}><div>Test</div></PageTransition>
      );
      expect(container.firstChild).toBeDefined();
    }
  );

  it('con animations-disabled muestra contenido inmediatamente', () => {
    document.documentElement.classList.add('animations-disabled');
    render(<PageTransition><span>Inmediato</span></PageTransition>);
    expect(screen.getByText('Inmediato')).toBeDefined();
    document.documentElement.classList.remove('animations-disabled');
  });
});
