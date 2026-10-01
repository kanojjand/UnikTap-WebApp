import { PageSkeleton, Skeleton } from '@/components/ui/skeleton'

export default function Loading() {
  return (
    <PageSkeleton>
      <div className="lg:grid lg:grid-cols-[340px_minmax(0,1fr)] lg:gap-8 space-y-4 lg:space-y-0">
        <div className="space-y-4">
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-14 rounded-2xl" />
        </div>
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    </PageSkeleton>
  )
}
