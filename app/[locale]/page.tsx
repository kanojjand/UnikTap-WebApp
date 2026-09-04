import { Suspense } from 'react'
import { SearchX } from 'lucide-react'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { CatalogHeader } from '@/components/student/catalog-header'
import { CatalogFilters } from '@/components/student/catalog-filters'
import { ScoreCard } from '@/components/student/score-card'
import { Announcement } from '@/components/student/announcement'
import { UniversityCard } from '@/components/student/university-card'
import { LoadMore } from '@/components/student/load-more'
import { BottomNav } from '@/components/ui/bottom-nav'
import { EmptyState } from '@/components/ui/empty-state'
import { ListSkeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Link } from '@/i18n/navigation'
import { getCities, getSpecialties } from '@/lib/queries/dictionaries'
import { getSettings } from '@/lib/queries/settings'
import { getUniversities, PAGE_SIZE } from '@/lib/queries/universities'
import { getCurrentProfile, getFavoriteIds } from '@/lib/queries/profile'
import { getChance, getThreshold, resolveThresholdCategory } from '@/lib/ent'
import type { CatalogFilters as Filters, StudyForm, UniversityType } from '@/types/domain'

// Зависит от сессии пользователя — рендерим на каждый запрос
export const dynamic = 'force-dynamic'


type SearchParams = Promise<Record<string, string | string[] | undefined>>

export default async function CatalogPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: SearchParams
}) {
  const { locale } = await params
  setRequestLocale(locale)
  const query = await searchParams

  const [cities, specialties, settings, profile] = await Promise.all([
    getCities(),
    getSpecialties(),
    getSettings(),
    getCurrentProfile(),
  ])

  const single = (key: string) => {
    const value = query[key]
    return Array.isArray(value) ? value[0] : value
  }

  const score = Number(single('score')) || profile?.ent_score || 0
  const page = Math.max(1, Number(single('page')) || 1)

  const filters: Filters = {
    q: single('q'),
    city: single('city'),
    score: Number(single('score')) || undefined,
    feeMax: Number(single('feeMax')) || undefined,
    specialty: single('specialty'),
    studyForm: single('studyForm') as StudyForm | undefined,
    language: single('language'),
    military: Boolean(single('military')),
    dormitory: Boolean(single('dormitory')),
    type: single('type') as UniversityType | undefined,
    sort: (single('sort') as Filters['sort']) ?? 'relevance',
    page,
  }

  return (
    <div className="pb-24 min-h-[100dvh] bg-slateBg">
      <Suspense fallback={<div className="h-40 bg-corpBlue rounded-b-2xl" />}>
        <CatalogHeader cities={cities} locale={locale} />
      </Suspense>

      <Announcement announcement={settings.announcement} locale={locale} />

      <div className="px-4 py-6">
        <ScoreCard savedScore={profile?.ent_score ?? null} />

        <Suspense fallback={<div className="h-16" />}>
          <CatalogFilters specialties={specialties} locale={locale} />
        </Suspense>

        <Suspense key={JSON.stringify(query)} fallback={<ListSkeleton />}>
          <CatalogResults filters={filters} locale={locale} score={score} page={page} minReviews={settings.min_reviews_for_rating} />
        </Suspense>
      </div>

      <BottomNav />
    </div>
  )
}

async function CatalogResults({
  filters,
  locale,
  score,
  page,
  minReviews,
}: {
  filters: Filters
  locale: string
  score: number
  page: number
  minReviews: number
}) {
  const t = await getTranslations('catalog')
  const settings = await getSettings()
  const profile = await getCurrentProfile()
  const favorites = profile ? await getFavoriteIds(profile.id) : new Set<string>()

  let items: Awaited<ReturnType<typeof getUniversities>>['items'] = []
  let total = 0
  try {
    const result = await getUniversities(filters)
    items = result.items
    total = result.total
  } catch (error) {
    console.error('catalog query failed', error)
  }

  if (items.length === 0) {
    return (
      <EmptyState
        icon={<SearchX className="w-12 h-12" />}
        title={t('emptyTitle')}
        text={t('emptyText')}
        action={
          <Link href="/">
            <Button variant="secondary">{t('resetFilters')}</Button>
          </Link>
        }
      />
    )
  }

  return (
    <>
      <h2 className="font-bold text-gray-800 mb-4">{t('found', { count: total })}</h2>
      <ul className="space-y-4">
        {items.map((university) => {
          const chance =
            score > 0
              ? getChance(
                  score,
                  university.min_ent_score,
                  getThreshold(
                    settings.ent_thresholds,
                    resolveThresholdCategory({ universityType: university.type }),
                  ),
                  settings.chance_bands,
                )
              : undefined

          return (
            <UniversityCard
              key={university.id}
              university={university}
              locale={locale}
              chance={chance}
              isFavorite={favorites.has(university.id)}
              isGuest={!profile}
              minReviews={minReviews}
            />
          )
        })}
      </ul>
      <LoadMore page={page} hasMore={items.length < total && items.length >= PAGE_SIZE} />
    </>
  )
}
