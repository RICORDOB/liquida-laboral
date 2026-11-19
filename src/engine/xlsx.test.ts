import { describe, expect, it } from 'vitest'
import type { EntradaLiquidacion } from './types'
import { validarEntrada } from './validacion'
import { parsearLote, reconocerEncabezados, sugerirMapeo, textoACeldas } from './xlsx'

function entradaMinima(
  contrato: Partial<EntradaLiquidacion['contrato']> = {},
  terminacion: Partial<EntradaLiquidacion['terminacion']> = {},
): EntradaLiquidacion {
  return {
    empleado: { nombre: 'Ana Pérez', documento: '123456' },
    contrato: {
      tipo: 'indefinido',
      fechaIngreso: '2024-01-01',
      fechaRetiro: '2026-06-30',
      fechaFinContrato: '',
      tipoSalario: 'fijo',
      salarioBasico: 1_750_905,
      promedioVariable: 0,
      recibeAuxilioTransporte: false,
      salarioEsMinimo: false,
      ...contrato,
    },
    terminacion: {
      motivo: 'fin_plazo',
      diasVacacionesDisfrutados: 0,
      diasSalarioPendiente: 0,
      cesantiasConsignadasHasta: '',
      ultimoPagoPrima: '',
      primaJunioPagada: false,
      incluirSancionMora: false,
      fechaPagoLiquidacion: '',
      otrasDeducciones: 0,
      retencionFuente: 0,
      ...terminacion,
    },
    anioParametros: 2026,
  }
}

describe('textoACeldas', () => {
  it('detecta el delimitador por tabulador (celdas copiadas de Excel)', () => {
    const celdas = textoACeldas(
      'documento\tnombre\tfecha_ingreso\tfecha_retiro\tsalario_basico\n123\tAna Pérez\t2024-01-01\t2026-06-30\t1750905',
    )
    expect(celdas).toHaveLength(2)
    expect(celdas[0]).toEqual(['documento', 'nombre', 'fecha_ingreso', 'fecha_retiro', 'salario_basico'])
    expect(celdas[1]).toEqual(['123', 'Ana Pérez', '2024-01-01', '2026-06-30', '1750905'])
  })

  it('detecta el delimitador por punto y coma (CSV en español)', () => {
    const celdas = textoACeldas(
      'documento;nombre;fecha_ingreso;fecha_retiro;salario_basico\n456;Juan Roto;2024-01-01;2026-06-30;2000000',
    )
    expect(celdas).toHaveLength(2)
    expect(celdas[1][1]).toBe('Juan Roto')
  })

  it('ignora líneas vacías', () => {
    const celdas = textoACeldas('a\tb\n\n1\t2\n')
    expect(celdas).toHaveLength(2)
  })
})

describe('parsearLote en modo indulgente', () => {
  it('procesa una fila con solo las 5 columnas obligatorias y aplica defaults', () => {
    const lote = parsearLote(
      [
        ['documento', 'nombre', 'fecha_ingreso', 'fecha_retiro', 'salario_basico'],
        ['123', 'Ana Pérez', '2024-01-15', '2026-06-30', '1750905'],
      ],
      2026,
    )

    expect(lote.errores).toHaveLength(0)
    expect(lote.filas).toHaveLength(1)

    const { entrada, resultado } = lote.filas[0]
    expect(entrada.contrato.tipo).toBe('fijo')
    expect(entrada.contrato.tipoSalario).toBe('fijo')
    expect(entrada.contrato.recibeAuxilioTransporte).toBe(false)
    expect(entrada.terminacion.motivo).toBe('fin_plazo')
    // fin_plazo no genera indemnización
    expect(resultado.conceptos.find((c) => c.id === 'indemnizacion')).toBeUndefined()
  })

  it('bloquea solo cuando falta documento (crítico)', () => {
    const lote = parsearLote(
      [
        ['documento', 'nombre', 'fecha_ingreso', 'fecha_retiro', 'salario_basico'],
        ['', 'Ana Pérez', '2024-01-15', '2026-06-30', '1750905'],
      ],
      2026,
    )
    expect(lote.errores).toHaveLength(1)
    expect(lote.errores[0].errores[0]).toContain('documento')
  })

  it('salario_minimo = si sustituye al salario faltante', () => {
    const lote = parsearLote(
      [
        ['documento', 'nombre', 'fecha_ingreso', 'fecha_retiro', 'salario_minimo'],
        ['123', 'Ana Pérez', '2024-01-15', '2026-06-30', 'si'],
      ],
      2026,
    )
    expect(lote.errores).toHaveLength(0)
    expect(lote.filas[0].entrada.contrato.salarioEsMinimo).toBe(true)
  })

  it('parsea salario con separador de miles y decimales', () => {
    const lote = parsearLote(
      [
        ['documento', 'nombre', 'fecha_ingreso', 'fecha_retiro', 'salario_basico'],
        ['123', 'Ana Pérez', '2024-01-15', '2026-06-30', '1.500.000,50'],
      ],
      2026,
    )
    expect(lote.filas[0].entrada.contrato.salarioBasico).toBe(1_500_000.5)
  })

  it('propaga las advertencias de validación al resultado', () => {
    const lote = parsearLote(
      [
        ['documento', 'nombre', 'fecha_ingreso', 'fecha_retiro', 'salario_basico', 'tipo_contrato'],
        ['123', 'Ana Pérez', '2024-01-15', '2026-06-30', '1750905', 'fijo'],
      ],
      2026,
    )
    // fijo sin fecha_fin_contrato ya no bloquea, pero debe quedar como advertencia
    expect(lote.errores).toHaveLength(0)
    expect(lote.filas[0].resultado.advertencias.some((a) => a.includes('fecha de fin'))).toBe(true)
  })
})

describe('validarEntrada modo lote', () => {
  it('solo los 5 campos críticos bloquean', () => {
    const validacion = validarEntrada(
      entradaMinima({ tipo: 'fijo', fechaFinContrato: '' }),
      'lote',
    )
    expect(validacion.ok).toBe(true)
    expect(validacion.advertencias.some((a) => a.includes('fecha de fin'))).toBe(true)
  })

  it('el documento vacío es crítico solo en lote', () => {
    const sinDocumento = entradaMinima()
    sinDocumento.empleado.documento = ''

    expect(validarEntrada(sinDocumento, 'formulario').ok).toBe(true)
    expect(validarEntrada(sinDocumento, 'lote').ok).toBe(false)
  })

  it('las fechas opcionales inválidas pasan como advertencia', () => {
    const validacion = validarEntrada(
      entradaMinima({}, { cesantiasConsignadasHasta: 'no-es-fecha' }),
      'lote',
    )
    expect(validacion.ok).toBe(true)
    expect(validacion.advertencias.some((a) => a.includes('cesantías'))).toBe(true)
  })
})

describe('mapeo automático', () => {
  it('reconoce una fila de encabezados conocidos (con alias)', () => {
    expect(
      reconocerEncabezados(['documento', 'nombre', 'fecha_ingreso', 'fecha_retiro', 'salario_basico']),
    ).toBe(true)
    expect(reconocerEncabezados(['cedula', 'trabajador', 'ingreso', 'retiro', 'salario'])).toBe(true)
  })

  it('no confunde una fila de datos con un encabezado', () => {
    expect(reconocerEncabezados(['123', 'Ana Pérez', '2024-01-15', '2026-06-30', '1750905'])).toBe(false)
  })

  it('sugiere el mapeo de un bloque de datos sin encabezado', () => {
    const filas: (string | number)[][] = [
      ['123', 'Ana Pérez', '2024-01-15', '2026-06-30', 1_750_905],
      ['456', 'Juan Roto', '2024-03-01', '2026-06-30', 2_000_000],
    ]
    expect(sugerirMapeo(filas)).toEqual([
      'documento',
      'nombre',
      'fecha_ingreso',
      'fecha_retiro',
      'salario_basico',
    ])
  })

  it('detecta salario con separador de miles y documento sin separador', () => {
    const filas: (string | number)[][] = [
      ['1032456789', 'Ana Pérez', '2024-01-15', '2026-06-30', '1.750.905'],
      ['987654321', 'Juan Roto', '2024-03-01', '2026-06-30', '2.000.000'],
    ]
    const mapeo = sugerirMapeo(filas)
    expect(mapeo[0]).toBe('documento')
    expect(mapeo[4]).toBe('salario_basico')
  })
})
