import { MessageSquareOff } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import { Card } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { Rating } from '@/components/ui/rating'
import { majorName } from '@/lib/utils'
import { summarizeReviews } from '@/lib/queries/reviews'
import type { Review, UniversityMajor } from '@/types/domain'
import { ReviewCard } from './review-card'
import { ReviewForm } from './review-form'
import { ReviewsSort } from './reviews-sort'

export async function ReviewsTab({
  universityId,
  reviews,
  majors,
  locale,
  isGuest,
  votes,
  myReview,
  minReviews,
}: {
  universityId: string
  reviews: Review[]
  majors: UniversityMajor[]
  locale: string
  isGuest: boolean
  votes: Set<string>
  myReview: Review | null
  minReviews: number
}) {
  const t = await getTranslations('reviews')
  const summary = summarizeReviews(reviews)
  const majorNames = new Map(
    majors.map((major) => [major.id, majorName(major, locale)]),
  )

  const form = (
    <ReviewForm universityId={universityId} majors={majors} locale={locale} isGuest={isGuest} existing={myReview} />
  )

  const status =
    myReview && myReview.status !== 'approved' ? (
      <p className="text-sm text-center text-warning bg-warning-soft rounded-xl p-3" role="status">
        {myReview.status === 'pending' ? t('statusPending') : `${t('statusRejected')}: ${myReview.moderation_comment}`}
      </p>
    ) : null

  if (reviews.length === 0) {
    return (
      <div className="space-y-4">
        {status}
        <EmptyState icon={<MessageSquareOff />} title={t('emptyTitle')} text={t('emptyText')} action={form} />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <Card className="p-5">
        <div className="flex items-center gap-5">
          <div className="text-center shrink-0">
            <p className="text-4xl font-bold text-ink leading-none">
              {summary.count >= minReviews ? summary.average.toFixed(1) : '—'}
            </p>
            <Rating value={summary.average} className="mt-2" />
            <p className="text-sm text-muted mt-1">{t('total', { count: summary.count })}</p>
          </div>

          <div className="flex-1 space-y-1.5" aria-hidden>
            {[5, 4, 3, 2, 1].map((star) => {
              const value = summary.distribution[star as 1 | 2 | 3 | 4 | 5]
              const percent = summary.count === 0 ? 0 : Math.round((value / summary.count) * 100)
              return (
                <div key={star} className="flex items-center gap-2">
                  <span className="text-xs text-muted w-3">{star}</span>
                  <div className="h-2 flex-1 rounded-full bg-subtle overflow-hidden">
                    <div className="h-full bg-yellow-400 rounded-full" style={{ width: `${percent}%` }} />
                  </div>
                  <span className="text-xs text-muted w-6 text-right">{value}</span>
                </div>
              )
            })}
          </div>
        </div>

        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 mt-5 pt-4 border-t border-line">
          {(['teaching', 'facilities', 'dormitory', 'career', 'social'] as const).map((key) => (
            <div key={key} className="flex justify-between text-[15px]">
              <dt className="text-muted">{t(key)}</dt>
              <dd className="font-semibold text-ink">{summary.criteria[key] || '—'}</dd>
            </div>
          ))}
        </dl>
      </Card>

      {status}

      <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3">
        <ReviewsSort />
        {form}
      </div>

      <ul className="space-y-3">
        {reviews.map((review) => (
          <ReviewCard
            key={review.id}
            review={review}
            locale={locale}
            isGuest={isGuest}
            voted={votes.has(review.id)}
            majorName={review.major_id ? majorNames.get(review.major_id) : undefined}
          />
        ))}
      </ul>
    </div>
  )
}
