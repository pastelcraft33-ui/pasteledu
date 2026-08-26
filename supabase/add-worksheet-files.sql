-- Pastel PPT Library 활동지 파일 기능 추가
-- Supabase Dashboard > SQL Editor에서 이 파일 전체를 한 번 실행하세요.

alter table public.ppt_materials
add column if not exists worksheet_url text;

alter table public.ppt_materials
add column if not exists worksheet_file_name text;

insert into storage.buckets (id, name, public)
values ('worksheet-files', 'worksheet-files', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "Public can read worksheet files" on storage.objects;
create policy "Public can read worksheet files"
on storage.objects for select
to anon, authenticated
using (bucket_id = 'worksheet-files');

drop policy if exists "Authenticated can upload worksheet files" on storage.objects;
create policy "Authenticated can upload worksheet files"
on storage.objects for insert
to authenticated
with check (bucket_id = 'worksheet-files' and auth.role() = 'authenticated');

drop policy if exists "Authenticated can update worksheet files" on storage.objects;
create policy "Authenticated can update worksheet files"
on storage.objects for update
to authenticated
using (bucket_id = 'worksheet-files' and auth.role() = 'authenticated')
with check (bucket_id = 'worksheet-files' and auth.role() = 'authenticated');

drop policy if exists "Authenticated can delete worksheet files" on storage.objects;
create policy "Authenticated can delete worksheet files"
on storage.objects for delete
to authenticated
using (bucket_id = 'worksheet-files' and auth.role() = 'authenticated');
