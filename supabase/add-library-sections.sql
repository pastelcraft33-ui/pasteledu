-- 메인 자료실의 유치원관/초등관/실버관 분류를 추가합니다.
-- Supabase Dashboard > SQL Editor에서 이 파일 전체를 실행하세요.

alter table public.ppt_materials
add column if not exists library_sections text[];

update public.ppt_materials
set library_sections = array['elementary']
where library_sections is null or array_length(library_sections, 1) is null;

alter table public.ppt_materials
alter column library_sections set default array['elementary'];

alter table public.ppt_materials
alter column library_sections set not null;

comment on column public.ppt_materials.library_sections is
'자료 노출 영역: kindergarten, elementary, senior';

alter table public.site_settings
add column if not exists banner_background_color text default '#fce7f3';

alter table public.site_settings
add column if not exists banner_text_color text default '#db3f72';

update public.site_settings
set
  banner_background_color = coalesce(banner_background_color, '#fce7f3'),
  banner_text_color = coalesce(banner_text_color, '#db3f72');

-- 새 컬럼을 PostgREST API가 즉시 인식하도록 스키마 캐시를 갱신합니다.
notify pgrst, 'reload schema';
