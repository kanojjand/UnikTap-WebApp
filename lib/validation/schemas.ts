import { z } from 'zod'

export const reviewSchema = z.object({
  university_id: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  rating_teaching: z.number().int().min(1).max(5).nullable().optional(),
  rating_facilities: z.number().int().min(1).max(5).nullable().optional(),
  rating_dormitory: z.number().int().min(1).max(5).nullable().optional(),
  rating_career: z.number().int().min(1).max(5).nullable().optional(),
  rating_social: z.number().int().min(1).max(5).nullable().optional(),
  body: z.string().trim().min(30, 'Минимум 30 символов').max(3000),
  pros: z.string().trim().max(500).optional().default(''),
  cons: z.string().trim().max(500).optional().default(''),
  study_year: z.number().int().min(1990).max(2100).nullable().optional(),
  major_id: z.string().uuid().nullable().optional(),
  is_anonymous: z.boolean().default(false),
})

export const reportSchema = z.object({
  review_id: z.string().uuid(),
  reason: z.enum(['spam', 'offensive', 'fake', 'personal_data', 'other']),
  comment: z.string().trim().max(500).optional().default(''),
})

export const profileSchema = z.object({
  full_name: z.string().trim().max(120).optional().default(''),
  city_id: z.number().int().nullable().optional(),
  school: z.string().trim().max(160).optional().default(''),
  graduation_year: z.number().int().min(1990).max(2100).nullable().optional(),
  ent_score: z.number().int().min(0).max(140).nullable().optional(),
  ent_subject_1_id: z.number().int().nullable().optional(),
  ent_subject_2_id: z.number().int().nullable().optional(),
  ent_details: z.record(z.string(), z.number()).optional().default({}),
  preferred_locale: z.enum(['ru', 'kk']).optional(),
  onboarded: z.boolean().optional(),
})

export const universitySchema = z.object({
  slug: z.string().trim().min(2).max(80).regex(/^[a-z0-9-]+$/, 'Только латиница, цифры и дефис'),
  name_ru: z.string().trim().min(2).max(300),
  name_kk: z.string().trim().max(300).optional().default(''),
  short_name: z.string().trim().max(120).optional().default(''),
  abbr: z.string().trim().max(60).optional().default(''),
  city_id: z.number().int().nullable().optional(),
  type: z.enum(['national', 'state', 'private', 'international', 'autonomous']),
  founded_year: z.number().int().min(1000).max(2100).nullable().optional(),
  students_count: z.number().int().min(0).nullable().optional(),
  teachers_count: z.number().int().min(0).nullable().optional(),
  has_military_department: z.boolean().default(false),
  has_dormitory: z.boolean().default(false),
  dormitory_info_ru: z.string().max(2000).optional().default(''),
  dormitory_info_kk: z.string().max(2000).optional().default(''),
  license_number: z.string().max(120).optional().default(''),
  accreditation_ru: z.string().max(500).optional().default(''),
  accreditation_kk: z.string().max(500).optional().default(''),
  description_ru: z.string().max(2000).optional().default(''),
  description_kk: z.string().max(2000).optional().default(''),
  history_ru: z.string().max(20000).optional().default(''),
  history_kk: z.string().max(20000).optional().default(''),
  admission_intro_ru: z.string().max(5000).optional().default(''),
  admission_intro_kk: z.string().max(5000).optional().default(''),
  address_ru: z.string().max(300).optional().default(''),
  address_kk: z.string().max(300).optional().default(''),
  lat: z.number().min(-90).max(90).nullable().optional(),
  lng: z.number().min(-180).max(180).nullable().optional(),
  twogis_url: z.string().max(500).optional().default(''),
  google_maps_url: z.string().max(500).optional().default(''),
  phones: z.array(z.string().max(40)).max(10).default([]),
  whatsapp: z.string().max(20).optional().default(''),
  email: z.string().max(160).optional().default(''),
  website: z.string().max(300).optional().default(''),
  admission_url: z.string().max(300).optional().default(''),
  socials: z.record(z.string(), z.string()).optional().default({}),
  working_hours_ru: z.string().max(300).optional().default(''),
  working_hours_kk: z.string().max(300).optional().default(''),
  logo_url: z.string().max(500).optional().default(''),
  cover_url: z.string().max(500).optional().default(''),
  is_published: z.boolean().default(false),
  is_featured: z.boolean().default(false),
  sort_order: z.number().int().default(100),
  seo_title_ru: z.string().max(200).optional().default(''),
  seo_title_kk: z.string().max(200).optional().default(''),
  seo_description_ru: z.string().max(400).optional().default(''),
  seo_description_kk: z.string().max(400).optional().default(''),
})

export const majorSchema = z.object({
  id: z.string().uuid().optional(),
  university_id: z.string().uuid(),
  specialty_id: z.number().int(),
  degree: z.enum(['bachelor', 'master', 'phd', 'college']).default('bachelor'),
  study_forms: z.array(z.enum(['full_time', 'part_time', 'evening', 'distance'])).default(['full_time']),
  languages: z.array(z.string().max(4)).default(['ru']),
  duration_years: z.number().min(0.5).max(10).default(4),
  fee_per_year: z.number().int().min(0).max(100000000).nullable().default(null),
  grant_score: z.number().int().min(0).max(140).nullable().optional(),
  paid_min_score: z.number().int().min(0).max(140).nullable().optional(),
  grants_count: z.number().int().min(0).nullable().optional(),
  description_ru: z.string().max(2000).optional().default(''),
  description_kk: z.string().max(2000).optional().default(''),
  is_published: z.boolean().default(true),
  sort_order: z.number().int().default(100),
})

export const admissionBlockSchema = z.object({
  id: z.string().uuid().optional(),
  university_id: z.string().uuid(),
  kind: z.enum(['step', 'document', 'condition', 'deadline', 'benefit']),
  title_ru: z.string().trim().min(2).max(300),
  title_kk: z.string().trim().max(300).optional().default(''),
  content_ru: z.string().max(5000).optional().default(''),
  content_kk: z.string().max(5000).optional().default(''),
  date_from: z.string().nullable().optional(),
  date_to: z.string().nullable().optional(),
  sort_order: z.number().int().default(100),
  is_published: z.boolean().default(true),
})

export const trackSchema = z.object({
  events: z
    .array(
      z.object({
        event_name: z.string().max(60),
        university_id: z.string().uuid().nullable().optional(),
        major_id: z.string().uuid().nullable().optional(),
        path: z.string().max(300).optional(),
        props: z.record(z.string(), z.unknown()).optional(),
      }),
    )
    .max(20),
  device: z.string().max(20).optional(),
  locale: z.string().max(5).optional(),
  referrer: z.string().max(500).optional(),
})

export type ReviewInput = z.infer<typeof reviewSchema>
export type UniversityInput = z.infer<typeof universitySchema>
export type MajorInput = z.infer<typeof majorSchema>
