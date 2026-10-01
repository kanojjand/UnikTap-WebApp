'use client'

import { useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Search } from 'lucide-react'
import { Accordion } from '@/components/ui/accordion'
import { Input, Select } from '@/components/ui/input'
import { EmptyState } from '@/components/ui/empty-state'
import { cn, formatMoney, majorCode, majorName, pick } from '@/lib/utils'
import { CHANCE_STYLES, type Chance } from '@/lib/ent'
import { track } from '@/lib/analytics'
import type { UniversityMajor } from '@/types/domain'
import { Sparkline } from './sparkline'

export interface MajorRow {
  major: UniversityMajor
  chance?: Chance
  subjectsMatch: boolean
}

export function MajorsTab({
  rows,
  locale,
  universityId,
  subjectNames,
}: {
  rows: MajorRow[]
  locale: string
  universityId: string
  subjectNames: Record<number, string>
}) {
  const t = useTranslations('university')
  const tc = useTranslations('chance')
  const td = useTranslations('degrees')
  const tf = useTranslations('studyForms')
  const [query, setQuery] = useState('')
  const [degree, setDegree] = useState('')
  const [language, setLanguage] = useState('')

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return rows.filter(({ major }) => {
      const name = majorName(major, locale).toLowerCase()
      const code = majorCode(major).toLowerCase()
      if (needle && !name.includes(needle) && !code.includes(needle)) return false
      if (degree && major.degree !== degree) return false
      if (language && !major.languages.includes(language)) return false
      return true
    })
  }, [rows, query, degree, language, locale])

  if (rows.length === 0) {
    return <EmptyState title={t('noMajors')} />
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-2 md:grid-cols-[minmax(0,1fr)_180px_160px]">
        <div className="relative">
          <Search
            className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted pointer-events-none"
            aria-hidden
          />
          <Input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t('majorsSearch')}
            aria-label={t('majorsSearch')}
            className="pl-11"
          />
        </div>
        <div className="grid grid-cols-2 gap-2 md:contents">
          <Select value={degree} onChange={(event) => setDegree(event.target.value)} aria-label={t('degree')}>
            <option value="">{t('allDegrees')}</option>
            <option value="bachelor">{td('bachelor')}</option>
            <option value="master">{td('master')}</option>
            <option value="phd">{td('phd')}</option>
          </Select>
          <Select value={language} onChange={(event) => setLanguage(event.target.value)} aria-label={t('languages')}>
            <option value="">{t('allLanguages')}</option>
            <option value="ru">Русский</option>
            <option value="kk">Қазақша</option>
            <option value="en">English</option>
          </Select>
        </div>
      </div>

      <p className="text-sm text-muted" role="status">
        {t('majorsShown', { shown: filtered.length, total: rows.length })}
      </p>

      <div className="space-y-2">
        {filtered.map(({ major, chance, subjectsMatch }) => {
          const name = majorName(major, locale)
          const group = major.program_name_ru && major.specialty
            ? `${major.specialty.code} · ${pick(major.specialty as unknown as Record<string, unknown>, 'name', locale)}`
            : ''
          const history = (major.history ?? []).filter((h) => h.grant_score != null)

          return (
            <Accordion
              key={major.id}
              onOpen={() => track('major_expand', {}, { universityId, majorId: major.id })}
              header={
                <span className="block">
                  <span className="block font-semibold text-ink text-[15px] leading-snug">{name}</span>
                  <span className="flex flex-wrap items-center gap-x-3 gap-y-1.5 mt-1.5 text-sm text-muted">
                    <span className="font-mono">{majorCode(major)}</span>
                    {major.grant_score ? (
                      <span>
                        {t('grantScore')}: <b className="text-ink">{major.grant_score}</b>
                      </span>
                    ) : null}
                    {chance ? (
                      <span className={cn('text-xs px-2 py-0.5 rounded-full font-semibold', CHANCE_STYLES[chance])}>
                        {tc(chance)}
                      </span>
                    ) : null}
                    {!subjectsMatch ? (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-subtle text-body">
                        {tc('otherSubjects')}
                      </span>
                    ) : null}
                  </span>
                </span>
              }
            >
              <dl className="text-[15px] divide-y divide-line">
                {group ? <Row label={t('programGroup')} value={group} /> : null}
                <Row label={t('grantScore')} value={major.grant_score ?? '—'} />
                <Row label={t('paidMin')} value={major.paid_min_score ?? '—'} />
                <Row label={t('feePerYear')} value={formatMoney(major.fee_per_year, locale)} />
                <Row label={t('duration')} value={t('years', { count: major.duration_years })} />
                <Row label={t('studyForms')} value={major.study_forms.map((form) => tf(form)).join(', ')} />
                <Row label={t('languages')} value={major.languages.map((l) => l.toUpperCase()).join(', ')} />
                {major.grants_count ? <Row label={t('grantsCount')} value={major.grants_count} /> : null}
                {major.specialty?.subject_1_id ? (
                  <Row
                    label={t('subjects')}
                    value={[major.specialty.subject_1_id, major.specialty.subject_2_id]
                      .filter(Boolean)
                      .map((id) => subjectNames[id as number] ?? '')
                      .filter(Boolean)
                      .join(' · ')}
                  />
                ) : null}
              </dl>

              {major.description_ru ? (
                <p className="text-sm text-body mt-3 leading-relaxed">
                  {pick(major as unknown as Record<string, unknown>, 'description', locale)}
                </p>
              ) : null}

              {history.length > 1 ? (
                <div className="mt-4">
                  <p className="text-xs font-semibold text-muted">{t('dynamics')}</p>
                  <Sparkline points={history.map((h) => ({ year: h.year, value: h.grant_score as number }))} />
                </div>
              ) : null}
            </Accordion>
          )
        })}
      </div>

      {filtered.length === 0 ? <EmptyState icon={<Search />} title={t('noMajorsFound')} /> : null}
    </div>
  )
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 py-2.5">
      <dt className="text-muted">{label}</dt>
      <dd className="font-semibold text-ink text-right">{value}</dd>
    </div>
  )
}
