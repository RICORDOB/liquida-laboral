export interface DatosEmpresa {
  razonSocial: string
  nit: string
  ciudad: string
  direccion: string
  telefono: string
  correo: string
  /** Logo en data URL (PNG) o cadena vacía. */
  logo: string
}

export const EMPRESA_VACIA: DatosEmpresa = {
  razonSocial: '',
  nit: '',
  ciudad: '',
  direccion: '',
  telefono: '',
  correo: '',
  logo: '',
}

const CLAVE = 'liquida-laboral:empresa:v1'
const MAX_LADO_LOGO = 512
const TIPOS_PERMITIDOS = ['image/png', 'image/jpeg', 'image/webp']

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

export function cargarDatosEmpresa(): DatosEmpresa {
  if (!almacenamientoDisponible()) return { ...EMPRESA_VACIA }
  try {
    const crudo = window.localStorage.getItem(CLAVE)
    if (!crudo) return { ...EMPRESA_VACIA }
    const datos = JSON.parse(crudo) as Partial<DatosEmpresa>
    return { ...EMPRESA_VACIA, ...datos }
  } catch {
    return { ...EMPRESA_VACIA }
  }
}

export function guardarDatosEmpresa(datos: DatosEmpresa): void {
  if (!almacenamientoDisponible()) return
  try {
    window.localStorage.setItem(CLAVE, JSON.stringify(datos))
  } catch {
    // Si el logo supera la cuota de almacenamiento, se ignora silenciosamente.
  }
}

export function hayDatosEmpresa(datos: DatosEmpresa): boolean {
  return Boolean(
    datos.razonSocial.trim() ||
      datos.nit.trim() ||
      datos.ciudad.trim() ||
      datos.direccion.trim() ||
      datos.telefono.trim() ||
      datos.correo.trim() ||
      datos.logo,
  )
}

/**
 * Convierte un archivo de imagen a un data URL PNG redimensionado para que quepa
 * en el PDF y en `localStorage`. Rechaza formatos no admitidos (y SVG, que no
 * soporta el generador de PDF).
 */
export async function archivoALogoDataURL(archivo: File): Promise<string> {
  if (!TIPOS_PERMITIDOS.includes(archivo.type)) {
    throw new Error('Usa una imagen PNG, JPG o WebP.')
  }
  const dataUrl = await leerComoDataURL(archivo)
  const imagen = await cargarImagen(dataUrl)
  const { width, height } = escalar(imagen.naturalWidth, imagen.naturalHeight, MAX_LADO_LOGO)
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const contexto = canvas.getContext('2d')
  if (!contexto) throw new Error('No se pudo procesar la imagen.')
  contexto.drawImage(imagen, 0, 0, width, height)
  return canvas.toDataURL('image/png')
}

function leerComoDataURL(archivo: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const lector = new FileReader()
    lector.onload = () => resolve(lector.result as string)
    lector.onerror = () => reject(new Error('No se pudo leer el archivo.'))
    lector.readAsDataURL(archivo)
  })
}

function cargarImagen(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const imagen = new Image()
    imagen.onload = () => resolve(imagen)
    imagen.onerror = () => reject(new Error('No se pudo cargar la imagen.'))
    imagen.src = dataUrl
  })
}

function escalar(
  ancho: number,
  alto: number,
  maximo: number,
): { width: number; height: number } {
  const mayor = Math.max(ancho, alto)
  if (mayor <= maximo) return { width: ancho, height: alto }
  const factor = maximo / mayor
  return { width: Math.round(ancho * factor), height: Math.round(alto * factor) }
}
