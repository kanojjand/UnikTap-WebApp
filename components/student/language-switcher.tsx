'use client'

import { useLocale } from 'next-intl'
import { useParams } from 'next/navigation'
import { usePathname, useRouter } from '@/i18n/navigation'
import { track } from '@/lib/analytics'
import { cn } from '@/lib/utils'

export function LanguageSwitcher({ variant = 'header' }: { variant?: 'header' | 'plain' }) {
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()
  const params = useParams()

  function switchTo(next: 'ru' | 'kk') {
    if (next === locale) return
    track('language_switch', { from: locale, to: next })
    router.replace(
      // @ts-expect-error — динамические параметры маршрута прокидываются как есть
      { pathname, params },
      { locale: next },
    )
  }

  return (
    <div
      role="group"
      aria-label="Язык / Тіл"
      className={cn(
        'inline-flex p-1 rounded-xl text-sm font-semibold',
        variant === 'header' ? 'bg-white/15 text-white' : 'bg-subtle text-muted',
      )}
    >
      {(['ru', 'kk'] as const).map((code) => (
        <button
          key={code}
          type="button"
          onClick={() => switchTo(code)}
          aria-pressed={locale === code}
          lang={code}
          className={cn(
            'min-w-[44px] h-9 px-2.5 rounded-lg transition-colors',
            locale === code
              ? variant === 'header'
                ? 'bg-white text-primary shadow-sm'
                : 'bg-surface text-ink shadow-sm'
              : 'hover:text-ink',
          )}
        >
          {code === 'ru' ? 'RU' : 'KZ'}
        </button>
      ))}
    </div>
  )
}
