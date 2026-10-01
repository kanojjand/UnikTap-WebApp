'use client'

import { useSyncExternalStore } from 'react'
import { useTranslations } from 'next-intl'
import { Monitor, Moon, Sun } from 'lucide-react'
import {
  THEME_CHANGE_EVENT,
  THEME_STORAGE_KEY,
  applyTheme,
  readThemePreference,
  setThemePreference,
  type ResolvedTheme,
  type ThemePreference,
} from '@/lib/theme'
import { cn } from '@/lib/utils'

function subscribe(onChange: () => void) {
  const onStorage = (event: StorageEvent) => {
    if (event.key !== THEME_STORAGE_KEY) return
    applyTheme(readThemePreference())
    onChange()
  }
  // системную тему отслеживает THEME_SCRIPT; здесь — только перерисовать иконки
  const media = window.matchMedia('(prefers-color-scheme: dark)')
  window.addEventListener(THEME_CHANGE_EVENT, onChange)
  window.addEventListener('storage', onStorage)
  media.addEventListener('change', onChange)
  return () => {
    window.removeEventListener(THEME_CHANGE_EVENT, onChange)
    window.removeEventListener('storage', onStorage)
    media.removeEventListener('change', onChange)
  }
}

const readResolved = (): ResolvedTheme =>
  document.documentElement.classList.contains('theme-dark') ? 'dark' : 'light'

/**
 * Выбранная тема. На сервере и во время гидратации выбор неизвестен — null,
 * чтобы не подсветить на мгновение не тот вариант.
 */
export function useThemePreference(): ThemePreference | null {
  return useSyncExternalStore<ThemePreference | null>(subscribe, readThemePreference, () => null)
}

/** Тема, которая сейчас на экране. */
export function useResolvedTheme(): ResolvedTheme {
  return useSyncExternalStore(subscribe, readResolved, () => 'light')
}

const OPTIONS = [
  { value: 'light', icon: Sun, label: 'themeLight' },
  { value: 'dark', icon: Moon, label: 'themeDark' },
  { value: 'system', icon: Monitor, label: 'themeSystem' },
] as const

export function ThemeSwitcher({ className }: { className?: string }) {
  const t = useTranslations('common')
  const preference = useThemePreference()

  return (
    <div
      role="group"
      aria-label={t('theme')}
      className={cn('inline-flex p-1 rounded-xl bg-subtle text-muted', className)}
    >
      {OPTIONS.map(({ value, icon: Icon, label }) => (
        <button
          key={value}
          type="button"
          onClick={() => {
            if (value !== preference) setThemePreference(value)
          }}
          aria-pressed={preference === value}
          aria-label={t(label)}
          title={t(label)}
          className={cn(
            'w-10 h-9 rounded-lg flex items-center justify-center transition-colors',
            preference === value ? 'bg-surface text-ink shadow-sm' : 'hover:text-ink',
          )}
        >
          <Icon className="w-[18px] h-[18px]" aria-hidden />
        </button>
      ))}
    </div>
  )
}

/** Одна кнопка «светлая ↔ тёмная» — там, где нет места для трёх. */
export function ThemeToggle({ className }: { className?: string }) {
  const t = useTranslations('common')
  const dark = useResolvedTheme() === 'dark'
  const Icon = dark ? Sun : Moon

  return (
    <button
      type="button"
      onClick={() => setThemePreference(dark ? 'light' : 'dark')}
      aria-pressed={dark}
      aria-label={t('themeDark')}
      title={dark ? t('themeLight') : t('themeDark')}
      className={cn(
        'w-11 h-11 rounded-xl bg-subtle text-muted hover:text-ink flex items-center justify-center transition-colors',
        className,
      )}
    >
      <Icon className="w-5 h-5" aria-hidden />
    </button>
  )
}
