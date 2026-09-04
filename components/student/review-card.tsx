'use client'

import { useState, useTransition } from 'react'
import { Flag, ThumbsUp } from 'lucide-react'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'
import { Card } from '@/components/ui/card'
import { Rating } from '@/components/ui/rating'
import { Button } from '@/components/ui/button'
import { Select, Textarea } from '@/components/ui/input'
import { BottomSheet } from '@/components/ui/modal'
import { reportReview, voteHelpful } from '@/lib/actions/reviews'
import { formatDate, cn } from '@/lib/utils'
import type { Review } from '@/types/domain'
import { AuthWall } from './auth-wall'

export function ReviewCard({
  review,
  locale,
  isGuest,
  voted = false,
  majorName,
}: {
  review: Review
  locale: string
  isGuest: boolean
  voted?: boolean
  majorName?: string
}) {
  const t = useTranslations('reviews')
  const [helpful, setHelpful] = useState({ count: review.helpful_count, voted })
  const [wall, setWall] = useState(false)
  const [reporting, setReporting] = useState(false)
  const [pending, startTransition] = useTransition()

  function vote() {
    if (isGuest) return setWall(true)
    startTransition(async () => {
      const result = await voteHelpful(review.id)
      if (!result.ok) return setWall(true)
      setHelpful((current) => ({ count: current.count + (current.voted ? -1 : 1), voted: !current.voted }))
    })
  }

  return (
    <Card as="li" className="p-4">
      <div className="flex justify-between items-start gap-3 mb-2">
        <div>
          <p className="font-bold text-sm text-gray-900">
            {review.is_anonymous || !review.author_name ? t('anonymous') : review.author_name}
          </p>
          <p className="text-xs text-gray-400">
            {[majorName, review.study_year ? `${review.study_year}` : null, formatDate(review.created_at, locale)]
              .filter(Boolean)
              .join(' · ')}
          </p>
        </div>
        <Rating value={review.rating} />
      </div>

      <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{review.body}</p>

      {review.pros ? (
        <p className="mt-3 text-sm bg-green-50 text-green-800 rounded-xl p-3">
          <b className="block text-xs uppercase mb-1">{t('pros')}</b>
          {review.pros}
        </p>
      ) : null}
      {review.cons ? (
        <p className="mt-2 text-sm bg-red-50 text-red-800 rounded-xl p-3">
          <b className="block text-xs uppercase mb-1">{t('cons')}</b>
          {review.cons}
        </p>
      ) : null}

      <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-100">
        <button
          onClick={vote}
          disabled={pending}
          className={cn('text-xs flex items-center gap-1', helpful.voted ? 'text-corpBlue font-semibold' : 'text-gray-500')}
        >
          <ThumbsUp className="w-3.5 h-3.5" aria-hidden />
          {t('helpful', { count: helpful.count })}
        </button>
        <button
          onClick={() => (isGuest ? setWall(true) : setReporting(true))}
          className="text-xs text-gray-400 flex items-center gap-1"
        >
          <Flag className="w-3.5 h-3.5" aria-hidden />
          {t('report')}
        </button>
      </div>

      <AuthWall open={wall} onClose={() => setWall(false)} reason="review" />
      <ReportSheet open={reporting} onClose={() => setReporting(false)} reviewId={review.id} />
    </Card>
  )
}

function ReportSheet({ open, onClose, reviewId }: { open: boolean; onClose: () => void; reviewId: string }) {
  const t = useTranslations('reviews')
  const [reason, setReason] = useState('spam')
  const [comment, setComment] = useState('')
  const [pending, startTransition] = useTransition()

  return (
    <BottomSheet open={open} onClose={onClose} title={t('reportTitle')}>
      <div className="space-y-3">
        <Select value={reason} onChange={(event) => setReason(event.target.value)} aria-label={t('reportReason')}>
          <option value="spam">{t('reasonSpam')}</option>
          <option value="offensive">{t('reasonOffensive')}</option>
          <option value="fake">{t('reasonFake')}</option>
          <option value="personal_data">{t('reasonPersonalData')}</option>
          <option value="other">{t('reasonOther')}</option>
        </Select>
        <Textarea
          rows={3}
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          placeholder={t('reportComment')}
          aria-label={t('reportComment')}
        />
        <Button
          fullWidth
          loading={pending}
          onClick={() =>
            startTransition(async () => {
              const result = await reportReview({ review_id: reviewId, reason, comment })
              if (result.ok) {
                toast.success(t('reportSent'))
                onClose()
              } else {
                toast.error(result.error)
              }
            })
          }
        >
          {t('submit')}
        </Button>
      </div>
    </BottomSheet>
  )
}
