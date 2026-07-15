/**
 * Hooks para datos geográficos estáticos usando SOLO memoria local.
 * Estos datos son referenciales y se sincronizan con Supabase vía forceSync.
 * 
 * Estrategia offline-first:
 * - Usar directamente el store Zustand (ya tiene datos cargados)
 * - No hacer llamadas directas a Supabase
 * - Funciona completamente offline
 */
import { useErp } from '@/erp/store';
import type { DepartamentoGT, MunicipioGT } from '@/erp/types';

export function useDepartamentos(): DepartamentoGT[] {
  const { departamentos } = useErp();
  return departamentos || [];
}

export function useMunicipios(): MunicipioGT[] {
  const { municipios } = useErp();
  return municipios || [];
}

export function useMunicipiosPorDepartamento(departamentoCodigo: string): MunicipioGT[] {
  const municipios = useMunicipios();
  return municipios.filter(m => m.departamentoCodigo === departamentoCodigo);
}

export function useMunicipio(codigo: string): MunicipioGT | null {
  const municipios = useMunicipios();
  return municipios.find(m => m.codigo === codigo) || null;
}