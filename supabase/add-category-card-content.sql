-- 주제별 카테고리 박스에 관리자가 등록한 이미지를 저장합니다.
-- Supabase Dashboard > SQL Editor에서 이 파일 전체를 실행하세요.

alter table public.categories
add column if not exists card_image_url text;

comment on column public.categories.description is
'메인 자료실 카테고리 박스에 표시할 안내 문구';

comment on column public.categories.card_image_url is
'메인 자료실 카테고리 박스에 표시할 이미지의 public URL';
