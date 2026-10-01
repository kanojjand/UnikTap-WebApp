import { Suspense } from 'react'
import { SearchX } from 'lucide-react'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { CatalogHeader } from '@/components/student/catalog-header'
import { CatalogFilters } from '@/components/student/catalog-filters'
import { ScoreCard } from '@/components/student/score-card'
import { Announcement } from '@/components/student/announcement'
import { UniversityCard } from '@/components/student/university-card'
import { LoadMore } from '@/components/student/load-more'
import { EmptyState } from '@/components/ui/empty-state'
import { CARD_GRID, ListSkeleton, Skeleton } from '@/components/ui/skeleton'
import { buttonClass } from '@/components/ui/button-styles'
import { Link } from '@/i18n/navigation'
import { getCities, getSpecialties } from '@/lib/queries/dictionaries'
import { getSettings } from '@/lib/queries/settings'
import { getUniversities, PAGE_SIZE } from '@/lib/queries/universities'
import { getCurrentProfile, getFavoriteIds } from '@/lib/queries/profile'
import { getChance, getThreshold, resolveThresholdCategory } from '@/lib/ent'
import type { AppSettings, CatalogFilters as Filters, Profile, StudyForm, UniversityType } from '@/types/domain'

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

  // Ключ Suspense без номера страницы: «Показать ещё» дописывает список, а не мигает скелетоном
  const resultsKey = JSON.stringify({ ...filters, page: undefined })

  return (
    <div className="pb-nav">
      <Suspense fallback={<HeaderFallback />}>
        <CatalogHeader />
      </Suspense>

      <Announcement announcement={settings.announcement} locale={locale} />

      <div className="container-app mt-5 lg:grid lg:grid-cols-[300px_minmax(0,1fr)] lg:gap-8 lg:items-start">
        <aside className="mb-6 lg:mb-0 lg:sticky lg:top-24">
          <ScoreCard savedScore={profile?.ent_score ?? null} />
        </aside>

        <section aria-label="Университеты">
          <Suspense fallback={<div className="h-28" />}>
            <CatalogFilters specialties={specialties} cities={cities} locale={locale} />
          </Suspense>

          <Suspense key={resultsKey} fallback={<ListSkeleton count={6} />}>
            <CatalogResults filters={filters} locale={locale} score={score} settings={settings} profile={profile} />
          </Suspense>
        </section>
      </div>
    </div>
  )
}

function HeaderFallback() {
  return (
    <div className="container-app pt-safe pb-2 space-y-3">
      <Skeleton className="h-9 w-64" />
      <Skeleton className="h-5 w-80 max-w-full" />
      <Skeleton className="h-14 max-w-2xl rounded-2xl" />
    </div>
  )
}

async function CatalogResults({
  filters,
  locale,
  score,
  settings,
  profile,
}: {
  filters: Filters
  locale: string
  score: number
  settings: AppSettings
  profile: Profile | null
}) {
  const t = await getTranslations('catalog')

  // Избранное и каталог грузим параллельно, а не друг за другом
  const [favorites, { items, total }] = await Promise.all([
    profile ? getFavoriteIds(profile.id) : new Set<string>(),
    getUniversities(filters).catch((error) => {
      console.error('catalog query failed', error)
      return { items: [], total: 0 }
    }),
  ])

  if (items.length === 0) {
    return (
      <EmptyState
        icon={<SearchX />}
        title={t('emptyTitle')}
        text={t('emptyText')}
        action={
          <Link href="/" className={buttonClass('secondary')}>
            {t('resetFilters')}
          </Link>
        }
      />
    )
  }

  return (
    <>
      <p className="text-sm font-medium text-muted mb-3" role="status">
        {t('found', { count: total })}
      </p>
      <ul className={CARD_GRID}>
        {items.map((university, index) => {
          const chance =
            score > 0
              ? getChance(
                  score,
                  university.min_ent_score,
                  getThreshold(settings.ent_thresholds, resolveThresholdCategory({ universityType: university.type })),
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
              minReviews={settings.min_reviews_for_rating}
              priority={index < 4}
            />
          )
        })}
      </ul>
      <LoadMore page={filters.page ?? 1} hasMore={items.length < total && items.length >= PAGE_SIZE} />
    </>
  )
}
