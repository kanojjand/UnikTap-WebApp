import { PageHeader } from '@/components/admin/page-header'
import { ReviewsQueue } from '@/components/admin/reviews-queue'
import { adminReports, adminReviews } from '@/lib/queries/admin'

export default async function AdminReviewsPage() {
  const [pending, approved, rejected, reports] = await Promise.all([
    adminReviews('pending'),
    adminReviews('approved'),
    adminReviews('rejected'),
    adminReports(),
  ])

  return (
    <>
      <PageHeader title="Отзывы" subtitle="Очередь модерации и жалобы пользователей" />
      <ReviewsQueue pending={pending} approved={approved} rejected={rejected} reports={reports} />
    </>
  )
}
