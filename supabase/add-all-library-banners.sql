-- 월별/주제별 배너 이미지 컬럼을 추가합니다.
-- Supabase Dashboard > SQL Editor에서 이 파일 전체를 실행하세요.

alter table public.site_settings
add column if not exists month_banner_image_url text;

alter table public.site_settings
add column if not exists subject_banner_image_url text;







