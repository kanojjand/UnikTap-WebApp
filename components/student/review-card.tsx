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

  function flip() {
    setHelpful((current) => ({ count: current.count + (current.voted ? -1 : 1), voted: !current.voted }))
  }

  function vote() {
    if (isGuest) return setWall(true)
    // Отклик сразу, откатываем только если сервер не принял голос
    flip()
    startTransition(async () => {
      const result = await voteHelpful(review.id)
      if (!result.ok) {
        flip()
        setWall(true)
      }
    })
  }

  return (
    <Card as="li" className="p-4 md:p-5">
      <div className="flex justify-between items-start gap-3 mb-3">
        <div className="flex items-center gap-3 min-w-0">
          <span
            className="w-10 h-10 rounded-full bg-subtle text-body font-semibold flex items-center justify-center shrink-0"
            aria-hidden
          >
            {(review.is_anonymous || !review.author_name ? '?' : review.author_name).slice(0, 1).toUpperCase()}
          </span>
          <div className="min-w-0">
            <p className="font-semibold text-[15px] text-ink truncate">
              {review.is_anonymous || !review.author_name ? t('anonymous') : review.author_name}
            </p>
            <p className="text-sm text-muted truncate">
              {[majorName, review.study_year ? `${review.study_year}` : null, formatDate(review.created_at, locale)]
                .filter(Boolean)
                .join(' · ')}
            </p>
          </div>
        </div>
        <Rating value={review.rating} className="shrink-0 mt-1" />
      </div>

      <p className="text-[15px] text-body leading-relaxed whitespace-pre-line">{review.body}</p>

      {review.pros ? (
        <div className="mt-3 text-[15px] text-body bg-success-soft rounded-xl p-3">
          <b className="block text-sm font-semibold text-success mb-1">+ {t('pros')}</b>
          {review.pros}
        </div>
      ) : null}
      {review.cons ? (
        <div className="mt-2 text-[15px] text-body bg-danger-soft rounded-xl p-3">
          <b className="block text-sm font-semibold text-danger mb-1">− {t('cons')}</b>
          {review.cons}
        </div>
      ) : null}

      <div className="flex items-center gap-2 mt-3 pt-2 border-t border-line -mx-2">
        <button
          type="button"
          onClick={vote}
          disabled={pending}
          aria-pressed={helpful.voted}
          className={cn(
            'min-h-[44px] px-2 rounded-xl text-sm flex items-center gap-1.5 hover:bg-subtle transition-colors',
            helpful.voted ? 'text-primary-ink font-semibold' : 'text-muted',
          )}
        >
          <ThumbsUp className="w-4 h-4" fill={helpful.voted ? 'currentColor' : 'none'} aria-hidden />
          {t('helpful', { count: helpful.count })}
        </button>
        <button
          type="button"
          onClick={() => (isGuest ? setWall(true) : setReporting(true))}
          className="min-h-[44px] px-2 rounded-xl text-sm text-muted flex items-center gap-1.5 hover:bg-subtle transition-colors ml-auto"
        >
          <Flag className="w-4 h-4" aria-hidden />
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
