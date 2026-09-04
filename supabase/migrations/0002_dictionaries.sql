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
