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
