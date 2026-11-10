import { useMemo, useState } from 'react'
import type { ChangeEvent } from 'react'
import { Icon } from '../../components/Icon'
import {
  Alert,
  Badge,
  Button,
  Card,
  Field,
  SectionTitle,
  Select,
  Textarea,
} from '../../components/ui'
import {
  exportarErroresCSV,
  exportarResultadosCSV,
  parsearLote,
  plantillaCSV,
} from '../../engine/csv'
import type { ResultadoLote } from '../../engine/csv'
import { formatCOP } from '../../engine/formato'
import { ANIOS_DISPONIBLES, anioVigente } from '../../engine/parametros'
import { descargarPDF } from '../../engine/pdf'
import { descargarTexto } from '../../lib/descargas'

export function LoteView() {
  const [anio, setAnio] = useState(String(anioVigente()))
  const [nombreArchivo, setNombreArchivo] = useState('')
  const [textoPegado, setTextoPegado] = useState('')
  const [lote, setLote] = useState<ResultadoLote | null>(null)
  const [error, setError] = useState<string | null>(null)

  const totalNeto = useMemo(
    () => lote?.filas.reduce((total, fila) => total + fila.resultado.netoPagar, 0) ?? 0,
    [lote],
  )

  function procesar(texto: string) {
    setError(null)
    const resultado = parsearLote(texto, Number(anio))
    if (resultado.totalFilas === 0) {
      setLote(null)
      setError('No se encontraron filas. Revisa que el archivo tenga encabezados y datos.')
      return
    }
    setLote(resultado)
  }

  async function alSeleccionarArchivo(event: ChangeEvent<HTMLInputElement>) {
    const archivo = event.target.files?.[0]
    if (!archivo) return
    setNombreArchivo(archivo.name)
    const texto = await archivo.text()
    procesar(texto)
  }

  function limpiar() {
    setLote(null)
    setNombreArchivo('')
    setTextoPegado('')
    setError(null)
  }

  return (
    <div className="space-y-6">
      <div>
        <Badge variante="blue">
          <Icon name="table" size={12} />
          Procesamiento por lote
        </Badge>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900 sm:text-[30px]">
          Liquida varios trabajadores desde un CSV
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">
          Descarga la plantilla, complétala y súbela. Cada fila se valida por
          separado: los errores no bloquean a los demás trabajadores.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
        <Card>
          <SectionTitle
            icono="upload"
            titulo="Cargar archivo"
            descripcion="Acepta CSV con separador coma o punto y coma. También puedes pegar el contenido."
          />
          <div className="space-y-4 p-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Año de parámetros"
                htmlFor="anioLote"
                hint="Se aplica a todas las filas del lote."
              >
                <Select
                  id="anioLote"
                  value={anio}
                  onChange={(event) => setAnio(event.target.value)}
                >
                  {ANIOS_DISPONIBLES.map((opcion) => (
                    <option key={opcion} value={opcion}>
                      {opcion}
                    </option>
                  ))}
                </Select>
              </Field>

              <Field label="Archivo CSV" htmlFor="archivoLote">
                <label
                  htmlFor="archivoLote"
                  className="flex h-10 cursor-pointer items-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-3 text-[12.5px] text-slate-600 transition hover:border-teal-400 hover:bg-teal-50/40"
                >
                  <Icon name="upload" size={15} />
                  <span className="truncate">
                    {nombreArchivo || 'Seleccionar archivo...'}
                  </span>
                </label>
                <input
                  id="archivoLote"
                  type="file"
                  accept=".csv,text/csv"
                  onChange={alSeleccionarArchivo}
                  className="sr-only"
                />
              </Field>
            </div>

            <Field
              label="O pega el CSV"
              htmlFor="textoLote"
              hint="La primera fila debe tener los encabezados de la plantilla."
            >
              <Textarea
                id="textoLote"
                rows={6}
                value={textoPegado}
                onChange={(event) => setTextoPegado(event.target.value)}
                placeholder="documento;nombre;fecha_ingreso;fecha_retiro;..."
                className="font-mono text-[11.5px]"
              />
            </Field>

            <div className="flex flex-wrap gap-2">
              <Button onClick={() => procesar(textoPegado)} disabled={!textoPegado.trim()}>
                <Icon name="calculator" size={15} />
                Procesar texto
              </Button>
              <Button
                variante="outline"
                onClick={() =>
                  descargarTexto('plantilla-liquidacion-laboral.csv', plantillaCSV())
                }
              >
                <Icon name="download" size={15} />
                Descargar plantilla
              </Button>
              <Button variante="ghost" onClick={limpiar}>
                Limpiar
              </Button>
            </div>

            {error ? (
              <Alert variante="danger" titulo="No se pudo procesar">
                {error}
              </Alert>
            ) : null}
          </div>
        </Card>

        <Card className="h-fit">
          <SectionTitle
            icono="info"
            titulo="Columnas de la plantilla"
            descripcion="Las columnas obligatorias son documento, nombre, fechas y salario."
          />
          <div className="space-y-2 p-5 text-[11.5px] leading-relaxed text-slate-600">
            {[
              ['documento', 'Identificación del trabajador'],
              ['nombre', 'Nombre completo'],
              ['fecha_ingreso', 'YYYY-MM-DD o DD/MM/YYYY'],
              ['fecha_retiro', 'YYYY-MM-DD o DD/MM/YYYY'],
              ['tipo_contrato', 'indefinido, fijo u obra'],
              ['tipo_salario', 'fijo, variable o integral'],
              ['salario_basico', 'Solo números'],
              ['auxilio_transporte', 'si / no'],
              ['motivo_terminacion', 'renuncia, despido_sin_justa, etc.'],
              ['cesantias_consignadas_hasta', 'Opcional'],
              ['ultimo_pago_prima', 'Opcional'],
            ].map(([campo, descripcion]) => (
              <div key={campo} className="flex items-start justify-between gap-3">
                <code className="shrink-0 rounded bg-slate-100 px-1.5 py-0.5 text-[10.5px] text-slate-700">
                  {campo}
                </code>
                <span className="text-right text-slate-500">{descripcion}</span>
              </div>
            ))}
            <p className="pt-2 text-[11px] text-slate-400">
              Las columnas adicionales se ignoran. Las filas con errores se listan
              aparte para corregirlas y volver a cargarlas.
            </p>
          </div>
        </Card>
      </div>

      {lote ? (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-[11px] uppercase tracking-wide text-slate-500">Filas leídas</p>
              <p className="mt-1 text-[22px] font-semibold text-slate-900">{lote.totalFilas}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-[11px] uppercase tracking-wide text-slate-500">Procesadas</p>
              <p className="mt-1 text-[22px] font-semibold text-emerald-700">
                {lote.filas.length}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-[11px] uppercase tracking-wide text-slate-500">Con errores</p>
              <p className="mt-1 text-[22px] font-semibold text-rose-700">{lote.errores.length}</p>
            </div>
            <div className="rounded-2xl border border-teal-200 bg-teal-50/60 p-4">
              <p className="text-[11px] uppercase tracking-wide text-teal-700">Neto total</p>
              <p className="mt-1 text-[20px] font-semibold text-teal-900">{formatCOP(totalNeto)}</p>
            </div>
          </div>

          {lote.filas.length > 0 ? (
            <Card className="overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-3.5">
                <h2 className="text-[14px] font-semibold text-slate-900">
                  Resultados ({lote.filas.length})
                </h2>
                <div className="flex flex-wrap gap-2">
                  <Button
                    tamano="sm"
                    onClick={() =>
                      descargarTexto(
                        'resultados-liquidacion.csv',
                        exportarResultadosCSV(lote.filas),
                      )
                    }
                  >
                    <Icon name="download" size={14} />
                    Resultados CSV
                  </Button>
                  {lote.errores.length > 0 ? (
                    <Button
                      tamano="sm"
                      variante="outline"
                      onClick={() =>
                        descargarTexto('errores-liquidacion.csv', exportarErroresCSV(lote.errores))
                      }
                    >
                      <Icon name="download" size={14} />
                      Errores CSV
                    </Button>
                  ) : null}
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-[12.5px]">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] uppercase tracking-wide text-slate-500">
                      <th className="px-4 py-2.5 font-medium">Fila</th>
                      <th className="px-4 py-2.5 font-medium">Trabajador</th>
                      <th className="px-4 py-2.5 font-medium">Documento</th>
                      <th className="px-4 py-2.5 text-right font-medium">Días</th>
                      <th className="px-4 py-2.5 text-right font-medium">Neto</th>
                      <th className="px-4 py-2.5 text-center font-medium">Alertas</th>
                      <th className="px-4 py-2.5 text-right font-medium">PDF</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lote.filas.map((fila) => (
                      <tr key={`${fila.fila}-${fila.entrada.empleado.documento}`} className="border-b border-slate-50 last:border-0">
                        <td className="px-4 py-3 text-slate-400">{fila.fila}</td>
                        <td className="px-4 py-3 font-medium text-slate-800">
                          {fila.entrada.empleado.nombre}
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {fila.entrada.empleado.documento || '—'}
                        </td>
                        <td className="px-4 py-3 text-right text-slate-600">
                          {fila.resultado.diasTotales}
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-slate-900">
                          {formatCOP(fila.resultado.netoPagar)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {fila.resultado.advertencias.length > 0 ? (
                            <Badge variante="amber">
                              {fila.resultado.advertencias.length}
                            </Badge>
                          ) : (
                            <span className="text-slate-300">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Button
                            tamano="sm"
                            variante="ghost"
                            onClick={() => descargarPDF(fila.resultado)}
                            aria-label={`Descargar PDF de ${fila.entrada.empleado.nombre}`}
                          >
                            <Icon name="download" size={14} />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          ) : null}

          {lote.errores.length > 0 ? (
            <Card className="overflow-hidden">
              <div className="border-b border-slate-100 px-5 py-3.5">
                <h2 className="text-[14px] font-semibold text-slate-900">
                  Filas con errores ({lote.errores.length})
                </h2>
              </div>
              <div className="divide-y divide-slate-100">
                {lote.errores.map((fila) => (
                  <div key={`${fila.fila}-${fila.documento}`} className="p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variante="rose">Fila {fila.fila}</Badge>
                      <span className="text-[12.5px] font-medium text-slate-800">
                        {fila.nombre || 'Sin nombre'}
                      </span>
                      <span className="text-[11.5px] text-slate-500">
                        {fila.documento || 'Sin documento'}
                      </span>
                    </div>
                    <ul className="mt-1.5 list-disc space-y-0.5 pl-5 text-[11.5px] text-rose-700">
                      {fila.errores.map((mensaje) => (
                        <li key={mensaje}>{mensaje}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </Card>
          ) : null}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white/60 p-8 text-center">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-slate-100 text-slate-500">
            <Icon name="table" size={22} />
          </div>
          <p className="mt-3 text-[14px] font-medium text-slate-700">
            Aún no hay un lote procesado
          </p>
          <p className="mx-auto mt-1 max-w-md text-[12.5px] text-slate-500">
            Descarga la plantilla, complétala con un trabajador por fila y vuelve a
            cargarla. También puedes pegar el CSV directamente.
          </p>
        </div>
      )}
    </div>
  )
}
