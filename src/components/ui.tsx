import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from 'react'
import { Icon } from './Icon'
import type { IconName } from './Icon'

export function Card({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={`rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)] ${className}`}
    >
      {children}
    </div>
  )
}

type VarianteBoton = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
type TamanoBoton = 'sm' | 'md' | 'lg'

const variantesBoton: Record<VarianteBoton, string> = {
  primary: 'bg-teal-600 text-white shadow-sm hover:bg-teal-700 active:bg-teal-800',
  secondary: 'bg-slate-900 text-white shadow-sm hover:bg-slate-800',
  outline: 'border border-slate-300 bg-white text-slate-700 hover:border-slate-400 hover:bg-slate-50',
  ghost: 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
  danger: 'bg-rose-600 text-white shadow-sm hover:bg-rose-700',
}

const tamanosBoton: Record<TamanoBoton, string> = {
  sm: 'h-9 gap-1.5 px-3 text-[13px]',
  md: 'h-10 gap-2 px-4 text-sm',
  lg: 'h-12 gap-2 px-5 text-[15px]',
}

export function Button({
  variante = 'primary',
  tamano = 'md',
  className = '',
  type = 'button',
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variante?: VarianteBoton
  tamano?: TamanoBoton
}) {
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center rounded-xl font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${variantesBoton[variante]} ${tamanosBoton[tamano]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

export function Field({
  label,
  htmlFor,
  hint,
  error,
  children,
  className = '',
}: {
  label: string
  htmlFor?: string
  hint?: string
  error?: string
  children: ReactNode
  className?: string
}) {
  return (
    <div className={className}>
      <label
        htmlFor={htmlFor}
        className="mb-1.5 block text-[13px] font-medium text-slate-700"
      >
        {label}
      </label>
      {children}
      {error ? (
        <p className="mt-1.5 flex items-start gap-1 text-[11.5px] font-medium text-rose-600">
          <Icon name="alert" size={12} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </p>
      ) : hint ? (
        <p className="mt-1.5 text-[11.5px] leading-relaxed text-slate-500">{hint}</p>
      ) : null}
    </div>
  )
}

const claseInput =
  'h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 disabled:bg-slate-100'

export function TextInput({
  className = '',
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={`${claseInput} ${className}`} {...props} />
}

export function MoneyInput({
  className = '',
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">
        $
      </span>
      <input
        inputMode="numeric"
        className={`${claseInput} pl-7 ${className}`}
        {...props}
      />
    </div>
  )
}

export function Select({
  className = '',
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative">
      <select
        className={`${claseInput} appearance-none pr-9 ${className}`}
        {...props}
      >
        {children}
      </select>
      <Icon
        name="chevronDown"
        size={16}
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
      />
    </div>
  )
}

export function Textarea({
  className = '',
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={`w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 ${className}`}
      {...props}
    />
  )
}

export function Checkbox({
  id,
  checked,
  onChange,
  label,
  hint,
}: {
  id: string
  checked: boolean
  onChange: (valor: boolean) => void
  label: string
  hint?: string
}) {
  return (
    <label
      htmlFor={id}
      className="flex cursor-pointer items-start gap-2.5 rounded-xl border border-slate-200 bg-slate-50/70 p-3 transition hover:border-slate-300 hover:bg-slate-50"
    >
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
      />
      <span>
        <span className="block text-[13px] font-medium leading-snug text-slate-700">
          {label}
        </span>
        {hint ? (
          <span className="mt-0.5 block text-[11.5px] leading-relaxed text-slate-500">
            {hint}
          </span>
        ) : null}
      </span>
    </label>
  )
}

type VarianteBadge = 'teal' | 'slate' | 'amber' | 'rose' | 'blue'

const variantesBadge: Record<VarianteBadge, string> = {
  teal: 'bg-teal-50 text-teal-700 ring-teal-600/15',
  slate: 'bg-slate-100 text-slate-600 ring-slate-500/15',
  amber: 'bg-amber-50 text-amber-700 ring-amber-600/15',
  rose: 'bg-rose-50 text-rose-700 ring-rose-600/15',
  blue: 'bg-blue-50 text-blue-700 ring-blue-600/15',
}

export function Badge({
  children,
  variante = 'slate',
  className = '',
}: {
  children: ReactNode
  variante?: VarianteBadge
  className?: string
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-medium ring-1 ring-inset ${variantesBadge[variante]} ${className}`}
    >
      {children}
    </span>
  )
}

type VarianteAlert = 'info' | 'warning' | 'danger' | 'success'

const variantesAlert: Record<
  VarianteAlert,
  { caja: string; icono: IconName; color: string }
> = {
  info: { caja: 'border-blue-200 bg-blue-50/70 text-blue-900', icono: 'info', color: 'text-blue-600' },
  warning: { caja: 'border-amber-200 bg-amber-50/70 text-amber-900', icono: 'alert', color: 'text-amber-600' },
  danger: { caja: 'border-rose-200 bg-rose-50/70 text-rose-900', icono: 'alert', color: 'text-rose-600' },
  success: { caja: 'border-emerald-200 bg-emerald-50/70 text-emerald-900', icono: 'check', color: 'text-emerald-600' },
}

export function Alert({
  variante = 'info',
  titulo,
  children,
  className = '',
}: {
  variante?: VarianteAlert
  titulo?: string
  children: ReactNode
  className?: string
}) {
  const config = variantesAlert[variante]
  return (
    <div className={`rounded-xl border p-3.5 text-[12.5px] leading-relaxed ${config.caja} ${className}`}>
      <div className="flex items-start gap-2.5">
        <Icon name={config.icono} size={16} className={`mt-0.5 shrink-0 ${config.color}`} />
        <div>
          {titulo ? <p className="mb-0.5 font-semibold">{titulo}</p> : null}
          <div>{children}</div>
        </div>
      </div>
    </div>
  )
}

export function SectionTitle({
  icono,
  titulo,
  descripcion,
  paso,
}: {
  icono: IconName
  titulo: string
  descripcion?: string
  paso?: string
}) {
  return (
    <div className="flex items-start gap-3 border-b border-slate-100 px-5 py-4">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-teal-50 text-teal-700">
        <Icon name={icono} size={18} />
      </span>
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <h2 className="text-[15px] font-semibold tracking-tight text-slate-900">{titulo}</h2>
          {paso ? <Badge variante="slate">{paso}</Badge> : null}
        </div>
        {descripcion ? (
          <p className="mt-0.5 text-[12px] leading-relaxed text-slate-500">{descripcion}</p>
        ) : null}
      </div>
    </div>
  )
}

export function Stat({
  etiqueta,
  valor,
  detalle,
  destacado = false,
}: {
  etiqueta: string
  valor: string
  detalle?: string
  destacado?: boolean
}) {
  return (
    <div
      className={`rounded-2xl border p-4 ${
        destacado
          ? 'border-teal-200 bg-gradient-to-br from-teal-50 to-emerald-50/60'
          : 'border-slate-200 bg-white'
      }`}
    >
      <p className="text-[11.5px] font-medium uppercase tracking-wide text-slate-500">
        {etiqueta}
      </p>
      <p
        className={`mt-1.5 text-[22px] font-semibold tracking-tight ${
          destacado ? 'text-teal-800' : 'text-slate-900'
        }`}
      >
        {valor}
      </p>
      {detalle ? <p className="mt-0.5 text-[11.5px] text-slate-500">{detalle}</p> : null}
    </div>
  )
}
