import Papa from 'papaparse'
import { calcularLiquidacion } from './calculo'
import { formatearFecha } from './fechas'
import type {
  EntradaLiquidacion,
  MotivoTerminacion,
  ResultadoLiquidacion,
  TipoContrato,
  TipoSalario,
} from './types'
import { validarEntrada } from './validacion'

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
  tipo_salario: 'tipo_salario',
  motivo_terminacion: 'motivo_terminacion',
  motivo: 'motivo_terminacion',
  vacaciones_disfrutadas: 'vacaciones_disfrutadas',
  dias_vacaciones: 'vacaciones_disfrutadas',
  dias_salario_pendiente: 'dias_salario_pendiente',
  salario_pendiente_dias: 'dias_salario_pendiente',
  cesantias_consignadas_hasta: 'cesantias_consignadas_hasta',
  ultimo_pago_prima: 'ultimo_pago_prima',
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
    if (serial > 20_000) {
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
  const limpio = valor.replace(/[^\d-]/g, '')
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
  return 'indefinido'
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
  return 'renuncia'
}

function leer(fila: Record<string, string>, campo: string): string {
  return (fila[campo] ?? '').trim()
}

export function parsearLote(texto: string, anioParametros: number): ResultadoLote {
  const parseado = Papa.parse<Record<string, string>>(texto, {
    header: true,
    skipEmptyLines: 'greedy',
    transformHeader: normalizarHeader,
  })

  const filas: FilaLote[] = []
  const errores: ErrorLote[] = []
  const datos = parseado.data ?? []

  datos.forEach((fila, indice) => {
    const numeroFila = indice + 2 // +1 por índice, +1 por encabezado
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
      },
      terminacion: {
        motivo: aMotivo(leer(fila, 'motivo_terminacion')),
        preavisoDado: !aBooleano(leer(fila, 'sin_preaviso')),
        diasVacacionesDisfrutados: aDecimal(leer(fila, 'vacaciones_disfrutadas')),
        diasSalarioPendiente: aDecimal(leer(fila, 'dias_salario_pendiente')),
        cesantiasConsignadasHasta: aFecha(leer(fila, 'cesantias_consignadas_hasta')),
        ultimoPagoPrima: aFecha(leer(fila, 'ultimo_pago_prima')),
        incluirSancionMora: aBooleano(leer(fila, 'incluir_sancion_mora')),
        fechaPagoLiquidacion: aFecha(leer(fila, 'fecha_pago_liquidacion')),
        otrasDeducciones: aMoneda(leer(fila, 'otras_deducciones')),
        retencionFuente: aMoneda(leer(fila, 'retencion_fuente')),
      },
      anioParametros,
    }

    const validacion = validarEntrada(entrada)
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
      filas.push({
        fila: numeroFila,
        entrada,
        resultado: calcularLiquidacion(entrada),
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

  return { filas, errores, totalFilas: datos.length }
}

function valorConcepto(resultado: ResultadoLiquidacion, id: string): number {
  return resultado.conceptos.find((concepto) => concepto.id === id)?.valor ?? 0
}

/**
 * Neutraliza celdas que comienzan con caracteres que las hojas de cálculo
 * interpretan como fórmula (= + - @), para evitar inyección de fórmulas
 * (CWE-1236) al abrir el CSV exportado en Excel/LibreOffice.
 */
function protegerCelda(valor: string): string {
  return /^[=+\-@\t\r]/.test(valor) ? `'${valor}` : valor
}

export function exportarResultadosCSV(filas: FilaLote[]): string {
  const datos = filas.map(({ fila, entrada, resultado }) => ({
    fila,
    documento: protegerCelda(entrada.empleado.documento),
    nombre: protegerCelda(entrada.empleado.nombre),
    fecha_ingreso: entrada.contrato.fechaIngreso,
    fecha_retiro: entrada.contrato.fechaRetiro,
    dias: resultado.diasTotales,
    salario_base: resultado.salarioOrdinario,
    auxilio: resultado.auxilio,
    cesantias: valorConcepto(resultado, 'cesantias'),
    intereses: valorConcepto(resultado, 'intereses_cesantias'),
    prima: valorConcepto(resultado, 'prima'),
    vacaciones: valorConcepto(resultado, 'vacaciones'),
    indemnizacion: valorConcepto(resultado, 'indemnizacion'),
    preaviso: valorConcepto(resultado, 'preaviso'),
    salario_pendiente: valorConcepto(resultado, 'salario_pendiente'),
    auxilio_pendiente: valorConcepto(resultado, 'auxilio_pendiente'),
    sancion_mora: valorConcepto(resultado, 'sancion_mora'),
    total_devengado: resultado.totalDevengado,
    deducciones: resultado.totalDeducciones,
    neto_pagar: resultado.netoPagar,
    advertencias: resultado.advertencias.join(' | '),
  }))

  return Papa.unparse(datos, { delimiter: ';' })
}

export function exportarErroresCSV(errores: ErrorLote[]): string {
  return Papa.unparse(
    errores.map((error) => ({
      fila: error.fila,
      documento: protegerCelda(error.documento),
      nombre: protegerCelda(error.nombre),
      errores: error.errores.join(' | '),
    })),
    { delimiter: ';' },
  )
}

export function plantillaCSV(): string {
  return Papa.unparse(
    [
      {
        documento: '123456789',
        nombre: 'Ana Pérez',
        fecha_ingreso: '2024-01-15',
        fecha_retiro: '2026-06-30',
        tipo_contrato: 'indefinido',
        tipo_salario: 'fijo',
        salario_basico: 1750905,
        promedio_variable: 0,
        auxilio_transporte: 'si',
        motivo_terminacion: 'renuncia',
        vacaciones_disfrutadas: 0,
        dias_salario_pendiente: 0,
        cesantias_consignadas_hasta: '2025-12-31',
        ultimo_pago_prima: '2026-06-30',
        sin_preaviso: 'no',
        incluir_sancion_mora: 'no',
        fecha_pago_liquidacion: '',
        otras_deducciones: 0,
        retencion_fuente: 0,
      },
    ],
    { delimiter: ';' },
  )
}

export function resumenFila(fila: FilaLote): string {
  return `${fila.entrada.empleado.nombre} · ${formatearFecha(
    fila.entrada.contrato.fechaRetiro,
  )}`
}
