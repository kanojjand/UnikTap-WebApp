'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'
import { PenLine } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Field, Input, Select, Textarea } from '@/components/ui/input'
import { RatingInput } from '@/components/ui/rating'
import { BottomSheet } from '@/components/ui/modal'
import { submitReview } from '@/lib/actions/reviews'
import { track } from '@/lib/analytics'
import { pick } from '@/lib/utils'
import type { Review, UniversityMajor } from '@/types/domain'
import { AuthWall } from './auth-wall'

const CRITERIA = ['teaching', 'facilities', 'dormitory', 'career', 'social'] as const

export function ReviewForm({
  universityId,
  majors,
  locale,
  isGuest,
  existing,
}: {
  universityId: string
  majors: UniversityMajor[]
  locale: string
  isGuest: boolean
  existing?: Review | null
}) {
  const t = useTranslations('reviews')
  const tc = useTranslations('common')
  const [open, setOpen] = useState(false)
  const [wall, setWall] = useState(false)
  const [pending, startTransition] = useTransition()

  const [rating, setRating] = useState(existing?.rating ?? 0)
  const [criteria, setCriteria] = useState<Record<string, number>>({
    teaching: existing?.rating_teaching ?? 0,
    facilities: existing?.rating_facilities ?? 0,
    dormitory: existing?.rating_dormitory ?? 0,
    career: existing?.rating_career ?? 0,
    social: existing?.rating_social ?? 0,
  })
  const [body, setBody] = useState(existing?.body ?? '')
  const [pros, setPros] = useState(existing?.pros ?? '')
  const [cons, setCons] = useState(existing?.cons ?? '')
  const [studyYear, setStudyYear] = useState(existing?.study_year ? String(existing.study_year) : '')
  const [majorId, setMajorId] = useState(existing?.major_id ?? '')
  const [anonymous, setAnonymous] = useState(existing?.is_anonymous ?? false)
  const [error, setError] = useState('')

  function submit() {
    setError('')
    if (rating === 0) return setError(t('yourRating'))
    if (body.trim().length < 30) return setError(t('bodyHint', { count: body.trim().length }))

    startTransition(async () => {
      const result = await submitReview({
        university_id: universityId,
        rating,
        rating_teaching: criteria.teaching || null,
        rating_facilities: criteria.facilities || null,
        rating_dormitory: criteria.dormitory || null,
        rating_career: criteria.career || null,
        rating_social: criteria.social || null,
        body: body.trim(),
        pros: pros.trim(),
        cons: cons.trim(),
        study_year: studyYear ? Number(studyYear) : null,
        major_id: majorId || null,
        is_anonymous: anonymous,
      })

      if (!result.ok) {
        if (result.error === 'unauthorized') {
          setOpen(false)
          setWall(true)
          return
        }
        setError(result.error)
        return
      }

      track('review_submit', { rating }, { universityId })
      toast.success(t('submitted'))
      setOpen(false)
    })
  }

  return (
    <>
      <Button
        fullWidth
        variant="soft"
        onClick={() => (isGuest ? setWall(true) : setOpen(true))}
        className="justify-center"
      >
        <PenLine className="w-4 h-4" aria-hidden />
        {existing ? t('edit') : t('write')}
      </Button>

      <BottomSheet open={open} onClose={() => setOpen(false)} title={existing ? t('edit') : t('write')}>
        <div className="space-y-4">
          <div>
            <p className="text-sm font-bold text-gray-700 mb-1">{t('yourRating')}</p>
            <RatingInput value={rating} onChange={setRating} label={t('yourRating')} />
          </div>

          <div className="space-y-2">
            <p className="text-sm font-bold text-gray-700">{t('criteria')}</p>
            {CRITERIA.map((key) => (
              <div key={key} className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{t(key)}</span>
                <RatingInput
                  size={20}
                  value={criteria[key]}
                  onChange={(value) => setCriteria((current) => ({ ...current, [key]: value }))}
                  label={t(key)}
                />
              </div>
            ))}
          </div>

          <Field label={t('body')} hint={t('bodyHint', { count: body.trim().length })} required>
            {({ id, describedBy }) => (
              <Textarea
                id={id}
                aria-describedby={describedBy}
                rows={5}
                maxLength={3000}
                value={body}
                onChange={(event) => setBody(event.target.value)}
                placeholder={t('bodyPlaceholder')}
              />
            )}
          </Field>

          <Field label={t('pros')}>
            {({ id }) => <Textarea id={id} rows={2} value={pros} onChange={(event) => setPros(event.target.value)} />}
          </Field>
          <Field label={t('cons')}>
            {({ id }) => <Textarea id={id} rows={2} value={cons} onChange={(event) => setCons(event.target.value)} />}
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label={t('studyYear')}>
              {({ id }) => (
                <Input
                  id={id}
                  type="number"
                  min={1990}
                  max={2100}
                  value={studyYear}
                  onChange={(event) => setStudyYear(event.target.value)}
                />
              )}
            </Field>
            <Field label={t('major')}>
              {({ id }) => (
                <Select id={id} value={majorId} onChange={(event) => setMajorId(event.target.value)}>
                  <option value="">—</option>
                  {majors.map((major) => (
                    <option key={major.id} value={major.id}>
                      {pick(major.specialty as unknown as Record<string, unknown>, 'name', locale)}
                    </option>
                  ))}
                </Select>
              )}
            </Field>
          </div>

          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input
              type="checkbox"
              checked={anonymous}
              onChange={(event) => setAnonymous(event.target.checked)}
              className="w-4 h-4 accent-corpBlue"
            />
            {t('anonymousLabel')}
          </label>

          {error ? <p className="text-xs text-red-600">{error}</p> : null}

          <div className="flex gap-2 pt-2">
            <Button variant="secondary" fullWidth onClick={() => setOpen(false)}>
              {tc('cancel')}
            </Button>
            <Button fullWidth loading={pending} onClick={submit}>
              {t('submit')}
            </Button>
          </div>
        </div>
      </BottomSheet>

      <AuthWall open={wall} onClose={() => setWall(false)} reason="review" />
    </>
  )
}
