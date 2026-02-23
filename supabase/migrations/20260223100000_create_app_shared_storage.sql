create table if not exists public.app_shared_storage (
  storage_key text primary key,
  storage_value text,
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create or replace function public.set_app_shared_storage_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$;

drop trigger if exists app_shared_storage_set_updated_at on public.app_shared_storage;
create trigger app_shared_storage_set_updated_at
before update on public.app_shared_storage
for each row
execute function public.set_app_shared_storage_updated_at();

grant select, insert, update, delete on table public.app_shared_storage to anon, authenticated;

alter table public.app_shared_storage enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'app_shared_storage'
      and policyname = 'app_shared_storage_read'
  ) then
    create policy app_shared_storage_read
    on public.app_shared_storage
    for select
    using (true);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'app_shared_storage'
      and policyname = 'app_shared_storage_insert'
  ) then
    create policy app_shared_storage_insert
    on public.app_shared_storage
    for insert
    with check (true);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'app_shared_storage'
      and policyname = 'app_shared_storage_update'
  ) then
    create policy app_shared_storage_update
    on public.app_shared_storage
    for update
    using (true)
    with check (true);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'app_shared_storage'
      and policyname = 'app_shared_storage_delete'
  ) then
    create policy app_shared_storage_delete
    on public.app_shared_storage
    for delete
    using (true);
  end if;
end;
$$;

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'app_shared_storage'
  ) then
    alter publication supabase_realtime add table public.app_shared_storage;
  end if;
exception
  when undefined_object then
    null;
end;
$$;
