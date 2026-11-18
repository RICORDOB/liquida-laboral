import { useState } from 'react'
import type { ChangeEvent } from 'react'
import { Icon } from '../../components/Icon'
import { Alert, Badge, Button, Card, Field, SectionTitle, TextInput } from '../../components/ui'
import {
  EMPRESA_VACIA,
  archivoALogoDataURL,
  cargarDatosEmpresa,
  guardarDatosEmpresa,
  hayDatosEmpresa,
} from '../../lib/empresa'
import type { DatosEmpresa } from '../../lib/empresa'

export function EmpresaView() {
  const [datos, setDatos] = useState<DatosEmpresa>(() => cargarDatosEmpresa())
  const [guardado, setGuardado] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function actualizar<K extends keyof DatosEmpresa>(campo: K, valor: DatosEmpresa[K]) {
    setDatos((previos) => ({ ...previos, [campo]: valor }))
    setGuardado(false)
  }

  async function alSeleccionarLogo(event: ChangeEvent<HTMLInputElement>) {
    const archivo = event.target.files?.[0]
    event.target.value = ''
    if (!archivo) return
    setError(null)
    try {
      const logo = await archivoALogoDataURL(archivo)
      actualizar('logo', logo)
    } catch (causa) {
      setError(causa instanceof Error ? causa.message : 'No se pudo cargar el logo.')
    }
  }

  function guardar() {
    guardarDatosEmpresa(datos)
    setGuardado(true)
    window.setTimeout(() => setGuardado(false), 2500)
  }

  return (
    <div className="space-y-6">
      <div>
        <Badge variante="teal">
          <Icon name="building" size={12} />
          Datos de la empresa
        </Badge>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900 sm:text-[30px]">
          Tu empresa en los documentos
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">
          Opcional. Si completas estos datos y subes un logo, se usarán para
          encabezar y firmar el PDF de cada liquidación. Se guardan solo en este
          navegador.
        </p>
      </div>

      <Card>
        <SectionTitle
          icono="building"
          titulo="Identificación"
          descripcion="Estos datos aparecen en el PDF. Déjalos vacíos para usar el encabezado genérico."
        />
        <div className="grid gap-4 p-5 sm:grid-cols-2">
          <Field label="Razón social o nombre" htmlFor="razonSocial">
            <TextInput
              id="razonSocial"
              value={datos.razonSocial}
              onChange={(event) => actualizar('razonSocial', event.target.value)}
              placeholder="Mi Empresa S.A.S."
              autoComplete="off"
            />
          </Field>

          <Field label="NIT" htmlFor="nit">
            <TextInput
              id="nit"
              value={datos.nit}
              onChange={(event) => actualizar('nit', event.target.value)}
              placeholder="900.123.456-7"
              autoComplete="off"
            />
          </Field>

          <Field label="Ciudad" htmlFor="ciudad">
            <TextInput
              id="ciudad"
              value={datos.ciudad}
              onChange={(event) => actualizar('ciudad', event.target.value)}
              placeholder="Bogotá D.C."
              autoComplete="off"
            />
          </Field>

          <Field label="Dirección" htmlFor="direccion">
            <TextInput
              id="direccion"
              value={datos.direccion}
              onChange={(event) => actualizar('direccion', event.target.value)}
              placeholder="Calle 123 # 45-67"
              autoComplete="off"
            />
          </Field>

          <Field label="Teléfono" htmlFor="telefono">
            <TextInput
              id="telefono"
              value={datos.telefono}
              onChange={(event) => actualizar('telefono', event.target.value)}
              placeholder="601 123 4567"
              autoComplete="off"
            />
          </Field>

          <Field label="Correo" htmlFor="correo">
            <TextInput
              id="correo"
              value={datos.correo}
              onChange={(event) => actualizar('correo', event.target.value)}
              placeholder="contacto@miempresa.com"
              autoComplete="off"
            />
          </Field>
        </div>
      </Card>

      <Card>
        <SectionTitle
          icono="upload"
          titulo="Logo"
          descripcion="PNG, JPG o WebP. Se redimensiona automáticamente."
        />
        <div className="p-5">
          <div className="flex flex-wrap items-center gap-4">
            {datos.logo ? (
              <div className="flex items-center gap-4">
                <div className="grid h-20 w-20 place-items-center overflow-hidden rounded-xl border border-slate-200 bg-white p-1">
                  <img
                    src={datos.logo}
                    alt="Logo de la empresa"
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label
                    htmlFor="logoEmpresa"
                    className="flex h-9 cursor-pointer items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 text-[12.5px] font-medium text-slate-600 transition hover:border-teal-400 hover:text-teal-700"
                  >
                    <Icon name="upload" size={15} />
                    Cambiar logo
                  </label>
                  <Button
                    variante="ghost"
                    tamano="sm"
                    onClick={() => actualizar('logo', '')}
                  >
                    <Icon name="trash" size={14} />
                    Quitar logo
                  </Button>
                </div>
              </div>
            ) : (
              <label
                htmlFor="logoEmpresa"
                className="flex h-20 w-20 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-slate-300 bg-slate-50 text-slate-500 transition hover:border-teal-400 hover:bg-teal-50/40 hover:text-teal-700"
              >
                <Icon name="upload" size={18} />
                <span className="text-[10.5px] font-medium">Subir logo</span>
              </label>
            )}
            <input
              id="logoEmpresa"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={alSeleccionarLogo}
              className="sr-only"
            />
          </div>

          {error ? (
            <div className="mt-4">
              <Alert variante="danger" titulo="No se pudo cargar el logo">
                {error}
              </Alert>
            </div>
          ) : null}
        </div>
      </Card>

      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={guardar}>
          <Icon name={guardado ? 'check' : 'save'} size={15} />
          {guardado ? 'Guardado' : 'Guardar datos'}
        </Button>
        {!hayDatosEmpresa(datos) ? (
          <span className="text-[12px] text-slate-500">
            Sin datos guardados: el PDF usará el encabezado genérico.
          </span>
        ) : null}
        <button
          type="button"
          onClick={() => {
            setDatos(EMPRESA_VACIA)
            guardarDatosEmpresa(EMPRESA_VACIA)
            setGuardado(false)
          }}
          className="text-[12px] font-medium text-slate-500 underline-offset-2 hover:text-rose-600 hover:underline"
        >
          Restablecer
        </button>
      </div>
    </div>
  )
}
