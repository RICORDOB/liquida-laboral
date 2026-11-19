import { calcularLiquidacion } from './calculo'
import type {
  EntradaLiquidacion,
  MotivoTerminacion,
  ResultadoLiquidacion,
  TipoContrato,
  TipoSalario,
} from './types'
import { validarEntrada } from './validacion'

/** Valor de celda tal como lo devuelve `read-excel-file`. */
export type CeldaLote = string | number | boolean | Date | null

export interface FilaLote {
  fila: number
  entrada: EntradaLiquidacion
  resultado: ResultadoLiquidacion
}

export interface ErrorLote {
  fila: number
  documento: string
  nombre: string
  errores: string[]
}

export interface ResultadoLote {
  filas: FilaLote[]
  errores: ErrorLote[]
  totalFilas: number
}

const ALIAS: Record<string, string> = {
  documento: 'documento',
  cedula: 'documento',
  identificacion: 'documento',
  nit: 'documento',
  nombre: 'nombre',
  nombres: 'nombre',
  trabajador: 'nombre',
  empleado: 'nombre',
  primer_nombre: 'nombre',
  segundo_nombre: 'nombre',
  tercer_nombre: 'nombre',
  primer_apellido: 'nombre',
  segundo_apellido: 'nombre',
  apellido: 'nombre',
  apellidos: 'nombre',
  apellido_paterno: 'nombre',
  apellido_materno: 'nombre',
  nombre_completo: 'nombre',
  nombres_y_apellidos: 'nombre',
  nombre_1: 'nombre',
  nombre_2: 'nombre',
  apellido_1: 'nombre',
  apellido_2: 'nombre',
  fecha_ingreso: 'fecha_ingreso',
  ingreso: 'fecha_ingreso',
  fecha_inicio: 'fecha_ingreso',
  fecha_retiro: 'fecha_retiro',
  retiro: 'fecha_retiro',
  fecha_fin: 'fecha_retiro',
  tipo_contrato: 'tipo_contrato',
  contrato: 'tipo_contrato',
  salario_basico: 'salario_basico',
  salario: 'salario_basico',
  promedio_variable: 'promedio_variable',
  variable: 'promedio_variable',
  auxilio_transporte: 'auxilio_transporte',
  auxilio: 'auxilio_transporte',
  salario_minimo: 'salario_minimo',
  minimo: 'salario_minimo',
  tipo_salario: 'tipo_salario',
  motivo_terminacion: 'motivo_terminacion',
  motivo: 'motivo_terminacion',
  vacaciones_disfrutadas: 'vacaciones_disfrutadas',
  dias_vacaciones: 'vacaciones_disfrutadas',
  dias_salario_pendiente: 'dias_salario_pendiente',
  salario_pendiente_dias: 'dias_salario_pendiente',
  cesantias_consignadas_hasta: 'cesantias_consignadas_hasta',
  ultimo_pago_prima: 'ultimo_pago_prima',
  prima_junio: 'prima_junio_pagada',
  prima_junio_pagada: 'prima_junio_pagada',
  incluir_sancion_mora: 'incluir_sancion_mora',
  fecha_pago_liquidacion: 'fecha_pago_liquidacion',
  otras_deducciones: 'otras_deducciones',
  retencion_fuente: 'retencion_fuente',
  fecha_fin_contrato: 'fecha_fin_contrato',
}

function normalizarTexto(valor: string): string {
  return valor
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '_')
}

function normalizarHeader(header: string): string {
  const limpio = normalizarTexto(header).replace(/^\uFEFF/, '')
  return ALIAS[limpio] ?? limpio
}

function aFecha(valor: string): string {
  const limpio = valor.trim()
  if (!limpio) return ''

  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(limpio)
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`

  const dmy = /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/.exec(limpio)
  if (dmy) {
    const dia = dmy[1].padStart(2, '0')
    const mes = dmy[2].padStart(2, '0')
    return `${dmy[3]}-${mes}-${dia}`
  }

  if (/^\d+(\.\d+)?$/.test(limpio)) {
    const serial = Number(limpio)
    // Los seriales de fecha de Excel relevantes van de ~20.000 (1954) a ~73.050
    // (2100). Un número mayor (p. ej. un salario) no es una fecha.
    if (serial > 20_000 && serial < 100_000) {
      const fecha = new Date(Date.UTC(1899, 11, 30) + serial * 86_400_000)
      const anio = fecha.getUTCFullYear()
      const mes = String(fecha.getUTCMonth() + 1).padStart(2, '0')
      const dia = String(fecha.getUTCDate()).padStart(2, '0')
      return `${anio}-${mes}-${dia}`
    }
  }

  return limpio
}

function aMoneda(valor: string): number {
  const texto = String(valor ?? '').trim()
  if (!texto) return 0

  const ultPunto = texto.lastIndexOf('.')
  const ultComa = texto.lastIndexOf(',')

  let limpio = texto
  if (ultPunto >= 0 && ultComa >= 0) {
    // Hay punto y coma: el que esté más a la derecha es el separador decimal.
    if (ultPunto > ultComa) {
      limpio = texto.replace(/,/g, '') // coma = miles, punto = decimal
    } else {
      limpio = texto.replace(/\./g, '').replace(',', '.') // punto = miles, coma = decimal
    }
  } else if (ultComa >= 0) {
    // Solo coma: decimal si deja 1-2 dígitos al final; si no, separador de miles.
    limpio = /,\d{1,2}$/.test(texto) ? texto.replace(',', '.') : texto.replace(/,/g, '')
  } else if (ultPunto >= 0) {
    // Solo punto: decimal si deja 1-2 dígitos al final; si no, separador de miles.
    limpio = /\.\d{1,2}$/.test(texto) ? texto : texto.replace(/\./g, '')
  }

  limpio = limpio.replace(/[^\d.-]/g, '')
  const numero = Number(limpio)
  return Number.isFinite(numero) ? numero : 0
}

function aDecimal(valor: string): number {
  const numero = Number(valor.replace(',', '.'))
  return Number.isFinite(numero) ? numero : 0
}

function aBooleano(valor: string): boolean {
  const limpio = normalizarTexto(valor)
  return ['si', 'sí', 'true', '1', 'x', 'yes', 'aplica'].includes(limpio)
}

function aTipoContrato(valor: string): TipoContrato {
  const limpio = normalizarTexto(valor)
  if (limpio.includes('fijo') || limpio.includes('plazo')) return 'fijo'
  if (limpio.includes('obra') || limpio.includes('labor')) return 'obra'
  return 'fijo'
}

function aTipoSalario(valor: string): TipoSalario {
  const limpio = normalizarTexto(valor)
  if (limpio.includes('variable')) return 'variable'
  if (limpio.includes('integral')) return 'integral'
  return 'fijo'
}

function aMotivo(valor: string): MotivoTerminacion {
  const limpio = normalizarTexto(valor)
  if (limpio.includes('sin_justa') || limpio.includes('injustificado')) {
    return 'despido_sin_justa'
  }
  if (limpio.includes('con_justa') || limpio.includes('justa_causa')) {
    return 'despido_con_justa'
  }
  if (limpio.includes('mutuo')) return 'mutuo_acuerdo'
  if (limpio.includes('plazo') || limpio.includes('vencimiento')) return 'fin_plazo'
  if (limpio.includes('obra')) return 'fin_obra'
  if (limpio.includes('renuncia')) return 'renuncia'
  return 'fin_plazo'
}

function leer(fila: Record<string, string>, campo: string): string {
  return (fila[campo] ?? '').trim()
}

/** Convierte una celda de Excel a texto plano para reutilizar el mapeo existente. */
function celdaATexto(celda: CeldaLote): string {
  if (celda === null || celda === undefined) return ''
  if (celda instanceof Date) {
    const anio = celda.getUTCFullYear()
    const mes = String(celda.getUTCMonth() + 1).padStart(2, '0')
    const dia = String(celda.getUTCDate()).padStart(2, '0')
    return `${anio}-${mes}-${dia}`
  }
  if (typeof celda === 'boolean') return celda ? 'si' : 'no'
  return String(celda)
}

/**
 * Convierte texto pegado (celdas copiadas de Excel/Sheets o un CSV) en la misma
 * estructura de filas que usa `parsearLote`. Detecta el delimitador comparando
 * cuál hace que todas las líneas tengan el mismo número de columnas.
 */
export function textoACeldas(texto: string): CeldaLote[][] {
  const lineas = texto
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((linea) => linea.trim())
    .filter((linea) => linea.length > 0)

  if (lineas.length === 0) return []

  const delimitador = detectarDelimitador(lineas)
  return lineas.map((linea) => linea.split(delimitador).map((celda) => celda.trim()))
}

function detectarDelimitador(lineas: string[]): string {
  const candidatos = ['\t', ';', '|', ',']
  let mejor = '\t'
  let mejorColumnas = 0

  for (const candidato of candidatos) {
    const cuenta = lineas[0].split(candidato).length
    if (cuenta <= 1) continue
    const uniforme = lineas.every((linea) => linea.split(candidato).length === cuenta)
    if (uniforme && cuenta > mejorColumnas) {
      mejorColumnas = cuenta
      mejor = candidato
    }
  }

  return mejor
}

/** Campos asignables en el mapeo automático, en orden de prioridad visual. */
export const CAMPOS_LOTE = [
  'documento',
  'nombre',
  'fecha_ingreso',
  'fecha_retiro',
  'salario_basico',
  'salario_minimo',
  'auxilio_transporte',
  'tipo_contrato',
  'tipo_salario',
  'motivo_terminacion',
  'vacaciones_disfrutadas',
  'dias_salario_pendiente',
  'fecha_fin_contrato',
  'cesantias_consignadas_hasta',
  'ultimo_pago_prima',
  'prima_junio_pagada',
  'incluir_sancion_mora',
  'fecha_pago_liquidacion',
  'otras_deducciones',
  'retencion_fuente',
] as const

/**
 * Devuelve `true` si la primera fila es un encabezado reconocible: la mayoría de
 * sus celdas no vacías mapean (vía alias) a un campo conocido.
 */
export function reconocerEncabezados(fila: CeldaLote[]): boolean {
  const celdas = fila.map((celda) => normalizarHeader(celdaATexto(celda)))
  const noVacias = celdas.filter((celda) => celda.trim() !== '')
  if (noVacias.length === 0) return false
  const reconocidas = noVacias.filter((celda) =>
    (CAMPOS_LOTE as readonly string[]).includes(celda),
  )
  return reconocidas.length / noVacias.length >= 0.6
}

function aFechaISO(valor: string): string {
  const resultado = aFecha(valor)
  return /^\d{4}-\d{2}-\d{2}$/.test(resultado) ? resultado : ''
}

function esNumero(valor: string): boolean {
  const texto = valor.trim()
  if (!texto) return false
  return /^[\d.,\s-]+$/.test(texto) && /\d/.test(texto)
}

function esBooleano(valor: string): boolean {
  return ['si', 'no', 'true', 'false', '1', '0', 'x', 'yes', 'aplica'].includes(
    normalizarTexto(valor),
  )
}

/**
 * Sugiere, para cada columna, a qué campo corresponde. Es un mejor esfuerzo: las
 * fechas se ordenan por su valor mínimo (ingreso / retiro / fin), los números
 * únicos sin separador de miles se asumen documento y el resto salario, y el
 * primer texto con espacios se asume nombre. El usuario confirma o corrige.
 */
export function sugerirMapeo(filas: CeldaLote[][]): string[] {
  const nCols = filas.reduce((max, fila) => Math.max(max, fila.length), 0)
  const columnas: string[][] = Array.from({ length: nCols }, (_, col) =>
    filas
      .slice(0, 20)
      .map((fila) => celdaATexto(fila[col] ?? null).trim())
      .filter(Boolean),
  )

  const asignaciones = new Array<string>(nCols).fill('')

  // Fechas: la más antigua → ingreso, la más reciente → retiro, intermedias → fin.
  const fechas = columnas
    .map((vals, i) => ({ i, vals }))
    .filter(({ vals }) => vals.length > 0 && vals.every((v) => aFechaISO(v) !== ''))
    .map(({ i, vals }) => ({ i, min: vals.map(aFechaISO).sort()[0] }))
    .sort((a, b) => a.min.localeCompare(b.min))

  if (fechas.length >= 1) asignaciones[fechas[0].i] = 'fecha_ingreso'
  if (fechas.length >= 2) asignaciones[fechas[fechas.length - 1].i] = 'fecha_retiro'
  for (let k = 1; k < fechas.length - 1; k++) asignaciones[fechas[k].i] = 'fecha_fin_contrato'

  // Números: el que tenga separador de miles es salario; del resto, el primero
  // (de izquierda a derecha) se asume documento y el siguiente, salario. Los
  // demás quedan sin asignar para que el usuario decida.
  const numericas = columnas
    .map((vals, i) => ({ i, vals }))
    .filter(({ vals }) => vals.length > 0 && vals.every(esNumero))

  for (const { i, vals } of numericas) {
    const tieneSeparador = vals.some((v) => /\.\d{3}/.test(v) || /,\d{3}/.test(v))
    if (tieneSeparador) asignaciones[i] = 'salario_basico'
  }

  let documentoAsignado = false
  for (const { i } of numericas) {
    if (asignaciones[i]) continue
    if (!documentoAsignado) {
      asignaciones[i] = 'documento'
      documentoAsignado = true
    } else {
      asignaciones[i] = 'salario_basico'
    }
  }

  // Texto → nombre. Todas las columnas de texto (nombres y apellidos separados
  // en varias columnas) se asignan a 'nombre' y luego se concatenan al procesar.
  for (const [i, vals] of columnas.entries()) {
    if (asignaciones[i]) continue
    if (vals.length === 0) continue
    if (vals.every(esNumero) || vals.every(esBooleano)) continue
    if (vals.every((v) => aFechaISO(v) !== '')) continue
    const unicos = new Set(vals.map((v) => normalizarTexto(v))).size
    if (unicos === vals.length) asignaciones[i] = 'nombre'
  }

  return asignaciones
}

/**
 * Procesa un lote leído desde una hoja de Excel. Recibe las filas tal como las
 * devuelve `read-excel-file` (array de arrays de celdas; la primera fila son los
 * encabezados) y produce un resultado por fila, sin bloquear a las demás.
 */
export function parsearLote(filas: CeldaLote[][], anioParametros: number): ResultadoLote {
  if (filas.length === 0) return { filas: [], errores: [], totalFilas: 0 }

  const encabezados = filas[0].map((celda) => normalizarHeader(celdaATexto(celda)))
  const datos = filas.slice(1)

  const filasLote: FilaLote[] = []
  const errores: ErrorLote[] = []

  datos.forEach((filaCeldas, indice) => {
    const numeroFila = indice + 2 // +1 por índice, +1 por encabezado
    const fila: Record<string, string> = {}
    const partesNombre: string[] = []
    encabezados.forEach((encabezado, col) => {
      const valor = celdaATexto(filaCeldas[col] ?? null)
      // Varias columnas de nombre (primer/segundo nombre, apellidos) se
      // concatenan en el orden en que aparecen.
      if (encabezado === 'nombre') {
        if (valor.trim()) partesNombre.push(valor.trim())
      } else {
        fila[encabezado] = valor
      }
    })
    if (partesNombre.length > 0) fila.nombre = partesNombre.join(' ')

    const nombre = leer(fila, 'nombre')
    const documento = leer(fila, 'documento')

    const entrada: EntradaLiquidacion = {
      empleado: { nombre, documento },
      contrato: {
        tipo: aTipoContrato(leer(fila, 'tipo_contrato')),
        fechaIngreso: aFecha(leer(fila, 'fecha_ingreso')),
        fechaRetiro: aFecha(leer(fila, 'fecha_retiro')),
        fechaFinContrato: aFecha(leer(fila, 'fecha_fin_contrato')),
        tipoSalario: aTipoSalario(leer(fila, 'tipo_salario')),
        salarioBasico: aMoneda(leer(fila, 'salario_basico')),
        promedioVariable: aMoneda(leer(fila, 'promedio_variable')),
        recibeAuxilioTransporte: aBooleano(leer(fila, 'auxilio_transporte')),
        salarioEsMinimo: aBooleano(leer(fila, 'salario_minimo')),
      },
      terminacion: {
        motivo: aMotivo(leer(fila, 'motivo_terminacion')),
        diasVacacionesDisfrutados: aDecimal(leer(fila, 'vacaciones_disfrutadas')),
        diasSalarioPendiente: aDecimal(leer(fila, 'dias_salario_pendiente')),
        cesantiasConsignadasHasta: aFecha(leer(fila, 'cesantias_consignadas_hasta')),
        ultimoPagoPrima: aFecha(leer(fila, 'ultimo_pago_prima')),
        primaJunioPagada: aBooleano(leer(fila, 'prima_junio_pagada')),
        incluirSancionMora: aBooleano(leer(fila, 'incluir_sancion_mora')),
        fechaPagoLiquidacion: aFecha(leer(fila, 'fecha_pago_liquidacion')),
        otrasDeducciones: aMoneda(leer(fila, 'otras_deducciones')),
        retencionFuente: aMoneda(leer(fila, 'retencion_fuente')),
      },
      anioParametros,
    }

    const validacion = validarEntrada(entrada, 'lote')
    if (!validacion.ok) {
      errores.push({
        fila: numeroFila,
        documento,
        nombre,
        errores: validacion.errores.map((error) => error.mensaje),
      })
      return
    }

    try {
      const resultado = calcularLiquidacion(entrada)
      filasLote.push({
        fila: numeroFila,
        entrada,
        resultado: {
          ...resultado,
          advertencias: [...validacion.advertencias, ...resultado.advertencias],
        },
      })
    } catch (error) {
      errores.push({
        fila: numeroFila,
        documento,
        nombre,
        errores: [error instanceof Error ? error.message : 'Error de cálculo'],
      })
    }
  })

  return { filas: filasLote, errores, totalFilas: datos.length }
}

function valorConcepto(resultado: ResultadoLiquidacion, id: string): number {
  return resultado.conceptos.find((concepto) => concepto.id === id)?.valor ?? 0
}

// ---------------------------------------------------------------------------
// Escritura de Excel (estructura de celdas para `write-excel-file`)
// ---------------------------------------------------------------------------

type ValorCelda = string | number | boolean | Date | null
type CeldaXlsx =
  | ValorCelda
  | { value: string | number | boolean | Date; fontWeight?: 'bold' }

function negrita(valor: string): CeldaXlsx {
  return { value: valor, fontWeight: 'bold' }
}

// Plantilla mínima: solo las columnas que de verdad cambian el resultado.
// El resto se llena con valores por defecto y se muestra como alerta.
const ENCABEZADOS_PLANTILLA_MINIMA = [
  'documento',
  'nombre',
  'fecha_ingreso',
  'fecha_retiro',
  'salario_basico',
  'salario_minimo',
  'auxilio_transporte',
  'tipo_contrato',
  'tipo_salario',
  'motivo_terminacion',
]

const FILA_EJEMPLO_MINIMA: ValorCelda[] = [
  '123456789',
  'Ana Pérez',
  '2024-01-15',
  '2026-06-30',
  1_750_905,
  'no',
  'no',
  'fijo',
  'fijo',
  'fin_plazo',
]

const ENCABEZADOS_PLANTILLA = [
  'documento',
  'nombre',
  'fecha_ingreso',
  'fecha_retiro',
  'tipo_contrato',
  'tipo_salario',
  'salario_basico',
  'promedio_variable',
  'auxilio_transporte',
  'salario_minimo',
  'motivo_terminacion',
  'vacaciones_disfrutadas',
  'dias_salario_pendiente',
  'fecha_fin_contrato',
  'cesantias_consignadas_hasta',
  'ultimo_pago_prima',
  'prima_junio_pagada',
  'incluir_sancion_mora',
  'fecha_pago_liquidacion',
  'otras_deducciones',
  'retencion_fuente',
]

const FILA_EJEMPLO: ValorCelda[] = [
  '123456789',
  'Ana Pérez',
  '2024-01-15',
  '2026-06-30',
  'fijo',
  'fijo',
  1_750_905,
  0,
  'no',
  'no',
  'fin_plazo',
  0,
  0,
  '2026-12-31',
  '2025-12-31',
  '2026-06-30',
  'no',
  'no',
  '',
  0,
  0,
]

/** Filas de la plantilla mínima: encabezados + una fila de ejemplo. */
export function plantillaDatos(): CeldaXlsx[][] {
  return [ENCABEZADOS_PLANTILLA_MINIMA.map(negrita), FILA_EJEMPLO_MINIMA]
}

/** Filas de la plantilla completa con todas las columnas opcionales. */
export function plantillaCompletaDatos(): CeldaXlsx[][] {
  return [ENCABEZADOS_PLANTILLA.map(negrita), FILA_EJEMPLO]
}

/** Filas de la hoja «Resultados» para el lote procesado. */
export function resultadosDatos(filas: FilaLote[]): CeldaXlsx[][] {
  const encabezados = [
    'fila',
    'documento',
    'nombre',
    'fecha_ingreso',
    'fecha_retiro',
    'dias',
    'salario_base',
    'auxilio',
    'cesantias',
    'intereses',
    'prima',
    'vacaciones',
    'indemnizacion',
    'salario_pendiente',
    'auxilio_pendiente',
    'sancion_mora',
    'total_devengado',
    'deducciones',
    'neto_pagar',
    'advertencias',
  ]

  const filasDatos = filas.map(
    ({ fila, entrada, resultado }): ValorCelda[] => [
      fila,
      entrada.empleado.documento,
      entrada.empleado.nombre,
      entrada.contrato.fechaIngreso,
      entrada.contrato.fechaRetiro,
      resultado.diasTotales,
      resultado.salarioOrdinario,
      resultado.auxilio,
      valorConcepto(resultado, 'cesantias'),
      valorConcepto(resultado, 'intereses_cesantias'),
      valorConcepto(resultado, 'prima'),
      valorConcepto(resultado, 'vacaciones'),
      valorConcepto(resultado, 'indemnizacion'),
      valorConcepto(resultado, 'salario_pendiente'),
      valorConcepto(resultado, 'auxilio_pendiente'),
      valorConcepto(resultado, 'sancion_mora'),
      resultado.totalDevengado,
      resultado.totalDeducciones,
      resultado.netoPagar,
      resultado.advertencias.join(' | '),
    ],
  )

  return [encabezados.map(negrita), ...filasDatos]
}

/** Filas de la hoja «Errores» para las filas del lote que no se pudieron procesar. */
export function erroresDatos(errores: ErrorLote[]): CeldaXlsx[][] {
  const encabezados = ['fila', 'documento', 'nombre', 'errores']

  const filasDatos = errores.map(
    (error): ValorCelda[] => [
      error.fila,
      error.documento,
      error.nombre,
      error.errores.join(' | '),
    ],
  )

  return [encabezados.map(negrita), ...filasDatos]
}
