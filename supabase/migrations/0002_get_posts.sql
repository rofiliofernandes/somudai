-- Somudai: one function feeds every list (Home, Explore matter list, post detail).
-- Runs with the caller's permissions (security invoker), so access rules still apply.
-- The ORDER BY is feed ranking v1: your matters, your area, soonest events, newest.

create function public.get_posts(
  p_matter smallint default null,
  p_post uuid default null,
  p_limit int default 20,
  p_offset int default 0
) returns table (
  id uuid, matter_id smallint, matter_name text, type public.post_type,
  title text, summary text, description text, area text, place text,
  starts_at timestamptz, organiser_name text, image_path text,
  tap_count int, tapped boolean
)
language sql stable security invoker set search_path = public as $$
  select p.id, p.matter_id, m.name, p.type, p.title, p.summary, p.description,
         p.area, p.place, p.starts_at, p.organiser_name, p.image_path,
         coalesce(c.tap_count, 0),
         exists (select 1 from taps t where t.post_id = p.id and t.user_id = auth.uid())
  from posts p
  join matters m on m.id = p.matter_id
  left join post_counts c on c.post_id = p.id
  left join profiles me on me.id = auth.uid()
  where p.is_published
    and (p_matter is null or p.matter_id = p_matter)
    and (p_post is null or p.id = p_post)
    and (p.type = 'stance' or p.starts_at >= now() - interval '6 hours' or p_post is not null)
  order by
    (p.matter_id in (select matter_id from profile_matters where profile_id = auth.uid())) desc,
    (p.area is not distinct from me.area) desc,
    case when p.type = 'action' then p.starts_at end asc nulls last,
    p.created_at desc
  limit p_limit offset p_offset;
$$;
