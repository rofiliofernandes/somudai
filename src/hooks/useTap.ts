import { useMutation, useQueryClient, type InfiniteData } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { FeedPost } from '../types/db';

type TapVars = { postId: string; tapped: boolean };

/**
 * The Tap: instant, honest, reversible.
 * The button flips immediately (optimistic), the server confirms through
 * tap_post / untap_post, and on failure the screen quietly rolls back. The
 * count shown is always replaced by the server's real count afterwards.
 * The app never writes to `taps` directly and never sends a count.
 */
export function useTap() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ postId, tapped }: TapVars) => {
      const { error } = tapped
        ? await supabase.rpc('untap_post', { p_post: postId })
        : await supabase.rpc('tap_post', { p_post: postId });
      if (error) throw error;
    },
    onMutate: async ({ postId, tapped }) => {
      await qc.cancelQueries({ queryKey: ['posts'] });
      const before = qc.getQueriesData<InfiniteData<FeedPost[]>>({ queryKey: ['posts'] });
      qc.setQueriesData<InfiniteData<FeedPost[]>>({ queryKey: ['posts'] }, (old) =>
        old
          ? {
              ...old,
              pages: old.pages.map((page) =>
                page.map((p) =>
                  p.id === postId
                    ? { ...p, tapped: !tapped, tap_count: Math.max(0, p.tap_count + (tapped ? -1 : 1)) }
                    : p,
                ),
              ),
            }
          : old,
      );
      return { before };
    },
    onError: (_error, _vars, ctx) => {
      ctx?.before.forEach(([key, data]) => qc.setQueryData(key, data));
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['posts'] });
      qc.invalidateQueries({ queryKey: ['my-taps'] });
    },
  });
}
