import { supabase } from './supabase';

/** Web Google sign-in: Supabase's OAuth redirect, landing back on /auth-callback. */
export async function signInWithGoogle(): Promise<boolean> {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: `${window.location.origin}/auth-callback` },
  });
  if (error) throw error;
  return true; // The browser is navigating away to Google.
}

export async function signOutOfGoogle(): Promise<void> {}
