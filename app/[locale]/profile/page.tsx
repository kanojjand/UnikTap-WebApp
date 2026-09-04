import { Bookmark, ChevronRight, MessageSquare, Settings, ShieldCheck, UserRound } from 'lucide-react'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import NextLink from 'next/link'
import { Link } from '@/i18n/navigation'
import { BottomNav } from '@/components/ui/bottom-nav'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { LanguageSwitcher } from '@/components/student/language-switcher'
import { ProfileActions, ProfileForm } from '@/components/student/profile-form'
import { getCurrentProfile, getFavoriteIds } from '@/lib/queries/profile'
import { getMyReviews } from '@/lib/queries/reviews'
import { getCities, getEntSubjects } from '@/lib/queries/dictionaries'
import { formatDate } from '@/lib/utils'

// Зависит от сессии пользователя — рендерим на каждый запрос
export const dynamic = 'force-dynamic'


export default async function ProfilePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)

  const t = await getTranslations('profile')
  const tr = await getTranslations('reviews')
  const tc = await getTranslations('common')
  const profile = await getCurrentProfile()

  if (!profile) {
    return (
      <div className="min-h-[100dvh] pb-24">
        <header className="bg-corpBlue px-4 pt-10 pb-6 rounded-b-2xl">
          <h1 className="text-2xl font-bold text-white">{t('title')}</h1>
        </header>
        <EmptyState
          icon={<UserRound className="w-12 h-12" />}
          title={t('guest')}
          text={t('guestText')}
          action={
            <div className="flex gap-2">
              <Link href="/auth/login">
                <Button>{tc('appName') && 'Войти'}</Button>
              </Link>
              <Link href="/auth/register">
                <Button variant="secondary">Регистрация</Button>
              </Link>
            </div>
          }
        />
        <BottomNav />
      </div>
    )
  }

  const [favorites, reviews, cities, subjects] = await Promise.all([
    getFavoriteIds(profile.id),
    getMyReviews(profile.id),
    getCities(),
    getEntSubjects(),
  ])

  return (
    <div className="min-h-[100dvh] pb-24 bg-slateBg">
      <header className="bg-corpBlue px-4 pt-10 pb-6 rounded-b-2xl">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">{t('title')}</h1>
          <LanguageSwitcher />
        </div>
        <div className="mt-4 flex items-center gap-3">
          <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center text-white text-xl font-bold">
            {(profile.full_name || profile.email || '?').slice(0, 1).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-white font-bold truncate">{profile.full_name || '—'}</p>
            <p className="text-white/70 text-sm truncate">{profile.email ?? profile.phone}</p>
          </div>
        </div>
      </header>

      <div className="px-4 py-6 space-y-4">
        {profile.role === 'superadmin' ? (
          <NextLink href="/admin" className="block">
            <Card interactive className="flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-corpBlue" aria-hidden />
              <span className="font-medium text-sm flex-1">{t('adminPanel')}</span>
              <ChevronRight className="w-4 h-4 text-gray-400" aria-hidden />
            </Card>
          </NextLink>
        ) : null}

        <Card className="flex items-center gap-3">
          <Bookmark className="w-5 h-5 text-corpBlue" aria-hidden />
          <Link href="/favorites" className="flex-1 flex items-center justify-between">
            <span className="font-medium text-sm">{t('favorites')}</span>
            <span className="text-sm text-gray-400">{favorites.size}</span>
          </Link>
        </Card>

        <section>
          <h2 className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-corpBlue" aria-hidden />
            {t('myReviews')}
          </h2>
          {reviews.length === 0 ? (
            <p className="text-sm text-gray-400">{tr('emptyTitle')}</p>
          ) : (
            <ul className="space-y-2">
              {reviews.map((review) => (
                <Card as="li" key={review.id}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{review.university?.name_ru ?? '—'}</p>
                      <p className="text-xs text-gray-400">{formatDate(review.created_at, locale)}</p>
                    </div>
                    <Badge
                      tone={review.status === 'approved' ? 'success' : review.status === 'pending' ? 'warning' : 'danger'}
                      mini
                    >
                      {review.status === 'approved'
                        ? tr('statusApproved')
                        : review.status === 'pending'
                          ? tr('statusPending')
                          : tr('statusRejected')}
                    </Badge>
                  </div>
                  {review.status === 'rejected' && review.moderation_comment ? (
                    <p className="text-xs text-red-600 mt-2">{review.moderation_comment}</p>
                  ) : null}
                </Card>
              ))}
            </ul>
          )}
        </section>

        <section>
          <h2 className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
            <Settings className="w-4 h-4 text-corpBlue" aria-hidden />
            {t('settings')}
          </h2>
          <ProfileForm profile={profile} cities={cities} subjects={subjects} locale={locale} />
        </section>

        <nav className="text-sm text-corpBlue space-y-2 pt-2">
          <Link href="/about" className="block">{t('about')}</Link>
          <Link href="/privacy" className="block">{tc('privacy')}</Link>
          <Link href="/terms" className="block">{t('terms')}</Link>
        </nav>

        <ProfileActions locale={locale} />
      </div>

      <BottomNav />
    </div>
  )
}
