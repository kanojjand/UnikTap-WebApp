'use client'

import { useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { SlidersHorizontal, X } from 'lucide-react'
import { Chip } from '@/components/ui/chip'
import { BottomSheet } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Input, Select } from '@/components/ui/input'
import { track } from '@/lib/analytics'
import type { Specialty } from '@/types/domain'

type SheetKey = 'score' | 'fee' | 'specialty' | 'studyForm' | 'language' | 'type' | null

export function CatalogFilters({ specialties, locale }: { specialties: Specialty[]; locale: string }) {
  const t = useTranslations('catalog')
  const tc = useTranslations('common')
  const tf = useTranslations('studyForms')
  const tt = useTranslations('types')
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [sheet, setSheet] = useState<SheetKey>(null)

  const get = (key: string) => searchParams.get(key) ?? ''
  const activeCount = ['city', 'score', 'feeMax', 'specialty', 'studyForm', 'language', 'military', 'dormitory', 'type']
    .filter((key) => get(key)).length

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

  function toggle(key: string) {
    update({ [key]: get(key) ? null : '1' })
  }

  const specialtyName = specialties.find((s) => s.code === get('specialty'))

  return (
    <div className="mb-4">
      <div className="flex gap-2 overflow-x-auto hide-scroll pb-1">
        <Chip active={Boolean(get('score'))} onClick={() => setSheet('score')}>
          {get('score') ? `${t('filterScore')}: ${get('score')}` : t('filterScore')}
        </Chip>
        <Chip active={Boolean(get('feeMax'))} onClick={() => setSheet('fee')}>
          {get('feeMax') ? t('feeMax', { value: Number(get('feeMax')).toLocaleString('ru-KZ') }) : t('filterFee')}
        </Chip>
        <Chip active={Boolean(get('specialty'))} onClick={() => setSheet('specialty')}>
          {specialtyName
            ? locale === 'kk' && specialtyName.name_kk
              ? specialtyName.name_kk
              : specialtyName.name_ru
            : t('filterSpecialty')}
        </Chip>
        <Chip active={Boolean(get('studyForm'))} onClick={() => setSheet('studyForm')}>
          {get('studyForm') ? tf(get('studyForm') as 'full_time') : t('filterStudyForm')}
        </Chip>
        <Chip active={Boolean(get('language'))} onClick={() => setSheet('language')}>
          {get('language') ? get('language').toUpperCase() : t('filterLanguage')}
        </Chip>
        <Chip active={Boolean(get('type'))} onClick={() => setSheet('type')}>
          {get('type') ? tt(get('type') as 'state') : t('filterType')}
        </Chip>
        <Chip active={Boolean(get('military'))} onClick={() => toggle('military')}>
          {t('filterMilitary')}
        </Chip>
        <Chip active={Boolean(get('dormitory'))} onClick={() => toggle('dormitory')}>
          {t('filterDormitory')}
        </Chip>
      </div>

      <div className="flex items-center justify-between mt-3 gap-2">
        <Select
          surface="light"
          aria-label={tc('sort')}
          value={get('sort') || 'relevance'}
          onChange={(event) => update({ sort: event.target.value === 'relevance' ? null : event.target.value })}
          className="py-2 text-sm max-w-[190px]"
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
            onClick={() => router.replace(pathname, { scroll: false })}
            className="text-xs font-medium text-corpBlue flex items-center gap-1 shrink-0"
          >
            <X className="w-3.5 h-3.5" aria-hidden />
            {tc('reset')} ({activeCount})
          </button>
        ) : (
          <span className="text-xs text-gray-400 flex items-center gap-1">
            <SlidersHorizontal className="w-3.5 h-3.5" aria-hidden />
            {tc('filters')}
          </span>
        )}
      </div>

      <BottomSheet open={sheet === 'score'} onClose={() => setSheet(null)} title={t('filterScore')}>
        <ScoreSheet value={get('score')} onApply={(value) => { update({ score: value }); setSheet(null) }} />
      </BottomSheet>

      <BottomSheet open={sheet === 'fee'} onClose={() => setSheet(null)} title={t('filterFee')}>
        <div className="space-y-2">
          {[400000, 600000, 900000, 1500000].map((value) => (
            <Button
              key={value}
              variant={get('feeMax') === String(value) ? 'primary' : 'secondary'}
              fullWidth
              onClick={() => { update({ feeMax: String(value) }); setSheet(null) }}
            >
              {t('feeMax', { value: value.toLocaleString('ru-KZ') })}
            </Button>
          ))}
          <Button variant="ghost" fullWidth onClick={() => { update({ feeMax: null }); setSheet(null) }}>
            {tc('reset')}
          </Button>
        </div>
      </BottomSheet>

      <BottomSheet open={sheet === 'specialty'} onClose={() => setSheet(null)} title={t('filterSpecialty')}>
        <div className="space-y-1 max-h-[60vh]">
          <button
            className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-slateBg text-sm"
            onClick={() => { update({ specialty: null }); setSheet(null) }}
          >
            {tc('all')}
          </button>
          {specialties.map((item) => (
            <button
              key={item.id}
              className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-slateBg text-sm flex gap-2"
              onClick={() => { update({ specialty: item.code }); setSheet(null) }}
            >
              <span className="text-gray-400 font-mono text-xs pt-0.5">{item.code}</span>
              <span>{locale === 'kk' && item.name_kk ? item.name_kk : item.name_ru}</span>
            </button>
          ))}
        </div>
      </BottomSheet>

      <BottomSheet open={sheet === 'studyForm'} onClose={() => setSheet(null)} title={t('filterStudyForm')}>
        <div className="space-y-2">
          {(['full_time', 'part_time', 'evening', 'distance'] as const).map((form) => (
            <Button
              key={form}
              variant={get('studyForm') === form ? 'primary' : 'secondary'}
              fullWidth
              onClick={() => { update({ studyForm: form }); setSheet(null) }}
            >
              {tf(form)}
            </Button>
          ))}
          <Button variant="ghost" fullWidth onClick={() => { update({ studyForm: null }); setSheet(null) }}>
            {tc('reset')}
          </Button>
        </div>
      </BottomSheet>

      <BottomSheet open={sheet === 'language'} onClose={() => setSheet(null)} title={t('filterLanguage')}>
        <div className="space-y-2">
          {['ru', 'kk', 'en'].map((code) => (
            <Button
              key={code}
              variant={get('language') === code ? 'primary' : 'secondary'}
              fullWidth
              onClick={() => { update({ language: code }); setSheet(null) }}
            >
              {code === 'ru' ? 'Русский' : code === 'kk' ? 'Қазақша' : 'English'}
            </Button>
          ))}
          <Button variant="ghost" fullWidth onClick={() => { update({ language: null }); setSheet(null) }}>
            {tc('reset')}
          </Button>
        </div>
      </BottomSheet>

      <BottomSheet open={sheet === 'type'} onClose={() => setSheet(null)} title={t('filterType')}>
        <div className="space-y-2">
          {(['national', 'state', 'private', 'international', 'autonomous'] as const).map((type) => (
            <Button
              key={type}
              variant={get('type') === type ? 'primary' : 'secondary'}
              fullWidth
              onClick={() => { update({ type }); setSheet(null) }}
            >
              {tt(type)}
            </Button>
          ))}
          <Button variant="ghost" fullWidth onClick={() => { update({ type: null }); setSheet(null) }}>
            {tc('reset')}
          </Button>
        </div>
      </BottomSheet>
    </div>
  )
}

function ScoreSheet({ value, onApply }: { value: string; onApply: (value: string | null) => void }) {
  const [score, setScore] = useState(value)
  const t = useTranslations('catalog')
  const tc = useTranslations('common')

  return (
    <div className="space-y-3">
      <Input
        type="number"
        min={0}
        max={140}
        value={score}
        onChange={(event) => setScore(event.target.value)}
        placeholder={t('scorePlaceholder')}
        aria-label={t('filterScore')}
      />
      <Button fullWidth onClick={() => onApply(score || null)}>
        {tc('apply')}
      </Button>
      <Button variant="ghost" fullWidth onClick={() => onApply(null)}>
        {tc('reset')}
      </Button>
    </div>
  )
}
