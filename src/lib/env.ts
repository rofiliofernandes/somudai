// Only EXPO_PUBLIC_ values are read here; they are public by design.
// Expo inlines process.env.EXPO_PUBLIC_* at build time, so each must be
// referenced by its full name (no dynamic lookups).

function required(name: string, value: string | undefined): string {
  if (!value) {
    // Say which variable is missing, never print any values.
    throw new Error(`Missing ${name}. Copy .env.example to .env and fill it in.`);
  }
  return value;
}

export const env = {
  get supabaseUrl() {
    return required('EXPO_PUBLIC_SUPABASE_URL', process.env.EXPO_PUBLIC_SUPABASE_URL);
  },
  get supabaseAnonKey() {
    return required('EXPO_PUBLIC_SUPABASE_ANON_KEY', process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY);
  },
  googleWebClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  googleIosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
  posthogKey: process.env.EXPO_PUBLIC_POSTHOG_KEY,
  posthogHost: process.env.EXPO_PUBLIC_POSTHOG_HOST,
  sentryDsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
};
