-- Somudai: initial schema
-- Matters = topics (Environment, Education...). Posts = what people Tap (action or stance).
-- Every table has row-level security. Taps are written only through tap_post / untap_post.

-- 1. Tables
create table public.matters (
  id smallint generated always as identity primary key,
  slug text unique not null,
  name text not null
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  bio text check (char_length(bio) <= 160),
  area text,
  created_at timestamptz not null default now()
);

create table public.profile_matters (
  profile_id uuid references public.profiles(id) on delete cascade,
  matter_id smallint references public.matters(id),
  primary key (profile_id, matter_id)
);

create type public.post_type as enum ('action', 'stance');

create table public.posts (
  id uuid primary key default gen_random_uuid(),
  matter_id smallint not null references public.matters(id),
  type public.post_type not null,
  title text not null,
  summary text not null,
  description text,
  area text,
  place text,
  starts_at timestamptz,
  organiser_name text not null,
  image_path text,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  check (type = 'stance' or starts_at is not null)  -- actions need a date
);

create table public.taps (
  user_id uuid references public.profiles(id) on delete cascade,
  post_id uuid references public.posts(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, post_id)  -- one Tap per person per post
);

-- 2. Row-level security: everything is closed until a rule opens it
alter table public.matters enable row level security;
alter table public.profiles enable row level security;
alter table public.profile_matters enable row level security;
alter table public.posts enable row level security;
alter table public.taps enable row level security;

create policy "matters are public" on public.matters
  for select using (true);
create policy "published posts are public" on public.posts
  for select using (is_published);
create policy "read own profile" on public.profiles
  for select using (auth.uid() = id);
create policy "update own profile" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);
create policy "manage own matters" on public.profile_matters
  for all using (auth.uid() = profile_id) with check (auth.uid() = profile_id);
create policy "read own taps" on public.taps
  for select using (auth.uid() = user_id);
-- No insert/update/delete policy on taps: only the functions below write.

-- 3. The Tap, counted on the server
create function public.tap_post(p_post uuid) returns void
language sql security definer set search_path = public as $$
  insert into taps (user_id, post_id)
  select auth.uid(), id from posts where id = p_post and is_published
  on conflict do nothing;
$$;

create function public.untap_post(p_post uuid) returns void
language sql security definer set search_path = public as $$
  delete from taps where user_id = auth.uid() and post_id = p_post;
$$;

revoke execute on function public.tap_post(uuid), public.untap_post(uuid) from public, anon;
grant execute on function public.tap_post(uuid), public.untap_post(uuid) to authenticated;

-- 4. Public totals only (never who tapped).
-- This view intentionally reads all taps to total them; it exposes only a count per post.
-- Supabase's Security Advisor will flag it; that is expected.
create view public.post_counts as
  select post_id, count(*)::int as tap_count from public.taps group by post_id;
grant select on public.post_counts to anon, authenticated;

-- 5. Create a profile automatically on first sign-in
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, display_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 6. Starting matters
insert into public.matters (slug, name) values
  ('environment', 'Environment'), ('education', 'Education'),
  ('community', 'Community'), ('civic', 'Civic'),
  ('public-policy', 'Public policy');
