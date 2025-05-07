# Somudai Technical Spec

The whole Somudai system in one place: the tech stack, how every service connects, environments and secrets, the backend, web and links, how code ships, monitoring, costs, and then the app itself screen by screen. Pairs with the 3-Week Build Guide and `CLAUDE.md`.

> The domain is a placeholder. It lives only in `site.config.json`; change it there.

---

# Part 1: The system

## Stack at a glance

Eleven pieces, almost all on free plans at launch. The only must-pay items are the Supabase Pro plan for production (for backups and no pausing), the store accounts, and a domain.

| Layer | Tool | Its job | At launch |
|---|---|---|---|
| App | Expo (React Native) + Expo Router, TypeScript | One codebase for Android, iOS and web | Free, open source |
| Data in the app | TanStack Query | Caching, loading states, the instant Tap | Free, open source |
| Backend | Supabase, Mumbai region | Postgres database, access rules, sign-in, photo storage, server functions | Dev: Free · Prod: Pro |
| Sign-in providers | Google OAuth, email magic links | How people sign in (phone OTP after DLT approval) | Free |
| Auth email | Resend or Brevo, connected to Supabase as custom SMTP | Sends magic-link emails from your own domain | Free tier |
| Analytics | PostHog | The five metrics and the dashboard | Free tier |
| Error tracking | Sentry | Crash and error reports from the app | Free tier |
| Builds and store upload | EAS Build and EAS Submit | Builds Android/iOS apps in the cloud, uploads to the stores | Free plan; Starter if you need faster builds |
| Website hosting | Cloudflare Pages (static export of the Expo web build) | The website, shared post links, app-link files | Free |
| Domain and DNS | Your domain, DNS on Cloudflare | `somudai.<tld>` for the site, email and app links | Yearly domain fee |
| Code and checks | GitHub + GitHub Actions | Private repo, secret scanning, automatic checks | Free |

Why these: each one removes a whole job you'd otherwise build and secure yourself. Supabase replaces a custom backend, EAS replaces local Android/iOS build setups, and Cloudflare Pages hosts the web build for free.

**Two facts that shape the setup**

- Supabase's built-in email sender is for testing only: it isn't meant for production and only sends to your own team's addresses. Email magic links for real users need custom SMTP (Resend or Brevo).
- Supabase Free projects pause after a week of inactivity, and daily backups come with Pro. Production goes on Pro ($25/month, which includes compute credit for one project); development can stay Free.

## System map

Every request from the app goes to Supabase or to the two watching tools; nothing else talks to your users' data.

People use the app (on Android, or on the web through Cloudflare). The app signs in, reads posts and Taps through Supabase, whose Auth relies on Google and your email sender. PostHog and Sentry only receive anonymous usage events and crash reports. You manage content through the Supabase dashboard until the admin panel exists.

## Environments and secrets

Two separate worlds: dev, where you and the AI agents build and break things, and prod, where real people's data lives and only you have the keys.

| | Dev | Prod |
|---|---|---|
| Supabase project | `somudai-dev` (Free) | `somudai-prod` (Pro) |
| PostHog project | Somudai Dev | Somudai |
| Sentry environment | development | production |
| Who has access | You, Claude Code, Devin | You only |
| Data | Test accounts and test posts | Real people, real posts only |
| How it changes | Agents run migrations freely | You run reviewed migrations by hand |

The app picks its environment from EAS build profiles: development and preview builds point at dev; production builds point at prod.

### Where every secret lives

| Secret | Lives in | Notes |
|---|---|---|
| Supabase URL + anon key | `.env` locally; EAS environment variables; Cloudflare Pages build settings | Public by design: they ship inside the app. Safe only because of the access rules |
| Supabase service role key | Nowhere you copy it. Supabase gives it to Edge Functions automatically | Bypasses all access rules. Never in the app, repo, chat or CI |
| Database password, Supabase access token | Your password manager | Needed only to run migrations from your laptop |
| Google OAuth client secret | Supabase → Auth → Providers | The app only needs the client IDs |
| SMTP key (Resend/Brevo) | Supabase → Auth → SMTP settings | |
| PostHog project key, Sentry DSN | `EXPO_PUBLIC_` env vars | Public by design |
| Sentry auth token (for readable crash reports) | EAS secret | Never in the repo |
| Play Console service account (for EAS Submit) | EAS credentials | Lets EAS upload builds to Play |

**The one rule to remember:** anything starting with `EXPO_PUBLIC_` can be read by anyone who downloads the app. Only public keys go there.

## Backend setup (Supabase)

Supabase is the whole backend: set up these five parts once in each project (dev first, then prod).

### 1. Sign-in

- **Google:** in Google Cloud Console create OAuth clients: one Web client (its ID and secret go into Supabase → Auth → Providers → Google), plus Android and iOS clients for native sign-in. On phones, use the native Google Sign-In library and pass its ID token to `supabase.auth.signInWithIdToken`, which feels instant. On the web, use `supabase.auth.signInWithOAuth`.
- **Email magic links:** turn on Email in Supabase Auth, connect custom SMTP (Resend or Brevo) sending from `no-reply@mail.<your-domain>`, and edit the email template to sound like Somudai.
- **Redirect URLs:** in Auth → URL configuration, allow only `somudai://auth-callback` and `https://<your-domain>/auth-callback` (plus `exp://` URLs in dev only).
- **Abuse protection:** turn on CAPTCHA for sign-in (Supabase supports Cloudflare Turnstile and hCaptcha) and keep Supabase's auth rate limits on.

### 2. Database

All changes are SQL migration files in `supabase/migrations/`, created with the Supabase CLI:

```sh
npx supabase init          # once
npx supabase link --project-ref <dev-ref>
npx supabase migration new add_something
npx supabase db push       # applies new migrations to the linked project
```

- To update prod: review the migration, `supabase link --project-ref <prod-ref>`, `supabase db push`, then link back to dev.
- Database functions in v1: `tap_post`, `untap_post`, `get_posts`, `handle_new_user`. Views: `post_counts`.
- Check Supabase's Security Advisor after every migration: it flags tables without access rules.

### 3. Storage

- One bucket: `post-images`, public read.
- No upload rule for app users; you upload through the dashboard. When organisers post in-app (January), add an upload rule for verified organisers only.

### 4. Edge Functions (server code)

- `delete-account`: verifies the caller's sign-in token, then deletes that user. Deploy with `npx supabase functions deploy delete-account`.
- Later: admin actions (verify organiser, feature, limit, remove) with an audit log.

### 5. Admin, for now

- Until the admin panel exists, you are the admin through the Supabase dashboard: add posts, upload photos, flip `is_published`.
- Protect the dashboard with 2FA, and never give anyone else access to prod.

## Web, domain and links

One domain ties it all together: the website, shared post links that open the app, and the email address magic links come from.

### Domain and DNS

- Buy one domain (e.g. `somudai.in` or `somudai.app`) and manage its DNS on Cloudflare (free).
- `<your-domain>` → the website. `mail.<your-domain>` → auth email, with the SPF, DKIM and DMARC records Resend/Brevo give you, so magic links don't land in spam.

### The website

- Set `web.output: "single"` in the app config, then `npx expo export --platform web` creates a `dist/` folder.
- Connect the GitHub repo to Cloudflare Pages: build command `npx expo export --platform web`, output folder `dist`. Every merge to main redeploys the site.
- Add a `public/_redirects` file with `/* /index.html 200` so links like `/post/<id>` open the app's post page.
- Static pages on the same site: `/privacy`, `/terms` and `/contact` (the grievance email). Play Console needs the privacy link.

### Links that open the app (Android App Links)

- In the app config, add an Android intent filter for `https://<your-domain>/post` with `autoVerify: true`.
- Host `/.well-known/assetlinks.json` on the site with your app's SHA-256 signing fingerprint (from Play Console → App signing).
- Result: tapping a Somudai link on WhatsApp opens the app if installed, or the website if not. iOS universal links follow when the iOS app ships.

**Known limit for v1:** the website is a single-page app, so WhatsApp link previews show a generic Somudai title and image, not each post's photo. Per-post previews come in January with a small Cloudflare Pages Function that adds each post's title and image to the page.

## How code ships

Nothing reaches users without passing automatic checks and your review; the website deploys itself, while app releases and database changes happen only when you decide.

**GitHub Actions checks on every pull request** (`.github/workflows/checks.yml`): `npx tsc --noEmit`, `npx eslint .`, `npm test`, and a secret scan (gitleaks). Branch protection on main requires them to pass.

**EAS build profiles** (`eas.json`):

| Profile | Points at | Used for |
|---|---|---|
| development | Dev | Running on your phone while building |
| preview | Dev | Sharing test builds with friends |
| production | Prod | Play closed testing, production, TestFlight |

**Releasing the Android app:** `eas build --platform android --profile production`, then `eas submit --platform android` uploads it to the Play track you choose (closed testing first). JavaScript-only fixes can go out faster with EAS Update without a new store review.

**Order when a change touches the database:** push the migration to prod first, then release the app that uses it, so the old app never meets a missing column.

## Monitoring, backups and incidents

You should hear about a problem from a dashboard before a user tells you.

| What | Tool | What to check |
|---|---|---|
| App crashes and errors | Sentry (`@sentry/react-native` with its Expo plugin) | New issues daily during the pilot; alerts by email |
| Database health, slow queries, auth errors | Supabase logs and reports | Weekly |
| Security gaps | Supabase Security Advisor | After every migration |
| Usage and the loop | PostHog dashboard | Weekly review of the five metrics |
| Website up | A free uptime monitor pinging the site every 5 minutes | Alerts by email |
| Backups | Supabase Pro daily backups (7 days kept) | Restore one into dev once a month to prove it works |

**If something goes wrong (keep this list handy)**

1. **A key leaked:** rotate it immediately in Supabase (or the service it belongs to), redeploy, and check logs for misuse.
2. **Data exposed or a bug lets users see others' data:** turn off the affected feature or pause sign-ups, fix the access rule, and write down what happened and when.
3. **Tell people:** under India's data protection law, personal data breaches must be reported to the Data Protection Board and affected users. Get legal advice on the exact steps.
4. **Bad release:** roll back the website to the previous Cloudflare Pages deployment; for the app, ship a fix (or an EAS Update for JavaScript-only fixes).

## Monthly cost at launch

About $25 a month, plus one-time store fees and a domain. Everything else fits in free plans at pilot scale.

| Item | Cost | When |
|---|---|---|
| Supabase Pro (prod) | $25/month, includes compute credit for one project | From launch |
| Supabase Free (dev) | $0 | Now |
| EAS (Expo) | $0 on Free; Starter is $19/month with build credit if free builds are too slow | Optional |
| PostHog, Sentry, Resend/Brevo, Cloudflare Pages, GitHub | $0 on free tiers | Now |
| Google Play Console | $25 once | Week 1 |
| Apple Developer Program | Yearly fee | When iOS ships |
| Domain | Yearly fee, varies by name | Week 1 |

Watch for: Supabase Pro meters monthly active users above 100,000 and data transfer above the included amount; PostHog and Sentry free tiers have monthly event caps. None should matter during the Goa pilot.

---

# Part 2: The app

## Look and feel

Somudai looks like the light mockups: off-white space, near-black type, real photos, one green accent, and a single clear action per screen.

### Design principles

1. Photos carry the emotion; the interface stays quiet. No gradients, glows or decorative colour.
2. One action per screen. If a screen has two buttons of equal weight, one of them is wrong.
3. The count sits beside the action, never as a badge or a big number fighting for attention.
4. Words over icons. Every icon has a label; Tap buttons always say what they mean.
5. Calm motion. Short fades (150–200 ms) and a gentle press scale. No confetti, bounces or streaks.

### Colour (light theme; dark mode later)

| Token | Hex | Used for |
|---|---|---|
| `bg` | `#FAFAF8` | Screen background |
| `surface` | `#FFFFFF` | Cards, sheets |
| `ink` | `#111111` | Main text, primary button fill |
| `inkSecondary` | `#6B6B66` | Counts, meta lines, hints |
| `border` | `#E7E5E0` | Card borders, dividers |
| `accent` | `#2F7D4F` | Matter chips (selected), the "joined" tick |
| `accentSoft` | `#E8F2EC` | Selected chip background, joined button background |
| `danger` | `#B3261E` | Errors, delete account |
| `onInk` | `#FFFFFF` | Text on the black button |

### Type (system font: San Francisco on iOS, Roboto on Android, Inter on web)

| Token | Size / line height | Weight | Used for |
|---|---|---|---|
| `display` | 28 / 34 | 600 | Welcome and onboarding headlines |
| `title` | 20 / 26 | 600 | Screen titles, post titles on detail |
| `headline` | 17 / 22 | 600 | Post titles on cards, button labels |
| `body` | 15 / 22 | 400 | Descriptions |
| `meta` | 13 / 18 | 400 | Counts, matter · area lines, hints |

### Spacing, shape, touch

- Spacing scale: 4, 8, 12, 16, 24, 32, 48. Screen side padding 16.
- Radius: 16 for cards and photos, 999 for buttons and chips.
- Minimum touch target 44 × 44 points.
- Photos: 4:3 on cards, 16:10 on detail; always cropped, never stretched.

Put all of this in `src/theme/tokens.ts` and never hard-code a colour or size in a screen.

## Components

Nine reusable components build every screen; the most important is `TapButton`, which always says exactly what the Tap means.

### TapButton · 5 states

Count on the left, the action on the right, in every list and on post detail.

| State | When | Count | Button |
|---|---|---|---|
| Ready · action | Not joined yet | `1,284 joined` | `I'm joining` |
| Joined · action | After Tap; Undo shown on detail | `1,285 joined` | `✓ Joined` |
| Ready · stance | Not standing with it yet | `12,483 stand with this` | `I stand with this` |
| Standing · stance | After Tap | `12,484 stand with this` | `✓ Standing with this` |
| Ended · action | Date passed; opened from a link | `1,284 joined` | `Event ended` (disabled) |

In the app, "Ready" buttons are solid `ink` with white text; "Joined" and "Standing" use `accentSoft` with an `accent` tick. Pressing scales the button to 0.97 for 120 ms with a light haptic. The count updates at the same moment.

| Component | What it is | Key props |
|---|---|---|
| `Screen` | Safe-area wrapper with `bg` and 16 side padding | `scroll?` |
| `Text` | Typed text using the type tokens | `variant`, `tone` |
| `Button` | Primary (black), secondary (outline), danger | `variant`, `loading`, `onPress` |
| `TapButton` | The five states above; calls `useTap` | `post`, `size` (sm or lg), `source` |
| `MatterChip` | Rounded chip, selectable | `label`, `selected`, `onPress` |
| `PostCard` | Photo, meta line, title, summary, count + TapButton | `post`, `onOpen` |
| `PostRow` | Compact list row for Explore | `post` |
| `EmptyState` / `ErrorState` | One sentence + one action | `message`, `action` |
| `Skeleton` | Grey placeholder blocks in the shape of content | `variant` (card or row) |

**Count formatting:** under 10,000 show the full number with commas (1,284); from 10,000 use one decimal and K (12.4K) in lists, full number on detail.

## Screen by screen

Seven screens make the MVP. Each lists its layout top to bottom, the data it uses, and its states.

### 1. Welcome — `app/(auth)/welcome.tsx`

- Full-bleed coastal photo filling the top ~60%, fading into `bg`.
- `display`: "See what matters. Connect. Tap." Under it, `body` in `inkSecondary`: "Turn care into action."
- Primary button (black): **Continue with Google**. Secondary (outline): **Continue with email**.
- Tiny meta line: "By continuing you agree to our Terms and Privacy Policy" (both links).
- Email flow: one field, "Send me a link", then "Check your inbox" with a resend link after 30 seconds.
- States: button shows a spinner while signing in; sign-in errors in plain words ("That didn't work. Try again.").

### 2. Choose matters — `app/(onboarding)/matters.tsx`

- `meta`: "Step 1 of 2". `display`: "What matters to you?" `body`: "Pick at least one. You can change this anytime."
- Matter chips wrapping in rows, from `matters`. Selected chip: `accentSoft` fill, `accent` border and tick.
- Bottom button **Continue**, disabled until one is selected.
- Saves rows to `profile_matters` (delete old rows, insert new ones).

### 3. Your area — `app/(onboarding)/area.tsx`

- `meta`: "Step 2 of 2". `display`: "Where are you?" `body`: "We'll show what's happening near you first."
- Simple list with radio rows: North Goa, South Goa, Elsewhere.
- A one-line analytics consent note: "We measure how Somudai is used (never what you say or who you are) to make it better."
- **Let's go** saves `profiles.area` and opens Home.

### 4. Home — `app/(tabs)/index.tsx`

- Header: Somudai wordmark left; nothing else in v1 (no search icon until search exists).
- Vertical list of `PostCard`s from `get_posts()`, full width, 24 apart.
- PostCard: photo (4:3) → meta "Environment · North Goa" (+ " · Sun 13 Dec" for actions) → headline title → two lines of summary → divider → bottom row: count left in meta, TapButton right.
- Tapping the card (not the button) opens Post detail.
- Pull to refresh. Load 20 at a time; fetch more near the end.
- Empty: "Nothing near you yet. New matters are added every week." + **Explore matters** button. Never fake content.

### 5. Explore — `app/(tabs)/explore/index.tsx` and `[matter].tsx`

- Index: title "What matters to you?" then one row per matter: rounded photo, matter name in headline, chevron. Your chosen matters first.
- Matter screen: back arrow + matter name as title; meta "Near you · North Goa". Then a compact list: thumbnail (56), title, count on the next line, TapButton (small) on the right.
- No filters, tabs, trending, grids or search bars.
- Empty: "Nothing in Environment near you yet."

### 6. Post detail — `app/post/[id].tsx`

- Photo (16:10) with back and share buttons floating on it.
- meta matter · Action/Stance → title → for actions: date and time, place with a small map pin, organiser ("By Goa Green Collective · verified").
- Full description in body.
- Sticky bottom bar: count left, large TapButton right.
- After Tap, a short line appears above the bar: action → "You're joining. See you on Sunday."; stance → "You stand with this, alongside 12,483 people." Plus a quiet **Undo**.
- Share opens the system share sheet: title + "Join on Somudai" + web link `https://<your-domain>/post/<id>`.

### 7. Profile — `app/(tabs)/profile.tsx`

- Avatar (from Google, or initials), name, area, one-line bio. Edit opens a simple form.
- "My matters" chips with an Edit link back to the matters picker.
- "Joined and standing with" list, with the label "Only you can see this."
- Bottom: Privacy policy, Terms, Contact (grievance email), Sign out, and Delete account in `danger` with a confirm step: "This deletes your profile and every Tap. It can't be undone."

## How the app connects

Data flows one way: screens call hooks, hooks use the one Supabase client and cache, and only database functions change Taps.

This keeps every rule in one place: if Tap logic ever changes, only `useTap` and the database function change, not every screen.

### Folder structure

```
somudai/
├─ app/                          # screens (Expo Router: folders = routes)
│  ├─ _layout.tsx                # providers + sign-in gate
│  ├─ (auth)/welcome.tsx
│  ├─ (onboarding)/matters.tsx
│  ├─ (onboarding)/area.tsx
│  ├─ (tabs)/_layout.tsx         # Home, Explore, Profile tabs
│  ├─ (tabs)/index.tsx           # Home
│  ├─ (tabs)/explore/index.tsx
│  ├─ (tabs)/explore/[matter].tsx
│  ├─ (tabs)/profile.tsx
│  └─ post/[id].tsx              # open to anyone with a link
├─ src/
│  ├─ components/                # Screen, Text, Button, TapButton, PostCard…
│  ├─ hooks/                     # usePosts, useTap, useProfile, useMatters, useSession
│  ├─ lib/                       # supabase.ts, secureSessionStorage.ts, analytics.ts, queryClient.ts
│  ├─ theme/tokens.ts
│  └─ types/db.ts                # generated from Supabase
├─ supabase/
│  ├─ migrations/                # every database change, as SQL
│  └─ functions/delete-account/
├─ docs/frontend-spec.md         # this document
├─ CLAUDE.md
└─ .env                          # never committed
```

## Data layer

Screens never call Supabase directly. They call small hooks; hooks use one shared Supabase client and TanStack Query for caching, loading states and the instant Tap.

### The Supabase client — `src/lib/supabase.ts`

On phones the session is stored with the phone's secure storage; on the web it uses the browser's storage. Supabase's Expo guide has a ready "large secure store" adapter for sessions bigger than secure storage's per-item limit.

Generate `src/types/db.ts` with `npx supabase gen types typescript --project-id <dev-project-id> > src/types/db.ts` after every database change, so the app knows every table and column.

### One function feeds every list

Instead of stitching posts, counts and "did I tap?" together in the app, one database function (`get_posts`, see `supabase/migrations/0002_get_posts.sql`) returns exactly what a card needs. It runs with the user's own permissions, so the access rules still apply.

Its `order by` is feed ranking v1: your matters first, your area first, soonest events first, then newest. Past events disappear from lists six hours after they start but still open from a shared link.

### Hooks — `src/hooks/`

`usePosts` (Home with no matter, Explore matter list by matter id, detail by post id) uses `useInfiniteQuery` over `get_posts`, 20 at a time. Other hooks follow the same shape: `useSession`, `useProfile`, `useMatters`, `useMyMatters` (+ `useSaveMyMatters`), `useMyTaps`.

### The Tap — instant, honest, reversible — `useTap.ts`

The button changes the moment it's pressed (an optimistic update), then the server confirms. If the server says no, the screen quietly rolls back. The number shown is always replaced by the server's real count afterwards.

### Photos

- Supabase Storage bucket `post-images`, public read, uploads only by you (no public upload policy).
- Get the URL with `supabase.storage.from('post-images').getPublicUrl(path)` and show it with `expo-image` (caches on device, fades in).
- Upload photos already resized to about 1600 px wide.

## Navigation and the sign-in gate

Expo Router turns folders into screens. One gate in the root layout decides where each person lands.

| Route | Screen | Who sees it |
|---|---|---|
| `/(auth)/welcome` | Welcome and sign-in | Signed out |
| `/(onboarding)/matters` | Choose matters | Signed in, no matters yet |
| `/(onboarding)/area` | Your area | Signed in, no area yet |
| `/(tabs)` | Home | Signed in and onboarded |
| `/(tabs)/explore` and `/(tabs)/explore/[matter]` | Explore | Signed in and onboarded |
| `/(tabs)/profile` | Profile | Signed in and onboarded |
| `/post/[id]` | Post detail | Anyone with a link; Tap asks signed-out visitors to sign in |

**The gate — `app/_layout.tsx`**

1. Wrap the app in `QueryClientProvider` and a `SessionProvider` (listens to `supabase.auth.onAuthStateChange`).
2. While the session loads, keep the splash screen up (`expo-splash-screen`).
3. No session → `/(auth)/welcome`. Session but no matters → matters. No area → area. Otherwise → `/(tabs)`.
4. `/post/[id]` is the exception: anyone can open it, so shared WhatsApp links work. Pressing Tap while signed out opens Welcome and returns to the post after sign-in.

**Deep links:** `scheme: "somudai"` in the app config and the web domain for links, so `https://<your-domain>/post/<id>` opens the app if installed, or the website if not.

**Tab bar:** three tabs, icon + label, active tab in `ink`, inactive in `inkSecondary`. No badges.

## Analytics wiring

One typed helper (`src/lib/analytics.ts`) sends a fixed list of events, so no screen can accidentally send personal data.

| Event | Properties |
|---|---|
| `signed_up` | `method: 'google' \| 'email'` |
| `onboarding_done` | `matters_count` |
| `matter_opened` | `matter_id` |
| `post_viewed` | `post_id`, `post_type` |
| `tap` | `post_id`, `post_type`, `source: 'home' \| 'explore' \| 'detail'` |
| `untap` | `post_id`, `post_type` |
| `share` | `post_id` |

**Rules**

- Identify users by their Supabase user id only (`posthog.identify(user.id)`), never email or name.
- Send `post_viewed` when a card is at least half visible for one second, or the detail screen opens. That keeps participation rate (Taps ÷ unique viewers) honest.
- Send `tap` only after the server confirms, not on press.
- Turn off session recording and autocapture of text inputs.

**Dashboard** (one PostHog dashboard): daily and weekly active users · sign-ups per day · views and Taps per post · participation rate per post · shares per post · users returning within 7 and 30 days · app opens by hour and weekday.

## Quality bar

A screen is done only when it handles all four states, works for everyone, and stays smooth on a cheap Android phone.

| State | What it shows |
|---|---|
| Loading | Grey skeleton shapes in the layout of the real content; no spinners on full screens |
| Content | The real thing |
| Empty | One honest sentence + one helpful action (e.g. "Explore matters") |
| Error | "Couldn't load this. Check your connection." + Try again; never a raw error message |

**Accessibility**

- Every button has an `accessibilityLabel` that says the whole thing: "I'm joining Beach Cleanup at Morjim. 1,284 joined."
- Text scales with the phone's font size setting without overlapping (test at the largest size).
- Contrast: `inkSecondary` on `bg` passes WCAG AA for normal text; never put `inkSecondary` on photos.
- Touch targets at least 44 × 44, including chips and Undo.
- Respect "reduce motion": skip the press animation when it's on.

**Performance**

- Use `FlatList` (or FlashList) for lists; never `ScrollView` with `.map()` for posts.
- `expo-image` with fixed aspect ratios, so the list never jumps as photos load.
- Test on a real budget Android phone and on a slow 3G connection (Android developer options can throttle it).
- Keep the first screen interactive within about 2 seconds on that phone.

**Writing**

- Plain, warm, short. "You're joining", not "Participation registered successfully".
- Never use "participated", "attended" or "showed up" unless it comes from a real check-in.
