-- PPT 다운로드 횟수 통계를 추가합니다.
-- Supabase Dashboard > SQL Editor에서 이 파일 전체를 실행하세요.

alter table public.ppt_material_events
drop constraint if exists ppt_material_events_event_type_check;

alter table public.ppt_material_events
add constraint ppt_material_events_event_type_check
check (event_type in ('click', 'duration', 'download'));

notify pgrst, 'reload schema';
