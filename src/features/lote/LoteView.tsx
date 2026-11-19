import { useMemo, useState } from 'react'
import type { ChangeEvent } from 'react'
import { readSheet } from 'read-excel-file/browser'
import writeXlsxFile from 'write-excel-file/browser'
import { Icon } from '../../components/Icon'
import {
  Alert,
  Badge,
  Button,
  Card,
  Checkbox,
  Field,
  SectionTitle,
  Select,
} from '../../components/ui'
import {
  CAMPOS_LOTE,
  erroresDatos,
  parsearLote,
  plantillaCompletaDatos,
  plantillaDatos,
  reconocerEncabezados,
  resultadosDatos,
  sugerirMapeo,
  textoACeldas,
} from '../../engine/xlsx'
import type { CeldaLote, ResultadoLote } from '../../engine/xlsx'
import { formatCOP } from '../../engine/formato'
import { ANIOS_DISPONIBLES, anioVigente } from '../../engine/parametros'
import { descargarPDF } from '../../engine/pdf'
import { cargarDatosEmpresa } from '../../lib/empresa'

export function LoteView() {
  const [anio, setAnio] = useState(String(anioVigente()))
  const [nombreArchivo, setNombreArchivo] = useState('')
  const [lote, setLote] = useState<ResultadoLote | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [textoPegado, setTextoPegado] = useState('')
  const [pendienteMapeo, setPendienteMapeo] = useState<{
    celdas: CeldaLote[][]
    asignaciones: string[]
    esHeader: boolean
  } | null>(null)

  const totalNeto = useMemo(
    () => lote?.filas.reduce((total, fila) => total + fila.resultado.netoPagar, 0) ?? 0,
    [lote],
  )
  const empresa = useMemo(() => cargarDatosEmpresa(), [])

  function procesar(filas: CeldaLote[][]) {
    setError(null)
    const resultado = parsearLote(filas, Number(anio))
    if (resultado.totalFilas === 0) {
      setLote(null)
      setError('No se encontraron filas. Revisa que el archivo tenga encabezados y datos.')
      return
    }
    setLote(resultado)
  }

  /**
   * Enruta las celdas entrantes: si la primera fila es un encabezado reconocible
   * procesa directo; si no, abre el asistente de mapeo de columnas.
   */
  function encolarMapeo(celdas: CeldaLote[][]) {
    setPendienteMapeo(null)
    if (celdas.length === 0) {
      setLote(null)
      setError('No se encontraron datos. Pega celdas copiadas de Excel/Sheets o un CSV.')
      return
    }
    if (reconocerEncabezados(celdas[0])) {
      procesar(celdas)
      return
    }
    setPendienteMapeo({
      celdas,
      asignaciones: sugerirMapeo(celdas),
      esHeader: false,
    })
  }

  function setEsHeader(esHeader: boolean) {
    setPendienteMapeo((prev) =>
      prev
        ? {
            ...prev,
            esHeader,
            asignaciones: sugerirMapeo(esHeader ? prev.celdas.slice(1) : prev.celdas),
          }
        : prev,
    )
  }

  function confirmarMapeo() {
    if (!pendienteMapeo) return
    const { celdas, asignaciones, esHeader } = pendienteMapeo
    const encabezado = asignaciones.map((campo) => campo || 'ignorar')
    const filasProcesar = esHeader
      ? [encabezado, ...celdas.slice(1)]
      : [encabezado, ...celdas]
    setPendienteMapeo(null)
    setNombreArchivo('datos-mapeados')
    procesar(filasProcesar)
  }

  function procesarTexto() {
    const celdas = textoACeldas(textoPegado)
    setNombreArchivo('datos-pegados')
    encolarMapeo(celdas)
  }

  async function alSeleccionarArchivo(event: ChangeEvent<HTMLInputElement>) {
    const archivo = event.target.files?.[0]
    if (!archivo) return
    setNombreArchivo(archivo.name)
    try {
      const filas = (await readSheet(archivo)) as unknown as CeldaLote[][]
      encolarMapeo(filas)
    } catch {
      setLote(null)
      setError('No se pudo leer el archivo. Verifica que sea un archivo .xlsx válido.')
    }
  }

  function limpiar() {
    setLote(null)
    setNombreArchivo('')
    setError(null)
    setPendienteMapeo(null)
    setTextoPegado('')
  }

  return (
    <div className="space-y-6">
      <div>
        <Badge variante="blue">
          <Icon name="table" size={12} />
          Procesamiento por lote
        </Badge>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900 sm:text-[30px]">
          Liquida varios trabajadores desde un Excel
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">
          Descarga la plantilla, complétala y súbela como .xlsx. Cada fila se
          valida por separado: los errores no bloquean a los demás trabajadores.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
        <Card>
          <SectionTitle
            icono="upload"
            titulo="Cargar archivo"
            descripcion="Sube la plantilla completada como archivo .xlsx (Excel)."
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

              <Field label="Archivo Excel" htmlFor="archivoLote">
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
                  accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                  onChange={alSeleccionarArchivo}
                  className="sr-only"
                />
              </Field>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                variante="outline"
                onClick={() =>
                  void writeXlsxFile(plantillaDatos()).toFile(
                    'plantilla-liquidacion-laboral.xlsx',
                  )
                }
              >
                <Icon name="download" size={15} />
                Descargar plantilla
              </Button>
              <Button
                variante="ghost"
                onClick={() =>
                  void writeXlsxFile(plantillaCompletaDatos()).toFile(
                    'plantilla-completa-liquidacion-laboral.xlsx',
                  )
                }
              >
                <Icon name="download" size={15} />
                Plantilla completa
              </Button>
              {lote ? (
                <Button variante="ghost" onClick={limpiar}>
                  Limpiar
                </Button>
              ) : null}
            </div>

            <div className="space-y-2">
              <div className="text-[13px] font-medium text-slate-700">
                O pega los datos directamente
              </div>
              <textarea
                id="textoPegado"
                value={textoPegado}
                onChange={(event) => setTextoPegado(event.target.value)}
                rows={6}
                placeholder={
                  'Copia celdas desde Excel, Google Sheets o un CSV y pégalas aquí. ' +
                  'La primera fila es el encabezado. Solo necesitas: documento, nombre, ' +
                  'fecha de ingreso, fecha de retiro y salario.'
                }
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-[13px] text-slate-900 placeholder:text-slate-400 transition focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
              />
              <Button
                variante="secondary"
                onClick={procesarTexto}
                disabled={!textoPegado.trim()}
              >
                <Icon name="table" size={15} />
                Procesar datos pegados
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
            descripcion="Solo 5 columnas son obligatorias; el resto se completa con valores por defecto."
          />
          <div className="space-y-2 p-5 text-[11.5px] leading-relaxed text-slate-600">
            {[
              ['documento', 'Identificación del trabajador · obligatorio'],
              ['nombre', 'Nombre completo · obligatorio'],
              ['fecha_ingreso', 'YYYY-MM-DD o DD/MM/YYYY · obligatorio'],
              ['fecha_retiro', 'YYYY-MM-DD o DD/MM/YYYY · obligatorio'],
              ['salario_basico', 'Solo números · obligatorio (o salario_minimo = si)'],
              ['salario_minimo', 'si / no · usa el SMMLV de cada año'],
              ['auxilio_transporte', 'si / no · por defecto: no'],
              ['tipo_contrato', 'indefinido, fijo u obra · por defecto: fijo'],
              ['tipo_salario', 'fijo, variable o integral · por defecto: fijo'],
              ['motivo_terminacion', 'renuncia, despido_sin_justa, etc. · por defecto: fin_plazo'],
            ].map(([campo, descripcion]) => (
              <div key={campo} className="flex items-start justify-between gap-3">
                <code className="shrink-0 rounded bg-slate-100 px-1.5 py-0.5 text-[10.5px] text-slate-700">
                  {campo}
                </code>
                <span className="text-right text-slate-500">{descripcion}</span>
              </div>
            ))}
            <p className="pt-2 text-[11px] text-slate-400">
              Los datos faltantes se llenan con valores por defecto y se marcan
              como alerta. Las filas con errores se listan aparte para corregirlas.
            </p>
          </div>
        </Card>
      </div>

      {pendienteMapeo ? (
        <Card className="overflow-hidden">
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="text-[14px] font-semibold text-slate-900">
              Asigna las columnas
            </h2>
            <p className="mt-1 text-[12.5px] text-slate-500">
              No reconocimos los encabezados. Confirma a qué campo corresponde cada
              columna; las que dejes en «ignorar» no se usan.
            </p>
          </div>
          <div className="space-y-3 p-5">
            <Checkbox
              id="esHeader"
              checked={pendienteMapeo.esHeader}
              onChange={setEsHeader}
              label="La primera fila es un encabezado"
              hint="Márcalo si tu bloque de datos empieza con una fila de títulos."
            />

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-[12px]">
                <thead>
                  <tr className="bg-slate-50/70">
                    {Array.from({
                      length: Math.max(...pendienteMapeo.celdas.map((fila) => fila.length)),
                    }).map((_, col) => (
                      <th key={col} className="border border-slate-200 p-1.5 align-top">
                        <select
                          value={pendienteMapeo.asignaciones[col] ?? ''}
                          onChange={(event) =>
                            setPendienteMapeo((prev) =>
                              prev
                                ? {
                                    ...prev,
                                    asignaciones: prev.asignaciones.map((campo, i) =>
                                      i === col ? event.target.value : campo,
                                    ),
                                  }
                                : prev,
                            )
                          }
                          className="h-8 w-full min-w-[130px] rounded-lg border border-slate-300 bg-white px-2 text-[12px] text-slate-800 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                        >
                          <option value="">— ignorar —</option>
                          {CAMPOS_LOTE.map((campo) => (
                            <option key={campo} value={campo}>
                              {campo}
                            </option>
                          ))}
                        </select>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(pendienteMapeo.esHeader
                    ? pendienteMapeo.celdas.slice(1)
                    : pendienteMapeo.celdas
                  )
                    .slice(0, 4)
                    .map((fila, idx) => (
                      <tr key={idx}>
                        {Array.from({
                          length: Math.max(
                            ...pendienteMapeo.celdas.map((fila) => fila.length),
                          ),
                        }).map((_, col) => (
                          <td
                            key={col}
                            className="whitespace-nowrap border border-slate-100 px-2 py-1.5 text-slate-600"
                          >
                            {fila[col] === null || fila[col] === undefined
                              ? ''
                              : String(fila[col])}
                          </td>
                        ))}
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button onClick={confirmarMapeo}>
                <Icon name="check" size={15} />
                Procesar con este mapeo
              </Button>
              <Button variante="ghost" onClick={() => setPendienteMapeo(null)}>
                Cancelar
              </Button>
            </div>
          </div>
        </Card>
      ) : null}

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
                      void writeXlsxFile(resultadosDatos(lote.filas)).toFile(
                        'resultados-liquidacion.xlsx',
                      )
                    }
                  >
                    <Icon name="download" size={14} />
                    Resultados Excel
                  </Button>
                  {lote.errores.length > 0 ? (
                    <Button
                      tamano="sm"
                      variante="outline"
                      onClick={() =>
                        void writeXlsxFile(erroresDatos(lote.errores)).toFile(
                          'errores-liquidacion.xlsx',
                        )
                      }
                    >
                      <Icon name="download" size={14} />
                      Errores Excel
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
                            onClick={() => descargarPDF(fila.resultado, empresa)}
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
            cargarla.
          </p>
        </div>
      )}
    </div>
  )
}
