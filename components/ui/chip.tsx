'use client'

import { cn } from '@/lib/utils'

export function Chip({
  active,
  className,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      className={cn(
        'shrink-0 inline-flex items-center gap-1.5 rounded-full px-4 text-sm font-medium whitespace-nowrap min-h-[44px]',
        'transition-colors active:scale-[0.97] motion-reduce:transform-none',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
        active
          ? 'bg-primary text-white border border-primary'
          : 'bg-surface text-body border border-line hover:border-muted/50',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}
