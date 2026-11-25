-- 계절의 크리스마스 자료만 이동하며 월별 분류와 파일은 유지합니다.
begin;
insert into public.categories(name, description, card_image_url, category_groups, sort_order)
select '크리스마스', '산타와 루돌프, 세계의 크리스마스 문화를 함께 알아봐요.', '/christmas-category.png', array['subject'], coalesce(max(sort_order), 0) + 1
from public.categories
having not exists (select 1 from public.categories where name = '크리스마스');
update public.ppt_materials m
set category_id = c.id
from public.categories c
where c.name = '크리스마스'
  and m.category_id = '606e194c-a2ba-4d17-a9d1-59566760fba5'
  and m.id in ('e9ffe3b6-7292-4e0e-9529-5e2c7e746931','2579da9e-bcfb-4d20-995e-b1aa5a07a0ef','fe7ae256-c27b-4f11-8008-e6239936a271');
commit;
