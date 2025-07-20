import { useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { FeedPost } from '../types/db';

export const PAGE_SIZE = 20;

export type PostsQuery = { matterId?: number; postId?: string };

export const postsKey = (opts: PostsQuery) => ['posts', opts] as const;

/** Home (no options), Explore matter list (matterId) and post detail (postId). */
export function usePosts(opts: PostsQuery = {}) {
  return useInfiniteQuery({
    queryKey: postsKey(opts),
    initialPageParam: 0,
    queryFn: async ({ pageParam }): Promise<FeedPost[]> => {
      const { data, error } = await supabase.rpc('get_posts', {
        p_matter: opts.matterId,
        p_post: opts.postId,
        p_limit: PAGE_SIZE,
        p_offset: pageParam,
      });
      if (error) throw error;
      return data ?? [];
    },
    getNextPageParam: (last, all) => (last.length === PAGE_SIZE ? all.length * PAGE_SIZE : undefined),
  });
}

/** One post, for the detail screen. */
export function usePost(postId: string) {
  const query = usePosts({ postId });
  return { ...query, post: query.data?.pages[0]?.[0] };
}
