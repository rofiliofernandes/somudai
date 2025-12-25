import { Platform } from 'react-native';
import * as Linking from 'expo-linking';
import { supabase } from './supabase';

/** somudai://auth-callback on phones (exp://… in Expo Go), /auth-callback on web. */
export function authCallbackUrl(): string {
  if (Platform.OS === 'web') return `${window.location.origin}/auth-callback`;
  return Linking.createURL('auth-callback');
}

export const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

/** Send a magic link. Supabase's rate limits and CAPTCHA apply on the server. */
export async function sendMagicLink(email: string): Promise<void> {
  const { error } = await supabase.auth.signInWithOtp({
    email: email.trim().toLowerCase(),
    options: { emailRedirectTo: authCallbackUrl(), shouldCreateUser: true },
  });
  if (error) throw error;
}

/**
 * Finish sign-in from the link. With PKCE the link carries ?code=…; on the web
 * supabase-js exchanges it automatically, on phones we do it here.
 */
export async function completeSignInFromUrl(url: string): Promise<void> {
  const { queryParams } = Linking.parse(url);
  const code = typeof queryParams?.code === 'string' ? queryParams.code : null;
  const errorDescription = queryParams?.error_description;
  if (errorDescription) throw new Error(String(errorDescription));
  if (!code) return;
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) throw error;
}
