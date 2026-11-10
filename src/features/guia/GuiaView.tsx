import { Icon } from '../../components/Icon'
import { Badge, Card } from '../../components/ui'
import { formatCOP } from '../../engine/formato'
import { ANIOS_DISPONIBLES, PARAMETROS } from '../../engine/parametros'

interface Formula {
  concepto: string
  formula: string
  norma: string
  nota?: string
}

const FORMULAS: Formula[] = [
  {
    concepto: 'Cesantías',
    formula: '(Salario + Auxilio) × días / 360',
    norma: 'Art. 249 CST · Ley 50 de 1990',
    nota: 'Se consignan al fondo a más tardar el 14 de febrero del año siguiente.',
  },
  {
    concepto: 'Intereses sobre cesantías',
    formula: 'Cesantías × días × 12% / 360',
    norma: 'Ley 52 de 1975 · Art. 99 Ley 50 de 1990',
    nota: 'Se pagan directamente al trabajador, a más tardar el 31 de enero.',
  },
  {
    concepto: 'Prima de servicios',
    formula: '(Salario + Auxilio) × días / 360',
    norma: 'Arts. 306 a 308 CST',
    nota: 'Se paga por semestre: mitad antes del 30 de junio, mitad antes del 20 de diciembre.',
  },
  {
    concepto: 'Vacaciones',
    formula: 'Salario × 15 / 360 × días pendientes',
    norma: 'Arts. 186 a 192 CST',
    nota: 'La base NO incluye auxilio de transporte. 15 días por cada año de servicio.',
  },
  {
    concepto: 'Indemnización (despido sin justa causa)',
    formula: 'Variable según contrato y salario',
    norma: 'Art. 64 CST · Ley 789 de 2002',
    nota: 'Indefinido: 30/20 o 20/15 días según salario. Fijo: lo que falte del plazo (mín. 15 días). Obra: mín. 15 días.',
  },
  {
    concepto: 'Sanción por mora',
    formula: 'Un día de salario por día de retraso',
    norma: 'Art. 65 CST',
    nota: 'Máximo 24 meses. Aplica si no se paga la liquidación al terminar el contrato.',
  },
]

const PLAZOS = [
  { plazo: 'Pago de la liquidación', cuando: 'Al terminar el contrato', norma: 'Art. 65 CST' },
  { plazo: 'Cesantías al fondo', cuando: 'Antes del 14 de febrero', norma: 'Ley 50 de 1990' },
  { plazo: 'Intereses de cesantías', cuando: 'Antes del 31 de enero', norma: 'Ley 52 de 1975' },
  { plazo: 'Prima primer semestre', cuando: 'Antes del 30 de junio', norma: 'Art. 306 CST' },
  { plazo: 'Prima segundo semestre', cuando: 'Antes del 20 de diciembre', norma: 'Art. 306 CST' },
  { plazo: 'Vacaciones', cuando: 'A más tardar un año tras causarse', norma: 'Art. 187 CST' },
]

const CASOS_ESPECIALES = [
  'Sector público y trabajadores oficiales',
  'Cesantías retroactivas (régimen anterior a 1990)',
  'Convenciones colectivas, pactos o laudos',
  'Salario en especie o remuneración no salarial',
  'Fuero sindical, de maternidad o de salud',
  'Estabilidad laboral reforzada (discapacidad, prepensionados)',
  'Aprendices SENA (reglas de apoyo de sostenimiento)',
  'Trabajadores del servicio doméstico (detalles propios)',
  'Contratos con suspensión, licencias o incapacidades',
  'Remuneración variable con topes y promedios especiales',
]

const FAQ = [
  {
    pregunta: '¿El auxilio de transporte entra en las vacaciones?',
    respuesta:
      'No. El auxilio de transporte no es salario, así que no se incluye en la base de vacaciones ni en la indemnización. Sí se suma a la base de cesantías y prima, como práctica laboral extendida.',
  },
  {
    pregunta: '¿Por qué las cesantías aparecen en cero?',
    respuesta:
      'Si indicaste que ya fueron consignadas hasta la fecha de retiro, o si el salario es integral, el motor no las liquida. Revisa la fecha «Cesantías consignadas hasta».',
  },
  {
    pregunta: '¿Cómo se cuenta el tiempo: 360 o 365 días?',
    respuesta:
      'Para prestaciones sociales la ley usa años de 360 días. La app cuenta los días calendario reales (365 en un año completo) y los divide por 360 para obtener la proporción legal.',
  },
  {
    pregunta: '¿Cómo liquido un contrato que empezó en un año y terminó en otro con salario mínimo?',
    respuesta:
      'Marca «El trabajador devenga el salario mínimo» en el formulario. El motor divide el periodo por año (y por semestre para la prima) y usa el SMMLV y el auxilio vigentes en cada tramo. Las vacaciones y la indemnización usan el SMMLV del año de retiro.',
  },
  {
    pregunta: '¿Qué pasa si el trabajador tiene salario variable?',
    respuesta:
      'Debes ingresar el promedio mensual de variables de los últimos 12 meses (comisiones, bonos, horas extras). El motor lo suma al salario básico para las prestaciones.',
  },
  {
    pregunta: '¿La retención en la fuente se calcula sola?',
    respuesta:
      'No. La retención depende del régimen y la situación de cada trabajador, así que se ingresa manualmente. Verifícala con tu contador.',
  },
  {
    pregunta: '¿Qué es la sanción por mora?',
    respuesta:
      'Si no pagas la liquidación al terminar el contrato, debes un día de salario por cada día de retraso, hasta un máximo de 24 meses (Art. 65 CST). La app te permite estimarla con la fecha de pago.',
  },
]

function CardFormula({ formula }: { formula: Formula }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-[13.5px] font-semibold text-slate-900">{formula.concepto}</h3>
        <Badge variante="slate">{formula.norma}</Badge>
      </div>
      <p className="mt-2 rounded-lg bg-slate-50 px-3 py-2 font-mono text-[12px] text-slate-700">
        {formula.formula}
      </p>
      {formula.nota ? (
        <p className="mt-2 text-[11.5px] leading-relaxed text-slate-500">{formula.nota}</p>
      ) : null}
    </div>
  )
}

export function GuiaView() {
  return (
    <div className="space-y-8">
      <div>
        <Badge variante="teal">
          <Icon name="book" size={12} />
          Guía de referencia
        </Badge>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900 sm:text-[30px]">
          Cómo se calcula cada concepto
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">
          Fórmulas, plazos legales y parámetros vigentes, con la norma que respalda
          cada cálculo. Esta guía es informativa y no reemplaza la asesoría profesional.
        </p>
      </div>

      <section>
        <h2 className="mb-4 text-[16px] font-semibold text-slate-900">Fórmulas</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {FORMULAS.map((formula) => (
            <CardFormula key={formula.concepto} formula={formula} />
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-[16px] font-semibold text-slate-900">
          Parámetros por año
        </h2>
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[12.5px]">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-2.5 font-medium">Año</th>
                  <th className="px-4 py-2.5 text-right font-medium">SMMLV</th>
                  <th className="px-4 py-2.5 text-right font-medium">Auxilio de transporte</th>
                  <th className="px-4 py-2.5 text-right font-medium">UVT</th>
                </tr>
              </thead>
              <tbody>
                {ANIOS_DISPONIBLES.map((anio) => {
                  const parametros = PARAMETROS[anio]
                  return (
                    <tr key={anio} className="border-b border-slate-50 last:border-0">
                      <td className="px-4 py-3 font-medium text-slate-800">{anio}</td>
                      <td className="px-4 py-3 text-right text-slate-600">
                        {formatCOP(parametros.smmlv)}
                      </td>
                      <td className="px-4 py-3 text-right text-slate-600">
                        {formatCOP(parametros.auxilioTransporte)}
                      </td>
                      <td className="px-4 py-3 text-right text-slate-600">
                        {formatCOP(parametros.uvt)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <div className="border-t border-slate-100 px-4 py-3 text-[11.5px] text-slate-500">
            <p>
              Los valores se actualizan por decreto cada año. Verifica siempre la
              fuente oficial antes de pagar. Nota 2026: el Decreto 1469 de 2025 fue
              suspendido provisionalmente y luego reafirmado en febrero de 2026.
            </p>
          </div>
        </Card>
      </section>

      <section>
        <h2 className="mb-4 text-[16px] font-semibold text-slate-900">
          Plazos legales
        </h2>
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[12.5px]">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-2.5 font-medium">Obligación</th>
                  <th className="px-4 py-2.5 font-medium">Cuándo</th>
                  <th className="px-4 py-2.5 font-medium">Norma</th>
                </tr>
              </thead>
              <tbody>
                {PLAZOS.map((plazo) => (
                  <tr key={plazo.plazo} className="border-b border-slate-50 last:border-0">
                    <td className="px-4 py-3 font-medium text-slate-800">{plazo.plazo}</td>
                    <td className="px-4 py-3 text-slate-600">{plazo.cuando}</td>
                    <td className="px-4 py-3 text-slate-500">{plazo.norma}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </section>

      <section>
        <h2 className="mb-4 text-[16px] font-semibold text-slate-900">
          Casos que esta herramienta no cubre
        </h2>
        <Card className="p-5">
          <ul className="grid gap-x-6 gap-y-2 text-[12.5px] text-slate-600 sm:grid-cols-2">
            {CASOS_ESPECIALES.map((caso) => (
              <li key={caso} className="flex items-start gap-2">
                <Icon name="x" size={14} className="mt-0.5 shrink-0 text-rose-500" />
                <span>{caso}</span>
              </li>
            ))}
          </ul>
          <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-[11.5px] leading-relaxed text-amber-800">
            Si tu caso cae en alguna de estas categorías, consulta con un contador o
            abogado laboralista. La app no aplica regímenes especiales.
          </p>
        </Card>
      </section>

      <section>
        <h2 className="mb-4 text-[16px] font-semibold text-slate-900">
          Preguntas frecuentes
        </h2>
        <div className="space-y-3">
          {FAQ.map((item) => (
            <Card key={item.pregunta} className="p-5">
              <h3 className="flex items-start gap-2 text-[13.5px] font-semibold text-slate-900">
                <Icon name="info" size={15} className="mt-0.5 shrink-0 text-teal-600" />
                {item.pregunta}
              </h3>
              <p className="mt-2 text-[12.5px] leading-relaxed text-slate-600">
                {item.respuesta}
              </p>
            </Card>
          ))}
        </div>
      </section>
    </div>
  )
}
