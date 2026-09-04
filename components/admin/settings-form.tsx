'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Field, Input, Switch, Textarea } from '@/components/ui/input'
import { purgeCache, saveSettings } from '@/lib/actions/admin-content'

const THRESHOLD_LABELS: Record<string, string> = {
  default: 'Остальные ВУЗы',
  national: 'Национальные университеты',
  medical: 'Медицинские специальности',
  pedagogical: 'Педагогические специальности',
  legal: 'Юридические специальности',
  agriculture: 'Сельскохозяйственные, ветеринарные',
  college_short: 'Выпускники колледжей (сокращённые)',
}

const STRUCTURE_LABELS: Record<string, string> = {
  history: 'История Казахстана',
  reading: 'Грамотность чтения',
  math_literacy: 'Математическая грамотность',
  subject_1: 'Профильный предмет 1',
  subject_2: 'Профильный предмет 2',
}

export function SettingsForm({ settings }: { settings: Record<string, unknown> }) {
  const [pending, startTransition] = useTransition()
  const [thresholds, setThresholds] = useState<Record<string, number>>(
    (settings.ent_thresholds as Record<string, number>) ?? {},
  )
  const [structure, setStructure] = useState<Record<string, number>>(
    (settings.ent_structure as Record<string, number>) ?? {},
  )
  const [bands, setBands] = useState<{ high: number; medium: number }>(
    (settings.chance_bands as { high: number; medium: number }) ?? { high: 5, medium: -5 },
  )
  const [maxScore, setMaxScore] = useState(Number(settings.ent_max_score ?? 140))
  const [autoPublish, setAutoPublish] = useState(Boolean(settings.review_auto_publish))
  const [minReviews, setMinReviews] = useState(Number(settings.min_reviews_for_rating ?? 3))
  const [phoneAuth, setPhoneAuth] = useState(Boolean(settings.auth_phone_enabled))
  const [contactEmail, setContactEmail] = useState(String(settings.contact_email ?? ''))
  const [disclaimer, setDisclaimer] = useState(
    (settings.disclaimer as { ru: string; kk: string }) ?? { ru: '', kk: '' },
  )

  function save() {
    startTransition(async () => {
      const result = await saveSettings({
        ent_thresholds: thresholds,
        ent_structure: structure,
        chance_bands: bands,
        ent_max_score: maxScore,
        review_auto_publish: autoPublish,
        min_reviews_for_rating: minReviews,
        auth_phone_enabled: phoneAuth,
        contact_email: contactEmail,
        disclaimer,
      })
      if (result.ok) toast.success('Настройки сохранены')
      else toast.error(result.error)
    })
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <section className="bg-white rounded-2xl border border-gray-100 p-6">
        <h2 className="font-bold text-gray-900 mb-1">Пороговые баллы ЕНТ</h2>
        <p className="text-sm text-gray-500 mb-4">Минимум для зачисления. Пересматриваются каждый год.</p>
        <div className="grid md:grid-cols-2 gap-4">
          {Object.entries(thresholds).map(([key, value]) => (
            <Field key={key} label={THRESHOLD_LABELS[key] ?? key}>
              {({ id }) => (
                <Input
                  id={id}
                  surface="admin"
                  type="number"
                  value={String(value)}
                  onChange={(event) => setThresholds({ ...thresholds, [key]: Number(event.target.value) })}
                />
              )}
            </Field>
          ))}
        </div>
      </section>

      <section className="bg-white rounded-2xl border border-gray-100 p-6">
        <h2 className="font-bold text-gray-900 mb-4">Структура теста</h2>
        <div className="grid md:grid-cols-3 gap-4">
          <Field label="Максимальный балл">
            {({ id }) => (
              <Input id={id} surface="admin" type="number" value={String(maxScore)} onChange={(event) => setMaxScore(Number(event.target.value))} />
            )}
          </Field>
          {Object.entries(structure).map(([key, value]) => (
            <Field key={key} label={STRUCTURE_LABELS[key] ?? key}>
              {({ id }) => (
                <Input
                  id={id}
                  surface="admin"
                  type="number"
                  value={String(value)}
                  onChange={(event) => setStructure({ ...structure, [key]: Number(event.target.value) })}
                />
              )}
            </Field>
          ))}
        </div>
      </section>

      <section className="bg-white rounded-2xl border border-gray-100 p-6">
        <h2 className="font-bold text-gray-900 mb-1">Границы шансов</h2>
        <p className="text-sm text-gray-500 mb-4">
          Высокий шанс: балл ≥ проходной + {bands.high}. Есть шанс: проходной {bands.medium} ≤ балл.
        </p>
        <div className="grid md:grid-cols-2 gap-4">
          <Field label="Высокий шанс (+)">
            {({ id }) => (
              <Input id={id} surface="admin" type="number" value={String(bands.high)} onChange={(event) => setBands({ ...bands, high: Number(event.target.value) })} />
            )}
          </Field>
          <Field label="Средний шанс (−)">
            {({ id }) => (
              <Input id={id} surface="admin" type="number" value={String(bands.medium)} onChange={(event) => setBands({ ...bands, medium: Number(event.target.value) })} />
            )}
          </Field>
        </div>
      </section>

      <section className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
        <h2 className="font-bold text-gray-900">Отзывы и вход</h2>
        <label className="flex items-center gap-3 text-sm text-gray-700">
          <Switch checked={autoPublish} onChange={setAutoPublish} label="Автопубликация отзывов" />
          Публиковать отзывы без модерации
        </label>
        <label className="flex items-center gap-3 text-sm text-gray-700">
          <Switch checked={phoneAuth} onChange={setPhoneAuth} label="Вход по телефону" />
          Показывать вход по номеру телефона (нужен SMS-провайдер в Supabase)
        </label>
        <Field label="Минимум отзывов для показа рейтинга">
          {({ id }) => (
            <Input id={id} surface="admin" type="number" value={String(minReviews)} onChange={(event) => setMinReviews(Number(event.target.value))} className="max-w-[160px]" />
          )}
        </Field>
        <Field label="Контактная почта платформы">
          {({ id }) => <Input id={id} surface="admin" value={contactEmail} onChange={(event) => setContactEmail(event.target.value)} />}
        </Field>
      </section>

      <section className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
        <h2 className="font-bold text-gray-900">Дисклеймер калькулятора</h2>
        <Field label="RU">
          {({ id }) => <Textarea id={id} surface="admin" rows={3} value={disclaimer.ru} onChange={(event) => setDisclaimer({ ...disclaimer, ru: event.target.value })} />}
        </Field>
        <Field label="KZ">
          {({ id }) => <Textarea id={id} surface="admin" rows={3} value={disclaimer.kk} onChange={(event) => setDisclaimer({ ...disclaimer, kk: event.target.value })} />}
        </Field>
      </section>

      <div className="flex gap-3">
        <Button loading={pending} onClick={save}>
          Сохранить настройки
        </Button>
        <Button
          variant="secondary"
          onClick={() =>
            startTransition(async () => {
              const result = await purgeCache()
              if (result.ok) toast.success('Кэш очищен')
              else toast.error(result.error)
            })
          }
        >
          <RefreshCw className="w-4 h-4" aria-hidden /> Очистить кэш
        </Button>
      </div>
    </div>
  )
}
