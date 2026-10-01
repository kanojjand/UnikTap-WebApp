'use client'

import { useEffect, useRef, useState } from 'react'
import { Search, X } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { track } from '@/lib/analytics'
import { Logo } from '@/components/ui/logo'
import { LanguageSwitcher } from './language-switcher'
import { ThemeToggle } from '@/components/ui/theme-switcher'

export function CatalogHeader() {
  const t = useTranslations('catalog')
  const tc = useTranslations('common')
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const inputRef = useRef<HTMLInputElement>(null)

  const urlQuery = searchParams.get('q') ?? ''
  const [query, setQuery] = useState(urlQuery)

  // «Сбросить фильтры» убирает q из адреса — очищаем и поле
  useEffect(() => {
    if (!urlQuery) setQuery('')
  }, [urlQuery])

  function apply(value: string) {
    const current = searchParams.get('q') ?? ''
    if (value === current) return
    const params = new URLSearchParams(searchParams.toString())
    if (value) params.set('q', value)
    else params.delete('q')
    params.delete('page')
    router.replace(`${pathname}?${params.toString()}`, { scroll: false })
    if (value.length > 2) track('search', { query: value })
  }

  // Поиск по мере ввода, с паузой 400 мс
  useEffect(() => {
    const timer = setTimeout(() => apply(query.trim()), 400)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query])

  return (
    <header className="container-app pt-safe pb-2">
      {/* На телефоне — логотип, тема и язык; на компьютере это есть в верхней навигации */}
      <div className="flex items-center justify-between gap-3 mb-5 md:hidden">
        <Logo priority />
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <LanguageSwitcher variant="plain" />
        </div>
      </div>

      <h1 className="text-[28px] md:text-4xl font-bold tracking-tight text-ink leading-tight">{t('heroTitle')}</h1>
      <p className="text-[15px] md:text-lg text-muted mt-1.5 mb-5">{t('heroText')}</p>

      <form
        role="search"
        className="relative max-w-2xl"
        onSubmit={(event) => {
          event.preventDefault()
          apply(query.trim())
          inputRef.current?.blur()
        }}
      >
        <Search
          className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted pointer-events-none"
          aria-hidden
        />
        <input
          ref={inputRef}
          type="search"
          enterKeyHint="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t('searchPlaceholder')}
          aria-label={t('searchPlaceholder')}
          className="w-full h-14 pl-12 pr-12 rounded-2xl bg-surface border border-line text-base text-ink placeholder:text-muted shadow-card outline-none transition-colors focus:border-primary focus:ring-4 focus:ring-primary/15 [&::-webkit-search-cancel-button]:hidden"
        />
        {query ? (
          <button
            type="button"
            onClick={() => {
              setQuery('')
              inputRef.current?.focus()
            }}
            aria-label={tc('clear')}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 w-11 h-11 rounded-xl flex items-center justify-center text-muted hover:text-ink hover:bg-subtle"
          >
            <X className="w-5 h-5" aria-hidden />
          </button>
        ) : null}
      </form>
    </header>
  )
}
