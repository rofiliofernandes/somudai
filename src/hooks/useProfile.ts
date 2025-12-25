import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { Profile } from '../types/db';
import { useSession } from './useSession';

export const profileKey = (userId: string | undefined) => ['profile', userId] as const;

/** The signed-in person's own profile (RLS only allows reading your own). */
export function useProfile() {
  const { user } = useSession();
  return useQuery({
    queryKey: profileKey(user?.id),
    enabled: !!user,
    queryFn: async (): Promise<Profile | null> => {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', user!.id).maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

type ProfileEdit = Partial<Pick<Profile, 'display_name' | 'bio' | 'area'>>;

export function useUpdateProfile() {
  const { user } = useSession();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (edit: ProfileEdit) => {
      if (!user) throw new Error('Not signed in');
      const { error } = await supabase.from('profiles').update(edit).eq('id', user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: profileKey(user?.id) });
      // Area changes the feed order.
      qc.invalidateQueries({ queryKey: ['posts'] });
    },
  });
}
