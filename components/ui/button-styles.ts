import { cn } from '@/lib/utils'

export type ButtonVariant = 'primary' | 'secondary' | 'soft' | 'whatsapp' | 'ghost' | 'danger'
export type ButtonSize = 'sm' | 'md' | 'lg'

const VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-primary hover:bg-primary-hover text-white font-semibold shadow-sm',
  secondary: 'bg-surface hover:bg-subtle text-ink font-semibold border border-line',
  soft: 'bg-primary-soft text-primary-ink font-semibold hover:brightness-95',
  whatsapp: 'bg-whatsapp hover:bg-whatsappHover text-white font-semibold',
  ghost: 'text-body hover:bg-subtle font-medium',
  danger: 'bg-danger-solid hover:brightness-95 text-white font-semibold',
}

// Минимальная высота 44–52px — кнопка не меньше подушечки пальца
const SIZES: Record<ButtonSize, string> = {
  sm: 'px-3.5 text-sm min-h-[44px]',
  md: 'px-4 text-[15px] min-h-[48px]',
  lg: 'px-6 text-base min-h-[52px]',
}

/**
 * Стили кнопки. Отдельный модуль без 'use client', чтобы ссылки-кнопки
 * в серверных компонентах выглядели так же (и без <button> внутри <a>).
 */
export function buttonClass(variant: ButtonVariant = 'primary', size: ButtonSize = 'md', fullWidth = false) {
  return cn(
    'inline-flex items-center justify-center gap-2 rounded-xl select-none text-center',
    'transition-[background-color,transform,filter] duration-150 active:scale-[0.97]',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-canvas',
    'disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100',
    'motion-reduce:transform-none',
    VARIANTS[variant],
    SIZES[size],
    fullWidth && 'w-full',
  )
}
