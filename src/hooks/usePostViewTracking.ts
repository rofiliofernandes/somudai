import { useState } from 'react';
import type { ListViewToken } from 'react-native';
import { track } from '../lib/analytics';
import type { FeedPost } from '../types/db';

// post_viewed fires when a card is at least half visible for one second
// (once per post per app session), which keeps participation rate honest.
const seen = new Set<string>();

export function markPostViewed(post: Pick<FeedPost, 'id' | 'type'>) {
  if (seen.has(post.id)) return;
  seen.add(post.id);
  track('post_viewed', { post_id: post.id, post_type: post.type });
}

/** Spread onto a FlatList of posts. */
export function usePostViewTracking() {
  // FlatList needs these to stay the same object for its whole life.
  const [props] = useState(() => ({
    viewabilityConfig: { itemVisiblePercentThreshold: 50, minimumViewTime: 1000 },
    onViewableItemsChanged: ({ viewableItems }: { viewableItems: ListViewToken[] }) => {
      for (const v of viewableItems) {
        if (v.isViewable && v.item) markPostViewed(v.item as FeedPost);
      }
    },
  }));
  return props;
}
