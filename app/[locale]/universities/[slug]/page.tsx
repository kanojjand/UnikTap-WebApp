import { notFound } from 'next/navigation'
import Image from 'next/image'
import { ChevronLeft, MapPin, Star } from 'lucide-react'
import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { UrlTabs } from '@/components/ui/tabs'
import { StatTile } from '@/components/ui/stat-tile'
import { Badge } from '@/components/ui/badge'
import { FavoriteButton } from '@/components/student/favorite-button'
import { ShareButton } from '@/components/student/share-button'
import { ContactBar } from '@/components/student/contact-actions'
import { ReadMore } from '@/components/student/read-more'
import { Gallery } from '@/components/student/gallery'
import { AdmissionTab } from '@/components/student/admission-tab'
import { MajorsTab, type MajorRow } from '@/components/student/majors-tab'
import { ReviewsTab } from '@/components/student/reviews-tab'
import { ContactsTab } from '@/components/student/contacts-tab'
import { ViewTracker } from '@/components/student/view-tracker'
import {
  getAdmissionBlocks, getUniversityBySlug, getUniversityImages, getUniversityMajors,
} from '@/lib/queries/universities'
import { getMyReview, getMyVotes, getUniversityReviews, type ReviewSort } from '@/lib/queries/reviews'
import { getCurrentProfile, getFavoriteIds } from '@/lib/queries/profile'
import { getEntSubjects } from '@/lib/queries/dictionaries'
import { getSettings } from '@/lib/queries/settings'
import { getChance, getThreshold, resolveThresholdCategory } from '@/lib/ent'
import { formatMoney, pick } from '@/lib/utils'

export const revalidate = 3600

type Props = {
  params: Promise<{ locale: string; slug: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

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

  const university = await getUniversityBySlug(slug)
  if (!university) notFound()

  const t = await getTranslations('university')
  const tc = await getTranslations('common')
  const tt = await getTranslations('types')

  const tab = (Array.isArray(query.tab) ? query.tab[0] : query.tab) ?? 'overview'
  const reviewSort = ((Array.isArray(query.rsort) ? query.rsort[0] : query.rsort) ?? 'helpful') as ReviewSort

  const [images, blocks, majors, reviews, profile, settings, subjects] = await Promise.all([
    getUniversityImages(university.id),
    getAdmissionBlocks(university.id),
    getUniversityMajors(university.id),
    getUniversityReviews(university.id, reviewSort),
    getCurrentProfile(),
    getSettings(),
    getEntSubjects(),
  ])

  const favorites = profile ? await getFavoriteIds(profile.id) : new Set<string>()
  const votes = profile ? await getMyVotes(profile.id, reviews.map((review) => review.id)) : new Set<string>()
  const myReview = profile ? await getMyReview(university.id, profile.id) : null

  const name = pick(university as unknown as Record<string, unknown>, 'name', locale)
  const city = university.city ? pick(university.city as unknown as Record<string, unknown>, 'name', locale) : ''
  const score = profile?.ent_score ?? 0
  const userSubjects = [profile?.ent_subject_1_id ?? null, profile?.ent_subject_2_id ?? null]

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
    aggregateRating:
      university.reviews_count >= settings.min_reviews_for_rating
        ? {
            '@type': 'AggregateRating',
            ratingValue: Number(university.rating),
            reviewCount: university.reviews_count,
          }
        : undefined,
  }

  return (
    <div className="bg-white min-h-[100dvh] pb-28">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <ViewTracker universityId={university.id} tab={tab} />

      <div className="relative h-64 shrink-0 bg-gray-200">
        {university.cover_url ? (
          <Image src={university.cover_url} alt={name} fill sizes="100vw" priority className="object-cover" />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />

        <Link
          href="/"
          aria-label={tc('back')}
          className="absolute top-10 left-4 w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white"
        >
          <ChevronLeft className="w-6 h-6" aria-hidden />
        </Link>

        <div className="absolute top-10 right-4 flex gap-2">
          <ShareButton
            title={name}
            universityId={university.id}
            className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white"
          />
          <div className="bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white">
            <FavoriteButton
              universityId={university.id}
              initial={favorites.has(university.id)}
              isGuest={!profile}
              className="text-white"
            />
          </div>
        </div>

        <div className="absolute bottom-4 left-4 right-4 flex items-end gap-3">
          {university.logo_url ? (
            <span className="relative w-16 h-16 shrink-0 rounded-2xl bg-white shadow-card overflow-hidden">
              <Image src={university.logo_url} alt={name} fill sizes="64px" className="object-contain p-1.5" />
            </span>
          ) : null}
          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-white mb-1 leading-tight">{name}</h1>
          <p className="text-white/80 text-sm flex items-center gap-3">
            <span className="flex items-center gap-1">
              <MapPin className="w-4 h-4" aria-hidden />
              {city}
            </span>
            <span className="flex items-center gap-1">
              <Star className="w-4 h-4 text-yellow-400" fill="currentColor" strokeWidth={0} aria-hidden />
              {university.reviews_count >= settings.min_reviews_for_rating
                ? Number(university.rating).toFixed(1)
                : '—'}
            </span>
          </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 p-4">
        <StatTile label={t('minEnt')} value={university.min_ent_score ?? '—'} />
        <StatTile label={t('feeFrom')} value={university.min_fee ? formatMoney(university.min_fee, locale) : '—'} />
        <StatTile label={t('military')} value={university.has_military_department ? tc('yes') : tc('no')} />
        {university.founded_year ? <StatTile label={t('founded')} value={university.founded_year} /> : null}
        {university.students_count ? (
          <StatTile label={t('students')} value={university.students_count.toLocaleString('ru-KZ')} />
        ) : null}
        <StatTile label={t('dormitory')} value={university.has_dormitory ? tc('yes') : tc('no')} />
      </div>

      <UrlTabs
        className="px-4 mb-4"
        tabs={[
          { id: 'overview', label: t('tabOverview') },
          { id: 'admission', label: t('tabAdmission') },
          { id: 'majors', label: t('tabMajors') },
          { id: 'reviews', label: t('tabReviews') },
          { id: 'contacts', label: t('tabContacts') },
        ]}
      />

      <div className="px-4">
        {tab === 'overview' ? (
          <div className="space-y-5">
            <p className="prose-content">{pick(university as unknown as Record<string, unknown>, 'description', locale)}</p>

            {university.history_ru ? (
              <section>
                <h2 className="text-lg font-bold mb-2">{t('history')}</h2>
                <ReadMore text={pick(university as unknown as Record<string, unknown>, 'history', locale)} />
              </section>
            ) : null}

            {images.length > 0 ? (
              <section>
                <h2 className="text-lg font-bold mb-3">{t('gallery')}</h2>
                <Gallery images={images} alt={name} />
              </section>
            ) : null}

            <div className="flex flex-wrap gap-2 pt-2">
              <Badge tone="info">{tt(university.type)}</Badge>
              {university.accreditation_ru ? (
                <Badge tone="neutral">
                  {t('accreditation')}: {pick(university as unknown as Record<string, unknown>, 'accreditation', locale)}
                </Badge>
              ) : null}
              {university.license_number ? (
                <Badge tone="neutral">
                  {t('license')}: {university.license_number}
                </Badge>
              ) : null}
            </div>
          </div>
        ) : null}

        {tab === 'admission' ? <AdmissionTab university={university} blocks={blocks} locale={locale} /> : null}

        {tab === 'majors' ? (
          <MajorsTab
            rows={majorRows}
            locale={locale}
            universityId={university.id}
            subjectNames={Object.fromEntries(
              subjects.map((subject) => [subject.id, locale === 'kk' && subject.name_kk ? subject.name_kk : subject.name_ru]),
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

      <ContactBar
        universityId={university.id}
        phone={university.phones?.[0]}
        whatsapp={university.whatsapp}
        universityName={name}
      />
    </div>
  )
}
