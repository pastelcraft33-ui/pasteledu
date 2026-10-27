-- Supabase SQL Editor에서 전체 내용을 한 번 실행하세요.
-- 기존 자료와 관별 배너를 유지하고 메인 배너 저장 항목만 추가합니다.
alter table public.site_settings
add column if not exists home_banners jsonb not null default '[
  {"id":"culture","image_url":"/home-banner-culture.jpeg","alt":"다양한 문화 넓어지는 우리","link_url":"","enabled":true}
]'::jsonb;

notify pgrst, 'reload schema';
