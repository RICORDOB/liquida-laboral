import fc from 'fast-check'
import { describe, expect, it } from 'vitest'
import { calcularLiquidacion } from './calculo'
import { sumarDias } from './fechas'
import type { EntradaLiquidacion } from './types'
import { validarEntrada } from './validacion'

function crearEntrada(
  parcial: {
    empleado?: Partial<EntradaLiquidacion['empleado']>
    contrato?: Partial<EntradaLiquidacion['contrato']>
    terminacion?: Partial<EntradaLiquidacion['terminacion']>
    anioParametros?: number
  } = {},
): EntradaLiquidacion {
  return {
    empleado: { nombre: 'Ana Pérez', documento: '123456', ...parcial.empleado },
    contrato: {
      tipo: 'indefinido',
      fechaIngreso: '2026-01-01',
      fechaRetiro: '2026-12-31',
      fechaFinContrato: '',
      tipoSalario: 'fijo',
      salarioBasico: 1_750_905,
      promedioVariable: 0,
      recibeAuxilioTransporte: true,
      salarioEsMinimo: false,
      ...parcial.contrato,
    },
    terminacion: {
      motivo: 'renuncia',
      preavisoDado: true,
      diasVacacionesDisfrutados: 0,
      diasSalarioPendiente: 0,
      cesantiasConsignadasHasta: '',
      ultimoPagoPrima: '',
      incluirSancionMora: false,
      fechaPagoLiquidacion: '',
      otrasDeducciones: 0,
      retencionFuente: 0,
      ...parcial.terminacion,
    },
    anioParametros: parcial.anioParametros ?? 2026,
  }
}

function concepto(resultado: ReturnType<typeof calcularLiquidacion>, id: string) {
  return resultado.conceptos.find((item) => item.id === id)
}

describe('liquidación definitiva', () => {
  it('calcula un año completo con salario mínimo 2026 y auxilio de transporte', () => {
    const resultado = calcularLiquidacion(crearEntrada())

    expect(resultado.diasTotales).toBe(365)
    expect(resultado.auxilioAplica).toBe(true)
    expect(resultado.basePrestaciones).toBe(2_000_000)

    expect(concepto(resultado, 'cesantias')?.valor).toBe(2_027_778)
    expect(concepto(resultado, 'intereses_cesantias')?.valor).toBe(246_713)
    expect(concepto(resultado, 'prima')?.valor).toBe(1_022_222)
    expect(concepto(resultado, 'vacaciones')?.valor).toBe(887_612)
    expect(resultado.totalDevengado).toBe(4_184_325)
    expect(resultado.netoPagar).toBe(4_184_325)
  })

  it('liquida salario mínimo por año (2024 completo, año bisiesto)', () => {
    const resultado = calcularLiquidacion(
      crearEntrada({
        contrato: {
          fechaIngreso: '2024-01-01',
          fechaRetiro: '2024-12-31',
          salarioEsMinimo: true,
        },
      }),
    )

    expect(resultado.diasTotales).toBe(366)
    expect(resultado.salarioOrdinario).toBe(1_300_000)
    expect(resultado.auxilio).toBe(162_000)
    expect(concepto(resultado, 'cesantias')?.valor).toBe(1_486_367)
    expect(concepto(resultado, 'intereses_cesantias')?.valor).toBe(181_337)
    expect(concepto(resultado, 'prima')?.valor).toBe(747_244)
    expect(concepto(resultado, 'cesantias')?.detalle?.length).toBe(1)
  })

  it('liquida salario mínimo segmentando por año (2024-2025)', () => {
    const resultado = calcularLiquidacion(
      crearEntrada({
        contrato: {
          fechaIngreso: '2024-01-01',
          fechaRetiro: '2025-12-31',
          salarioEsMinimo: true,
        },
      }),
    )

    expect(resultado.diasTotales).toBe(731)
    expect(resultado.salarioOrdinario).toBe(1_423_500) // SMMLV del año de retiro
    expect(concepto(resultado, 'cesantias')?.valor).toBe(3_132_416)
    expect(concepto(resultado, 'intereses_cesantias')?.valor).toBe(381_606)
    expect(concepto(resultado, 'vacaciones')?.valor).toBe(1_445_248)
    expect(concepto(resultado, 'cesantias')?.detalle?.length).toBe(2)
  })

  it('no incluye auxilio de transporte por encima de 2 SMMLV', () => {
    const resultado = calcularLiquidacion(
      crearEntrada({
        contrato: { salarioBasico: 4_000_000 },
        terminacion: { ultimoPagoPrima: '2025-12-31' },
      }),
    )

    expect(resultado.auxilioAplica).toBe(false)
    expect(resultado.basePrestaciones).toBe(4_000_000)
    expect(resultado.auxilio).toBe(0)
  })

  it('calcula despido sin justa causa con menos de un año', () => {
    const resultado = calcularLiquidacion(
      crearEntrada({
        contrato: {
          fechaRetiro: '2026-06-30',
          salarioBasico: 4_000_000,
          recibeAuxilioTransporte: false,
        },
        terminacion: { motivo: 'despido_sin_justa', ultimoPagoPrima: '2025-12-31' },
      }),
    )

    expect(resultado.diasTotales).toBe(181)
    expect(concepto(resultado, 'cesantias')?.valor).toBe(2_011_111)
    expect(concepto(resultado, 'intereses_cesantias')?.valor).toBe(121_337)
    expect(concepto(resultado, 'prima')?.valor).toBe(2_011_111)
    expect(concepto(resultado, 'vacaciones')?.valor).toBe(1_005_556)
    expect(concepto(resultado, 'indemnizacion')?.valor).toBe(2_011_111)
    expect(resultado.totalDevengado).toBe(7_160_226)
  })

  it('aplica la tabla de 20/15 días para salarios de 10 SMMLV o más', () => {
    const resultado = calcularLiquidacion(
      crearEntrada({
        contrato: {
          fechaIngreso: '2025-01-01',
          fechaRetiro: '2026-12-31',
          salarioBasico: 20_000_000,
          recibeAuxilioTransporte: false,
        },
        terminacion: { motivo: 'despido_sin_justa', ultimoPagoPrima: '2026-06-30' },
      }),
    )

    const indemnizacion = concepto(resultado, 'indemnizacion')
    expect(indemnizacion?.dias).toBeCloseTo(35.42, 2)
    expect(indemnizacion?.valor).toBe(23_611_111)
  })

  it('calcula contrato a término fijo terminado antes del vencimiento', () => {
    const resultado = calcularLiquidacion(
      crearEntrada({
        contrato: {
          tipo: 'fijo',
          fechaIngreso: '2026-01-01',
          fechaRetiro: '2026-06-30',
          fechaFinContrato: '2026-12-31',
          salarioBasico: 3_000_000,
        },
        terminacion: { motivo: 'despido_sin_justa', ultimoPagoPrima: '2026-06-30' },
      }),
    )

    expect(concepto(resultado, 'indemnizacion')?.dias).toBe(184)
    expect(concepto(resultado, 'indemnizacion')?.valor).toBe(18_400_000)
  })

  it('usa el mínimo de 15 días para contrato por obra o labor', () => {
    const resultado = calcularLiquidacion(
      crearEntrada({
        contrato: { tipo: 'obra', salarioBasico: 3_000_000 },
        terminacion: { motivo: 'despido_sin_justa' },
      }),
    )

    expect(concepto(resultado, 'indemnizacion')?.dias).toBe(15)
    expect(concepto(resultado, 'indemnizacion')?.valor).toBe(1_500_000)
  })

  it('no paga indemnización en renuncia, mutuo acuerdo o justa causa', () => {
    for (const motivo of ['renuncia', 'mutuo_acuerdo', 'despido_con_justa'] as const) {
      const resultado = calcularLiquidacion(crearEntrada({ terminacion: { motivo } }))
      expect(concepto(resultado, 'indemnizacion')).toBeUndefined()
    }
  })

  it('liquida solo vacaciones, salario e indemnización en salario integral', () => {
    const resultado = calcularLiquidacion(
      crearEntrada({
        contrato: {
          tipoSalario: 'integral',
          salarioBasico: 25_000_000,
          recibeAuxilioTransporte: false,
        },
        terminacion: { motivo: 'despido_sin_justa' },
      }),
    )

    expect(resultado.esIntegral).toBe(true)
    expect(concepto(resultado, 'cesantias')).toBeUndefined()
    expect(concepto(resultado, 'intereses_cesantias')).toBeUndefined()
    expect(concepto(resultado, 'prima')).toBeUndefined()
    expect(concepto(resultado, 'vacaciones')?.valor).toBe(12_673_611)
    expect(concepto(resultado, 'indemnizacion')?.valor).toBe(16_840_278)
    expect(resultado.totalDevengado).toBe(29_513_889)
  })

  it('excluye cesantías ya consignadas y prima ya pagada', () => {
    const resultado = calcularLiquidacion(
      crearEntrada({
        contrato: { fechaRetiro: '2026-06-30', salarioBasico: 3_000_000 },
        terminacion: {
          cesantiasConsignadasHasta: '2025-12-31',
          ultimoPagoPrima: '2026-03-31',
        },
      }),
    )

    expect(concepto(resultado, 'cesantias')?.dias).toBe(181)
    expect(concepto(resultado, 'cesantias')?.valor).toBe(1_633_573)
    expect(concepto(resultado, 'intereses_cesantias')?.valor).toBe(98_559)
    expect(concepto(resultado, 'prima')?.dias).toBe(91)
    expect(concepto(resultado, 'prima')?.valor).toBe(821_299)
    expect(concepto(resultado, 'vacaciones')?.valor).toBe(754_167)
    expect(resultado.totalDevengado).toBe(3_307_598)
  })

  it('calcula salario y auxilio pendientes con sus deducciones', () => {
    const resultado = calcularLiquidacion(
      crearEntrada({
        contrato: { salarioBasico: 2_000_000 },
        terminacion: { diasSalarioPendiente: 15, ultimoPagoPrima: '2025-12-31' },
      }),
    )

    expect(concepto(resultado, 'salario_pendiente')?.valor).toBe(1_000_000)
    expect(concepto(resultado, 'auxilio_pendiente')?.valor).toBe(124_548)

    const salud = resultado.deducciones.find((item) => item.id === 'salud')
    const pension = resultado.deducciones.find((item) => item.id === 'pension')
    expect(salud?.valor).toBe(40_000)
    expect(pension?.valor).toBe(40_000)
    expect(resultado.totalDeducciones).toBe(80_000)
  })

  it('calcula la sanción por mora y la limita a 720 días', () => {
    const resultado = calcularLiquidacion(
      crearEntrada({
        contrato: { fechaRetiro: '2026-01-31', salarioBasico: 2_000_000 },
        terminacion: {
          incluirSancionMora: true,
          fechaPagoLiquidacion: '2026-03-02',
        },
      }),
    )

    const sancion = concepto(resultado, 'sancion_mora')
    expect(sancion?.dias).toBe(30)
    expect(sancion?.valor).toBe(2_000_000)

    const larga = calcularLiquidacion(
      crearEntrada({
        contrato: { fechaIngreso: '2020-01-01', fechaRetiro: '2020-01-31' },
        terminacion: {
          incluirSancionMora: true,
          fechaPagoLiquidacion: '2026-01-01',
        },
        anioParametros: 2020,
      }),
    )
    expect(concepto(larga, 'sancion_mora')?.dias).toBe(720)
  })

  it('suma el preaviso cuando no se dio en despido indefinido', () => {
    const resultado = calcularLiquidacion(
      crearEntrada({
        contrato: { salarioBasico: 2_000_000 },
        terminacion: { motivo: 'despido_sin_justa', preavisoDado: false },
      }),
    )

    expect(concepto(resultado, 'preaviso')?.valor).toBe(2_000_000)
  })

  it('lanza error con fechas inválidas', () => {
    expect(() =>
      calcularLiquidacion(
        crearEntrada({ contrato: { fechaRetiro: '2025-12-31' } }),
      ),
    ).toThrow()
  })
})

describe('validación', () => {
  it('acepta una entrada completa', () => {
    expect(validarEntrada(crearEntrada()).ok).toBe(true)
  })

  it('rechaza nombre vacío y fechas inválidas', () => {
    const validacion = validarEntrada(
      crearEntrada({
        empleado: { nombre: '   ' },
        contrato: { fechaIngreso: '2026-02-30' },
      }),
    )

    expect(validacion.ok).toBe(false)
    expect(validacion.errores.map((error) => error.campo)).toEqual(
      expect.arrayContaining(['nombre', 'fechaIngreso']),
    )
  })

  it('exige fecha de fin en contrato a término fijo', () => {
    const validacion = validarEntrada(
      crearEntrada({ contrato: { tipo: 'fijo', fechaFinContrato: '' } }),
    )

    expect(validacion.ok).toBe(false)
    expect(validacion.errores.some((error) => error.campo === 'fechaFinContrato')).toBe(true)
  })

  it('rechaza fechas de retiro anteriores al ingreso', () => {
    const validacion = validarEntrada(
      crearEntrada({ contrato: { fechaRetiro: '2025-12-31' } }),
    )

    expect(validacion.ok).toBe(false)
  })
})

describe('propiedades del motor', () => {
  it('el neto siempre cuadra y ningún concepto es negativo', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 4000 }),
        fc.integer({ min: 1_000_000, max: 30_000_000 }),
        fc.constantFrom('indefinido', 'fijo', 'obra'),
        fc.constantFrom('renuncia', 'despido_sin_justa', 'despido_con_justa', 'mutuo_acuerdo'),
        fc.boolean(),
        (dias, salario, tipo, motivo, auxilio) => {
          const fechaRetiro = sumarDias('2020-01-01', dias)
          const entrada = crearEntrada({
            contrato: {
              tipo,
              fechaIngreso: '2020-01-01',
              fechaRetiro,
              fechaFinContrato: tipo === 'fijo' ? sumarDias(fechaRetiro, 180) : '',
              salarioBasico: salario,
              recibeAuxilioTransporte: auxilio,
            },
            terminacion: { motivo, ultimoPagoPrima: '2020-01-01' },
            anioParametros: 2026,
          })

          const resultado = calcularLiquidacion(entrada)

          expect(resultado.netoPagar).toBe(
            resultado.totalDevengado - resultado.totalDeducciones,
          )
          expect(resultado.diasTotales).toBeGreaterThan(0)
          expect(resultado.conceptos.every((item) => item.valor >= 0)).toBe(true)
          expect(resultado.deducciones.every((item) => item.valor >= 0)).toBe(true)
        },
      ),
      { numRuns: 100 },
    )
  })
})
