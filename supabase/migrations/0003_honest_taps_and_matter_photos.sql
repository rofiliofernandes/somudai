-- Somudai: three small fixes on top of 0001/0002. REVIEW BEFORE PUSHING TO PROD.
--
-- 1. No Taps on events that have already started.
--    The app shows "Event ended", but tap_post accepted the call anyway, so a
--    direct API call could add to "{n} joined" after the fact (CLAUDE.md rule 2).
-- 2. post_counts totals published posts only, so draft post ids and their
--    counts are not readable by anyone.
-- 3. matters.image_path: the photo each matter row shows on Explore.

-- 1. tap_post: stances any time; actions only before they start.
create or replace function public.tap_post(p_post uuid) returns void
language sql security definer set search_path = public as $$
  insert into taps (user_id, post_id)
  select auth.uid(), id from posts
  where id = p_post
    and is_published
    and (type = 'stance' or starts_at > now())
  on conflict do nothing;
$$;

-- create or replace keeps existing grants, but restate them so this file
-- reads correctly on its own.
revoke execute on function public.tap_post(uuid) from public, anon;
grant execute on function public.tap_post(uuid) to authenticated;

-- 2. Public totals only, for published posts only (never who tapped).
-- This view intentionally reads all taps to total them; it exposes only a
-- count per post. Supabase's Security Advisor will flag it; that is expected.
create or replace view public.post_counts as
  select t.post_id, count(*)::int as tap_count
  from public.taps t
  join public.posts p on p.id = t.post_id and p.is_published
  group by t.post_id;

-- 3. Optional photo per matter (a path in the post-images bucket).
alter table public.matters add column image_path text;
