'use client'

import { forwardRef, useId } from 'react'
import { cn } from '@/lib/utils'

type Surface = 'header' | 'light' | 'admin'

const SURFACES: Record<Surface, string> = {
  header: 'bg-white rounded-xl py-3 px-4 border-none shadow-sm outline-none text-gray-700',
  light: 'bg-softBlue rounded-xl px-4 py-3 border-none outline-none focus:ring-2 focus:ring-corpBlue/50',
  admin:
    'bg-slateBg border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-corpBlue focus:ring-1 focus:ring-corpBlue',
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
        <label htmlFor={id} className="block text-sm font-bold text-gray-700 mb-1">
          {label}
          {required ? <span className="text-red-500"> *</span> : null}
        </label>
      ) : null}
      {children({ id, describedBy, invalid: Boolean(error) })}
      {hint && !error ? (
        <p id={`${id}-hint`} className="text-xs text-gray-500 mt-1">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={`${id}-error`} className="text-xs text-red-600 mt-1">
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
      className={cn('w-full', SURFACES[surface], invalid && 'border border-red-400', className)}
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
      className={cn('w-full leading-relaxed', SURFACES[surface], invalid && 'border border-red-400', className)}
      {...props}
    />
  )
})

export const Select = forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement> & { surface?: Surface; invalid?: boolean }
>(function Select({ surface = 'light', invalid, className, children, ...props }, ref) {
  return (
    <select
      ref={ref}
      aria-invalid={invalid || undefined}
      className={cn('w-full appearance-none', SURFACES[surface], invalid && 'border border-red-400', className)}
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
        'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-corpBlue focus-visible:ring-offset-2',
        checked ? 'bg-corpBlue' : 'bg-gray-300',
        disabled && 'opacity-50 cursor-not-allowed',
      )}
    >
      <span
        className={cn(
          'inline-block h-5 w-5 transform rounded-full bg-white transition-transform',
          checked ? 'translate-x-5' : 'translate-x-0.5',
        )}
      />
    </button>
  )
}
