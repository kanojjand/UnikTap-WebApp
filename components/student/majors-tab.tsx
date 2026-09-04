'use client'

import { useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Search } from 'lucide-react'
import { Accordion } from '@/components/ui/accordion'
import { Badge } from '@/components/ui/badge'
import { Input, Select } from '@/components/ui/input'
import { EmptyState } from '@/components/ui/empty-state'
import { formatMoney, pick } from '@/lib/utils'
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
      const name = pick(major.specialty as unknown as Record<string, unknown>, 'name', locale).toLowerCase()
      const code = major.specialty?.code?.toLowerCase() ?? ''
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
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" aria-hidden />
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t('majorsSearch')}
          aria-label={t('majorsSearch')}
          className="pl-9"
        />
      </div>

      <div className="flex gap-2">
        <Select value={degree} onChange={(event) => setDegree(event.target.value)} aria-label={t('duration')} className="py-2 text-sm">
          <option value="">{td('bachelor')} · {td('master')}</option>
          <option value="bachelor">{td('bachelor')}</option>
          <option value="master">{td('master')}</option>
          <option value="phd">{td('phd')}</option>
        </Select>
        <Select value={language} onChange={(event) => setLanguage(event.target.value)} aria-label={t('languages')} className="py-2 text-sm">
          <option value="">{t('languages')}</option>
          <option value="ru">RU</option>
          <option value="kk">KZ</option>
          <option value="en">EN</option>
        </Select>
      </div>

      {filtered.map(({ major, chance, subjectsMatch }) => {
        const name = pick(major.specialty as unknown as Record<string, unknown>, 'name', locale)
        const history = (major.history ?? []).filter((h) => h.grant_score != null)

        return (
          <Accordion
            key={major.id}
            onOpen={() => track('major_expand', {}, { universityId, majorId: major.id })}
            header={
              <span className="block">
                <span className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold text-gray-400 font-mono">{major.specialty?.code}</span>
                  <span className="font-bold text-gray-800 text-sm">{name}</span>
                </span>
                <span className="flex flex-wrap gap-1.5">
                  {chance ? (
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${CHANCE_STYLES[chance]}`}>
                      {tc(chance)}
                    </span>
                  ) : null}
                  {!subjectsMatch ? (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                      {tc('otherSubjects')}
                    </span>
                  ) : null}
                  {major.grant_score ? (
                    <span className="text-[10px] text-gray-500">
                      {t('grantScore')}: <b>{major.grant_score}</b>
                    </span>
                  ) : null}
                </span>
              </span>
            }
          >
            <dl className="text-sm divide-y divide-gray-100">
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
              <p className="text-xs text-gray-500 mt-3 leading-relaxed">
                {pick(major as unknown as Record<string, unknown>, 'description', locale)}
              </p>
            ) : null}

            {history.length > 1 ? (
              <div className="mt-3">
                <p className="text-[10px] uppercase font-bold text-gray-400">{t('dynamics')}</p>
                <Sparkline points={history.map((h) => ({ year: h.year, value: h.grant_score as number }))} />
              </div>
            ) : null}
          </Accordion>
        )
      })}

      {filtered.length === 0 ? <EmptyState title={t('noMajors')} /> : null}
      <p className="text-[10px] text-gray-400 pt-2">
        <Badge tone="neutral" mini>
          {filtered.length} / {rows.length}
        </Badge>
      </p>
    </div>
  )
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 py-2">
      <dt className="text-gray-500">{label}</dt>
      <dd className="font-semibold text-gray-800 text-right">{value}</dd>
    </div>
  )
}
