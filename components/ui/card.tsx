import { cn } from '@/lib/utils'

export function Card({
  className,
  interactive,
  as = 'div',
  ...props
}: React.HTMLAttributes<HTMLElement> & { interactive?: boolean; as?: 'div' | 'article' | 'section' | 'li' }) {
  const Tag = as as React.ElementType
  return (
    <Tag
      className={cn(
        'bg-white rounded-2xl p-4 shadow-card border border-gray-100',
        interactive && 'active:scale-[0.98] transition-transform cursor-pointer motion-reduce:transform-none',
        className,
      )}
      {...props}
    />
  )
}
