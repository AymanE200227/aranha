# Supabase Shared Sync Setup (Required for Netlify)

Your Netlify site is static, so it cannot create database tables by itself.
You must run the SQL migration one time in Supabase.

## 1) Run SQL migration

Open Supabase Dashboard:
- Project: `krimqarinirxmjnpktlj`
- Go to: `SQL Editor`
- Run the full SQL from:
  - `supabase/migrations/20260223100000_create_app_shared_storage.sql`

## 2) Verify table exists

Run this query in SQL Editor:

```sql
select storage_key, updated_at
from public.app_shared_storage
order by updated_at desc
limit 10;
```

It should return an empty table (or rows if already synced), with no error.

## 3) Redeploy Netlify

After SQL is applied:
- Redeploy your Netlify site.
- Open site in 2 browsers/devices.
- Edit content in browser A.
- Wait 5-10 seconds in browser B (or refresh once).

## 4) Important limitation

Shared sync now covers `localStorage` app data.
Large files stored as raw browser `IndexedDB` blobs remain device-local unless migrated to Supabase Storage.
