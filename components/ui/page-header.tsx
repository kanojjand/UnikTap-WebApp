import { cn } from '@/lib/utils'
import { BackLink } from './back-link'

export { BackLink }

/** Заголовок страницы: крупный, спокойный, с одним действием справа. */
export function PageHeader({
  title,
  subtitle,
  action,
  backHref,
  backLabel = 'Назад',
  className,
}: {
  title: React.ReactNode
  subtitle?: React.ReactNode
  action?: React.ReactNode
  backHref?: string
  backLabel?: string
  className?: string
}) {
  return (
    <header className={cn('container-app pt-safe pb-4 md:pb-6', className)}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          {backHref ? <BackLink href={backHref} label={backLabel} /> : null}
          <h1 className="text-[26px] md:text-3xl font-bold tracking-tight text-ink leading-tight">{title}</h1>
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      {subtitle ? <p className="text-[15px] text-muted mt-1.5 max-w-2xl">{subtitle}</p> : null}
    </header>
  )
}
