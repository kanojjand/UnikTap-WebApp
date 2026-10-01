'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Field, Input, Select } from '@/components/ui/input'
import { updateProfile } from '@/lib/actions/profile'
import { clampScore, sumEntSections } from '@/lib/ent'
import { track } from '@/lib/analytics'
import { haptic } from '@/lib/haptics'
import type { AppSettings, EntSubject } from '@/types/domain'
import { AuthWall } from './auth-wall'

export function ScoreInput({
  subjects,
  settings,
  initial,
  isGuest,
  locale,
}: {
  subjects: EntSubject[]
  settings: AppSettings
  initial: { score: number | null; subject1: number | null; subject2: number | null; details: Record<string, number> }
  isGuest: boolean
  locale: string
}) {
  const t = useTranslations('calculator')
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [wall, setWall] = useState(false)
  const [detailed, setDetailed] = useState(false)
  const [score, setScore] = useState(initial.score ? String(initial.score) : '')
  const [subject1, setSubject1] = useState(initial.subject1 ? String(initial.subject1) : '')
  const [subject2, setSubject2] = useState(initial.subject2 ? String(initial.subject2) : '')
  const [sections, setSections] = useState<Record<string, string>>({
    history: String(initial.details.history ?? ''),
    reading: String(initial.details.reading ?? ''),
    math_literacy: String(initial.details.math_literacy ?? ''),
    subject_1: String(initial.details.subject_1 ?? ''),
    subject_2: String(initial.details.subject_2 ?? ''),
  })

  const sectionTotal = sumEntSections(
    Object.fromEntries(Object.entries(sections).map(([key, value]) => [key, Number(value) || 0])),
  )
  const finalScore = detailed ? sectionTotal : clampScore(Number(score) || 0, settings.ent_max_score)

  const SECTION_LABELS: Record<string, string> = {
    history: t('history'),
    reading: t('reading'),
    math_literacy: t('mathLiteracy'),
    subject_1: t('subject1'),
    subject_2: t('subject2'),
  }

  function showChances() {
    if (!finalScore) return
    track('calculator_use', { score: finalScore, subjects: [subject1, subject2] })
    const params = new URLSearchParams({ tab: 'chances', score: String(finalScore) })
    if (subject1) params.set('s1', subject1)
    if (subject2) params.set('s2', subject2)
    router.replace(`/${locale}/calculator?${params.toString()}`, { scroll: false })
  }

  function saveToProfile() {
    if (isGuest) return setWall(true)
    startTransition(async () => {
      const result = await updateProfile({
        ent_score: finalScore || null,
        ent_subject_1_id: subject1 ? Number(subject1) : null,
        ent_subject_2_id: subject2 ? Number(subject2) : null,
        ent_details: Object.fromEntries(Object.entries(sections).map(([key, value]) => [key, Number(value) || 0])),
      })
      if (result.ok) {
        haptic()
        toast.success(t('savedToProfile'))
      } else if (result.error === 'unauthorized') setWall(true)
      else toast.error(result.error)
    })
  }

  return (
    <div className="space-y-4">
      <Card as="section" className="p-4 md:p-6 space-y-5">
        <form
          className="space-y-5"
          onSubmit={(event) => {
            event.preventDefault()
            showChances()
          }}
        >
          {!detailed ? (
            <Field label={t('total')} hint={`0–${settings.ent_max_score}`}>
              {({ id }) => (
                <Input
                  id={id}
                  type="number"
                  min={0}
                  max={settings.ent_max_score}
                  inputMode="numeric"
                  enterKeyHint="go"
                  placeholder="0"
                  value={score}
                  onChange={(event) => setScore(event.target.value)}
                  className="h-16 text-3xl font-bold text-primary-ink"
                />
              )}
            </Field>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {Object.entries(settings.ent_structure).map(([key, max]) => (
                <Field key={key} label={`${SECTION_LABELS[key] ?? key} (0–${max})`}>
                  {({ id }) => (
                    <Input
                      id={id}
                      type="number"
                      inputMode="numeric"
                      min={0}
                      max={max}
                      value={sections[key] ?? ''}
                      onChange={(event) => setSections({ ...sections, [key]: event.target.value })}
                    />
                  )}
                </Field>
              ))}
              <p className="sm:col-span-2 rounded-xl bg-primary-soft px-4 py-3 flex items-center justify-between text-primary-ink">
                <span className="font-medium">{t('total')}</span>
                <b className="text-2xl">{sectionTotal}</b>
              </p>
            </div>
          )}

          <button
            type="button"
            onClick={() => setDetailed((value) => !value)}
            className="-ml-2 px-2 min-h-[44px] rounded-lg text-[15px] text-primary-ink font-semibold hover:bg-primary-soft"
          >
            {detailed ? t('enterTotal') : t('detailed')}
          </button>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label={t('subject1')}>
              {({ id }) => (
                <Select id={id} value={subject1} onChange={(event) => setSubject1(event.target.value)}>
                  <option value="">—</option>
                  {subjects.map((subject) => (
                    <option key={subject.id} value={subject.id}>
                      {locale === 'kk' && subject.name_kk ? subject.name_kk : subject.name_ru}
                    </option>
                  ))}
                </Select>
              )}
            </Field>
            <Field label={t('subject2')}>
              {({ id }) => (
                <Select id={id} value={subject2} onChange={(event) => setSubject2(event.target.value)}>
                  <option value="">—</option>
                  {subjects.map((subject) => (
                    <option key={subject.id} value={subject.id}>
                      {locale === 'kk' && subject.name_kk ? subject.name_kk : subject.name_ru}
                    </option>
                  ))}
                </Select>
              )}
            </Field>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 pt-1">
            <Button type="submit" size="lg" className="sm:flex-1" disabled={!finalScore}>
              {t('calculate')}
            </Button>
            <Button variant="secondary" size="lg" loading={pending} onClick={saveToProfile}>
              {t('saveToProfile')}
            </Button>
          </div>
        </form>
      </Card>

      <AuthWall open={wall} onClose={() => setWall(false)} reason="score" />
    </div>
  )
}
