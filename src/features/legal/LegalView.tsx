import { useEffect, useState } from 'react'
import { Icon } from '../../components/Icon'
import { Badge, Card } from '../../components/ui'
import { Markdown } from '../../lib/markdown'

type Pestaña = 'aviso' | 'privacidad' | 'terminos' | 'checklist'

const PESTAÑAS: { id: Pestaña; etiqueta: string; archivo: string }[] = [
  { id: 'aviso', etiqueta: 'Aviso importante', archivo: '/legal/disclaimer.md' },
  { id: 'privacidad', etiqueta: 'Privacidad', archivo: '/legal/privacidad.md' },
  { id: 'terminos', etiqueta: 'Términos', archivo: '/legal/terminos.md' },
  { id: 'checklist', etiqueta: 'Checklist', archivo: '/legal/checklist-cumplimiento.md' },
]

export function LegalView() {
  const [activa, setActiva] = useState<Pestaña>('aviso')
  const [contenido, setContenido] = useState<Record<string, string>>({})
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let activo = true

    async function cargar() {
      setCargando(true)
      setError(null)
      try {
        const respuestas = await Promise.all(
          PESTAÑAS.map(async (pestaña) => {
            const respuesta = await fetch(pestaña.archivo)
            if (!respuesta.ok) {
              throw new Error(`No se pudo cargar ${pestaña.archivo}`)
            }
            return [pestaña.id, await respuesta.text()] as const
          }),
        )
        if (!activo) return
        setContenido(Object.fromEntries(respuestas))
      } catch (causa) {
        if (activo) {
          setError(causa instanceof Error ? causa.message : 'Error al cargar los documentos.')
        }
      } finally {
        if (activo) setCargando(false)
      }
    }

    cargar()
    return () => {
      activo = false
    }
  }, [])

  const textoActivo = contenido[activa] ?? ''

  return (
    <div className="space-y-6">
      <div>
        <Badge variante="teal">
          <Icon name="shield" size={12} />
          Legal y privacidad
        </Badge>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900 sm:text-[30px]">
          Tus datos y esta herramienta
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">
          Liquida Laboral es una herramienta de estimación que funciona 100% en tu
          navegador. Aquí encuentras el aviso legal, la política de privacidad y los
          términos de uso.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
        <nav className="flex gap-2 overflow-x-auto lg:flex-col">
          {PESTAÑAS.map((pestaña) => (
            <button
              key={pestaña.id}
              type="button"
              onClick={() => setActiva(pestaña.id)}
              className={`shrink-0 rounded-xl px-3 py-2.5 text-left text-[13px] font-medium transition ${
                activa === pestaña.id
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              {pestaña.etiqueta}
            </button>
          ))}
        </nav>

        <Card className="min-h-[320px] p-5 sm:p-6">
          {cargando ? (
            <div className="flex items-center gap-2 text-slate-500">
              <Icon name="info" size={16} className="animate-pulse" />
              Cargando documento...
            </div>
          ) : error ? (
            <div className="text-rose-600">{error}</div>
          ) : (
            <Markdown fuente={textoActivo} />
          )}
        </Card>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 text-[11.5px] leading-relaxed text-slate-500">
        <p className="mb-1 flex items-center gap-1.5 font-medium text-slate-700">
          <Icon name="alert" size={13} />
          Nota
        </p>
        Estos documentos son borradores operativos. Completa los datos del
        proveedor ([RAZÓN SOCIAL], [NIT], [CORREO]) y hazlos revisar por un abogado
        antes de usar la app con datos reales de trabajadores.
      </div>
    </div>
  )
}
