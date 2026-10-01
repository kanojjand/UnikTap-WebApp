import { Skeleton } from '@/components/ui/skeleton'

export default function Loading() {
  return (
    <div className="pb-32" role="status" aria-label="Загрузка">
      <div className="mx-auto w-full max-w-6xl md:px-6 md:pt-6">
        <Skeleton className="hidden md:block h-5 w-40 mb-5" />
        <Skeleton className="h-52 md:h-72 rounded-none md:rounded-3xl" />
      </div>
      <div className="container-app">
        <Skeleton className="w-20 h-20 md:w-24 md:h-24 -mt-10 md:-mt-12 rounded-2xl border-4 border-canvas" />
        <Skeleton className="h-8 w-3/4 mt-4" />
        <Skeleton className="h-5 w-1/2 mt-3" />
        <div className="grid grid-cols-3 gap-2 mt-5 lg:max-w-xl">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-16" />
          ))}
        </div>
        <Skeleton className="h-12 mt-6" />
        <div className="space-y-2 mt-5">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-11/12" />
          <Skeleton className="h-4 w-4/5" />
        </div>
      </div>
    </div>
  )
}
