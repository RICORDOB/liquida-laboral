import { diffDiasInclusivo, fechaValida, inicioSemestre, sumarDias } from './fechas'
import { formatNumero } from './formato'
import { getParametros } from './parametros'
import type {
  Concepto,
  Deduccion,
  EntradaLiquidacion,
  ResultadoLiquidacion,
} from './types'

const r0 = (valor: number) => Math.round(valor + 1e-9)

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
  const salarioVariable =
    contrato.tipoSalario === 'variable' ? Math.max(0, contrato.promedioVariable) : 0
  const salarioOrdinario = Math.max(0, contrato.salarioBasico) + salarioVariable
  const esIntegral = contrato.tipoSalario === 'integral'

  if (salarioOrdinario <= 0) {
    throw new Error('El salario debe ser mayor que cero.')
  }

  if (salarioOrdinario < parametros.smmlv) {
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

  if (contrato.tipoSalario === 'variable' && contrato.promedioVariable <= 0) {
    advertencias.push(
      'Marcaste salario variable pero no ingresaste el promedio mensual de variables. Se usará solo el salario básico.',
    )
  }

  const auxilioAplica =
    contrato.recibeAuxilioTransporte &&
    salarioOrdinario <= parametros.smmlv * parametros.topeAuxilioSmmlv
  const auxilio = auxilioAplica ? parametros.auxilioTransporte : 0

  if (contrato.recibeAuxilioTransporte && !auxilioAplica) {
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

  const basePrestaciones = esIntegral ? 0 : salarioOrdinario + auxilio
  const baseVacaciones = salarioOrdinario

  const conceptos: Concepto[] = []
  const deducciones: Deduccion[] = []

  // ---------------------------------------------------------------------------
  // Cesantías e intereses
  // ---------------------------------------------------------------------------
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
      diasCesantias = Math.max(
        0,
        diffDiasInclusivo(
          sumarDias(terminacion.cesantiasConsignadasHasta, 1),
          contrato.fechaRetiro,
        ),
      )
    }
  }

  const cesantias = esIntegral ? 0 : r0((basePrestaciones * diasCesantias) / 360)
  const intereses = esIntegral
    ? 0
    : r0((cesantias * diasCesantias * parametros.tasaInteresCesantias) / 360)

  if (!esIntegral) {
    conceptos.push({
      id: 'cesantias',
      nombre: 'Cesantías',
      categoria: 'prestacion',
      base: basePrestaciones,
      dias: diasCesantias,
      formula: `(${formatNumero(basePrestaciones)} × ${diasCesantias}) / 360`,
      valor: cesantias,
      norma: 'Art. 249 CST; Ley 50 de 1990',
      nota: auxilioAplica
        ? 'Incluye el auxilio de transporte en la base, conforme a la práctica laboral.'
        : undefined,
    })

    conceptos.push({
      id: 'intereses_cesantias',
      nombre: 'Intereses sobre cesantías',
      categoria: 'prestacion',
      base: cesantias,
      dias: diasCesantias,
      formula: `(${formatNumero(cesantias)} × ${diasCesantias} × 12%) / 360`,
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
  const prima = esIntegral ? 0 : r0((basePrestaciones * diasPrima) / 360)

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
      formula: `(${formatNumero(basePrestaciones)} × ${diasPrima}) / 360`,
      valor: prima,
      norma: 'Arts. 306 a 308 CST',
      nota: terminacion.ultimoPagoPrima
        ? `Periodo causado desde ${terminacion.ultimoPagoPrima} (exclusivo).`
        : 'Periodo causado desde el inicio del semestre actual.',
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
