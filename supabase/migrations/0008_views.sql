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
