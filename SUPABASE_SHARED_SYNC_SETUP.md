# Supabase SQL + Storage Setup (Required for Netlify)

This frontend now uses:
- Supabase SQL table `public.app_shared_storage` for application data.
- Supabase Storage bucket `aranha-media` for uploaded media files.

Because Netlify deploys static frontend only, you must apply SQL migrations in Supabase once.

## 1) Run both SQL migrations

Open Supabase Dashboard:
- Project: `krimqarinirxmjnpktlj`
- Go to: `SQL Editor`
- Run SQL from:
  - `supabase/migrations/20260223100000_create_app_shared_storage.sql`
  - `supabase/migrations/20260224110000_create_media_bucket.sql`

## 2) Verify SQL table

```sql
select storage_key, updated_at
from public.app_shared_storage
order by updated_at desc
limit 10;
```

Expected: query succeeds (empty or populated rows).

## 3) Verify storage bucket

```sql
select id, name, public
from storage.buckets
where id = 'aranha-media';
```

Expected: one row for `aranha-media` with `public = true`.

## 4) Redeploy Netlify and test

- Netlify env vars required at build time:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_PUBLISHABLE_KEY` (or `VITE_SUPABASE_ANON_KEY`)
- Redeploy your Netlify site.
- Open site in 2 browsers/devices.
- Edit users/groups/schedules/content/media in browser A.
- Verify browser B reflects updates (wait ~5-10s or refresh once).
