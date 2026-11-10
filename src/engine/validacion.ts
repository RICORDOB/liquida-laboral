import { fechaValida } from './fechas'
import { getParametros, PARAMETROS } from './parametros'
import type { EntradaLiquidacion, ErrorValidacion, ValidacionEntrada } from './types'

export function validarEntrada(entrada: EntradaLiquidacion): ValidacionEntrada {
  const errores: ErrorValidacion[] = []
  const advertencias: string[] = []
  const { empleado, contrato, terminacion } = entrada

  if (!empleado.nombre.trim()) {
    errores.push({ campo: 'nombre', mensaje: 'Ingresa el nombre del trabajador.' })
  }

  if (!fechaValida(contrato.fechaIngreso)) {
    errores.push({ campo: 'fechaIngreso', mensaje: 'La fecha de ingreso no es válida.' })
  }

  if (!fechaValida(contrato.fechaRetiro)) {
    errores.push({ campo: 'fechaRetiro', mensaje: 'La fecha de retiro no es válida.' })
  }

  if (
    fechaValida(contrato.fechaIngreso) &&
    fechaValida(contrato.fechaRetiro) &&
    contrato.fechaRetiro < contrato.fechaIngreso
  ) {
    errores.push({
      campo: 'fechaRetiro',
      mensaje: 'La fecha de retiro no puede ser anterior a la fecha de ingreso.',
    })
  }

  if (!contrato.salarioEsMinimo && contrato.salarioBasico <= 0) {
    errores.push({ campo: 'salarioBasico', mensaje: 'El salario básico debe ser mayor que cero.' })
  }

  if (contrato.tipo === 'fijo') {
    if (!fechaValida(contrato.fechaFinContrato)) {
      errores.push({
        campo: 'fechaFinContrato',
        mensaje: 'Para contrato a término fijo debes indicar la fecha de fin.',
      })
    } else if (
      fechaValida(contrato.fechaIngreso) &&
      contrato.fechaFinContrato < contrato.fechaIngreso
    ) {
      errores.push({
        campo: 'fechaFinContrato',
        mensaje: 'La fecha de fin no puede ser anterior a la fecha de ingreso.',
      })
    }
  }

  if (contrato.tipoSalario === 'variable' && contrato.promedioVariable < 0) {
    errores.push({
      campo: 'promedioVariable',
      mensaje: 'El promedio variable no puede ser negativo.',
    })
  }

  if (terminacion.diasVacacionesDisfrutados < 0) {
    errores.push({
      campo: 'diasVacacionesDisfrutados',
      mensaje: 'Los días de vacaciones disfrutados no pueden ser negativos.',
    })
  }

  if (terminacion.diasSalarioPendiente < 0) {
    errores.push({
      campo: 'diasSalarioPendiente',
      mensaje: 'Los días de salario pendiente no pueden ser negativos.',
    })
  }

  if (
    terminacion.cesantiasConsignadasHasta &&
    !fechaValida(terminacion.cesantiasConsignadasHasta)
  ) {
    errores.push({
      campo: 'cesantiasConsignadasHasta',
      mensaje: 'La fecha de cesantías consignadas no es válida.',
    })
  }

  if (terminacion.ultimoPagoPrima && !fechaValida(terminacion.ultimoPagoPrima)) {
    errores.push({
      campo: 'ultimoPagoPrima',
      mensaje: 'La fecha de último pago de prima no es válida.',
    })
  }

  if (terminacion.incluirSancionMora) {
    if (!fechaValida(terminacion.fechaPagoLiquidacion)) {
      errores.push({
        campo: 'fechaPagoLiquidacion',
        mensaje: 'Indica la fecha de pago para calcular la sanción por mora.',
      })
    } else if (
      fechaValida(contrato.fechaRetiro) &&
      terminacion.fechaPagoLiquidacion < contrato.fechaRetiro
    ) {
      errores.push({
        campo: 'fechaPagoLiquidacion',
        mensaje: 'La fecha de pago no puede ser anterior a la fecha de retiro.',
      })
    }
  }

  if (terminacion.otrasDeducciones < 0) {
    errores.push({
      campo: 'otrasDeducciones',
      mensaje: 'Las otras deducciones no pueden ser negativas.',
    })
  }

  if (terminacion.retencionFuente < 0) {
    errores.push({
      campo: 'retencionFuente',
      mensaje: 'La retención en la fuente no puede ser negativa.',
    })
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
