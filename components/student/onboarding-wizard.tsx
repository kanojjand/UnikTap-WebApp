'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Field, Input, Select } from '@/components/ui/input'
import { Chip } from '@/components/ui/chip'
import { cn } from '@/lib/utils'
import { finishOnboarding } from '@/lib/actions/profile'
import type { City, EntSubject } from '@/types/domain'

const TOTAL = 3

export function OnboardingWizard({
  cities,
  subjects,
  directions,
  locale,
}: {
  cities: City[]
  subjects: EntSubject[]
  directions: string[]
  locale: string
}) {
  const t = useTranslations('onboarding')
  const tc = useTranslations('common')
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [pending, startTransition] = useTransition()

  const [cityId, setCityId] = useState('')
  const [score, setScore] = useState('')
  const [subject1, setSubject1] = useState('')
  const [subject2, setSubject2] = useState('')
  const [picked, setPicked] = useState<string[]>([])

  function finish() {
    startTransition(async () => {
      await finishOnboarding({
        city_id: cityId ? Number(cityId) : null,
        ent_score: score ? Number(score) : null,
        ent_subject_1_id: subject1 ? Number(subject1) : null,
        ent_subject_2_id: subject2 ? Number(subject2) : null,
        onboarded: true,
      })
      const query = new URLSearchParams()
      if (score) query.set('score', score)
      const city = cities.find((item) => String(item.id) === cityId)
      if (city) query.set('city', city.slug)
      router.replace(`/${locale}?${query.toString()}`)
      router.refresh()
    })
  }

  return (
    <div className="min-h-[100dvh] px-4 pt-safe flex flex-col max-w-md mx-auto md:justify-center">
      <div
        className="flex gap-2 justify-center mb-8 mt-4"
        role="progressbar"
        aria-valuemin={1}
        aria-valuemax={TOTAL}
        aria-valuenow={step}
        aria-label={t('step', { current: step, total: TOTAL })}
      >
        {Array.from({ length: TOTAL }).map((_, index) => (
          <span
            key={index}
            className={cn('h-2 rounded-full transition-all', index + 1 === step ? 'w-8 bg-primary' : 'w-2 bg-line')}
          />
        ))}
      </div>

      <div className="flex-1 md:flex-none">
        <p className="text-sm font-medium text-muted mb-2">{t('step', { current: step, total: TOTAL })}</p>
        {step === 1 ? (
          <>
            <h1 className="text-[26px] font-bold tracking-tight text-ink mb-6">{t('cityTitle')}</h1>
            <Select value={cityId} onChange={(event) => setCityId(event.target.value)} aria-label={t('cityTitle')}>
              <option value="">{t('cityAny')}</option>
              {cities.map((city) => (
                <option key={city.id} value={city.id}>
                  {locale === 'kk' && city.name_kk ? city.name_kk : city.name_ru}
                </option>
              ))}
            </Select>
          </>
        ) : null}

        {step === 2 ? (
          <>
            <h1 className="text-[26px] font-bold tracking-tight text-ink mb-6">{t('scoreTitle')}</h1>
            <div className="space-y-3">
              <Field label={t('scoreTitle')} hint={t('scoreLater')}>
                {({ id }) => (
                  <Input
                    id={id}
                    type="number"
                    inputMode="numeric"
                    min={0}
                    max={140}
                    value={score}
                    onChange={(event) => setScore(event.target.value)}
                  />
                )}
              </Field>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Select
                  value={subject1}
                  onChange={(event) => setSubject1(event.target.value)}
                  aria-label={t('subjectsTitle')}
                >
                  <option value="">{t('subjectsTitle')} 1</option>
                  {subjects.map((subject) => (
                    <option key={subject.id} value={subject.id}>
                      {locale === 'kk' && subject.name_kk ? subject.name_kk : subject.name_ru}
                    </option>
                  ))}
                </Select>
                <Select
                  value={subject2}
                  onChange={(event) => setSubject2(event.target.value)}
                  aria-label={t('subjectsTitle')}
                >
                  <option value="">{t('subjectsTitle')} 2</option>
                  {subjects.map((subject) => (
                    <option key={subject.id} value={subject.id}>
                      {locale === 'kk' && subject.name_kk ? subject.name_kk : subject.name_ru}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
          </>
        ) : null}

        {step === 3 ? (
          <>
            <h1 className="text-[26px] font-bold tracking-tight text-ink mb-2">{t('directionsTitle')}</h1>
            <p className="text-sm text-muted mb-4">{t('directionsHint')}</p>
            <div className="flex flex-wrap gap-2">
              {directions.map((direction) => (
                <Chip
                  key={direction}
                  active={picked.includes(direction)}
                  onClick={() =>
                    setPicked((current) =>
                      current.includes(direction)
                        ? current.filter((value) => value !== direction)
                        : current.length < 5
                          ? [...current, direction]
                          : current,
                    )
                  }
                >
                  {direction}
                </Chip>
              ))}
            </div>
          </>
        ) : null}
      </div>

      <div
        className="space-y-2 pt-8 sticky bottom-0 bg-canvas md:static"
        style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}
      >
        <Button fullWidth size="lg" loading={pending} onClick={() => (step < TOTAL ? setStep(step + 1) : finish())}>
          {step < TOTAL ? t('next') : t('finish')}
        </Button>
        {step > 1 ? (
          <Button variant="secondary" fullWidth onClick={() => setStep(step - 1)} disabled={pending}>
            {tc('back')}
          </Button>
        ) : null}
        <Button variant="ghost" fullWidth onClick={finish} disabled={pending}>
          {t('skip')}
        </Button>
      </div>
    </div>
  )
}
