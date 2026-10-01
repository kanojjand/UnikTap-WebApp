'use client'

import { useTranslations } from 'next-intl'
import { Link, usePathname } from '@/i18n/navigation'
import { cn } from '@/lib/utils'
import { NAV_ITEMS, hideBottomNav, isActive } from './nav-items'

/** Нижняя навигация — только на телефоне, под большой палец. На компьютере её заменяет SiteHeader. */
export function BottomNav() {
  const pathname = usePathname()
  const t = useTranslations('nav')

  if (hideBottomNav(pathname)) return null

  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-surface/95 backdrop-blur-md border-t border-line"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      aria-label="Основная навигация"
    >
      <ul className="flex justify-around items-stretch px-1">
        {NAV_ITEMS.map((item) => {
          const active = isActive(pathname, item.href)
          const Icon = item.icon
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                className={cn(
                  'flex flex-col items-center justify-center gap-1 min-h-[60px] transition-colors',
                  active ? 'text-primary-ink' : 'text-muted active:text-ink',
                )}
                aria-current={active ? 'page' : undefined}
              >
                <span
                  className={cn(
                    'flex items-center justify-center w-14 h-8 rounded-full transition-colors',
                    active && 'bg-primary-soft',
                  )}
                >
                  <Icon className="w-[22px] h-[22px]" strokeWidth={active ? 2.4 : 2} aria-hidden />
                </span>
                <span className={cn('text-xs', active ? 'font-semibold' : 'font-medium')}>{t(item.key)}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
