import { notFound } from 'next/navigation'
import { hasLocale, NextIntlClientProvider } from 'next-intl'
import { setRequestLocale } from 'next-intl/server'
import { routing } from '@/i18n/routing'
import { PageTracker } from '@/components/student/page-tracker'
import { OfflineBanner } from '@/components/student/offline-banner'
import { InstallPrompt } from '@/components/student/install-prompt'
import { CookieBanner } from '@/components/student/cookie-banner'
import { SiteHeader } from '@/components/ui/site-header'
import { BottomNav } from '@/components/ui/bottom-nav'

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  if (!hasLocale(routing.locales, locale)) notFound()
  setRequestLocale(locale)

  return (
    <NextIntlClientProvider>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[60] focus:bg-surface focus:text-ink focus:px-4 focus:py-3 focus:rounded-xl focus:shadow-modal"
      >
        {locale === 'kk' ? 'Мазмұнға өту' : 'Перейти к содержимому'}
      </a>
      <OfflineBanner />
      <SiteHeader />
      <main id="main" className="min-h-[100dvh] md:min-h-[calc(100dvh-4rem)]">
        {children}
      </main>
      <BottomNav />
      <InstallPrompt />
      <CookieBanner />
      <PageTracker />
    </NextIntlClientProvider>
  )
}
