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
      className={cn(
        'shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap min-h-[36px]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-corpBlue',
        active ? 'bg-corpBlue text-white' : 'bg-white text-gray-600 border border-gray-200',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}
