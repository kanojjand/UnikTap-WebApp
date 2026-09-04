import { BookmarkX } from 'lucide-react'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { BottomNav } from '@/components/ui/bottom-nav'
import { EmptyState } from '@/components/ui/empty-state'
import { Button } from '@/components/ui/button'
import { Link } from '@/i18n/navigation'
import { UniversityCard } from '@/components/student/university-card'
import { getCurrentProfile, getFavorites } from '@/lib/queries/profile'
import { getSettings } from '@/lib/queries/settings'

// Зависит от сессии пользователя — рендерим на каждый запрос
export const dynamic = 'force-dynamic'


export default async function FavoritesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)

  const t = await getTranslations('favorites')
  const profile = await getCurrentProfile()
  const settings = await getSettings()

  return (
    <div className="min-h-[100dvh] pb-24 bg-slateBg">
      <header className="bg-corpBlue px-4 pt-10 pb-6 rounded-b-2xl">
        <h1 className="text-2xl font-bold text-white">{t('title')}</h1>
      </header>

      <div className="px-4 py-6">
        {!profile ? (
          <EmptyState
            icon={<BookmarkX className="w-12 h-12" />}
            title={t('emptyTitle')}
            text={t('emptyGuest')}
            action={
              <Link href="/auth/login">
                <Button>{t('emptyGuest')}</Button>
              </Link>
            }
          />
        ) : (
          <FavoritesList locale={locale} userId={profile.id} minReviews={settings.min_reviews_for_rating} />
        )}
      </div>

      <BottomNav />
    </div>
  )
}

async function FavoritesList({
  locale,
  userId,
  minReviews,
}: {
  locale: string
  userId: string
  minReviews: number
}) {
  const t = await getTranslations('favorites')
  const universities = await getFavorites(userId)

  if (universities.length === 0) {
    return <EmptyState icon={<BookmarkX className="w-12 h-12" />} title={t('emptyTitle')} text={t('emptyText')} />
  }

  return (
    <ul className="space-y-4">
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
