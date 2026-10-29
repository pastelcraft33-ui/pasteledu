-- PPT 원본을 변경하지 않고 미리보기 PDF와 변환에 사용한 원본 주소를 저장합니다.
alter table public.ppt_materials add column if not exists preview_pdf_url text;
alter table public.ppt_materials add column if not exists preview_source_url text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('ppt-previews', 'ppt-previews', true, 104857600, array['application/pdf'])
on conflict (id) do update set public = true, file_size_limit = 104857600, allowed_mime_types = array['application/pdf'];

drop policy if exists "ppt_preview_public_read" on storage.objects;
create policy "ppt_preview_public_read" on storage.objects for select to public using (bucket_id = 'ppt-previews');

drop policy if exists "ppt_preview_admin_insert" on storage.objects;
create policy "ppt_preview_admin_insert" on storage.objects for insert to authenticated
with check (bucket_id = 'ppt-previews' and lower(auth.jwt() ->> 'email') = 'pastelcraft3@naver.com');

drop policy if exists "ppt_preview_admin_delete" on storage.objects;
create policy "ppt_preview_admin_delete" on storage.objects for delete to authenticated
using (bucket_id = 'ppt-previews' and lower(auth.jwt() ->> 'email') = 'pastelcraft3@naver.com');
