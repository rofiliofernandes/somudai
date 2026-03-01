import PostHog from 'posthog-react-native';
import { env } from './env';

// One typed helper sends a fixed list of events, so no screen can send
// personal data. Events carry only ids and types: never names, emails,
// phone numbers or locations (CLAUDE.md).

type PostTypeProp = 'action' | 'stance';

export type Events = {
  signed_up: { method: 'google' | 'email' };
  onboarding_done: { matters_count: number };
  matter_opened: { matter_id: number };
  post_viewed: { post_id: string; post_type: PostTypeProp };
  tap: { post_id: string; post_type: PostTypeProp; source: 'home' | 'explore' | 'detail' };
  untap: { post_id: string; post_type: PostTypeProp };
  share: { post_id: string };
};

// No key (e.g. in tests or local dev without PostHog): analytics is a no-op.
export const posthog = env.posthogKey
  ? new PostHog(env.posthogKey, {
      host: env.posthogHost,
      captureAppLifecycleEvents: true, // app opened / backgrounded
      enableSessionReplay: false, // never record screens
      personProfiles: 'identified_only',
    })
  : null;

export function track<E extends keyof Events>(event: E, props: Events[E]) {
  posthog?.capture(event, props);
}

/** Identify by Supabase user id only, never email or name. */
export function identify(userId: string) {
  posthog?.identify(userId);
}

export function resetAnalytics() {
  posthog?.reset();
}
