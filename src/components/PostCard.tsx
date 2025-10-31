import { Pressable, StyleSheet, View } from 'react-native';
import { aspect, colors, radius, space } from '../theme/tokens';
import { metaLine } from '../lib/format';
import { countLabel } from '../lib/tapWording';
import type { FeedPost } from '../types/db';
import { PostImage } from './PostImage';
import { TapButton, type TapSource } from './TapButton';
import { Text } from './Text';

type Props = {
  post: FeedPost;
  onOpen: (post: FeedPost) => void;
  source?: TapSource;
};

/** Photo → meta → title → two lines of summary → divider → count and TapButton. */
export function PostCard({ post, onOpen, source = 'home' }: Props) {
  return (
    <View style={styles.card}>
      <Pressable
        onPress={() => onOpen(post)}
        accessibilityRole="button"
        accessibilityLabel={`${post.title}. ${metaLine(post)}. Open post.`}
      >
        <PostImage path={post.image_path} aspectRatio={aspect.card} />
        <View style={styles.body}>
          <Text variant="meta" tone="secondary" numberOfLines={1}>
            {metaLine(post)}
          </Text>
          <Text variant="headline" numberOfLines={2}>
            {post.title}
          </Text>
          <Text variant="body" tone="secondary" numberOfLines={2}>
            {post.summary}
          </Text>
        </View>
      </Pressable>
      <View style={styles.divider} />
      <View style={styles.footer}>
        <Text variant="meta" tone="secondary" style={styles.count}>
          {countLabel(post.type, post.tap_count)}
        </Text>
        <TapButton post={post} source={source} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  body: { paddingHorizontal: space.lg, paddingTop: space.md, paddingBottom: space.md, gap: space.xs },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginHorizontal: space.lg },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
    gap: space.md,
  },
  count: { flexShrink: 1 },
});
