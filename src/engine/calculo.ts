import { anioDe, diffDiasInclusivo, fechaValida, inicioSemestre, sumarDias } from './fechas'
import { formatNumero } from './formato'
import { ANIOS_DISPONIBLES, getParametros } from './parametros'
import type {
  Concepto,
  Deduccion,
  EntradaLiquidacion,
  ResultadoLiquidacion,
} from './types'

const r0 = (valor: number) => Math.round(valor + 1e-9)

interface Segmento {
  anio: number
  dias: number
}

/** Divide un periodo [desde, hasta] en segmentos por año calendario. */
function diasPorAnio(desde: string, hasta: string): Segmento[] {
  const resultado: Segmento[] = []
  let cursor = desde
  while (cursor <= hasta) {
    const anio = anioDe(cursor)
    const finAnio = `${anio}-12-31`
    const hastaSegmento = finAnio < hasta ? finAnio : hasta
    resultado.push({ anio, dias: diffDiasInclusivo(cursor, hastaSegmento) })
    cursor = sumarDias(hastaSegmento, 1)
  }
  return resultado
}

/** Divide un periodo [desde, hasta] en segmentos por semestre calendario. */
function diasPorSemestre(desde: string, hasta: string): Segmento[] {
  const resultado: Segmento[] = []
  let cursor = desde
  while (cursor <= hasta) {
    const anio = anioDe(cursor)
    const mes = Number(cursor.slice(5, 7))
    const finSemestre = mes <= 6 ? `${anio}-06-30` : `${anio}-12-31`
    const hastaSegmento = finSemestre < hasta ? finSemestre : hasta
    resultado.push({ anio, dias: diffDiasInclusivo(cursor, hastaSegmento) })
    cursor = sumarDias(hastaSegmento, 1)
  }
  return resultado
}

/**
 * Calcula una liquidación laboral definitiva según el CST colombiano.
 *
 * Supuestos de la versión 1:
 * - Los días se cuentan calendario, incluyendo fecha de ingreso y de retiro.
 * - Cesantías, prima y vacaciones se calculan sobre el salario reportado
 *   (último salario o promedio variable). Si hubo cambios salariales, el
 *   usuario debe reportar el promedio del último año.
 * - Las cesantías ya consignadas y la prima ya pagada se excluyen con las
 *   fechas opcionales.
 * - La retención en la fuente se ingresa manualmente; no se calcula sola.
 */
export function calcularLiquidacion(entrada: EntradaLiquidacion): ResultadoLiquidacion {
  const { contrato, terminacion } = entrada
  const parametros = getParametros(entrada.anioParametros)
  const advertencias: string[] = []

  if (!fechaValida(contrato.fechaIngreso) || !fechaValida(contrato.fechaRetiro)) {
    throw new Error('Las fechas de ingreso y retiro deben ser válidas (YYYY-MM-DD).')
  }

  const diasTotales = diffDiasInclusivo(contrato.fechaIngreso, contrato.fechaRetiro)
  if (diasTotales <= 0) {
    throw new Error('La fecha de retiro debe ser posterior o igual a la fecha de ingreso.')
  }

  if (parametros.anio !== entrada.anioParametros) {
    advertencias.push(
      `No hay parámetros cargados para ${entrada.anioParametros}. Se usaron los de ${parametros.anio}.`,
    )
  }

  const aniosEquivalentes = diasTotales / 360
  const salarioEsMinimo = contrato.salarioEsMinimo
  const esIntegral = contrato.tipoSalario === 'integral' && !salarioEsMinimo

  const anioRetiro = anioDe(contrato.fechaRetiro)
  const parametrosRetiro = getParametros(anioRetiro)

  // Salario ordinario "final": el vigente al momento del retiro. Es la base de
  // vacaciones, indemnización y salarios pendientes. En salario mínimo se usa el
  // SMMLV del año de retiro; las prestaciones se segmentan por año/semestre.
  const salarioVariable =
    contrato.tipoSalario === 'variable' && !salarioEsMinimo
      ? Math.max(0, contrato.promedioVariable)
      : 0
  const salarioOrdinario = salarioEsMinimo
    ? parametrosRetiro.smmlv
    : Math.max(0, contrato.salarioBasico) + salarioVariable

  if (salarioEsMinimo && contrato.tipoSalario === 'integral') {
    advertencias.push(
      'No puedes combinar salario mínimo con salario integral. Se liquidó como salario mínimo.',
    )
  }

  if (!salarioEsMinimo && salarioOrdinario <= 0) {
    throw new Error('El salario debe ser mayor que cero.')
  }

  if (!salarioEsMinimo && salarioOrdinario < parametros.smmlv) {
    advertencias.push(
      `El salario ingresado (${formatNumero(salarioOrdinario)}) está por debajo del SMMLV ${parametros.anio}. Verifica el dato.`,
    )
  }

  if (
    esIntegral &&
    salarioOrdinario < parametros.smmlv * parametros.salarioIntegralSmmlv
  ) {
    advertencias.push(
      `El salario integral debe ser al menos ${parametros.salarioIntegralSmmlv} SMMLV (${formatNumero(
        parametros.smmlv * parametros.salarioIntegralSmmlv,
      )}). El valor ingresado no cumple ese mínimo; revisa el contrato.`,
    )
  }

  if (
    contrato.tipoSalario === 'variable' &&
    !salarioEsMinimo &&
    contrato.promedioVariable <= 0
  ) {
    advertencias.push(
      'Marcaste salario variable pero no ingresaste el promedio mensual de variables. Se usará solo el salario básico.',
    )
  }

  // Auxilio de transporte: en salario mínimo siempre aplica (SMMLV <= 2 SMMLV).
  const auxilioAplica = salarioEsMinimo
    ? true
    : contrato.recibeAuxilioTransporte &&
      salarioOrdinario <= parametros.smmlv * parametros.topeAuxilioSmmlv
  const auxilio = auxilioAplica
    ? salarioEsMinimo
      ? parametrosRetiro.auxilioTransporte
      : parametros.auxilioTransporte
    : 0

  if (!salarioEsMinimo && contrato.recibeAuxilioTransporte && !auxilioAplica) {
    advertencias.push(
      `El auxilio de transporte solo aplica hasta ${parametros.topeAuxilioSmmlv} SMMLV (${formatNumero(
        parametros.smmlv * parametros.topeAuxilioSmmlv,
      )}). No se incluyó en la base.`,
    )
  }

  if (esIntegral) {
    advertencias.push(
      'Salario integral: las cesantías, intereses y prima están incluidos en el factor prestacional. Solo se liquidan vacaciones, salario pendiente e indemnización.',
    )
  }

  if (salarioEsMinimo) {
    advertencias.push(
      'Salario mínimo: las prestaciones se liquidan por año y semestre con el SMMLV y el auxilio vigentes en cada periodo.',
    )

    const anioMinimo = Math.min(...ANIOS_DISPONIBLES)
    const anioIngreso = anioDe(contrato.fechaIngreso)
    if (anioIngreso < anioMinimo) {
      advertencias.push(
        `Solo hay parámetros desde ${anioMinimo}. Los periodos anteriores a ${anioMinimo} se liquidan con el SMMLV de ${anioMinimo}.`,
      )
    }
  }

  const basePrestaciones = esIntegral ? 0 : salarioOrdinario + auxilio
  const baseVacaciones = salarioOrdinario

  const conceptos: Concepto[] = []
  const deducciones: Deduccion[] = []

  // ---------------------------------------------------------------------------
  // Cesantías e intereses
  // ---------------------------------------------------------------------------
  let desdeCesantias = contrato.fechaIngreso
  let diasCesantias = diasTotales

  if (terminacion.cesantiasConsignadasHasta) {
    if (!fechaValida(terminacion.cesantiasConsignadasHasta)) {
      advertencias.push('La fecha de cesantías consignadas no es válida; se liquidó todo el periodo.')
    } else if (terminacion.cesantiasConsignadasHasta >= contrato.fechaRetiro) {
      diasCesantias = 0
      advertencias.push(
        'Las cesantías ya estaban consignadas hasta la fecha de retiro; no hay cesantías pendientes.',
      )
    } else {
      desdeCesantias = sumarDias(terminacion.cesantiasConsignadasHasta, 1)
      diasCesantias = diffDiasInclusivo(desdeCesantias, contrato.fechaRetiro)
    }
  }

  let cesantias = 0
  let intereses = 0
  const detalleCesantias: string[] = []

  if (!esIntegral && diasCesantias > 0) {
    if (salarioEsMinimo) {
      for (const segmento of diasPorAnio(desdeCesantias, contrato.fechaRetiro)) {
        const p = getParametros(segmento.anio)
        const base = p.smmlv + p.auxilioTransporte
        const ces = r0((base * segmento.dias) / 360)
        const int = r0((ces * segmento.dias * p.tasaInteresCesantias) / 360)
        cesantias += ces
        intereses += int
        detalleCesantias.push(
          `${segmento.anio}: (${formatNumero(p.smmlv)} + ${formatNumero(p.auxilioTransporte)}) × ${segmento.dias} días = ${formatNumero(ces)}`,
        )
      }
    } else {
      cesantias = r0((basePrestaciones * diasCesantias) / 360)
      intereses = r0((cesantias * diasCesantias * parametros.tasaInteresCesantias) / 360)
    }
  }

  if (!esIntegral) {
    conceptos.push({
      id: 'cesantias',
      nombre: 'Cesantías',
      categoria: 'prestacion',
      base: basePrestaciones,
      dias: diasCesantias,
      formula: salarioEsMinimo
        ? 'Σ por año (SMMLV + auxilio vigentes) × días / 360'
        : `(${formatNumero(basePrestaciones)} × ${diasCesantias}) / 360`,
      valor: cesantias,
      norma: 'Art. 249 CST; Ley 50 de 1990',
      nota: auxilioAplica
        ? 'Incluye el auxilio de transporte en la base, conforme a la práctica laboral.'
        : undefined,
      detalle: salarioEsMinimo ? detalleCesantias : undefined,
    })

    conceptos.push({
      id: 'intereses_cesantias',
      nombre: 'Intereses sobre cesantías',
      categoria: 'prestacion',
      base: cesantias,
      dias: diasCesantias,
      formula: salarioEsMinimo
        ? 'Σ por año (cesantías × días × 12%) / 360'
        : `(${formatNumero(cesantias)} × ${diasCesantias} × 12%) / 360`,
      valor: intereses,
      norma: 'Ley 52 de 1975; Art. 99 Ley 50 de 1990',
    })
  }

  // ---------------------------------------------------------------------------
  // Prima de servicios
  // ---------------------------------------------------------------------------
  const maxFecha = (a: string, b: string) => (a > b ? a : b)
  let desdePrima = maxFecha(inicioSemestre(contrato.fechaRetiro), contrato.fechaIngreso)

  if (terminacion.ultimoPagoPrima) {
    if (fechaValida(terminacion.ultimoPagoPrima)) {
      desdePrima = maxFecha(
        sumarDias(terminacion.ultimoPagoPrima, 1),
        contrato.fechaIngreso,
      )
    } else {
      advertencias.push(
        'La fecha de último pago de prima no es válida; se usó el inicio del semestre.',
      )
    }
  }

  const diasPrima = Math.max(0, diffDiasInclusivo(desdePrima, contrato.fechaRetiro))

  let prima = 0
  const detallePrima: string[] = []

  if (!esIntegral && diasPrima > 0) {
    if (salarioEsMinimo) {
      for (const segmento of diasPorSemestre(desdePrima, contrato.fechaRetiro)) {
        const p = getParametros(segmento.anio)
        const base = p.smmlv + p.auxilioTransporte
        const valor = r0((base * segmento.dias) / 360)
        prima += valor
        detallePrima.push(
          `${segmento.anio}: (${formatNumero(p.smmlv)} + ${formatNumero(p.auxilioTransporte)}) × ${segmento.dias} días = ${formatNumero(valor)}`,
        )
      }
    } else {
      prima = r0((basePrestaciones * diasPrima) / 360)
    }
  }

  if (terminacion.ultimoPagoPrima && terminacion.ultimoPagoPrima >= contrato.fechaRetiro) {
    advertencias.push(
      'La prima ya estaba pagada hasta la fecha de retiro; no hay prima pendiente.',
    )
  }

  if (!esIntegral) {
    conceptos.push({
      id: 'prima',
      nombre: 'Prima de servicios',
      categoria: 'prestacion',
      base: basePrestaciones,
      dias: diasPrima,
      formula: salarioEsMinimo
        ? 'Σ por semestre (SMMLV + auxilio vigentes) × días / 360'
        : `(${formatNumero(basePrestaciones)} × ${diasPrima}) / 360`,
      valor: prima,
      norma: 'Arts. 306 a 308 CST',
      nota: terminacion.ultimoPagoPrima
        ? `Periodo causado desde ${terminacion.ultimoPagoPrima} (exclusivo).`
        : 'Periodo causado desde el inicio del semestre actual.',
      detalle: salarioEsMinimo ? detallePrima : undefined,
    })
  }

  // ---------------------------------------------------------------------------
  // Vacaciones
  // ---------------------------------------------------------------------------
  const diasVacacionesCausados =
    (parametros.diasVacacionesPorAnio * diasTotales) / 360
  const diasVacacionesDisfrutados = Math.max(0, terminacion.diasVacacionesDisfrutados)
  const diasVacacionesPendientes = Math.max(
    0,
    diasVacacionesCausados - diasVacacionesDisfrutados,
  )

  if (diasVacacionesDisfrutados > diasVacacionesCausados) {
    advertencias.push(
      'Los días de vacaciones disfrutados superan los causados. Se liquidaron cero días pendientes.',
    )
  }

  const vacaciones = r0((baseVacaciones / 30) * diasVacacionesPendientes)
  conceptos.push({
    id: 'vacaciones',
    nombre: 'Vacaciones causadas y no disfrutadas',
    categoria: 'prestacion',
    base: baseVacaciones,
    dias: Number(diasVacacionesPendientes.toFixed(2)),
    formula: `(${formatNumero(baseVacaciones)} / 30) × ${Number(
      diasVacacionesPendientes.toFixed(2),
    )}`,
    valor: vacaciones,
    norma: 'Arts. 186 a 192 CST',
    nota: 'La base de vacaciones no incluye el auxilio de transporte.',
  })

  // ---------------------------------------------------------------------------
  // Indemnización por despido sin justa causa
  // ---------------------------------------------------------------------------
  const esDespidoSinJusta = terminacion.motivo === 'despido_sin_justa'
  let diasIndemnizacion = 0
  let notaIndemnizacion: string | undefined

  if (esDespidoSinJusta) {
    if (contrato.tipo === 'indefinido') {
      const limite10 = parametros.smmlv * 10
      const baseDias = salarioOrdinario < limite10 ? 30 : 20
      const incremento = salarioOrdinario < limite10 ? 20 : 15

      diasIndemnizacion =
        aniosEquivalentes >= 1
          ? baseDias + incremento * (aniosEquivalentes - 1)
          : baseDias * aniosEquivalentes

      notaIndemnizacion =
        salarioOrdinario < limite10
          ? 'Salario inferior a 10 SMMLV: 30 días por el primer año y 20 por cada año adicional, proporcional por fracción.'
          : 'Salario igual o superior a 10 SMMLV: 20 días por el primer año y 15 por cada año adicional, proporcional por fracción.'
    } else if (contrato.tipo === 'fijo') {
      let diasRestantes = 0
      if (contrato.fechaFinContrato && fechaValida(contrato.fechaFinContrato)) {
        diasRestantes = Math.max(
          0,
          diffDiasInclusivo(contrato.fechaRetiro, contrato.fechaFinContrato) - 1,
        )
      } else {
        advertencias.push(
          'No ingresaste la fecha de fin del contrato a término fijo. Se usó el mínimo legal de 15 días.',
        )
      }
      diasIndemnizacion = Math.max(15, diasRestantes)
      notaIndemnizacion =
        'Contrato a término fijo: salarios del tiempo que faltaba para el vencimiento, con mínimo de 15 días.'
    } else {
      diasIndemnizacion = 15
      notaIndemnizacion =
        'Contrato por obra o labor: se usa el mínimo legal de 15 días. Si conoces el tiempo restante de la obra, el valor puede ser mayor.'
      advertencias.push(
        'Para contrato por obra o labor se liquidó el mínimo legal de 15 días. Verifica el tiempo restante de la obra.',
      )
    }

    const valorIndemnizacion = r0((salarioOrdinario / 30) * diasIndemnizacion)
    conceptos.push({
      id: 'indemnizacion',
      nombre: 'Indemnización por despido sin justa causa',
      categoria: 'indemnizacion',
      base: salarioOrdinario,
      dias: Number(diasIndemnizacion.toFixed(2)),
      formula: `(${formatNumero(salarioOrdinario)} / 30) × ${Number(
        diasIndemnizacion.toFixed(2),
      )}`,
      valor: valorIndemnizacion,
      norma: 'Art. 64 CST; Ley 789 de 2002',
      nota: notaIndemnizacion,
    })
  } else if (terminacion.motivo === 'despido_con_justa') {
    advertencias.push('No hay indemnización por despido con justa causa.')
  } else if (terminacion.motivo === 'fin_plazo' && contrato.tipo !== 'fijo') {
    advertencias.push('El motivo "fin de plazo" no corresponde a un contrato a término fijo.')
  } else if (terminacion.motivo === 'fin_obra' && contrato.tipo !== 'obra') {
    advertencias.push('El motivo "fin de obra" no corresponde a un contrato por obra o labor.')
  }

  // ---------------------------------------------------------------------------
  // Preaviso (solo contrato indefinido y despido sin justa causa)
  // ---------------------------------------------------------------------------
  if (
    esDespidoSinJusta &&
    contrato.tipo === 'indefinido' &&
    !terminacion.preavisoDado
  ) {
    conceptos.push({
      id: 'preaviso',
      nombre: 'Indemnización por falta de preaviso',
      categoria: 'indemnizacion',
      base: salarioOrdinario,
      dias: 30,
      formula: `(${formatNumero(salarioOrdinario)} / 30) × 30`,
      valor: r0(salarioOrdinario),
      norma: 'Art. 46 CST',
      nota: 'El empleador debe avisar con 30 días de antelación; si no lo hizo, paga el salario del periodo.',
    })
  }

  // ---------------------------------------------------------------------------
  // Salario y auxilio pendientes
  // ---------------------------------------------------------------------------
  const diasSalarioPendiente = Math.max(0, terminacion.diasSalarioPendiente)
  let salarioPendiente = 0

  if (diasSalarioPendiente > 0) {
    salarioPendiente = r0((salarioOrdinario / 30) * diasSalarioPendiente)
    conceptos.push({
      id: 'salario_pendiente',
      nombre: 'Salario pendiente',
      categoria: 'salario',
      base: salarioOrdinario,
      dias: diasSalarioPendiente,
      formula: `(${formatNumero(salarioOrdinario)} / 30) × ${diasSalarioPendiente}`,
      valor: salarioPendiente,
      norma: 'Art. 127 CST',
    })

    if (auxilioAplica) {
      conceptos.push({
        id: 'auxilio_pendiente',
        nombre: 'Auxilio de transporte pendiente',
        categoria: 'salario',
        base: auxilio,
        dias: diasSalarioPendiente,
        formula: `(${formatNumero(auxilio)} / 30) × ${diasSalarioPendiente}`,
        valor: r0((auxilio / 30) * diasSalarioPendiente),
        norma: 'Ley 15 de 1959; Art. 128 CST',
        nota: 'No es salario y no tiene deducciones de seguridad social.',
      })
    }
  }

  // ---------------------------------------------------------------------------
  // Sanción por mora (opcional)
  // ---------------------------------------------------------------------------
  if (
    terminacion.incluirSancionMora &&
    terminacion.fechaPagoLiquidacion &&
    fechaValida(terminacion.fechaPagoLiquidacion)
  ) {
    const diasMoraReal = Math.max(
      0,
      diffDiasInclusivo(contrato.fechaRetiro, terminacion.fechaPagoLiquidacion) - 1,
    )
    const diasMora = Math.min(720, diasMoraReal)

    if (diasMoraReal > 720) {
      advertencias.push(
        'La sanción por mora se limitó a 24 meses (720 días), conforme al Art. 65 CST.',
      )
    }

    if (diasMora > 0) {
      conceptos.push({
        id: 'sancion_mora',
        nombre: 'Sanción por mora en el pago de la liquidación',
        categoria: 'sancion',
        base: salarioOrdinario,
        dias: diasMora,
        formula: `(${formatNumero(salarioOrdinario)} / 30) × ${diasMora}`,
        valor: r0((salarioOrdinario / 30) * diasMora),
        norma: 'Art. 65 CST; Ley 789 de 2002',
        nota: 'Estimación. Procede si la liquidación no se pagó al terminar el contrato; puede incluir indexación.',
      })
    }
  }

  // ---------------------------------------------------------------------------
  // Deducciones
  // ---------------------------------------------------------------------------
  const baseAportes = salarioPendiente
  const salud = r0(baseAportes * 0.04)
  const pension = r0(baseAportes * 0.04)
  const fsp =
    salarioOrdinario >= parametros.smmlv * 4 ? r0(baseAportes * 0.01) : 0

  if (salud > 0) {
    deducciones.push({
      id: 'salud',
      nombre: 'Aporte a salud (empleado)',
      base: baseAportes,
      formula: `${formatNumero(baseAportes)} × 4%`,
      valor: salud,
      norma: 'Ley 100 de 1993',
    })
  }

  if (pension > 0) {
    deducciones.push({
      id: 'pension',
      nombre: 'Aporte a pensión (empleado)',
      base: baseAportes,
      formula: `${formatNumero(baseAportes)} × 4%`,
      valor: pension,
      norma: 'Ley 100 de 1993',
    })
  }

  if (fsp > 0) {
    deducciones.push({
      id: 'fsp',
      nombre: 'Fondo de Solidaridad Pensional',
      base: baseAportes,
      formula: `${formatNumero(baseAportes)} × 1%`,
      valor: fsp,
      norma: 'Art. 27 Ley 100 de 1993',
      nota: 'Aproximado. La tarifa exacta depende del rango salarial.',
    })
  }

  const retencion = Math.max(0, terminacion.retencionFuente)
  if (retencion > 0) {
    deducciones.push({
      id: 'retencion',
      nombre: 'Retención en la fuente',
      base: retencion,
      formula: 'Valor ingresado manualmente',
      valor: retencion,
      norma: 'Art. 383 ET',
      nota: 'No se calcula automáticamente. Verifica con tu contador.',
    })
  }

  const otras = Math.max(0, terminacion.otrasDeducciones)
  if (otras > 0) {
    deducciones.push({
      id: 'otras',
      nombre: 'Otras deducciones',
      base: otras,
      formula: 'Valor ingresado manualmente',
      valor: otras,
      norma: 'Autorización o título válido',
      nota: 'Préstamos, libranzas, embargos u otras deducciones autorizadas.',
    })
  }

  const totalDevengado = conceptos.reduce((total, concepto) => total + concepto.valor, 0)
  const totalDeducciones = deducciones.reduce((total, deduccion) => total + deduccion.valor, 0)
  const netoPagar = totalDevengado - totalDeducciones

  if (netoPagar < 0) {
    advertencias.push(
      'Las deducciones superan los devengos. Revisa los valores antes de pagar.',
    )
  }

  if (diasTotales < 30) {
    advertencias.push(
      'La relación laboral es menor a 30 días. Revisa la proporcionalidad de cada concepto.',
    )
  }

  return {
    entrada,
    parametros,
    diasTotales,
    aniosEquivalentes,
    salarioOrdinario,
    auxilio,
    auxilioAplica,
    esIntegral,
    basePrestaciones,
    baseVacaciones,
    elegibleIndemnizacion: esDespidoSinJusta,
    conceptos: conceptos,
    deducciones,
    totalDevengado,
    totalDeducciones,
    netoPagar,
    advertencias,
  }
}

export const ADVERTENCIA_GENERAL =
  'Herramienta de estimación. No cubre sector público, cesantías retroactivas anteriores a 1990, convenciones colectivas, salarios en especie ni casos con reglas especiales. Verifica el resultado con un contador o abogado laboralista antes de pagar.'
