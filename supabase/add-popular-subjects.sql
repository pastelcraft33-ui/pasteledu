-- 원본 방문 기록은 공개하지 않고 최근 15일 인기 주제만 반환합니다.
create or replace function public.popular_subjects()
returns table(category_id uuid, category_name text)
language sql stable security definer set search_path = ''
as $$
  with clicks as (
    select e.material_id, count(*) as views
    from public.ppt_material_events e
    where e.event_type = 'click'
      and e.created_at >= ((date_trunc('day', now() at time zone 'Asia/Seoul') - interval '14 days') at time zone 'Asia/Seoul')
      and e.created_at <= now()
    group by e.material_id
  ), subjects as (
    select c.id, c.name, max(clicks.views) as best_views
    from clicks
    join public.ppt_materials m on m.id = clicks.material_id
    join public.categories c on c.id = m.category_id or c.id = m.secondary_category_id
    where c.category_groups is null or cardinality(c.category_groups) = 0 or 'subject' = any(c.category_groups)
    group by c.id, c.name
  )
  select id, name from subjects order by best_views desc, name, id limit 10;
$$;
revoke all on function public.popular_subjects() from public;
grant execute on function public.popular_subjects() to anon, authenticated;
