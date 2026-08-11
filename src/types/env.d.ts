/// <reference types="expo/types" />

// Public env vars, inlined by Expo at build time. Never add secrets here.
declare namespace NodeJS {
  interface ProcessEnv {
    EXPO_PUBLIC_SUPABASE_URL?: string;
    EXPO_PUBLIC_SUPABASE_ANON_KEY?: string;
    EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID?: string;
    EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID?: string;
    EXPO_PUBLIC_GOOGLE_IOS_URL_SCHEME?: string;
    EXPO_PUBLIC_POSTHOG_KEY?: string;
    EXPO_PUBLIC_POSTHOG_HOST?: string;
    EXPO_PUBLIC_SENTRY_DSN?: string;
    EXPO_PUBLIC_APP_ENV?: "development" | "preview" | "production";
  }
}
