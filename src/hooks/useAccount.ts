import { useMutation } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { signOutOfGoogle } from '../lib/googleSignIn';
import { resetAnalytics } from '../lib/analytics';

export async function signOut() {
  await signOutOfGoogle();
  resetAnalytics();
  await supabase.auth.signOut();
}

/**
 * Delete my account: the delete-account Edge Function checks my sign-in token
 * and deletes me; the database then removes my profile, matters and every Tap.
 */
export function useDeleteAccount() {
  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase.functions.invoke('delete-account', { method: 'POST' });
      if (error) throw error;
      // The user no longer exists; clear the local session too.
      await signOutOfGoogle();
      resetAnalytics();
      await supabase.auth.signOut({ scope: 'local' });
    },
  });
}
