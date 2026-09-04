-- 0005 — профили, отзывы, голоса, жалобы, избранное
create table if not exists public.profiles (
  id                uuid primary key references auth.users(id) on delete cascade,
  email             text,
  phone             text,
  full_name         text default '',
  avatar_url        text default '',
  city_id           bigint references public.cities(id) on delete set null,
  school            text default '',
  graduation_year   int,
  ent_score         int check (ent_score is null or ent_score between 0 and 140),
  ent_subject_1_id  bigint references public.ent_subjects(id) on delete set null,
  ent_subject_2_id  bigint references public.ent_subjects(id) on delete set null,
  ent_details       jsonb not null default '{}',
  preferred_locale  text not null default 'ru',
  role              user_role not null default 'user',
  university_id     uuid references public.universities(id) on delete set null,
  is_blocked        boolean not null default false,
  onboarded         boolean not null default false,
  last_seen_at      timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index if not exists profiles_role_idx  on public.profiles (role);
create index if not exists profiles_score_idx on public.profiles (ent_score);

create table if not exists public.reviews (
  id                 uuid primary key default gen_random_uuid(),
  university_id      uuid not null references public.universities(id) on delete cascade,
  user_id            uuid not null references public.profiles(id) on delete cascade,
  rating             smallint not null check (rating between 1 and 5),
  rating_teaching    smallint check (rating_teaching between 1 and 5),
  rating_facilities  smallint check (rating_facilities between 1 and 5),
  rating_dormitory   smallint check (rating_dormitory between 1 and 5),
  rating_career      smallint check (rating_career between 1 and 5),
  rating_social      smallint check (rating_social between 1 and 5),
  body               text not null check (char_length(body) between 30 and 3000),
  pros               text default '',
  cons               text default '',
  study_year         int,
  major_id           uuid references public.university_majors(id) on delete set null,
  is_anonymous       boolean not null default false,
  author_name        text default '',
  status             review_status not null default 'pending',
  moderation_comment text default '',
  moderated_by       uuid references public.profiles(id) on delete set null,
  moderated_at       timestamptz,
  helpful_count      int not null default 0,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  deleted_at         timestamptz
);
create unique index if not exists reviews_one_per_user_idx
  on public.reviews (university_id, user_id) where deleted_at is null;
create index if not exists reviews_univ_idx   on public.reviews (university_id, status, created_at desc);
create index if not exists reviews_status_idx on public.reviews (status, created_at desc);

create table if not exists public.review_votes (
  review_id  uuid not null references public.reviews(id) on delete cascade,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (review_id, user_id)
);

create table if not exists public.review_reports (
  id          uuid primary key default gen_random_uuid(),
  review_id   uuid not null references public.reviews(id) on delete cascade,
  user_id     uuid references public.profiles(id) on delete set null,
  reason      report_reason not null default 'other',
  comment     text default '',
  is_resolved boolean not null default false,
  created_at  timestamptz not null default now()
);

create table if not exists public.favorites (
  user_id       uuid not null references public.profiles(id) on delete cascade,
  university_id uuid not null references public.universities(id) on delete cascade,
  created_at    timestamptz not null default now(),
  primary key (user_id, university_id)
);

create table if not exists public.favorite_majors (
  user_id    uuid not null references public.profiles(id) on delete cascade,
  major_id   uuid not null references public.university_majors(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, major_id)
);
