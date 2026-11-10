import type { ReactNode } from 'react'

/**
 * Renderizador ligero de Markdown para los documentos legales.
 * Soporta: encabezados (# a ####), párrafos, blockquotes, listas (- y 1.),
 * tablas (| ... |), reglas horizontales (---), y negrita/código en línea.
 */

interface InlinePart {
  tipo: 'texto' | 'bold' | 'code'
  texto: string
}

function parsearInline(texto: string): InlinePart[] {
  const partes: InlinePart[] = []
  const patron = /(\*\*[^*]+\*\*|`[^`]+`)/g
  let ultimoIndice = 0
  let coincidencia: RegExpExecArray | null

  while ((coincidencia = patron.exec(texto)) !== null) {
    if (coincidencia.index > ultimoIndice) {
      partes.push({ tipo: 'texto', texto: texto.slice(ultimoIndice, coincidencia.index) })
    }
    const token = coincidencia[0]
    if (token.startsWith('**')) {
      partes.push({ tipo: 'bold', texto: token.slice(2, -2) })
    } else {
      partes.push({ tipo: 'code', texto: token.slice(1, -1) })
    }
    ultimoIndice = patron.lastIndex
  }

  if (ultimoIndice < texto.length) {
    partes.push({ tipo: 'texto', texto: texto.slice(ultimoIndice) })
  }

  return partes
}

function renderInline(texto: string, clave: number): ReactNode {
  const partes = parsearInline(texto)
  if (partes.length === 0) return null
  return partes.map((parte, indice) => {
    const key = `${clave}-${indice}`
    if (parte.tipo === 'bold') {
      return (
        <strong key={key} className="font-semibold text-slate-900">
          {parte.texto}
        </strong>
      )
    }
    if (parte.tipo === 'code') {
      return (
        <code key={key} className="rounded bg-slate-100 px-1 py-0.5 text-[0.9em] text-teal-800">
          {parte.texto}
        </code>
      )
    }
    return <span key={key}>{parte.texto}</span>
  })
}

function esSeparadorTabla(linea: string): boolean {
  return /^\s*\|?[\s:|-]+\|[\s:|-]*$/.test(linea) && linea.includes('-')
}

function dividirFilaTabla(linea: string): string[] {
  return linea
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((celda) => celda.trim())
}

export function Markdown({ fuente }: { fuente: string }) {
  const lineas = fuente.split('\n')
  const bloques: ReactNode[] = []
  let clave = 0

  let indice = 0
  while (indice < lineas.length) {
    const linea = lineas[indice]
    const recortada = linea.trim()

    if (recortada === '') {
      indice += 1
      continue
    }

    // Regla horizontal
    if (/^(-{3,}|\*{3,})$/.test(recortada)) {
      bloques.push(<hr key={clave++} className="my-5 border-slate-200" />)
      indice += 1
      continue
    }

    // Encabezados
    const encabezado = /^(#{1,4})\s+(.*)$/.exec(recortada)
    if (encabezado) {
      const nivel = encabezado[1].length
      const texto = encabezado[2]
      const clases = [
        'text-[15px] font-semibold text-slate-900',
        'text-[14px] font-semibold text-slate-900',
        'text-[13px] font-semibold text-slate-800',
        'text-[12.5px] font-semibold text-slate-800',
      ][nivel - 1]
      const margen = nivel === 1 ? 'mt-1 mb-3' : 'mt-5 mb-2'
      bloques.push(
        <h3 key={clave++} className={`${clases} ${margen}`}>
          {renderInline(texto, clave)}
        </h3>,
      )
      indice += 1
      continue
    }

    // Blockquote
    if (recortada.startsWith('>')) {
      const contenido: string[] = []
      while (indice < lineas.length && lineas[indice].trim().startsWith('>')) {
        contenido.push(lineas[indice].trim().replace(/^>\s?/, ''))
        indice += 1
      }
      bloques.push(
        <blockquote
          key={clave++}
          className="my-3 rounded-r-lg border-l-4 border-teal-400 bg-teal-50/60 px-4 py-2 text-[12.5px] leading-relaxed text-slate-700"
        >
          {contenido.map((parrafo, i) => (
            <p key={i}>{renderInline(parrafo, clave)}</p>
          ))}
        </blockquote>,
      )
      continue
    }

    // Tabla
    if (recortada.startsWith('|') && indice + 1 < lineas.length && esSeparadorTabla(lineas[indice + 1])) {
      const encabezados = dividirFilaTabla(recortada)
      indice += 2
      const filas: string[][] = []
      while (indice < lineas.length && lineas[indice].trim().startsWith('|')) {
        filas.push(dividirFilaTabla(lineas[indice]))
        indice += 1
      }

      bloques.push(
        <div key={clave++} className="my-3 overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left text-[12px]">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70">
                {encabezados.map((celda, i) => (
                  <th key={i} className="px-3 py-2 font-medium text-slate-700">
                    {renderInline(celda, clave)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filas.map((fila, i) => (
                <tr key={i} className="border-b border-slate-50 last:border-0">
                  {fila.map((celda, j) => (
                    <td key={j} className="px-3 py-2 align-top text-slate-600">
                      {renderInline(celda, clave)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>,
      )
      continue
    }

    // Lista desordenada
    if (/^[-*]\s+/.test(recortada)) {
      const items: string[] = []
      while (indice < lineas.length && /^[-*]\s+/.test(lineas[indice].trim())) {
        items.push(lineas[indice].trim().replace(/^[-*]\s+/, ''))
        indice += 1
      }
      bloques.push(
        <ul key={clave++} className="my-2 list-disc space-y-1.5 pl-5 text-[12.5px] leading-relaxed text-slate-600">
          {items.map((item, i) => (
            <li key={i}>{renderInline(item, clave)}</li>
          ))}
        </ul>,
      )
      continue
    }

    // Lista ordenada
    if (/^\d+\.\s+/.test(recortada)) {
      const items: string[] = []
      while (indice < lineas.length && /^\d+\.\s+/.test(lineas[indice].trim())) {
        items.push(lineas[indice].trim().replace(/^\d+\.\s+/, ''))
        indice += 1
      }
      bloques.push(
        <ol key={clave++} className="my-2 list-decimal space-y-1.5 pl-5 text-[12.5px] leading-relaxed text-slate-600">
          {items.map((item, i) => (
            <li key={i}>{renderInline(item, clave)}</li>
          ))}
        </ol>,
      )
      continue
    }

    // Párrafo (agrupa líneas consecutivas)
    const parrafo: string[] = []
    while (
      indice < lineas.length &&
      lineas[indice].trim() !== '' &&
      !/^(#{1,4})\s/.test(lineas[indice].trim()) &&
      !lineas[indice].trim().startsWith('>') &&
      !lineas[indice].trim().startsWith('|') &&
      !/^[-*]\s+/.test(lineas[indice].trim()) &&
      !/^\d+\.\s+/.test(lineas[indice].trim()) &&
      !/^(-{3,}|\*{3,})$/.test(lineas[indice].trim())
    ) {
      parrafo.push(lineas[indice].trim())
      indice += 1
    }
    bloques.push(
      <p key={clave++} className="my-2 text-[12.5px] leading-relaxed text-slate-600">
        {parrafo.map((fragmento, i) => (
          <span key={i}>{renderInline(fragmento, clave)}</span>
        ))}
      </p>,
    )
  }

  return <div className="max-w-none">{bloques}</div>
}
