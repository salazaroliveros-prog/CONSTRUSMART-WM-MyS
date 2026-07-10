import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * UTILIDADES GENERALES DE UI (shadcn/ui)
 * 
 * Este archivo contiene la función cn() para combinar clases de Tailwind CSS.
 * Es utilizado por los componentes de shadcn/ui para manejar clases condicionales.
 * 
 * NOTA: No confundir con src/erp/utils.ts que contiene utilidades específicas de la ERP
 * como formateo de moneda, constantes de negocio, y configuración de la aplicación.
 */

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
