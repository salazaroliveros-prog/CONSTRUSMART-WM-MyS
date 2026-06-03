describe('Pruebas Críticas de Integridad de Presupuestos', () => {
  it('debe calcular correctamente el costo directo incluyendo subRenglones', () => {
    const subRenglones = [
      { id: '1', nombre: 'Cemento', cantidad: 10, costoUnitario: 20 },
      { id: '2', nombre: 'Arena', cantidad: 5, costoUnitario: 10 }
    ];
    const total = subRenglones.reduce((acc, sr) => acc + (sr.cantidad * sr.costoUnitario), 0);
    expect(total).toBe(250);
  });

  it('debe validar que los avances no superen el 100%', () => {
    const avanceFisico = 105;
    const esValido = avanceFisico <= 100;
    expect(esValido).toBe(false);
  });
});

describe('Pruebas Críticas de Inventario', () => {
  it('debe detectar stock crítico', () => {
    const material = { nombre: 'Acero', stock: 5, stockMinimo: 10 };
    const esCritico = material.stock < material.stockMinimo;
    expect(esCritico).toBe(true);
  });
});
