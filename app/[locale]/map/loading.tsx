import { Skeleton } from '@/components/ui/skeleton'

export default function Loading() {
  return (
    <div
      className="flex flex-col h-[100dvh] md:h-[calc(100dvh-4rem)] pb-[calc(60px+env(safe-area-inset-bottom))] md:pb-6"
      role="status"
      aria-label="Загрузка"
    >
      <div className="container-app pt-safe pb-3 md:pb-4">
        <Skeleton className="h-8 w-32" />
      </div>
      <div className="flex-1 w-full md:mx-auto md:max-w-6xl md:px-6">
        <Skeleton className="h-full rounded-none md:rounded-2xl" />
      </div>
    </div>
  )
}
