import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
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
  StaggerChildren,
  FadeIn,
  ScaleIn,
  SlideInRight,
  AnimatedCounter,
  PulseDot,
  SkeletonCard,
  LoadingSpinner,
} from '@/components/Animations';

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

// ─── Animations — FadeIn ─────────────────────────────────────────────────────

describe('FadeIn', () => {
  it('renderiza children', () => {
    render(<FadeIn><span>Fade</span></FadeIn>);
    expect(screen.getByText('Fade')).toBeDefined();
  });

  it('acepta delay y duration props', () => {
    const { container } = render(<FadeIn delay={100} duration={500}><div>Test</div></FadeIn>);
    expect(container.firstChild).toBeDefined();
  });

  it('aplica className adicional', () => {
    const { container } = render(<FadeIn className="extra-class"><div>Test</div></FadeIn>);
    expect((container.firstChild as HTMLElement).className).toContain('extra-class');
  });

  it('con animations-disabled muestra contenido inmediatamente', () => {
    document.documentElement.classList.add('animations-disabled');
    render(<FadeIn delay={9999}><span>Visible</span></FadeIn>);
    expect(screen.getByText('Visible')).toBeDefined();
    document.documentElement.classList.remove('animations-disabled');
  });
});

// ─── Animations — ScaleIn ────────────────────────────────────────────────────

describe('ScaleIn', () => {
  it('renderiza children', () => {
    render(<ScaleIn><span>Scale</span></ScaleIn>);
    expect(screen.getByText('Scale')).toBeDefined();
  });

  it('acepta delay prop', () => {
    const { container } = render(<ScaleIn delay={200}><div>Test</div></ScaleIn>);
    expect(container.firstChild).toBeDefined();
  });
});

// ─── Animations — SlideInRight ───────────────────────────────────────────────

describe('SlideInRight', () => {
  it('renderiza children', () => {
    render(<SlideInRight><span>Slide</span></SlideInRight>);
    expect(screen.getByText('Slide')).toBeDefined();
  });

  it('acepta delay y className props', () => {
    const { container } = render(
      <SlideInRight delay={50} className="slide-class"><div>Test</div></SlideInRight>
    );
    expect((container.firstChild as HTMLElement).className).toContain('slide-class');
  });
});

// ─── Animations — StaggerChildren ────────────────────────────────────────────

describe('StaggerChildren', () => {
  it('renderiza todos los hijos', () => {
    render(
      <StaggerChildren>
        {['A', 'B', 'C'].map(t => <span key={t}>{t}</span>)}
      </StaggerChildren>
    );
    expect(screen.getByText('A')).toBeDefined();
    expect(screen.getByText('B')).toBeDefined();
    expect(screen.getByText('C')).toBeDefined();
  });

  it('acepta baseDelay y className', () => {
    const { container } = render(
      <StaggerChildren baseDelay={100} className="stagger-class">
        {[<span key="1">Item</span>]}
      </StaggerChildren>
    );
    expect((container.firstChild as HTMLElement).className).toContain('stagger-class');
  });
});

// ─── Animations — AnimatedCounter ────────────────────────────────────────────

describe('AnimatedCounter', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('renderiza el valor final con animations-disabled', () => {
    document.documentElement.classList.add('animations-disabled');
    render(<AnimatedCounter value={42} />);
    expect(screen.getByText('42')).toBeDefined();
    document.documentElement.classList.remove('animations-disabled');
  });

  it('renderiza prefix y suffix', () => {
    document.documentElement.classList.add('animations-disabled');
    render(<AnimatedCounter value={100} prefix="Q" suffix=" GTQ" />);
    expect(screen.getByText('Q100 GTQ')).toBeDefined();
    document.documentElement.classList.remove('animations-disabled');
  });

  it('aplica className', () => {
    document.documentElement.classList.add('animations-disabled');
    const { container } = render(<AnimatedCounter value={5} className="counter-class" />);
    expect((container.firstChild as HTMLElement).className).toContain('counter-class');
    document.documentElement.classList.remove('animations-disabled');
  });
});

// ─── Animations — PulseDot ───────────────────────────────────────────────────

describe('PulseDot', () => {
  it.each(['success', 'warning', 'danger', 'info'] as const)(
    'renderiza color "%s"',
    (color) => {
      const { container } = render(<PulseDot color={color} />);
      expect(container.firstChild).toBeDefined();
    }
  );

  it.each(['sm', 'md', 'lg'] as const)('renderiza size "%s"', (size) => {
    const { container } = render(<PulseDot size={size} />);
    expect(container.firstChild).toBeDefined();
  });

  it('muestra label cuando se provee', () => {
    render(<PulseDot label="En línea" />);
    expect(screen.getByText('En línea')).toBeDefined();
  });

  it('tiene role="status"', () => {
    render(<PulseDot />);
    expect(screen.getByRole('status')).toBeDefined();
  });

  it('aria-label usa label cuando se provee', () => {
    render(<PulseDot label="Activo" />);
    expect(screen.getByRole('status').getAttribute('aria-label')).toBe('Activo');
  });
});

// ─── Animations — SkeletonCard ───────────────────────────────────────────────

describe('SkeletonCard', () => {
  it('renderiza sin errores con defaults', () => {
    const { container } = render(<SkeletonCard />);
    expect(container.firstChild).toBeDefined();
  });

  it('renderiza el número correcto de líneas', () => {
    const { container } = render(<SkeletonCard lines={5} />);
    // 1 header shimmer + 5 line shimmers = 6 shimmer divs
    const shimmers = container.querySelectorAll('.shimmer-enhanced');
    expect(shimmers.length).toBe(6);
  });

  it('aplica className adicional', () => {
    const { container } = render(<SkeletonCard className="custom-skeleton" />);
    expect((container.firstChild as HTMLElement).className).toContain('custom-skeleton');
  });
});

// ─── Animations — LoadingSpinner ─────────────────────────────────────────────

describe('LoadingSpinner', () => {
  it('renderiza con defaults', () => {
    render(<LoadingSpinner />);
    expect(screen.getByRole('status')).toBeDefined();
  });

  it.each(['sm', 'md', 'lg'] as const)('renderiza size "%s"', (size) => {
    const { container } = render(<LoadingSpinner size={size} />);
    expect(container.firstChild).toBeDefined();
  });

  it('muestra label cuando se provee', () => {
    render(<LoadingSpinner label="Cargando datos..." />);
    expect(screen.getByText('Cargando datos...')).toBeDefined();
  });

  it('aria-label usa label cuando se provee', () => {
    render(<LoadingSpinner label="Procesando" />);
    expect(screen.getByRole('status').getAttribute('aria-label')).toBe('Procesando');
  });

  it('aplica className adicional', () => {
    const { container } = render(<LoadingSpinner className="spinner-class" />);
    expect((container.firstChild as HTMLElement).className).toContain('spinner-class');
  });
});
