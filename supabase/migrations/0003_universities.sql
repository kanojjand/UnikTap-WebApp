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
