-- 한 PPT 자료에 여러 활동지 파일을 연결하기 위한 컬럼입니다.
-- Supabase Dashboard > SQL Editor에서 이 파일 전체를 실행해주세요.

alter table public.ppt_materials
add column if not exists worksheet_urls text[] not null default '{}';

alter table public.ppt_materials
add column if not exists worksheet_file_names text[] not null default '{}';

-- 기존 단일 활동지 데이터를 배열 컬럼으로 옮깁니다.
update public.ppt_materials
set
  worksheet_urls = array[worksheet_url],
  worksheet_file_names = array[coalesce(worksheet_file_name, '활동지 1')]
where worksheet_url is not null
  and coalesce(array_length(worksheet_urls, 1), 0) = 0;

comment on column public.ppt_materials.worksheet_urls is '자료에 연결된 활동지 공개 URL 목록';
comment on column public.ppt_materials.worksheet_file_names is '활동지 원본 파일명 목록';
