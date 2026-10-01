/**
 * Доменные типы приложения. Отражают схему из supabase/migrations.
 * Сгенерированные типы БД лежат в types/database.ts (npm run gen:types).
 */

export type UserRole = 'user' | 'university_admin' | 'superadmin'
export type UniversityType = 'national' | 'state' | 'private' | 'international' | 'autonomous'
export type ReviewStatus = 'pending' | 'approved' | 'rejected'
export type ReportReason = 'spam' | 'offensive' | 'fake' | 'personal_data' | 'other'
export type AdmissionKind = 'step' | 'document' | 'condition' | 'deadline' | 'benefit'
export type DegreeLevel = 'bachelor' | 'master' | 'phd' | 'college'
export type StudyForm = 'full_time' | 'part_time' | 'evening' | 'distance'

export interface City {
  id: number
  slug: string
  name_ru: string
  name_kk: string
  region_ru: string | null
  region_kk: string | null
  lat: number | null
  lng: number | null
  sort_order: number
  is_active: boolean
}

export interface EntSubject {
  id: number
  code: string
  name_ru: string
  name_kk: string
  is_active: boolean
}

export interface Specialty {
  id: number
  code: string
  group_code: string | null
  name_ru: string
  name_kk: string
  direction_ru: string | null
  direction_kk: string | null
  subject_1_id: number | null
  subject_2_id: number | null
  is_active: boolean
}

export interface Socials {
  instagram?: string
  telegram?: string
  facebook?: string
  youtube?: string
  tiktok?: string
  linkedin?: string
  vk?: string
  x?: string
}

export interface Faculty {
  name_ru: string
  name_kk?: string
}

/** Корпус, общежитие или отдельная приёмная — всё, что не главный адрес вуза. */
export interface Campus {
  title_ru?: string
  title_kk?: string
  address_ru: string
  address_kk?: string
  twogis_url?: string
}

export interface University {
  id: string
  slug: string
  name_ru: string
  name_kk: string
  short_name: string | null
  abbr: string | null
  city_id: number | null
  address_ru: string | null
  address_kk: string | null
  lat: number | null
  lng: number | null
  twogis_url: string | null
  google_maps_url: string | null
  phones: string[]
  whatsapp: string | null
  email: string | null
  website: string | null
  admission_url: string | null
  socials: Socials
  working_hours_ru: string | null
  working_hours_kk: string | null
  description_ru: string | null
  description_kk: string | null
  history_ru: string | null
  history_kk: string | null
  admission_intro_ru: string | null
  admission_intro_kk: string | null
  type: UniversityType
  founded_year: number | null
  students_count: number | null
  teachers_count: number | null
  has_military_department: boolean
  has_dormitory: boolean
  dormitory_info_ru: string | null
  dormitory_info_kk: string | null
  license_number: string | null
  accreditation_ru: string | null
  accreditation_kk: string | null
  min_ent_score: number | null
  min_fee: number | null
  majors_count: number
  rating: number
  reviews_count: number
  views_count: number
  logo_url: string | null
  cover_url: string | null
  /** Появились в миграции 0011 — в базе без неё их нет. */
  faculties?: Faculty[]
  campuses?: Campus[]
  is_published: boolean
  is_featured: boolean
  sort_order: number
  seo_title_ru: string | null
  seo_title_kk: string | null
  seo_description_ru: string | null
  seo_description_kk: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
  city?: City | null
}

export interface UniversityImage {
  id: string
  university_id: string
  url: string
  caption_ru: string | null
  caption_kk: string | null
  sort_order: number
}

export interface AdmissionBlock {
  id: string
  university_id: string
  kind: AdmissionKind
  title_ru: string
  title_kk: string | null
  content_ru: string | null
  content_kk: string | null
  date_from: string | null
  date_to: string | null
  sort_order: number
  is_published: boolean
}

export interface MajorScoreHistory {
  id: number
  university_major_id: string
  year: number
  grant_score: number | null
  paid_min_score: number | null
  grants_count: number | null
  applicants_count: number | null
}

export interface UniversityMajor {
  id: string
  university_id: string
  specialty_id: number
  /**
   * Код и название программы вуза (6B01101 «Психология»). specialty — это группа ОП,
   * от неё берутся предметы ЕНТ. Пусто — показывается название группы.
   */
  program_code?: string
  program_name_ru?: string
  program_name_kk?: string
  degree: DegreeLevel
  study_forms: StudyForm[]
  languages: string[]
  duration_years: number
  /** null — вуз не публикует стоимость; 0 — обучение бесплатное */
  fee_per_year: number | null
  grant_score: number | null
  paid_min_score: number | null
  grants_count: number | null
  description_ru: string | null
  description_kk: string | null
  is_published: boolean
  sort_order: number
  created_at: string
  updated_at: string
  deleted_at: string | null
  specialty?: Specialty | null
  university?: Pick<University, 'id' | 'slug' | 'name_ru' | 'name_kk' | 'logo_url' | 'type' | 'city_id'> | null
  history?: MajorScoreHistory[]
}

export interface Profile {
  id: string
  email: string | null
  phone: string | null
  full_name: string | null
  avatar_url: string | null
  city_id: number | null
  school: string | null
  graduation_year: number | null
  ent_score: number | null
  ent_subject_1_id: number | null
  ent_subject_2_id: number | null
  ent_details: Record<string, number>
  preferred_locale: string
  role: UserRole
  university_id: string | null
  is_blocked: boolean
  onboarded: boolean
  last_seen_at: string | null
  created_at: string
  updated_at: string
}

export interface Review {
  id: string
  university_id: string
  user_id: string
  rating: number
  rating_teaching: number | null
  rating_facilities: number | null
  rating_dormitory: number | null
  rating_career: number | null
  rating_social: number | null
  body: string
  pros: string | null
  cons: string | null
  study_year: number | null
  major_id: string | null
  is_anonymous: boolean
  author_name: string | null
  status: ReviewStatus
  moderation_comment: string | null
  moderated_at: string | null
  helpful_count: number
  created_at: string
  updated_at: string
  deleted_at: string | null
  university?: Pick<University, 'id' | 'slug' | 'name_ru'> | null
  author?: Pick<Profile, 'id' | 'full_name' | 'email' | 'created_at'> | null
}

export interface ReviewReport {
  id: string
  review_id: string
  user_id: string | null
  reason: ReportReason
  comment: string | null
  is_resolved: boolean
  created_at: string
  review?: Review | null
}

export interface FaqItem {
  id: number
  category: string
  question_ru: string
  question_kk: string | null
  answer_ru: string
  answer_kk: string | null
  sort_order: number
  is_published: boolean
}

export interface StaticPage {
  id: number
  slug: string
  title_ru: string
  title_kk: string | null
  content_ru: string | null
  content_kk: string | null
  is_published: boolean
  updated_at: string
}

export interface AuditEntry {
  id: number
  actor_id: string | null
  action: string
  entity: string
  entity_id: string | null
  before: unknown
  after: unknown
  created_at: string
  actor?: Pick<Profile, 'id' | 'full_name' | 'email'> | null
}

export interface AppSettings {
  ent_max_score: number
  ent_thresholds: Record<string, number>
  ent_structure: Record<string, number>
  chance_bands: { high: number; medium: number }
  review_auto_publish: boolean
  min_reviews_for_rating: number
  auth_phone_enabled: boolean
  contact_email: string
  announcement: { enabled: boolean; text_ru: string; text_kk: string; link: string }
}

export interface CatalogFilters {
  q?: string
  city?: string
  score?: number
  feeMax?: number
  specialty?: string
  studyForm?: StudyForm
  language?: string
  military?: boolean
  dormitory?: boolean
  type?: UniversityType
  sort?: 'relevance' | 'rating' | 'fee_asc' | 'fee_desc' | 'score' | 'popular'
  page?: number
}
