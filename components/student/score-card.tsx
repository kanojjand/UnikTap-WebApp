'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from '@/i18n/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { track } from '@/lib/analytics'

/** Карточка калькулятора на главной (6.2). Балл гостя живёт в URL и sessionStorage. */
export function ScoreCard({ savedScore }: { savedScore: number | null }) {
  const t = useTranslations('catalog')
  const router = useRouter()
  const [score, setScore] = useState(savedScore ? String(savedScore) : '')
  const [editing, setEditing] = useState(!savedScore)

  function submit() {
    const value = Number(score)
    if (!value || value < 0 || value > 140) return
    try {
      sessionStorage.setItem('vn_score', String(value))
    } catch {
      /* приватный режим */
    }
    track('calculator_use', { score: value })
    router.push(`/calculator?score=${value}`)
  }

  if (!editing && savedScore) {
    return (
      <Card className="p-5 mb-6 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs text-gray-500">{t('yourScore')}</p>
          <p className="text-2xl font-bold text-corpBlue">{savedScore}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="soft" size="sm" onClick={() => setEditing(true)}>
            {t('change')}
          </Button>
          <Button size="sm" onClick={submit}>
            {t('calcCta')}
          </Button>
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-5 mb-6">
      <h2 className="text-lg font-bold text-corpBlue mb-2">{t('calcTitle')}</h2>
      <p className="text-sm text-gray-500 mb-4">{t('calcSubtitle')}</p>
      <div className="flex gap-3">
        <Input
          type="number"
          inputMode="numeric"
          min={0}
          max={140}
          value={score}
          onChange={(event) => setScore(event.target.value)}
          onKeyDown={(event) => event.key === 'Enter' && submit()}
          placeholder={t('scorePlaceholder')}
          aria-label={t('calcTitle')}
          className="flex-1 text-corpBlue font-semibold"
        />
        <Button onClick={submit}>{t('calcCta')}</Button>
      </div>
    </Card>
  )
}
