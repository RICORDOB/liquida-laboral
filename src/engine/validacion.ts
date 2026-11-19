import { fechaValida } from './fechas'
import { getParametros, PARAMETROS } from './parametros'
import type { EntradaLiquidacion, ErrorValidacion, ValidacionEntrada } from './types'

export type ModoValidacion = 'formulario' | 'lote'

/**
 * Campos que, en modo `lote`, bloquean la fila. El resto se degrada a
 * advertencia y la fila se procesa igual (el motor ya aplica valores por
 * defecto y clampa negativos).
 */
const CRITICOS_LOTE = new Set(['nombre', 'documento', 'fechaIngreso', 'fechaRetiro', 'salarioBasico'])

export function validarEntrada(
  entrada: EntradaLiquidacion,
  modo: ModoValidacion = 'formulario',
): ValidacionEntrada {
  const errores: ErrorValidacion[] = []
  const advertencias: string[] = []
  const { empleado, contrato, terminacion } = entrada

  /**
   * En modo formulario todo es error. En modo lote solo los campos críticos
   * (nombre, documento, fechas y salario) bloquean; los demás se acumulan como
   * advertencias para no descartar la fila.
   */
  const registrar = (campo: string, mensaje: string): void => {
    if (modo === 'formulario' || CRITICOS_LOTE.has(campo)) {
      errores.push({ campo, mensaje })
    } else {
      advertencias.push(mensaje)
    }
  }

  if (!empleado.nombre.trim()) {
    registrar('nombre', 'Ingresa el nombre del trabajador.')
  }

  // El documento solo es obligatorio en lote (en el formulario individual se
  // mantiene opcional para no romper historial ni borradores existentes).
  if (modo === 'lote' && !empleado.documento.trim()) {
    errores.push({ campo: 'documento', mensaje: 'Falta el documento de identidad.' })
  }

  if (!fechaValida(contrato.fechaIngreso)) {
    registrar('fechaIngreso', 'La fecha de ingreso no es válida.')
  }

  if (!fechaValida(contrato.fechaRetiro)) {
    registrar('fechaRetiro', 'La fecha de retiro no es válida.')
  }

  if (
    fechaValida(contrato.fechaIngreso) &&
    fechaValida(contrato.fechaRetiro) &&
    contrato.fechaRetiro < contrato.fechaIngreso
  ) {
    registrar('fechaRetiro', 'La fecha de retiro no puede ser anterior a la fecha de ingreso.')
  }

  if (!contrato.salarioEsMinimo && contrato.salarioBasico <= 0) {
    registrar('salarioBasico', 'El salario básico debe ser mayor que cero.')
  }

  if (contrato.tipo === 'fijo') {
    if (!fechaValida(contrato.fechaFinContrato)) {
      registrar(
        'fechaFinContrato',
        'Para contrato a término fijo debes indicar la fecha de fin.',
      )
    } else if (
      fechaValida(contrato.fechaIngreso) &&
      contrato.fechaFinContrato < contrato.fechaIngreso
    ) {
      registrar('fechaFinContrato', 'La fecha de fin no puede ser anterior a la fecha de ingreso.')
    }
  }

  if (contrato.tipoSalario === 'variable' && contrato.promedioVariable < 0) {
    registrar('promedioVariable', 'El promedio variable no puede ser negativo.')
  }

  if (terminacion.diasVacacionesDisfrutados < 0) {
    registrar('diasVacacionesDisfrutados', 'Los días de vacaciones disfrutados no pueden ser negativos.')
  }

  if (terminacion.diasSalarioPendiente < 0) {
    registrar('diasSalarioPendiente', 'Los días de salario pendiente no pueden ser negativos.')
  }

  if (terminacion.cesantiasConsignadasHasta && !fechaValida(terminacion.cesantiasConsignadasHasta)) {
    registrar('cesantiasConsignadasHasta', 'La fecha de cesantías consignadas no es válida.')
  }

  if (terminacion.ultimoPagoPrima && !fechaValida(terminacion.ultimoPagoPrima)) {
    registrar('ultimoPagoPrima', 'La fecha de último pago de prima no es válida.')
  }

  if (terminacion.incluirSancionMora) {
    if (!fechaValida(terminacion.fechaPagoLiquidacion)) {
      registrar('fechaPagoLiquidacion', 'Indica la fecha de pago para calcular la sanción por mora.')
    } else if (
      fechaValida(contrato.fechaRetiro) &&
      terminacion.fechaPagoLiquidacion < contrato.fechaRetiro
    ) {
      registrar('fechaPagoLiquidacion', 'La fecha de pago no puede ser anterior a la fecha de retiro.')
    }
  }

  if (terminacion.otrasDeducciones < 0) {
    registrar('otrasDeducciones', 'Las otras deducciones no pueden ser negativas.')
  }

  if (terminacion.retencionFuente < 0) {
    registrar('retencionFuente', 'La retención en la fuente no puede ser negativa.')
  }

  if (!PARAMETROS[entrada.anioParametros]) {
    advertencias.push(
      `No hay parámetros propios de ${entrada.anioParametros}; se usarán los del año más cercano.`,
    )
  }

  const parametros = getParametros(entrada.anioParametros)

  if (
    !contrato.salarioEsMinimo &&
    contrato.salarioBasico > 0 &&
    contrato.salarioBasico < parametros.smmlv
  ) {
    advertencias.push(
      `El salario básico es menor al SMMLV de ${parametros.anio}. Verifica el dato o el año de los parámetros.`,
    )
  }

  if (
    !contrato.salarioEsMinimo &&
    contrato.tipoSalario === 'integral' &&
    contrato.salarioBasico < parametros.smmlv * parametros.salarioIntegralSmmlv
  ) {
    advertencias.push(
      `El salario integral debe ser al menos ${parametros.salarioIntegralSmmlv} SMMLV. Revisa el valor antes de continuar.`,
    )
  }

  return {
    ok: errores.length === 0,
    errores,
    advertencias,
  }
}
