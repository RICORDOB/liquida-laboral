import { useEffect, useMemo, useState } from 'react'
import { Icon } from './components/Icon'
import type { IconName } from './components/Icon'
import { Button } from './components/ui'
import { FORMULARIO_INICIAL, formularioDesdeEntrada } from './engine/formulario'
import type { FormularioLiquidacion, ResultadoLiquidacion } from './engine/types'
import { GuiaView } from './features/guia/GuiaView'
import { HistorialView } from './features/historial/HistorialView'
import { LegalView } from './features/legal/LegalView'
import { LiquidacionView } from './features/liquidacion/LiquidacionView'
import { LoteView } from './features/lote/LoteView'
import type { CasoGuardado } from './lib/storage'
import {
  cargarBorrador,
  guardarBorrador,
  guardarCaso,
  listarCasos,
  nuevoId,
} from './lib/storage'

type Vista = 'liquidacion' | 'lote' | 'historial' | 'guia' | 'legal'

const NAV: { id: Vista; etiqueta: string; icono: IconName }[] = [
  { id: 'liquidacion', etiqueta: 'Liquidación', icono: 'calculator' },
  { id: 'lote', etiqueta: 'Lote CSV', icono: 'table' },
  { id: 'historial', etiqueta: 'Historial', icono: 'history' },
  { id: 'guia', etiqueta: 'Guía', icono: 'book' },
]

const CLAVE_AVISO = 'liquida-laboral:aviso-aceptado:v1'

const ANIO_ACTUAL = new Date().getFullYear()

export default function App() {
  const [vista, setVista] = useState<Vista>('liquidacion')
  const [formulario, setFormulario] = useState<FormularioLiquidacion>(() => {
    return cargarBorrador() ?? FORMULARIO_INICIAL
  })
  const [casos, setCasos] = useState<CasoGuardado[]>(() => listarCasos())
  const [avisoAceptado, setAvisoAceptado] = useState<boolean>(() => {
    try {
      return window.localStorage.getItem(CLAVE_AVISO) === '1'
    } catch {
      return true
    }
  })
  const [checkAviso, setCheckAviso] = useState(false)

  useEffect(() => {
    guardarBorrador(formulario)
  }, [formulario])

  const etiquetaActual = useMemo(
    () => NAV.find((item) => item.id === vista)?.etiqueta ?? 'Legal',
    [vista],
  )

  function aceptarAviso() {
    try {
      window.localStorage.setItem(CLAVE_AVISO, '1')
    } catch {
      // Sin almacenamiento: el aviso se mostrará de nuevo la próxima vez.
    }
    setAvisoAceptado(true)
  }

  function guardarCasoActual(resultado: ResultadoLiquidacion) {
    const caso: CasoGuardado = {
      id: nuevoId(),
      creadoEn: new Date().toISOString(),
      titulo: resultado.entrada.empleado.nombre || 'Trabajador sin nombre',
      entrada: resultado.entrada,
      resultado,
    }
    setCasos(guardarCaso(caso))
  }

  function abrirCaso(resultado: ResultadoLiquidacion) {
    setFormulario(formularioDesdeEntrada(resultado.entrada))
    setVista('liquidacion')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function nuevaLiquidacion() {
    setFormulario(FORMULARIO_INICIAL)
    setVista('liquidacion')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function renderVista() {
    switch (vista) {
      case 'liquidacion':
        return (
          <LiquidacionView
            formulario={formulario}
            setFormulario={setFormulario}
            onGuardarCaso={guardarCasoActual}
            onIrAHistorial={() => setVista('historial')}
          />
        )
      case 'lote':
        return <LoteView />
      case 'historial':
        return (
          <HistorialView
            casos={casos}
            setCasos={setCasos}
            onAbrirCaso={abrirCaso}
            onNuevo={nuevaLiquidacion}
          />
        )
      case 'guia':
        return <GuiaView />
      case 'legal':
        return <LegalView />
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <button
            type="button"
            onClick={() => setVista('liquidacion')}
            className="flex items-center gap-2.5"
          >
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-teal-600 text-white">
              <Icon name="scale" size={20} />
            </span>
            <span className="text-left">
              <span className="block text-[15px] font-semibold leading-tight tracking-tight text-slate-900">
                Liquida Laboral
              </span>
              <span className="block text-[11px] leading-tight text-slate-500">
                Liquidaciones laborales · Colombia
              </span>
            </span>
          </button>

          <nav className="hidden items-center gap-1 md:flex">
            {NAV.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setVista(item.id)}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-[13px] font-medium transition ${
                  vista === item.id
                    ? 'bg-teal-50 text-teal-700'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Icon name={item.icono} size={15} />
                {item.etiqueta}
              </button>
            ))}
          </nav>
        </div>

        <nav className="flex gap-1 overflow-x-auto border-t border-slate-100 px-3 py-1.5 md:hidden">
          {NAV.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setVista(item.id)}
              className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-[12.5px] font-medium transition ${
                vista === item.id
                  ? 'bg-teal-50 text-teal-700'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Icon name={item.icono} size={14} />
              {item.etiqueta}
            </button>
          ))}
        </nav>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
        {renderVista()}
      </main>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="max-w-sm">
              <p className="text-[13px] font-semibold text-slate-900">Liquida Laboral</p>
              <p className="mt-1 text-[11.5px] leading-relaxed text-slate-500">
                Herramienta de estimación. No es asesoría jurídica ni contable. Los
                datos no salen de este navegador.
              </p>
            </div>
            <div className="flex flex-wrap gap-x-5 gap-y-2 text-[12px]">
              <button
                type="button"
                onClick={() => setVista('legal')}
                className="text-slate-600 hover:text-teal-700"
              >
                Aviso legal
              </button>
              <button
                type="button"
                onClick={() => setVista('legal')}
                className="text-slate-600 hover:text-teal-700"
              >
                Privacidad
              </button>
              <button
                type="button"
                onClick={() => setVista('legal')}
                className="text-slate-600 hover:text-teal-700"
              >
                Términos
              </button>
              <button
                type="button"
                onClick={() => setVista('guia')}
                className="text-slate-600 hover:text-teal-700"
              >
                Guía
              </button>
            </div>
          </div>
          <p className="mt-5 border-t border-slate-100 pt-4 text-[11px] text-slate-400">
            © {ANIO_ACTUAL} Liquida Laboral · Resultados orientativos · Verifica los
            parámetros con la fuente oficial antes de pagar.
          </p>
        </div>
      </footer>

      {!avisoAceptado ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 p-4 backdrop-blur-sm sm:items-center">
          <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="bg-slate-900 px-5 py-4 text-white">
              <p className="flex items-center gap-2 text-[15px] font-semibold">
                <Icon name="shield" size={18} />
                Antes de continuar
              </p>
            </div>
            <div className="max-h-[60vh] overflow-y-auto p-5 text-[13px] leading-relaxed text-slate-600">
              <ul className="space-y-2.5">
                <li className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-teal-500" />
                  Los resultados son <strong>orientativos</strong> y no reemplazan la
                  revisión de un contador o abogado laboralista.
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-teal-500" />
                  Usted es responsable de la exactitud de los datos y de contar con
                  autorización para tratarlos.
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-teal-500" />
                  Verifique el salario mínimo, el auxilio de transporte, la UVT y los
                  recargos del año.
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-teal-500" />
                  Los datos se guardan solo en este navegador; si el equipo es
                  compartido, use un perfil exclusivo y borre la información al terminar.
                </li>
              </ul>
            </div>
            <div className="border-t border-slate-100 p-5">
              <label className="flex cursor-pointer items-start gap-2.5">
                <input
                  type="checkbox"
                  checked={checkAviso}
                  onChange={(event) => setCheckAviso(event.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                />
                <span className="text-[12.5px] leading-snug text-slate-700">
                  Entiendo y acepto los{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setVista('legal')
                      setAvisoAceptado(true)
                    }}
                    className="font-medium text-teal-700 underline"
                  >
                    términos y la política de privacidad
                  </button>
                  .
                </span>
              </label>
              <Button
                tamano="lg"
                className="mt-4 w-full"
                disabled={!checkAviso}
                onClick={aceptarAviso}
              >
                Continuar
                <Icon name="arrowRight" size={16} />
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      <span className="sr-only">{etiquetaActual}</span>
    </div>
  )
}
