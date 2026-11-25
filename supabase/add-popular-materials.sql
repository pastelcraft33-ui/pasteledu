create or replace function public.popular_materials()
returns table(material_id uuid, views bigint)
language sql stable security definer set search_path = ''
as $$
select m.id, count(e.id) from public.ppt_materials m
left join public.ppt_material_events e on e.material_id = m.id
and e.event_type = 'click'
and e.created_at >= ((date_trunc('day', now() at time zone 'Asia/Seoul') - interval '14 days') at time zone 'Asia/Seoul')
and e.created_at <= now()
group by m.id order by count(e.id) desc, m.created_at desc, m.id;
$$;
revoke all on function public.popular_materials() from public;
grant execute on function public.popular_materials() to anon, authenticated;
