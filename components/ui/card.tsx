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
        'bg-surface rounded-2xl p-4 shadow-card border border-line',
        interactive &&
          'transition-[transform,box-shadow] duration-150 active:scale-[0.99] hover:shadow-lift cursor-pointer motion-reduce:transform-none',
        className,
      )}
      {...props}
    />
  )
}
