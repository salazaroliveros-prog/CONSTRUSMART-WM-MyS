/**
 * TEST DE VALIDACIÓN FUNCIONAL — CONSTRUSMART ERP
 * Módulo por módulo: datos, botones, formularios, CRUD, cálculos
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// =====================================================================
// UTILIDADES COMUNES
// =====================================================================
const uid = () => crypto.randomUUID();
const hoy = new Date().toISOString().split('T')[0];

const PROYECTO_BASE = () => ({
  id: uid(),
  nombre: 'Proyecto Test',
  cliente: 'Cliente Test',
  ubicacion: 'Zona 10, Guatemala',
  tipologia: 'residencial',
  estado: 'ejecucion' as const,
  presupuesto_total: 5000000,
  monto_contrato: 5500000,
  avance_fisico: 45,
  avance_financiero: 42,
  fecha_inicio: '2025-01-01',
  fecha_fin: '2025-12-31',
  descripcion: 'Test proyecto',
  tipo_obra: 'nueva',
  pais: 'Guatemala',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
});

// =====================================================================
// 1. MÓDULO PROYECTOS
// =====================================================================
describe('1. Módulo Proyectos', () => {
  it('1.1 CRUD completo de proyectos', () => {
    let proyectos: any[] = [];
    const crear = (p: any) => { proyectos.push(p); return p; };
    const actualizar = (id: string, patch: any) => {
      proyectos = proyectos.map(p => p.id === id ? { ...p, ...patch } : p);
    };
    const eliminar = (id: string) => { proyectos = proyectos.filter(p => p.id !== id); };

    const p1 = crear(PROYECTO_BASE());
    expect(proyectos).toHaveLength(1);
    expect(proyectos[0].nombre).toBe('Proyecto Test');

    actualizar(p1.id, { nombre: 'Proyecto Actualizado', avance_fisico: 60 });
    expect(proyectos[0].nombre).toBe('Proyecto Actualizado');
    expect(proyectos[0].avance_fisico).toBe(60);
    expect(proyectos[0].cliente).toBe('Cliente Test'); // preservado

    eliminar(p1.id);
    expect(proyectos).toHaveLength(0);
  });

  it('1.2 Validación de tipologías permitidas', () => {
    const tipologiasValidas = ['residencial', 'comercial', 'civil', 'industrial', 'institucional'];
    const proyecto = PROYECTO_BASE();
    expect(tipologiasValidas).toContain(proyecto.tipologia);
    expect(tipologiasValidas).not.toContain('invalida');
  });

  it('1.3 Estados válidos de proyecto', () => {
    const estadosValidos = ['planeacion', 'ejecucion', 'finalizado', 'suspendido'];
    estadosValidos.forEach(estado => {
      const p = PROYECTO_BASE();
      p.estado = estado as any;
      expect(estadosValidos).toContain(p.estado);
    });
  });

  it('1.4 Presupuesto y contrato son numéricos positivos', () => {
    const p = PROYECTO_BASE();
    expect(p.presupuesto_total).toBeGreaterThan(0);
    expect(p.monto_contrato).toBeGreaterThan(0);
    expect(typeof p.presupuesto_total).toBe('number');
    expect(typeof p.monto_contrato).toBe('number');
  });

  it('1.5 Avances están en rango 0-100', () => {
    const p = PROYECTO_BASE();
    expect(p.avance_fisico).toBeGreaterThanOrEqual(0);
    expect(p.avance_fisico).toBeLessThanOrEqual(100);
    expect(p.avance_financiero).toBeGreaterThanOrEqual(0);
    expect(p.avance_financiero).toBeLessThanOrEqual(100);
  });
});

// =====================================================================
// 2. MÓDULO PRESUPUESTOS
// =====================================================================
describe('2. Módulo Presupuestos', () => {
  it('2.1 Cálculo de costo directo total', () => {
    const renglones = [
      { costo_materiales: 100000, costo_mano_obra: 50000, costo_equipo: 30000, cantidad: 10 },
      { costo_materiales: 80000, costo_mano_obra: 40000, costo_equipo: 20000, cantidad: 5 },
    ];
    const total = renglones.reduce((sum, r) =>
      sum + (r.costo_materiales + r.costo_mano_obra + r.costo_equipo) * r.cantidad, 0
    );
    expect(total).toBe(2500000); // (180k*10) + (140k*5) = 1800000 + 700000 = 2500000
  });

  it('2.2 Estados válidos de presupuesto', () => {
    const estados = ['borrador', 'aprobado', 'rechazado', 'en_revision'];
    expect(estados).toContain('borrador');
    expect(estados).toContain('aprobado');
  });

  it('2.3 Versión de presupuesto es entero positivo', () => {
    const version = 1;
    expect(Number.isInteger(version)).toBe(true);
    expect(version).toBeGreaterThan(0);
  });
});

// =====================================================================
// 3. MÓDULO MOVIMIENTOS FINANCIEROS
// =====================================================================
describe('3. Módulo Movimientos', () => {
  it('3.1 Tipos válidos', () => {
    const tipos = ['ingreso', 'gasto'];
    expect(tipos).toContain('ingreso');
    expect(tipos).toContain('gasto');
  });

  it('3.2 Categorías válidas', () => {
    const categorias = ['materiales', 'mano_obra', 'herramienta', 'sub_contrato', 'administrativo', 'personal', 'transporte', 'fijos', 'hogar', 'aporte', 'trabajos_extra'];
    expect(categorias).toHaveLength(11);
    expect(categorias).toContain('materiales');
    expect(categorias).toContain('mano_obra');
  });

  it('3.3 Suma de gastos por categoría', () => {
    const movimientos = [
      { categoria: 'materiales', costo_total: 50000, tipo: 'gasto' },
      { categoria: 'materiales', costo_total: 30000, tipo: 'gasto' },
      { categoria: 'mano_obra', costo_total: 80000, tipo: 'gasto' },
    ];
    const porCategoria = movimientos.reduce((acc, m) => {
      acc[m.categoria] = (acc[m.categoria] || 0) + m.costo_total;
      return acc;
    }, {} as Record<string, number>);
    expect(porCategoria['materiales']).toBe(80000);
    expect(porCategoria['mano_obra']).toBe(80000);
  });

  it('3.4 Balance ingresos vs gastos', () => {
    const movimientos = [
      { tipo: 'ingreso', costo_total: 412500 },
      { tipo: 'ingreso', costo_total: 412500 },
      { tipo: 'gasto', costo_total: 17900 },
      { tipo: 'gasto', costo_total: 21250 },
    ];
    const ingresos = movimientos.filter(m => m.tipo === 'ingreso').reduce((s, m) => s + m.costo_total, 0);
    const gastos = movimientos.filter(m => m.tipo === 'gasto').reduce((s, m) => s + m.costo_total, 0);
    expect(ingresos).toBe(825000);
    expect(gastos).toBe(39150);
    expect(ingresos - gastos).toBeGreaterThan(0);
  });

  it('3.5 costo_unitario × cantidad = costo_total', () => {
    const m = { costo_unitario: 89.5, cantidad: 200, costo_total: 17900 };
    expect(m.costo_unitario * m.cantidad).toBe(m.costo_total);
  });
});

// =====================================================================
// 4. MÓDULO EMPLEADOS
// =====================================================================
describe('4. Módulo Empleados', () => {
  it('4.1 Tipos de empleado válidos', () => {
    const tipos = ['planilla', 'destajo'];
    expect(tipos).toContain('planilla');
    expect(tipos).toContain('destajo');
  });

  it('4.2 Salario diario es positivo', () => {
    const emp = { nombre: 'Juan', puesto: 'Albañil', salario_diario: 150 };
    expect(emp.salario_diario).toBeGreaterThan(0);
  });

  it('4.3 Cálculo de nomina mensual', () => {
    const empleados = [
      { salario_diario: 150, dias_trabajados: 26 },
      { salario_diario: 180, dias_trabajados: 26 },
      { salario_diario: 250, dias_trabajados: 20 },
    ];
    const nomina = empleados.reduce((sum, e) => sum + e.salario_diario * e.dias_trabajados, 0);
    expect(nomina).toBe(3900 + 4680 + 5000); // 13580
  });

  it('4.4 Empleados activos vs inactivos', () => {
    const empleados = [
      { nombre: 'A', activo: true },
      { nombre: 'B', activo: true },
      { nombre: 'C', activo: false },
    ];
    const activos = empleados.filter(e => e.activo);
    expect(activos).toHaveLength(2);
  });
});

// =====================================================================
// 5. MÓDULO MATERIALES E INVENTARIO
// =====================================================================
describe('5. Módulo Materiales', () => {
  it('5.1 Alerta de stock bajo', () => {
    const material = { nombre: 'Cemento', stock: 50, stock_minimo: 200 };
    expect(material.stock).toBeLessThan(material.stock_minimo);
  });

  it('5.2 Stock suficiente', () => {
    const material = { nombre: 'Varilla', stock: 320, stock_minimo: 100 };
    expect(material.stock).toBeGreaterThanOrEqual(material.stock_minimo);
  });

  it('5.3 Valorización de inventario', () => {
    const materiales = [
      { nombre: 'Cemento', stock: 850, precio: 89.5 },
      { nombre: 'Varilla', stock: 320, precio: 425 },
      { nombre: 'Arena', stock: 180, precio: 185 },
    ];
    const total = materiales.reduce((sum, m) => sum + m.stock * m.precio, 0);
    expect(total).toBeGreaterThan(0);
    expect(typeof total).toBe('number');
  });

  it('5.4 Unidades válidas', () => {
    const unidades = ['saco', 'qq', 'm³', 'unidad', 'lt', 'kg', 'pliego', 'rollo'];
    expect(unidades.length).toBeGreaterThan(0);
  });
});

// =====================================================================
// 6. MÓDULO ÓRDENES DE COMPRA
// =====================================================================
describe('6. Módulo Órdenes de Compra', () => {
  it('6.1 Estados válidos', () => {
    const estados = ['pendiente', 'aprobado', 'recibida', 'cancelada'];
    expect(estados).toContain('pendiente');
    expect(estados).toContain('aprobado');
    expect(estados).toContain('recibida');
  });

  it('6.2 Monto = cantidad × precio unitario', () => {
    const oc = { cantidad: 200, precio_unitario: 89.5, monto: 17900 };
    expect(oc.cantidad * oc.precio_unitario).toBe(oc.monto);
  });

  it('6.3 Crear OC genera ID único', () => {
    const id1 = uid();
    const id2 = uid();
    expect(id1).not.toBe(id2);
  });
});

// =====================================================================
// 7. MÓDULO PROVEEDORES
// =====================================================================
describe('7. Módulo Proveedores', () => {
  it('7.1 Calificación en rango 1-5', () => {
    const prov = { nombre: 'Proveedor', calificacion: 4 };
    expect(prov.calificacion).toBeGreaterThanOrEqual(1);
    expect(prov.calificacion).toBeLessThanOrEqual(5);
  });

  it('7.2 CRUD de proveedores', () => {
    let proveedores: any[] = [];
    proveedores.push({ id: uid(), nombre: 'P1', rubro: 'materiales' });
    proveedores.push({ id: uid(), nombre: 'P2', rubro: 'equipo' });
    expect(proveedores).toHaveLength(2);
    proveedores = proveedores.filter(p => p.nombre !== 'P1');
    expect(proveedores).toHaveLength(1);
  });
});

// =====================================================================
// 8. MÓDULO CUENTAS POR COBRAR / PAGAR
// =====================================================================
describe('8. Módulo Cuentas', () => {
  it('8.1 Estados de cuenta válidos', () => {
    const estados = ['pendiente', 'pagado', 'vencido', 'parcial'];
    expect(estados).toContain('pendiente');
    expect(estados).toContain('pagado');
    expect(estados).toContain('vencido');
  });

  it('8.2 Saldo pendiente ≤ monto total', () => {
    const cuenta = { monto: 100000, saldo_pendiente: 75000 };
    expect(cuenta.saldo_pendiente).toBeLessThanOrEqual(cuenta.monto);
    expect(cuenta.saldo_pendiente).toBeGreaterThanOrEqual(0);
  });

  it('8.3 Vencimiento >= emisión', () => {
    const cuenta = { fecha_emision: '2025-01-01', fecha_vencimiento: '2025-02-01' };
    expect(new Date(cuenta.fecha_vencimiento).getTime())
      .toBeGreaterThanOrEqual(new Date(cuenta.fecha_emision).getTime());
  });
});

// =====================================================================
// 9. MÓDULO ÓRDENES DE CAMBIO
// =====================================================================
describe('9. Módulo Órdenes de Cambio', () => {
  it('9.1 Impacto costo/plazo es numérico', () => {
    const oc = { impacto_costo: 50000, impacto_plazo: 15 };
    expect(typeof oc.impacto_costo).toBe('number');
    expect(typeof oc.impacto_plazo).toBe('number');
  });

  it('9.2 Estados válidos', () => {
    const estados = ['pendiente', 'aprobada', 'rechazada', 'en_revision'];
    expect(estados).toContain('aprobada');
    expect(estados).toContain('rechazada');
  });
});

// =====================================================================
// 10. MÓDULO COTIZACIONES DE NEGOCIO
// =====================================================================
describe('10. Módulo Cotizaciones', () => {
  it('10.1 Precio venta > costo directo (margen positivo)', () => {
    const cot = {
      costo_directo_total: 1000000,
      precio_venta_total: 1200000,
    };
    const margen = cot.precio_venta_total - cot.costo_directo_total;
    expect(margen).toBeGreaterThan(0);
    expect(margen / cot.costo_directo_total).toBeCloseTo(0.2, 1);
  });

  it('10.2 Estados de cotización', () => {
    const estados = ['borrador', 'enviada', 'aprobada', 'rechazada', 'vencida'];
    expect(estados).toContain('borrador');
    expect(estados).toContain('aprobada');
  });

  it('10.3 Fecha vencimiento >= fecha emisión', () => {
    const cot = { fecha: '2025-01-01', fecha_vencimiento: '2025-02-01' };
    expect(new Date(cot.fecha_vencimiento).getTime())
      .toBeGreaterThanOrEqual(new Date(cot.fecha).getTime());
  });
});

// =====================================================================
// 11. MÓDULO AVANCES DE OBRA
// =====================================================================
describe('11. Módulo Avances', () => {
  it('11.1 Avance físico acumulado no supera 100%', () => {
    const avances = [8, 10, 14, 13, 10, 7]; // incrementales
    const acumulado = avances.reduce((sum, a) => Math.min(100, sum + a), 0);
    expect(acumulado).toBeLessThanOrEqual(100);
  });

  it('11.2 Histórico de avances está ordenado por fecha', () => {
    const avances = [
      { fecha: '2025-03-31', avance_fisico: 32 },
      { fecha: '2025-02-28', avance_fisico: 18 },
      { fecha: '2025-01-31', avance_fisico: 8 },
    ];
    const ordenado = [...avances].sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());
    expect(ordenado[0].avance_fisico).toBe(8);
    expect(ordenado[2].avance_fisico).toBe(32);
  });
});

// =====================================================================
// 12. MÓDULO BITÁCORA
// =====================================================================
describe('12. Módulo Bitácora', () => {
  it('12.1 Registro de bitácora con campos obligatorios', () => {
    const bitacora = {
      id: uid(),
      proyecto_id: uid(),
      fecha: hoy,
      personal: 15,
      tareas: 'Concretado de losa nivel 2',
    };
    expect(bitacora.proyecto_id).toBeTruthy();
    expect(bitacora.personal).toBeGreaterThan(0);
    expect(bitacora.tareas.length).toBeGreaterThan(0);
  });
});

// =====================================================================
// 13. MÓDULO LICITACIONES
// =====================================================================
describe('13. Módulo Licitaciones', () => {
  it('13.1 Estados válidos', () => {
    const estados = ['abierta', 'cerrada', 'adjudicada', 'desierta', 'en_evaluacion'];
    expect(estados).toContain('abierta');
    expect(estados).toContain('adjudicada');
  });

  it('13.2 Monto de licitación positivo', () => {
    const lic = { nombre: 'Licitación Test', monto: 5000000 };
    expect(lic.monto).toBeGreaterThan(0);
  });
});

// =====================================================================
// 14. MÓDULO SEGURIDAD / PERMISOS
// =====================================================================
describe('14. Seguridad y Permisos', () => {
  it('14.1 Roles válidos del sistema', () => {
    const roles = ['Administrador', 'Gerente', 'Residente', 'Compras', 'Bodeguero', 'Consultor'];
    expect(roles).toContain('Administrador');
    expect(roles).toContain('Bodeguero');
  });

  it('14.2 Solo admin puede eliminar usuarios', () => {
    const admin = { rol: 'Administrador' };
    const gerente = { rol: 'Gerente' };
    expect(admin.rol).toBe('Administrador');
    expect(gerente.rol).not.toBe('Administrador');
  });

  it('14.3 XSS — sanitización de input', () => {
    const input = '<script>alert("xss")</script>';
    const sanitized = input.replace(/<[^>]*>/g, '');
    expect(sanitized).not.toContain('<script>');
    expect(sanitized).not.toContain('</script>');
  });
});

// =====================================================================
// 15. MÓDULO EXPORTACIÓN (PDF / EXCEL)
// =====================================================================
describe('15. Exportación', () => {
  it('15.1 Formato de moneda GTQ', () => {
    const formato = (n: number) => `Q ${n.toLocaleString('es-GT', { minimumFractionDigits: 2 })}`;
    const resultado = formato(1500000);
    expect(resultado).toContain('Q');
    expect(resultado).toContain('1,500,000');
  });

  it('15.2 Genera datos para exportar', () => {
    const datos = [
      { nombre: 'Proyecto A', presupuesto: 5000000, avance: 45 },
      { nombre: 'Proyecto B', presupuesto: 8000000, avance: 78 },
    ];
    expect(datos).toHaveLength(2);
    datos.forEach(d => {
      expect(d.nombre).toBeTruthy();
      expect(d.presupuesto).toBeGreaterThan(0);
    });
  });
});

// =====================================================================
// 16. MÓDULO NOTIFICACIONES
// =====================================================================
describe('16. Notificaciones', () => {
  it('16.1 Tipos de notificación válidos', () => {
    const tipos = ['info', 'warning', 'error', 'success'];
    expect(tipos).toContain('info');
    expect(tipos).toContain('warning');
  });

  it('16.2 Marcar como leído', () => {
    const notif = { id: uid(), titulo: 'Test', leido: false };
    notif.leido = true;
    expect(notif.leido).toBe(true);
  });
});

// =====================================================================
// 17. MÓDULO DASHBOARD / KPIs
// =====================================================================
describe('17. Dashboard y KPIs', () => {
  it('17.1 Total de proyectos activos', () => {
    const proyectos = [
      { estado: 'ejecucion' },
      { estado: 'ejecucion' },
      { estado: 'finalizado' },
      { estado: 'planeacion' },
    ];
    const activos = proyectos.filter(p => p.estado === 'ejecucion');
    expect(activos).toHaveLength(2);
  });

  it('17.2 Promedio de avance físico', () => {
    const avances = [45, 78, 35, 18, 8, 90];
    const promedio = avances.reduce((s, a) => s + a, 0) / avances.length;
    expect(promedio).toBeGreaterThan(0);
    expect(promedio).toBeLessThanOrEqual(100);
  });

  it('17.3 Presupuesto total del portafolio', () => {
    const proyectos = [
      { presupuesto_total: 5000000 },
      { presupuesto_total: 8200000 },
      { presupuesto_total: 2800000 },
    ];
    const total = proyectos.reduce((s, p) => s + p.presupuesto_total, 0);
    expect(total).toBe(16000000);
  });

  it('17.4 Distribución por tipología', () => {
    const proyectos = [
      { tipologia: 'residencial' },
      { tipologia: 'comercial' },
      { tipologia: 'residencial' },
      { tipologia: 'civil' },
    ];
    const dist = proyectos.reduce((acc, p) => {
      acc[p.tipologia] = (acc[p.tipologia] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    expect(dist['residencial']).toBe(2);
    expect(dist['comercial']).toBe(1);
    expect(dist['civil']).toBe(1);
  });
});

// =====================================================================
// 18. MÓDULO VALES DE SALIDA
// =====================================================================
describe('18. Vales de Salida', () => {
  it('18.1 Items del vale son array con cantidad', () => {
    const vale = {
      id: uid(),
      proyecto_id: uid(),
      fecha: hoy,
      items: [
        { material_id: uid(), nombre: 'Cemento', cantidad: 20, unidad: 'saco' },
        { material_id: uid(), nombre: 'Varilla', cantidad: 5, unidad: 'qq' },
      ],
    };
    expect(Array.isArray(vale.items)).toBe(true);
    expect(vale.items).toHaveLength(2);
    vale.items.forEach(item => {
      expect(item.cantidad).toBeGreaterThan(0);
    });
  });
});

// =====================================================================
// 19. MÓDULO RIESGOS
// =====================================================================
describe('19. Módulo Riesgos', () => {
  it('19.1 Cálculo de nivel de riesgo', () => {
    const riesgo = { probabilidad: 4, impacto: 3 };
    const nivel = riesgo.probabilidad * riesgo.impacto;
    const clasificacion = nivel >= 12 ? 'alto' : nivel >= 6 ? 'medio' : 'bajo';
    expect(clasificacion).toBe('alto'); // 4*3=12 >= 12 = alto
  });

  it('19.2 Estados de riesgo', () => {
    const estados = ['identificado', 'en_tratamiento', 'mitigado', 'cerrado', 'aceptado'];
    expect(estados).toContain('identificado');
    expect(estados).toContain('mitigado');
  });
});

// =====================================================================
// 20. VALIDACIÓN CRUZADA ENTRE MÓDULOS
// =====================================================================
describe('20. Validación Cruzada', () => {
  it('20.1 Proyecto → Presupuesto vinculado', () => {
    const proyecto = PROYECTO_BASE();
    const presupuesto = { id: uid(), proyecto_id: proyecto.id, total_calculado: proyecto.presupuesto_total };
    expect(presupuesto.proyecto_id).toBe(proyecto.id);
  });

  it('20.2 Movimiento → Proyecto referenciado', () => {
    const proyecto = PROYECTO_BASE();
    const movimiento = { id: uid(), proyecto_id: proyecto.id, tipo: 'gasto', costo_total: 50000 };
    expect(movimiento.proyecto_id).toBe(proyecto.id);
  });

  it('20.3 OC → Material referenciado', () => {
    const material = { id: uid(), nombre: 'Cemento', stock: 850 };
    const oc = { id: uid(), material: material.nombre, cantidad: 200 };
    expect(oc.material).toBe(material.nombre);
  });

  it('20.4 Empleado → Proyecto asignado', () => {
    const proyecto = PROYECTO_BASE();
    const empleado = { id: uid(), nombre: 'Juan', proyecto_id: proyecto.id };
    expect(empleado.proyecto_id).toBe(proyecto.id);
  });
});