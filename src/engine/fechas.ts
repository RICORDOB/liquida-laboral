const MS_DIA = 86_400_000
const RE_ISO = /^\d{4}-\d{2}-\d{2}$/

/** Valida una fecha ISO (YYYY-MM-DD) incluyendo días reales del mes. */
export function fechaValida(fecha: string): boolean {
  if (!RE_ISO.test(fecha)) return false
  const [anio, mes, dia] = fecha.split('-').map(Number)
  const fechaUtc = new Date(Date.UTC(anio, mes - 1, dia))
  return (
    fechaUtc.getUTCFullYear() === anio &&
    fechaUtc.getUTCMonth() === mes - 1 &&
    fechaUtc.getUTCDate() === dia
  )
}

function aMs(fecha: string): number {
  const [anio, mes, dia] = fecha.split('-').map(Number)
  return Date.UTC(anio, mes - 1, dia)
}

/** Días calendario entre dos fechas, contando ambos extremos. */
export function diffDiasInclusivo(desde: string, hasta: string): number {
  return Math.round((aMs(hasta) - aMs(desde)) / MS_DIA) + 1
}

export function sumarDias(fecha: string, dias: number): string {
  const resultado = new Date(aMs(fecha) + dias * MS_DIA)
  const anio = resultado.getUTCFullYear()
  const mes = String(resultado.getUTCMonth() + 1).padStart(2, '0')
  const dia = String(resultado.getUTCDate()).padStart(2, '0')
  return `${anio}-${mes}-${dia}`
}

/** Primer día del semestre al que pertenece la fecha (1-ene o 1-jul). */
export function inicioSemestre(fecha: string): string {
  const [anio, mes] = fecha.split('-').map(Number)
  return mes <= 6 ? `${anio}-01-01` : `${anio}-07-01`
}

export function anioDe(fecha: string): number {
  return Number(fecha.slice(0, 4))
}

export function formatearFecha(fecha: string): string {
  if (!fechaValida(fecha)) return '—'
  const [anio, mes, dia] = fecha.split('-')
  return `${dia}/${mes}/${anio}`
}

export function hoyISO(): string {
  const hoy = new Date()
  const anio = hoy.getFullYear()
  const mes = String(hoy.getMonth() + 1).padStart(2, '0')
  const dia = String(hoy.getDate()).padStart(2, '0')
  return `${anio}-${mes}-${dia}`
}
