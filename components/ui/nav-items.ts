import { Bookmark, Calculator, Map, Search, User } from 'lucide-react'

export const NAV_ITEMS = [
  { href: '/', icon: Search, key: 'search' },
  { href: '/map', icon: Map, key: 'map' },
  { href: '/calculator', icon: Calculator, key: 'calculator' },
  { href: '/favorites', icon: Bookmark, key: 'favorites' },
  { href: '/profile', icon: User, key: 'profile' },
] as const

export function isActive(pathname: string, href: string) {
  return href === '/' ? pathname === '/' : pathname.startsWith(href)
}

/** Экраны, где своя нижняя панель (контакты ВУЗа) или навигация отвлекает (вход, онбординг). */
export function hideBottomNav(pathname: string) {
  return pathname.startsWith('/universities/') || pathname.startsWith('/auth') || pathname.startsWith('/onboarding')
}
