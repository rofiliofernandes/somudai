-- Somudai database tests: access rules, Taps and counts.
-- Run with scripts/test-db.sh (plain Postgres + supabase/tests/stub_supabase.sql).
-- Every check raises an exception on failure, and psql stops on the first one.
\set ON_ERROR_STOP on
\set QUIET on

-- ---------- Test data (as the database owner, like the dashboard) ----------
insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-00000000000a', 'asha@test.local', '{"full_name":"Asha"}'),
  ('00000000-0000-0000-0000-00000000000b', 'ben@test.local', '{}');

insert into public.posts (id, matter_id, type, title, summary, area, starts_at, organiser_name, is_published) values
  ('10000000-0000-0000-0000-000000000001', 1, 'action', 'Future cleanup', 's', 'North Goa', now() + interval '3 days', 'Org', true),
  ('10000000-0000-0000-0000-000000000002', 1, 'action', 'Past cleanup', 's', 'North Goa', now() - interval '2 days', 'Org', true),
  ('10000000-0000-0000-0000-000000000003', 4, 'stance', 'A stance', 's', 'South Goa', null, 'Org', true),
  ('10000000-0000-0000-0000-000000000004', 1, 'stance', 'Draft stance', 's', null, null, 'Org', false);

-- Helper: assert a condition.
create function pg_temp.check(ok boolean, what text) returns void language plpgsql as $$
begin
  if ok is not true then raise exception 'FAILED: %', what; end if;
  raise notice 'ok: %', what;
end $$;
grant execute on function pg_temp.check(boolean, text) to anon, authenticated;

-- ---------- handle_new_user ----------
select pg_temp.check((select count(*) from profiles) = 2, 'a profile is created for each new user');
select pg_temp.check((select display_name from profiles where id = '00000000-0000-0000-0000-00000000000a') = 'Asha',
  'display name comes from Google full_name');

-- ---------- As Asha ----------
begin;
set local role authenticated;
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-00000000000a"}';

select pg_temp.check((select count(*) from profiles) = 1, 'Asha sees only her own profile');
select pg_temp.check((select count(*) from posts) = 3, 'drafts are hidden from users');

select tap_post('10000000-0000-0000-0000-000000000001');
select tap_post('10000000-0000-0000-0000-000000000001'); -- second Tap is a no-op
select tap_post('10000000-0000-0000-0000-000000000003');
select tap_post('10000000-0000-0000-0000-000000000002'); -- event already started
select tap_post('10000000-0000-0000-0000-000000000004'); -- unpublished
select pg_temp.check((select count(*) from taps) = 2, 'one Tap per post; no Taps on started events or drafts');

do $$ begin
  insert into taps (user_id, post_id) values (auth.uid(), '10000000-0000-0000-0000-000000000002');
  raise exception 'FAILED: direct insert into taps was allowed';
exception when insufficient_privilege then raise notice 'ok: the app cannot insert into taps directly';
end $$;

update profiles set area = 'North Goa' where id = auth.uid();
update profiles set area = 'Hacked' where id = '00000000-0000-0000-0000-00000000000b';
insert into profile_matters values (auth.uid(), 1), (auth.uid(), 4);

do $$ begin
  insert into profile_matters values ('00000000-0000-0000-0000-00000000000b', 2);
  raise exception 'FAILED: wrote another user''s matters';
exception when insufficient_privilege then raise notice 'ok: cannot write another user''s matters';
end $$;

select pg_temp.check(
  (select array_agg(id order by tap_count desc, id) from get_posts()) is not null,
  'get_posts runs for a signed-in user');
select pg_temp.check(
  (select tapped from get_posts(p_post => '10000000-0000-0000-0000-000000000001')),
  'get_posts reports tapped = true for my Tap');
select pg_temp.check(
  not exists (select 1 from get_posts() where id = '10000000-0000-0000-0000-000000000002'),
  'past events leave the lists');
select pg_temp.check(
  exists (select 1 from get_posts(p_post => '10000000-0000-0000-0000-000000000002')),
  'past events still open from a link');
commit;

select pg_temp.check((select area from profiles where id = '00000000-0000-0000-0000-00000000000b') is null,
  'Asha could not change Ben''s profile');

-- ---------- As Ben ----------
begin;
set local role authenticated;
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-00000000000b"}';
select pg_temp.check((select count(*) from taps) = 0, 'Ben cannot see Asha''s Taps');
select pg_temp.check((select count(*) from profile_matters) = 0, 'Ben cannot see Asha''s matters');
select tap_post('10000000-0000-0000-0000-000000000001');
select pg_temp.check(
  (select tap_count from get_posts(p_post => '10000000-0000-0000-0000-000000000001')) = 2,
  'counts are real totals across people (2 joined)');
select pg_temp.check(
  not (select tapped from get_posts(p_post => '10000000-0000-0000-0000-000000000003')),
  'tapped is per person');
select untap_post('10000000-0000-0000-0000-000000000001');
select pg_temp.check(
  (select tap_count from get_posts(p_post => '10000000-0000-0000-0000-000000000001')) = 1,
  'untap removes only my Tap');
commit;

-- Ranking: Asha follows Environment + Civic and lives in North Goa.
begin;
set local role authenticated;
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-00000000000a"}';
select pg_temp.check(
  (select id from get_posts() limit 1) = '10000000-0000-0000-0000-000000000001',
  'feed puts my matters and my area first');
commit;

-- ---------- Signed out (anon) ----------
begin;
set local role anon;
select pg_temp.check((select count(*) from get_posts()) = 2, 'signed-out visitors can read published posts');
select pg_temp.check((select count(*) from taps) = 0, 'signed-out visitors see no Taps');
select pg_temp.check((select count(*) from profiles) = 0, 'signed-out visitors see no profiles');
select pg_temp.check(
  not exists (select 1 from post_counts where post_id = '10000000-0000-0000-0000-000000000004'),
  'post_counts hides unpublished posts');
select pg_temp.check(
  (select array_agg(column_name::text order by column_name) from information_schema.columns
    where table_schema = 'public' and table_name = 'post_counts') = array['post_id', 'tap_count'],
  'post_counts exposes only post_id and tap_count');
do $$ begin
  perform tap_post('10000000-0000-0000-0000-000000000001');
  raise exception 'FAILED: anon could call tap_post';
exception when insufficient_privilege then raise notice 'ok: signed-out visitors cannot Tap';
end $$;
commit;

-- ---------- Account deletion cascades ----------
delete from auth.users where id = '00000000-0000-0000-0000-00000000000a';
select pg_temp.check(
  not exists (select 1 from taps where user_id = '00000000-0000-0000-0000-00000000000a')
  and not exists (select 1 from profile_matters where profile_id = '00000000-0000-0000-0000-00000000000a')
  and not exists (select 1 from profiles where id = '00000000-0000-0000-0000-00000000000a'),
  'deleting a user removes their profile, matters and every Tap');

-- ---------- Every public table has RLS ----------
select pg_temp.check(
  not exists (
    select 1 from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind = 'r' and not c.relrowsecurity),
  'row-level security is on for every public table');

\echo 'All database tests passed.'
