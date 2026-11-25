create table if not exists public.material_comments (
  id uuid primary key default gen_random_uuid(),
  material_id uuid not null references public.ppt_materials(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 500 and body ~ '[^[:space:]]'),
  created_at timestamptz not null default now()
);
create index if not exists material_comments_material_date on public.material_comments(material_id, created_at desc);
alter table public.material_comments enable row level security;
revoke all on public.material_comments from public, anon, authenticated;
grant select, insert(material_id, body) on public.material_comments to anon, authenticated;
grant delete on public.material_comments to authenticated;
drop policy if exists comments_read on public.material_comments;
create policy comments_read on public.material_comments for select to anon, authenticated using (true);
drop policy if exists comments_write on public.material_comments;
create policy comments_write on public.material_comments for insert to anon, authenticated with check (true);
drop policy if exists comments_delete on public.material_comments;
create policy comments_delete on public.material_comments for delete to authenticated using (lower(auth.jwt() ->> 'email') = 'pastelcraft3@naver.com');
