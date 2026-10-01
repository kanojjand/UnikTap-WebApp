'use client'

import { useMemo, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Check, ChevronDown, MapPin, Search, X } from 'lucide-react'
import { Chip } from '@/components/ui/chip'
import { BottomSheet } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Input, Select } from '@/components/ui/input'
import { track } from '@/lib/analytics'
import { cn } from '@/lib/utils'
import type { City, Specialty } from '@/types/domain'

type SheetKey = 'city' | 'score' | 'fee' | 'specialty' | 'studyForm' | 'language' | 'type' | null

const FILTER_KEYS = ['city', 'score', 'feeMax', 'specialty', 'studyForm', 'language', 'military', 'dormitory', 'type']

export function CatalogFilters({
  specialties,
  cities,
  locale,
}: {
  specialties: Specialty[]
  cities: City[]
  locale: string
}) {
  const t = useTranslations('catalog')
  const tc = useTranslations('common')
  const tf = useTranslations('studyForms')
  const tt = useTranslations('types')
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [sheet, setSheet] = useState<SheetKey>(null)

  const get = (key: string) => searchParams.get(key) ?? ''
  const activeCount = FILTER_KEYS.filter((key) => get(key)).length
  const localized = (item: { name_ru: string; name_kk?: string | null }) =>
    locale === 'kk' && item.name_kk ? item.name_kk : item.name_ru

  function update(patch: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString())
    for (const [key, value] of Object.entries(patch)) {
      if (value) params.set(key, value)
      else params.delete(key)
    }
    params.delete('page')
    router.replace(`${pathname}?${params.toString()}`, { scroll: false })
    track('filter_apply', { filters: Object.fromEntries(params.entries()) })
  }

  function pickAndClose(patch: Record<string, string | null>) {
    update(patch)
    setSheet(null)
  }

  function resetAll() {
    // Поисковый запрос сохраняем — сбрасываем только фильтры
    const q = get('q')
    router.replace(q ? `${pathname}?q=${encodeURIComponent(q)}` : pathname, { scroll: false })
  }

  const city = cities.find((item) => item.slug === get('city'))
  const specialty = specialties.find((item) => item.code === get('specialty'))

  return (
    <div className="mb-5">
      {/* Горизонтальная лента на телефоне, перенос строк на компьютере */}
      <div className="flex gap-2 overflow-x-auto hide-scroll -mx-4 px-4 pb-1 md:mx-0 md:px-0 md:flex-wrap md:overflow-visible">
        <Chip active={Boolean(city)} onClick={() => setSheet('city')}>
          <MapPin className="w-4 h-4" aria-hidden />
          {city ? localized(city) : tc('allCities')}
          <ChevronDown className="w-4 h-4 opacity-60" aria-hidden />
        </Chip>
        <Chip active={Boolean(get('score'))} onClick={() => setSheet('score')}>
          {get('score') ? `${t('filterScore')}: ${get('score')}` : t('filterScore')}
          <ChevronDown className="w-4 h-4 opacity-60" aria-hidden />
        </Chip>
        <Chip active={Boolean(get('feeMax'))} onClick={() => setSheet('fee')}>
          {get('feeMax') ? t('feeMax', { value: Number(get('feeMax')).toLocaleString('ru-KZ') }) : t('filterFee')}
          <ChevronDown className="w-4 h-4 opacity-60" aria-hidden />
        </Chip>
        <Chip active={Boolean(specialty)} onClick={() => setSheet('specialty')} className="max-w-[260px]">
          <span className="truncate">{specialty ? localized(specialty) : t('filterSpecialty')}</span>
          <ChevronDown className="w-4 h-4 opacity-60 shrink-0" aria-hidden />
        </Chip>
        <Chip active={Boolean(get('type'))} onClick={() => setSheet('type')}>
          {get('type') ? tt(get('type') as 'state') : t('filterType')}
          <ChevronDown className="w-4 h-4 opacity-60" aria-hidden />
        </Chip>
        <Chip active={Boolean(get('studyForm'))} onClick={() => setSheet('studyForm')}>
          {get('studyForm') ? tf(get('studyForm') as 'full_time') : t('filterStudyForm')}
          <ChevronDown className="w-4 h-4 opacity-60" aria-hidden />
        </Chip>
        <Chip active={Boolean(get('language'))} onClick={() => setSheet('language')}>
          {get('language') ? (LANGUAGES[get('language')] ?? get('language')) : t('filterLanguage')}
          <ChevronDown className="w-4 h-4 opacity-60" aria-hidden />
        </Chip>
        <Chip active={Boolean(get('military'))} onClick={() => update({ military: get('military') ? null : '1' })}>
          {get('military') ? <Check className="w-4 h-4" aria-hidden /> : null}
          {t('filterMilitary')}
        </Chip>
        <Chip active={Boolean(get('dormitory'))} onClick={() => update({ dormitory: get('dormitory') ? null : '1' })}>
          {get('dormitory') ? <Check className="w-4 h-4" aria-hidden /> : null}
          {t('filterDormitory')}
        </Chip>
      </div>

      <div className="flex items-center justify-between mt-3 gap-3">
        <Select
          aria-label={tc('sort')}
          value={get('sort') || 'relevance'}
          onChange={(event) => update({ sort: event.target.value === 'relevance' ? null : event.target.value })}
          className="w-auto min-h-[44px] py-2 bg-transparent border-transparent px-0 pr-9 font-medium text-body focus:bg-transparent focus:ring-0"
        >
          <option value="relevance">{t('sortRelevance')}</option>
          <option value="rating">{t('sortRating')}</option>
          <option value="fee_asc">{t('sortFeeAsc')}</option>
          <option value="fee_desc">{t('sortFeeDesc')}</option>
          <option value="score">{t('sortScore')}</option>
          <option value="popular">{t('sortPopular')}</option>
        </Select>

        {activeCount > 0 ? (
          <button
            type="button"
            onClick={resetAll}
            className="min-h-[44px] px-3 -mr-3 rounded-xl text-sm font-semibold text-primary-ink flex items-center gap-1.5 shrink-0 hover:bg-primary-soft"
          >
            <X className="w-4 h-4" aria-hidden />
            {tc('reset')} · {activeCount}
          </button>
        ) : null}
      </div>

      <BottomSheet open={sheet === 'city'} onClose={() => setSheet(null)} title={t('filterCity')}>
        <OptionList
          value={get('city')}
          allLabel={tc('allCities')}
          options={cities.map((item) => ({ value: item.slug, label: localized(item) }))}
          onPick={(value) => pickAndClose({ city: value })}
        />
      </BottomSheet>

      <BottomSheet open={sheet === 'score'} onClose={() => setSheet(null)} title={t('filterScore')}>
        <ScoreSheet value={get('score')} onApply={(value) => pickAndClose({ score: value })} />
      </BottomSheet>

      <BottomSheet open={sheet === 'fee'} onClose={() => setSheet(null)} title={t('filterFee')}>
        <OptionList
          value={get('feeMax')}
          allLabel={tc('all')}
          options={[400000, 600000, 900000, 1500000].map((value) => ({
            value: String(value),
            label: t('feeMax', { value: value.toLocaleString('ru-KZ') }),
          }))}
          onPick={(value) => pickAndClose({ feeMax: value })}
        />
      </BottomSheet>

      <BottomSheet open={sheet === 'specialty'} onClose={() => setSheet(null)} title={t('filterSpecialty')}>
        <SpecialtySheet
          value={get('specialty')}
          specialties={specialties}
          localized={localized}
          onPick={(value) => pickAndClose({ specialty: value })}
        />
      </BottomSheet>

      <BottomSheet open={sheet === 'studyForm'} onClose={() => setSheet(null)} title={t('filterStudyForm')}>
        <OptionList
          value={get('studyForm')}
          allLabel={tc('all')}
          options={(['full_time', 'part_time', 'evening', 'distance'] as const).map((form) => ({
            value: form,
            label: tf(form),
          }))}
          onPick={(value) => pickAndClose({ studyForm: value })}
        />
      </BottomSheet>

      <BottomSheet open={sheet === 'language'} onClose={() => setSheet(null)} title={t('filterLanguage')}>
        <OptionList
          value={get('language')}
          allLabel={tc('all')}
          options={Object.entries(LANGUAGES).map(([value, label]) => ({ value, label }))}
          onPick={(value) => pickAndClose({ language: value })}
        />
      </BottomSheet>

      <BottomSheet open={sheet === 'type'} onClose={() => setSheet(null)} title={t('filterType')}>
        <OptionList
          value={get('type')}
          allLabel={tc('all')}
          options={(['national', 'state', 'private', 'international', 'autonomous'] as const).map((type) => ({
            value: type,
            label: tt(type),
          }))}
          onPick={(value) => pickAndClose({ type: value })}
        />
      </BottomSheet>
    </div>
  )
}

const LANGUAGES: Record<string, string> = { ru: 'Русский', kk: 'Қазақша', en: 'English' }

/** Список вариантов: одна строка — одно нажатие, выбранное отмечено галочкой. */
function OptionList({
  value,
  allLabel,
  options,
  onPick,
}: {
  value: string
  allLabel: string
  options: { value: string; label: React.ReactNode; hint?: string }[]
  onPick: (value: string | null) => void
}) {
  return (
    <ul className="-mx-2" role="listbox">
      {[{ value: '', label: allLabel } as { value: string; label: React.ReactNode; hint?: string }, ...options].map(
        (option) => {
          const selected = option.value === value
          return (
            <li key={option.value || 'all'}>
              <button
                type="button"
                role="option"
                aria-selected={selected}
                onClick={() => onPick(option.value || null)}
                className={cn(
                  'w-full min-h-[52px] px-3 py-2.5 rounded-xl flex items-center gap-3 text-left text-[15px] transition-colors',
                  selected ? 'bg-primary-soft text-primary-ink font-semibold' : 'text-ink hover:bg-subtle',
                )}
              >
                {option.hint ? <span className="text-sm text-muted font-mono shrink-0">{option.hint}</span> : null}
                <span className="flex-1">{option.label}</span>
                {selected ? <Check className="w-5 h-5 shrink-0" aria-hidden /> : null}
              </button>
            </li>
          )
        },
      )}
    </ul>
  )
}

function SpecialtySheet({
  value,
  specialties,
  localized,
  onPick,
}: {
  value: string
  specialties: Specialty[]
  localized: (item: Specialty) => string
  onPick: (value: string | null) => void
}) {
  const t = useTranslations('catalog')
  const tc = useTranslations('common')
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return specialties
    return specialties.filter(
      (item) => localized(item).toLowerCase().includes(needle) || item.code.toLowerCase().includes(needle),
    )
  }, [specialties, query, localized])

  return (
    <div className="space-y-3">
      <div className="relative sticky top-0 bg-surface pb-1 z-10">
        <Search
          className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted pointer-events-none"
          aria-hidden
        />
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t('filterSpecialty')}
          aria-label={t('filterSpecialty')}
          className="pl-11"
        />
      </div>
      <OptionList
        value={value}
        allLabel={tc('all')}
        options={filtered.map((item) => ({ value: item.code, label: localized(item), hint: item.code }))}
        onPick={onPick}
      />
    </div>
  )
}

function ScoreSheet({ value, onApply }: { value: string; onApply: (value: string | null) => void }) {
  const [score, setScore] = useState(value)
  const t = useTranslations('catalog')
  const tc = useTranslations('common')

  return (
    <form
      className="space-y-3"
      onSubmit={(event) => {
        event.preventDefault()
        onApply(score || null)
      }}
    >
      <Input
        type="number"
        inputMode="numeric"
        enterKeyHint="done"
        min={0}
        max={140}
        value={score}
        onChange={(event) => setScore(event.target.value)}
        placeholder={t('scorePlaceholder')}
        aria-label={t('filterScore')}
        className="text-xl font-semibold"
      />
      <Button type="submit" fullWidth>
        {tc('apply')}
      </Button>
      {value ? (
        <Button variant="ghost" fullWidth onClick={() => onApply(null)}>
          {tc('reset')}
        </Button>
      ) : null}
    </form>
  )
}
