export type TipoContrato = 'indefinido' | 'fijo' | 'obra'

export type MotivoTerminacion =
  | 'renuncia'
  | 'despido_sin_justa'
  | 'despido_con_justa'
  | 'mutuo_acuerdo'
  | 'fin_plazo'
  | 'fin_obra'

export type TipoSalario = 'fijo' | 'variable' | 'integral'

export type CategoriaConcepto = 'prestacion' | 'indemnizacion' | 'salario' | 'sancion'

export interface Parametros {
  anio: number
  smmlv: number
  auxilioTransporte: number
  uvt: number
  tasaInteresCesantias: number
  diasVacacionesPorAnio: number
  topeAuxilioSmmlv: number
  salarioIntegralSmmlv: number
  fuente: string
  vigenciaDesde: string
  nota?: string
}

export interface EntradaLiquidacion {
  empleado: {
    nombre: string
    documento: string
  }
  contrato: {
    tipo: TipoContrato
    fechaIngreso: string
    fechaRetiro: string
    fechaFinContrato: string
    tipoSalario: TipoSalario
    salarioBasico: number
    promedioVariable: number
    recibeAuxilioTransporte: boolean
    salarioEsMinimo: boolean
  }
  terminacion: {
    motivo: MotivoTerminacion
    preavisoDado: boolean
    diasVacacionesDisfrutados: number
    diasSalarioPendiente: number
    cesantiasConsignadasHasta: string
    ultimoPagoPrima: string
    incluirSancionMora: boolean
    fechaPagoLiquidacion: string
    otrasDeducciones: number
    retencionFuente: number
  }
  anioParametros: number
}

export interface Concepto {
  id: string
  nombre: string
  categoria: CategoriaConcepto
  base: number
  dias: number
  formula: string
  valor: number
  norma: string
  nota?: string
  /** Desglose por periodo cuando el cálculo se segmenta (p. ej. por año). */
  detalle?: string[]
}

export interface Deduccion {
  id: string
  nombre: string
  base: number
  formula: string
  valor: number
  norma: string
  nota?: string
}

export interface ResultadoLiquidacion {
  entrada: EntradaLiquidacion
  parametros: Parametros
  diasTotales: number
  aniosEquivalentes: number
  salarioOrdinario: number
  auxilio: number
  auxilioAplica: boolean
  esIntegral: boolean
  basePrestaciones: number
  baseVacaciones: number
  elegibleIndemnizacion: boolean
  conceptos: Concepto[]
  deducciones: Deduccion[]
  totalDevengado: number
  totalDeducciones: number
  netoPagar: number
  advertencias: string[]
}

export interface ErrorValidacion {
  campo: string
  mensaje: string
}

export interface ValidacionEntrada {
  ok: boolean
  errores: ErrorValidacion[]
  advertencias: string[]
}

export interface FormularioLiquidacion {
  nombre: string
  documento: string
  anioParametros: string
  tipoContrato: TipoContrato
  fechaIngreso: string
  fechaRetiro: string
  fechaFinContrato: string
  tipoSalario: TipoSalario
  salarioBasico: string
  promedioVariable: string
  recibeAuxilioTransporte: boolean
  salarioEsMinimo: boolean
  motivo: MotivoTerminacion
  preavisoDado: boolean
  diasVacacionesDisfrutados: string
  diasSalarioPendiente: string
  cesantiasConsignadasHasta: string
  ultimoPagoPrima: string
  incluirSancionMora: boolean
  fechaPagoLiquidacion: string
  otrasDeducciones: string
  retencionFuente: string
}
