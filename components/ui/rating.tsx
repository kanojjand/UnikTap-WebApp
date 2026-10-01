'use client'

import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'

export function Rating({ value, size = 16, className }: { value: number; size?: number; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-0.5', className)} role="img" aria-label={`${value} из 5`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          width={size}
          height={size}
          className={star <= Math.round(value) ? 'text-yellow-400' : 'text-line'}
          fill="currentColor"
          strokeWidth={0}
          aria-hidden
        />
      ))}
    </span>
  )
}

export function RatingInput({
  value,
  onChange,
  label,
  size = 28,
}: {
  value: number
  onChange: (value: number) => void
  label: string
  size?: number
}) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className="inline-flex items-center"
      onKeyDown={(event) => {
        if (event.key === 'ArrowRight' || event.key === 'ArrowUp') {
          event.preventDefault()
          onChange(Math.min(5, value + 1))
        }
        if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') {
          event.preventDefault()
          onChange(Math.max(1, value - 1))
        }
      }}
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          role="radio"
          aria-checked={star === value}
          aria-label={`${star}`}
          tabIndex={star === value || (value === 0 && star === 1) ? 0 : -1}
          onClick={() => onChange(star)}
          // Зона нажатия 44×44 даже для маленьких звёзд
          className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary active:scale-90 transition-transform motion-reduce:transform-none"
        >
          <Star
            width={size}
            height={size}
            className={cn('transition-colors', star <= value ? 'text-yellow-400' : 'text-line')}
            fill="currentColor"
            strokeWidth={0}
          />
        </button>
      ))}
    </div>
  )
}
