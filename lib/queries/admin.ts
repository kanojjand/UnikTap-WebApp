import 'server-only'
import { createAdminClient } from '@/lib/supabase/admin'
import { isSuperadmin } from './profile'
import type {
  AdmissionBlock, AuditEntry, City, EntSubject, FaqItem, Profile, Review, ReviewReport,
  Specialty, StaticPage, University, UniversityImage, UniversityMajor,
} from '@/types/domain'

/** Все админские чтения идут сервисным ключом, но только после проверки роли. */
async function admin() {
  if (!(await isSuperadmin())) throw new Error('forbidden')
  return createAdminClient()
}

export async function adminUniversities(): Promise<University[]> {
  const supabase = await admin()
  const { data } = await supabase
    .from('universities')
    .select('*, city:cities(*)')
    .order('sort_order')
    .order('name_ru')
  return (data ?? []) as unknown as University[]
}

export async function adminUniversity(id: string): Promise<{
  university: University | null
  majors: UniversityMajor[]
  blocks: AdmissionBlock[]
  images: UniversityImage[]
}> {
  const supabase = await admin()
  const [{ data: university }, { data: majors }, { data: blocks }, { data: images }] = await Promise.all([
    supabase.from('universities').select('*, city:cities(*)').eq('id', id).maybeSingle(),
    supabase
      .from('university_majors')
      .select('*, specialty:specialties(*), history:major_score_history(*)')
      .eq('university_id', id)
      .order('sort_order'),
    supabase.from('admission_blocks').select('*').eq('university_id', id).order('sort_order'),
    supabase.from('university_images').select('*').eq('university_id', id).order('sort_order'),
  ])

  return {
    university: (university as unknown as University) ?? null,
    majors: (majors ?? []) as unknown as UniversityMajor[],
    blocks: (blocks ?? []) as AdmissionBlock[],
    images: (images ?? []) as UniversityImage[],
  }
}

export async function adminMajors(): Promise<UniversityMajor[]> {
  const supabase = await admin()
  const { data } = await supabase
    .from('university_majors')
    .select('*, specialty:specialties(*), university:universities(id, slug, name_ru, name_kk, logo_url, type, city_id)')
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(3000)
  return (data ?? []) as unknown as UniversityMajor[]
}

export async function adminReviews(status?: 'pending' | 'approved' | 'rejected'): Promise<Review[]> {
  const supabase = await admin()
  let query = supabase
    .from('reviews')
    .select('*, university:universities(id, slug, name_ru), author:profiles!reviews_user_id_fkey(id, full_name, email, created_at)')
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
  if (status) query = query.eq('status', status)
  const { data } = await query.limit(500)
  return (data ?? []) as unknown as Review[]
}

export async function adminReports(): Promise<ReviewReport[]> {
  const supabase = await admin()
  const { data } = await supabase
    .from('review_reports')
    .select('*, review:reviews(*)')
    .eq('is_resolved', false)
    .order('created_at', { ascending: false })
  return (data ?? []) as unknown as ReviewReport[]
}

export async function adminUsers(): Promise<(Profile & { reviews_count: number; favorites_count: number })[]> {
  const supabase = await admin()
  const [{ data: profiles }, { data: reviews }, { data: favorites }] = await Promise.all([
    supabase.from('profiles').select('*, city:cities(name_ru)').order('created_at', { ascending: false }).limit(2000),
    supabase.from('reviews').select('user_id').is('deleted_at', null),
    supabase.from('favorites').select('user_id'),
  ])

  const count = (rows: { user_id: string }[] | null, id: string) =>
    (rows ?? []).filter((row) => row.user_id === id).length

  return ((profiles ?? []) as unknown as Profile[]).map((profile) => ({
    ...profile,
    reviews_count: count(reviews as { user_id: string }[] | null, profile.id),
    favorites_count: count(favorites as { user_id: string }[] | null, profile.id),
  }))
}

export async function adminDictionaries(): Promise<{
  cities: City[]
  specialties: Specialty[]
  subjects: EntSubject[]
}> {
  const supabase = await admin()
  const [{ data: cities }, { data: specialties }, { data: subjects }] = await Promise.all([
    supabase.from('cities').select('*').order('sort_order'),
    supabase.from('specialties').select('*').order('code'),
    supabase.from('ent_subjects').select('*').order('id'),
  ])
  return {
    cities: (cities ?? []) as City[],
    specialties: (specialties ?? []) as Specialty[],
    subjects: (subjects ?? []) as EntSubject[],
  }
}

export async function adminContent(): Promise<{ faq: FaqItem[]; pages: StaticPage[] }> {
  const supabase = await admin()
  const [{ data: faq }, { data: pages }] = await Promise.all([
    supabase.from('faq').select('*').order('sort_order'),
    supabase.from('static_pages').select('*').order('slug'),
  ])
  return { faq: (faq ?? []) as FaqItem[], pages: (pages ?? []) as StaticPage[] }
}

export async function adminSettings(): Promise<Record<string, unknown>> {
  const supabase = await admin()
  const { data } = await supabase.from('app_settings').select('key, value')
  return Object.fromEntries(((data ?? []) as { key: string; value: unknown }[]).map((row) => [row.key, row.value]))
}

export async function adminAudit(limit = 200): Promise<AuditEntry[]> {
  const supabase = await admin()
  const { data } = await supabase
    .from('audit_log')
    .select('*, actor:profiles(id, full_name, email)')
    .order('created_at', { ascending: false })
    .limit(limit)
  return (data ?? []) as unknown as AuditEntry[]
}

export interface DashboardData {
  totals: Record<string, number>
  daily: { day: string; sessions: number; users: number; university_views: number; searches: number }[]
  topUniversities: { name: string; views: number }[]
  topMajors: { name: string; interest: number }[]
  scoreBuckets: { bucket: string; count: number }[]
  cityShare: { city: string; count: number }[]
  funnel: { step: string; value: number }[]
  attention: { label: string; count: number; href: string }[]
  recentAudit: AuditEntry[]
}

export async function adminDashboard(days = 30): Promise<DashboardData> {
  const supabase = await admin()
  const since = new Date(Date.now() - days * 86400000).toISOString()

  const [events, profiles, universities, majors, reviews, cities, audit] = await Promise.all([
    supabase.from('analytics_events').select('event_name, session_id, user_id, university_id, major_id, created_at').gte('created_at', since).limit(50000),
    supabase.from('profiles').select('id, ent_score, city_id, created_at'),
    supabase.from('universities').select('id, name_ru, views_count, is_published, deleted_at, phones, whatsapp'),
    supabase.from('university_majors').select('id, university_id, specialty_id, grant_score, is_published, deleted_at, program_name_ru, specialty:specialties(name_ru)'),
    supabase.from('reviews').select('id, status, rating, deleted_at, created_at'),
    supabase.from('cities').select('id, name_ru'),
    adminAudit(10),
  ])

  type Event = { event_name: string; session_id: string; user_id: string | null; university_id: string | null; major_id: string | null; created_at: string }
  const eventRows = (events.data ?? []) as Event[]
  const universityRows = (universities.data ?? []) as { id: string; name_ru: string; views_count: number; is_published: boolean; deleted_at: string | null; phones: string[]; whatsapp: string }[]
  const majorRows = (majors.data ?? []) as unknown as { id: string; university_id: string; grant_score: number | null; is_published: boolean; deleted_at: string | null; program_name_ru?: string; specialty: { name_ru: string } | null }[]
  const reviewRows = (reviews.data ?? []) as { id: string; status: string; rating: number; deleted_at: string | null; created_at: string }[]
  const profileRows = (profiles.data ?? []) as { id: string; ent_score: number | null; city_id: number | null; created_at: string }[]
  const cityRows = (cities.data ?? []) as { id: number; name_ru: string }[]

  const byDay = new Map<string, { sessions: Set<string>; users: Set<string>; university_views: number; searches: number }>()
  for (const event of eventRows) {
    const day = event.created_at.slice(0, 10)
    const entry = byDay.get(day) ?? { sessions: new Set(), users: new Set(), university_views: 0, searches: 0 }
    entry.sessions.add(event.session_id)
    if (event.user_id) entry.users.add(event.user_id)
    if (event.event_name === 'university_view') entry.university_views += 1
    if (event.event_name === 'search') entry.searches += 1
    byDay.set(day, entry)
  }

  const universityViews = new Map<string, number>()
  const majorInterest = new Map<string, number>()
  for (const event of eventRows) {
    if (event.event_name === 'university_view' && event.university_id) {
      universityViews.set(event.university_id, (universityViews.get(event.university_id) ?? 0) + 1)
    }
    if ((event.event_name === 'major_expand' || event.event_name === 'favorite_add') && event.major_id) {
      majorInterest.set(event.major_id, (majorInterest.get(event.major_id) ?? 0) + 1)
    }
  }

  const buckets = new Map<string, number>()
  for (const profile of profileRows) {
    if (profile.ent_score == null) continue
    const low = Math.floor(profile.ent_score / 10) * 10
    const key = `${low}–${low + 9}`
    buckets.set(key, (buckets.get(key) ?? 0) + 1)
  }

  const cityCount = new Map<number, number>()
  for (const profile of profileRows) {
    if (profile.city_id) cityCount.set(profile.city_id, (cityCount.get(profile.city_id) ?? 0) + 1)
  }

  const contactClicks = eventRows.filter((event) =>
    ['contact_whatsapp_click', 'contact_phone_click', 'contact_site_click'].includes(event.event_name),
  ).length
  const admissionViews = eventRows.filter((event) => event.event_name === 'tab_view').length
  const cardViews = eventRows.filter((event) => event.event_name === 'university_view').length

  const approved = reviewRows.filter((review) => review.status === 'approved' && !review.deleted_at)
  const pending = reviewRows.filter((review) => review.status === 'pending' && !review.deleted_at)

  return {
    totals: {
      sessions: new Set(eventRows.map((event) => event.session_id)).size,
      users: profileRows.length,
      newUsers: profileRows.filter((profile) => profile.created_at >= since).length,
      universities: universityRows.filter((row) => row.is_published && !row.deleted_at).length,
      majors: majorRows.filter((row) => row.is_published && !row.deleted_at).length,
      cardViews,
      contactClicks,
      reviewsPending: pending.length,
      reviewsTotal: approved.length,
      avgRating: approved.length
        ? Math.round((approved.reduce((sum, review) => sum + review.rating, 0) / approved.length) * 100) / 100
        : 0,
      avgScore: (() => {
        const scores = profileRows.map((p) => p.ent_score).filter((value): value is number => value != null)
        return scores.length ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10 : 0
      })(),
    },
    daily: [...byDay.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([day, entry]) => ({
        day,
        sessions: entry.sessions.size,
        users: entry.users.size,
        university_views: entry.university_views,
        searches: entry.searches,
      })),
    topUniversities: [...universityViews.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([id, views]) => ({ name: universityRows.find((row) => row.id === id)?.name_ru ?? '—', views })),
    topMajors: [...majorInterest.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([id, interest]) => ({
        name: (() => {
          const row = majorRows.find((major) => major.id === id)
          return row?.program_name_ru || row?.specialty?.name_ru || '—'
        })(),
        interest,
      })),
    scoreBuckets: [...buckets.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([bucket, count]) => ({ bucket, count })),
    cityShare: [...cityCount.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([id, count]) => ({ city: cityRows.find((row) => row.id === id)?.name_ru ?? '—', count })),
    funnel: [
      { step: 'Просмотр карточки', value: cardViews },
      { step: 'Таб «Поступление»', value: admissionViews },
      { step: 'Клик «Связаться»', value: contactClicks },
    ],
    attention: [
      { label: 'Отзывы на модерации', count: pending.length, href: '/admin/reviews' },
      {
        label: 'ВУЗы без специальностей',
        count: universityRows.filter((row) => !row.deleted_at && !majorRows.some((major) => major.university_id === row.id)).length,
        href: '/admin/universities',
      },
      {
        label: 'ВУЗы без контактов',
        count: universityRows.filter((row) => !row.deleted_at && (!row.phones?.length && !row.whatsapp)).length,
        href: '/admin/universities',
      },
      {
        label: 'Специальности без проходного балла',
        count: majorRows.filter((row) => !row.deleted_at && row.grant_score == null).length,
        href: '/admin/majors',
      },
    ],
    recentAudit: audit,
  }
}

export interface AnalyticsData {
  audience: {
    sessions: number
    users: number
    newUsers: number
    devices: { name: string; value: number }[]
    locales: { name: string; value: number }[]
    referrers: { name: string; value: number }[]
    cities: { name: string; value: number }[]
  }
  content: {
    name: string
    slug: string
    views: number
    uniques: number
    favorites: number
    contacts: number
    conversion: number
    rating: number
  }[]
  majors: { name: string; views: number }[]
  search: { top: { query: string; count: number }[]; empty: { query: string; count: number }[]; filters: { name: string; count: number }[] }
  ent: { buckets: { bucket: string; count: number }[]; byCity: { city: string; avg: number }[] }
  reviews: {
    daily: { day: string; count: number }[]
    approved: number
    rejected: number
    pending: number
    criteria: { name: string; value: number }[]
    best: { name: string; rating: number }[]
    worst: { name: string; rating: number }[]
  }
}

export async function adminAnalytics(days = 30): Promise<AnalyticsData> {
  const supabase = await admin()
  const since = new Date(Date.now() - days * 86400000).toISOString()

  const [events, profiles, universities, reviews, cities, favorites] = await Promise.all([
    supabase.from('analytics_events').select('*').gte('created_at', since).limit(50000),
    supabase.from('profiles').select('id, ent_score, city_id, created_at'),
    supabase.from('universities').select('id, name_ru, slug, rating, reviews_count').is('deleted_at', null),
    supabase.from('reviews').select('id, university_id, status, rating, rating_teaching, rating_facilities, rating_dormitory, rating_career, rating_social, created_at').is('deleted_at', null),
    supabase.from('cities').select('id, name_ru'),
    supabase.from('favorites').select('university_id'),
  ])

  type Event = {
    event_name: string; session_id: string; user_id: string | null; university_id: string | null
    major_id: string | null; locale: string; device: string; referrer: string
    props: Record<string, unknown>; created_at: string
  }
  const eventRows = (events.data ?? []) as Event[]
  const universityRows = (universities.data ?? []) as { id: string; name_ru: string; slug: string; rating: number; reviews_count: number }[]
  const reviewRows = (reviews.data ?? []) as Record<string, number | string | null>[]
  const profileRows = (profiles.data ?? []) as { id: string; ent_score: number | null; city_id: number | null; created_at: string }[]
  const cityRows = (cities.data ?? []) as { id: number; name_ru: string }[]
  const favoriteRows = (favorites.data ?? []) as { university_id: string }[]

  const tally = (items: (string | null | undefined)[]) => {
    const map = new Map<string, number>()
    for (const item of items) {
      const key = (item ?? '').trim() || '—'
      map.set(key, (map.get(key) ?? 0) + 1)
    }
    return [...map.entries()].sort((a, b) => b[1] - a[1]).map(([name, value]) => ({ name, value }))
  }

  const searchEvents = eventRows.filter((event) => event.event_name === 'search')
  const searchTally = new Map<string, { count: number; empty: number }>()
  for (const event of searchEvents) {
    const query = String(event.props?.query ?? '').trim().toLowerCase()
    if (!query) continue
    const entry = searchTally.get(query) ?? { count: 0, empty: 0 }
    entry.count += 1
    if (Number(event.props?.results_count ?? 1) === 0) entry.empty += 1
    searchTally.set(query, entry)
  }

  const filterTally = new Map<string, number>()
  for (const event of eventRows.filter((item) => item.event_name === 'filter_apply')) {
    for (const key of Object.keys((event.props?.filters as Record<string, unknown>) ?? {})) {
      filterTally.set(key, (filterTally.get(key) ?? 0) + 1)
    }
  }

  const entBuckets = new Map<string, number>()
  const cityScores = new Map<number, number[]>()
  for (const profile of profileRows) {
    if (profile.ent_score == null) continue
    const low = Math.floor(profile.ent_score / 10) * 10
    entBuckets.set(`${low}–${low + 9}`, (entBuckets.get(`${low}–${low + 9}`) ?? 0) + 1)
    if (profile.city_id) {
      const list = cityScores.get(profile.city_id) ?? []
      list.push(profile.ent_score)
      cityScores.set(profile.city_id, list)
    }
  }

  const reviewsByDay = new Map<string, number>()
  for (const review of reviewRows) {
    const day = String(review.created_at).slice(0, 10)
    reviewsByDay.set(day, (reviewsByDay.get(day) ?? 0) + 1)
  }

  const criteriaKeys = ['rating_teaching', 'rating_facilities', 'rating_dormitory', 'rating_career', 'rating_social'] as const
  const criteriaLabels: Record<string, string> = {
    rating_teaching: 'Преподаватели',
    rating_facilities: 'Инфраструктура',
    rating_dormitory: 'Общежитие',
    rating_career: 'Трудоустройство',
    rating_social: 'Студенческая жизнь',
  }

  const rated = universityRows.filter((row) => row.reviews_count > 0).sort((a, b) => Number(b.rating) - Number(a.rating))

  return {
    audience: {
      sessions: new Set(eventRows.map((event) => event.session_id)).size,
      users: profileRows.length,
      newUsers: profileRows.filter((profile) => profile.created_at >= since).length,
      devices: tally(eventRows.map((event) => event.device)),
      locales: tally(eventRows.map((event) => event.locale)),
      referrers: tally(eventRows.map((event) => event.referrer)).slice(0, 10),
      cities: tally(profileRows.map((profile) => cityRows.find((city) => city.id === profile.city_id)?.name_ru)).slice(0, 12),
    },
    content: universityRows
      .map((university) => {
        const views = eventRows.filter((event) => event.event_name === 'university_view' && event.university_id === university.id)
        const contacts = eventRows.filter(
          (event) =>
            event.university_id === university.id &&
            ['contact_whatsapp_click', 'contact_phone_click', 'contact_site_click'].includes(event.event_name),
        ).length
        return {
          name: university.name_ru,
          slug: university.slug,
          views: views.length,
          uniques: new Set(views.map((event) => event.session_id)).size,
          favorites: favoriteRows.filter((row) => row.university_id === university.id).length,
          contacts,
          conversion: views.length ? Math.round((contacts / views.length) * 1000) / 10 : 0,
          rating: Number(university.rating),
        }
      })
      .sort((a, b) => b.views - a.views),
    majors: [...new Map<string, number>(
      eventRows
        .filter((event) => event.event_name === 'major_expand' && event.major_id)
        .reduce((map, event) => {
          map.set(event.major_id as string, (map.get(event.major_id as string) ?? 0) + 1)
          return map
        }, new Map<string, number>()),
    ).entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15)
      .map(([id, views]) => ({ name: id, views })),
    search: {
      top: [...searchTally.entries()].sort((a, b) => b[1].count - a[1].count).slice(0, 20).map(([query, entry]) => ({ query, count: entry.count })),
      empty: [...searchTally.entries()].filter(([, entry]) => entry.empty > 0).sort((a, b) => b[1].empty - a[1].empty).slice(0, 20).map(([query, entry]) => ({ query, count: entry.empty })),
      filters: [...filterTally.entries()].sort((a, b) => b[1] - a[1]).map(([name, count]) => ({ name, count })),
    },
    ent: {
      buckets: [...entBuckets.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([bucket, count]) => ({ bucket, count })),
      byCity: [...cityScores.entries()]
        .map(([id, scores]) => ({
          city: cityRows.find((city) => city.id === id)?.name_ru ?? '—',
          avg: Math.round((scores.reduce((sum, value) => sum + value, 0) / scores.length) * 10) / 10,
        }))
        .sort((a, b) => b.avg - a.avg),
    },
    reviews: {
      daily: [...reviewsByDay.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([day, count]) => ({ day, count })),
      approved: reviewRows.filter((review) => review.status === 'approved').length,
      rejected: reviewRows.filter((review) => review.status === 'rejected').length,
      pending: reviewRows.filter((review) => review.status === 'pending').length,
      criteria: criteriaKeys.map((key) => {
        const values = reviewRows.map((review) => review[key]).filter((value): value is number => typeof value === 'number')
        return {
          name: criteriaLabels[key],
          value: values.length ? Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 10) / 10 : 0,
        }
      }),
      best: rated.slice(0, 5).map((row) => ({ name: row.name_ru, rating: Number(row.rating) })),
      worst: rated.slice(-5).reverse().map((row) => ({ name: row.name_ru, rating: Number(row.rating) })),
    },
  }
}
