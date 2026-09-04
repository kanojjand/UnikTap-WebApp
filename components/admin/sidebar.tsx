'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  BarChart3, FileText, GraduationCap, LayoutDashboard, List, LogOut, ScrollText,
  Settings, Star, Users,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const ITEMS = [
  { href: '/admin', label: 'Дашборд', icon: LayoutDashboard, exact: true },
  { href: '/admin/universities', label: 'Университеты', icon: GraduationCap },
  { href: '/admin/majors', label: 'Специальности', icon: List },
  { href: '/admin/reviews', label: 'Отзывы', icon: Star, badgeKey: 'reviews' },
  { href: '/admin/users', label: 'Пользователи', icon: Users },
  { href: '/admin/dictionaries', label: 'Справочники', icon: FileText },
  { href: '/admin/content', label: 'Контент', icon: FileText },
  { href: '/admin/analytics', label: 'Статистика', icon: BarChart3 },
  { href: '/admin/settings', label: 'Настройки', icon: Settings },
  { href: '/admin/audit', label: 'Журнал действий', icon: ScrollText },
]

export function AdminSidebar({
  name,
  email,
  pendingReviews,
}: {
  name: string
  email: string
  pendingReviews: number
}) {
  const pathname = usePathname()

  return (
    // h-screen + self-start вместо min-h-screen: иначе колонка растягивается
    // под высоту страницы и sticky не срабатывает — панель уезжает вверх
    <aside className="w-64 bg-corpBlue text-white flex flex-col shrink-0 h-screen sticky top-0 self-start">
      <div className="p-6 shrink-0">
        <Image src="/logo-white.png" alt="UnikTap" width={900} height={262} className="h-7 w-auto" />
        <p className="text-white/60 text-xs mt-2">Панель управления</p>
      </div>

      <nav className="flex-1 min-h-0 overflow-y-auto px-3 space-y-1">
        {ITEMS.map((item) => {
          const active = item.exact ? pathname === item.href : pathname.startsWith(item.href)
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-4 py-2.5 rounded-xl transition-colors text-sm',
                active ? 'bg-white/10 font-medium' : 'text-white/70 hover:bg-white/5 hover:text-white',
              )}
            >
              <Icon className="w-5 h-5 shrink-0" aria-hidden />
              <span className="flex-1">{item.label}</span>
              {item.badgeKey === 'reviews' && pendingReviews > 0 ? (
                <span className="bg-white text-corpBlue text-[10px] font-bold rounded-full px-2 py-0.5">
                  {pendingReviews}
                </span>
              ) : null}
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-white/10 shrink-0">
        <p className="text-sm font-medium truncate">{name || 'Суперадмин'}</p>
        <p className="text-xs text-white/50 truncate">{email}</p>
        <div className="flex gap-3 mt-3 text-xs">
          <Link href="/ru" className="text-white/70 hover:text-white">
            На сайт
          </Link>
          <form action="/admin/logout" method="post">
            <button type="submit" className="text-white/70 hover:text-white flex items-center gap-1">
              <LogOut className="w-3 h-3" aria-hidden /> Выйти
            </button>
          </form>
        </div>
      </div>
    </aside>
  )
}
