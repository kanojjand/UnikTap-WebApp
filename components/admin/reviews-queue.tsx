'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { Check, Flag, Pencil, Trash2, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Rating } from '@/components/ui/rating'
import { Select, Textarea } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { Tabs } from '@/components/ui/tabs'
import {
  deleteReview, editReviewText, moderateReview, moderateReviewsBulk, resolveReport,
} from '@/lib/actions/admin-content'
import { formatDateTime, maskEmail } from '@/lib/utils'
import type { Review, ReviewReport } from '@/types/domain'

const REJECT_REASONS = [
  'Спам',
  'Оскорбления',
  'Недостоверная информация',
  'Персональные данные',
  'Не по теме',
]

export function ReviewsQueue({
  pending,
  approved,
  rejected,
  reports,
}: {
  pending: Review[]
  approved: Review[]
  rejected: Review[]
  reports: ReviewReport[]
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [tab, setTab] = useState(searchParams.get('tab') ?? 'pending')
  const [selected, setSelected] = useState<string[]>([])
  const [cursor, setCursor] = useState(0)
  const [rejecting, setRejecting] = useState<Review | null>(null)
  const [editing, setEditing] = useState<Review | null>(null)
  const [, startTransition] = useTransition()

  const list = tab === 'pending' ? pending : tab === 'approved' ? approved : tab === 'rejected' ? rejected : []

  function run(action: () => Promise<{ ok: boolean; error?: string }>, message: string) {
    startTransition(async () => {
      const result = await action()
      if (result.ok) {
        toast.success(message)
        router.refresh()
      } else toast.error(result.error ?? 'Ошибка')
    })
  }

  // Клавиатурные сокращения: A — одобрить, R — отклонить, → — следующий
  useEffect(() => {
    if (tab !== 'pending') return
    function onKey(event: KeyboardEvent) {
      const target = event.target as HTMLElement
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return
      const review = pending[cursor]
      if (!review) return
      if (event.key.toLowerCase() === 'a') run(() => moderateReview(review.id, 'approved'), 'Одобрено')
      if (event.key.toLowerCase() === 'r') setRejecting(review)
      if (event.key === 'ArrowRight') setCursor((value) => Math.min(value + 1, pending.length - 1))
      if (event.key === 'ArrowLeft') setCursor((value) => Math.max(value - 1, 0))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, cursor, pending])

  return (
    <div className="space-y-4">
      <Tabs
        className="bg-white rounded-2xl px-4 pt-4 border border-gray-100"
        active={tab}
        onChange={(id) => {
          setTab(id)
          setSelected([])
          setCursor(0)
        }}
        tabs={[
          { id: 'pending', label: `На модерации (${pending.length})` },
          { id: 'approved', label: `Опубликованные (${approved.length})` },
          { id: 'rejected', label: `Отклонённые (${rejected.length})` },
          { id: 'reports', label: `Жалобы (${reports.length})` },
        ]}
      />

      {tab === 'pending' && pending.length > 0 ? (
        <div className="flex items-center gap-3 text-sm">
          <span className="text-gray-500">Горячие клавиши: A — одобрить, R — отклонить, ← → — навигация</span>
          {selected.length > 0 ? (
            <Button size="sm" onClick={() => run(() => moderateReviewsBulk(selected, 'approved'), 'Одобрено')}>
              Одобрить выбранные ({selected.length})
            </Button>
          ) : null}
        </div>
      ) : null}

      {tab === 'reports' ? (
        <ul className="space-y-3">
          {reports.map((report) => (
            <li key={report.id} className="bg-white rounded-2xl border border-gray-100 p-5">
              <div className="flex items-center gap-2 mb-2">
                <Flag className="w-4 h-4 text-red-500" aria-hidden />
                <Badge tone="danger" mini>
                  {report.reason}
                </Badge>
                <span className="text-xs text-gray-400">{formatDateTime(report.created_at)}</span>
              </div>
              <p className="text-sm text-gray-600">{report.comment}</p>
              {report.review ? (
                <p className="text-sm text-gray-800 bg-slateBg rounded-xl p-3 mt-2">{report.review.body}</p>
              ) : null}
              <div className="flex gap-2 mt-3">
                <Button size="sm" variant="secondary" onClick={() => run(() => resolveReport(report.id, false), 'Жалоба закрыта')}>
                  Отзыв в порядке
                </Button>
                <Button size="sm" variant="danger" onClick={() => run(() => resolveReport(report.id, true), 'Отзыв скрыт')}>
                  Скрыть отзыв
                </Button>
              </div>
            </li>
          ))}
          {reports.length === 0 ? <p className="text-gray-400 text-center py-8">Жалоб нет</p> : null}
        </ul>
      ) : (
        <ul className="space-y-3">
          {list.map((review, index) => (
            <li
              key={review.id}
              className={`bg-white rounded-2xl border p-5 ${
                tab === 'pending' && index === cursor ? 'border-corpBlue ring-1 ring-corpBlue/30' : 'border-gray-100'
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-bold text-gray-900">{review.university?.name_ru ?? '—'}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {review.author?.full_name || 'Без имени'} · {maskEmail(review.author?.email)} · регистрация{' '}
                    {formatDateTime(review.author?.created_at)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Rating value={review.rating} />
                  <span className="text-xs text-gray-400">{formatDateTime(review.created_at)}</span>
                  {tab === 'pending' ? (
                    <input
                      type="checkbox"
                      className="w-4 h-4 accent-corpBlue"
                      checked={selected.includes(review.id)}
                      onChange={(event) =>
                        setSelected((current) =>
                          event.target.checked ? [...current, review.id] : current.filter((id) => id !== review.id),
                        )
                      }
                      aria-label="Выбрать"
                    />
                  ) : null}
                </div>
              </div>

              <p className="text-sm text-gray-700 mt-3 whitespace-pre-line">{review.body}</p>
              {review.pros ? <p className="text-sm text-green-700 mt-2">+ {review.pros}</p> : null}
              {review.cons ? <p className="text-sm text-red-700 mt-1">− {review.cons}</p> : null}

              <div className="flex flex-wrap gap-3 text-xs text-gray-500 mt-3">
                {(['rating_teaching', 'rating_facilities', 'rating_dormitory', 'rating_career', 'rating_social'] as const).map(
                  (key) =>
                    review[key] ? (
                      <span key={key}>
                        {key.replace('rating_', '')}: <b>{review[key]}</b>
                      </span>
                    ) : null,
                )}
              </div>

              <div className="flex gap-2 mt-4">
                {review.status !== 'approved' ? (
                  <Button size="sm" onClick={() => run(() => moderateReview(review.id, 'approved'), 'Одобрено')}>
                    <Check className="w-4 h-4" aria-hidden /> Одобрить
                  </Button>
                ) : null}
                {review.status !== 'rejected' ? (
                  <Button size="sm" variant="secondary" onClick={() => setRejecting(review)}>
                    <X className="w-4 h-4" aria-hidden /> Отклонить
                  </Button>
                ) : null}
                <Button size="sm" variant="ghost" onClick={() => setEditing(review)}>
                  <Pencil className="w-4 h-4" aria-hidden /> Редактировать
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-red-600"
                  onClick={() => {
                    if (confirm('Удалить отзыв?')) run(() => deleteReview(review.id), 'Удалено')
                  }}
                >
                  <Trash2 className="w-4 h-4" aria-hidden />
                </Button>
              </div>
            </li>
          ))}
          {list.length === 0 ? <p className="text-gray-400 text-center py-8">Пусто</p> : null}
        </ul>
      )}

      <RejectModal review={rejecting} onClose={() => setRejecting(null)} onSubmit={(id, reason) => run(() => moderateReview(id, 'rejected', reason), 'Отклонено')} />
      <EditModal review={editing} onClose={() => setEditing(null)} onSubmit={(id, body) => run(() => editReviewText(id, body), 'Текст обновлён')} />
    </div>
  )
}

function RejectModal({
  review,
  onClose,
  onSubmit,
}: {
  review: Review | null
  onClose: () => void
  onSubmit: (id: string, reason: string) => void
}) {
  const [reason, setReason] = useState(REJECT_REASONS[0])
  const [comment, setComment] = useState('')

  return (
    <Modal open={Boolean(review)} onClose={onClose} title="Отклонить отзыв">
      <div className="p-6 space-y-3">
        <Select surface="admin" value={reason} onChange={(event) => setReason(event.target.value)} aria-label="Причина">
          {REJECT_REASONS.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </Select>
        <Textarea
          surface="admin"
          rows={3}
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          placeholder="Комментарий автору"
          aria-label="Комментарий"
        />
        <div className="flex gap-2">
          <Button variant="secondary" fullWidth onClick={onClose}>
            Отмена
          </Button>
          <Button
            variant="danger"
            fullWidth
            onClick={() => {
              if (review) onSubmit(review.id, `${reason}${comment ? `: ${comment}` : ''}`)
              onClose()
            }}
          >
            Отклонить
          </Button>
        </div>
      </div>
    </Modal>
  )
}

function EditModal({
  review,
  onClose,
  onSubmit,
}: {
  review: Review | null
  onClose: () => void
  onSubmit: (id: string, body: string) => void
}) {
  const [body, setBody] = useState('')

  useEffect(() => {
    setBody(review?.body ?? '')
  }, [review])

  return (
    <Modal open={Boolean(review)} onClose={onClose} title="Редактировать текст отзыва">
      <div className="p-6 space-y-3">
        <Textarea surface="admin" rows={8} value={body} onChange={(event) => setBody(event.target.value)} aria-label="Текст" />
        <div className="flex gap-2">
          <Button variant="secondary" fullWidth onClick={onClose}>
            Отмена
          </Button>
          <Button
            fullWidth
            onClick={() => {
              if (review) onSubmit(review.id, body)
              onClose()
            }}
          >
            Сохранить
          </Button>
        </div>
      </div>
    </Modal>
  )
}
