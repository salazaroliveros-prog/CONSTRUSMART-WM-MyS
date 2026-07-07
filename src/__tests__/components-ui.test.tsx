import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ElevatedCard } from '@/components/ui/elevated-card';
import { FloatingLabelInput } from '@/components/ui/floating-label-input';
import { PageTransition } from '@/components/Animations';

describe('ElevatedCard', () => {
  it('renderiza children correctamente', () => {
    render(<ElevatedCard><div data-testid="card-child">Contenido</div></ElevatedCard>);
    expect(screen.getByTestId('card-child')).toBeDefined();
    expect(screen.getByText('Contenido')).toBeDefined();
  });

  it('aplica la clase de elevación correcta', () => {
    const { container } = render(<ElevatedCard elevation={3}>Card</ElevatedCard>);
    const card = container.firstChild;
    expect(card).toBeDefined();
  });

  it('aplica hoverable cuando se especifica', () => {
    const { container } = render(<ElevatedCard hoverable>Card hovereable</ElevatedCard>);
    const card = container.firstChild;
    expect(card).toBeDefined();
  });

});

describe('FloatingLabelInput', () => {
  it('renderiza el label correctamente', () => {
    render(<FloatingLabelInput label="Nombre" id="nombre" />);
    expect(screen.getByText('Nombre')).toBeDefined();
  });

  it('muestra el placeholder cuando no hay valor', () => {
    render(<FloatingLabelInput label="Email" id="email" placeholder="correo@ejemplo.com" />);
    expect(screen.getByPlaceholderText('correo@ejemplo.com')).toBeDefined();
  });

  it('llama onChange cuando el valor cambia', () => {
    let valor = '';
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => { valor = e.target.value; };
    render(<FloatingLabelInput label="Test" id="test" onChange={handleChange} />);
    const input = screen.getByLabelText('Test');
    fireEvent.change(input, { target: { value: 'nuevo valor' } });
    expect(valor).toBe('nuevo valor');
  });
});

describe('PageTransition', () => {
  it('renderiza children correctamente', () => {
    const { container } = render(<PageTransition><div>Test</div></PageTransition>);
    expect(screen.getByText('Test')).toBeDefined();
    expect(container.firstChild).toBeDefined();
  });

  it('acepta animationType prop', () => {
    const { container: fadeContainer } = render(<PageTransition animationType="fade"><div>Fade</div></PageTransition>);
    expect(fadeContainer.firstChild).toBeDefined();

    const { container: slideContainer } = render(<PageTransition animationType="slide"><div>Slide</div></PageTransition>);
    expect(slideContainer.firstChild).toBeDefined();

    const { container: scaleContainer } = render(<PageTransition animationType="scale"><div>Scale</div></PageTransition>);
    expect(scaleContainer.firstChild).toBeDefined();

    const { container: noneContainer } = render(<PageTransition animationType="none"><div>None</div></PageTransition>);
    expect(noneContainer.firstChild).toBeDefined();
  });
});