const formatoCOP = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
})

const formatoNumero = new Intl.NumberFormat('es-CO', {
  maximumFractionDigits: 2,
})

export function formatCOP(valor: number): string {
  return formatoCOP.format(Math.round(valor))
}

export function formatNumero(valor: number): string {
  return formatoNumero.format(valor)
}

export function formatDias(valor: number): string {
  return formatoNumero.format(Number(valor.toFixed(2)))
}
