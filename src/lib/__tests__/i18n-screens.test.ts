import { describe, expect, it } from 'vitest';
import es from '../i18n/es.json';
import en from '../i18n/en.json';

const getValue = (obj: Record<string, unknown>, path: string[]) => {
  return path.reduce<unknown>((acc, key) => {
    if (acc && typeof acc === 'object' && key in acc) {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);
};

describe('i18n coverage for business screens', () => {
  it('includes the expected translation keys for milestones, risks and accounts screens', () => {
    const cases = [
      ['es', es, ['hitos'], ['titulo', 'nuevo', 'total_hitos', 'completados', 'pendientes', 'vencidos', 'sin_hitos', 'sin_hitos_descripcion', 'dependencias', 'dependencias_desc', 'crear_hito', 'cancelar', 'lista', 'calendario', 'crear_otros_hitos']],
      ['en', en, ['hitos'], ['titulo', 'nuevo', 'total_hitos', 'completados', 'pendientes', 'vencidos', 'sin_hitos', 'sin_hitos_descripcion', 'dependencias', 'dependencias_desc', 'crear_hito', 'cancelar', 'lista', 'calendario', 'crear_otros_hitos']],
      ['es', es, ['riesgos'], ['titulo', 'nuevo', 'total_riesgos', 'alto_impacto', 'en_seguimiento', 'mitigados', 'sin_riesgos_filtro', 'sin_riesgos_activos', 'matriz_calor', 'riesgos_por_nivel', 'registrar', 'cancelar']],
      ['en', en, ['riesgos'], ['titulo', 'nuevo', 'total_riesgos', 'alto_impacto', 'en_seguimiento', 'mitigados', 'sin_riesgos_filtro', 'sin_riesgos_activos', 'matriz_calor', 'riesgos_por_nivel', 'registrar', 'cancelar']],
      ['es', es, ['cuentas_cobrar'], ['titulo', 'subtitulo', 'nueva_cuenta', 'total_por_cobrar', 'cobradas', 'vencidas', 'promedio_por_cuenta', 'registrar', 'cancelar', 'sin_cuentas', 'cobrar', 'eliminar']],
      ['en', en, ['cuentas_cobrar'], ['titulo', 'subtitulo', 'nueva_cuenta', 'total_por_cobrar', 'cobradas', 'vencidas', 'promedio_por_cuenta', 'registrar', 'cancelar', 'sin_cuentas', 'cobrar', 'eliminar']],
      ['es', es, ['cuentas_pagar'], ['titulo', 'subtitulo', 'nueva_cuenta', 'total_por_pagar', 'pagadas', 'pendientes', 'vencidas', 'registrar', 'cancelar', 'sin_cuentas', 'pagar', 'eliminar']],
      ['en', en, ['cuentas_pagar'], ['titulo', 'subtitulo', 'nueva_cuenta', 'total_por_pagar', 'pagadas', 'pendientes', 'vencidas', 'registrar', 'cancelar', 'sin_cuentas', 'pagar', 'eliminar']],
    ] as const;

    for (const [locale, bundle, path, keys] of cases) {
      for (const key of keys) {
        const value = getValue(bundle as Record<string, unknown>, [...path, key]);
        expect(value, `${locale} missing ${path.join('.')}.${key}`).toBeDefined();
      }
    }
  });
});
