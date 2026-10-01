import {
  Bookmark,
  ChevronRight,
  FileText,
  HelpCircle,
  Info,
  Languages,
  MessageSquare,
  Palette,
  ShieldCheck,
  UserRound,
} from 'lucide-react'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import NextLink from 'next/link'
import { Link } from '@/i18n/navigation'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/empty-state'
import { PageHeader } from '@/components/ui/page-header'
import { buttonClass } from '@/components/ui/button-styles'
import { LanguageSwitcher } from '@/components/student/language-switcher'
import { ThemeSwitcher } from '@/components/ui/theme-switcher'
import { ProfileActions, ProfileForm } from '@/components/student/profile-form'
import { getCurrentProfile, getFavoriteIds } from '@/lib/queries/profile'
import { getMyReviews } from '@/lib/queries/reviews'
import { getCities, getEntSubjects } from '@/lib/queries/dictionaries'
import { formatDate } from '@/lib/utils'

// Зависит от сессии пользователя — рендерим на каждый запрос
export const dynamic = 'force-dynamic'

const ROW = 'flex items-center gap-3 min-h-[56px] px-4 py-2 hover:bg-subtle/60 active:bg-subtle transition-colors'

export default async function ProfilePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)

  const [t, tr, tc, ta, profile] = await Promise.all([
    getTranslations('profile'),
    getTranslations('reviews'),
    getTranslations('common'),
    getTranslations('auth'),
    getCurrentProfile(),
  ])

  const infoLinks = (
    <ul className="bg-surface rounded-2xl border border-line divide-y divide-line overflow-hidden">
      <li className={ROW}>
        <Languages className="w-5 h-5 text-muted shrink-0" aria-hidden />
        <span className="flex-1 text-[15px] text-ink">{tc('language')}</span>
        <LanguageSwitcher variant="plain" />
      </li>
      <li className={ROW}>
        <Palette className="w-5 h-5 text-muted shrink-0" aria-hidden />
        <span className="flex-1 text-[15px] text-ink">{tc('theme')}</span>
        <ThemeSwitcher />
      </li>
      {[
        { href: '/faq', label: t('faq'), icon: HelpCircle },
        { href: '/about', label: t('about'), icon: Info },
        { href: '/privacy', label: tc('privacy'), icon: ShieldCheck },
        { href: '/terms', label: t('terms'), icon: FileText },
      ].map(({ href, label, icon: Icon }) => (
        <li key={href}>
          <Link href={href} className={ROW}>
            <Icon className="w-5 h-5 text-muted shrink-0" aria-hidden />
            <span className="flex-1 text-[15px] text-ink">{label}</span>
            <ChevronRight className="w-5 h-5 text-muted" aria-hidden />
          </Link>
        </li>
      ))}
    </ul>
  )

  if (!profile) {
    return (
      <div className="pb-nav">
        <PageHeader title={t('title')} />
        <div className="container-app max-w-2xl space-y-6">
          <div className="bg-surface rounded-2xl border border-line">
            <EmptyState
              icon={<UserRound />}
              title={t('guest')}
              text={t('guestText')}
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
          </div>
          {infoLinks}
        </div>
      </div>
    )
  }

  const [favorites, reviews, cities, subjects] = await Promise.all([
    getFavoriteIds(profile.id),
    getMyReviews(profile.id),
    getCities(),
    getEntSubjects(),
  ])

  const initial = (profile.full_name || profile.email || '?').slice(0, 1).toUpperCase()

  return (
    <div className="pb-nav">
      <PageHeader title={t('title')} />

      <div className="container-app lg:grid lg:grid-cols-[340px_minmax(0,1fr)] lg:gap-8 lg:items-start space-y-6 lg:space-y-0">
        {/* Левая колонка: кто я и быстрые ссылки */}
        <div className="space-y-4 lg:sticky lg:top-24">
          <section className="bg-surface rounded-2xl border border-line p-4 flex items-center gap-4">
            <span
              className="w-14 h-14 rounded-full bg-primary text-white text-xl font-bold flex items-center justify-center shrink-0"
              aria-hidden
            >
              {initial}
            </span>
            <div className="min-w-0">
              <p className="font-semibold text-lg text-ink truncate">{profile.full_name || '—'}</p>
              <p className="text-sm text-muted truncate">{profile.email ?? profile.phone}</p>
            </div>
          </section>

          <ul className="bg-surface rounded-2xl border border-line divide-y divide-line overflow-hidden">
            {profile.role === 'superadmin' ? (
              <li>
                <NextLink href="/admin" className={ROW}>
                  <ShieldCheck className="w-5 h-5 text-primary-ink shrink-0" aria-hidden />
                  <span className="flex-1 text-[15px] font-medium text-ink">{t('adminPanel')}</span>
                  <ChevronRight className="w-5 h-5 text-muted" aria-hidden />
                </NextLink>
              </li>
            ) : null}
            <li>
              <Link href="/favorites" className={ROW}>
                <Bookmark className="w-5 h-5 text-primary-ink shrink-0" aria-hidden />
                <span className="flex-1 text-[15px] font-medium text-ink">{t('favorites')}</span>
                <span className="text-[15px] text-muted">{favorites.size}</span>
                <ChevronRight className="w-5 h-5 text-muted" aria-hidden />
              </Link>
            </li>
          </ul>

          <div className="hidden lg:block">{infoLinks}</div>
        </div>

        {/* Правая колонка: данные ЕНТ, отзывы */}
        <div className="space-y-6">
          <section aria-labelledby="profile-settings">
            <h2 id="profile-settings" className="text-lg font-bold text-ink mb-3">
              {t('settings')}
            </h2>
            <ProfileForm profile={profile} cities={cities} subjects={subjects} locale={locale} />
          </section>

          <section aria-labelledby="profile-reviews">
            <h2 id="profile-reviews" className="text-lg font-bold text-ink mb-3 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-primary-ink" aria-hidden />
              {t('myReviews')}
            </h2>
            {reviews.length === 0 ? (
              <p className="text-[15px] text-muted bg-surface border border-line rounded-2xl p-4">{tr('emptyMine')}</p>
            ) : (
              <ul className="bg-surface rounded-2xl border border-line divide-y divide-line overflow-hidden">
                {reviews.map((review) => (
                  <li key={review.id} className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-medium text-[15px] text-ink truncate">{review.university?.name_ru ?? '—'}</p>
                        <p className="text-sm text-muted">{formatDate(review.created_at, locale)}</p>
                      </div>
                      <Badge
                        tone={
                          review.status === 'approved' ? 'success' : review.status === 'pending' ? 'warning' : 'danger'
                        }
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
                      <p className="text-sm text-danger mt-2">{review.moderation_comment}</p>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <div className="lg:hidden">{infoLinks}</div>

          <ProfileActions locale={locale} />
        </div>
      </div>
    </div>
  )
}
