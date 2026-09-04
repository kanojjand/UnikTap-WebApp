-- ============================================================
-- UnikTap · всё одним файлом: миграции 0001–0010 + сид.
-- Вставьте целиком в Supabase → SQL Editor и нажмите Run.
-- Скрипт безопасно запускать повторно.
-- ============================================================

-- ─────────── migrations/0001_init.sql ───────────
-- 0001 — расширения и перечисления
create extension if not exists "pgcrypto";
create extension if not exists "pg_trgm";
create extension if not exists "unaccent";

do $$ begin
  create type user_role as enum ('user', 'university_admin', 'superadmin');
exception when duplicate_object then null; end $$;

do $$ begin
  create type university_type as enum ('national', 'state', 'private', 'international', 'autonomous');
exception when duplicate_object then null; end $$;

do $$ begin
  create type review_status as enum ('pending', 'approved', 'rejected');
exception when duplicate_object then null; end $$;

do $$ begin
  create type report_reason as enum ('spam', 'offensive', 'fake', 'personal_data', 'other');
exception when duplicate_object then null; end $$;

do $$ begin
  create type admission_kind as enum ('step', 'document', 'condition', 'deadline', 'benefit');
exception when duplicate_object then null; end $$;

do $$ begin
  create type degree_level as enum ('bachelor', 'master', 'phd', 'college');
exception when duplicate_object then null; end $$;

do $$ begin
  create type study_form as enum ('full_time', 'part_time', 'evening', 'distance');
exception when duplicate_object then null; end $$;

-- ─────────── migrations/0002_dictionaries.sql ───────────
-- 0002 — справочники
create table if not exists public.cities (
  id           bigint generated always as identity primary key,
  slug         text not null unique,
  name_ru      text not null,
  name_kk      text not null default '',
  region_ru    text default '',
  region_kk    text default '',
  lat          double precision,
  lng          double precision,
  sort_order   int not null default 100,
  is_active    boolean not null default true
);

create table if not exists public.ent_subjects (
  id        bigint generated always as identity primary key,
  code      text not null unique,
  name_ru   text not null,
  name_kk   text not null default '',
  is_active boolean not null default true
);

create table if not exists public.specialties (
  id            bigint generated always as identity primary key,
  code          text not null unique,
  group_code    text default '',
  name_ru       text not null,
  name_kk       text not null default '',
  direction_ru  text default '',
  direction_kk  text default '',
  subject_1_id  bigint references public.ent_subjects(id) on delete set null,
  subject_2_id  bigint references public.ent_subjects(id) on delete set null,
  is_active     boolean not null default true
);

create index if not exists specialties_name_trgm_idx
  on public.specialties using gin (name_ru gin_trgm_ops);

-- ─────────── migrations/0003_universities.sql ───────────
-- 0003 — университеты, галерея, блоки поступления
create table if not exists public.universities (
  id                      uuid primary key default gen_random_uuid(),
  slug                    text not null unique,
  name_ru                 text not null,
  name_kk                 text not null default '',
  short_name              text default '',
  abbr                    text default '',
  city_id                 bigint references public.cities(id) on delete set null,

  address_ru              text default '',
  address_kk              text default '',
  lat                     double precision,
  lng                     double precision,
  twogis_url              text default '',
  google_maps_url         text default '',

  phones                  text[] not null default '{}',
  whatsapp                text default '',
  email                   text default '',
  website                 text default '',
  admission_url           text default '',
  socials                 jsonb not null default '{}',
  working_hours_ru        text default '',
  working_hours_kk        text default '',

  description_ru          text default '',
  description_kk          text default '',
  history_ru              text default '',
  history_kk              text default '',
  admission_intro_ru      text default '',
  admission_intro_kk      text default '',

  type                    university_type not null default 'state',
  founded_year            int,
  students_count          int,
  teachers_count          int,
  has_military_department boolean not null default false,
  has_dormitory           boolean not null default false,
  dormitory_info_ru       text default '',
  dormitory_info_kk       text default '',
  license_number          text default '',
  accreditation_ru        text default '',
  accreditation_kk        text default '',

  min_ent_score           int,
  min_fee                 int,
  majors_count            int not null default 0,
  rating                  numeric(2,1) not null default 0,
  reviews_count           int not null default 0,
  views_count             bigint not null default 0,

  logo_url                text default '',
  cover_url               text default '',

  is_published            boolean not null default false,
  is_featured             boolean not null default false,
  sort_order              int not null default 100,
  seo_title_ru            text default '',
  seo_title_kk            text default '',
  seo_description_ru      text default '',
  seo_description_kk      text default '',

  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now(),
  deleted_at              timestamptz
);

create index if not exists universities_city_idx      on public.universities (city_id);
create index if not exists universities_published_idx on public.universities (is_published, deleted_at);
create index if not exists universities_rating_idx    on public.universities (rating desc);
create index if not exists universities_score_idx     on public.universities (min_ent_score);
create index if not exists universities_search_idx on public.universities
  using gin ((coalesce(name_ru,'') || ' ' || coalesce(name_kk,'') || ' ' ||
              coalesce(short_name,'') || ' ' || coalesce(abbr,'')) gin_trgm_ops);

create table if not exists public.university_images (
  id            uuid primary key default gen_random_uuid(),
  university_id uuid not null references public.universities(id) on delete cascade,
  url           text not null,
  caption_ru    text default '',
  caption_kk    text default '',
  sort_order    int not null default 100,
  created_at    timestamptz not null default now()
);
create index if not exists university_images_idx on public.university_images (university_id, sort_order);

create table if not exists public.admission_blocks (
  id            uuid primary key default gen_random_uuid(),
  university_id uuid not null references public.universities(id) on delete cascade,
  kind          admission_kind not null default 'step',
  title_ru      text not null,
  title_kk      text default '',
  content_ru    text default '',
  content_kk    text default '',
  date_from     date,
  date_to       date,
  sort_order    int not null default 100,
  is_published  boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists admission_blocks_idx on public.admission_blocks (university_id, kind, sort_order);

-- ─────────── migrations/0004_majors.sql ───────────
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

-- ─────────── migrations/0005_users_reviews.sql ───────────
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

-- ─────────── migrations/0006_content_analytics.sql ───────────
-- 0006 — контент, настройки, аналитика, аудит
create table if not exists public.faq (
  id           bigint generated always as identity primary key,
  category     text default 'general',
  question_ru  text not null,
  question_kk  text default '',
  answer_ru    text not null,
  answer_kk    text default '',
  sort_order   int not null default 100,
  is_published boolean not null default true
);

create table if not exists public.static_pages (
  id         bigint generated always as identity primary key,
  slug       text not null unique,
  title_ru   text not null,
  title_kk   text default '',
  content_ru text default '',
  content_kk text default '',
  is_published boolean not null default true,
  updated_at timestamptz not null default now()
);

create table if not exists public.app_settings (
  key         text primary key,
  value       jsonb not null,
  description text default '',
  updated_at  timestamptz not null default now()
);

create table if not exists public.analytics_events (
  id            bigint generated always as identity primary key,
  event_name    text not null,
  user_id       uuid references public.profiles(id) on delete set null,
  session_id    text not null,
  university_id uuid references public.universities(id) on delete set null,
  major_id      uuid references public.university_majors(id) on delete set null,
  locale        text default 'ru',
  path          text default '',
  referrer      text default '',
  device        text default '',
  props         jsonb not null default '{}',
  created_at    timestamptz not null default now()
);
create index if not exists analytics_created_idx on public.analytics_events (created_at desc);
create index if not exists analytics_event_idx   on public.analytics_events (event_name, created_at desc);
create index if not exists analytics_univ_idx    on public.analytics_events (university_id, created_at desc);
create index if not exists analytics_session_idx on public.analytics_events (session_id);

create table if not exists public.audit_log (
  id         bigint generated always as identity primary key,
  actor_id   uuid references public.profiles(id) on delete set null,
  action     text not null,
  entity     text not null,
  entity_id  text,
  before     jsonb,
  after      jsonb,
  created_at timestamptz not null default now()
);
create index if not exists audit_created_idx on public.audit_log (created_at desc);
create index if not exists audit_entity_idx  on public.audit_log (entity, entity_id);

-- ─────────── migrations/0007_functions_triggers.sql ───────────
-- 0007 — функции и триггеры
create or replace function public.set_updated_at() returns trigger
language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

do $$ declare t text;
begin
  foreach t in array array['universities','university_majors','reviews','profiles',
                           'admission_blocks','static_pages','app_settings']
  loop
    execute format('drop trigger if exists trg_%1$s_updated on public.%1$s', t);
    execute format(
      'create trigger trg_%1$s_updated before update on public.%1$s
       for each row execute function public.set_updated_at()', t);
  end loop;
end $$;

-- Профиль создаётся автоматически при регистрации
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, phone, full_name, avatar_url)
  values (
    new.id,
    new.email,
    new.phone,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''),
    coalesce(new.raw_user_meta_data->>'avatar_url', '')
  )
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- Рейтинг ВУЗа по одобренным отзывам
create or replace function public.recalc_university_rating() returns trigger
language plpgsql security definer set search_path = public as $$
declare uid uuid;
begin
  if tg_op = 'DELETE' then uid := old.university_id; else uid := new.university_id; end if;
  update public.universities u set
    rating = coalesce((select round(avg(r.rating)::numeric, 1) from public.reviews r
                        where r.university_id = uid and r.status = 'approved' and r.deleted_at is null), 0),
    reviews_count = (select count(*) from public.reviews r
                        where r.university_id = uid and r.status = 'approved' and r.deleted_at is null)
  where u.id = uid;
  return null;
end $$;

drop trigger if exists trg_reviews_rating on public.reviews;
create trigger trg_reviews_rating
after insert or update or delete on public.reviews
for each row execute function public.recalc_university_rating();

-- Агрегаты ВУЗа по специальностям
create or replace function public.recalc_university_majors() returns trigger
language plpgsql security definer set search_path = public as $$
declare uid uuid;
begin
  if tg_op = 'DELETE' then uid := old.university_id; else uid := new.university_id; end if;
  update public.universities u set
    majors_count  = (select count(*) from public.university_majors m
                       where m.university_id = uid and m.is_published and m.deleted_at is null),
    min_ent_score = (select min(m.grant_score) from public.university_majors m
                       where m.university_id = uid and m.is_published and m.deleted_at is null),
    min_fee       = (select min(nullif(m.fee_per_year, 0)) from public.university_majors m
                       where m.university_id = uid and m.is_published and m.deleted_at is null)
  where u.id = uid;
  return null;
end $$;

drop trigger if exists trg_majors_aggregate on public.university_majors;
create trigger trg_majors_aggregate
after insert or update or delete on public.university_majors
for each row execute function public.recalc_university_majors();

-- helpful_count
create or replace function public.recalc_review_votes() returns trigger
language plpgsql security definer set search_path = public as $$
declare rid uuid;
begin
  if tg_op = 'DELETE' then rid := old.review_id; else rid := new.review_id; end if;
  update public.reviews set helpful_count =
    (select count(*) from public.review_votes where review_id = rid) where id = rid;
  return null;
end $$;

drop trigger if exists trg_review_votes on public.review_votes;
create trigger trg_review_votes after insert or delete on public.review_votes
for each row execute function public.recalc_review_votes();

-- 3+ жалобы возвращают отзыв на модерацию (раздел 7.4)
create or replace function public.handle_review_report() returns trigger
language plpgsql security definer set search_path = public as $$
declare cnt int;
begin
  select count(*) into cnt from public.review_reports
    where review_id = new.review_id and not is_resolved;
  if cnt >= 3 then
    update public.reviews set status = 'pending' where id = new.review_id and status = 'approved';
  end if;
  return null;
end $$;

drop trigger if exists trg_review_reports on public.review_reports;
create trigger trg_review_reports after insert on public.review_reports
for each row execute function public.handle_review_report();

-- Проверка роли для RLS
create or replace function public.is_superadmin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles
                 where id = auth.uid() and role = 'superadmin' and not is_blocked);
$$;

-- Счётчик просмотров (вызывается из Server Action)
create or replace function public.increment_university_views(p_id uuid) returns void
language sql security definer set search_path = public as $$
  update public.universities set views_count = views_count + 1 where id = p_id;
$$;

-- ─────────── migrations/0008_views.sql ───────────
-- 0008 — представления и сводка для дашборда
create or replace view public.v_university_stats as
select
  u.id, u.name_ru, u.slug, u.views_count, u.rating, u.reviews_count,
  (select count(*) from public.favorites f where f.university_id = u.id)            as favorites_count,
  (select count(*) from public.reviews r
     where r.university_id = u.id and r.status = 'pending')                          as pending_reviews,
  (select count(*) from public.analytics_events e
     where e.university_id = u.id and e.event_name = 'contact_whatsapp_click')       as whatsapp_clicks,
  (select count(*) from public.analytics_events e
     where e.university_id = u.id and e.event_name = 'contact_phone_click')          as phone_clicks,
  (select count(*) from public.analytics_events e
     where e.university_id = u.id and e.event_name = 'university_view'
       and e.created_at > now() - interval '30 days')                                as views_30d
from public.universities u
where u.deleted_at is null;

create or replace view public.v_daily_activity as
select
  date_trunc('day', created_at)::date                        as day,
  count(distinct session_id)                                 as sessions,
  count(distinct user_id) filter (where user_id is not null) as users,
  count(*)                                                   as events,
  count(*) filter (where event_name = 'university_view')     as university_views,
  count(*) filter (where event_name = 'search')              as searches
from public.analytics_events
group by 1 order by 1 desc;

create or replace function public.admin_dashboard(p_from date, p_to date)
returns jsonb language sql security definer set search_path = public as $$
  select case when not public.is_superadmin() then '{}'::jsonb else jsonb_build_object(
    'sessions',        (select count(distinct session_id) from analytics_events
                          where created_at::date between p_from and p_to),
    'new_users',       (select count(*) from profiles where created_at::date between p_from and p_to),
    'total_users',     (select count(*) from profiles),
    'universities',    (select count(*) from universities where deleted_at is null and is_published),
    'majors',          (select count(*) from university_majors where deleted_at is null and is_published),
    'reviews_pending', (select count(*) from reviews where status = 'pending' and deleted_at is null),
    'reviews_total',   (select count(*) from reviews where status = 'approved' and deleted_at is null),
    'avg_rating',      (select round(avg(rating)::numeric,2) from reviews
                          where status='approved' and deleted_at is null),
    'contact_clicks',  (select count(*) from analytics_events
                          where event_name in ('contact_whatsapp_click','contact_phone_click','contact_site_click')
                            and created_at::date between p_from and p_to),
    'university_views',(select count(*) from analytics_events
                          where event_name = 'university_view' and created_at::date between p_from and p_to),
    'avg_ent_score',   (select round(avg(ent_score)::numeric,1) from profiles where ent_score is not null)
  ) end;
$$;

revoke all on function public.admin_dashboard(date,date) from anon;
grant execute on function public.admin_dashboard(date,date) to authenticated;

-- ─────────── migrations/0009_rls.sql ───────────
-- 0009 — Row Level Security. RLS включён на всех таблицах без исключения.
alter table public.cities              enable row level security;
alter table public.ent_subjects        enable row level security;
alter table public.specialties         enable row level security;
alter table public.universities        enable row level security;
alter table public.university_images   enable row level security;
alter table public.admission_blocks    enable row level security;
alter table public.university_majors   enable row level security;
alter table public.major_score_history enable row level security;
alter table public.profiles            enable row level security;
alter table public.reviews             enable row level security;
alter table public.review_votes        enable row level security;
alter table public.review_reports      enable row level security;
alter table public.favorites           enable row level security;
alter table public.favorite_majors     enable row level security;
alter table public.faq                 enable row level security;
alter table public.static_pages        enable row level security;
alter table public.app_settings        enable row level security;
alter table public.analytics_events    enable row level security;
alter table public.audit_log           enable row level security;

-- ── Публичное чтение ──────────────────────────────────────────────────
drop policy if exists "public read" on public.cities;
create policy "public read" on public.cities for select using (is_active);

drop policy if exists "public read" on public.ent_subjects;
create policy "public read" on public.ent_subjects for select using (is_active);

drop policy if exists "public read" on public.specialties;
create policy "public read" on public.specialties for select using (is_active);

drop policy if exists "public read" on public.universities;
create policy "public read" on public.universities for select using (is_published and deleted_at is null);

drop policy if exists "public read" on public.faq;
create policy "public read" on public.faq for select using (is_published);

drop policy if exists "public read" on public.static_pages;
create policy "public read" on public.static_pages for select using (is_published);

drop policy if exists "public read" on public.app_settings;
create policy "public read" on public.app_settings for select using (true);

drop policy if exists "public read" on public.university_images;
create policy "public read" on public.university_images for select using (
  exists (select 1 from public.universities u
          where u.id = university_id and u.is_published and u.deleted_at is null));

drop policy if exists "public read" on public.admission_blocks;
create policy "public read" on public.admission_blocks for select using (
  is_published and exists (select 1 from public.universities u
          where u.id = university_id and u.is_published and u.deleted_at is null));

drop policy if exists "public read" on public.university_majors;
create policy "public read" on public.university_majors for select using (
  is_published and deleted_at is null and exists (select 1 from public.universities u
          where u.id = university_id and u.is_published and u.deleted_at is null));

drop policy if exists "public read" on public.major_score_history;
create policy "public read" on public.major_score_history for select using (
  exists (select 1 from public.university_majors m
          where m.id = university_major_id and m.is_published and m.deleted_at is null));

-- ── Суперадмин: полный доступ ко всем справочникам и контенту ─────────
do $$ declare t text;
begin
  foreach t in array array['cities','ent_subjects','specialties','universities',
                           'university_images','admission_blocks','university_majors',
                           'major_score_history','faq','static_pages','app_settings']
  loop
    execute format('drop policy if exists "superadmin all" on public.%1$s', t);
    execute format(
      'create policy "superadmin all" on public.%1$s for all
       using (public.is_superadmin()) with check (public.is_superadmin())', t);
  end loop;
end $$;

-- ── Профили ───────────────────────────────────────────────────────────
drop policy if exists "own profile read" on public.profiles;
create policy "own profile read" on public.profiles for select
  using (id = auth.uid() or public.is_superadmin());

drop policy if exists "own profile update" on public.profiles;
create policy "own profile update" on public.profiles for update
  using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists "superadmin all" on public.profiles;
create policy "superadmin all" on public.profiles for all
  using (public.is_superadmin()) with check (public.is_superadmin());

-- Пользователь не может поднять себе роль: поля role/university_id/is_blocked
-- меняются только сервисным ключом из Server Action.
create or replace function public.guard_profile_fields() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is not null and auth.uid() = new.id and not public.is_superadmin() then
    new.role          := old.role;
    new.university_id := old.university_id;
    new.is_blocked    := old.is_blocked;
  end if;
  return new;
end $$;

drop trigger if exists trg_profiles_guard on public.profiles;
create trigger trg_profiles_guard before update on public.profiles
for each row execute function public.guard_profile_fields();

-- ── Отзывы ────────────────────────────────────────────────────────────
drop policy if exists "read approved or own" on public.reviews;
create policy "read approved or own" on public.reviews for select
  using ((status = 'approved' and deleted_at is null) or user_id = auth.uid() or public.is_superadmin());

drop policy if exists "create own" on public.reviews;
create policy "create own" on public.reviews for insert to authenticated
  with check (user_id = auth.uid() and status = 'pending');

drop policy if exists "update own pending" on public.reviews;
create policy "update own pending" on public.reviews for update to authenticated
  using (user_id = auth.uid() and status in ('pending','rejected'))
  with check (user_id = auth.uid() and status = 'pending');

drop policy if exists "delete own" on public.reviews;
create policy "delete own" on public.reviews for delete to authenticated
  using (user_id = auth.uid());

drop policy if exists "superadmin all" on public.reviews;
create policy "superadmin all" on public.reviews for all
  using (public.is_superadmin()) with check (public.is_superadmin());

-- ── Голоса и жалобы ───────────────────────────────────────────────────
drop policy if exists "read all" on public.review_votes;
create policy "read all" on public.review_votes for select using (true);

drop policy if exists "own vote" on public.review_votes;
create policy "own vote" on public.review_votes for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "create report" on public.review_reports;
create policy "create report" on public.review_reports for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists "superadmin all" on public.review_reports;
create policy "superadmin all" on public.review_reports for all
  using (public.is_superadmin()) with check (public.is_superadmin());

-- ── Избранное ─────────────────────────────────────────────────────────
drop policy if exists "own favorites" on public.favorites;
create policy "own favorites" on public.favorites for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "own favorite majors" on public.favorite_majors;
create policy "own favorite majors" on public.favorite_majors for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ── Аналитика ─────────────────────────────────────────────────────────
drop policy if exists "anyone can insert" on public.analytics_events;
create policy "anyone can insert" on public.analytics_events for insert
  to anon, authenticated with check (true);

drop policy if exists "superadmin read" on public.analytics_events;
create policy "superadmin read" on public.analytics_events for select
  using (public.is_superadmin());

-- ── Аудит ─────────────────────────────────────────────────────────────
drop policy if exists "superadmin read" on public.audit_log;
create policy "superadmin read" on public.audit_log for select using (public.is_superadmin());

-- ─────────── migrations/0010_storage.sql ───────────
-- 0010 — бакеты хранилища и политики (раздел 4.11)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('university-media', 'university-media', true, 5242880,
   array['image/jpeg','image/png','image/webp']),
  ('avatars', 'avatars', true, 5242880,
   array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;

drop policy if exists "media public read" on storage.objects;
create policy "media public read" on storage.objects for select
  using (bucket_id in ('university-media', 'avatars'));

drop policy if exists "media superadmin write" on storage.objects;
create policy "media superadmin write" on storage.objects for all to authenticated
  using (bucket_id = 'university-media' and public.is_superadmin())
  with check (bucket_id = 'university-media' and public.is_superadmin());

-- Аватар: путь {user_id}/avatar.webp — писать может только владелец
drop policy if exists "avatar owner write" on storage.objects;
create policy "avatar owner write" on storage.objects for all to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

-- ─────────── seed.sql ───────────
-- ============================================================
-- UnikTap · стартовые данные. Скрипт повторно запускаемый.
-- ============================================================

-- ── Города ────────────────────────────────────────────────────────────
insert into public.cities (slug, name_ru, name_kk, region_ru, region_kk, lat, lng, sort_order) values
  ('almaty',      'Алматы',           'Алматы',      'Алматы',                        'Алматы',                     43.2380, 76.8829, 1),
  ('astana',      'Астана',           'Астана',      'Астана',                        'Астана',                     51.1694, 71.4491, 2),
  ('shymkent',    'Шымкент',          'Шымкент',     'Шымкент',                       'Шымкент',                    42.3417, 69.5901, 3),
  ('karaganda',   'Караганда',        'Қарағанды',   'Карагандинская область',        'Қарағанды облысы',           49.8047, 73.1094, 4),
  ('aktobe',      'Актобе',           'Ақтөбе',      'Актюбинская область',           'Ақтөбе облысы',              50.2839, 57.1670, 5),
  ('taraz',       'Тараз',            'Тараз',       'Жамбылская область',            'Жамбыл облысы',              42.9000, 71.3667, 6),
  ('pavlodar',    'Павлодар',         'Павлодар',    'Павлодарская область',          'Павлодар облысы',            52.2871, 76.9674, 7),
  ('oskemen',     'Усть-Каменогорск', 'Өскемен',     'Абайская область',              'Абай облысы',                49.9787, 82.6014, 8),
  ('semey',       'Семей',            'Семей',       'Абайская область',              'Абай облысы',                50.4111, 80.2275, 9),
  ('atyrau',      'Атырау',           'Атырау',      'Атырауская область',            'Атырау облысы',              47.0945, 51.9238, 10),
  ('kostanay',    'Костанай',         'Қостанай',    'Костанайская область',          'Қостанай облысы',            53.2144, 63.6246, 11),
  ('kyzylorda',   'Кызылорда',        'Қызылорда',   'Кызылординская область',        'Қызылорда облысы',           44.8479, 65.5093, 12),
  ('oral',        'Уральск',          'Орал',        'Западно-Казахстанская область', 'Батыс Қазақстан облысы',     51.2333, 51.3667, 13),
  ('petropavl',   'Петропавловск',    'Петропавл',   'Северо-Казахстанская область',  'Солтүстік Қазақстан облысы', 54.8667, 69.1500, 14),
  ('aktau',       'Актау',            'Ақтау',       'Мангистауская область',         'Маңғыстау облысы',           43.6410, 51.1980, 15),
  ('turkistan',   'Туркестан',        'Түркістан',   'Туркестанская область',         'Түркістан облысы',           43.2973, 68.2517, 16),
  ('taldykorgan', 'Талдыкорган',      'Талдықорған', 'Жетысуская область',            'Жетісу облысы',              45.0156, 78.3739, 17),
  ('kokshetau',   'Кокшетау',         'Көкшетау',    'Акмолинская область',           'Ақмола облысы',              53.2833, 69.3833, 18)
on conflict (slug) do nothing;

-- ── Профильные предметы ЕНТ ───────────────────────────────────────────
insert into public.ent_subjects (code, name_ru, name_kk) values
  ('math',        'Математика',         'Математика'),
  ('physics',     'Физика',             'Физика'),
  ('chemistry',   'Химия',              'Химия'),
  ('biology',     'Биология',           'Биология'),
  ('geography',   'География',          'География'),
  ('world_hist',  'Всемирная история',  'Дүниежүзі тарихы'),
  ('english',     'Английский язык',    'Ағылшын тілі'),
  ('russian',     'Русский язык',       'Орыс тілі'),
  ('kazakh',      'Казахский язык',     'Қазақ тілі'),
  ('literature',  'Литература',         'Әдебиет'),
  ('informatics', 'Информатика',        'Информатика'),
  ('law',         'Основы права',       'Құқық негіздері'),
  ('creative',    'Творческий экзамен', 'Шығармашылық емтихан')
on conflict (code) do nothing;

-- ── Справочник образовательных программ ───────────────────────────────
insert into public.specialties (code, group_code, name_ru, name_kk, direction_ru, direction_kk, subject_1_id, subject_2_id)
select v.code, v.gc, v.nru, v.nkk, v.dru, v.dkk, s1.id, s2.id
from (values
  ('B001','B00','Дошкольное обучение и воспитание','Мектепке дейінгі оқыту','Педагогические науки','Педагогикалық ғылымдар','biology','geography'),
  ('B003','B00','Педагогика и психология','Педагогика және психология','Педагогические науки','Педагогикалық ғылымдар','biology','geography'),
  ('B009','B01','Подготовка учителей математики','Математика мұғалімдерін даярлау','Педагогические науки','Педагогикалық ғылымдар','math','physics'),
  ('B010','B01','Подготовка учителей физики','Физика мұғалімдерін даярлау','Педагогические науки','Педагогикалық ғылымдар','math','physics'),
  ('B011','B01','Подготовка учителей информатики','Информатика мұғалімдерін даярлау','Педагогические науки','Педагогикалық ғылымдар','math','informatics'),
  ('B012','B01','Подготовка учителей химии','Химия мұғалімдерін даярлау','Педагогические науки','Педагогикалық ғылымдар','chemistry','biology'),
  ('B017','B02','Учитель казахского языка и литературы','Қазақ тілі мен әдебиеті мұғалімі','Педагогические науки','Педагогикалық ғылымдар','kazakh','literature'),
  ('B018','B02','Учитель русского языка и литературы','Орыс тілі мен әдебиеті мұғалімі','Педагогические науки','Педагогикалық ғылымдар','russian','literature'),
  ('B019','B02','Учитель иностранного языка','Шетел тілі мұғалімі','Педагогические науки','Педагогикалық ғылымдар','english','world_hist'),
  ('B031','B03','Философия и этика','Философия және этика','Гуманитарные науки','Гуманитарлық ғылымдар','world_hist','law'),
  ('B034','B03','История','Тарих','Гуманитарные науки','Гуманитарлық ғылымдар','world_hist','geography'),
  ('B036','B03','Переводческое дело','Аударма ісі','Гуманитарные науки','Гуманитарлық ғылымдар','english','world_hist'),
  ('B037','B03','Филология','Филология','Гуманитарные науки','Гуманитарлық ғылымдар','kazakh','literature'),
  ('B041','B04','Журналистика и репортёрское дело','Журналистика','Социальные науки','Әлеуметтік ғылымдар','world_hist','literature'),
  ('B042','B04','Психология','Психология','Социальные науки','Әлеуметтік ғылымдар','biology','geography'),
  ('B043','B04','Социология','Социология','Социальные науки','Әлеуметтік ғылымдар','world_hist','geography'),
  ('B044','B04','Менеджмент и управление','Менеджмент және басқару','Бизнес и управление','Бизнес және басқару','math','geography'),
  ('B045','B04','Аудит и налогообложение','Аудит және салық салу','Бизнес и управление','Бизнес және басқару','math','geography'),
  ('B046','B04','Финансы, экономика, банковское дело','Қаржы, экономика, банк ісі','Бизнес и управление','Бизнес және басқару','math','geography'),
  ('B047','B04','Маркетинг и реклама','Маркетинг және жарнама','Бизнес и управление','Бизнес және басқару','math','geography'),
  ('B048','B04','Учёт и налогообложение','Есеп және салық салу','Бизнес и управление','Бизнес және басқару','math','geography'),
  ('B049','B04','Право','Құқық','Юридические науки','Заң ғылымдары','world_hist','law'),
  ('B050','B04','Международное право','Халықаралық құқық','Юридические науки','Заң ғылымдары','world_hist','law'),
  ('B051','B05','Биологические и смежные науки','Биология және сабақтас ғылымдар','Естественные науки','Жаратылыстану ғылымдары','biology','chemistry'),
  ('B052','B05','Химия','Химия','Естественные науки','Жаратылыстану ғылымдары','chemistry','biology'),
  ('B053','B05','Науки о Земле','Жер туралы ғылымдар','Естественные науки','Жаратылыстану ғылымдары','geography','math'),
  ('B054','B05','Физика','Физика','Естественные науки','Жаратылыстану ғылымдары','math','physics'),
  ('B055','B05','Математика и статистика','Математика және статистика','Естественные науки','Жаратылыстану ғылымдары','math','physics')
) as v(code, gc, nru, nkk, dru, dkk, c1, c2)
left join public.ent_subjects s1 on s1.code = v.c1
left join public.ent_subjects s2 on s2.code = v.c2
on conflict (code) do nothing;

insert into public.specialties (code, group_code, name_ru, name_kk, direction_ru, direction_kk, subject_1_id, subject_2_id)
select v.code, v.gc, v.nru, v.nkk, v.dru, v.dkk, s1.id, s2.id
from (values
  ('B057','B05','Информационные технологии','Ақпараттық технологиялар','Информационно-коммуникационные технологии','Ақпараттық-коммуникациялық технологиялар','math','physics'),
  ('B058','B05','Информационная безопасность','Ақпараттық қауіпсіздік','Информационно-коммуникационные технологии','Ақпараттық-коммуникациялық технологиялар','math','physics'),
  ('B059','B05','Коммуникации и коммуникационные технологии','Байланыс және коммуникациялық технологиялар','Информационно-коммуникационные технологии','Ақпараттық-коммуникациялық технологиялар','math','physics'),
  ('B060','B06','Химическая инженерия и процессы','Химиялық инженерия','Инженерные науки','Инженерлік ғылымдар','math','chemistry'),
  ('B061','B06','Материаловедение и технология новых материалов','Материалтану','Инженерные науки','Инженерлік ғылымдар','math','physics'),
  ('B062','B06','Электротехника и энергетика','Электротехника және энергетика','Инженерные науки','Инженерлік ғылымдар','math','physics'),
  ('B063','B06','Электротехника и автоматизация','Электротехника және автоматтандыру','Инженерные науки','Инженерлік ғылымдар','math','physics'),
  ('B064','B06','Механика и металлообработка','Механика және металл өңдеу','Инженерные науки','Инженерлік ғылымдар','math','physics'),
  ('B065','B06','Автотранспортные средства','Автокөлік құралдары','Инженерные науки','Инженерлік ғылымдар','math','physics'),
  ('B070','B07','Горное дело и добыча полезных ископаемых','Тау-кен ісі','Инженерные науки','Инженерлік ғылымдар','math','physics'),
  ('B071','B07','Нефтегазовое дело','Мұнай-газ ісі','Инженерные науки','Инженерлік ғылымдар','math','physics'),
  ('B072','B07','Технология фармацевтического производства','Фармацевтика өндірісінің технологиясы','Инженерные науки','Инженерлік ғылымдар','chemistry','biology'),
  ('B073','B07','Пищевая технология','Тағам технологиясы','Инженерные науки','Инженерлік ғылымдар','chemistry','biology'),
  ('B074','B07','Градостроительство и строительные работы','Қала құрылысы және құрылыс жұмыстары','Инженерные науки','Инженерлік ғылымдар','math','physics'),
  ('B075','B07','Кадастр и землеустройство','Кадастр және жерге орналастыру','Инженерные науки','Инженерлік ғылымдар','math','geography'),
  ('B076','B07','Стандартизация, сертификация и метрология','Стандарттау, сертификаттау және метрология','Инженерные науки','Инженерлік ғылымдар','math','physics'),
  ('B077','B07','Транспортные услуги','Көлік қызметтері','Инженерные науки','Инженерлік ғылымдар','math','geography'),
  ('B080','B08','Растениеводство','Өсімдік шаруашылығы','Сельское хозяйство','Ауыл шаруашылығы','biology','chemistry'),
  ('B081','B08','Животноводство','Мал шаруашылығы','Сельское хозяйство','Ауыл шаруашылығы','biology','chemistry'),
  ('B084','B08','Медицина','Медицина','Здравоохранение','Денсаулық сақтау','chemistry','biology'),
  ('B085','B08','Стоматология','Стоматология','Здравоохранение','Денсаулық сақтау','chemistry','biology'),
  ('B086','B08','Ветеринария','Ветеринария','Сельское хозяйство','Ауыл шаруашылығы','biology','chemistry'),
  ('B087','B08','Сестринское дело','Мейіргер ісі','Здравоохранение','Денсаулық сақтау','chemistry','biology'),
  ('B088','B08','Фармация','Фармация','Здравоохранение','Денсаулық сақтау','chemistry','biology'),
  ('B090','B09','Гостиничный бизнес','Қонақ үй бизнесі','Услуги','Қызмет көрсету','geography','english'),
  ('B091','B09','Туризм','Туризм','Услуги','Қызмет көрсету','geography','english'),
  ('B092','B09','Ресторанное дело','Мейрамхана ісі','Услуги','Қызмет көрсету','geography','chemistry'),
  ('B094','B09','Физическая культура и спорт','Дене шынықтыру және спорт','Услуги','Қызмет көрсету','creative','biology')
) as v(code, gc, nru, nkk, dru, dkk, c1, c2)
left join public.ent_subjects s1 on s1.code = v.c1
left join public.ent_subjects s2 on s2.code = v.c2
on conflict (code) do nothing;

-- ── Настройки платформы ───────────────────────────────────────────────
insert into public.app_settings (key, value, description) values
  ('ent_max_score', '140'::jsonb, 'Максимальный балл ЕНТ'),
  ('ent_thresholds', '{"default":50,"national":65,"medical":70,"pedagogical":75,"legal":75,"agriculture":50,"college_short":25}'::jsonb, 'Пороговые баллы по категориям, пересматриваются ежегодно'),
  ('ent_structure', '{"history":20,"reading":10,"math_literacy":10,"subject_1":40,"subject_2":40}'::jsonb, 'Разбалловка теста'),
  ('chance_bands', '{"high":5,"medium":-5}'::jsonb, 'Границы шансов на грант'),
  ('review_auto_publish', 'false'::jsonb, 'Публиковать отзывы без модерации'),
  ('min_reviews_for_rating', '3'::jsonb, 'Сколько отзывов нужно, чтобы показывать числовой рейтинг'),
  ('auth_phone_enabled', 'false'::jsonb, 'Показывать вход по номеру телефона'),
  ('contact_email', '"info@example.kz"'::jsonb, 'Контактная почта платформы'),
  ('announcement', '{"enabled":false,"text_ru":"","text_kk":"","link":""}'::jsonb, 'Баннер-объявление на главной'),
  ('disclaimer', '{"ru":"Расчёт носит справочный характер и основан на проходных баллах прошлых лет. Фактические проходные баллы определяются по итогам конкурса текущего года.","kk":"Есептеу анықтамалық сипатта және өткен жылдардың өту балдарына негізделген. Нақты өту балдары ағымдағы жыл конкурсының қорытындысы бойынша анықталады."}'::jsonb, 'Дисклеймер калькулятора')
on conflict (key) do nothing;

-- ── Статические страницы ──────────────────────────────────────────────
insert into public.static_pages (slug, title_ru, title_kk, content_ru, content_kk) values
  ('about', 'О проекте', 'Жоба туралы',
   E'## UnikTap\n\nПлатформа помогает абитуриентам Казахстана выбрать университет: проходные баллы, стоимость обучения, отзывы студентов и контакты приёмных комиссий в одном месте.\n\nДанные вносит и проверяет редакция платформы. Если вы нашли ошибку — напишите нам.',
   E'## UnikTap\n\nПлатформа Қазақстан талапкерлеріне университет таңдауға көмектеседі.'),
  ('privacy', 'Политика конфиденциальности', 'Құпиялылық саясаты',
   E'## Политика конфиденциальности\n\n**Текст-заглушка.** Замените на согласованный с юристом документ перед запуском.\n\nМы храним: email или номер телефона, имя, город, балл ЕНТ, избранное и отзывы. Аналитика обезличена: IP и user-agent не сохраняются.',
   E'## Құпиялылық саясаты\n\n**Уақытша мәтін.**'),
  ('terms', 'Условия использования', 'Пайдалану шарттары',
   E'## Условия использования\n\n**Текст-заглушка.** Замените перед запуском.\n\nИнформация о проходных баллах носит справочный характер. Отзывы отражают мнение авторов, а не позицию платформы.',
   E'## Пайдалану шарттары\n\n**Уақытша мәтін.**'),
  ('contacts', 'Контакты', 'Байланыс',
   E'## Контакты\n\nПочта: info@example.kz\n\nПо вопросам добавления университета или исправления данных пишите на почту.',
   E'## Байланыс\n\nПошта: info@example.kz')
on conflict (slug) do nothing;

-- ── FAQ ───────────────────────────────────────────────────────────────
insert into public.faq (category, question_ru, question_kk, answer_ru, answer_kk, sort_order)
select v.category, v.question_ru, v.question_kk, v.answer_ru, v.answer_kk, v.sort_order
from (values
  ('ent', 'Что такое пороговый балл?', 'Шекті балл дегеніміз не?',
   'Минимальный балл ЕНТ, с которым вас вообще могут зачислить в университет. Для педагогических и юридических специальностей — 75, для медицинских — 70, для национальных вузов — 65, для остальных — 50.',
   'Университетке қабылдануға болатын ең төменгі ЕНТ балы.', 1),
  ('ent', 'Сколько раз можно сдавать ЕНТ?', 'ЕНТ-ны неше рет тапсыруға болады?',
   'Основной этап (май–июль) можно сдавать дважды, засчитывается лучший результат. Январский, мартовский и августовский этапы идут только на платное обучение.',
   'Негізгі кезеңді екі рет тапсыруға болады, үздік нәтиже есептеледі.', 2),
  ('grant', 'Что показывает калькулятор?', 'Калькулятор нені көрсетеді?',
   'Сравнение вашего балла с проходными баллами прошлых лет. Это ориентир, а не гарантия: фактический проходной балл определяется по итогам конкурса текущего года.',
   'Сіздің балыңызды өткен жылдардың өту балдарымен салыстыру.', 3),
  ('reviews', 'Кто может оставить отзыв?', 'Кім пікір қалдыра алады?',
   'Любой зарегистрированный пользователь — один отзыв на университет. Все отзывы проходят модерацию, обычно до 24 часов.',
   'Кез келген тіркелген пайдаланушы — университетке бір пікір.', 4),
  ('general', 'Как добавить университет на платформу?', 'Университетті қалай қосуға болады?',
   'Напишите на info@example.kz — редакция добавит карточку и свяжется с приёмной комиссией для проверки данных.',
   'info@example.kz мекенжайына жазыңыз.', 5)
) as v(category, question_ru, question_kk, answer_ru, answer_kk, sort_order)
where not exists (select 1 from public.faq f where f.question_ru = v.question_ru);

-- ── Демонстрационные университеты ─────────────────────────────────────
insert into public.universities (
  id, slug, name_ru, name_kk, short_name, abbr, city_id, address_ru, lat, lng,
  phones, whatsapp, email, website, admission_url, socials, working_hours_ru,
  description_ru, history_ru, admission_intro_ru,
  type, founded_year, students_count, teachers_count,
  has_military_department, has_dormitory, dormitory_info_ru, license_number, accreditation_ru,
  logo_url, cover_url, is_published, is_featured, sort_order, seo_title_ru, seo_description_ru
) values
(
  '11111111-1111-1111-1111-111111111111', 'satbayev-university',
  'Казахский национальный исследовательский технический университет им. К. И. Сатпаева',
  'Қ. И. Сәтбаев атындағы Қазақ ұлттық техникалық зерттеу университеті',
  'Satbayev University', 'КазНИТУ',
  (select id from public.cities where slug = 'almaty'),
  'г. Алматы, ул. Сатпаева, 22', 43.2389, 76.9296,
  array['+7 (727) 292-60-25','+7 (727) 257-70-01'], '77007770101', 'priem@satbayev.university',
  'https://satbayev.university', 'https://satbayev.university/ru/admission',
  '{"instagram":"https://instagram.com/satbayev_university","telegram":"https://t.me/satbayev","youtube":"https://youtube.com/@satbayevuniversity"}'::jsonb,
  'Пн–Пт 09:00–18:00, Сб 10:00–14:00',
  'Первый и старейший технический университет Казахстана. Флагман инженерного образования: горное дело, нефть и газ, IT, материаловедение.',
  E'Университет основан в 1934 году как Казахский горно-металлургический институт — первый технический вуз республики.\n\nВ 1960 году институт получил статус политехнического, а в 1994 году был преобразован в Казахский национальный технический университет. Имя академика Каныша Имантаевича Сатпаева, первого президента Академии наук Казахстана, вуз носит с 1999 года.\n\nСегодня Satbayev University — исследовательский университет с собственными лабораториями, технопарком и конструкторским бюро. Выпускники составляют инженерный костяк горнодобывающей и нефтегазовой отраслей страны.',
  'Приём документов идёт через портал приёмной комиссии. Ниже — порядок действий и список документов на 2026 год.',
  'national', 1934, 12000, 900,
  true, true, 'Пять общежитий на 3 200 мест. Приоритет — иногородним первокурсникам и обладателям грантов.',
  'KZ58LAA00012345', 'Институциональная аккредитация IAAR до 2029 года',
  'https://images.unsplash.com/photo-1592280771190-3e2e4d571952?auto=format&fit=crop&w=200&q=80',
  'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=1200&q=80',
  true, true, 1,
  'Satbayev University — проходные баллы, стоимость обучения, отзывы',
  'Полная информация о КазНИТУ им. Сатпаева: специальности, проходные баллы на грант, стоимость обучения, отзывы студентов и контакты приёмной комиссии.'
),
(
  '22222222-2222-2222-2222-222222222222', 'nazarbayev-university',
  'Назарбаев Университет', 'Назарбаев Университеті',
  'Nazarbayev University', 'NU',
  (select id from public.cities where slug = 'astana'),
  'г. Астана, пр. Кабанбай батыра, 53', 51.0904, 71.3963,
  array['+7 (7172) 70-66-88'], '77172706688', 'admissions@nu.edu.kz',
  'https://nu.edu.kz', 'https://admissions.nu.edu.kz',
  '{"instagram":"https://instagram.com/nazarbayev.university","youtube":"https://youtube.com/@nazarbayevuniversity","linkedin":"https://linkedin.com/school/nazarbayev-university"}'::jsonb,
  'Пн–Пт 09:00–18:00',
  'Ведущий исследовательский университет Казахстана. Обучение на английском языке по международным стандартам, партнёрство с ведущими университетами мира.',
  E'Университет основан в 2010 году в Астане как автономная организация образования.\n\nАкадемические программы разработаны совместно с университетами мирового уровня: Duke, Cambridge, Wisconsin-Madison, Singapore National University.\n\nВесь преподавательский состав набирается по международному конкурсу, язык обучения — английский. Университет имеет автономию в вопросах приёма, программ и найма.',
  'Приём в NU идёт отдельно от общего конкурса на грант: нужны результаты SAT/IELTS и собственный отбор университета.',
  'autonomous', 2010, 5500, 600,
  false, true, 'Кампусные резиденции для всех студентов бакалавриата.',
  'KZ11AAA00098765', 'Аккредитация программ ABET и AACSB',
  'https://images.unsplash.com/photo-1607237138185-eedd9c632b0b?auto=format&fit=crop&w=200&q=80',
  'https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=1200&q=80',
  true, true, 2,
  'Назарбаев Университет — поступление, программы, отзывы',
  'Как поступить в Nazarbayev University: требования, программы бакалавриата, стоимость, отзывы студентов и контакты приёмной комиссии.'
),
(
  '33333333-3333-3333-3333-333333333333', 'auezov-university',
  'Южно-Казахстанский университет им. М. Ауэзова', 'М. Әуезов атындағы Оңтүстік Қазақстан университеті',
  'Auezov University', 'ЮКУ',
  (select id from public.cities where slug = 'shymkent'),
  'г. Шымкент, пр. Тауке хана, 5', 42.3175, 69.5901,
  array['+7 (7252) 21-01-41'], '77252210141', 'rector@auezov.edu.kz',
  'https://auezov.edu.kz', 'https://auezov.edu.kz/priem',
  '{"instagram":"https://instagram.com/auezov_university","facebook":"https://facebook.com/auezovuniversity"}'::jsonb,
  'Пн–Пт 09:00–18:00, обед 13:00–14:00',
  'Крупнейший многопрофильный университет на юге Казахстана: инженерия, педагогика, медицина, экономика и сельское хозяйство.',
  E'Университет ведёт историю с 1943 года, когда в Шымкенте был открыт технологический институт строительных материалов.\n\nВ 1996 году на его базе был создан Южно-Казахстанский государственный университет имени Мухтара Ауэзова.\n\nСегодня это многопрофильный вуз с 12 факультетами, где учатся студенты из южных регионов Казахстана и стран Центральной Азии.',
  'Документы принимаются очно в приёмной комиссии и через портал. Иногородним предоставляется общежитие.',
  'state', 1943, 22000, 1400,
  true, true, 'Восемь общежитий на 4 500 мест.',
  'KZ77BBB00054321', 'Институциональная аккредитация НААР до 2028 года',
  'https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=200&q=80',
  'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=1200&q=80',
  true, false, 3,
  'ЮКУ им. М. Ауэзова — специальности и проходные баллы',
  'Южно-Казахстанский университет имени Мухтара Ауэзова в Шымкенте: специальности, проходные баллы, стоимость обучения и отзывы студентов.'
)
on conflict (id) do nothing;

-- ── Специальности демо-ВУЗов ──────────────────────────────────────────
insert into public.university_majors (
  university_id, specialty_id, degree, study_forms, languages, duration_years,
  fee_per_year, grant_score, paid_min_score, grants_count, description_ru, is_published, sort_order)
select u.id, s.id, 'bachelor'::degree_level, v.forms::study_form[], v.langs::text[], v.years,
       v.fee, v.grant_score, v.paid_score, v.grants_total, v.descr, true, v.ord
from (values
  ('satbayev-university','B057','{full_time}','{ru,kk,en}',4.0,1000000,95,60,120,'Программная инженерия, анализ данных, облачные технологии.',1),
  ('satbayev-university','B058','{full_time}','{ru,kk}',4.0,1000000,105,65,40,'Защита информации, криптография, безопасность промышленных систем.',2),
  ('satbayev-university','B061','{full_time,part_time}','{ru,kk}',4.0,900000,75,55,60,'Новые материалы, металлургия, нанотехнологии.',3),
  ('satbayev-university','B070','{full_time}','{ru,kk}',4.0,850000,70,50,150,'Подземная и открытая разработка месторождений.',4),
  ('satbayev-university','B071','{full_time}','{ru,kk,en}',4.0,1100000,88,60,90,'Разработка нефтяных и газовых месторождений, бурение.',5),
  ('nazarbayev-university','B057','{full_time}','{en}',4.0,0,120,110,200,'Computer Science: алгоритмы, ИИ, системы. Обучение на английском.',1),
  ('nazarbayev-university','B063','{full_time}','{en}',4.0,0,125,112,60,'Robotics and Mechatronics.',2),
  ('nazarbayev-university','B046','{full_time}','{en}',4.0,0,115,105,80,'Economics and Finance по программе с Duke University.',3),
  ('nazarbayev-university','B084','{full_time}','{en}',6.0,0,130,120,50,'Medicine — программа School of Medicine.',4),
  ('auezov-university','B044','{full_time,part_time,distance}','{ru,kk}',4.0,550000,85,50,70,'Управление предприятием, HR, операционный менеджмент.',1),
  ('auezov-university','B057','{full_time,part_time}','{ru,kk}',4.0,600000,70,50,110,'Разработка ПО, сети, информационные системы.',2),
  ('auezov-university','B049','{full_time,evening}','{ru,kk}',4.0,650000,92,75,35,'Гражданское, уголовное и международное право.',3),
  ('auezov-university','B073','{full_time}','{ru,kk}',4.0,500000,62,50,80,'Технология переработки пищевого сырья.',4),
  ('auezov-university','B019','{full_time}','{ru,kk,en}',4.0,520000,80,75,90,'Учитель английского языка, методика преподавания.',5)
) as v(uslug, scode, forms, langs, years, fee, grant_score, paid_score, grants_total, descr, ord)
join public.universities u on u.slug = v.uslug
join public.specialties s on s.code = v.scode
on conflict (university_id, specialty_id, degree) do nothing;

-- ── История проходных баллов (3 года) ─────────────────────────────────
insert into public.major_score_history (university_major_id, year, grant_score, paid_min_score, grants_count, applicants_count)
select m.id, y.year,
       greatest(40, m.grant_score - y.delta),
       case when m.paid_min_score is null then null else greatest(30, m.paid_min_score - y.delta) end,
       m.grants_count,
       coalesce(m.grants_count, 50) * 4 + y.delta * 7
from public.university_majors m
cross join (values (2023, 6), (2024, 3), (2025, 1)) as y(year, delta)
where m.grant_score is not null
on conflict (university_major_id, year) do nothing;

insert into public.major_score_history (university_major_id, year, grant_score, paid_min_score, grants_count, applicants_count)
select m.id, 2026, m.grant_score, m.paid_min_score, m.grants_count, coalesce(m.grants_count, 50) * 5
from public.university_majors m
where m.grant_score is not null
on conflict (university_major_id, year) do nothing;

-- ── Блоки «Поступление» ───────────────────────────────────────────────
insert into public.admission_blocks (university_id, kind, title_ru, content_ru, date_from, date_to, sort_order)
select u.id, v.kind::admission_kind, v.title, v.content, v.dfrom::date, v.dto::date, v.ord
from (values
  ('satbayev-university','step','Сдать ЕНТ','Основной этап ЕНТ проходит в мае–июле. Результат действует до 31 декабря текущего года.',null,null,1),
  ('satbayev-university','step','Подать заявление на грант','Заявление подаётся через портал egov или в приёмной комиссии. Можно указать до 4 специальностей.',null,null,2),
  ('satbayev-university','step','Дождаться итогов конкурса','Результаты распределения грантов публикуются на сайте МНВО и в личном кабинете.',null,null,3),
  ('satbayev-university','step','Заключить договор и зачислиться','С оригиналом аттестата и сертификатом ЕНТ приходите в приёмную комиссию для подписания договора.',null,null,4),
  ('satbayev-university','document','Аттестат или диплом (оригинал)','Оригинал документа об образовании с приложением.',null,null,10),
  ('satbayev-university','document','Сертификат ЕНТ','Оригинал сертификата текущего года.',null,null,11),
  ('satbayev-university','document','Удостоверение личности','Копия + оригинал для сверки.',null,null,12),
  ('satbayev-university','document','Медицинская справка 075-У','Оформляется в поликлинике по месту жительства.',null,null,13),
  ('satbayev-university','document','Фото 3×4','6 штук, матовые.',null,null,14),
  ('satbayev-university','condition','Пороговый балл','Для национальных вузов минимум 65 баллов, при этом не менее 5 баллов по истории Казахстана и по каждому профильному предмету.',null,null,20),
  ('satbayev-university','benefit','Льготные квоты','Квоты для сельской молодёжи, детей-сирот, лиц с инвалидностью и обладателей знака «Алтын белгі».',null,null,30),
  ('satbayev-university','deadline','Приём заявлений на грант','Подача заявлений на конкурс образовательных грантов.','2026-06-20','2026-07-18',40),
  ('satbayev-university','deadline','Зачисление','Приказы о зачислении.','2026-08-10','2026-08-25',41),
  ('nazarbayev-university','step','Подать заявку на портале admissions','Регистрация и загрузка документов в системе приёма NU.',null,null,1),
  ('nazarbayev-university','step','Предоставить результаты SAT / IELTS','Минимальные требования публикуются ежегодно на сайте приёмной комиссии.',null,null,2),
  ('nazarbayev-university','step','Пройти отбор и собеседование','Университет проводит собственный конкурс, независимый от общего конкурса на грант.',null,null,3),
  ('nazarbayev-university','document','Аттестат с приложением','Оригинал и нотариально заверенный перевод на английский.',null,null,10),
  ('nazarbayev-university','document','Сертификаты SAT и IELTS','Действующие сертификаты международных экзаменов.',null,null,11),
  ('nazarbayev-university','deadline','Приём заявок','Онлайн-подача заявок на программы бакалавриата.','2026-01-10','2026-03-01',20),
  ('auezov-university','step','Сдать ЕНТ и подать заявление','Приём заявлений ведётся очно и через портал университета.',null,null,1),
  ('auezov-university','step','Выбрать специальности','До 4 специальностей в порядке приоритета.',null,null,2),
  ('auezov-university','document','Аттестат (оригинал)','С приложением оценок.',null,null,10),
  ('auezov-university','document','Сертификат ЕНТ','Оригинал.',null,null,11),
  ('auezov-university','condition','Общежитие','Иногородним студентам общежитие предоставляется по заявлению при зачислении.',null,null,20),
  ('auezov-university','deadline','Приём заявлений','Подача документов в приёмную комиссию.','2026-06-25','2026-07-20',30)
) as v(uslug, kind, title, content, dfrom, dto, ord)
join public.universities u on u.slug = v.uslug
where not exists (
  select 1 from public.admission_blocks b where b.university_id = u.id and b.title_ru = v.title
);

-- ── Галерея ───────────────────────────────────────────────────────────
insert into public.university_images (university_id, url, caption_ru, sort_order)
select u.id, v.url, v.caption, v.ord
from (values
  ('satbayev-university','https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=900&q=80','Главный корпус',1),
  ('satbayev-university','https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=900&q=80','Учебная аудитория',2),
  ('satbayev-university','https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=900&q=80','Кампус',3),
  ('nazarbayev-university','https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=900&q=80','Атриум университета',1),
  ('nazarbayev-university','https://images.unsplash.com/photo-1607237138185-eedd9c632b0b?auto=format&fit=crop&w=900&q=80','Библиотека',2),
  ('auezov-university','https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=900&q=80','Главный корпус',1)
) as v(uslug, url, caption, ord)
join public.universities u on u.slug = v.uslug
where not exists (
  select 1 from public.university_images i where i.university_id = u.id and i.url = v.url
);

-- ── Пересчёт агрегатов после сида ─────────────────────────────────────
update public.universities u set
  majors_count  = (select count(*) from public.university_majors m
                     where m.university_id = u.id and m.is_published and m.deleted_at is null),
  min_ent_score = (select min(m.grant_score) from public.university_majors m
                     where m.university_id = u.id and m.is_published and m.deleted_at is null),
  min_fee       = (select min(nullif(m.fee_per_year, 0)) from public.university_majors m
                     where m.university_id = u.id and m.is_published and m.deleted_at is null);

-- Демо-отзывы добавляются после регистрации первых пользователей:
-- reviews.user_id ссылается на profiles, поэтому синтетические авторы здесь не создаются.
