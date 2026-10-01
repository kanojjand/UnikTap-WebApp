'use client'

import { useTranslations } from 'next-intl'
import { Link, usePathname } from '@/i18n/navigation'
import { LanguageSwitcher } from '@/components/student/language-switcher'
import { cn } from '@/lib/utils'
import { Logo } from './logo'
import { ThemeSwitcher } from './theme-switcher'
import { NAV_ITEMS, isActive } from './nav-items'

/** Верхняя навигация для планшета и компьютера. На телефоне скрыта — там BottomNav. */
export function SiteHeader() {
  const pathname = usePathname()
  const t = useTranslations('nav')

  if (pathname.startsWith('/onboarding')) return null

  // Профиль — справа, отдельно от разделов
  const links = NAV_ITEMS.slice(0, -1)
  const profile = NAV_ITEMS[NAV_ITEMS.length - 1]
  const ProfileIcon = profile.icon

  return (
    <header className="hidden md:block sticky top-0 z-40 bg-surface/90 backdrop-blur-md border-b border-line">
      <div className="container-app h-16 flex items-center gap-6">
        <Link href="/" aria-label="UnikTap — на главную" className="shrink-0 rounded-lg">
          <Logo />
        </Link>

        <nav aria-label="Основная навигация" className="flex-1">
          <ul className="flex items-center gap-1">
            {links.map((item) => {
              const active = isActive(pathname, item.href)
              const Icon = item.icon
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'inline-flex items-center gap-2 px-3.5 h-10 rounded-xl text-[15px] font-medium transition-colors',
                      active ? 'bg-primary-soft text-primary-ink' : 'text-body hover:bg-subtle hover:text-ink',
                    )}
                  >
                    <Icon className="w-[18px] h-[18px]" aria-hidden />
                    {t(item.key)}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        <div className="flex items-center gap-3 shrink-0">
          <ThemeSwitcher />
          <LanguageSwitcher variant="plain" />
          <Link
            href={profile.href}
            aria-current={isActive(pathname, profile.href) ? 'page' : undefined}
            className={cn(
              'inline-flex items-center gap-2 pl-2 pr-3.5 h-10 rounded-xl text-[15px] font-medium border transition-colors',
              isActive(pathname, profile.href)
                ? 'border-primary-ink/30 bg-primary-soft text-primary-ink'
                : 'border-line text-body hover:bg-subtle hover:text-ink',
            )}
          >
            <span className="w-7 h-7 rounded-full bg-subtle flex items-center justify-center">
              <ProfileIcon className="w-4 h-4" aria-hidden />
            </span>
            {t(profile.key)}
          </Link>
        </div>
      </div>
    </header>
  )
}
