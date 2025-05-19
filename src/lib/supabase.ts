import 'react-native-url-polyfill/auto';
import { AppState, Platform } from 'react-native';
import { createClient } from '@supabase/supabase-js';
import { secureSessionStorage } from './secureSessionStorage';
import { env } from './env';

// The one Supabase client. Only the URL and anon key ever reach the app;
// access is protected by row-level security in the database.
export const supabase = createClient(env.supabaseUrl, env.supabaseAnonKey, {
  auth: {
    // Phones: secure storage. Web: the browser's default storage.
    storage: Platform.OS === 'web' ? undefined : secureSessionStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: Platform.OS === 'web',
    flowType: 'pkce',
  },
});

// On phones, only refresh the session while the app is in the foreground
// (as Supabase's React Native guide recommends).
if (Platform.OS !== 'web') {
  AppState.addEventListener('change', (state) => {
    if (state === 'active') supabase.auth.startAutoRefresh();
    else supabase.auth.stopAutoRefresh();
  });
}
