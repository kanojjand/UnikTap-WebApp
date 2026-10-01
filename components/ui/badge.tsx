import { cn } from '@/lib/utils'

type Tone = 'neutral' | 'success' | 'warning' | 'danger' | 'info'

const TONES: Record<Tone, string> = {
  neutral: 'bg-subtle text-body',
  success: 'bg-success-soft text-success',
  warning: 'bg-warning-soft text-warning',
  danger: 'bg-danger-soft text-danger',
  info: 'bg-primary-soft text-primary-ink',
}

export function Badge({
  tone = 'neutral',
  mini,
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: Tone; mini?: boolean }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 font-semibold max-w-full',
        // Короткие метки не переносятся; длинные (аккредитация) переносятся, а не растягивают экран
        mini ? 'text-xs px-2 py-0.5 rounded-full whitespace-nowrap' : 'text-xs px-3 py-1 rounded-2xl',
        TONES[tone],
        className,
      )}
      {...props}
    />
  )
}
