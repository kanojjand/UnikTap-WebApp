import { ListSkeleton, Skeleton } from '@/components/ui/skeleton'

/** Мгновенный отклик при переходе: скелетон вместо «замершего» экрана. */
export default function Loading() {
  return (
    <div className="pb-nav" role="status" aria-label="Загрузка">
      <div className="container-app pt-safe pb-2 space-y-3">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-5 w-80 max-w-full" />
        <Skeleton className="h-14 max-w-2xl rounded-2xl" />
      </div>
      <div className="container-app mt-5 lg:grid lg:grid-cols-[300px_minmax(0,1fr)] lg:gap-8">
        <Skeleton className="h-36 rounded-2xl mb-6 lg:mb-0" />
        <div className="space-y-4">
          <div className="flex gap-2 overflow-hidden">
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton key={index} className="h-11 w-28 rounded-full shrink-0" />
            ))}
          </div>
          <ListSkeleton count={6} />
        </div>
      </div>
    </div>
  )
}
