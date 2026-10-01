import { Bookmark, Search } from 'lucide-react'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { EmptyState } from '@/components/ui/empty-state'
import { PageHeader } from '@/components/ui/page-header'
import { CARD_GRID } from '@/components/ui/skeleton'
import { buttonClass } from '@/components/ui/button-styles'
import { Link } from '@/i18n/navigation'
import { UniversityCard } from '@/components/student/university-card'
import { getCurrentProfile, getFavorites } from '@/lib/queries/profile'
import { getSettings } from '@/lib/queries/settings'

// Зависит от сессии пользователя — рендерим на каждый запрос
export const dynamic = 'force-dynamic'

export default async function FavoritesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)

  const [t, ta, profile, settings] = await Promise.all([
    getTranslations('favorites'),
    getTranslations('auth'),
    getCurrentProfile(),
    getSettings(),
  ])

  return (
    <div className="pb-nav">
      <PageHeader title={t('title')} />

      <div className="container-app">
        {!profile ? (
          <EmptyState
            icon={<Bookmark />}
            title={t('emptyTitle')}
            text={t('emptyGuest')}
            action={
              <>
                <Link href="/auth/login" className={buttonClass()}>
                  {ta('signIn')}
                </Link>
                <Link href="/auth/register" className={buttonClass('secondary')}>
                  {ta('signUp')}
                </Link>
              </>
            }
          />
        ) : (
          <FavoritesList locale={locale} userId={profile.id} minReviews={settings.min_reviews_for_rating} />
        )}
      </div>
    </div>
  )
}

async function FavoritesList({ locale, userId, minReviews }: { locale: string; userId: string; minReviews: number }) {
  const t = await getTranslations('favorites')
  const universities = await getFavorites(userId)

  if (universities.length === 0) {
    return (
      <EmptyState
        icon={<Bookmark />}
        title={t('emptyTitle')}
        text={t('emptyText')}
        action={
          <Link href="/" className={buttonClass()}>
            <Search className="w-5 h-5" aria-hidden />
            {t('findUniversities')}
          </Link>
        }
      />
    )
  }

  return (
    <ul className={CARD_GRID}>
      {universities.map((university) => (
        <UniversityCard
          key={university.id}
          university={university}
          locale={locale}
          isFavorite
          isGuest={false}
          minReviews={minReviews}
        />
      ))}
    </ul>
  )
}
