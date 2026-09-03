create extension if not exists pgcrypto;

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  card_image_url text,
  column_color text,
  category_groups text[] not null default array['subject'],
  sort_order integer default 0,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create table if not exists public.ppt_materials (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.categories(id) on delete set null,
  secondary_category_id uuid references public.categories(id) on delete set null,
  title text not null,
  description text,
  tags text[] default '{}',
  age_groups text[] not null default '{}',
  library_sections text[] not null default array['elementary'],
  thumbnail_url text,
  file_url text,
  file_name text,
  worksheet_url text,
  worksheet_file_name text,
  worksheet_urls text[] not null default '{}',
  worksheet_file_names text[] not null default '{}',
  worksheet_preview_urls text[] not null default '{}',
  worksheet_page_counts integer[] not null default '{}',
  is_downloadable boolean default true,
  sort_order integer default 0,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create table if not exists public.ppt_material_events (
  id uuid primary key default gen_random_uuid(),
  material_id uuid references public.ppt_materials(id) on delete cascade,
  event_type text not null check (event_type in ('click', 'duration', 'download')),
  duration_seconds integer,
  user_agent text,
  created_at timestamp with time zone default now()
);

-- 기존 프로젝트에서 다운로드 통계를 사용할 수 있도록 이벤트 제약조건을 갱신합니다.
alter table public.ppt_material_events
drop constraint if exists ppt_material_events_event_type_check;

alter table public.ppt_material_events
add constraint ppt_material_events_event_type_check
check (event_type in ('click', 'duration', 'download'));

create index if not exists ppt_material_events_material_id_idx
on public.ppt_material_events (material_id);

create index if not exists ppt_material_events_created_at_idx
on public.ppt_material_events (created_at desc);

alter table public.categories
add column if not exists category_groups text[] not null default array['subject'];

alter table public.categories
add column if not exists card_image_url text;

alter table public.ppt_materials
add column if not exists secondary_category_id uuid references public.categories(id) on delete set null;

alter table public.ppt_materials
add column if not exists age_groups text[];

alter table public.ppt_materials
add column if not exists library_sections text[];

alter table public.ppt_materials
add column if not exists worksheet_url text;

alter table public.ppt_materials
add column if not exists worksheet_file_name text;

alter table public.ppt_materials
add column if not exists worksheet_urls text[] not null default '{}';

alter table public.ppt_materials
add column if not exists worksheet_file_names text[] not null default '{}';

alter table public.ppt_materials
add column if not exists worksheet_preview_urls text[] not null default '{}';

alter table public.ppt_materials
add column if not exists worksheet_page_counts integer[] not null default '{}';

update public.ppt_materials
set
  worksheet_urls = array[worksheet_url],
  worksheet_file_names = array[coalesce(worksheet_file_name, '활동지 1')]
where worksheet_url is not null
  and coalesce(array_length(worksheet_urls, 1), 0) = 0;

update public.ppt_materials
set age_groups = '{}'
where age_groups is null;

alter table public.ppt_materials
alter column age_groups set default '{}';

alter table public.ppt_materials
alter column age_groups set not null;

update public.ppt_materials
set library_sections = array['elementary']
where library_sections is null or array_length(library_sections, 1) is null;

alter table public.ppt_materials
alter column library_sections set default array['elementary'];

alter table public.ppt_materials
alter column library_sections set not null;

update public.categories
set category_groups = array['subject']
where category_groups is null or array_length(category_groups, 1) is null;

create table if not exists public.site_settings (
  id uuid primary key default gen_random_uuid(),
  site_name text default 'Pastel PPT Library',
  header_title text default '파스텔에듀 수업자료실',
  header_description text default '',
  logo_url text,
  favicon_url text,
  background_color text default '#ffffff',
  header_background_color text default '#ffffff',
  banner_background_color text default '#fce7f3',
  banner_text_color text default '#db3f72',
  month_banner_image_url text,
  subject_banner_image_url text,
  kindergarten_banner_title text default '유치원관 수업자료',
  kindergarten_banner_description text default '유아 눈높이에 맞춘 즐거운 수업자료를 확인해보세요.',
  kindergarten_banner_image_url text,
  elementary_banner_title text default '초등관 수업자료',
  elementary_banner_description text default '초등 수업에 바로 활용할 수 있는 자료를 모았습니다.',
  elementary_banner_image_url text,
  senior_banner_title text default '시니어관 수업자료',
  senior_banner_description text default '시니어 학습과 활동을 위한 자료를 만나보세요.',
  senior_banner_image_url text,
  default_column_color text default '#ffffff',
  card_background_color text default '#ffffff',
  card_border_color text default '#e5e7eb',
  button_color text default '#111827',
  text_color text default '#111827',
  font_family text default 'system-ui',
  card_radius integer default 12,
  use_card_shadow boolean default true,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

alter table public.site_settings
add column if not exists banner_background_color text default '#fce7f3';

alter table public.site_settings
add column if not exists banner_text_color text default '#db3f72';

alter table public.site_settings
add column if not exists month_banner_image_url text;

alter table public.site_settings
add column if not exists subject_banner_image_url text;

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

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_categories_updated_at on public.categories;
create trigger set_categories_updated_at
before update on public.categories
for each row
execute function public.set_updated_at();

drop trigger if exists set_ppt_materials_updated_at on public.ppt_materials;
create trigger set_ppt_materials_updated_at
before update on public.ppt_materials
for each row
execute function public.set_updated_at();

drop trigger if exists set_site_settings_updated_at on public.site_settings;
create trigger set_site_settings_updated_at
before update on public.site_settings
for each row
execute function public.set_updated_at();

insert into public.categories (name, sort_order)
select seed.name, seed.sort_order
from (
  values
    ('계절 수업자료', 1),
    ('통합교과', 2),
    ('진로·직업 수업자료', 3),
    ('인성교육 수업자료', 4),
    ('사회·과학 수업자료', 5),
    ('안전교육 수업자료', 6),
    ('환경보호 수업자료', 7),
    ('세계문화/다문화 수업자료', 8),
    ('여름만들기 수업자료', 9),
    ('명절·기념일 관련 수업자료', 10),
    ('전통·민화 수업자료', 11),
    ('민속놀이 수업자료', 12)
) as seed(name, sort_order)
where not exists (
  select 1
  from public.categories existing
  where existing.name = seed.name
);

insert into public.site_settings (
  site_name,
  header_title,
  header_description,
  background_color,
  header_background_color,
  banner_background_color,
  banner_text_color,
  kindergarten_banner_title,
  kindergarten_banner_description,
  elementary_banner_title,
  elementary_banner_description,
  senior_banner_title,
  senior_banner_description,
  default_column_color,
  card_background_color,
  card_border_color,
  button_color,
  text_color,
  font_family,
  card_radius,
  use_card_shadow
)
select
  'Pastel PPT Library',
  '파스텔에듀 수업자료실',
  '필요한 수업자료를 카테고리별로 확인하고 다운로드할 수 있습니다.',
  '#ffffff',
  '#ffffff',
  '#fce7f3',
  '#db3f72',
  '유치원관 수업자료',
  '유아 눈높이에 맞춘 즐거운 수업자료를 확인해보세요.',
  '초등관 수업자료',
  '초등 수업에 바로 활용할 수 있는 자료를 모았습니다.',
  '시니어관 수업자료',
  '시니어 학습과 활동을 위한 자료를 만나보세요.',
  '#ffffff',
  '#ffffff',
  '#e5e7eb',
  '#111827',
  '#111827',
  'system-ui',
  12,
  true
where not exists (select 1 from public.site_settings);

alter table public.categories enable row level security;
alter table public.ppt_materials enable row level security;
alter table public.ppt_material_events enable row level security;
alter table public.site_settings enable row level security;

drop policy if exists "Public can read categories" on public.categories;
create policy "Public can read categories"
on public.categories for select
to anon, authenticated
using (true);

drop policy if exists "Authenticated can manage categories" on public.categories;
create policy "Authenticated can manage categories"
on public.categories for all
to authenticated
using (auth.role() = 'authenticated')
with check (auth.role() = 'authenticated');

drop policy if exists "Public can read ppt materials" on public.ppt_materials;
create policy "Public can read ppt materials"
on public.ppt_materials for select
to anon, authenticated
using (true);

drop policy if exists "Authenticated can manage ppt materials" on public.ppt_materials;
create policy "Authenticated can manage ppt materials"
on public.ppt_materials for all
to authenticated
using (auth.role() = 'authenticated')
with check (auth.role() = 'authenticated');

drop policy if exists "Public can insert ppt material events" on public.ppt_material_events;
create policy "Public can insert ppt material events"
on public.ppt_material_events for insert
to anon, authenticated
with check (true);

drop policy if exists "Authenticated can read ppt material events" on public.ppt_material_events;
create policy "Authenticated can read ppt material events"
on public.ppt_material_events for select
to authenticated
using (auth.role() = 'authenticated');

drop policy if exists "Public can read site settings" on public.site_settings;
create policy "Public can read site settings"
on public.site_settings for select
to anon, authenticated
using (true);

drop policy if exists "Authenticated can manage site settings" on public.site_settings;
create policy "Authenticated can manage site settings"
on public.site_settings for all
to authenticated
using (auth.role() = 'authenticated')
with check (auth.role() = 'authenticated');

-- Storage 버킷은 Dashboard에서 직접 만들어도 됩니다.
-- SQL로 실행할 경우 아래 구문이 ppt-files, thumbnails, site-assets, worksheet-files 버킷을 public으로 생성 또는 갱신합니다.
insert into storage.buckets (id, name, public)
values
  ('ppt-files', 'ppt-files', true),
  ('thumbnails', 'thumbnails', true),
  ('site-assets', 'site-assets', true),
  ('worksheet-files', 'worksheet-files', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "Public can read ppt files" on storage.objects;
create policy "Public can read ppt files"
on storage.objects for select
to anon, authenticated
using (bucket_id = 'ppt-files');

drop policy if exists "Public can read thumbnails" on storage.objects;
create policy "Public can read thumbnails"
on storage.objects for select
to anon, authenticated
using (bucket_id = 'thumbnails');

drop policy if exists "Public can read site assets" on storage.objects;
create policy "Public can read site assets"
on storage.objects for select
to anon, authenticated
using (bucket_id = 'site-assets');

drop policy if exists "Public can read worksheet files" on storage.objects;
create policy "Public can read worksheet files"
on storage.objects for select
to anon, authenticated
using (bucket_id = 'worksheet-files');

drop policy if exists "Authenticated can upload ppt files" on storage.objects;
create policy "Authenticated can upload ppt files"
on storage.objects for insert
to authenticated
with check (bucket_id = 'ppt-files' and auth.role() = 'authenticated');

drop policy if exists "Authenticated can upload thumbnails" on storage.objects;
create policy "Authenticated can upload thumbnails"
on storage.objects for insert
to authenticated
with check (bucket_id = 'thumbnails' and auth.role() = 'authenticated');

drop policy if exists "Authenticated can upload site assets" on storage.objects;
create policy "Authenticated can upload site assets"
on storage.objects for insert
to authenticated
with check (bucket_id = 'site-assets' and auth.role() = 'authenticated');

drop policy if exists "Authenticated can upload worksheet files" on storage.objects;
create policy "Authenticated can upload worksheet files"
on storage.objects for insert
to authenticated
with check (bucket_id = 'worksheet-files' and auth.role() = 'authenticated');

drop policy if exists "Authenticated can update storage objects" on storage.objects;
create policy "Authenticated can update storage objects"
on storage.objects for update
to authenticated
using (bucket_id in ('ppt-files', 'thumbnails', 'site-assets', 'worksheet-files') and auth.role() = 'authenticated')
with check (bucket_id in ('ppt-files', 'thumbnails', 'site-assets', 'worksheet-files') and auth.role() = 'authenticated');

drop policy if exists "Authenticated can delete storage objects" on storage.objects;
create policy "Authenticated can delete storage objects"
on storage.objects for delete
to authenticated
using (bucket_id in ('ppt-files', 'thumbnails', 'site-assets', 'worksheet-files') and auth.role() = 'authenticated');
