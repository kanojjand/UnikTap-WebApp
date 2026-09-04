import Image from 'next/image'
import { Calculator, Info } from 'lucide-react'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { BottomNav } from '@/components/ui/bottom-nav'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/empty-state'
import { ScoreInput } from '@/components/student/score-input'
import { CalculatorTabs } from '@/components/student/calculator-tabs'
import { ShareButton } from '@/components/student/share-button'
import { getAllMajors } from '@/lib/queries/universities'
import { getEntSubjects } from '@/lib/queries/dictionaries'
import { getSettings } from '@/lib/queries/settings'
import { getCurrentProfile } from '@/lib/queries/profile'
import { rankMajorsByChance, type Chance } from '@/lib/ent'
import { formatMoney, pick } from '@/lib/utils'

// Зависит от сессии пользователя — рендерим на каждый запрос
export const dynamic = 'force-dynamic'


export default async function CalculatorPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  const query = await searchParams

  const t = await getTranslations('calculator')
  const [settings, subjects, profile] = await Promise.all([getSettings(), getEntSubjects(), getCurrentProfile()])

  const single = (key: string) => {
    const value = query[key]
    return Array.isArray(value) ? value[0] : value
  }

  const score = Number(single('score')) || profile?.ent_score || 0
  const tab = single('tab') === 'chances' ? 'chances' : 'score'

  return (
    <div className="min-h-[100dvh] pb-24 bg-slateBg">
      <header className="bg-corpBlue px-4 pt-10 pb-6 rounded-b-2xl flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">{t('title')}</h1>
        <ShareButton title={t('shareResult')} className="text-white/80" />
      </header>

      <div className="pt-4">
        <CalculatorTabs />
      </div>

      <div className="px-4">
        {tab === 'score' ? (
          <ScoreInput
            subjects={subjects}
            settings={settings}
            isGuest={!profile}
            locale={locale}
            initial={{
              score: score || null,
              subject1: Number(single('s1')) || profile?.ent_subject_1_id || null,
              subject2: Number(single('s2')) || profile?.ent_subject_2_id || null,
              details: profile?.ent_details ?? {},
            }}
          />
        ) : (
          <Chances
            score={score}
            locale={locale}
            subject1={Number(single('s1')) || profile?.ent_subject_1_id || null}
            subject2={Number(single('s2')) || profile?.ent_subject_2_id || null}
          />
        )}
      </div>

      <BottomNav />
    </div>
  )
}

const GROUPS: { chance: Chance; key: 'high' | 'medium' | 'low'; tone: 'success' | 'warning' | 'danger' }[] = [
  { chance: 'high', key: 'high', tone: 'success' },
  { chance: 'medium', key: 'medium', tone: 'warning' },
  { chance: 'low', key: 'low', tone: 'danger' },
]

async function Chances({
  score,
  locale,
  subject1,
  subject2,
}: {
  score: number
  locale: string
  subject1: number | null
  subject2: number | null
}) {
  const t = await getTranslations('calculator')
  const tu = await getTranslations('university')

  if (!score) {
    return (
      <EmptyState icon={<Calculator className="w-12 h-12" />} title={t('emptyTitle')} text={t('emptyText')} />
    )
  }

  const [settings, majors] = await Promise.all([getSettings(), getAllMajors()])
  const rows = rankMajorsByChance(majors, score, settings, [subject1, subject2])
  const belowThreshold = rows.filter((row) => row.chance === 'below_threshold')

  return (
    <div className="space-y-6">
      <Card className="flex items-center justify-between">
        <span className="text-sm text-gray-500">{t('yourScoreShort')}</span>
        <span className="text-2xl font-bold text-corpBlue">{score}</span>
      </Card>

      {belowThreshold.length > 0 && belowThreshold.length === rows.length ? (
        <p className="text-sm bg-red-50 text-red-700 rounded-xl p-4">
          {t('thresholdWarning', { threshold: belowThreshold[0].threshold })}
        </p>
      ) : null}

      {GROUPS.map((group) => {
        const items = rows.filter((row) => row.chance === group.chance)
        if (items.length === 0) return null

        return (
          <section key={group.key}>
            <h2 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
              <Badge tone={group.tone}>{t(group.key)}</Badge>
              <span className="text-xs text-gray-400">{items.length}</span>
            </h2>
            <ul className="space-y-2">
              {items.slice(0, 40).map(({ major, diff, subjectsMatch }) => (
                <li key={major.id}>
                  <Link
                    href={`/universities/${major.university?.slug ?? ''}?tab=majors`}
                    className="block bg-white rounded-2xl border border-gray-100 p-4 shadow-card"
                  >
                    <p className="font-bold text-sm text-gray-900 leading-tight flex items-center gap-2">
                      {major.university?.logo_url ? (
                        <span className="relative w-7 h-7 shrink-0 rounded-md border border-gray-100 bg-white overflow-hidden">
                          <Image
                            src={major.university.logo_url}
                            alt=""
                            fill
                            sizes="28px"
                            className="object-contain p-0.5"
                          />
                        </span>
                      ) : null}
                      {pick(major.university as unknown as Record<string, unknown>, 'name', locale)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      <span className="font-mono text-gray-400">{major.specialty?.code}</span>{' '}
                      {pick(major.specialty as unknown as Record<string, unknown>, 'name', locale)}
                    </p>
                    <div className="flex flex-wrap gap-2 mt-2 text-[11px]">
                      <span className="text-gray-500">
                        {t('needed')}: <b className="text-gray-800">{major.grant_score ?? '—'}</b>
                      </span>
                      {diff !== null ? (
                        <span className={diff >= 0 ? 'text-green-600' : 'text-red-600'}>
                          {t('diff')}: {diff > 0 ? '+' : ''}
                          {diff}
                        </span>
                      ) : null}
                      <span className="text-gray-500">
                        {tu('feePerYear')}: <b className="text-gray-800">{formatMoney(major.fee_per_year, locale)}</b>
                      </span>
                      {!subjectsMatch ? <span className="text-gray-400">≠ профильные</span> : null}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )
      })}

      <p className="text-xs text-gray-500 bg-white rounded-xl p-4 flex gap-2 items-start">
        <Info className="w-4 h-4 shrink-0 mt-0.5 text-gray-400" aria-hidden />
        {t('disclaimer')}
      </p>
    </div>
  )
}
