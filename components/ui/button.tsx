'use client'

import { forwardRef } from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

type Variant = 'primary' | 'secondary' | 'soft' | 'whatsapp' | 'ghost' | 'danger'
type Size = 'sm' | 'md' | 'lg'

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-corpBlue hover:bg-corpBlueHover text-white font-bold',
  secondary: 'bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold',
  soft: 'bg-softBlue text-corpBlue font-medium hover:bg-blue-100',
  whatsapp: 'bg-whatsapp hover:bg-whatsappHover text-white font-bold',
  ghost: 'text-gray-600 hover:bg-gray-100 font-medium',
  danger: 'bg-red-600 hover:bg-red-700 text-white font-bold',
}

const SIZES: Record<Size, string> = {
  sm: 'py-2 px-3 text-sm min-h-[36px]',
  md: 'py-3 px-4 text-sm min-h-[44px]',
  lg: 'py-3 px-6 text-base min-h-[48px]',
}

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
  fullWidth?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', loading, fullWidth, className, children, disabled, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-xl transition-colors',
        'active:scale-[0.98] transition-transform',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-corpBlue focus-visible:ring-offset-2',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100',
        'motion-reduce:transform-none motion-reduce:transition-none',
        VARIANTS[variant],
        SIZES[size],
        fullWidth && 'w-full',
        className,
      )}
      {...props}
    >
      {loading ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden /> : children}
    </button>
  )
})
