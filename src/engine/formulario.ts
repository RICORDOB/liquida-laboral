import { hoyISO } from './fechas'
import { anioVigente } from './parametros'
import type { EntradaLiquidacion, FormularioLiquidacion } from './types'

export const FORMULARIO_INICIAL: FormularioLiquidacion = {
  nombre: '',
  documento: '',
  anioParametros: String(anioVigente()),
  tipoContrato: 'indefinido',
  fechaIngreso: '',
  fechaRetiro: hoyISO(),
  fechaFinContrato: '',
  tipoSalario: 'fijo',
  salarioBasico: '',
  promedioVariable: '',
  recibeAuxilioTransporte: true,
  salarioEsMinimo: false,
  motivo: 'renuncia',
  preavisoDado: true,
  diasVacacionesDisfrutados: '0',
  diasSalarioPendiente: '0',
  cesantiasConsignadasHasta: '',
  ultimoPagoPrima: '',
  incluirSancionMora: false,
  fechaPagoLiquidacion: '',
  otrasDeducciones: '0',
  retencionFuente: '0',
}

function aNumeroMoneda(valor: string): number {
  const limpio = valor.replace(/[^\d-]/g, '')
  const numero = Number(limpio)
  return Number.isFinite(numero) ? numero : 0
}

function aNumeroDecimal(valor: string): number {
  const numero = Number(valor.replace(',', '.'))
  return Number.isFinite(numero) ? numero : 0
}

export function aEntrada(
  formulario: FormularioLiquidacion,
  anioParametros: number = anioVigente(),
): EntradaLiquidacion {
  const anio = Number(formulario.anioParametros) || anioParametros

  return {
    empleado: {
      nombre: formulario.nombre.trim(),
      documento: formulario.documento.trim(),
    },
    contrato: {
      tipo: formulario.tipoContrato,
      fechaIngreso: formulario.fechaIngreso,
      fechaRetiro: formulario.fechaRetiro,
      fechaFinContrato: formulario.fechaFinContrato,
      tipoSalario: formulario.tipoSalario,
      salarioBasico: aNumeroMoneda(formulario.salarioBasico),
      promedioVariable: aNumeroMoneda(formulario.promedioVariable),
      recibeAuxilioTransporte: formulario.recibeAuxilioTransporte,
      salarioEsMinimo: formulario.salarioEsMinimo,
    },
    terminacion: {
      motivo: formulario.motivo,
      preavisoDado: formulario.preavisoDado,
      diasVacacionesDisfrutados: aNumeroDecimal(formulario.diasVacacionesDisfrutados),
      diasSalarioPendiente: aNumeroDecimal(formulario.diasSalarioPendiente),
      cesantiasConsignadasHasta: formulario.cesantiasConsignadasHasta,
      ultimoPagoPrima: formulario.ultimoPagoPrima,
      incluirSancionMora: formulario.incluirSancionMora,
      fechaPagoLiquidacion: formulario.fechaPagoLiquidacion,
      otrasDeducciones: aNumeroMoneda(formulario.otrasDeducciones),
      retencionFuente: aNumeroMoneda(formulario.retencionFuente),
    },
    anioParametros: anio,
  }
}

export function formularioDesdeEntrada(entrada: EntradaLiquidacion): FormularioLiquidacion {
  return {
    nombre: entrada.empleado.nombre,
    documento: entrada.empleado.documento,
    anioParametros: String(entrada.anioParametros),
    tipoContrato: entrada.contrato.tipo,
    fechaIngreso: entrada.contrato.fechaIngreso,
    fechaRetiro: entrada.contrato.fechaRetiro,
    fechaFinContrato: entrada.contrato.fechaFinContrato,
    tipoSalario: entrada.contrato.tipoSalario,
    salarioBasico: String(entrada.contrato.salarioBasico),
    promedioVariable: String(entrada.contrato.promedioVariable),
    recibeAuxilioTransporte: entrada.contrato.recibeAuxilioTransporte,
    salarioEsMinimo: entrada.contrato.salarioEsMinimo,
    motivo: entrada.terminacion.motivo,
    preavisoDado: entrada.terminacion.preavisoDado,
    diasVacacionesDisfrutados: String(entrada.terminacion.diasVacacionesDisfrutados),
    diasSalarioPendiente: String(entrada.terminacion.diasSalarioPendiente),
    cesantiasConsignadasHasta: entrada.terminacion.cesantiasConsignadasHasta,
    ultimoPagoPrima: entrada.terminacion.ultimoPagoPrima,
    incluirSancionMora: entrada.terminacion.incluirSancionMora,
    fechaPagoLiquidacion: entrada.terminacion.fechaPagoLiquidacion,
    otrasDeducciones: String(entrada.terminacion.otrasDeducciones),
    retencionFuente: String(entrada.terminacion.retencionFuente),
  }
}
