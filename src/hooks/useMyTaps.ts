import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { PostType } from '../types/db';
import { useSession } from './useSession';

export type MyTap = {
  post_id: string;
  created_at: string;
  post: { id: string; title: string; type: PostType; starts_at: string | null; image_path: string | null } | null;
};

/** What I joined and stand with. Only I can read these rows (RLS). */
export function useMyTaps() {
  const { user } = useSession();
  return useQuery({
    queryKey: ['my-taps', user?.id],
    enabled: !!user,
    queryFn: async (): Promise<MyTap[]> => {
      const { data, error } = await supabase
        .from('taps')
        .select('post_id, created_at, post:posts(id, title, type, starts_at, image_path)')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as MyTap[];
    },
  });
}
