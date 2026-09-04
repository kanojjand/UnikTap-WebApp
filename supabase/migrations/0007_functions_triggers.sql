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
