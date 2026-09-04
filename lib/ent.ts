import type { AppSettings, DegreeLevel, University, UniversityMajor } from '@/types/domain'

export type Chance = 'high' | 'medium' | 'low' | 'below_threshold'

export const DEFAULT_SETTINGS: AppSettings = {
  ent_max_score: 140,
  ent_thresholds: {
    default: 50,
    national: 65,
    medical: 70,
    pedagogical: 75,
    legal: 75,
    agriculture: 50,
    college_short: 25,
  },
  ent_structure: { history: 20, reading: 10, math_literacy: 10, subject_1: 40, subject_2: 40 },
  chance_bands: { high: 5, medium: -5 },
  review_auto_publish: false,
  min_reviews_for_rating: 3,
  auth_phone_enabled: false,
  contact_email: 'info@example.kz',
  announcement: { enabled: false, text_ru: '', text_kk: '', link: '' },
}

/**
 * Раздел 7.1. Оценка шанса на грант.
 * bands задаются в app_settings.chance_bands и правятся в админке.
 */
export function getChance(
  userScore: number,
  grantScore: number | null,
  threshold: number,
  bands: { high: number; medium: number } = DEFAULT_SETTINGS.chance_bands,
): Chance {
  if (userScore < threshold) return 'below_threshold'
  if (grantScore == null) return 'medium'
  const diff = userScore - grantScore
  if (diff >= bands.high) return 'high'
  if (diff >= bands.medium) return 'medium'
  return 'low'
}

/** Категория порогового балла по направлению ОП и типу ВУЗа. */
export function resolveThresholdCategory(input: {
  direction?: string | null
  universityType?: University['type'] | null
  degree?: DegreeLevel | null
}): keyof AppSettings['ent_thresholds'] {
  const direction = (input.direction ?? '').toLowerCase()
  if (input.degree === 'college') return 'college_short'
  if (/педагог|білім|образован/.test(direction)) return 'pedagogical'
  if (/прав|юрид|заң/.test(direction)) return 'legal'
  if (/медиц|здравоохран|денсаулық|фармац|ветеринар/.test(direction)) return 'medical'
  if (/сельск|агро|аграр|ауыл/.test(direction)) return 'agriculture'
  if (input.universityType === 'national') return 'national'
  return 'default'
}

export function getThreshold(
  thresholds: AppSettings['ent_thresholds'],
  category: string,
): number {
  return thresholds[category] ?? thresholds.default ?? 50
}

/** Сумма баллов по секциям теста. */
export function sumEntSections(details: Record<string, number | undefined>): number {
  const keys = ['history', 'reading', 'math_literacy', 'subject_1', 'subject_2']
  return keys.reduce((acc, key) => acc + (Number(details[key]) || 0), 0)
}

export function clampScore(value: number, max = DEFAULT_SETTINGS.ent_max_score): number {
  if (Number.isNaN(value)) return 0
  return Math.min(Math.max(Math.round(value), 0), max)
}

export interface ChanceRow {
  major: UniversityMajor
  chance: Chance
  threshold: number
  diff: number | null
  subjectsMatch: boolean
}

/** Раскладывает список ОП по шансам для экрана «Мои шансы» (6.5). */
export function rankMajorsByChance(
  majors: UniversityMajor[],
  userScore: number,
  settings: AppSettings,
  userSubjects: [number | null, number | null] = [null, null],
): ChanceRow[] {
  const order: Record<Chance, number> = { high: 0, medium: 1, low: 2, below_threshold: 3 }

  return majors
    .map((major) => {
      const category = resolveThresholdCategory({
        direction: major.specialty?.direction_ru,
        universityType: major.university?.type ?? null,
        degree: major.degree,
      })
      const threshold = getThreshold(settings.ent_thresholds, category)
      const chance = getChance(userScore, major.grant_score, threshold, settings.chance_bands)
      const required = [major.specialty?.subject_1_id ?? null, major.specialty?.subject_2_id ?? null]
      const subjectsMatch =
        !userSubjects[0] || !userSubjects[1] || required.every((id) => id === null) ||
        required.every((id) => id === null || userSubjects.includes(id))

      return {
        major,
        chance,
        threshold,
        diff: major.grant_score == null ? null : userScore - major.grant_score,
        subjectsMatch,
      }
    })
    .sort((a, b) => {
      if (a.subjectsMatch !== b.subjectsMatch) return a.subjectsMatch ? -1 : 1
      if (order[a.chance] !== order[b.chance]) return order[a.chance] - order[b.chance]
      return (b.diff ?? -999) - (a.diff ?? -999)
    })
}

/** Раздел 7.3. Скор релевантности для сортировки каталога. */
export type Rankable = Pick<University, 'rating' | 'views_count' | 'is_featured'>

export function relevanceScore(
  university: Rankable,
  opts: { chance?: Chance; maxViews?: number; completeness?: number } = {},
): number {
  const rating = (Number(university.rating) || 0) / 5
  const chanceWeight =
    opts.chance === 'high' ? 1 : opts.chance === 'medium' ? 0.6 : opts.chance === 'low' ? 0.2 : 0
  const views = opts.maxViews && opts.maxViews > 0 ? Number(university.views_count) / opts.maxViews : 0
  const completeness = opts.completeness ?? cardCompleteness(university as unknown as Record<string, unknown>)

  return (
    0.35 * rating +
    0.25 * chanceWeight +
    0.15 * Math.min(views, 1) +
    0.15 * completeness +
    0.1 * (university.is_featured ? 1 : 0)
  )
}

const KEY_FIELDS = [
  'description_ru', 'history_ru', 'address_ru', 'whatsapp', 'email', 'website',
  'admission_url', 'logo_url', 'cover_url', 'founded_year', 'students_count', 'lat',
]

/** Полнота карточки 0..1 — используется в ранжировании и в индикаторе админки. */
export function cardCompleteness(university: Record<string, unknown>): number {
  const filled = KEY_FIELDS.filter((field) => {
    const value = university[field]
    if (value === null || value === undefined) return false
    if (typeof value === 'string') return value.trim().length > 0
    if (Array.isArray(value)) return value.length > 0
    return true
  })
  return filled.length / KEY_FIELDS.length
}

export function missingFields(university: Record<string, unknown>): string[] {
  return KEY_FIELDS.filter((field) => {
    const value = university[field]
    if (value === null || value === undefined) return true
    if (typeof value === 'string') return value.trim().length === 0
    return false
  })
}

export const CHANCE_STYLES: Record<Chance, string> = {
  high: 'bg-green-100 text-green-700',
  medium: 'bg-yellow-100 text-yellow-700',
  low: 'bg-red-100 text-red-700',
  below_threshold: 'bg-gray-100 text-gray-600',
}
