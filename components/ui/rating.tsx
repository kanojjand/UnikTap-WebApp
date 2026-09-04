'use client'

import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'

export function Rating({
  value,
  size = 16,
  className,
}: {
  value: number
  size?: number
  className?: string
}) {
  return (
    <span className={cn('inline-flex items-center gap-0.5', className)} aria-label={`${value} из 5`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          width={size}
          height={size}
          className={star <= Math.round(value) ? 'text-yellow-400' : 'text-gray-300'}
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
  size = 24,
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
      className="inline-flex items-center gap-1"
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
          className="p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-corpBlue rounded"
        >
          <Star
            width={size}
            height={size}
            className={star <= value ? 'text-yellow-400' : 'text-gray-300'}
            fill="currentColor"
            strokeWidth={0}
          />
        </button>
      ))}
    </div>
  )
}
