-- 0004 — специальности ВУЗа и история проходных баллов
create table if not exists public.university_majors (
  id              uuid primary key default gen_random_uuid(),
  university_id   uuid not null references public.universities(id) on delete cascade,
  specialty_id    bigint not null references public.specialties(id) on delete restrict,
  degree          degree_level not null default 'bachelor',
  study_forms     study_form[] not null default '{full_time}',
  languages       text[] not null default '{ru}',
  duration_years  numeric(2,1) not null default 4,
  fee_per_year    integer not null default 0,
  grant_score     integer,
  paid_min_score  integer,
  grants_count    integer,
  description_ru  text default '',
  description_kk  text default '',
  is_published    boolean not null default true,
  sort_order      int not null default 100,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  deleted_at      timestamptz,
  unique (university_id, specialty_id, degree)
);
create index if not exists university_majors_univ_idx      on public.university_majors (university_id, is_published);
create index if not exists university_majors_specialty_idx on public.university_majors (specialty_id);
create index if not exists university_majors_score_idx     on public.university_majors (grant_score);

create table if not exists public.major_score_history (
  id                  bigint generated always as identity primary key,
  university_major_id uuid not null references public.university_majors(id) on delete cascade,
  year                int not null,
  grant_score         int,
  paid_min_score      int,
  grants_count        int,
  applicants_count    int,
  unique (university_major_id, year)
);
create index if not exists major_score_history_idx on public.major_score_history (university_major_id, year desc);
