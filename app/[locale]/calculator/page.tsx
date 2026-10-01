import Image from 'next/image'
import { Calculator, Info, PartyPopper } from 'lucide-react'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/empty-state'
import { PageHeader } from '@/components/ui/page-header'
import { buttonClass } from '@/components/ui/button-styles'
import { ScoreInput } from '@/components/student/score-input'
import { CalculatorTabs } from '@/components/student/calculator-tabs'
import { ShareButton } from '@/components/student/share-button'
import { getAllMajors } from '@/lib/queries/universities'
import { getEntSubjects } from '@/lib/queries/dictionaries'
import { getSettings } from '@/lib/queries/settings'
import { getCurrentProfile } from '@/lib/queries/profile'
import { rankMajorsByChance, type Chance } from '@/lib/ent'
import { cn, formatMoney, majorName, pick } from '@/lib/utils'

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
  const subject1 = Number(single('s1')) || profile?.ent_subject_1_id || null
  const subject2 = Number(single('s2')) || profile?.ent_subject_2_id || null

  return (
    <div className="pb-nav">
      <PageHeader
        title={t('title')}
        subtitle={t('subtitle')}
        action={
          tab === 'chances' && score ? (
            <ShareButton title={t('shareResult')} className="rounded-full text-muted hover:text-ink hover:bg-subtle" />
          ) : null
        }
      />

      <div className="container-app max-w-3xl md:max-w-4xl">
        <CalculatorTabs />

        <div className="pt-5">
          {tab === 'score' ? (
            <ScoreInput
              subjects={subjects}
              settings={settings}
              isGuest={!profile}
              locale={locale}
              initial={{
                score: score || null,
                subject1,
                subject2,
                details: profile?.ent_details ?? {},
              }}
            />
          ) : (
            <Chances score={score} locale={locale} subject1={subject1} subject2={subject2} />
          )}
        </div>
      </div>
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
      <EmptyState
        icon={<Calculator />}
        title={t('emptyTitle')}
        text={t('emptyText')}
        action={
          <Link href="/calculator" className={buttonClass()}>
            {t('tabScore')}
          </Link>
        }
      />
    )
  }

  const [settings, majors] = await Promise.all([getSettings(), getAllMajors()])
  const rows = rankMajorsByChance(majors, score, settings, [subject1, subject2])
  const belowThreshold = rows.filter((row) => row.chance === 'below_threshold')
  const highCount = rows.filter((row) => row.chance === 'high').length

  return (
    <div className="space-y-8">
      <div className="rounded-2xl bg-primary-soft p-4 md:p-5 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm text-muted">{t('yourScoreShort')}</p>
          <p className="text-3xl font-bold text-primary-ink leading-tight">{score}</p>
        </div>
        <Link
          href={`/calculator?score=${score}`}
          className="min-h-[44px] px-4 rounded-xl bg-surface text-ink text-sm font-semibold inline-flex items-center border border-line hover:bg-subtle"
        >
          {t('changeScore')}
        </Link>
      </div>

      {/* Маленький праздник, если есть хорошие варианты */}
      {highCount > 0 ? (
        <p className="flex items-start gap-3 rounded-2xl bg-success-soft text-success p-4 font-medium" role="status">
          <PartyPopper className="w-5 h-5 shrink-0 mt-0.5" aria-hidden />
          {t('celebrate', { count: highCount })}
        </p>
      ) : null}

      {belowThreshold.length > 0 && belowThreshold.length === rows.length ? (
        <p className="text-[15px] bg-danger-soft text-danger rounded-2xl p-4" role="alert">
          {t('thresholdWarning', { threshold: belowThreshold[0].threshold })}
        </p>
      ) : null}

      {GROUPS.map((group) => {
        const items = rows.filter((row) => row.chance === group.chance)
        if (items.length === 0) return null

        return (
          <section key={group.key} aria-labelledby={`group-${group.key}`}>
            <h2 id={`group-${group.key}`} className="font-bold text-ink mb-3 flex items-center gap-2">
              <Badge tone={group.tone}>{t(group.key)}</Badge>
              <span className="text-sm text-muted font-medium">{items.length}</span>
            </h2>
            <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {items.slice(0, 40).map(({ major, diff, subjectsMatch }) => (
                <li key={major.id}>
                  <Link
                    href={`/universities/${major.university?.slug ?? ''}?tab=majors`}
                    className="flex gap-3 h-full bg-surface rounded-2xl border border-line p-4 shadow-card hover:shadow-lift transition-shadow"
                  >
                    <span className="relative w-10 h-10 shrink-0 rounded-lg border border-line bg-white overflow-hidden flex items-center justify-center">
                      {major.university?.logo_url ? (
                        <Image
                          src={major.university.logo_url}
                          alt=""
                          fill
                          sizes="40px"
                          className="object-contain p-1"
                        />
                      ) : (
                        <span className="text-sm font-bold text-slate-400" aria-hidden>
                          {pick(major.university as unknown as Record<string, unknown>, 'name', locale).slice(0, 1)}
                        </span>
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-semibold text-[15px] text-ink leading-snug">
                        {majorName(major, locale)}
                      </span>
                      <span className="block text-sm text-muted mt-0.5 truncate">
                        {pick(major.university as unknown as Record<string, unknown>, 'name', locale)}
                      </span>
                      <span className="flex flex-wrap gap-x-3 gap-y-1 mt-2 text-sm">
                        <span className="text-muted">
                          {t('needed')}: <b className="text-ink">{major.grant_score ?? '—'}</b>
                        </span>
                        {diff !== null ? (
                          <span className={cn('font-semibold', diff >= 0 ? 'text-success' : 'text-danger')}>
                            {diff > 0 ? '+' : ''}
                            {diff}
                          </span>
                        ) : null}
                        <span className="text-muted">
                          {tu('feePerYear')}: <b className="text-ink">{formatMoney(major.fee_per_year, locale)}</b>
                        </span>
                      </span>
                      {!subjectsMatch ? (
                        <span className="block text-sm text-muted mt-1">{t('otherSubjects')}</span>
                      ) : null}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )
      })}

      <p className="text-sm text-muted bg-surface border border-line rounded-2xl p-4 flex gap-3 items-start">
        <Info className="w-5 h-5 shrink-0 text-muted" aria-hidden />
        {t('disclaimer')}
      </p>
    </div>
  )
}
