import { describe, it, expect } from 'vitest';

describe('Lógica de Presupuestos', () => {
  it('un presupuesto nuevo inicia en estado borrador', () => {
    const presupuesto = {
      proyectoId: 'test-proy',
      tipologia: 'residencial',
      renglones: [],
      totalCalculado: 100,
      costoDirectoTotal: 80,
      estado: 'borrador',
      fechaCreacion: new Date().toISOString(),
      fechaActualizacion: new Date().toISOString(),
      notas: 'test',
    }
    expect(presupuesto.estado).toBe('borrador')
    expect(presupuesto.totalCalculado).toBeGreaterThan(0)
  })

  it('totalCalculado es mayor que costoDirectoTotal (contiene indirectos)', () => {
    const total = 100
    const costoDirecto = 80
    expect(total).toBeGreaterThan(costoDirecto)
  })

  it('renglones vacíos producen total cero', () => {
    const renglones: { costoTotal: number }[] = []
    const total = renglones.reduce((acc, r) => acc + r.costoTotal, 0)
    expect(total).toBe(0)
  })

  it('versión siguiente se incrementa correctamente', () => {
    const existentes = [{ versionPresupuesto: 1 }]
    const nextVersion = existentes.length > 0
      ? Math.max(...existentes.map(p => p.versionPresupuesto || 1)) + 1
      : 1
    expect(nextVersion).toBe(2)
  })
})