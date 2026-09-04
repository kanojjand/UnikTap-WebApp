import { MessageSquareOff } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import { Card } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { Rating } from '@/components/ui/rating'
import { pick } from '@/lib/utils'
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
    majors.map((major) => [major.id, pick(major.specialty as unknown as Record<string, unknown>, 'name', locale)]),
  )

  return (
    <div className="space-y-4">
      {reviews.length > 0 ? (
        <Card className="p-5">
          <div className="flex items-start gap-5">
            <div className="text-center shrink-0">
              <p className="text-4xl font-bold text-corpBlue leading-none">
                {summary.count >= minReviews ? summary.average.toFixed(1) : '—'}
              </p>
              <Rating value={summary.average} className="mt-2" />
              <p className="text-xs text-gray-400 mt-1">{t('helpful', { count: summary.count })}</p>
            </div>

            <div className="flex-1 space-y-1">
              {[5, 4, 3, 2, 1].map((star) => {
                const value = summary.distribution[star as 1 | 2 | 3 | 4 | 5]
                const percent = summary.count === 0 ? 0 : Math.round((value / summary.count) * 100)
                return (
                  <div key={star} className="flex items-center gap-2">
                    <span className="text-[10px] text-gray-400 w-3">{star}</span>
                    <div className="h-1.5 flex-1 rounded-full bg-gray-100 overflow-hidden">
                      <div className="h-full bg-yellow-400 rounded-full" style={{ width: `${percent}%` }} />
                    </div>
                    <span className="text-[10px] text-gray-400 w-6 text-right">{value}</span>
                  </div>
                )
              })}
            </div>
          </div>

          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 mt-5 pt-4 border-t border-gray-100">
            {(['teaching', 'facilities', 'dormitory', 'career', 'social'] as const).map((key) => (
              <div key={key} className="flex justify-between text-sm">
                <dt className="text-gray-500">{t(key)}</dt>
                <dd className="font-semibold text-gray-800">{summary.criteria[key] || '—'}</dd>
              </div>
            ))}
          </dl>
        </Card>
      ) : null}

      <ReviewForm
        universityId={universityId}
        majors={majors}
        locale={locale}
        isGuest={isGuest}
        existing={myReview}
      />

      {myReview && myReview.status !== 'approved' ? (
        <p className="text-xs text-center text-yellow-700 bg-yellow-50 rounded-xl p-3">
          {myReview.status === 'pending' ? t('statusPending') : `${t('statusRejected')}: ${myReview.moderation_comment}`}
        </p>
      ) : null}

      {reviews.length === 0 ? (
        <EmptyState
          icon={<MessageSquareOff className="w-12 h-12" />}
          title={t('emptyTitle')}
          text={t('emptyText')}
        />
      ) : (
        <>
          <div className="flex justify-end">
            <ReviewsSort />
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
        </>
      )}
    </div>
  )
}
