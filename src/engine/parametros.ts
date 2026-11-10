import type { Parametros } from './types'

/**
 * Parámetros laborales por año.
 *
 * Los valores de SMMLV, auxilio de transporte y UVT cambian cada año por
 * decreto. La app los versiona para poder liquidar periodos anteriores sin
 * recalcular con el valor de hoy.
 *
 * Nota 2026: el Decreto 1469 de 2025 fue suspendido provisionalmente por el
 * Consejo de Estado y reafirmado por decreto del 18 de febrero de 2026.
 * Verifica siempre el decreto vigente antes de usar el resultado.
 */
export const PARAMETROS: Record<number, Parametros> = {
  2023: {
    anio: 2023,
    smmlv: 1_160_000,
    auxilioTransporte: 140_606,
    uvt: 42_412,
    tasaInteresCesantias: 0.12,
    diasVacacionesPorAnio: 15,
    topeAuxilioSmmlv: 2,
    salarioIntegralSmmlv: 13,
    fuente: 'Decreto salarial y de auxilio de transporte 2023; UVT 2023. Verificar fuente oficial.',
    vigenciaDesde: '2023-01-01',
  },
  2024: {
    anio: 2024,
    smmlv: 1_300_000,
    auxilioTransporte: 162_000,
    uvt: 47_065,
    tasaInteresCesantias: 0.12,
    diasVacacionesPorAnio: 15,
    topeAuxilioSmmlv: 2,
    salarioIntegralSmmlv: 13,
    fuente: 'Decreto salarial y de auxilio de transporte 2024; UVT 2024. Verificar fuente oficial.',
    vigenciaDesde: '2024-01-01',
  },
  2025: {
    anio: 2025,
    smmlv: 1_423_500,
    auxilioTransporte: 200_000,
    uvt: 49_799,
    tasaInteresCesantias: 0.12,
    diasVacacionesPorAnio: 15,
    topeAuxilioSmmlv: 2,
    salarioIntegralSmmlv: 13,
    fuente: 'Decreto salarial y de auxilio de transporte 2025; UVT 2025. Verificar fuente oficial.',
    vigenciaDesde: '2025-01-01',
  },
  2026: {
    anio: 2026,
    smmlv: 1_750_905,
    auxilioTransporte: 249_095,
    uvt: 52_374,
    tasaInteresCesantias: 0.12,
    diasVacacionesPorAnio: 15,
    topeAuxilioSmmlv: 2,
    salarioIntegralSmmlv: 13,
    fuente: 'Decreto 1469 de 2025 (reafirmado en feb-2026) y Decreto 159 de 2026; UVT 2026.',
    vigenciaDesde: '2026-01-01',
    nota: 'El Decreto 1469 de 2025 fue suspendido provisionalmente y luego reafirmado. Verifica el decreto vigente.',
  },
}

export const ANIOS_DISPONIBLES = Object.keys(PARAMETROS)
  .map(Number)
  .sort((a, b) => b - a)

/** Devuelve los parámetros del año pedido o, si no existe, los del año más cercano anterior. */
export function getParametros(anio: number): Parametros {
  if (PARAMETROS[anio]) return PARAMETROS[anio]

  const menorOIgual = ANIOS_DISPONIBLES.find((disponible) => disponible <= anio)
  const anioFallback = menorOIgual ?? ANIOS_DISPONIBLES[ANIOS_DISPONIBLES.length - 1]
  return PARAMETROS[anioFallback]
}

export function anioVigente(): number {
  const actual = new Date().getFullYear()
  return ANIOS_DISPONIBLES.includes(actual) ? actual : ANIOS_DISPONIBLES[0]
}
