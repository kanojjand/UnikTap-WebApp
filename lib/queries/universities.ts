import { cache } from 'react'
import { unstable_cache } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createPublicClient } from '@/lib/supabase/public'
import { relevanceScore } from '@/lib/ent'
import { getCities } from './dictionaries'
import type { AdmissionBlock, CatalogFilters, University, UniversityImage, UniversityMajor } from '@/types/domain'

export const PAGE_SIZE = 20

const LIST_FIELDS =
  'id, slug, name_ru, name_kk, short_name, abbr, city_id, type, rating, reviews_count, ' +
  'min_ent_score, min_fee, majors_count, views_count, logo_url, cover_url, is_featured, ' +
  'has_military_department, has_dormitory, lat, lng, description_ru, description_kk, ' +
  'is_published, deleted_at, created_at, updated_at, city:cities(*)'

/** Каталог с фильтрами из раздела 6.2. Все параметры приходят из URL. */
export async function getUniversities(filters: CatalogFilters): Promise<{ items: University[]; total: number }> {
  const supabase = await createClient()
  const page = Math.max(1, filters.page ?? 1)

  let query = supabase
    .from('universities')
    .select(LIST_FIELDS, { count: 'exact' })
    .eq('is_published', true)
    .is('deleted_at', null)

  if (filters.q) {
    const like = `%${filters.q.replace(/[%,]/g, '')}%`
    query = query.or(`name_ru.ilike.${like},name_kk.ilike.${like},short_name.ilike.${like},abbr.ilike.${like}`)
  }

  if (filters.city) {
    // Справочник городов уже в кэше — не ходим в базу за id отдельным запросом
    const city = (await getCities()).find((item) => item.slug === filters.city)
    if (city) query = query.eq('city_id', city.id)
  }

  if (filters.type) query = query.eq('type', filters.type)
  if (filters.military) query = query.eq('has_military_department', true)
  if (filters.dormitory) query = query.eq('has_dormitory', true)
  if (filters.feeMax) query = query.lte('min_fee', filters.feeMax)
  if (filters.score) query = query.or(`min_ent_score.lte.${filters.score},min_ent_score.is.null`)

  // Фильтры, живущие на уровне специальностей → ищем подходящие ВУЗы отдельным запросом
  if (filters.specialty || filters.studyForm || filters.language) {
    let majorQuery = supabase
      .from('university_majors')
      .select('university_id, specialties!inner(code)')
      .eq('is_published', true)
      .is('deleted_at', null)

    if (filters.specialty) majorQuery = majorQuery.eq('specialties.code', filters.specialty)
    if (filters.studyForm) majorQuery = majorQuery.contains('study_forms', [filters.studyForm])
    if (filters.language) majorQuery = majorQuery.contains('languages', [filters.language])

    const { data: majors } = await majorQuery
    const ids = Array.from(new Set((majors ?? []).map((m: { university_id: string }) => m.university_id)))
    if (ids.length === 0) return { items: [], total: 0 }
    query = query.in('id', ids)
  }

  switch (filters.sort) {
    case 'rating':
      query = query.order('rating', { ascending: false })
      break
    case 'fee_asc':
      query = query.order('min_fee', { ascending: true, nullsFirst: false })
      break
    case 'fee_desc':
      query = query.order('min_fee', { ascending: false, nullsFirst: false })
      break
    case 'score':
      query = query.order('min_ent_score', { ascending: true, nullsFirst: false })
      break
    case 'popular':
      query = query.order('views_count', { ascending: false })
      break
    default:
      query = query.order('is_featured', { ascending: false }).order('rating', { ascending: false })
  }

  // Накопительная выдача: страница N возвращает первые N * PAGE_SIZE записей,
  // чтобы «Показать ещё» и бесконечная прокрутка работали без дублей.
  const { data, count, error } = await query.range(0, page * PAGE_SIZE - 1)
  if (error) throw new Error(error.message)

  let items = (data ?? []) as unknown as University[]

  if (!filters.sort || filters.sort === 'relevance') {
    const maxViews = Math.max(...items.map((u) => Number(u.views_count) || 0), 1)
    items = [...items].sort((a, b) => relevanceScore(b, { maxViews }) - relevanceScore(a, { maxViews }))
  }

  return { items, total: count ?? items.length }
}

export const getUniversityBySlug = cache(async (slug: string): Promise<University | null> =>
  unstable_cache(
    async () => {
      const { data } = await createPublicClient()
        .from('universities')
        .select('*, city:cities(*)')
        .eq('slug', slug)
        .eq('is_published', true)
        .is('deleted_at', null)
        .maybeSingle()
      return (data as unknown as University) ?? null
    },
    ['university', slug],
    { revalidate: 3600, tags: ['universities', `university:${slug}`] },
  )(),
)

export const getUniversityImages = cache(async (universityId: string): Promise<UniversityImage[]> =>
  unstable_cache(
    async () => {
      const { data } = await createPublicClient()
        .from('university_images')
        .select('*')
        .eq('university_id', universityId)
        .order('sort_order')
      return (data ?? []) as UniversityImage[]
    },
    ['university_images', universityId],
    { revalidate: 3600, tags: ['universities'] },
  )(),
)

export const getAdmissionBlocks = cache(async (universityId: string): Promise<AdmissionBlock[]> =>
  unstable_cache(
    async () => {
      const { data } = await createPublicClient()
        .from('admission_blocks')
        .select('*')
        .eq('university_id', universityId)
        .eq('is_published', true)
        .order('sort_order')
      return (data ?? []) as AdmissionBlock[]
    },
    ['admission_blocks', universityId],
    { revalidate: 3600, tags: ['universities'] },
  )(),
)

export const getUniversityMajors = cache(async (universityId: string): Promise<UniversityMajor[]> =>
  unstable_cache(
    async () => {
      const { data } = await createPublicClient()
        .from('university_majors')
        .select('*, specialty:specialties(*), history:major_score_history(*)')
        .eq('university_id', universityId)
        .eq('is_published', true)
        .is('deleted_at', null)
        .order('sort_order')
      return (data ?? []) as unknown as UniversityMajor[]
    },
    ['university_majors', universityId],
    { revalidate: 3600, tags: ['universities', 'majors'] },
  )(),
)

/** Все опубликованные ОП — для калькулятора и карты. */
export const getAllMajors = cache(
  unstable_cache(
    async (): Promise<UniversityMajor[]> => {
      const { data } = await createPublicClient()
        .from('university_majors')
        .select(
          '*, specialty:specialties(*), university:universities!inner(id, slug, name_ru, name_kk, logo_url, type, city_id)',
        )
        .eq('is_published', true)
        .is('deleted_at', null)
        .eq('universities.is_published', true)
        .limit(2000)
      return (data ?? []) as unknown as UniversityMajor[]
    },
    ['all_majors'],
    { revalidate: 3600, tags: ['universities', 'majors'] },
  ),
)

export const getMapUniversities = cache(
  unstable_cache(
    async (): Promise<University[]> => {
      const { data } = await createPublicClient()
        .from('universities')
        .select(LIST_FIELDS)
        .eq('is_published', true)
        .is('deleted_at', null)
        .not('lat', 'is', null)
        .limit(500)
      return (data ?? []) as unknown as University[]
    },
    ['map_universities'],
    { revalidate: 3600, tags: ['universities'] },
  ),
)

export const getPublishedSlugs = cache(async (): Promise<{ slug: string; updated_at: string }[]> => {
  const supabase = await createClient()
  const { data } = await supabase
    .from('universities')
    .select('slug, updated_at')
    .eq('is_published', true)
    .is('deleted_at', null)
  return (data ?? []) as { slug: string; updated_at: string }[]
})
