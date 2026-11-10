import { useRef, useState } from 'react'
import type { ChangeEvent } from 'react'
import { Icon } from '../../components/Icon'
import { Alert, Badge, Button, Card } from '../../components/ui'
import { formatearFecha } from '../../engine/fechas'
import { formatCOP } from '../../engine/formato'
import type { ResultadoLiquidacion } from '../../engine/types'
import { descargarTexto } from '../../lib/descargas'
import type { CasoGuardado } from '../../lib/storage'
import {
  eliminarCaso,
  exportarCasosJSON,
  importarCasosJSON,
  limpiarCasos,
} from '../../lib/storage'
import { ResultadoView } from '../liquidacion/ResultadoView'

interface Props {
  casos: CasoGuardado[]
  setCasos: (casos: CasoGuardado[]) => void
  onAbrirCaso: (resultado: ResultadoLiquidacion) => void
  onNuevo: () => void
}

export function HistorialView({ casos, setCasos, onAbrirCaso, onNuevo }: Props) {
  const [casoAbierto, setCasoAbierto] = useState<CasoGuardado | null>(null)
  const [confirmarEliminar, setConfirmarEliminar] = useState<string | null>(null)
  const [mensaje, setMensaje] = useState<string | null>(null)
  const inputArchivo = useRef<HTMLInputElement>(null)

  function eliminar(id: string) {
    setCasos(eliminarCaso(id))
    if (casoAbierto?.id === id) setCasoAbierto(null)
    setConfirmarEliminar(null)
    setMensaje('Caso eliminado del historial.')
  }

  function exportar() {
    descargarTexto(
      `historial-liquidaciones-${new Date().toISOString().slice(0, 10)}.json`,
      exportarCasosJSON(casos),
      'application/json;charset=utf-8',
    )
    setMensaje('Historial exportado como JSON.')
  }

  async function importar(event: ChangeEvent<HTMLInputElement>) {
    const archivo = event.target.files?.[0]
    if (!archivo) return
    const texto = await archivo.text()
    const resultado = importarCasosJSON(texto)
    setCasos(resultado.casos)
    setMensaje(
      resultado.error
        ? resultado.error
        : `Se importaron ${resultado.importados} caso(s).`,
    )
    if (inputArchivo.current) inputArchivo.current.value = ''
  }

  function limpiarTodo() {
    limpiarCasos()
    setCasos([])
    setCasoAbierto(null)
    setConfirmarEliminar(null)
    setMensaje('Historial vaciado. Recuerda borrar también los archivos exportados.')
  }

  if (casoAbierto) {
    return (
      <div className="space-y-4">
        <Button variante="ghost" tamano="sm" onClick={() => setCasoAbierto(null)}>
          <Icon name="arrowRight" size={14} className="rotate-180" />
          Volver al historial
        </Button>
        <ResultadoView
          resultado={casoAbierto.resultado}
          guardado={true}
          onEditar={() => {
            onAbrirCaso(casoAbierto.resultado)
            setCasoAbierto(null)
          }}
          onNueva={onNuevo}
          onGuardar={() => undefined}
          onIrAHistorial={() => setCasoAbierto(null)}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Badge variante="teal">
            <Icon name="history" size={12} />
            Historial local
          </Badge>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900 sm:text-[30px]">
            Liquidaciones guardadas
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">
            Cada caso se guarda solo en este navegador. Puedes reabrirlo, exportar
            todo como respaldo o borrarlo.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variante="outline" tamano="sm" onClick={exportar} disabled={casos.length === 0}>
            <Icon name="download" size={14} />
            Exportar JSON
          </Button>
          <Button
            variante="outline"
            tamano="sm"
            onClick={() => inputArchivo.current?.click()}
          >
            <Icon name="upload" size={14} />
            Importar JSON
          </Button>
          <input
            ref={inputArchivo}
            type="file"
            accept=".json,application/json"
            onChange={importar}
            className="sr-only"
          />
          {casos.length > 0 ? (
            <Button variante="ghost" tamano="sm" onClick={() => setConfirmarEliminar('__todo__')}>
              <Icon name="trash" size={14} />
              Vaciar
            </Button>
          ) : null}
        </div>
      </div>

      {mensaje ? (
        <Alert variante="success" titulo="Hecho">
          {mensaje}
        </Alert>
      ) : null}

      {confirmarEliminar ? (
        <Alert variante="danger" titulo="¿Eliminar datos?">
          <p className="mb-3">
            {confirmarEliminar === '__todo__'
              ? 'Esto elimina todos los casos guardados en este navegador. No elimina los archivos PDF, CSV o JSON ya exportados.'
              : 'Esto elimina este caso del historial. No elimina los archivos exportados.'}
          </p>
          <div className="flex gap-2">
            <Button
              variante="danger"
              tamano="sm"
              onClick={() =>
                confirmarEliminar === '__todo__'
                  ? limpiarTodo()
                  : eliminar(confirmarEliminar)
              }
            >
              Sí, eliminar
            </Button>
            <Button
              variante="outline"
              tamano="sm"
              onClick={() => setConfirmarEliminar(null)}
            >
              Cancelar
            </Button>
          </div>
        </Alert>
      ) : null}

      {casos.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white/60 p-10 text-center">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-slate-100 text-slate-500">
            <Icon name="history" size={22} />
          </div>
          <p className="mt-3 text-[14px] font-medium text-slate-700">
            No hay casos guardados todavía
          </p>
          <p className="mx-auto mt-1 max-w-md text-[12.5px] text-slate-500">
            Calcula una liquidación y usa «Guardar caso» para conservarla aquí. Los
            datos quedan solo en este navegador.
          </p>
          <Button className="mt-4" onClick={onNuevo}>
            <Icon name="calculator" size={15} />
            Calcular liquidación
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {casos.map((caso) => (
            <Card key={caso.id} className="overflow-hidden">
              <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-[14px] font-semibold text-slate-900">
                      {caso.titulo}
                    </p>
                    <Badge variante="slate">
                      {formatearFecha(caso.creadoEn.slice(0, 10))}
                    </Badge>
                  </div>
                  <p className="mt-0.5 text-[12px] text-slate-500">
                    {formatearFecha(caso.entrada.contrato.fechaIngreso)} a{' '}
                    {formatearFecha(caso.entrada.contrato.fechaRetiro)} ·{' '}
                    {caso.resultado.diasTotales} días
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-[10.5px] uppercase tracking-wide text-slate-500">
                      Neto a pagar
                    </p>
                    <p className="text-[16px] font-semibold text-teal-800">
                      {formatCOP(caso.resultado.netoPagar)}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variante="outline"
                      tamano="sm"
                      onClick={() => setCasoAbierto(caso)}
                    >
                      <Icon name="file" size={14} />
                      Abrir
                    </Button>
                    <Button
                      variante="ghost"
                      tamano="sm"
                      onClick={() => setConfirmarEliminar(caso.id)}
                      aria-label={`Eliminar ${caso.titulo}`}
                    >
                      <Icon name="trash" size={14} />
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
