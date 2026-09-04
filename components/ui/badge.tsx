import { cn } from '@/lib/utils'

type Tone = 'neutral' | 'success' | 'warning' | 'danger' | 'info'

const TONES: Record<Tone, string> = {
  neutral: 'bg-gray-100 text-gray-600',
  success: 'bg-green-100 text-green-700',
  warning: 'bg-yellow-100 text-yellow-700',
  danger: 'bg-red-100 text-red-700',
  info: 'bg-softBlue text-corpBlue',
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
        'inline-flex items-center gap-1 rounded-full font-semibold',
        mini ? 'text-[10px] px-2 py-0.5' : 'text-xs px-3 py-1',
        TONES[tone],
        className,
      )}
      {...props}
    />
  )
}
