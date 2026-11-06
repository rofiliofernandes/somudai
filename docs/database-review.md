# Database, auth and Tap changes: review list

CLAUDE.md asks for every change to `supabase/`, auth or Tap logic to be listed so the founder can review it line by line. Nothing here has been pushed to any Supabase project.

## Migrations

| File | Source | What it does |
|---|---|---|
| `0001_init.sql` | Founder's file, unchanged | Tables, RLS, `tap_post` / `untap_post`, `post_counts`, `handle_new_user`, starting matters |
| `0002_get_posts.sql` | Founder's file, unchanged | `get_posts`, feed ranking v1 |
| `0003_honest_taps_and_matter_photos.sql` | New, **needs review** | See below |
| `0004_post_images_bucket.sql` | New, **needs review** | Creates the public `post-images` bucket (no upload policy) |

### 0003, line by line

1. **`tap_post` replaced** to add `and (type = 'stance' or starts_at > now())`. Taps on an action that has already started are ignored (no error, no row), the same way unpublished posts already were. Untapping is still allowed at any time.
2. **Grants on `tap_post` restated** (`revoke … from public, anon`, `grant … to authenticated`). `create or replace` keeps them anyway; this only makes the file read correctly on its own.
3. **`post_counts` replaced** to join `posts` and count published posts only. Columns are unchanged (`post_id`, `tap_count`), so `get_posts` keeps working. Security Advisor will still flag this view; that is expected and intended.
4. **`matters.image_path text` added** (nullable) for the Explore rows. Fill it from the dashboard with a path in `post-images`.

To skip any of this, delete the file before `supabase db push`; the app works without it (Explore shows grey blocks instead of matter photos).

## Tested

`scripts/test-db.sh` runs all four migrations on plain Postgres 16 with a small Supabase stand-in (`supabase/tests/stub_supabase.sql`: `anon` / `authenticated` roles, Supabase's default grants, `auth.uid()`), then `supabase/tests/rls_test.sql`. All 26 checks pass, including:

- people see only their own profile, matters and Taps; signed-out visitors see none
- the app cannot insert into `taps` directly; signed-out visitors cannot call `tap_post`
- one Tap per person per post; no Taps on started events or drafts
- counts are real totals across people; `post_counts` exposes only `post_id` and `tap_count`, and hides drafts
- `get_posts` ranking (my matters, my area first); past events leave lists but open from a link
- deleting a user removes their profile, matters and every Tap
- every public table has RLS on

## Edge Function: `delete-account`

- Accepts `POST` only, and requires `Authorization: Bearer <user token>`. `verify_jwt = true` in `supabase/config.toml` also checks it at the gateway.
- Looks up the caller with `auth.getUser(token)`. It never trusts a user id from the request body.
- Deletes that user with `auth.admin.deleteUser`. The `on delete cascade` foreign keys remove the profile, matters and Taps.
- Reads the service role key from the function environment (Supabase sets it). It logs only error messages, never tokens or keys.

## Auth (app)

- Session stored in SecureStore on phones (`src/lib/secureSessionStorage.ts`). Values are split into chunks under SecureStore's size limit instead of the guide's AsyncStorage+encryption approach, so nothing about the session touches AsyncStorage. The web uses the browser's storage, as in the spec.
- PKCE flow. Magic links land on `/auth-callback` (`somudai://auth-callback` on phones). Google uses native ID-token sign-in on phones and OAuth redirect on web.
- After sign-in the app can return to the post that was open, but only to in-app paths (`src/lib/returnTo.ts`, tested).
- Allowed redirect URLs to set in Supabase → Auth → URL configuration: `somudai://auth-callback`, `https://<your-domain>/auth-callback` (plus `exp://**` in dev only).

## Tap logic (app)

- Taps go only through `tap_post` / `untap_post` (`src/hooks/useTap.ts`). The app never writes `taps` or sends a count.
- Optimistic update, rollback on error, then refetch so the count is always the server's.
- `tap` / `untap` analytics fire only after the server confirms.
- All wording is in `src/lib/tapWording.ts`, and tests check that it never says "participated", "attended" or "showed up".

## Deliberate departures from the spec

- **"verified" is not shown** next to organisers. The schema has no verified flag yet, and showing it without one would break rule 2. Add a column when verification exists.
- **The Welcome photo is loaded from the bucket** (`post-images/welcome/coast.jpg`), not bundled, so no stock photo was invented for it.
