import { PageSkeleton, Skeleton } from '@/components/ui/skeleton'

export default function Loading() {
  return (
    <PageSkeleton>
      <div className="max-w-4xl space-y-5">
        <Skeleton className="h-12" />
        <Skeleton className="h-72 rounded-2xl" />
      </div>
    </PageSkeleton>
  )
}
