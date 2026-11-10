import type {
  EntradaLiquidacion,
  FormularioLiquidacion,
  ResultadoLiquidacion,
} from '../engine/types'

export interface CasoGuardado {
  id: string
  creadoEn: string
  titulo: string
  entrada: EntradaLiquidacion
  resultado: ResultadoLiquidacion
}

const CLAVE_CASOS = 'liquida-laboral:casos:v1'
const CLAVE_BORRADOR = 'liquida-laboral:borrador:v1'

function almacenamientoDisponible(): boolean {
  try {
    const prueba = '__liquida_laboral_prueba__'
    window.localStorage.setItem(prueba, '1')
    window.localStorage.removeItem(prueba)
    return true
  } catch {
    return false
  }
}

function sesionDisponible(): boolean {
  try {
    const prueba = '__liquida_laboral_prueba__'
    window.sessionStorage.setItem(prueba, '1')
    window.sessionStorage.removeItem(prueba)
    return true
  } catch {
    return false
  }
}

export function nuevoId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `caso-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export function listarCasos(): CasoGuardado[] {
  if (!almacenamientoDisponible()) return []

  try {
    const crudo = window.localStorage.getItem(CLAVE_CASOS)
    if (!crudo) return []
    const datos = JSON.parse(crudo) as unknown
    if (!Array.isArray(datos)) return []
    return datos.filter(esCasoGuardado)
  } catch {
    return []
  }
}

function esCasoGuardado(valor: unknown): valor is CasoGuardado {
  if (!valor || typeof valor !== 'object') return false
  const caso = valor as Partial<CasoGuardado>
  return (
    typeof caso.id === 'string' &&
    typeof caso.creadoEn === 'string' &&
    typeof caso.titulo === 'string' &&
    !!caso.entrada &&
    !!caso.resultado &&
    typeof caso.resultado.netoPagar === 'number'
  )
}

function persistirCasos(casos: CasoGuardado[]): void {
  if (!almacenamientoDisponible()) return
  window.localStorage.setItem(CLAVE_CASOS, JSON.stringify(casos))
}

export function guardarCaso(caso: CasoGuardado): CasoGuardado[] {
  const casos = [caso, ...listarCasos().filter((item) => item.id !== caso.id)]
  persistirCasos(casos)
  return casos
}

export function eliminarCaso(id: string): CasoGuardado[] {
  const casos = listarCasos().filter((item) => item.id !== id)
  persistirCasos(casos)
  return casos
}

export function limpiarCasos(): void {
  if (!almacenamientoDisponible()) return
  window.localStorage.removeItem(CLAVE_CASOS)
}

export function exportarCasosJSON(casos: CasoGuardado[]): string {
  return JSON.stringify(
    {
      app: 'liquida-laboral',
      version: 1,
      exportadoEn: new Date().toISOString(),
      casos,
    },
    null,
    2,
  )
}

export function importarCasosJSON(texto: string): {
  casos: CasoGuardado[]
  importados: number
  error?: string
} {
  try {
    const datos = JSON.parse(texto) as unknown
    const lista =
      Array.isArray(datos)
        ? datos
        : datos && typeof datos === 'object' && 'casos' in datos
          ? (datos as { casos: unknown }).casos
          : null

    if (!Array.isArray(lista)) {
      return { casos: listarCasos(), importados: 0, error: 'El archivo no tiene una lista de casos válida.' }
    }

    const validos = lista.filter(esCasoGuardado)
    const actuales = listarCasos()
    const mapa = new Map(actuales.map((caso) => [caso.id, caso]))
    validos.forEach((caso) => mapa.set(caso.id, caso))
    const casos = [...mapa.values()].sort((a, b) => b.creadoEn.localeCompare(a.creadoEn))
    persistirCasos(casos)

    return { casos, importados: validos.length }
  } catch {
    return { casos: listarCasos(), importados: 0, error: 'No se pudo leer el archivo JSON.' }
  }
}

export function cargarBorrador(): FormularioLiquidacion | null {
  if (!sesionDisponible()) return null
  try {
    const crudo = window.sessionStorage.getItem(CLAVE_BORRADOR)
    if (!crudo) return null
    return JSON.parse(crudo) as FormularioLiquidacion
  } catch {
    return null
  }
}

export function guardarBorrador(formulario: FormularioLiquidacion): void {
  if (!sesionDisponible()) return
  window.sessionStorage.setItem(CLAVE_BORRADOR, JSON.stringify(formulario))
}

export function borrarBorrador(): void {
  if (!sesionDisponible()) return
  window.sessionStorage.removeItem(CLAVE_BORRADOR)
}
