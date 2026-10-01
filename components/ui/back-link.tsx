'use client'

import { ChevronLeft } from 'lucide-react'
import { Link, useRouter } from '@/i18n/navigation'
import { cn } from '@/lib/utils'

/**
 * «Назад» возвращает туда, откуда человек пришёл (как системная кнопка),
 * а если страницу открыли по прямой ссылке — ведёт на `href`.
 */
export function BackLink({ href, label, className }: { href: string; label: string; className?: string }) {
  const router = useRouter()

  return (
    <Link
      href={href}
      aria-label={label}
      onClick={(event) => {
        if (window.history.length > 1) {
          event.preventDefault()
          router.back()
        }
      }}
      className={cn(
        'w-11 h-11 -ml-2 rounded-full flex items-center justify-center text-ink hover:bg-subtle transition-colors shrink-0',
        className,
      )}
    >
      <ChevronLeft className="w-6 h-6" aria-hidden />
    </Link>
  )
}
