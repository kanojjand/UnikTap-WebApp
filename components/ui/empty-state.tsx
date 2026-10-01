import { cn } from '@/lib/utils'

/** Пустой экран: мягкая иконка в круге, понятный заголовок и одно действие. */
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
    <div className={cn('flex flex-col items-center text-center py-12 px-4', className)}>
      {icon ? (
        <div className="w-20 h-20 rounded-full bg-primary-soft text-primary-ink flex items-center justify-center mb-4 [&_svg]:w-9 [&_svg]:h-9">
          {icon}
        </div>
      ) : null}
      <h3 className="text-lg font-bold text-ink">{title}</h3>
      {text ? <p className="text-[15px] text-muted mt-1.5 max-w-sm leading-relaxed">{text}</p> : null}
      {action ? <div className="mt-6 flex flex-wrap justify-center gap-3">{action}</div> : null}
    </div>
  )
}
