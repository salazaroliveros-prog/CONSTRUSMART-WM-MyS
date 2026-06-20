import { toast } from 'sonner';

export interface ValidationResult {
  valido: boolean;
  tipo: 'error' | 'warning' | 'info';
  mensaje: string;
  origen: string;
  sugerencia?: string;
}

export class ServicioValidacionCalculos {
  /**
   * Validar cálculo de pavimento
   */
  static validarPavimento(parametros: any, resultado: any): ValidationResult[] {
    const validaciones: ValidationResult[] = [];

    // Validar área mínima
    if (parametros.areaM2 < 1) {
      validaciones.push({
        valido: false,
        tipo: 'error',
        mensaje: 'El área debe ser al menos 1 m²',
        origen: 'pavimento',
        sugerencia: 'Aumente el área a un valor realista'
      });
    }

    // Validar área máxima (previene cálculos excesivos)
    if (parametros.areaM2 > 100000) {
      validaciones.push({
        valido: false,
        tipo: 'error',
        mensaje: 'El área es muy grande (>100,000 m²)',
        origen: 'pavimento',
        sugerencia: 'Divida el cálculo en secciones más pequeñas'
      });
    }

    // Validar consistencia de espesor
    if (resultado.espesorCm < 5) {
      validaciones.push({
        valido: false,
        tipo: 'warning',
        mensaje: 'Espesor muy bajo para pavimento vehicular',
        origen: 'pavimento',
        sugerencia: 'Considere aumentar el espesor o usar material peatonal'
      });
    }

    // Validar costo razonable
    const costoPorM2 = resultado.costoTotal / parametros.areaM2;
    if (costoPorM2 < 50 || costoPorM2 > 2000) {
      validaciones.push({
        valido: false,
        tipo: 'warning',
        mensaje: `Costo por m² inusual: Q${costoPorM2.toFixed(2)}`,
        origen: 'pavimento',
        sugerencia: 'Verifique los parámetros de tipo y uso seleccionados'
      });
    }

    return validaciones;
  }

  /**
   * Validar cálculo de red de infraestructura
   */
  static validarRedInfraestructura(parametros: any, resultado: any): ValidationResult[] {
    const validaciones: ValidationResult[] = [];

    // Validar longitud mínima
    if (parametros.longitudMl < 1) {
      validaciones.push({
        valido: false,
        tipo: 'error',
        mensaje: 'La longitud debe ser al menos 1 ml',
        origen: 'red_infraestructura',
        sugerencia: 'Ingrese una longitud realista'
      });
    }

    // Validar longitud máxima
    if (parametros.longitudMl > 10000) {
      validaciones.push({
        valido: false,
        tipo: 'warning',
        mensaje: 'Longitud muy grande (>10km)',
        origen: 'red_infraestructura',
        sugerencia: 'Considere dividir en tramos más pequeños'
      });
    }

    // Validar consistencia diámetro-presión
    if (parametros.diametroPulgadas >= 4 && parametros.presion === 'alta') {
      validaciones.push({
        valido: true,
        tipo: 'info',
        mensaje: 'Diámetro grande con presión alta requiere especificaciones especiales',
        origen: 'red_infraestructura'
      });
    }

    // Validar costo por metro lineal
    const costoPorMl = resultado.costoTotal / parametros.longitudMl;
    if (costoPorMl < 30 || costoPorMl > 1000) {
      validaciones.push({
        valido: false,
        tipo: 'warning',
        mensaje: `Costo por ml inusual: Q${costoPorMl.toFixed(2)}`,
        origen: 'red_infraestructura',
        sugerencia: 'Verifique diámetro, material y presión seleccionados'
      });
    }

    return validaciones;
  }

  /**
   * Validar cálculo de muro de contención
   */
  static validarMuroContencion(parametros: any, resultado: any): ValidationResult[] {
    const validaciones: ValidationResult[] = [];

    // Validar altura mínima
    if (parametros.alturaM < 1) {
      validaciones.push({
        valido: false,
        tipo: 'error',
        mensaje: 'La altura debe ser al menos 1m',
        origen: 'muro_contencion',
        sugerencia: 'Ingrese una altura realista'
      });
    }

    // Validar altura máxima
    if (parametros.alturaM > 10) {
      validaciones.push({
        valido: false,
        tipo: 'warning',
        mensaje: 'Altura muy grande (>10m) requiere análisis estructural especial',
        origen: 'muro_contencion',
        sugerencia: 'Considere soluciones especializadas para alturas mayores'
      });
    }

    // Validar longitud mínima
    if (parametros.longitudM < 5) {
      validaciones.push({
        valido: false,
        tipo: 'warning',
        mensaje: 'Longitud muy pequeña (<5m)',
        origen: 'muro_contencion',
        sugerencia: 'Para longitudes pequeñas considere otros tipos de contención'
      });
    }

    // Validar consistencia tipo-suelo
    if (parametros.tipo === 'gravedad' && parametros.alturaM > 4) {
      validaciones.push({
        valido: true,
        tipo: 'warning',
        mensaje: 'Muro de gravedad >4m requiere análisis especial',
        origen: 'muro_contencion',
        sugerencia: 'Considere muro tipo celular o pantalla para mayores alturas'
      });
    }

    // Validar volumen de concreto
    const areaM2 = parametros.alturaM * parametros.longitudM;
    const volumenPorM2 = resultado.volumenConcretoM3 / areaM2;
    if (volumenPorM2 < 0.2 || volumenPorM2 > 0.5) {
      validaciones.push({
        valido: false,
        tipo: 'warning',
        mensaje: `Volumen de concreto por m² inusual: ${volumenPorM2.toFixed(3)}m³/m²`,
        origen: 'muro_contencion',
        sugerencia: 'Verifique espesor y dimensiones del muro'
      });
    }

    return validaciones;
  }

  /**
   * Validación cruzada entre múltiples cálculos
   */
  static validarConsistenciaCruzada(
    calculos: Array<{ tipo: string; resultado: any }>
  ): ValidationResult[] {
    const validaciones: ValidationResult[] = [];

    // Si hay múltiples tipos de cálculo, verificar consistencia de escalas
    if (calculos.length > 1) {
      // Verificar que no haya costos extremadamente diferentes
      const costos = calculos.map(c => {
        if (c.resultado.costoTotal) return c.resultado.costoTotal;
        if (c.resultado.costoTotal) return c.resultado.costoTotal;
        return 0;
      });

      const maxCosto = Math.max(...costos);
      const minCosto = Math.min(...costos);

      if (maxCosto > 0 && minCosto > 0 && (maxCosto / minCosto) > 10) {
        validaciones.push({
          valido: true,
          tipo: 'warning',
          mensaje: `Diferencia significativa en costos: ${((maxCosto/minCosto).toFixed(1))}x entre cálculos`,
          origen: 'consistencia_cruzada',
          sugerencia: 'Verifique que los parámetros de entrada sean consistentes'
        });
      }
    }

    return validaciones;
  }

  /**
   * Validación completa con todas las reglas
   */
  static validarCalculo(
    tipo: string,
    parametros: any,
    resultado: any,
    otrosCalculos?: Array<{ tipo: string; resultado: any }>
  ): ValidationResult[] {
    let validaciones: ValidationResult[] = [];

    switch (tipo) {
      case 'pavimento':
        validaciones = this.validarPavimento(parametros, resultado);
        break;
      case 'red_infraestructura':
        validaciones = this.validarRedInfraestructura(parametros, resultado);
        break;
      case 'muro_contencion':
        validaciones = this.validarMuroContencion(parametros, resultado);
        break;
      default:
        validaciones.push({
          valido: true,
          tipo: 'info',
          mensaje: 'Tipo de cálculo sin reglas de validación específicas',
          origen: 'validacion_general'
        });
    }

    // Validación cruzada si hay otros cálculos
    if (otrosCalculos && otrosCalculos.length > 0) {
      const validacionesCruzadas = this.validarConsistenciaCruzada([
        { tipo, resultado },
        ...otrosCalculos
      ]);
      validaciones.push(...validacionesCruzadas);
    }

    return validaciones;
  }

  /**
   * Mostrar resultados de validación
   */
  static mostrarValidaciones(validaciones: ValidationResult[]): boolean {
    if (validaciones.length === 0) {
      return true; // Sin validaciones significa válido
    }

    const errores = validaciones.filter(v => v.tipo === 'error');
    const warnings = validaciones.filter(v => v.tipo === 'warning');
    const infos = validaciones.filter(v => v.tipo === 'info');

    if (errores.length > 0) {
      toast.error(`Errores de validación: ${errores.length}`);
      errores.forEach(err => {
        toast.error(err.mensaje);
        if (err.sugerencia) {
          toast.info(`Sugerencia: ${err.sugerencia}`);
        }
      });
      return false;
    }

    if (warnings.length > 0) {
      toast.warning(`Advertencias: ${warnings.length}`);
      warnings.forEach(warn => {
        toast.warning(warn.mensaje);
        if (warn.sugerencia) {
          toast.info(`Sugerencia: ${warn.sugerencia}`);
        }
      });
    }

    if (infos.length > 0) {
      toast.info(`Información: ${infos.length}`);
      infos.forEach(info => {
        toast.info(info.mensaje);
      });
    }

    return true; // Solo con warnings e infos se considera válido
  }
}

export const validarCalculo = ServicioValidacionCalculos.validarCalculo;
export const mostrarValidaciones = ServicioValidacionCalculos.mostrarValidaciones;