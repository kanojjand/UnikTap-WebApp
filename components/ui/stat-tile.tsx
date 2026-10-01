import { cn } from '@/lib/utils'

export function StatTile({
  label,
  value,
  hint,
  className,
}: {
  label: string
  value: React.ReactNode
  hint?: string
  className?: string
}) {
  return (
    <div className={cn('bg-subtle rounded-xl p-3 text-center min-w-0', className)}>
      <p className="text-xs text-muted font-medium mb-1 truncate">{label}</p>
      <p className="text-base md:text-lg font-bold text-ink leading-tight break-words">{value}</p>
      {hint ? <p className="text-xs text-muted mt-1">{hint}</p> : null}
    </div>
  )
}
