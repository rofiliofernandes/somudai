import { GoogleSignin, isCancelledResponse, statusCodes } from '@react-native-google-signin/google-signin';
import { supabase } from './supabase';
import { env } from './env';

let configured = false;

/**
 * Native Google sign-in (Android/iOS): the Google library returns an ID token,
 * which Supabase verifies. Returns false if the person cancelled.
 */
export async function signInWithGoogle(): Promise<boolean> {
  if (!configured) {
    GoogleSignin.configure({
      webClientId: env.googleWebClientId,
      iosClientId: env.googleIosClientId,
    });
    configured = true;
  }
  try {
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    const response = await GoogleSignin.signIn();
    if (isCancelledResponse(response)) return false;
    const idToken = response.data.idToken;
    if (!idToken) throw new Error('Google did not return an ID token');
    const { error } = await supabase.auth.signInWithIdToken({ provider: 'google', token: idToken });
    if (error) throw error;
    return true;
  } catch (e) {
    const code = (e as { code?: string }).code;
    if (code === statusCodes.SIGN_IN_CANCELLED || code === statusCodes.IN_PROGRESS) return false;
    throw e;
  }
}

/** Forget the Google account on this phone too, so the next sign-in can pick another. */
export async function signOutOfGoogle(): Promise<void> {
  if (!configured) return;
  await GoogleSignin.signOut().catch(() => {});
}
