'use client'

import { useState } from 'react'
import { ArrowRight, Calculator } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useRouter } from '@/i18n/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { track } from '@/lib/analytics'

/** Главное действие главной страницы: ввести балл и увидеть шансы на грант. */
export function ScoreCard({ savedScore }: { savedScore: number | null }) {
  const t = useTranslations('catalog')
  const router = useRouter()
  const [score, setScore] = useState(savedScore ? String(savedScore) : '')
  const [editing, setEditing] = useState(!savedScore)
  const [error, setError] = useState(false)

  function submit(value = Number(score)) {
    if (!value || value < 0 || value > 140) {
      setError(true)
      return
    }
    try {
      sessionStorage.setItem('vn_score', String(value))
    } catch {
      /* приватный режим */
    }
    track('calculator_use', { score: value })
    router.push(`/calculator?tab=chances&score=${value}`)
  }

  if (!editing && savedScore) {
    return (
      <section className="rounded-2xl bg-primary-soft p-4 md:p-5 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm text-muted">{t('yourScore')}</p>
          <p className="text-3xl font-bold text-primary-ink leading-tight">{savedScore}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>
            {t('change')}
          </Button>
          <Button size="sm" onClick={() => submit(savedScore)}>
            {t('calcCta')}
            <ArrowRight className="w-4 h-4" aria-hidden />
          </Button>
        </div>
      </section>
    )
  }

  return (
    <section className="rounded-2xl bg-primary-soft p-4 md:p-5">
      <div className="flex items-start gap-3 mb-4">
        <span className="w-10 h-10 rounded-xl bg-surface text-primary-ink flex items-center justify-center shrink-0">
          <Calculator className="w-5 h-5" aria-hidden />
        </span>
        <div>
          <h2 className="text-lg font-bold text-ink leading-tight">{t('calcTitle')}</h2>
          <p className="text-sm text-body mt-0.5">{t('calcSubtitle')}</p>
        </div>
      </div>
      <form
        className="flex gap-2 lg:flex-col"
        onSubmit={(event) => {
          event.preventDefault()
          submit()
        }}
      >
        <Input
          type="number"
          inputMode="numeric"
          enterKeyHint="go"
          min={0}
          max={140}
          value={score}
          invalid={error}
          onChange={(event) => {
            setScore(event.target.value)
            setError(false)
          }}
          placeholder={t('scorePlaceholder')}
          aria-label={t('calcTitle')}
          aria-describedby={error ? 'score-card-error' : undefined}
          className="flex-1 min-w-0 bg-surface font-semibold"
        />
        <Button type="submit" className="shrink-0">
          {t('calcCta')}
        </Button>
      </form>
      {error ? (
        <p id="score-card-error" role="alert" className="text-sm text-danger mt-2">
          {t('scoreRange')}
        </p>
      ) : null}
    </section>
  )
}
