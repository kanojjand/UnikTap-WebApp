import { cache } from 'react'
import { unstable_cache } from 'next/cache'
import { createPublicClient } from '@/lib/supabase/public'
import { DEFAULT_SETTINGS } from '@/lib/ent'
import type { AppSettings } from '@/types/domain'

/** Настройки платформы. Все бизнес-значения живут в БД, а не в коде. */
export const getSettings = cache(
  unstable_cache(
    async (): Promise<AppSettings> => {
      try {
        const { data } = await createPublicClient().from('app_settings').select('key, value')
        if (!data) return DEFAULT_SETTINGS

        const map = Object.fromEntries(data.map((row: { key: string; value: unknown }) => [row.key, row.value]))
        return { ...DEFAULT_SETTINGS, ...map } as AppSettings
      } catch {
        return DEFAULT_SETTINGS
      }
    },
    ['app_settings'],
    { revalidate: 3600, tags: ['settings'] },
  ),
)

export const getSetting = cache(async <K extends keyof AppSettings>(key: K): Promise<AppSettings[K]> => {
  const settings = await getSettings()
  return settings[key]
})
