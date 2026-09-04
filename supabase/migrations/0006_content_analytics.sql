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
