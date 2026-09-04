'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { Search } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { track } from '@/lib/analytics'
import { LanguageSwitcher } from './language-switcher'
import type { City } from '@/types/domain'

export function CatalogHeader({ cities, locale }: { cities: City[]; locale: string }) {
  const t = useTranslations('catalog')
  const tc = useTranslations('common')
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [query, setQuery] = useState(searchParams.get('q') ?? '')
  const city = searchParams.get('city') ?? ''

  useEffect(() => {
    const timer = setTimeout(() => {
      const current = searchParams.get('q') ?? ''
      if (query === current) return
      const params = new URLSearchParams(searchParams.toString())
      if (query) params.set('q', query)
      else params.delete('q')
      params.delete('page')
      router.replace(`${pathname}?${params.toString()}`, { scroll: false })
      if (query.length > 2) track('search', { query })
    }, 400)
    return () => clearTimeout(timer)
  }, [query, pathname, router, searchParams])

  function selectCity(value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value) params.set('city', value)
    else params.delete('city')
    params.delete('page')
    router.replace(`${pathname}?${params.toString()}`, { scroll: false })
  }

  return (
    <header className="bg-corpBlue px-4 pt-10 pb-6 rounded-b-2xl shadow-lg">
      <div className="flex justify-between items-center gap-2 mb-4">
        <h1 className="shrink-0">
          <Image
            src="/logo-white.png"
            alt={tc('appName')}
            width={900}
            height={262}
            priority
            className="h-8 w-auto"
          />
        </h1>
        <div className="flex items-center gap-2 shrink-0">
          <select
            aria-label={tc('city')}
            value={city}
            onChange={(event) => selectCity(event.target.value)}
            className="bg-white/20 text-white border-none rounded-lg px-2 py-1.5 text-xs outline-none backdrop-blur-sm max-w-[110px]"
          >
            <option className="text-black" value="">
              {tc('allCities')}
            </option>
            {cities.map((item) => (
              <option className="text-black" key={item.id} value={item.slug}>
                {locale === 'kk' && item.name_kk ? item.name_kk : item.name_ru}
              </option>
            ))}
          </select>
          <LanguageSwitcher />
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" aria-hidden />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t('searchPlaceholder')}
          aria-label={t('searchPlaceholder')}
          className="w-full pl-10 pr-4 py-3 rounded-xl border-none outline-none text-gray-700 shadow-sm"
        />
      </div>
    </header>
  )
}
