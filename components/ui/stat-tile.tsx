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
    <div className={cn('bg-softBlue rounded-xl p-3 text-center', className)}>
      <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">{label}</p>
      <p className="text-lg font-bold text-corpBlue leading-tight">{value}</p>
      {hint ? <p className="text-[10px] text-gray-400 mt-1">{hint}</p> : null}
    </div>
  )
}
