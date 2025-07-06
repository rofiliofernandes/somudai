-- Somudai: the one storage bucket. Public read; no upload policy for app users.
-- The founder uploads photos through the Supabase dashboard. When organisers
-- post in-app, add an upload policy for verified organisers only.
insert into storage.buckets (id, name, public)
values ('post-images', 'post-images', true)
on conflict (id) do nothing;
