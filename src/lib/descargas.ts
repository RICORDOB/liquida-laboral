export function descargarTexto(
  nombre: string,
  texto: string,
  mime = 'text/csv;charset=utf-8',
): void {
  const blob = new Blob([`\uFEFF${texto}`], { type: mime })
  const url = URL.createObjectURL(blob)
  const enlace = document.createElement('a')
  enlace.href = url
  enlace.download = nombre
  document.body.appendChild(enlace)
  enlace.click()
  enlace.remove()
  URL.revokeObjectURL(url)
}

export function descargarJSON(nombre: string, datos: unknown): void {
  descargarTexto(nombre, JSON.stringify(datos, null, 2), 'application/json;charset=utf-8')
}

export function slugArchivo(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase()
}
