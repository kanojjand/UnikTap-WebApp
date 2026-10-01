import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { Logo } from '@/components/ui/logo'
import { BackLink } from '@/components/ui/page-header'

/** Вход и регистрация: на телефоне — на весь экран, на компьютере — карточка по центру. */
export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const t = await getTranslations('common')

  return (
    <div className="min-h-[100dvh] md:min-h-[calc(100dvh-4rem)] md:flex md:items-center md:justify-center md:py-10">
      <div className="w-full md:max-w-md md:bg-surface md:border md:border-line md:rounded-3xl md:shadow-card">
        <header className="px-4 md:px-8 pt-safe md:pt-8 pb-2 flex items-center gap-2">
          <BackLink href="/" label={t('back')} className="md:hidden" />
          <Link href="/" aria-label="UnikTap" className="rounded-lg">
            <Logo />
          </Link>
        </header>
        <div className="px-4 md:px-8 pt-4 pb-10 md:pb-8 max-w-md mx-auto">{children}</div>
      </div>
    </div>
  )
}
