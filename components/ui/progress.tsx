import { cn } from '@/lib/utils'

export function Progress({ value, className }: { value: number; className?: string }) {
  const percent = Math.round(Math.min(Math.max(value, 0), 1) * 100)
  return (
    <div className={cn('w-full', className)}>
      <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all', percent > 70 ? 'bg-green-500' : percent > 40 ? 'bg-yellow-400' : 'bg-red-400')}
          style={{ width: `${percent}%` }}
          role="progressbar"
          aria-valuenow={percent}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
    </div>
  )
}
