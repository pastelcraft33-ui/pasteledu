-- 유치원관/초등관/시니어관 배너 설정 필드를 추가합니다.
-- Supabase Dashboard > SQL Editor에서 이 파일 전체를 실행하세요.

alter table public.site_settings
add column if not exists kindergarten_banner_title text default '유치원관 수업자료';
alter table public.site_settings
add column if not exists kindergarten_banner_description text default '유아 눈높이에 맞춘 즐거운 수업자료를 확인해보세요.';
alter table public.site_settings
add column if not exists kindergarten_banner_image_url text;

alter table public.site_settings
add column if not exists elementary_banner_title text default '초등관 수업자료';
alter table public.site_settings
add column if not exists elementary_banner_description text default '초등 수업에 바로 활용할 수 있는 자료를 모았습니다.';
alter table public.site_settings
add column if not exists elementary_banner_image_url text;

alter table public.site_settings
add column if not exists senior_banner_title text default '시니어관 수업자료';
alter table public.site_settings
add column if not exists senior_banner_description text default '시니어 학습과 활동을 위한 자료를 만나보세요.';
alter table public.site_settings
add column if not exists senior_banner_image_url text;

update public.site_settings
set
  kindergarten_banner_title = coalesce(kindergarten_banner_title, '유치원관 수업자료'),
  kindergarten_banner_description = coalesce(kindergarten_banner_description, '유아 눈높이에 맞춘 즐거운 수업자료를 확인해보세요.'),
  elementary_banner_title = coalesce(elementary_banner_title, '초등관 수업자료'),
  elementary_banner_description = coalesce(elementary_banner_description, '초등 수업에 바로 활용할 수 있는 자료를 모았습니다.'),
  senior_banner_title = coalesce(senior_banner_title, '시니어관 수업자료'),
  senior_banner_description = coalesce(senior_banner_description, '시니어 학습과 활동을 위한 자료를 만나보세요.');
