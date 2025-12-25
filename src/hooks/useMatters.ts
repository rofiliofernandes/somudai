import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { Matter } from '../types/db';
import { useSession } from './useSession';

/** All matters (public). */
export function useMatters() {
  return useQuery({
    queryKey: ['matters'],
    staleTime: 60 * 60 * 1000,
    queryFn: async (): Promise<Matter[]> => {
      const { data, error } = await supabase.from('matters').select('*').order('id');
      if (error) throw error;
      return data ?? [];
    },
  });
}

export const myMattersKey = (userId: string | undefined) => ['my-matters', userId] as const;

/** Ids of the matters the signed-in person chose. */
export function useMyMatters() {
  const { user } = useSession();
  return useQuery({
    queryKey: myMattersKey(user?.id),
    enabled: !!user,
    queryFn: async (): Promise<number[]> => {
      const { data, error } = await supabase.from('profile_matters').select('matter_id').eq('profile_id', user!.id);
      if (error) throw error;
      return (data ?? []).map((r) => r.matter_id);
    },
  });
}

/** Replace the person's matters: delete old rows, insert new ones. */
export function useSaveMyMatters() {
  const { user } = useSession();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (matterIds: number[]) => {
      if (!user) throw new Error('Not signed in');
      if (matterIds.length === 0) throw new Error('Pick at least one matter');
      const { error: delError } = await supabase.from('profile_matters').delete().eq('profile_id', user.id);
      if (delError) throw delError;
      const { error } = await supabase
        .from('profile_matters')
        .insert(matterIds.map((matter_id) => ({ profile_id: user.id, matter_id })));
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: myMattersKey(user?.id) });
      qc.invalidateQueries({ queryKey: ['posts'] });
    },
  });
}
