import { cn } from '@/lib/utils'

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse bg-subtle rounded-xl', className)} aria-hidden />
}

export function UniversityCardSkeleton() {
  return (
    <div className="bg-surface rounded-2xl p-4 border border-line flex gap-4">
      <Skeleton className="w-16 h-16 md:w-20 md:h-20 shrink-0" />
      <div className="flex-1 space-y-2.5">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/3" />
        <Skeleton className="h-3 w-1/2" />
        <div className="flex gap-2 pt-1">
          <Skeleton className="h-6 w-24 rounded-full" />
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
      </div>
    </div>
  )
}

/** Сетка карточек: 1 колонка на телефоне, 2 — на планшете и компьютере. */
export const CARD_GRID = 'grid grid-cols-1 gap-3 md:gap-4 md:grid-cols-2'

export function ListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className={CARD_GRID} role="status" aria-label="Загрузка">
      {Array.from({ length: count }).map((_, index) => (
        <UniversityCardSkeleton key={index} />
      ))}
    </div>
  )
}

export function TableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="bg-surface rounded-2xl border border-line divide-y divide-line">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="p-4">
          <Skeleton className="h-5 w-full" />
        </div>
      ))}
    </div>
  )
}

/** Заголовок страницы-скелетон для loading.tsx */
export function PageSkeleton({ children }: { children?: React.ReactNode }) {
  return (
    <div className="pb-nav" role="status" aria-label="Загрузка">
      <div className="container-app pt-safe md:pt-8 pb-4">
        <Skeleton className="h-8 w-48" />
      </div>
      <div className="container-app">{children ?? <ListSkeleton />}</div>
    </div>
  )
}
