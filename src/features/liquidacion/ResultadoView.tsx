import { Icon } from '../../components/Icon'
import { Alert, Badge, Button, Card } from '../../components/ui'
import { ADVERTENCIA_GENERAL } from '../../engine/calculo'
import { exportarResultadosCSV } from '../../engine/csv'
import { formatearFecha } from '../../engine/fechas'
import { formatCOP, formatDias } from '../../engine/formato'
import { descargarPDF } from '../../engine/pdf'
import type { ResultadoLiquidacion } from '../../engine/types'
import { descargarTexto, slugArchivo } from '../../lib/descargas'

interface Props {
  resultado: ResultadoLiquidacion
  guardado: boolean
  onEditar: () => void
  onNueva: () => void
  onGuardar: () => void
  onIrAHistorial: () => void
}

const ETIQUETAS_MOTIVO: Record<string, string> = {
  renuncia: 'Renuncia voluntaria',
  despido_sin_justa: 'Despido sin justa causa',
  despido_con_justa: 'Despido con justa causa',
  mutuo_acuerdo: 'Mutuo acuerdo',
  fin_plazo: 'Fin del plazo pactado',
  fin_obra: 'Fin de la obra o labor',
}

export function ResultadoView({
  resultado,
  guardado,
  onEditar,
  onNueva,
  onGuardar,
  onIrAHistorial,
}: Props) {
  const { entrada } = resultado
  const nombre = entrada.empleado.nombre || 'Trabajador'

  function exportarCSV() {
    const csv = exportarResultadosCSV([
      { fila: 1, entrada, resultado },
    ])
    descargarTexto(
      `liquidacion-${slugArchivo(nombre)}-${entrada.contrato.fechaRetiro}.csv`,
      csv,
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variante="teal">
              <Icon name="check" size={12} />
              Liquidación calculada
            </Badge>
            <Badge variante="slate">
              <Icon name="lock" size={11} />
              Sin envío de datos
            </Badge>
          </div>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900 sm:text-[30px]">
            {nombre}
          </h1>
          <p className="mt-1 text-[13px] text-slate-600">
            {formatearFecha(entrada.contrato.fechaIngreso)} a{' '}
            {formatearFecha(entrada.contrato.fechaRetiro)} · {resultado.diasTotales}{' '}
            días · {ETIQUETAS_MOTIVO[entrada.terminacion.motivo] ?? entrada.terminacion.motivo}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variante="outline" tamano="sm" onClick={onEditar}>
            <Icon name="edit" size={14} />
            Editar
          </Button>
          <Button variante="outline" tamano="sm" onClick={onNueva}>
            <Icon name="plus" size={14} />
            Nueva
          </Button>
          <Button variante="outline" tamano="sm" onClick={onGuardar}>
            <Icon name={guardado ? 'check' : 'save'} size={14} />
            {guardado ? 'Guardado' : 'Guardar caso'}
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-teal-200 bg-gradient-to-br from-teal-50 to-emerald-50/60 p-4 sm:col-span-2 lg:col-span-1">
          <p className="text-[11.5px] font-medium uppercase tracking-wide text-teal-700">
            Neto a pagar
          </p>
          <p className="mt-1.5 text-[26px] font-semibold tracking-tight text-teal-900">
            {formatCOP(resultado.netoPagar)}
          </p>
          <p className="mt-0.5 text-[11.5px] text-teal-700/80">
            Después de deducciones
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-[11.5px] font-medium uppercase tracking-wide text-slate-500">
            Total devengado
          </p>
          <p className="mt-1.5 text-[20px] font-semibold tracking-tight text-slate-900">
            {formatCOP(resultado.totalDevengado)}
          </p>
          <p className="mt-0.5 text-[11.5px] text-slate-500">
            {resultado.conceptos.length} conceptos
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-[11.5px] font-medium uppercase tracking-wide text-slate-500">
            Deducciones
          </p>
          <p className="mt-1.5 text-[20px] font-semibold tracking-tight text-slate-900">
            {formatCOP(resultado.totalDeducciones)}
          </p>
          <p className="mt-0.5 text-[11.5px] text-slate-500">
            Salud, pensión y otras
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-[11.5px] font-medium uppercase tracking-wide text-slate-500">
            Tiempo liquidado
          </p>
          <p className="mt-1.5 text-[20px] font-semibold tracking-tight text-slate-900">
            {formatDias(resultado.aniosEquivalentes)} años
          </p>
          <p className="mt-0.5 text-[11.5px] text-slate-500">
            {resultado.diasTotales} días calendario
          </p>
        </div>
      </div>

      {resultado.esIntegral ? (
        <Alert variante="info" titulo="Salario integral">
          Las cesantías, intereses y prima están incluidos en el factor prestacional.
          Solo se liquidaron vacaciones, salario pendiente e indemnización.
        </Alert>
      ) : null}

      {resultado.advertencias.length > 0 ? (
        <Alert variante="warning" titulo="Advertencias del cálculo">
          <ul className="list-disc space-y-1 pl-4">
            {resultado.advertencias.map((advertencia, indice) => (
              <li key={`${advertencia}-${indice}`}>{advertencia}</li>
            ))}
          </ul>
        </Alert>
      ) : null}

      <Card className="overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5">
          <h2 className="text-[14px] font-semibold text-slate-900">Devengos</h2>
          <span className="text-[11.5px] text-slate-500">
            Base, días, fórmula y norma de cada concepto
          </span>
        </div>

        <div className="hidden overflow-x-auto md:block">
          <table className="w-full text-left text-[12.5px]">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] uppercase tracking-wide text-slate-500">
                <th className="px-4 py-2.5 font-medium">Concepto</th>
                <th className="px-4 py-2.5 text-right font-medium">Base</th>
                <th className="px-4 py-2.5 text-right font-medium">Días</th>
                <th className="px-4 py-2.5 font-medium">Fórmula</th>
                <th className="px-4 py-2.5 text-right font-medium">Valor</th>
                <th className="px-4 py-2.5 font-medium">Norma</th>
              </tr>
            </thead>
            <tbody>
              {resultado.conceptos.map((concepto) => (
                <tr key={concepto.id} className="border-b border-slate-50 last:border-0">
                  <td className="px-4 py-3 align-top">
                    <span className="font-medium text-slate-800">{concepto.nombre}</span>
                    {concepto.nota ? (
                      <span className="mt-0.5 block max-w-[260px] text-[11px] leading-relaxed text-slate-500">
                        {concepto.nota}
                      </span>
                    ) : null}
                    {concepto.detalle ? (
                      <span className="mt-1.5 block space-y-0.5 font-mono text-[10.5px] leading-relaxed text-slate-400">
                        {concepto.detalle.map((linea) => (
                          <span key={linea} className="block">
                            {linea}
                          </span>
                        ))}
                      </span>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-right align-top text-slate-600">
                    {formatCOP(concepto.base)}
                  </td>
                  <td className="px-4 py-3 text-right align-top text-slate-600">
                    {formatDias(concepto.dias)}
                  </td>
                  <td className="px-4 py-3 align-top font-mono text-[11px] text-slate-500">
                    {concepto.formula}
                  </td>
                  <td className="px-4 py-3 text-right align-top font-semibold text-slate-900">
                    {formatCOP(concepto.valor)}
                  </td>
                  <td className="px-4 py-3 align-top text-[11px] text-slate-500">
                    {concepto.norma}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-slate-50/80">
                <td colSpan={4} className="px-4 py-3 text-right text-[12px] font-medium text-slate-600">
                  Total devengado
                </td>
                <td className="px-4 py-3 text-right text-[14px] font-semibold text-slate-900">
                  {formatCOP(resultado.totalDevengado)}
                </td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>

        <div className="divide-y divide-slate-100 md:hidden">
          {resultado.conceptos.map((concepto) => (
            <div key={concepto.id} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <span className="text-[13px] font-medium text-slate-800">
                  {concepto.nombre}
                </span>
                <span className="shrink-0 text-[13px] font-semibold text-slate-900">
                  {formatCOP(concepto.valor)}
                </span>
              </div>
              <p className="mt-1 font-mono text-[10.5px] text-slate-500">
                {concepto.formula}
              </p>
              <p className="mt-1 text-[10.5px] text-slate-400">
                Base {formatCOP(concepto.base)} · {formatDias(concepto.dias)} días ·{' '}
                {concepto.norma}
              </p>
              {concepto.nota ? (
                <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
                  {concepto.nota}
                </p>
              ) : null}
              {concepto.detalle ? (
                <div className="mt-1.5 space-y-0.5 font-mono text-[10.5px] leading-relaxed text-slate-400">
                  {concepto.detalle.map((linea) => (
                    <p key={linea}>{linea}</p>
                  ))}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </Card>

      {resultado.deducciones.length > 0 ? (
        <Card className="overflow-hidden">
          <div className="border-b border-slate-100 px-5 py-3.5">
            <h2 className="text-[14px] font-semibold text-slate-900">Deducciones</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[12.5px]">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-2.5 font-medium">Concepto</th>
                  <th className="px-4 py-2.5 text-right font-medium">Base</th>
                  <th className="px-4 py-2.5 font-medium">Fórmula</th>
                  <th className="px-4 py-2.5 text-right font-medium">Valor</th>
                  <th className="px-4 py-2.5 font-medium">Norma</th>
                </tr>
              </thead>
              <tbody>
                {resultado.deducciones.map((deduccion) => (
                  <tr key={deduccion.id} className="border-b border-slate-50 last:border-0">
                    <td className="px-4 py-3">
                      <span className="font-medium text-slate-800">{deduccion.nombre}</span>
                      {deduccion.nota ? (
                        <span className="mt-0.5 block text-[11px] text-slate-500">
                          {deduccion.nota}
                        </span>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-right text-slate-600">
                      {formatCOP(deduccion.base)}
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px] text-slate-500">
                      {deduccion.formula}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-rose-700">
                      -{formatCOP(deduccion.valor)}
                    </td>
                    <td className="px-4 py-3 text-[11px] text-slate-500">
                      {deduccion.norma}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : null}

      <div className="rounded-2xl border border-teal-200 bg-gradient-to-br from-teal-50 to-emerald-50/60 p-5">
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wide text-teal-700">
              Total devengado
            </p>
            <p className="mt-1 text-[18px] font-semibold text-slate-900">
              {formatCOP(resultado.totalDevengado)}
            </p>
          </div>
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wide text-teal-700">
              Total deducciones
            </p>
            <p className="mt-1 text-[18px] font-semibold text-slate-900">
              {formatCOP(resultado.totalDeducciones)}
            </p>
          </div>
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wide text-teal-700">
              Neto a pagar
            </p>
            <p className="mt-1 text-[22px] font-semibold text-teal-900">
              {formatCOP(resultado.netoPagar)}
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button onClick={() => descargarPDF(resultado)}>
          <Icon name="download" size={15} />
          Descargar PDF
        </Button>
        <Button variante="outline" onClick={exportarCSV}>
          <Icon name="table" size={15} />
          Descargar CSV
        </Button>
        <Button variante="outline" onClick={onGuardar}>
          <Icon name={guardado ? 'check' : 'save'} size={15} />
          {guardado ? 'Caso guardado' : 'Guardar en historial'}
        </Button>
        {guardado ? (
          <Button variante="ghost" onClick={onIrAHistorial}>
            Ver historial
            <Icon name="arrowRight" size={14} />
          </Button>
        ) : null}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 text-[11.5px] leading-relaxed text-slate-500">
        <p className="mb-1 flex items-center gap-1.5 font-medium text-slate-700">
          <Icon name="shield" size={13} />
          Parámetros y alcance
        </p>
        <p>
          SMMLV {resultado.parametros.anio}: {formatCOP(resultado.parametros.smmlv)} ·
          Auxilio: {formatCOP(resultado.parametros.auxilioTransporte)} · UVT:{' '}
          {formatCOP(resultado.parametros.uvt)}. Fuente: {resultado.parametros.fuente}
        </p>
        <p className="mt-2">{ADVERTENCIA_GENERAL}</p>
      </div>
    </div>
  )
}
