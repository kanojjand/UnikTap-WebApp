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
      className={cn(
        'inline-flex rounded-lg overflow-hidden text-xs font-bold',
        variant === 'header' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500',
      )}
    >
      {(['ru', 'kk'] as const).map((code) => (
        <button
          key={code}
          onClick={() => switchTo(code)}
          aria-current={locale === code}
          className={cn(
            'px-2.5 py-1.5 transition-colors',
            locale === code
              ? variant === 'header'
                ? 'bg-white text-corpBlue'
                : 'bg-corpBlue text-white'
              : '',
          )}
        >
          {code === 'ru' ? 'RU' : 'KZ'}
        </button>
      ))}
    </div>
  )
}
