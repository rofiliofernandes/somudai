# Somudai

Somudai makes collective public participation easier. People discover matters around them, Tap to join or stand with them, and see that their participation is real.

- **Rules for anyone (or any agent) changing this code:** [`CLAUDE.md`](CLAUDE.md)
- **The full technical spec:** [`docs/frontend-spec.md`](docs/frontend-spec.md)
- **Database review notes:** [`docs/database-review.md`](docs/database-review.md)

## Stack

Expo (React Native) + Expo Router, strict TypeScript, TanStack Query · Supabase (Postgres, Auth, Storage, Edge Functions, Mumbai) · PostHog · Sentry · EAS Build/Submit · Cloudflare Pages for the web build.

## Run it

```sh
npm install
cp .env.example .env     # fill in the somudai-dev URL and anon key
npx expo start           # press w for web; use a dev build for Google sign-in on phones
```

Only `EXPO_PUBLIC_` values go in `.env`. The service role key never goes anywhere in this repo.

## Checks

```sh
npm run typecheck        # tsc --noEmit
npm run lint             # eslint
npm test                 # jest: formatting, Tap wording, TapButton states
scripts/test-db.sh       # migrations + access-rule tests on a throwaway Postgres
```

`scripts/test-db.sh` needs `psql` and a local Postgres (set `PGHOST`, `PGPORT`, `PGUSER`). It runs every migration on a fresh database and checks RLS, Taps and counts. CI runs all of the above plus a gitleaks secret scan.

## Database

Migrations live in `supabase/migrations/`. The founder pushes them:

```sh
npx supabase link --project-ref <dev-ref>
npx supabase db push
npx supabase gen types typescript --project-id <dev-ref> > src/types/db.ts
```

`src/types/db.ts` is currently hand-written to match the migrations; regenerate it after the first push.

## Where things live

| What | Where |
|---|---|
| Domain and grievance email | `site.config.json` (the only place) |
| Design tokens | `src/theme/tokens.ts` |
| Tap wording | `src/lib/tapWording.ts` |
| Analytics events (fixed list) | `src/lib/analytics.ts` |
| Icons | `assets/brand/wave-mark.svg` → `scripts/make-icons.sh` |
| Play listing | `store/android/` |

## Before launch

- Upload the Welcome photo to `post-images/welcome/coast.jpg`, and a photo per matter (set `matters.image_path`).
- Fill in the Play signing SHA-256 in `public/.well-known/assetlinks.json`.
- Have the privacy policy and terms (`app/privacy.tsx`, `app/terms.tsx`) reviewed by a lawyer.
- Replace the placeholder domain in `site.config.json`.
