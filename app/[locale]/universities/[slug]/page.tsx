import { notFound } from 'next/navigation'
import Image from 'next/image'
import { ChevronLeft, ExternalLink, MapPin, Star } from 'lucide-react'
import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { UrlTabs } from '@/components/ui/tabs'
import { StatTile } from '@/components/ui/stat-tile'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { buttonClass } from '@/components/ui/button-styles'
import { FavoriteButton } from '@/components/student/favorite-button'
import { ShareButton } from '@/components/student/share-button'
import { ContactBar, ContactButtons, TrackedLink } from '@/components/student/contact-actions'
import { ReadMore } from '@/components/student/read-more'
import { Gallery } from '@/components/student/gallery'
import { AdmissionTab } from '@/components/student/admission-tab'
import { MajorsTab, type MajorRow } from '@/components/student/majors-tab'
import { ReviewsTab } from '@/components/student/reviews-tab'
import { ContactsTab } from '@/components/student/contacts-tab'
import { ViewTracker } from '@/components/student/view-tracker'
import {
  getAdmissionBlocks,
  getUniversityBySlug,
  getUniversityImages,
  getUniversityMajors,
} from '@/lib/queries/universities'
import { getMyReview, getMyVotes, getUniversityReviews, type ReviewSort } from '@/lib/queries/reviews'
import { getCurrentProfile, getFavoriteIds } from '@/lib/queries/profile'
import { getEntSubjects } from '@/lib/queries/dictionaries'
import { getSettings } from '@/lib/queries/settings'
import { getChance, getThreshold, resolveThresholdCategory } from '@/lib/ent'
import { formatMoney, pick } from '@/lib/utils'
import type { Review } from '@/types/domain'

// Зависит от сессии (избранное, свой отзыв) — рендерим на каждый запрос;
// сами данные ВУЗа при этом берутся из кэша (unstable_cache в lib/queries).
export const dynamic = 'force-dynamic'

type Props = {
  params: Promise<{ locale: string; slug: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

const TABS = ['overview', 'admission', 'majors', 'reviews', 'contacts'] as const
type Tab = (typeof TABS)[number]

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params
  const university = await getUniversityBySlug(slug)
  if (!university) return { title: 'Университет не найден' }

  const name = pick(university as unknown as Record<string, unknown>, 'name', locale)
  const title = pick(university as unknown as Record<string, unknown>, 'seo_title', locale) || name
  const description =
    pick(university as unknown as Record<string, unknown>, 'seo_description', locale) ||
    pick(university as unknown as Record<string, unknown>, 'description', locale)

  return {
    title,
    description,
    alternates: {
      canonical: `/${locale}/universities/${slug}`,
      languages: { ru: `/ru/universities/${slug}`, kk: `/kk/universities/${slug}` },
    },
    openGraph: {
      title,
      description,
      type: 'website',
      images: university.cover_url ? [{ url: university.cover_url }] : undefined,
    },
    twitter: { card: 'summary_large_image', title, description },
  }
}

export default async function UniversityPage({ params, searchParams }: Props) {
  const { locale, slug } = await params
  setRequestLocale(locale)
  const query = await searchParams

  const rawTab = (Array.isArray(query.tab) ? query.tab[0] : query.tab) ?? 'overview'
  const tab: Tab = (TABS as readonly string[]).includes(rawTab) ? (rawTab as Tab) : 'overview'
  const reviewSort = ((Array.isArray(query.rsort) ? query.rsort[0] : query.rsort) ?? 'helpful') as ReviewSort

  const [university, profile, settings] = await Promise.all([
    getUniversityBySlug(slug),
    getCurrentProfile(),
    getSettings(),
  ])
  if (!university) notFound()

  // Грузим только то, что нужно открытой вкладке, — всё параллельно
  const none = <T,>(value: T) => Promise.resolve(value)
  const [t, tc, tt, favorites, images, blocks, majors, subjects, reviews, myReview] = await Promise.all([
    getTranslations('university'),
    getTranslations('common'),
    getTranslations('types'),
    profile ? getFavoriteIds(profile.id) : none(new Set<string>()),
    tab === 'overview' ? getUniversityImages(university.id) : none([]),
    tab === 'admission' ? getAdmissionBlocks(university.id) : none([]),
    tab === 'majors' || tab === 'reviews' ? getUniversityMajors(university.id) : none([]),
    tab === 'majors' ? getEntSubjects() : none([]),
    tab === 'reviews' ? getUniversityReviews(university.id, reviewSort) : none<Review[]>([]),
    tab === 'reviews' && profile ? getMyReview(university.id, profile.id) : none(null),
  ])
  const votes =
    tab === 'reviews' && profile
      ? await getMyVotes(
          profile.id,
          reviews.map((review) => review.id),
        )
      : new Set<string>()

  const name = pick(university as unknown as Record<string, unknown>, 'name', locale)
  const city = university.city ? pick(university.city as unknown as Record<string, unknown>, 'name', locale) : ''
  const score = profile?.ent_score ?? 0
  const userSubjects = [profile?.ent_subject_1_id ?? null, profile?.ent_subject_2_id ?? null]
  const hasRating = university.reviews_count >= settings.min_reviews_for_rating

  const majorRows: MajorRow[] = majors.map((major) => {
    const threshold = getThreshold(
      settings.ent_thresholds,
      resolveThresholdCategory({
        direction: major.specialty?.direction_ru,
        universityType: university.type,
        degree: major.degree,
      }),
    )
    const required = [major.specialty?.subject_1_id ?? null, major.specialty?.subject_2_id ?? null]
    return {
      major,
      chance: score > 0 ? getChance(score, major.grant_score, threshold, settings.chance_bands) : undefined,
      subjectsMatch:
        !userSubjects[0] || !userSubjects[1] || required.every((id) => id === null || userSubjects.includes(id)),
    }
  })

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollegeOrUniversity',
    name,
    url: `${process.env.NEXT_PUBLIC_SITE_URL ?? ''}/${locale}/universities/${slug}`,
    description: pick(university as unknown as Record<string, unknown>, 'description', locale),
    telephone: university.phones?.[0] ?? undefined,
    email: university.email || undefined,
    address: {
      '@type': 'PostalAddress',
      addressLocality: city,
      addressCountry: 'KZ',
      streetAddress: pick(university as unknown as Record<string, unknown>, 'address', locale),
    },
    aggregateRating: hasRating
      ? {
          '@type': 'AggregateRating',
          ratingValue: Number(university.rating),
          reviewCount: university.reviews_count,
        }
      : undefined,
  }

  const stats = (
    <>
      <StatTile label={t('minEnt')} value={university.min_ent_score ?? '—'} />
      <StatTile label={t('feeFrom')} value={university.min_fee ? formatMoney(university.min_fee, locale) : '—'} />
      <StatTile label={t('dormitory')} value={university.has_dormitory ? tc('yes') : tc('no')} />
      <StatTile label={t('military')} value={university.has_military_department ? tc('yes') : tc('no')} />
      {university.founded_year ? <StatTile label={t('founded')} value={university.founded_year} /> : null}
      {university.students_count ? (
        <StatTile label={t('students')} value={university.students_count.toLocaleString('ru-KZ')} />
      ) : null}
    </>
  )

  const contact = {
    universityId: university.id,
    phone: university.phones?.[0],
    whatsapp: university.whatsapp,
    universityName: name,
  }

  return (
    <div className="pb-32 lg:pb-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <ViewTracker universityId={university.id} tab={tab} />

      {/* Обложка: на телефоне во всю ширину, на компьютере — скруглённая в контейнере */}
      <div className="mx-auto w-full max-w-6xl md:px-6 md:pt-6">
        <Link
          href="/"
          className="hidden md:inline-flex items-center gap-1 text-sm font-medium text-muted hover:text-ink mb-4 -ml-1 min-h-[44px]"
        >
          <ChevronLeft className="w-4 h-4" aria-hidden />
          {t('allUniversities')}
        </Link>

        <div className="relative h-52 md:h-72 bg-subtle md:rounded-3xl overflow-hidden">
          {university.cover_url ? (
            <Image
              src={university.cover_url}
              alt=""
              fill
              sizes="(min-width: 1152px) 1104px, 100vw"
              priority
              className="object-cover"
            />
          ) : null}
          <div
            className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/40 to-transparent md:hidden"
            aria-hidden
          />

          {/* Кнопки поверх обложки — только на телефоне */}
          <div
            className="md:hidden absolute inset-x-0 top-0 px-3 flex justify-between"
            style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}
          >
            <Link
              href="/"
              aria-label={tc('back')}
              className="w-11 h-11 bg-black/35 backdrop-blur-md rounded-full flex items-center justify-center text-white"
            >
              <ChevronLeft className="w-6 h-6" aria-hidden />
            </Link>
            <div className="flex gap-2">
              <ShareButton
                title={name}
                universityId={university.id}
                className="bg-black/35 backdrop-blur-md rounded-full text-white"
              />
              <FavoriteButton
                universityId={university.id}
                initial={favorites.has(university.id)}
                isGuest={!profile}
                className="bg-black/35 backdrop-blur-md text-white hover:bg-black/50 hover:text-white"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="container-app lg:grid lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-10 lg:items-start">
        <div className="min-w-0">
          {/* Название и главное о ВУЗе */}
          <div className="flex items-end gap-4 -mt-10 md:-mt-12 relative">
            <span className="relative w-20 h-20 md:w-24 md:h-24 shrink-0 rounded-2xl bg-white border-4 border-canvas shadow-card overflow-hidden flex items-center justify-center">
              {university.logo_url ? (
                <Image src={university.logo_url} alt="" fill sizes="96px" className="object-contain p-2" />
              ) : (
                <span className="text-3xl font-bold text-slate-400" aria-hidden>
                  {(university.abbr || name).slice(0, 1).toUpperCase()}
                </span>
              )}
            </span>
          </div>

          <div className="mt-3 flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-ink leading-tight">{name}</h1>
              <p className="text-[15px] text-muted mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
                {city ? (
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4" aria-hidden />
                    {city}
                  </span>
                ) : null}
                <span className="flex items-center gap-1.5">
                  <Star className="w-4 h-4 text-yellow-400" fill="currentColor" strokeWidth={0} aria-hidden />
                  {hasRating ? (
                    <>
                      <b className="text-ink font-semibold">{Number(university.rating).toFixed(1)}</b>
                      <span>· {t('reviewsShort', { count: university.reviews_count })}</span>
                    </>
                  ) : (
                    t('noRating')
                  )}
                </span>
                <Badge tone="info" mini>
                  {tt(university.type)}
                </Badge>
              </p>
            </div>

            {/* На компьютере «поделиться» и «избранное» рядом с названием */}
            <div className="hidden md:flex gap-1 shrink-0">
              <ShareButton
                title={name}
                universityId={university.id}
                className="rounded-full text-muted hover:text-ink hover:bg-subtle"
              />
              <FavoriteButton universityId={university.id} initial={favorites.has(university.id)} isGuest={!profile} />
            </div>
          </div>

          {/* Ключевые цифры — на телефоне здесь, на компьютере в боковой колонке */}
          <div className="grid grid-cols-3 gap-2 mt-5 lg:hidden">{stats}</div>

          <UrlTabs
            className="sticky top-0 md:top-16 z-30 bg-canvas/95 backdrop-blur-md mt-6 -mx-4 px-4 md:mx-0 md:px-0"
            tabs={[
              { id: 'overview', label: t('tabOverview') },
              { id: 'admission', label: t('tabAdmission') },
              { id: 'majors', label: t('tabMajors') },
              { id: 'reviews', label: t('tabReviews') },
              { id: 'contacts', label: t('tabContacts') },
            ]}
          />

          <div className="pt-5">
            {tab === 'overview' ? (
              <div className="space-y-8">
                <p className="prose-content">
                  {pick(university as unknown as Record<string, unknown>, 'description', locale)}
                </p>

                {university.history_ru ? (
                  <section>
                    <h2 className="text-lg font-bold text-ink mb-2">{t('history')}</h2>
                    <ReadMore text={pick(university as unknown as Record<string, unknown>, 'history', locale)} />
                  </section>
                ) : null}

                {university.faculties?.length ? (
                  <section>
                    <h2 className="text-lg font-bold text-ink mb-3">{t('faculties')}</h2>
                    <ul className="grid gap-2 sm:grid-cols-2">
                      {university.faculties.map((faculty) => (
                        <li
                          key={faculty.name_ru}
                          className="rounded-xl border border-line bg-surface px-4 py-3 text-[15px] leading-snug text-ink"
                        >
                          {pick(faculty as unknown as Record<string, unknown>, 'name', locale)}
                        </li>
                      ))}
                    </ul>
                  </section>
                ) : null}

                {images.length > 0 ? (
                  <section>
                    <h2 className="text-lg font-bold text-ink mb-3">{t('gallery')}</h2>
                    <Gallery images={images} alt={name} />
                  </section>
                ) : null}

                {university.accreditation_ru || university.license_number ? (
                  <div className="flex flex-wrap gap-2">
                    {university.accreditation_ru ? (
                      <Badge tone="neutral">
                        {t('accreditation')}:{' '}
                        {pick(university as unknown as Record<string, unknown>, 'accreditation', locale)}
                      </Badge>
                    ) : null}
                    {university.license_number ? (
                      <Badge tone="neutral">
                        {t('license')}: {university.license_number}
                      </Badge>
                    ) : null}
                  </div>
                ) : null}
              </div>
            ) : null}

            {tab === 'admission' ? <AdmissionTab university={university} blocks={blocks} locale={locale} /> : null}

            {tab === 'majors' ? (
              <MajorsTab
                rows={majorRows}
                locale={locale}
                universityId={university.id}
                subjectNames={Object.fromEntries(
                  subjects.map((subject) => [
                    subject.id,
                    locale === 'kk' && subject.name_kk ? subject.name_kk : subject.name_ru,
                  ]),
                )}
              />
            ) : null}

            {tab === 'reviews' ? (
              <ReviewsTab
                universityId={university.id}
                reviews={reviews}
                majors={majors}
                locale={locale}
                isGuest={!profile}
                votes={votes}
                myReview={myReview}
                minReviews={settings.min_reviews_for_rating}
              />
            ) : null}

            {tab === 'contacts' ? <ContactsTab university={university} locale={locale} /> : null}
          </div>
        </div>

        {/* Боковая колонка на компьютере: цифры и связь с приёмной комиссией */}
        <aside className="hidden lg:block lg:sticky lg:top-24 mt-6 space-y-4">
          <Card className="p-5">
            <div className="grid grid-cols-2 gap-2">{stats}</div>
          </Card>
          <Card className="p-5 space-y-3">
            <p className="font-semibold text-ink">{t('contactTitle')}</p>
            <ContactButtons {...contact} stacked />
            {university.admission_url || university.website ? (
              <TrackedLink
                href={(university.admission_url || university.website) as string}
                universityId={university.id}
                event="contact_site_click"
                props={{ kind: university.admission_url ? 'admission' : 'site' }}
                className={buttonClass('secondary', 'md', true)}
              >
                <ExternalLink className="w-4 h-4" aria-hidden />
                {university.admission_url ? t('admissionSite') : t('website')}
              </TrackedLink>
            ) : null}
          </Card>
        </aside>
      </div>

      <ContactBar {...contact} />
    </div>
  )
}
