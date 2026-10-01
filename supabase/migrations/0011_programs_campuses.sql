-- 0011 — образовательные программы вуза, факультеты и корпуса
--
-- specialties — это группы ОП (B001…): от группы берутся профильные предметы ЕНТ.
-- Внутри одной группы у вуза бывает несколько программ со своими кодами (6B01101…)
-- и названиями, поэтому код и название программы хранятся в university_majors.
-- Пустые program_code/program_name — старые записи: для них показывается название группы.

alter table public.university_majors
  add column if not exists program_code    text not null default '',
  add column if not exists program_name_ru text not null default '',
  add column if not exists program_name_kk text not null default '';

-- Стоимость может быть неизвестна: 0 значит «бесплатно», поэтому нужен null
alter table public.university_majors alter column fee_per_year drop not null;

alter table public.university_majors
  drop constraint if exists university_majors_university_id_specialty_id_degree_key;

create unique index if not exists university_majors_program_key
  on public.university_majors (university_id, specialty_id, degree, program_code, program_name_ru);

-- faculties: [{ name_ru, name_kk }]
-- campuses:  [{ title_ru, title_kk, address_ru, address_kk, twogis_url }]
alter table public.universities
  add column if not exists faculties jsonb not null default '[]',
  add column if not exists campuses  jsonb not null default '[]';
