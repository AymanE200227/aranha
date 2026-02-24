insert into storage.buckets (id, name, public, file_size_limit)
values ('aranha-media', 'aranha-media', true, 524288000)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'aranha_media_public_read'
  ) then
    create policy aranha_media_public_read
    on storage.objects
    for select
    using (bucket_id = 'aranha-media');
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'aranha_media_public_insert'
  ) then
    create policy aranha_media_public_insert
    on storage.objects
    for insert
    with check (bucket_id = 'aranha-media');
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'aranha_media_public_update'
  ) then
    create policy aranha_media_public_update
    on storage.objects
    for update
    using (bucket_id = 'aranha-media')
    with check (bucket_id = 'aranha-media');
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'aranha_media_public_delete'
  ) then
    create policy aranha_media_public_delete
    on storage.objects
    for delete
    using (bucket_id = 'aranha-media');
  end if;
end;
$$;
