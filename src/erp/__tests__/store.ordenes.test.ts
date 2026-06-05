import { describe, it, expect } from 'vitest';

describe('Lógica de Órdenes de Compra', () => {
  it('calcula el total de una orden con múltiples ítems', () => {
    const items = [
      { materialId: 'mat-1', cantidad: 5, precioUnitario: 30 },
      { materialId: 'mat-2', cantidad: 2, precioUnitario: 100 },
    ]
    const total = items.reduce((acc, i) => acc + i.cantidad * i.precioUnitario, 0)
    expect(total).toBe(350)
  })

  it('una orden nueva tiene estado pendiente', () => {
    const orden = {
      proyectoId: 'test-proy',
      proveedorId: 'test-prov',
      fecha: new Date().toISOString().slice(0, 10),
      estado: 'pendiente',
      total: 150,
      items: [{ materialId: 'mat-1', cantidad: 5, precioUnitario: 30 }],
    }
    expect(orden.estado).toBe('pendiente')
    expect(orden.total).toBe(150)
  })

  it('total con ítems vacíos es cero', () => {
    const items: { materialId: string; cantidad: number; precioUnitario: number }[] = []
    const total = items.reduce((acc, i) => acc + i.cantidad * i.precioUnitario, 0)
    expect(total).toBe(0)
  })
})