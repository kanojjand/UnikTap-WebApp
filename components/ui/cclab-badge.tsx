import { cn } from '@/lib/utils'

const MARK_PATHS = [
  'M229.8 1L320.2 79V135.6H278V97.8L229.1 55.8L119.6 143.2V207.5L216.3 290.2L278 240.6V206.1H320.2V260L215.5 344.5L75.6 226.2V125.8Z',
  'M92 0.3L147.9 47.8L115.5 74.7L92.4 55.1L43 96.1V250.9L89.5 290.6L110.1 274.4L140.9 300.7L88.4 344.6L0.3 269.3V77.7Z',
  'M219 123.8L229.9 163.8L269 175.2L230.2 186.7L219 226.5L208.1 186.9L167.8 175.2L208.1 164.1Z',
]

/** Знак CC Lab (двойная шестиугольная «C» со звездой). Цвет — currentColor. */
export function CcLabMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 321 345" fill="currentColor" aria-hidden className={cn('h-4 w-auto', className)}>
      {MARK_PATHS.map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  )
}

/** Метка «by CC Lab» со ссылкой на сайт лаборатории. */
export function CcLabBadge({ className }: { className?: string }) {
  return (
    <a
      href="https://cclab.kz"
      target="_blank"
      rel="noopener"
      className={cn(
        'inline-flex items-center gap-1.5 h-7 px-2.5 rounded-full border border-line text-[12px] font-semibold text-muted hover:text-ink hover:border-ink/30 transition-colors whitespace-nowrap',
        className,
      )}
    >
      <span>by</span>
      <CcLabMark className="h-3.5 text-ink" />
      <span className="text-ink">CC Lab</span>
    </a>
  )
}
