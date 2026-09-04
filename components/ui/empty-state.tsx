import { cn } from '@/lib/utils'

export function EmptyState({
  icon,
  title,
  text,
  action,
  className,
}: {
  icon?: React.ReactNode
  title: string
  text?: string
  action?: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex flex-col items-center text-center py-10 px-4', className)}>
      {icon ? <div className="text-gray-300 mb-3">{icon}</div> : null}
      <h3 className="font-bold text-gray-700">{title}</h3>
      {text ? <p className="text-sm text-gray-500 mt-1 max-w-prose">{text}</p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  )
}
