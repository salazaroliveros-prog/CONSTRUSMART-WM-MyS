export const MATERIALES_POR_ACTIVIDAD: Record<string, { nombre: string; unidad: string; precioRef: number }[]> = {
  humedad: [
    { nombre: 'Cemento Portland', unidad: 'bulto (50kg)', precioRef: 95 },
    { nombre: 'Arena de río', unidad: 'm³', precioRef: 180 },
    { nombre: 'Piedrín', unidad: 'm³', precioRef: 200 },
    { nombre: 'Agua', unidad: 'lt', precioRef: 0.15 },
    { nombre: 'Alambre recocido #16', unidad: 'kg', precioRef: 18 },
    { nombre: 'Madera (formaletas)', unidad: 'ml', precioRef: 35 },
    { nombre: 'Clavo de formaleta', unidad: 'kg', precioRef: 15 },
  ],
  acero: [
    { nombre: 'Acero corrugado #4', unidad: 'barra 12m', precioRef: 85 },
    { nombre: 'Alambre recocido #16', unidad: 'kg', precioRef: 18 },
    { nombre: 'Alambre recocido #18', unidad: 'kg', precioRef: 15 },
  ],
  encofrado: [
    { nombre: 'Madera (formaletas)', unidad: 'ml', precioRef: 35 },
    { nombre: 'Clavo de formaleta', unidad: 'kg', precioRef: 15 },
    { nombre: 'Alambre recocido #18', unidad: 'kg', precioRef: 15 },
    { nombre: 'Aceite de desencofrar', unidad: 'lt', precioRef: 25 },
  ],
  mamposteria: [
    { nombre: 'Block 14x19x39', unidad: 'pza', precioRef: 4.20 },
    { nombre: 'Arena de río', unidad: 'm³', precioRef: 180 },
    { nombre: 'Cemento Portland', unidad: 'bulto (50kg)', precioRef: 95 },
    { nombre: 'Albañil', unidad: 'jornal', precioRef: 350 },
  ],
  acabados: [
    { nombre: 'Pintura látex', unidad: 'galón', precioRef: 180 },
    { nombre: 'Cemento Póleo', unidad: 'bulto (25kg)', precioRef: 55 },
    { nombre: 'Placa de yeso', unidad: 'pza', precioRef: 45 },
    { nombre: 'Azulejo', unidad: 'm²', precioRef: 85 },
    { nombre: 'Pegazulejo', unidad: 'bulto', precioRef: 55 },
  ],
  plomeria: [
    { nombre: 'Tub PVC 4"', unidad: 'ml', precioRef: 35 },
    { nombre: 'Codo PVC 4"', unidad: 'pza', precioRef: 25 },
    { nombre: 'Té PVC 4"', unidad: 'pza', precioRef: 20 },
    { nombre: 'Válvula compuerta', unidad: 'pza', precioRef: 120 },
    { nombre: 'Teflón', unidad: 'rollo', precioRef: 12 },
    { nombre: 'Pegatina PVC', unidad: 'tubo', precioRef: 28 },
  ],
  electricidad: [
    { nombre: 'Cable THW #12', unidad: 'rollo (100m)', precioRef: 450 },
    { nombre: 'Cable THW #14', unidad: 'rollo (100m)', precioRef: 320 },
    { nombre: 'Conduit conduit 1/2"', unidad: 'ml', precioRef: 22 },
    { nombre: 'Caja de paso', unidad: 'pza', precioRef: 45 },
    { nombre: 'Tomacorriente', unidad: 'pza', precioRef: 35 },
    { nombre: 'Interruptor', unidad: 'pza', precioRef: 30 },
    { nombre: 'Conector PVC', unidad: 'pza', precioRef: 15 },
  ],
};

export const PERSONAL_POR_ACTIVIDAD: Record<string, number> = {
  humedad: 6,
  acero: 4,
  encofrado: 8,
  mamposteria: 6,
  acabados: 4,
  plomeria: 3,
  electricidad: 3,
  general: 5,
};

export const ACTIVIDADES_TIPICAS = Object.keys(MATERIALES_POR_ACTIVIDAD);

export const ACTIVIDAD_POR_RENGLON: Record<string, string> = {
  '05': 'humedad', '06': 'humedad', '07': 'humedad', '08': 'humedad', '09': 'humedad',
  '10': 'mamposteria', '11': 'mamposteria', '12': 'acabados', '13': 'acabados',
  '14': 'acero', '15': 'acero', '16': 'acero',
  '17': 'plomeria', '18': 'plomeria', '19': 'electricidad', '20': 'electricidad',
  '21': 'electricidad', '22': 'acabados', '23': 'acabados', '24': 'acabados',
  '25': 'acabados', '26': 'acabados', '27': 'acabados', '28': 'acabados',
  '29': 'acabados', '30': 'plomeria', '31': 'plomeria',
  '32': 'encofrado', '33': 'acero', '34': 'encofrado',
};
