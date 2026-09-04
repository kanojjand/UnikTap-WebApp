/**
 * Схема БД в виде типов. Соответствует supabase/migrations/*.sql.
 * Пересоздать из живой базы:
 *   npx supabase gen types typescript --project-id <id> > types/database.ts
 */
import type {
  AdmissionBlock, AuditEntry, City, EntSubject, FaqItem, MajorScoreHistory, Profile,
  Review, ReviewReport, Specialty, StaticPage, University, UniversityImage, UniversityMajor,
} from './domain'

type Mutable<T> = Partial<T>

export interface Database {
  public: {
    Tables: {
      cities: { Row: City; Insert: Mutable<City>; Update: Mutable<City>; Relationships: [] }
      ent_subjects: { Row: EntSubject; Insert: Mutable<EntSubject>; Update: Mutable<EntSubject>; Relationships: [] }
      specialties: { Row: Specialty; Insert: Mutable<Specialty>; Update: Mutable<Specialty>; Relationships: [] }
      universities: { Row: University; Insert: Mutable<University>; Update: Mutable<University>; Relationships: [] }
      university_images: { Row: UniversityImage; Insert: Mutable<UniversityImage>; Update: Mutable<UniversityImage>; Relationships: [] }
      admission_blocks: { Row: AdmissionBlock; Insert: Mutable<AdmissionBlock>; Update: Mutable<AdmissionBlock>; Relationships: [] }
      university_majors: { Row: UniversityMajor; Insert: Mutable<UniversityMajor>; Update: Mutable<UniversityMajor>; Relationships: [] }
      major_score_history: { Row: MajorScoreHistory; Insert: Mutable<MajorScoreHistory>; Update: Mutable<MajorScoreHistory>; Relationships: [] }
      profiles: { Row: Profile; Insert: Mutable<Profile>; Update: Mutable<Profile>; Relationships: [] }
      reviews: { Row: Review; Insert: Mutable<Review>; Update: Mutable<Review>; Relationships: [] }
      review_votes: { Row: { review_id: string; user_id: string; created_at: string }; Insert: { review_id: string; user_id: string }; Update: Mutable<{ review_id: string; user_id: string }>; Relationships: [] }
      review_reports: { Row: ReviewReport; Insert: Mutable<ReviewReport>; Update: Mutable<ReviewReport>; Relationships: [] }
      favorites: { Row: { user_id: string; university_id: string; created_at: string }; Insert: { user_id: string; university_id: string }; Update: Mutable<{ user_id: string; university_id: string }>; Relationships: [] }
      favorite_majors: { Row: { user_id: string; major_id: string; created_at: string }; Insert: { user_id: string; major_id: string }; Update: Mutable<{ user_id: string; major_id: string }>; Relationships: [] }
      faq: { Row: FaqItem; Insert: Mutable<FaqItem>; Update: Mutable<FaqItem>; Relationships: [] }
      static_pages: { Row: StaticPage; Insert: Mutable<StaticPage>; Update: Mutable<StaticPage>; Relationships: [] }
      app_settings: { Row: { key: string; value: unknown; description: string | null; updated_at: string }; Insert: { key: string; value: unknown }; Update: Mutable<{ key: string; value: unknown }>; Relationships: [] }
      analytics_events: {
        Row: { id: number; event_name: string; user_id: string | null; session_id: string; university_id: string | null; major_id: string | null; locale: string; path: string; referrer: string; device: string; props: Record<string, unknown>; created_at: string }
        Insert: { event_name: string; session_id: string; user_id?: string | null; university_id?: string | null; major_id?: string | null; locale?: string; path?: string; referrer?: string; device?: string; props?: Record<string, unknown> }
        Update: Record<string, never>
        Relationships: []
      }
      audit_log: { Row: AuditEntry; Insert: Mutable<AuditEntry>; Update: Record<string, never>; Relationships: [] }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}
