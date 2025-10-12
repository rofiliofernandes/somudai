import { Pressable, StyleSheet, View } from 'react-native';
import { colors, space } from '../theme/tokens';
import { countLabel } from '../lib/tapWording';
import type { FeedPost } from '../types/db';
import { PostImage } from './PostImage';
import { TapButton } from './TapButton';
import { Text } from './Text';

type Props = {
  post: FeedPost;
  onOpen: (post: FeedPost) => void;
};

/** Compact Explore row: 56 thumbnail, title, count, small TapButton. */
export function PostRow({ post, onOpen }: Props) {
  return (
    <View style={styles.row}>
      <Pressable
        onPress={() => onOpen(post)}
        style={styles.main}
        accessibilityRole="button"
        accessibilityLabel={`${post.title}. Open post.`}
      >
        <PostImage path={post.image_path} size={56} rounded={12} />
        <View style={styles.text}>
          <Text variant="headline" numberOfLines={2}>
            {post.title}
          </Text>
          <Text variant="meta" tone="secondary">
            {countLabel(post.type, post.tap_count)}
          </Text>
        </View>
      </Pressable>
      <TapButton post={post} source="explore" />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingVertical: space.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  main: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: space.md },
  text: { flex: 1, gap: 2 },
});
