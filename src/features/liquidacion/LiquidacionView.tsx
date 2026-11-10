import { useMemo, useState } from 'react'
import { Icon } from '../../components/Icon'
import {
  Alert,
  Badge,
  Button,
  Card,
  Checkbox,
  Field,
  MoneyInput,
  SectionTitle,
  Select,
  TextInput,
} from '../../components/ui'
import { calcularLiquidacion } from '../../engine/calculo'
import { aEntrada, FORMULARIO_INICIAL } from '../../engine/formulario'
import { formatCOP } from '../../engine/formato'
import { ANIOS_DISPONIBLES, anioVigente, getParametros } from '../../engine/parametros'
import type {
  FormularioLiquidacion,
  MotivoTerminacion,
  ResultadoLiquidacion,
  TipoContrato,
  TipoSalario,
} from '../../engine/types'
import { validarEntrada } from '../../engine/validacion'
import { ResultadoView } from './ResultadoView'

interface Props {
  formulario: FormularioLiquidacion
  setFormulario: (formulario: FormularioLiquidacion) => void
  onGuardarCaso: (resultado: ResultadoLiquidacion) => void
  onIrAHistorial: () => void
}

const ETIQUETAS_SALARIO: Record<TipoSalario, string> = {
  fijo: 'Fijo',
  variable: 'Variable',
  integral: 'Integral',
}

const ETIQUETAS_CONTRATO: Record<TipoContrato, string> = {
  indefinido: 'Término indefinido',
  fijo: 'Término fijo',
  obra: 'Obra o labor',
}

const ETIQUETAS_MOTIVO: Record<MotivoTerminacion, string> = {
  renuncia: 'Renuncia voluntaria',
  despido_sin_justa: 'Despido sin justa causa',
  despido_con_justa: 'Despido con justa causa',
  mutuo_acuerdo: 'Mutuo acuerdo',
  fin_plazo: 'Fin del plazo pactado',
  fin_obra: 'Fin de la obra o labor',
}

export function LiquidacionView({
  formulario,
  setFormulario,
  onGuardarCaso,
  onIrAHistorial,
}: Props) {
  const [paso, setPaso] = useState<'formulario' | 'resultado'>('formulario')
  const [resultadoFinal, setResultadoFinal] = useState<ResultadoLiquidacion | null>(null)
  const [mostrarErrores, setMostrarErrores] = useState(false)
  const [guardado, setGuardado] = useState(false)

  const entrada = useMemo(() => aEntrada(formulario), [formulario])
  const validacion = useMemo(() => validarEntrada(entrada), [entrada])
  const erroresPorCampo = useMemo(
    () => new Map(validacion.errores.map((error) => [error.campo, error.mensaje])),
    [validacion.errores],
  )

  const preview = useMemo(() => {
    if (!validacion.ok) return null
    try {
      return calcularLiquidacion(entrada)
    } catch {
      return null
    }
  }, [entrada, validacion.ok])

  const parametros = getParametros(Number(formulario.anioParametros) || anioVigente())
  const error = (campo: string) => (mostrarErrores ? erroresPorCampo.get(campo) : undefined)

  function actualizar<K extends keyof FormularioLiquidacion>(
    campo: K,
    valor: FormularioLiquidacion[K],
  ) {
    setFormulario({ ...formulario, [campo]: valor })
  }

  function calcular() {
    setMostrarErrores(true)
    if (!validacion.ok || !preview) {
      const primero = validacion.errores[0]
      if (primero) {
        document.getElementById(primero.campo)?.focus()
      }
      return
    }
    setResultadoFinal(preview)
    setPaso('resultado')
    setGuardado(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function nueva() {
    setFormulario(FORMULARIO_INICIAL)
    setResultadoFinal(null)
    setPaso('formulario')
    setMostrarErrores(false)
    setGuardado(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function guardar() {
    if (!resultadoFinal) return
    onGuardarCaso(resultadoFinal)
    setGuardado(true)
    window.setTimeout(() => setGuardado(false), 2500)
  }

  if (paso === 'resultado' && resultadoFinal) {
    return (
      <ResultadoView
        resultado={resultadoFinal}
        guardado={guardado}
        onEditar={() => {
          setPaso('formulario')
          window.scrollTo({ top: 0, behavior: 'smooth' })
        }}
        onNueva={nueva}
        onGuardar={guardar}
        onIrAHistorial={onIrAHistorial}
      />
    )
  }

  return (
    <div>
      <div className="mb-6">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variante="teal">
            <Icon name="sparkles" size={12} />
            Parámetros {parametros.anio}
          </Badge>
          <Badge variante="slate">
            <Icon name="lock" size={11} />
            Cálculo 100% local
          </Badge>
        </div>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900 sm:text-[32px]">
          Liquidación laboral definitiva
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">
          Cesantías, intereses, prima, vacaciones, indemnización y salarios pendientes,
          con la fórmula y la norma de cada concepto.
        </p>
      </div>

      <div className="mb-6 grid gap-2 text-[11.5px] text-slate-600 sm:grid-cols-3">
        <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2">
          <span>SMMLV {parametros.anio}</span>
          <strong className="font-semibold text-slate-900">{formatCOP(parametros.smmlv)}</strong>
        </div>
        <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2">
          <span>Auxilio de transporte</span>
          <strong className="font-semibold text-slate-900">
            {formatCOP(parametros.auxilioTransporte)}
          </strong>
        </div>
        <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2">
          <span>UVT</span>
          <strong className="font-semibold text-slate-900">{formatCOP(parametros.uvt)}</strong>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-5">
          <Card>
            <SectionTitle
              icono="users"
              titulo="Trabajador y contrato"
              paso="Paso 1"
              descripcion="Datos mínimos para identificar la relación laboral."
            />
            <div className="grid gap-4 p-5 sm:grid-cols-2">
              <Field label="Nombre completo" htmlFor="nombre" error={error('nombre')}>
                <TextInput
                  id="nombre"
                  value={formulario.nombre}
                  onChange={(event) => actualizar('nombre', event.target.value)}
                  placeholder="Ana María Pérez"
                  autoComplete="off"
                />
              </Field>

              <Field
                label="Documento"
                htmlFor="documento"
                hint="Opcional. Se usa solo para identificar el caso."
              >
                <TextInput
                  id="documento"
                  value={formulario.documento}
                  onChange={(event) => actualizar('documento', event.target.value)}
                  placeholder="C.C. 1.234.567.890"
                  autoComplete="off"
                />
              </Field>

              <Field label="Tipo de contrato" htmlFor="tipoContrato">
                <Select
                  id="tipoContrato"
                  value={formulario.tipoContrato}
                  onChange={(event) =>
                    actualizar('tipoContrato', event.target.value as TipoContrato)
                  }
                >
                  {Object.entries(ETIQUETAS_CONTRATO).map(([valor, etiqueta]) => (
                    <option key={valor} value={valor}>
                      {etiqueta}
                    </option>
                  ))}
                </Select>
              </Field>

              <Field
                label="Fecha de ingreso"
                htmlFor="fechaIngreso"
                error={error('fechaIngreso')}
              >
                <TextInput
                  id="fechaIngreso"
                  type="date"
                  value={formulario.fechaIngreso}
                  onChange={(event) => actualizar('fechaIngreso', event.target.value)}
                />
              </Field>

              <Field
                label="Fecha de retiro"
                htmlFor="fechaRetiro"
                error={error('fechaRetiro')}
              >
                <TextInput
                  id="fechaRetiro"
                  type="date"
                  value={formulario.fechaRetiro}
                  onChange={(event) => actualizar('fechaRetiro', event.target.value)}
                />
              </Field>

              {formulario.tipoContrato === 'fijo' ? (
                <Field
                  label="Fecha de fin del contrato"
                  htmlFor="fechaFinContrato"
                  error={error('fechaFinContrato')}
                  hint="Necesaria para calcular la indemnización si se termina antes."
                >
                  <TextInput
                    id="fechaFinContrato"
                    type="date"
                    value={formulario.fechaFinContrato}
                    onChange={(event) =>
                      actualizar('fechaFinContrato', event.target.value)
                    }
                  />
                </Field>
              ) : null}
            </div>
          </Card>

          <Card>
            <SectionTitle
              icono="calculator"
              titulo="Salario y base de prestaciones"
              paso="Paso 2"
              descripcion="El auxilio de transporte entra en cesantías y prima, no en vacaciones."
            />
            <div className="space-y-4 p-5">
              <Checkbox
                id="salarioEsMinimo"
                checked={formulario.salarioEsMinimo}
                onChange={(valor) => actualizar('salarioEsMinimo', valor)}
                label="El trabajador devenga el salario mínimo"
                hint="Se usa el SMMLV y el auxilio vigentes en cada año del contrato, para liquidar periodos anteriores con el valor correcto."
              />

              {formulario.salarioEsMinimo ? (
                <Alert variante="info" titulo="Salario mínimo por año">
                  No necesitas ingresar el salario: cada año se toma el SMMLV y el
                  auxilio de transporte de ese año. El auxilio siempre aplica.
                </Alert>
              ) : null}

              <div>
                <span className="mb-1.5 block text-[13px] font-medium text-slate-700">
                  Tipo de salario
                </span>
                <div className="grid grid-cols-3 gap-1 rounded-xl bg-slate-100 p-1">
                  {(['fijo', 'variable', 'integral'] as const).map((tipo) => (
                    <button
                      key={tipo}
                      type="button"
                      disabled={formulario.salarioEsMinimo}
                      onClick={() => actualizar('tipoSalario', tipo)}
                      className={`rounded-lg px-2 py-1.5 text-[12.5px] font-medium transition ${
                        formulario.salarioEsMinimo
                          ? 'cursor-not-allowed opacity-40'
                          : formulario.tipoSalario === tipo
                            ? 'bg-white text-slate-900 shadow-sm'
                            : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      {ETIQUETAS_SALARIO[tipo]}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  label="Salario básico mensual"
                  htmlFor="salarioBasico"
                  error={error('salarioBasico')}
                  hint={
                    formulario.salarioEsMinimo
                      ? 'Automático: se usa el SMMLV de cada año.'
                      : 'Sin auxilio de transporte ni pagos variables.'
                  }
                >
                  <MoneyInput
                    id="salarioBasico"
                    value={formulario.salarioBasico}
                    onChange={(event) => actualizar('salarioBasico', event.target.value)}
                    placeholder={
                      formulario.salarioEsMinimo ? 'Automático (SMMLV por año)' : '1.750.905'
                    }
                    disabled={formulario.salarioEsMinimo}
                  />
                </Field>

                {formulario.tipoSalario === 'variable' ? (
                  <Field
                    label="Promedio mensual de variables"
                    htmlFor="promedioVariable"
                    error={error('promedioVariable')}
                    hint="Comisiones, bonos u horas extras de los últimos 12 meses."
                  >
                    <MoneyInput
                      id="promedioVariable"
                      value={formulario.promedioVariable}
                      onChange={(event) =>
                        actualizar('promedioVariable', event.target.value)
                      }
                      placeholder="0"
                    />
                  </Field>
                ) : (
                  <Field
                    label="Año de parámetros"
                    htmlFor="anioParametros"
                    hint="Define SMMLV, auxilio y UVT aplicables."
                  >
                    <Select
                      id="anioParametros"
                      value={formulario.anioParametros}
                      onChange={(event) =>
                        actualizar('anioParametros', event.target.value)
                      }
                    >
                      {ANIOS_DISPONIBLES.map((anio) => (
                        <option key={anio} value={anio}>
                          {anio}
                        </option>
                      ))}
                    </Select>
                  </Field>
                )}
              </div>

              {formulario.tipoSalario === 'variable' ? (
                <Field label="Año de parámetros" htmlFor="anioParametros">
                  <Select
                    id="anioParametros"
                    value={formulario.anioParametros}
                    onChange={(event) =>
                      actualizar('anioParametros', event.target.value)
                    }
                  >
                    {ANIOS_DISPONIBLES.map((anio) => (
                      <option key={anio} value={anio}>
                        {anio}
                      </option>
                    ))}
                  </Select>
                </Field>
              ) : null}

              {formulario.salarioEsMinimo ? (
                <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/70 p-3 text-[12.5px] text-slate-600">
                  <Icon name="check" size={14} className="text-teal-600" />
                  Auxilio de transporte incluido automáticamente (SMMLV ≤ 2 SMMLV).
                </div>
              ) : (
                <Checkbox
                  id="auxilioTransporte"
                  checked={formulario.recibeAuxilioTransporte}
                  onChange={(valor) => actualizar('recibeAuxilioTransporte', valor)}
                  label="Recibe auxilio de transporte"
                  hint={`Aplica hasta 2 SMMLV (${formatCOP(parametros.smmlv * 2)}). Se suma a la base de cesantías y prima.`}
                />
              )}

              {formulario.tipoSalario === 'integral' && !formulario.salarioEsMinimo ? (
                <Alert variante="info" titulo="Salario integral">
                  Las cesantías, intereses y prima ya están incluidos en el factor
                  prestacional. Solo se liquidan vacaciones, salario pendiente e
                  indemnización.
                </Alert>
              ) : null}
            </div>
          </Card>

          <Card>
            <SectionTitle
              icono="scale"
              titulo="Terminación y ajustes"
              paso="Paso 3"
              descripcion="El motivo define si hay indemnización. Los ajustes evitan pagar dos veces."
            />
            <div className="space-y-4 p-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Motivo de terminación" htmlFor="motivo">
                  <Select
                    id="motivo"
                    value={formulario.motivo}
                    onChange={(event) =>
                      actualizar('motivo', event.target.value as MotivoTerminacion)
                    }
                  >
                    {Object.entries(ETIQUETAS_MOTIVO).map(([valor, etiqueta]) => (
                      <option key={valor} value={valor}>
                        {etiqueta}
                      </option>
                    ))}
                  </Select>
                </Field>

                <Field
                  label="Días de vacaciones disfrutados"
                  htmlFor="diasVacacionesDisfrutados"
                  error={error('diasVacacionesDisfrutados')}
                  hint="Días ya tomados y pagados durante la relación."
                >
                  <TextInput
                    id="diasVacacionesDisfrutados"
                    type="number"
                    min="0"
                    step="0.5"
                    value={formulario.diasVacacionesDisfrutados}
                    onChange={(event) =>
                      actualizar('diasVacacionesDisfrutados', event.target.value)
                    }
                  />
                </Field>

                <Field
                  label="Días de salario pendiente"
                  htmlFor="diasSalarioPendiente"
                  error={error('diasSalarioPendiente')}
                  hint="Días del último periodo que aún no se han pagado."
                >
                  <TextInput
                    id="diasSalarioPendiente"
                    type="number"
                    min="0"
                    step="0.5"
                    value={formulario.diasSalarioPendiente}
                    onChange={(event) =>
                      actualizar('diasSalarioPendiente', event.target.value)
                    }
                  />
                </Field>

                {formulario.tipoContrato === 'indefinido' &&
                formulario.motivo === 'despido_sin_justa' ? (
                  <div className="sm:col-span-2">
                    <Checkbox
                      id="preavisoDado"
                      checked={formulario.preavisoDado}
                      onChange={(valor) => actualizar('preavisoDado', valor)}
                      label="Se dio preaviso de 30 días"
                      hint="Si no se dio, se suma el salario correspondiente al periodo de preaviso (Art. 46 CST)."
                    />
                  </div>
                ) : null}
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
                <p className="mb-3 text-[12px] font-semibold uppercase tracking-wide text-slate-500">
                  Ajustes de prestaciones y deducciones
                </p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field
                    label="Cesantías consignadas hasta"
                    htmlFor="cesantiasConsignadasHasta"
                    error={error('cesantiasConsignadasHasta')}
                    hint="Si ya consignaste al fondo, solo se liquida el periodo posterior."
                  >
                    <TextInput
                      id="cesantiasConsignadasHasta"
                      type="date"
                      value={formulario.cesantiasConsignadasHasta}
                      onChange={(event) =>
                        actualizar('cesantiasConsignadasHasta', event.target.value)
                      }
                    />
                  </Field>

                  <Field
                    label="Última prima pagada hasta"
                    htmlFor="ultimoPagoPrima"
                    error={error('ultimoPagoPrima')}
                    hint="Por defecto se asume pagada la prima del semestre anterior."
                  >
                    <TextInput
                      id="ultimoPagoPrima"
                      type="date"
                      value={formulario.ultimoPagoPrima}
                      onChange={(event) =>
                        actualizar('ultimoPagoPrima', event.target.value)
                      }
                    />
                  </Field>

                  <Field
                    label="Otras deducciones"
                    htmlFor="otrasDeducciones"
                    error={error('otrasDeducciones')}
                    hint="Préstamos, libranzas o embargos autorizados."
                  >
                    <MoneyInput
                      id="otrasDeducciones"
                      value={formulario.otrasDeducciones}
                      onChange={(event) =>
                        actualizar('otrasDeducciones', event.target.value)
                      }
                      placeholder="0"
                    />
                  </Field>

                  <Field
                    label="Retención en la fuente"
                    htmlFor="retencionFuente"
                    error={error('retencionFuente')}
                    hint="Valor manual. No se calcula automáticamente."
                  >
                    <MoneyInput
                      id="retencionFuente"
                      value={formulario.retencionFuente}
                      onChange={(event) =>
                        actualizar('retencionFuente', event.target.value)
                      }
                      placeholder="0"
                    />
                  </Field>
                </div>

                <div className="mt-4 space-y-3">
                  <Checkbox
                    id="incluirSancionMora"
                    checked={formulario.incluirSancionMora}
                    onChange={(valor) => actualizar('incluirSancionMora', valor)}
                    label="Incluir sanción por mora en el pago"
                    hint="Un día de salario por día de retraso, máximo 24 meses (Art. 65 CST)."
                  />

                  {formulario.incluirSancionMora ? (
                    <Field
                      label="Fecha de pago de la liquidación"
                      htmlFor="fechaPagoLiquidacion"
                      error={error('fechaPagoLiquidacion')}
                    >
                      <TextInput
                        id="fechaPagoLiquidacion"
                        type="date"
                        value={formulario.fechaPagoLiquidacion}
                        onChange={(event) =>
                          actualizar('fechaPagoLiquidacion', event.target.value)
                        }
                      />
                    </Field>
                  ) : null}
                </div>
              </div>
            </div>
          </Card>
        </div>

        <aside className="h-fit space-y-4 lg:sticky lg:top-24">
          <Card className="overflow-hidden">
            <div className="bg-slate-900 px-5 py-4 text-white">
              <p className="text-[10.5px] font-medium uppercase tracking-[0.14em] text-slate-400">
                Neto estimado
              </p>
              <p className="mt-1 text-[30px] font-semibold tracking-tight">
                {preview ? formatCOP(preview.netoPagar) : '—'}
              </p>
              <p className="mt-1 text-[11.5px] text-slate-400">
                {preview
                  ? `${preview.diasTotales} días liquidados · ${preview.conceptos.length} conceptos`
                  : 'Completa los datos para ver el cálculo'}
              </p>
            </div>

            <div className="space-y-2.5 p-5">
              <div className="flex items-center justify-between text-[12.5px]">
                <span className="text-slate-500">Total devengado</span>
                <span className="font-medium text-slate-900">
                  {preview ? formatCOP(preview.totalDevengado) : '—'}
                </span>
              </div>
              <div className="flex items-center justify-between text-[12.5px]">
                <span className="text-slate-500">Deducciones</span>
                <span className="font-medium text-slate-900">
                  {preview ? formatCOP(preview.totalDeducciones) : '—'}
                </span>
              </div>
              <div className="flex items-center justify-between text-[12.5px]">
                <span className="text-slate-500">Base de prestaciones</span>
                <span className="font-medium text-slate-900">
                  {preview ? formatCOP(preview.basePrestaciones) : '—'}
                </span>
              </div>
              <div className="flex items-center justify-between text-[12.5px]">
                <span className="text-slate-500">Auxilio de transporte</span>
                <span className="font-medium text-slate-900">
                  {preview ? formatCOP(preview.auxilio) : '—'}
                </span>
              </div>

              {preview && preview.conceptos.length > 0 ? (
                <div className="space-y-1.5 border-t border-slate-100 pt-3">
                  {preview.conceptos.slice(0, 5).map((concepto) => (
                    <div
                      key={concepto.id}
                      className="flex items-start justify-between gap-3 text-[11.5px]"
                    >
                      <span className="text-slate-500">{concepto.nombre}</span>
                      <span className="shrink-0 font-medium text-slate-700">
                        {formatCOP(concepto.valor)}
                      </span>
                    </div>
                  ))}
                  {preview.conceptos.length > 5 ? (
                    <p className="text-[11px] text-slate-400">
                      y {preview.conceptos.length - 5} conceptos más...
                    </p>
                  ) : null}
                </div>
              ) : null}

              {preview && preview.advertencias.length > 0 ? (
                <div className="flex items-start gap-1.5 rounded-lg bg-amber-50 px-2.5 py-2 text-[11px] text-amber-800">
                  <Icon name="alert" size={12} className="mt-0.5 shrink-0" />
                  <span>
                    {preview.advertencias.length} advertencia
                    {preview.advertencias.length === 1 ? '' : 's'} para revisar.
                  </span>
                </div>
              ) : null}
            </div>

            <div className="border-t border-slate-100 p-5">
              <Button onClick={calcular} tamano="lg" className="w-full">
                Calcular liquidación
                <Icon name="arrowRight" size={16} />
              </Button>
              <p className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-slate-500">
                <Icon name="lock" size={12} />
                Tus datos no salen de este navegador.
              </p>
            </div>
          </Card>

          {mostrarErrores && !validacion.ok ? (
            <Alert variante="danger" titulo="Revisa estos datos">
              <ul className="list-disc space-y-0.5 pl-4">
                {validacion.errores.map((item) => (
                  <li key={item.campo}>{item.mensaje}</li>
                ))}
              </ul>
            </Alert>
          ) : null}

          <div className="rounded-xl border border-slate-200 bg-white p-4 text-[11.5px] leading-relaxed text-slate-500">
            <p className="mb-1 flex items-center gap-1.5 font-medium text-slate-700">
              <Icon name="info" size={13} />
              Antes de pagar
            </p>
            Verifica el motivo de terminación, los días de vacaciones y si las
            cesantías ya fueron consignadas. La herramienta es una estimación y no
            reemplaza la revisión de un contador o abogado laboralista.
          </div>
        </aside>
      </div>
    </div>
  )
}
