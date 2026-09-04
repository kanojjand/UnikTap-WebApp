'use client'

import { Search, Map, Calculator, Bookmark, User } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Link, usePathname } from '@/i18n/navigation'
import { cn } from '@/lib/utils'

const ITEMS = [
  { href: '/', icon: Search, key: 'search' as const },
  { href: '/map', icon: Map, key: 'map' as const },
  { href: '/calculator', icon: Calculator, key: 'calculator' as const },
  { href: '/favorites', icon: Bookmark, key: 'favorites' as const },
  { href: '/profile', icon: User, key: 'profile' as const },
]

export function BottomNav() {
  const pathname = usePathname()
  const t = useTranslations('nav')

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-40 bg-white border-t border-gray-100 py-3 md:max-w-md md:mx-auto"
      style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
      aria-label={t('search')}
    >
      <ul className="flex justify-around items-center">
        {ITEMS.map((item) => {
          const active = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href)
          const Icon = item.icon
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  'flex flex-col items-center gap-1 min-w-[56px] min-h-[44px] justify-center',
                  active ? 'text-corpBlue' : 'text-gray-400',
                )}
                aria-current={active ? 'page' : undefined}
              >
                <Icon className="w-6 h-6" strokeWidth={2} aria-hidden />
                <span className="text-[10px] font-medium">{t(item.key)}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
