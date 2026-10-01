'use client'

import { forwardRef, useId } from 'react'
import { cn } from '@/lib/utils'

type Surface = 'header' | 'light' | 'admin'

// text-base (16px) обязателен: при меньшем шрифте iOS зумит страницу при фокусе
const BASE =
  'w-full min-w-0 text-base text-ink placeholder:text-muted rounded-xl min-h-[48px] px-4 py-3 outline-none transition-colors ' +
  'disabled:opacity-60 disabled:cursor-not-allowed'

const SURFACES: Record<Surface, string> = {
  header: 'bg-surface border border-line shadow-sm focus:border-primary focus:ring-2 focus:ring-primary/20',
  light: 'bg-subtle border border-transparent focus:bg-surface focus:border-primary focus:ring-2 focus:ring-primary/20',
  admin: 'bg-canvas border border-line focus:border-primary focus:ring-1 focus:ring-primary md:text-sm',
}

interface FieldProps {
  label?: string
  error?: string
  hint?: string
  required?: boolean
  children: (props: { id: string; describedBy?: string; invalid: boolean }) => React.ReactNode
  className?: string
}

export function Field({ label, error, hint, required, children, className }: FieldProps) {
  const id = useId()
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined

  return (
    <div className={cn('w-full', className)}>
      {label ? (
        <label htmlFor={id} className="block text-sm font-semibold text-body mb-1.5">
          {label}
          {required ? (
            <span className="text-danger" aria-hidden>
              {' '}
              *
            </span>
          ) : null}
        </label>
      ) : null}
      {children({ id, describedBy, invalid: Boolean(error) })}
      {hint && !error ? (
        <p id={`${id}-hint`} className="text-sm text-muted mt-1.5">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={`${id}-error`} role="alert" className="text-sm text-danger mt-1.5">
          {error}
        </p>
      ) : null}
    </div>
  )
}

export const Input = forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & { surface?: Surface; invalid?: boolean }
>(function Input({ surface = 'light', invalid, className, ...props }, ref) {
  return (
    <input
      ref={ref}
      aria-invalid={invalid || undefined}
      className={cn(BASE, SURFACES[surface], invalid && 'border-danger focus:border-danger', className)}
      {...props}
    />
  )
})

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement> & { surface?: Surface; invalid?: boolean }
>(function Textarea({ surface = 'light', invalid, className, ...props }, ref) {
  return (
    <textarea
      ref={ref}
      aria-invalid={invalid || undefined}
      className={cn(
        BASE,
        'leading-relaxed',
        SURFACES[surface],
        invalid && 'border-danger focus:border-danger',
        className,
      )}
      {...props}
    />
  )
})

/** Стрелка вниз (класс в globals.css) показывает, что это выпадающий список, а не текст. */
const CHEVRON = 'select-chevron pr-10'

export const Select = forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement> & { surface?: Surface; invalid?: boolean }
>(function Select({ surface = 'light', invalid, className, children, ...props }, ref) {
  return (
    <select
      ref={ref}
      aria-invalid={invalid || undefined}
      className={cn(
        BASE,
        'appearance-none cursor-pointer',
        CHEVRON,
        SURFACES[surface],
        invalid && 'border-danger',
        className,
      )}
      {...props}
    >
      {children}
    </select>
  )
})

export function Switch({
  checked,
  onChange,
  label,
  disabled,
}: {
  checked: boolean
  onChange: (value: boolean) => void
  label: string
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
        checked ? 'bg-primary' : 'bg-line',
        disabled && 'opacity-50 cursor-not-allowed',
      )}
    >
      <span
        className={cn(
          'inline-block h-6 w-6 transform rounded-full bg-white shadow transition-transform',
          checked ? 'translate-x-[22px]' : 'translate-x-0.5',
        )}
      />
    </button>
  )
}
