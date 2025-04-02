# Somudai — instructions for AI coding agents

Somudai makes collective public participation easier. People discover matters around them, Tap to join or stand with them, and see that their participation is real.

Read this whole file before every task. If a task conflicts with this file, stop and ask instead of working around it.

## Product rules (never break these)

1. **Every number is a real person.** Never create fake users, fake Taps, seed counts, placeholder engagement or "demo" numbers that could reach real users.
2. **Never show something as participation if we cannot honestly measure it.**
3. **Honest Tap wording:**
   - Action posts: button `I'm joining`, count `{n} joined`.
   - Stance posts: button `I stand with this`, count `{n} stand with this`.
   - Never use "participated", "attended" or "showed up" unless it comes from a real check-in.
4. **Quiet design.** One action per post, with the count beside it. No likes, comments, share counts, trending sections, filters or infinite grids unless the founder asks.
5. **Privacy by default.** Who tapped a post is never shown publicly; only totals are. Taps are never sold or shared.
6. **Neutral.** Somudai hosts civic and political matters but never takes sides. No ranking or promotion logic may favour one side.

## Stack

- App: Expo (React Native) with Expo Router, TypeScript strict mode. One codebase for iOS, Android and web.
- Backend: Supabase (Postgres, Auth, Storage, Edge Functions), Mumbai region.
- Analytics: PostHog (`posthog-react-native`).
- Builds: EAS Build and EAS Submit.
- Tabs in the MVP: Home, Explore, Profile. Nothing else.

## Data words

- `matters` = topics (Environment, Education, Community, Civic, Public policy).
- `posts` = the things people Tap. Each has `type` = `action` or `stance`.
- `taps` = one row per (user, post). The primary key enforces one Tap per person per post.
- Counts come only from the `post_counts` view.

## Security rules (non-negotiable)

- **Never disable row-level security**, never add a policy like `using (true)` on tables holding user data, and never "fix" a permission error by loosening access. If a query is blocked, explain why and propose a correct policy for review.
- **Taps are written only through the `tap_post` / `untap_post` database functions.** The app must never insert into `taps` directly or send a count.
- **Secrets:**
  - Only the Supabase URL and anon key may appear in the app, via environment variables (`EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`).
  - The service role key exists only in Edge Function secrets. Never put it in app code, config files, tests, logs or commits.
- Never commit `.env` files. Never print secrets in logs or error messages.
- Store the auth session with `expo-secure-store`, not AsyncStorage.
- Analytics events carry only ids and types (for example `post_id` and `post_type`). Never send names, emails, phone numbers or locations to PostHog.
- Every new table gets row-level security enabled in the same migration that creates it.
- Database changes go in `supabase/migrations/` as SQL files. Never change the production database by hand from code.
- Do not add new dependencies without saying why; prefer well-maintained packages.

## How to work

- One task at a time, on its own git branch, merged through a pull request.
- Keep changes small and focused on the task. Don't refactor unrelated code.
- After changing anything in `supabase/`, auth or Tap logic, list exactly what changed so the founder can review it line by line.
- Run the type checker and tests before saying a task is done.
- Use plain, kind UI copy. Empty states say what's true ("Nothing near you in this matter yet"), never fill gaps with invented content.
- If something is unclear, ask. Don't guess on anything touching data, privacy or counts.

## Environments

- `somudai-dev` Supabase project: agents may use this.
- `somudai-prod` Supabase project: agents never get its credentials. The founder deploys migrations to production after review.
