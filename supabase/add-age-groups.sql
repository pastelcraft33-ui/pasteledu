alter table public.ppt_materials
add column if not exists age_groups text[];

update public.ppt_materials
set age_groups = '{}'
where age_groups is null;

alter table public.ppt_materials
alter column age_groups set default '{}';

alter table public.ppt_materials
alter column age_groups set not null;
