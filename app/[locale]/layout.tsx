import { notFound } from 'next/navigation'
import { hasLocale, NextIntlClientProvider } from 'next-intl'
import { setRequestLocale } from 'next-intl/server'
import { routing } from '@/i18n/routing'
import { PageTracker } from '@/components/student/page-tracker'
import { OfflineBanner } from '@/components/student/offline-banner'
import { InstallPrompt } from '@/components/student/install-prompt'
import { CookieBanner } from '@/components/student/cookie-banner'

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
      <div className="app-shell min-h-[100dvh] relative">
        <OfflineBanner />
        {children}
        <InstallPrompt />
        <CookieBanner />
        <PageTracker />
      </div>
    </NextIntlClientProvider>
  )
}
