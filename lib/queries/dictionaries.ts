import { cache } from 'react'
import { unstable_cache } from 'next/cache'
import { createPublicClient } from '@/lib/supabase/public'
import type { City, EntSubject, Specialty } from '@/types/domain'

/**
 * Справочники меняются раз в год, поэтому кэшируются между запросами
 * (unstable_cache) и внутри одного запроса (React cache).
 * Клиент — публичный, без cookie: иначе кэш Next.js использовать нельзя.
 * Данные и так открыты всем: RLS отдаёт только активные записи.
 */
export const getCities = cache(
  unstable_cache(
    async (): Promise<City[]> => {
      const { data } = await createPublicClient()
        .from('cities')
        .select('*')
        .eq('is_active', true)
        .order('sort_order')
      return (data ?? []) as City[]
    },
    ['cities'],
    { revalidate: 86400, tags: ['dictionaries'] },
  ),
)

export const getEntSubjects = cache(
  unstable_cache(
    async (): Promise<EntSubject[]> => {
      const { data } = await createPublicClient()
        .from('ent_subjects')
        .select('*')
        .eq('is_active', true)
        .order('id')
      return (data ?? []) as EntSubject[]
    },
    ['ent_subjects'],
    { revalidate: 86400, tags: ['dictionaries'] },
  ),
)

export const getSpecialties = cache(
  unstable_cache(
    async (): Promise<Specialty[]> => {
      const { data } = await createPublicClient()
        .from('specialties')
        .select('*')
        .eq('is_active', true)
        .order('code')
      return (data ?? []) as Specialty[]
    },
    ['specialties'],
    { revalidate: 86400, tags: ['dictionaries'] },
  ),
)

export const getCityBySlug = cache(async (slug: string): Promise<City | null> => {
  const cities = await getCities()
  return cities.find((city) => city.slug === slug) ?? null
})

export const getDirections = cache(async (): Promise<string[]> => {
  const specialties = await getSpecialties()
  return Array.from(new Set(specialties.map((s) => s.direction_ru).filter(Boolean) as string[])).sort()
})
